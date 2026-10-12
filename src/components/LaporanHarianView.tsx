import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Printer,
  Calendar,
  Users,
  Check,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  LaporanHarian,
  JadualBertugas,
  UserProfile,
  TetapanSekolah,
  DomainPemerhatianKey,
  StatusPemerhatian
} from '../types';
import {
  toISODate,
  getMonday,
  formatMalayDate,
  formatDDMMYYYY,
  addDays
} from '../lib/dateUtils';
import { DOMAIN_PEMERHATIAN, STATUS_OPTIONS } from '../lib/storage';

interface LaporanHarianViewProps {
  selectedDate: string;
  onSelectDate: (d: string) => void;
  laporanHarian: Record<string, LaporanHarian>;
  onSaveLaporan: (tarikh: string, report: LaporanHarian) => void;
  jadual: JadualBertugas[];
  currentUser: UserProfile;
  tetapan: TetapanSekolah;
  onToast: (msg: string) => void;
}

export const LaporanHarianView: React.FC<LaporanHarianViewProps> = ({
  selectedDate,
  onSelectDate,
  laporanHarian,
  onSaveLaporan,
  jadual,
  currentUser,
  tetapan,
  onToast
}) => {
  const isAdmin = currentUser.peranan === 'pentadbir';
  const currentMonday = getMonday(selectedDate);
  const weekTeachers = jadual.filter((j) => getMonday(j.mula) === currentMonday);

  // Existing report or empty skeleton
  const existing = laporanHarian[selectedDate];

  const [pelapor, setPelapor] = useState('');
  const [jumlah, setJumlah] = useState<number | ''>(840);
  const [hadir, setHadir] = useState<number | ''>(815);
  const [lewat, setLewat] = useState<number | ''>(0);
  const [ponteng, setPonteng] = useState<number | ''>(0);

  const [pem, setPem] = useState<Record<DomainPemerhatianKey, { s: StatusPemerhatian; n: string }>>({
    perhimpunan: { s: 'Baik', n: '' },
    rehat: { s: 'Baik', n: '' },
    pulang: { s: 'Baik', n: '' },
    bersih: { s: 'Baik', n: '' },
    selamat: { s: 'Baik', n: '' }
  });

  const [insiden, setInsiden] = useState('');
  const [cadangan, setCadangan] = useState('');
  const [komenPentadbir, setKomenPentadbir] = useState('');
  const [status, setStatus] = useState<'Draf' | 'Dihantar' | 'Disahkan'>('Draf');

  // Load state when selectedDate changes
  useEffect(() => {
    if (existing) {
      setPelapor(existing.pelapor || currentUser.nama);
      setJumlah(existing.jumlah || 840);
      setHadir(existing.hadir || 0);
      setLewat(existing.lewat || 0);
      setPonteng(existing.ponteng || 0);
      setPem(
        existing.pem || {
          perhimpunan: { s: 'Baik', n: '' },
          rehat: { s: 'Baik', n: '' },
          pulang: { s: 'Baik', n: '' },
          bersih: { s: 'Baik', n: '' },
          selamat: { s: 'Baik', n: '' }
        }
      );
      setInsiden(existing.insiden || '');
      setCadangan(existing.cadangan || '');
      setKomenPentadbir(existing.komen_pentadbir || '');
      setStatus(existing.status || 'Draf');
    } else {
      // New report default
      setPelapor(weekTeachers[0]?.nama || currentUser.nama);
      setJumlah(840);
      setHadir(820);
      setLewat(0);
      setPonteng(0);
      setPem({
        perhimpunan: { s: 'Baik', n: 'Murid berbaris dengan tertib dan mematuhi arahan pengawas.' },
        rehat: { s: 'Baik', n: 'Kantin terkawal, murid beratur mengikut kaunter yang disediakan.' },
        pulang: { s: 'Baik', n: 'Pergerakan keluar terkawal bersama pengawal lalu lintas.' },
        bersih: { s: 'Baik', n: 'Kawasan sekolah bersih, tong sampah tidak melimpah.' },
        selamat: { s: 'Baik', n: 'Pintu pagar berkunci dan tiada pencerobohan dikesan.' }
      });
      setInsiden('');
      setCadangan('');
      setKomenPentadbir('');
      setStatus('Draf');
    }
  }, [selectedDate, existing]);

  // Attendance calculations
  const numJumlah = typeof jumlah === 'number' ? jumlah : 0;
  const numHadir = typeof hadir === 'number' ? hadir : 0;
  const pct = numJumlah > 0 ? ((numHadir / numJumlah) * 100).toFixed(1) : '—';
  const pctNum = numJumlah > 0 ? (numHadir / numJumlah) * 100 : 0;

  // Handle Save
  const handleSave = (targetStatus: 'Draf' | 'Dihantar' | 'Disahkan') => {
    if (numHadir > numJumlah) {
      onToast('Amaran: Bilangan hadir tidak boleh melebihi jumlah murid berdaftar!');
      return;
    }

    if (targetStatus !== 'Draf' && !pelapor.trim()) {
      onToast('Sila masukkan nama guru pelapor bertugas.');
      return;
    }

    const payload: LaporanHarian = {
      tarikh: selectedDate,
      user_id: currentUser.id,
      pelapor: pelapor.trim(),
      jumlah: numJumlah,
      hadir: numHadir,
      lewat: typeof lewat === 'number' ? lewat : 0,
      ponteng: typeof ponteng === 'number' ? ponteng : 0,
      pem,
      insiden: insiden.trim(),
      cadangan: cadangan.trim(),
      komen_pentadbir: komenPentadbir.trim(),
      status: targetStatus,
      disahkan_oleh:
        targetStatus === 'Disahkan'
          ? `${currentUser.nama} (${currentUser.jawatan || 'Pentadbir'})`
          : existing?.disahkan_oleh,
      tarikh_sah: targetStatus === 'Disahkan' ? toISODate() : existing?.tarikh_sah,
      updated_at: new Date().toISOString()
    };

    onSaveLaporan(selectedDate, payload);
    setStatus(targetStatus);

    if (targetStatus === 'Disahkan') {
      onToast('Laporan harian berjaya disahkan oleh Pentadbir!');
    } else if (targetStatus === 'Dihantar') {
      onToast('Laporan harian berjaya dihantar untuk semakan pentadbiran.');
    } else {
      onToast('Draf laporan disimpan.');
    }
  };

  const handlePrintDaily = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation & Status Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, -1))}
              className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-200 transition-colors cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              aria-label="Pilih Tarikh Laporan"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="text-xs sm:text-sm font-bold text-stone-800 bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, 1))}
              className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-200 transition-colors cursor-pointer"
              title="Hari Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectDate(toISODate())}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
          >
            Hari Ini
          </button>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              {formatMalayDate(selectedDate)}
            </h3>
            <p className="text-xs text-stone-500">
              Laporan Rasmi Guru Bertugas Harian
            </p>
          </div>
        </div>

        {/* Status pill & Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">Status:</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                status === 'Disahkan'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : status === 'Dihantar'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              {status === 'Disahkan' && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
              {status}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePrintDaily}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Cetak Laporan Harian Ini"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </div>
      </div>

      {/* Week Duty Teachers Bar */}
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <Users className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="text-xs font-bold text-emerald-900 block sm:inline mr-2">
              Guru Bertugas Minggu Ini ({formatDDMMYYYY(currentMonday)}):
            </span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {weekTeachers.length > 0 ? (
                weekTeachers.map((g, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPelapor(g.nama)}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      pelapor === g.nama
                        ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title="Klik untuk jadikan pelapor hari ini"
                  >
                    <span className="truncate">{g.nama}</span>
                    {g.sidang && (
                      <span
                        className={`text-[9px] font-extrabold px-1 rounded uppercase ${
                          pelapor === g.nama
                            ? 'bg-emerald-950 text-emerald-200'
                            : g.sidang === 'pagi'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {g.sidang}
                      </span>
                    )}
                    {pelapor === g.nama && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                ))
              ) : (
                <span className="text-xs text-stone-500 italic">
                  Belum ditetapkan dalam jadual bertugas.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-700 whitespace-nowrap">
            Nama Pelapor:
          </label>
          <input
            type="text"
            list="reporter-list"
            value={pelapor}
            onChange={(e) => setPelapor(e.target.value)}
            placeholder="Nama guru yang mengisi"
            className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 min-w-[200px]"
          />
          <datalist id="reporter-list">
            {weekTeachers.map((w, idx) => (
              <option key={idx} value={w.nama} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Kehadiran Pelajar Card */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <span>Kehadiran &amp; Disiplin Pelajar</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">Peratus:</span>
            <span
              className={`text-sm sm:text-base font-extrabold px-2.5 py-0.5 rounded-md ${
                pctNum >= 95
                  ? 'bg-emerald-100 text-emerald-800'
                  : pctNum >= 90
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {pct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Enrolmen (Jumlah Murid)
            </label>
            <input
              type="number"
              min="0"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Bilangan Hadir
            </label>
            <input
              type="number"
              min="0"
              max={numJumlah}
              value={hadir}
              onChange={(e) => setHadir(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Murid Hadir Lewat
            </label>
            <input
              type="number"
              min="0"
              value={lewat}
              onChange={(e) => setLewat(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-amber-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ponteng / Tanpa Sebab
            </label>
            <input
              type="number"
              min="0"
              value={ponteng}
              onChange={(e) => setPonteng(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-sm font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-rose-900"
            />
          </div>
        </div>

        {/* Visual percentage bar */}
        <div className="space-y-1">
          <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                pctNum >= 95 ? 'bg-emerald-600' : pctNum >= 90 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, pctNum))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-stone-400">
            <span>0%</span>
            <span>Sasaran KPM: 95%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 5 Domain Pemerhatian Rasmi */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="font-bold text-stone-900 text-sm sm:text-base">
            Aspek Pemerhatian &amp; Pemantauan Kawasan Sekolah
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Tandakan status penilaian bagi setiap aspek dan berikan catatan spesifik jika perlu tindakan lanjut.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-stone-100">
          {DOMAIN_PEMERHATIAN.map((domain, i) => {
            const currentItem = pem[domain.key] || { s: 'Baik', n: '' };

            return (
              <div key={domain.key} className={`pt-3.5 ${i === 0 ? 'pt-0' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Domain Info */}
                  <div className="md:w-1/3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                        {domain.title}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 pl-7 leading-relaxed">
                      {domain.desc}
                    </p>
                  </div>

                  {/* Rating Selector */}
                  <div className="md:w-1/4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                      Penilaian
                    </label>
                    <select
                      aria-label={`Penilaian untuk ${domain.title}`}
                      value={currentItem.s}
                      onChange={(e) => {
                        const newS = e.target.value as StatusPemerhatian;
                        setPem({
                          ...pem,
                          [domain.key]: { ...currentItem, s: newS }
                        });
                      }}
                      className={`w-full text-xs font-bold px-3 py-2 rounded-lg border focus:outline-none transition-colors ${
                        currentItem.s === 'Cemerlang'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : currentItem.s === 'Baik'
                          ? 'bg-blue-50 text-blue-900 border-blue-300'
                          : currentItem.s === 'Sederhana'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                      }`}
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Catatan specific */}
                  <div className="md:w-5/12">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">
                      Catatan / Situasi Terperinci
                    </label>
                    <input
                      type="text"
                      value={currentItem.n}
                      onChange={(e) => {
                        setPem({
                          ...pem,
                          [domain.key]: { ...currentItem, n: e.target.value }
                        });
                      }}
                      placeholder={`Catatan untuk ${domain.title.toLowerCase()}...`}
                      className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incidents & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incidents */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
            Laporan Insiden &amp; Tindakan Diambil
          </label>
          <p className="text-xs text-stone-500">
            Catatkan kemalangan, murid sakit ke bilik isolasi/kesihatan, kerosakan fizikal, atau salah laku disiplin beserta tindakan rawatan/tindakan guru.
          </p>
          <textarea
            value={insiden}
            onChange={(e) => setInsiden(e.target.value)}
            rows={4}
            placeholder="Contoh: Murid tahun 4 tergelincir di gelanggang waktu rehat. Diberi rawatan iodin dan pembalut di bilik kesihatan. Keadaan terkawal."
            className="w-full text-xs px-3 py-2.5 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Recommendations */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wide">
            Cadangan / Tindakan Susulan
          </label>
          <p className="text-xs text-stone-500">
            Cadangan kepada pihak pentadbir, kaunselor, pekerja pembersihan atau guru bertugas esok.
          </p>
          <textarea
            value={cadangan}
            onChange={(e) => setCadangan(e.target.value)}
            rows={4}
            placeholder="Contoh: Mohon pekerja swasta periksa paip tandas lelaki blok B. Cadangan mengadakan pemeriksaan mengejut kekemasan rambut murid tahap 2."
            className="w-full text-xs px-3 py-2.5 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Admin Review & Signature Section */}
      <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Ruangan Ulasan &amp; Pengesahan Pentadbir
            </h3>
          </div>
          {existing?.disahkan_oleh && (
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              Disahkan oleh {existing.disahkan_oleh}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Ulasan / Catatan Pentadbir (Guru Besar / Penolong Kanan)
          </label>
          <textarea
            value={komenPentadbir}
            onChange={(e) => setKomenPentadbir(e.target.value)}
            disabled={!isAdmin && status === 'Disahkan'}
            rows={3}
            placeholder={
              isAdmin
                ? 'Masukkan maklum balas, arahan tindakan, atau pengesahan laporan di sini...'
                : 'Ulasan rasmi pihak pentadbir sekolah.'
            }
            className="w-full text-xs px-3 py-2.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-stone-100 disabled:text-stone-500"
          />
        </div>

        {/* Action Buttons Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave('Draf')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-stone-500" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('Dihantar')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Hantar Laporan</span>
            </button>
          </div>

          {/* Admin Controls */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave('Disahkan')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Sahkan &amp; Tandatangan Laporan</span>
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-stone-500 italic">
              Pengesahan rasmi dilakukan oleh Pentadbir (Guru Besar / PK HEM).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
