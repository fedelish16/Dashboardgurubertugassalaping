import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Share2,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  School,
  FileSpreadsheet
} from 'lucide-react';
import {
  LaporanHarian,
  LaporanMingguan,
  JadualBertugas,
  TetapanSekolah,
  UserProfile
} from '../types';
import {
  toISODate,
  getMonday,
  formatMalayDate,
  formatDDMMYYYY,
  formatMalayWeekRange,
  addDays,
  HARI_SEKOLAH
} from '../lib/dateUtils';
import { DOMAIN_PEMERHATIAN } from '../lib/storage';
import { SmkSalapingLogo } from './SmkSalapingLogo';

interface LaporanMingguanViewProps {
  selectedWeekMonday: string;
  onSelectWeekMonday: (m: string) => void;
  laporanHarian: Record<string, LaporanHarian>;
  laporanMingguan: Record<string, LaporanMingguan>;
  onSaveLaporanMingguan: (m: string, report: LaporanMingguan) => void;
  jadual: JadualBertugas[];
  tetapan: TetapanSekolah;
  currentUser: UserProfile;
  onToast: (msg: string) => void;
}

export const LaporanMingguanView: React.FC<LaporanMingguanViewProps> = ({
  selectedWeekMonday,
  onSelectWeekMonday,
  laporanHarian,
  laporanMingguan,
  onSaveLaporanMingguan,
  jadual,
  tetapan,
  currentUser,
  onToast
}) => {
  const isAdmin = currentUser.peranan === 'pentadbir';
  const existingWk = laporanMingguan[selectedWeekMonday];

  const [ulasan, setUlasan] = useState('');
  const [catatanPentadbir, setCatatanPentadbir] = useState('');
  const [status, setStatus] = useState<'Draf' | 'Lengkap' | 'Disahkan'>('Draf');

  useEffect(() => {
    if (existingWk) {
      setUlasan(existingWk.ulasan || '');
      setCatatanPentadbir(existingWk.catatan_pentadbir || '');
      setStatus(existingWk.status || 'Draf');
    } else {
      setUlasan(
        'Secara keseluruhannya, perjalanan sesi persekolahan minggu ini berada dalam keadaan terkawal, kondusif dan selamat. Murid mematuhi peraturan sekolah dan aktiviti berjalan lancar mengikut jadual.'
      );
      setCatatanPentadbir('');
      setStatus('Draf');
    }
  }, [selectedWeekMonday, existingWk]);

  // Teachers on duty for this week
  const weekTeachers = jadual.filter((j) => getMonday(j.mula) === selectedWeekMonday);
  const teacherNames = weekTeachers.map((w) => w.nama).join(', ') || 'Belum ditetapkan';

  // 5 days data
  const daysData = HARI_SEKOLAH.map((hari, i) => {
    const dateStr = addDays(selectedWeekMonday, i);
    const rep = laporanHarian[dateStr];
    return {
      hari,
      dateStr,
      rep
    };
  });

  // Calculate aggregation stats
  let totalReported = 0;
  let sumAttendancePct = 0;
  let countAttendanceDays = 0;
  let totalLewat = 0;
  let totalPonteng = 0;
  let totalEnrolment = 0;
  let totalHadir = 0;

  const incidentsList: Array<{ hari: string; dateStr: string; text: string }> = [];
  const actionItemsList: Array<{ hari: string; dateStr: string; domain: string; note: string }> = [];

  daysData.forEach(({ hari, dateStr, rep }) => {
    if (rep) {
      totalReported++;
      totalLewat += rep.lewat || 0;
      totalPonteng += rep.ponteng || 0;
      totalEnrolment += rep.jumlah || 0;
      totalHadir += rep.hadir || 0;

      if (rep.jumlah > 0) {
        sumAttendancePct += (rep.hadir / rep.jumlah) * 100;
        countAttendanceDays++;
      }

      if (rep.insiden && rep.insiden.trim()) {
        incidentsList.push({ hari, dateStr, text: rep.insiden });
      }

      if (rep.pem) {
        DOMAIN_PEMERHATIAN.forEach((dom) => {
          const item = rep.pem[dom.key];
          if (item && item.s === 'Perlu tindakan') {
            actionItemsList.push({
              hari,
              dateStr,
              domain: dom.title,
              note: item.n || 'Perlu pemantauan/tindakan segera'
            });
          }
        });
      }
    }
  });

  const avgAttendancePct =
    countAttendanceDays > 0 ? (sumAttendancePct / countAttendanceDays).toFixed(1) : '—';

  // Handle Save
  const handleSave = (targetStatus: 'Draf' | 'Lengkap' | 'Disahkan') => {
    const payload: LaporanMingguan = {
      mula: selectedWeekMonday,
      ulasan: ulasan.trim(),
      catatan_pentadbir: catatanPentadbir.trim(),
      disahkan_oleh:
        targetStatus === 'Disahkan'
          ? `${currentUser.nama} (${currentUser.jawatan || 'Pentadbir'})`
          : existingWk?.disahkan_oleh,
      status: targetStatus,
      updated_at: new Date().toISOString()
    };

    onSaveLaporanMingguan(selectedWeekMonday, payload);
    setStatus(targetStatus);
    onToast(
      targetStatus === 'Disahkan'
        ? 'Laporan mingguan berjaya disahkan oleh Pentadbir!'
        : 'Ulasan laporan mingguan disimpan.'
    );
  };

  // Generate printable/exportable HTML
  const generateExportHTML = () => {
    const fridayDate = addDays(selectedWeekMonday, 4);
    const rowsHtml = daysData
      .map(({ hari, dateStr, rep }) => {
        const pct =
          rep && rep.jumlah > 0 ? ((rep.hadir / rep.jumlah) * 100).toFixed(1) + '%' : '—';
        return `<tr>
          <td style="padding: 6px 8px; border: 1px solid #333; font-weight: bold;">${hari} (${formatDDMMYYYY(
          dateStr
        )})</td>
          <td style="padding: 6px 8px; border: 1px solid #333;">${rep ? rep.status : 'Tiada Laporan'}</td>
          <td style="padding: 6px 8px; border: 1px solid #333; text-align: center;">${pct}</td>
          <td style="padding: 6px 8px; border: 1px solid #333; text-align: center;">${rep ? rep.lewat : '—'}</td>
          <td style="padding: 6px 8px; border: 1px solid #333; text-align: center;">${rep ? rep.ponteng : '—'}</td>
          <td style="padding: 6px 8px; border: 1px solid #333;">${rep ? rep.pelapor : '—'}</td>
        </tr>`;
      })
      .join('');

    const incidentsHtml = incidentsList.length
      ? incidentsList.map((i) => `<li><b>${i.hari}:</b> ${i.text}</li>`).join('')
      : '<li>Tiada insiden dilaporkan sepanjang minggu ini.</li>';

    const actionHtml = actionItemsList.length
      ? actionItemsList.map((a) => `<li><b>${a.hari} (${a.domain}):</b> ${a.note}</li>`).join('')
      : '<li>Semua aspek kebersihan, keselamatan dan disiplin dalam keadaan memuaskan.</li>';

    return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <title>Laporan Mingguan Guru Bertugas - ${tetapan.sekolah}</title>
  <style>
    body { font-family: 'Times New Roman', Georgia, serif; line-height: 1.5; color: #111; max-width: 820px; margin: 30px auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 18pt; text-transform: uppercase; }
    h2 { margin: 4px 0; font-size: 14pt; }
    .sub { font-size: 11pt; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10.5pt; }
    th { background: #f0f0f0; border: 1px solid #333; padding: 7px; text-align: left; }
    td { border: 1px solid #333; padding: 6px; }
    .section-title { font-weight: bold; margin-top: 18px; margin-bottom: 6px; font-size: 11.5pt; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
    ul { margin: 6px 0; padding-left: 20px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-box { width: 45%; border-top: 1px solid #000; padding-top: 6px; font-size: 10.5pt; }
  </style>
</head>
<body>
  <div class="header">
    <img src="/smk-salaping-logo.svg" width="80" height="80" alt="Logo SMK Salaping" style="display: block; margin: 0 auto 10px auto;" />
    <h1>${tetapan.sekolah}</h1>
    <div class="sub">${tetapan.kod_sekolah ? `KOD SEKOLAH: ${tetapan.kod_sekolah} &bull; ` : ''}SESI PERSEKOLAHAN: ${tetapan.sesi}</div>
    <h2>BUKU LAPORAN GURU BERTUGAS MINGGUAN</h2>
    <div class="sub">Minggu Persekolahan: ${formatDDMMYYYY(selectedWeekMonday)} hingga ${formatDDMMYYYY(fridayDate)}</div>
  </div>

  <p><b>Guru-guru Bertugas:</b> ${teacherNames}</p>

  <div class="section-title">1. Ringkasan Kehadiran &amp; Disiplin Murid</div>
  <table>
    <thead>
      <tr>
        <th>Hari &amp; Tarikh</th>
        <th>Status</th>
        <th style="text-align: center;">Kehadiran (%)</th>
        <th style="text-align: center;">Lewat</th>
        <th style="text-align: center;">Ponteng</th>
        <th>Pelapor</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <p><b>Statistik Keseluruhan:</b> ${totalReported}/5 hari dilaporkan &bull; Purata Kehadiran: <b>${avgAttendancePct}%</b> &bull; Jumlah Murid Lewat: <b>${totalLewat}</b> &bull; Jumlah Ponteng: <b>${totalPonteng}</b></p>

  <div class="section-title">2. Laporan Insiden &amp; Tindakan Khas</div>
  <ul>${incidentsHtml}</ul>

  <div class="section-title">3. Perkara Perlu Tindakan / Pembaikan Fizikal</div>
  <ul>${actionHtml}</ul>

  <div class="section-title">4. Rumusan Mingguan Guru Bertugas</div>
  <p>${ulasan ? ulasan.replace(/\n/g, '<br>') : '—'}</p>

  <div class="section-title">5. Catatan / Ulasan Pentadbir</div>
  <p>${catatanPentadbir ? catatanPentadbir.replace(/\n/g, '<br>') : '—'}</p>

  <div class="signatures">
    <div class="sig-box">
      Disediakan oleh:<br><br><br>
      <b>........................................................</b><br>
      <b>${weekTeachers[0]?.nama || 'Ketua Guru Bertugas'}</b><br>
      Guru Bertugas Mingguan
    </div>
    <div class="sig-box">
      Disahkan oleh:<br><br><br>
      <b>........................................................</b><br>
      <b>${tetapan.pentadbir || 'Guru Besar'}</b><br>
      ${tetapan.jawatan || 'Guru Besar'}
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadHTML = () => {
    const html = generateExportHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Mingguan_${selectedWeekMonday}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('Fail HTML laporan mingguan dimuat turun.');
  };

  const handleCopySummary = () => {
    const text = `*RUMUSAN GURU BERTUGAS MINGGUAN*\n*${tetapan.sekolah}*\nMinggu: ${formatMalayWeekRange(
      selectedWeekMonday
    )}\n\n*Guru Bertugas:* ${teacherNames}\n*Hari Dilaporkan:* ${totalReported}/5 Hari\n*Purata Kehadiran:* ${avgAttendancePct}%\n*Jumlah Lewat:* ${totalLewat} murid\n*Jumlah Ponteng:* ${totalPonteng} murid\n\n*Ulasan:* ${ulasan}\n\n_Disahkan oleh: ${
      tetapan.pentadbir
    } (${tetapan.jawatan})_`;

    navigator.clipboard.writeText(text);
    onToast('Ringkasan disalin ke papan klip untuk WhatsApp/Telegram!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions (No Print) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onSelectWeekMonday(addDays(selectedWeekMonday, -7))}
              className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-200 transition-colors cursor-pointer"
              title="Minggu Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              aria-label="Pilih Tarikh Isnin Minggu"
              value={selectedWeekMonday}
              onChange={(e) => onSelectWeekMonday(getMonday(e.target.value))}
              className="text-xs sm:text-sm font-bold text-stone-800 bg-white border border-stone-200 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-maroon-600"
            />
            <button
              type="button"
              onClick={() => onSelectWeekMonday(addDays(selectedWeekMonday, 7))}
              className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-200 transition-colors cursor-pointer"
              title="Minggu Seterusnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectWeekMonday(getMonday(toISODate()))}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
          >
            Minggu Ini
          </button>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Laporan Mingguan: {formatMalayWeekRange(selectedWeekMonday)}
            </h3>
            <p className="text-xs text-stone-500">
              Agregasi automatik 5 hari persekolahan &amp; dokumen rasmi cetakan KPM
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Salin untuk WhatsApp / Telegram"
          >
            <Share2 className="w-3.5 h-3.5 text-maroon-800" />
            <span>Salin Ringkasan</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHTML}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Muat turun fail HTML"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Muat Turun HTML</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg shadow-xs transition-colors cursor-pointer border-b-2 border-kuning-400"
            title="Cetak Laporan Lengkap Rasmi atau Simpan PDF"
          >
            <Printer className="w-3.5 h-3.5 text-kuning-300" />
            <span>Cetak / Eksport PDF</span>
          </button>
        </div>
      </div>

      {/* Editable Reflections Box (No Print) */}
      <div className="no-print bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-maroon-800" />
          <span>Rumusan &amp; Pengesahan Mingguan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ulasan / Rumusan Guru Bertugas
            </label>
            <textarea
              value={ulasan}
              onChange={(e) => setUlasan(e.target.value)}
              rows={4}
              placeholder="Tulis ulasan keseluruhan bagi minggu ini..."
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Catatan / Arahan Pentadbir (Guru Besar / PK)
            </label>
            <textarea
              value={catatanPentadbir}
              onChange={(e) => setCatatanPentadbir(e.target.value)}
              disabled={!isAdmin && status === 'Disahkan'}
              rows={4}
              placeholder={
                isAdmin
                  ? 'Catatan arahan atau ulasan pentadbir untuk makluman mesyuarat pengurusan...'
                  : 'Catatan pentadbir sekolah.'
              }
              className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 disabled:bg-stone-100 disabled:text-stone-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => handleSave('Lengkap')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-stone-600" />
            <span>Simpan Ulasan</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => handleSave('Disahkan')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg transition-colors cursor-pointer shadow-xs border-b-2 border-kuning-400"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-kuning-300" />
              <span>Sahkan &amp; Tandatangan Laporan Mingguan</span>
            </button>
          ) : (
            <span className="text-xs text-stone-500 italic">
              Pengesahan mingguan dibuat oleh Pengetua / PK HEM.
            </span>
          )}
        </div>
      </div>

      {/* Official Printable Report Document */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-10 card-print-clean max-w-4xl mx-auto text-stone-900">
        {/* Document Letterhead Header */}
        <div className="text-center border-b-2 border-stone-900 pb-5 mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <SmkSalapingLogo className="w-20 h-20 sm:w-24 sm:h-24" alt="Logo Rasmi SMK Salaping" logoUrl={tetapan.logo_url} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold font-serif-report uppercase tracking-wider text-stone-950">
            {tetapan.sekolah}
          </h1>
          {tetapan.alamat && (
            <p className="text-xs text-stone-600 mt-0.5">{tetapan.alamat}</p>
          )}
          <p className="text-xs font-semibold text-stone-600 mt-1">
            {tetapan.kod_sekolah ? `KOD SEKOLAH: ${tetapan.kod_sekolah} &bull; ` : ''}SESI PERSEKOLAHAN: {tetapan.sesi}
          </p>
          <div className="mt-4 pt-2 border-t border-stone-300">
            <h2 className="text-base sm:text-lg font-bold font-serif-report tracking-wide uppercase text-stone-900">
              LAPORAN MINGGUAN GURU BERTUGAS
            </h2>
            <p className="text-xs font-semibold text-stone-700 mt-0.5">
              Tempoh: {formatMalayWeekRange(selectedWeekMonday)} ({formatDDMMYYYY(selectedWeekMonday)} hingga {formatDDMMYYYY(addDays(selectedWeekMonday, 4))})
            </p>
          </div>
        </div>

        {/* Meta Info: Guru Bertugas */}
        <div className="mb-6 p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-bold text-stone-800">Senarai Guru Bertugas:</span>{' '}
            <span className="text-stone-700">{teacherNames}</span>
          </div>
          <div className="shrink-0 text-stone-500 font-medium">
            Status Dokumen: <strong className="text-stone-800">{status}</strong>
          </div>
        </div>

        {/* Section 1: Ringkasan 5 Hari Persekolahan */}
        <div className="space-y-2 mb-6">
          <h3 className="font-bold font-serif-report text-sm uppercase tracking-wide text-stone-900 border-b border-stone-200 pb-1">
            1. Rekod Kehadiran &amp; Ketibaan Harian
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs print-table border-collapse">
              <thead>
                <tr className="bg-stone-100 border border-stone-300 text-stone-800 font-bold uppercase text-[11px]">
                  <th className="py-2 px-3 border border-stone-300">Hari &amp; Tarikh</th>
                  <th className="py-2 px-3 border border-stone-300">Status</th>
                  <th className="py-2 px-3 border border-stone-300 text-center">Kehadiran (%)</th>
                  <th className="py-2 px-3 border border-stone-300 text-center">Lewat</th>
                  <th className="py-2 px-3 border border-stone-300 text-center">Ponteng</th>
                  <th className="py-2 px-3 border border-stone-300">Guru Pelapor</th>
                </tr>
              </thead>
              <tbody>
                {daysData.map(({ hari, dateStr, rep }) => {
                  const pct =
                    rep && rep.jumlah > 0
                      ? ((rep.hadir / rep.jumlah) * 100).toFixed(1) + '%'
                      : '—';

                  return (
                    <tr key={dateStr} className="border border-stone-300">
                      <td className="py-2 px-3 border border-stone-300 font-semibold text-stone-900 whitespace-nowrap">
                        {hari} ({formatDDMMYYYY(dateStr)})
                      </td>
                      <td className="py-2 px-3 border border-stone-300">
                        {rep ? rep.status : <span className="text-stone-400 italic">Tiada laporan</span>}
                      </td>
                      <td className="py-2 px-3 border border-stone-300 text-center font-bold">
                        {pct}
                      </td>
                      <td className="py-2 px-3 border border-stone-300 text-center">
                        {rep ? rep.lewat : '—'}
                      </td>
                      <td className="py-2 px-3 border border-stone-300 text-center">
                        {rep ? rep.ponteng : '—'}
                      </td>
                      <td className="py-2 px-3 border border-stone-300">
                        {rep ? rep.pelapor || 'Guru Bertugas' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded text-xs text-stone-700 flex flex-wrap gap-4">
            <div>
              Hari Dilaporkan: <strong>{totalReported} / 5 Hari</strong>
            </div>
            <div>
              Purata Kehadiran Murid: <strong>{avgAttendancePct}%</strong>
            </div>
            <div>
              Jumlah Murid Lewat: <strong>{totalLewat} Orang</strong>
            </div>
            <div>
              Jumlah Murid Ponteng: <strong>{totalPonteng} Orang</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Insiden & Tindakan Rawatan */}
        <div className="space-y-2 mb-6">
          <h3 className="font-bold font-serif-report text-sm uppercase tracking-wide text-stone-900 border-b border-stone-200 pb-1">
            2. Rekod Insiden / Rawatan Kesihatan &amp; Tindakan
          </h3>
          {incidentsList.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-1">
              Tiada insiden atau kes murid sakit/kecederaan dilaporkan sepanjang minggu ini.
            </p>
          ) : (
            <ul className="text-xs space-y-1.5 list-disc list-inside text-stone-800">
              {incidentsList.map((inc, i) => (
                <li key={i} className="leading-relaxed">
                  <strong>{inc.hari} ({formatDDMMYYYY(inc.dateStr)}):</strong> {inc.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 3: Perkara Perlu Tindakan */}
        <div className="space-y-2 mb-6">
          <h3 className="font-bold font-serif-report text-sm uppercase tracking-wide text-stone-900 border-b border-stone-200 pb-1">
            3. Perkara Perlu Tindakan / Pembaikan Kemudahan
          </h3>
          {actionItemsList.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-1">
              Kebersihan persekitaran, tandas, kantin dan kemudahan keselamatan berada dalam keadaan terkawal.
            </p>
          ) : (
            <ul className="text-xs space-y-1.5 list-disc list-inside text-stone-800">
              {actionItemsList.map((act, i) => (
                <li key={i} className="leading-relaxed">
                  <strong>{act.hari} — {act.domain}:</strong> {act.note}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Section 4: Rumusan Mingguan */}
        <div className="space-y-2 mb-6">
          <h3 className="font-bold font-serif-report text-sm uppercase tracking-wide text-stone-900 border-b border-stone-200 pb-1">
            4. Rumusan Mingguan Guru Bertugas
          </h3>
          <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line py-1">
            {ulasan || '—'}
          </p>
        </div>

        {/* Section 5: Ulasan Pentadbir */}
        <div className="space-y-2 mb-8">
          <h3 className="font-bold font-serif-report text-sm uppercase tracking-wide text-stone-900 border-b border-stone-200 pb-1">
            5. Catatan / Arahan Tindakan Pentadbir
          </h3>
          <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-line py-1">
            {catatanPentadbir || 'Laporan disemak dan diterima untuk rekod rasmi pihak pengurusan sekolah.'}
          </p>
        </div>

        {/* Signatures Section */}
        <div className="pt-8 border-t border-stone-300 print-avoid-break">
          <div className="grid grid-cols-2 gap-12 text-xs">
            <div>
              <p className="text-stone-600 mb-14">Disediakan oleh:</p>
              <div className="border-t border-stone-800 pt-1.5">
                <p className="font-bold text-stone-900">
                  {weekTeachers[0]?.nama || currentUser?.nama || '(Ketua Guru Bertugas)'}
                </p>
                <p className="text-stone-500">Ketua Guru Bertugas Mingguan</p>
                <p className="text-stone-400 text-[10px]">Tarikh: {formatMalayDate(addDays(selectedWeekMonday, 4))}</p>
              </div>
            </div>

            <div className="relative">
              <p className="text-stone-600 mb-2">Disahkan oleh:</p>
              <div className="h-16 flex items-end relative">
                {tetapan.tandatangan_url && (
                  <img
                    src={tetapan.tandatangan_url}
                    alt="Tandatangan Pentadbir"
                    className="max-h-14 object-contain drop-shadow-2xs select-none z-10"
                  />
                )}
                {tetapan.cap_url && (
                  <img
                    src={tetapan.cap_url}
                    alt="Cap Rasmi Sekolah"
                    className="absolute right-0 bottom-0 max-h-16 opacity-80 object-contain drop-shadow-2xs select-none pointer-events-none"
                  />
                )}
              </div>
              <div className="border-t border-stone-800 pt-1.5">
                <p className="font-bold text-stone-900">
                  {tetapan.pentadbir || '(Nama Pentadbir Pengesah)'}
                </p>
                <p className="text-stone-500">{tetapan.jawatan || 'Pengetua'}</p>
                <p className="text-stone-400 text-[10px]">Tarikh: {formatMalayDate(addDays(selectedWeekMonday, 4))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
