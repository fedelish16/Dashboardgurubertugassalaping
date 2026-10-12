import React from 'react';
import {
  School,
  Calendar,
  FileText,
  FileCheck2,
  Settings,
  LayoutDashboard,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Printer,
  Wand2,
  LogIn,
  LogOut,
  UserPlus
} from 'lucide-react';
import { TabAktif, UserProfile, TetapanSekolah } from '../types';
import { SmkSalapingLogo } from './SmkSalapingLogo';

interface HeaderProps {
  tab: TabAktif;
  setTab: (tab: TabAktif) => void;
  tetapan: TetapanSekolah;
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onQuickPrint?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tab,
  setTab,
  tetapan,
  currentUser,
  users,
  onSelectUser,
  onQuickPrint,
  onOpenAuth,
  onLogout
}) => {
  const isAdmin = currentUser.peranan === 'pentadbir';

  return (
    <header className="no-print bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Top Royal Accent Line (Maroon + Kuning + Maroon) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-maroon-950 via-kuning-400 to-maroon-950" />

      {/* Top Bar: School Identity & User Context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <SmkSalapingLogo className="w-11 h-11" alt="Logo Rasmi SMK Salaping" logoUrl={tetapan.logo_url} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-tight">
                  {tetapan.sekolah || 'Sistem Guru Bertugas'}
                </h1>
                {tetapan.kod_sekolah && (
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-kuning-50 text-kuning-900 border border-kuning-300">
                    {tetapan.kod_sekolah}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Sistem Pengurusan Laporan & Jadual Guru Bertugas Harian/Mingguan &bull; Sesi {tetapan.sesi}
              </p>
            </div>
          </div>

          {/* User selector & Quick Switch */}
          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
            {onQuickPrint && (
              <button
                type="button"
                onClick={onQuickPrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer"
                title="Cetak Halaman Semasa"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
            )}

            <div className="relative group">
              <label htmlFor="user-switch-select" className="sr-only">Tukar Pengguna</label>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50/80 hover:bg-stone-100 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-kuning-500 ring-2 ring-kuning-200' : 'bg-maroon-700 ring-2 ring-maroon-200'}`} />
                <div className="text-left text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                    {isAdmin ? 'Akses Pentadbir' : 'Akses Guru'}
                  </span>
                  <span className="font-semibold text-stone-800 line-clamp-1 max-w-[120px] sm:max-w-[170px]">
                    {currentUser.nama}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-1" />
                <select
                  id="user-switch-select"
                  aria-label="Tukar Pengguna Aktif"
                  value={currentUser.id}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u) onSelectUser(u);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                >
                  <optgroup label="Pentadbir / Pengesah (Guru Besar / PK)">
                    {users
                      .filter((u) => u.peranan === 'pentadbir')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama} ({u.jawatan})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Guru Bertugas">
                    {users
                      .filter((u) => u.peranan === 'guru')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama} ({u.jawatan})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Log Masuk / Tukar Akaun DELIMA Button */}
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-maroon-900 bg-kuning-100 hover:bg-kuning-200 border border-kuning-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Buka Portal Log Masuk & Daftar Guru DELIMa"
              >
                <LogIn className="w-3.5 h-3.5 text-maroon-800" />
                <span className="hidden sm:inline">Akses DELIMa</span>
              </button>
            )}

            {/* Log Keluar Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Log Keluar daripada Sistem"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Log Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          <button
            onClick={() => setTab('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'dashboard'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Papan Utama</span>
          </button>

          <button
            onClick={() => setTab('jadual')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'jadual'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadual Bertugas</span>
          </button>

          <button
            onClick={() => setTab('agihan')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'agihan'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <Wand2 className="w-4 h-4 text-kuning-400" />
            <span>Agihan Tugas</span>
          </button>

          <button
            onClick={() => setTab('harian')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'harian'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Harian</span>
          </button>

          <button
            onClick={() => setTab('mingguan')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'mingguan'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Laporan Mingguan & Cetak</span>
          </button>

          <button
            onClick={() => setTab('tetapan')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              tab === 'tetapan'
                ? 'bg-maroon-800 text-white shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-maroon-900 hover:bg-maroon-50/70'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Tetapan &amp; Pengguna</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
