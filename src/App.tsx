import React, { useState, useEffect } from 'react';
import {
  TabAktif,
  UserProfile,
  TetapanSekolah,
  JadualBertugas,
  LaporanHarian,
  LaporanMingguan
} from './types';
import {
  toISODate,
  getMonday
} from './lib/dateUtils';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredTetapan,
  saveStoredTetapan,
  getStoredJadual,
  saveStoredJadual,
  getStoredLaporanHarian,
  saveStoredLaporanHarian,
  getStoredLaporanMingguan,
  saveStoredLaporanMingguan,
  getActiveUser,
  saveActiveUser,
  logoutUser,
  resetAllToDefault,
  exportBackupJSON,
  importBackupJSON
} from './lib/storage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { JadualView } from './components/JadualView';
import { AgihanTugasView } from './components/AgihanTugasView';
import { LaporanHarianView } from './components/LaporanHarianView';
import { LaporanMingguanView } from './components/LaporanMingguanView';
import { TetapanView } from './components/TetapanView';
import { AuthModal } from './components/AuthModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const today = toISODate();
  const thisMonday = getMonday(today);

  // Core App States
  const [tab, setTab] = useState<TabAktif>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<string>(thisMonday);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [tetapan, setTetapan] = useState<TetapanSekolah | null>(null);
  const [jadual, setJadual] = useState<JadualBertugas[]>([]);
  const [laporanHarian, setLaporanHarian] = useState<Record<string, LaporanHarian>>({});
  const [laporanMingguan, setLaporanMingguan] = useState<Record<string, LaporanMingguan>>({});

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initial load
  useEffect(() => {
    const loadedUsers = getStoredUsers();
    const loadedTetapan = getStoredTetapan();
    const loadedJadual = getStoredJadual();
    const loadedHarian = getStoredLaporanHarian();
    const loadedMingguan = getStoredLaporanMingguan();
    const active = getActiveUser();

    setUsers(loadedUsers);
    setTetapan(loadedTetapan);
    setJadual(loadedJadual);
    setLaporanHarian(loadedHarian);
    setLaporanMingguan(loadedMingguan);
    setCurrentUser(active);
  }, []);

  // Update handlers with persistent sync
  const handleSelectUser = (u: UserProfile) => {
    setCurrentUser(u);
    saveActiveUser(u);
    showToast(`Beralih ke akaun: ${u.nama} (${u.jawatan})`);
  };

  const handleLoginSuccess = (u: UserProfile) => {
    setCurrentUser(u);
    saveActiveUser(u);
    setShowAuthModal(false);
  };

  const handleRegisterUser = (newUser: UserProfile) => {
    const updated = [...users, newUser];
    setUsers(updated);
    saveStoredUsers(updated);
    setCurrentUser(newUser);
    saveActiveUser(newUser);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setShowAuthModal(true);
    showToast('Anda telah log keluar daripada sistem.');
  };

  const handleSaveUsers = (updated: UserProfile[]) => {
    setUsers(updated);
    saveStoredUsers(updated);
  };

  const handleSaveTetapan = (updated: TetapanSekolah) => {
    setTetapan(updated);
    saveStoredTetapan(updated);
  };

  const handleSaveJadual = (updated: JadualBertugas[]) => {
    setJadual(updated);
    saveStoredJadual(updated);
  };

  const handleSaveLaporanHarian = (tarikh: string, report: LaporanHarian) => {
    const updated = {
      ...laporanHarian,
      [tarikh]: report
    };
    setLaporanHarian(updated);
    saveStoredLaporanHarian(updated);
  };

  const handleSaveLaporanMingguan = (mula: string, report: LaporanMingguan) => {
    const updated = {
      ...laporanMingguan,
      [mula]: report
    };
    setLaporanMingguan(updated);
    saveStoredLaporanMingguan(updated);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sandaran_Sistem_Guru_Bertugas_${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Fail sandaran JSON dimuat turun.');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const success = importBackupJSON(text);
      if (success) {
        setUsers(getStoredUsers());
        setTetapan(getStoredTetapan());
        setJadual(getStoredJadual());
        setLaporanHarian(getStoredLaporanHarian());
        setLaporanMingguan(getStoredLaporanMingguan());
        setCurrentUser(getActiveUser());
        showToast('Sandaran data berjaya dipulihkan!');
      } else {
        showToast('Ralat: Format fail sandaran JSON tidak sah.');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca fail sandaran.');
    }
  };

  const handleResetDemo = () => {
    if (
      window.confirm(
        'Adakah anda pasti mahu menetapkan semula sistem kepada data contoh asal SMK Salaping, Kota Marudu?'
      )
    ) {
      resetAllToDefault();
      setUsers(getStoredUsers());
      setTetapan(getStoredTetapan());
      setJadual(getStoredJadual());
      setLaporanHarian(getStoredLaporanHarian());
      setLaporanMingguan(getStoredLaporanMingguan());
      setCurrentUser(getActiveUser());
      showToast('Data contoh berjaya ditetapkan semula.');
    }
  };

  if (!tetapan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 text-stone-600">
        <p className="text-sm font-semibold">Memuatkan Sistem Guru Bertugas...</p>
      </div>
    );
  }

  // If user is not logged in, show mandatory login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          isMandatory={true}
          users={users}
          tetapan={tetapan}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={handleRegisterUser}
          onToast={showToast}
        />
      </div>
    );
  }

  const isAdmin = currentUser.peranan === 'pentadbir';

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        tab={tab}
        setTab={setTab}
        tetapan={tetapan}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        onQuickPrint={() => window.print()}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 'dashboard' && (
          <DashboardView
            tetapan={tetapan}
            currentUser={currentUser}
            jadual={jadual}
            laporanHarian={laporanHarian}
            setTab={setTab}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedWeekMonday(getMonday(d));
            }}
          />
        )}

        {tab === 'jadual' && (
          <JadualView
            jadual={jadual}
            onSaveJadual={handleSaveJadual}
            users={users}
            isAdmin={isAdmin}
            onToast={showToast}
            onNavigateToAgihan={() => setTab('agihan')}
          />
        )}

        {tab === 'agihan' && (
          <AgihanTugasView
            users={users}
            onSaveUsers={handleSaveUsers}
            jadual={jadual}
            onSaveJadual={handleSaveJadual}
            tetapan={tetapan}
            onToast={showToast}
            onNavigateToJadual={() => setTab('jadual')}
          />
        )}

        {tab === 'harian' && (
          <LaporanHarianView
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedWeekMonday(getMonday(d));
            }}
            laporanHarian={laporanHarian}
            onSaveLaporan={handleSaveLaporanHarian}
            jadual={jadual}
            currentUser={currentUser}
            tetapan={tetapan}
            onToast={showToast}
          />
        )}

        {tab === 'mingguan' && (
          <LaporanMingguanView
            selectedWeekMonday={selectedWeekMonday}
            onSelectWeekMonday={setSelectedWeekMonday}
            laporanHarian={laporanHarian}
            laporanMingguan={laporanMingguan}
            onSaveLaporanMingguan={handleSaveLaporanMingguan}
            jadual={jadual}
            tetapan={tetapan}
            currentUser={currentUser}
            onToast={showToast}
          />
        )}

        {tab === 'tetapan' && (
          <TetapanView
            tetapan={tetapan}
            onSaveTetapan={handleSaveTetapan}
            users={users}
            onSaveUsers={handleSaveUsers}
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
            jadual={jadual}
            onSaveJadual={handleSaveJadual}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetDemo={handleResetDemo}
            onToast={showToast}
          />
        )}
      </main>

      {/* Footer (No print) */}
      <footer className="no-print mt-auto border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {tetapan.sekolah} &bull; Sistem Pengurusan &amp; Buku Laporan Guru Bertugas Harian/Mingguan
          </p>
          <p className="text-[11px] text-stone-400">
            Kementerian Pendidikan Malaysia (KPM) &bull; Format Buku Laporan Rasmi
          </p>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 border border-stone-700 animate-fade-in max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal for Log In / Sign Up */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          users={users}
          tetapan={tetapan}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={handleRegisterUser}
          onToast={showToast}
          isMandatory={false}
        />
      )}
    </div>
  );
}
