import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  FileText,
  ShieldCheck,
  UserCheck,
  Wand2
} from 'lucide-react';
import {
  TetapanSekolah,
  UserProfile,
  JadualBertugas,
  LaporanHarian,
  TabAktif
} from '../types';
import {
  toISODate,
  getMonday,
  formatMalayDate,
  formatDDMMYYYY,
  formatMalayWeekRange,
  addDays
} from '../lib/dateUtils';
import { SmkSalapingLogo } from './SmkSalapingLogo';

interface DashboardViewProps {
  tetapan: TetapanSekolah;
  currentUser: UserProfile;
  jadual: JadualBertugas[];
  laporanHarian: Record<string, LaporanHarian>;
  setTab: (tab: TabAktif) => void;
  onSelectDate: (date: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tetapan,
  currentUser,
  jadual,
  laporanHarian,
  setTab,
  onSelectDate
}) => {
  const today = toISODate();
  const thisMonday = getMonday(today);
  const currentWeekTeachers = jadual.filter((j) => getMonday(j.mula) === thisMonday);
  const todayReport = laporanHarian[today];

  // Calculate attendance for today if available
  const todayPct =
    todayReport && todayReport.jumlah > 0
      ? ((todayReport.hadir / todayReport.jumlah) * 100).toFixed(1)
      : null;

  // Pending approval reports (for admin or awareness)
  const pendingApproval = Object.values(laporanHarian).filter(
    (r) => r.status === 'Dihantar'
  );

  // Issues needing action across recent 7 days
  const recentDays = Array.from({ length: 7 }, (_, i) => addDays(today, -i));
  const recentIssues: Array<{ date: string; title: string; desc: string }> = [];

  recentDays.forEach((d) => {
    const rep = laporanHarian[d];
    if (rep) {
      if (rep.insiden && rep.insiden.trim()) {
        recentIssues.push({
          date: d,
          title: 'Insiden Murid / Tindakan',
          desc: rep.insiden
        });
      }
      if (rep.pem) {
        Object.entries(rep.pem).forEach(([k, item]) => {
          if (item.s === 'Perlu tindakan') {
            recentIssues.push({
              date: d,
              title: `Pemerhatian: ${k.toUpperCase()}`,
              desc: item.n || 'Memerlukan tindakan segera'
            });
          }
        });
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-maroon-700/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-kuning-400/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white/10 rounded-2xl p-2 border border-white/20 backdrop-blur-xs flex items-center justify-center shadow-md">
              <SmkSalapingLogo className="w-full h-full" alt="Lencana Rasmi SMK Salaping" logoUrl={tetapan.logo_url} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-maroon-800/80 border border-kuning-400/40 text-kuning-300 text-xs font-bold mb-2">
                <Calendar className="w-3.5 h-3.5 text-kuning-400" />
                <span>{formatMalayDate(today)} &bull; Minggu Persekolahan ({formatMalayWeekRange(thisMonday)})</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Selamat Datang, {currentUser.nama}
              </h2>
              <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-2xl leading-relaxed">
                {currentUser.peranan === 'pentadbir'
                  ? 'Portal Pengurusan & Pengesahan Buku Laporan Guru Bertugas SMK Salaping, Kota Marudu. Semak kehadiran harian, pantau disiplin, dan sahkan laporan bertugas.'
                  : 'Sila lengkapkan laporan harian guru bertugas untuk pemantauan kehadiran murid, disiplin perhimpunan, waktu rehat dan keselamatan persekitaran sekolah.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                onSelectDate(today);
                setTab('harian');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-kuning-400 hover:bg-kuning-300 text-maroon-950 font-black text-sm shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-maroon-950" />
              <span>{todayReport ? 'Kemaskini Laporan Hari Ini' : 'Isi Laporan Hari Ini'}</span>
            </button>
            <button
              onClick={() => setTab('mingguan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-kuning-300" />
              <span>Laporan Mingguan</span>
            </button>
            <button
              onClick={() => setTab('agihan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-maroon-950/70 hover:bg-maroon-950 text-white font-semibold text-sm border border-kuning-400/40 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-kuning-400" />
              <span>Jana Agihan Tugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Status Laporan Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Status Hari Ini</span>
              <FileText className="w-4 h-4 text-maroon-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-stone-900">
                {todayReport ? todayReport.status : 'Belum Diisi'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {todayReport
                ? `Pelapor: ${todayReport.pelapor || 'Guru Bertugas'}`
                : 'Tiada rekod disimpan untuk hari ini.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => {
                onSelectDate(today);
                setTab('harian');
              }}
              className="text-xs font-semibold text-maroon-700 hover:text-maroon-800 flex items-center gap-1 cursor-pointer"
            >
              <span>{todayReport ? 'Buka borang laporan' : 'Mulakan laporan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Kehadiran Hari Ini */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Kehadiran Murid</span>
              <TrendingUp className="w-4 h-4 text-maroon-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">
                {todayPct ? `${todayPct}%` : '—'}
              </span>
              {todayReport && (
                <span className="text-xs text-stone-500 font-medium">
                  ({todayReport.hadir}/{todayReport.jumlah})
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {todayReport
                ? `Lewat: ${todayReport.lewat} orang | Ponteng: ${todayReport.ponteng} orang`
                : 'Data kehadiran direkodkan dalam laporan harian.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-400">Sasaran KPM: &ge; 95%</span>
            {todayPct && Number(todayPct) >= 95 ? (
              <span className="text-[11px] font-bold text-maroon-700 bg-maroon-50 border border-maroon-200 px-2 py-0.5 rounded">
                Capai Sasaran
              </span>
            ) : null}
          </div>
        </div>

        {/* Card 3: Guru Bertugas Minggu Ini */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Guru Bertugas</span>
              <Users className="w-4 h-4 text-maroon-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900">
                {currentWeekTeachers.length} Orang
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 line-clamp-1">
              {currentWeekTeachers.length > 0
                ? currentWeekTeachers.map((g) => g.nama).join(', ')
                : 'Jadual minggu ini belum dimasukkan.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100">
            <button
              onClick={() => setTab('jadual')}
              className="text-xs font-semibold text-maroon-700 hover:text-maroon-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Urus jadual bertugas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Menunggu Pengesahan */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Perlu Pengesahan</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">
                {pendingApproval.length} Laporan
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Laporan berstatus &apos;Dihantar&apos; menanti semakan Guru Besar/PK HEM.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100">
            {pendingApproval.length > 0 ? (
              <button
                onClick={() => {
                  onSelectDate(pendingApproval[0].tarikh);
                  setTab('harian');
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Semak sekarang ({formatDDMMYYYY(pendingApproval[0].tarikh)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs text-maroon-700 font-medium">Semua laporan telah disahkan</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Two-Column: Guru Bertugas Minggu Ini & Log Harian */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Guru Bertugas & Ringkasan Minggu Semasa */}
        <div className="lg:col-span-2 space-y-6">
          {/* Duty Teachers Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-maroon-700" />
                <h3 className="font-bold text-stone-900 text-base">
                  Senarai Guru Bertugas Minggu Ini
                </h3>
              </div>
              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
                {formatMalayWeekRange(thisMonday)}
              </span>
            </div>

            {currentWeekTeachers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-stone-500">
                  Tiada guru bertugas didaftarkan untuk minggu ini.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setTab('agihan')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-maroon-850 hover:bg-maroon-900 rounded-lg cursor-pointer shadow-xs border border-maroon-700"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-kuning-400" />
                    <span>Jana Agihan Tugas KPM</span>
                  </button>
                  <button
                    onClick={() => setTab('jadual')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                  >
                    <span>Urus Jadual</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentWeekTeachers.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="p-3 rounded-lg border border-stone-100 bg-stone-50/60 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-maroon-100 text-maroon-900 border border-maroon-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-stone-900 truncate">
                          {g.nama}
                        </p>
                        {g.sidang && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                              g.sidang === 'pagi'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {g.sidang}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {g.catatan || 'Guru Bertugas Mingguan'}
                      </p>
                      {g.kumpulan && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-maroon-800 bg-maroon-50 px-2 py-0.5 rounded border border-maroon-200">
                          {g.kumpulan}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5-Day Weekly Status Log */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-maroon-700" />
                <h3 className="font-bold text-stone-900 text-base">
                  Rekod 5 Hari Persekolahan Minggu Ini
                </h3>
              </div>
              <button
                onClick={() => setTab('mingguan')}
                className="text-xs font-semibold text-maroon-700 hover:text-maroon-800 cursor-pointer"
              >
                Lihat Rumusan Lengkap &rarr;
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold text-stone-500 uppercase border-b border-stone-100 pb-2">
                    <th className="py-2">Hari &amp; Tarikh</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-center">Kehadiran</th>
                    <th className="py-2 text-center">Lewat</th>
                    <th className="py-2 text-center">Ponteng</th>
                    <th className="py-2">Pelapor</th>
                    <th className="py-2 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].map((hari, i) => {
                    const dateStr = addDays(thisMonday, i);
                    const rep = laporanHarian[dateStr];
                    const isToday = dateStr === today;
                    const pct =
                      rep && rep.jumlah > 0
                        ? ((rep.hadir / rep.jumlah) * 100).toFixed(1) + '%'
                        : '—';

                    return (
                      <tr
                        key={dateStr}
                        className={`hover:bg-stone-50/70 transition-colors ${
                          isToday ? 'bg-kuning-50/60 font-medium' : ''
                        }`}
                      >
                        <td className="py-2.5">
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span>{hari}</span>
                            {isToday && (
                              <span className="text-[10px] bg-kuning-400 text-maroon-950 font-bold px-1.5 py-0.2 rounded border border-kuning-500/40">
                                HARI INI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500">{formatDDMMYYYY(dateStr)}</div>
                        </td>
                        <td className="py-2.5">
                          {rep ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                rep.status === 'Disahkan'
                                  ? 'bg-maroon-100 text-maroon-900 border border-maroon-200'
                                  : rep.status === 'Dihantar'
                                  ? 'bg-kuning-100 text-kuning-900 border border-kuning-300'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {rep.status}
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400">Belum diisi</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-semibold text-stone-800">
                          {pct}
                        </td>
                        <td className="py-2.5 text-center text-stone-600">
                          {rep ? rep.lewat : '—'}
                        </td>
                        <td className="py-2.5 text-center text-stone-600">
                          {rep ? rep.ponteng : '—'}
                        </td>
                        <td className="py-2.5 text-stone-700 text-xs">
                          {rep ? rep.pelapor || 'Guru Bertugas' : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              onSelectDate(dateStr);
                              setTab('harian');
                            }}
                            className="text-xs font-semibold px-2.5 py-1 rounded bg-stone-100 hover:bg-maroon-800 hover:text-white text-stone-700 transition-colors cursor-pointer"
                          >
                            {rep ? 'Buka' : 'Isi'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Alerts & Notice Board */}
        <div className="space-y-6">
          {/* Quick Notice & Actions Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Perkara Perlu Perhatian &amp; Insiden</span>
            </h3>

            {recentIssues.length === 0 ? (
              <div className="p-4 rounded-lg bg-stone-50 border border-stone-100 text-center">
                <CheckCircle2 className="w-6 h-6 text-maroon-700 mx-auto mb-1" />
                <p className="text-xs font-semibold text-stone-700">Semua Terkawal</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tiada rekod insiden berbangkit atau isu keselamatan kritikal dilaporkan minggu ini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recentIssues.slice(0, 5).map((iss, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>{iss.title}</span>
                      <span className="text-[10px] text-amber-700 font-semibold">
                        {formatDDMMYYYY(iss.date)}
                      </span>
                    </div>
                    <p className="text-stone-700 text-xs leading-relaxed">{iss.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines / Panduan Bertugas Card */}
          <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 text-xs space-y-3">
            <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wide">
              Peringatan Guru Bertugas Harian
            </h4>
            <ul className="space-y-2 text-stone-600 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-stone-800">Kehadiran Awal:</strong> Berada di pintu pagar sekolah seawal 7.00 pagi untuk menyambut murid.
              </li>
              <li>
                <strong className="text-stone-800">Waktu Rehat:</strong> Memastikan murid beratur tertib di kantin dan tidak berlari.
              </li>
              <li>
                <strong className="text-stone-800">Penyuraian:</strong> Mengawal lalu lintas dan laluan bas sekolah sehingga jam 1.30 petang / tamat sesi.
              </li>
              <li>
                <strong className="text-stone-800">Hantar Laporan:</strong> Simpan laporan harian sebelum jam 2.30 petang untuk semakan pentadbiran.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
