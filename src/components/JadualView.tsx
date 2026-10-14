import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Wand2
} from 'lucide-react';
import { JadualBertugas, UserProfile } from '../types';
import {
  toISODate,
  getMonday,
  formatMalayDate,
  formatDDMMYYYY,
  formatMalayWeekRange,
  parseDateInput
} from '../lib/dateUtils';

interface JadualViewProps {
  jadual: JadualBertugas[];
  onSaveJadual: (updated: JadualBertugas[]) => void;
  users: UserProfile[];
  isAdmin: boolean;
  onToast: (msg: string) => void;
  onNavigateToAgihan?: () => void;
}

export const JadualView: React.FC<JadualViewProps> = ({
  jadual,
  onSaveJadual,
  users,
  isAdmin,
  onToast,
  onNavigateToAgihan
}) => {
  const today = toISODate();
  const thisMonday = getMonday(today);

  // Form states for manual add
  const [formDate, setFormDate] = useState(thisMonday);
  const [formNama, setFormNama] = useState('');
  const [formKumpulan, setFormKumpulan] = useState('Kumpulan 1');
  const [formCatatan, setFormCatatan] = useState('');

  // Upload states
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  const [selectedSidangFilter, setSelectedSidangFilter] = useState<string>('all');

  // Manual Add Handler
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formNama.trim()) {
      onToast('Sila lengkapkan tarikh dan nama guru bertugas.');
      return;
    }

    const normalizedMonday = getMonday(formDate);

    const newEntry: JadualBertugas = {
      id: 'j-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      mula: normalizedMonday,
      nama: formNama.trim(),
      kumpulan: formKumpulan.trim() || undefined,
      catatan: formCatatan.trim(),
      created_at: new Date().toISOString()
    };

    const updated = [...jadual, newEntry];
    onSaveJadual(updated);
    setFormNama('');
    setFormCatatan('');
    onToast(`Jadual untuk ${newEntry.nama} berjaya ditambah!`);
  };

  // Delete Handler
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Adakah anda pasti untuk memadam rekod bertugas bagi ${name}?`)) {
      return;
    }
    const updated = jadual.filter((j) => j.id !== id);
    onSaveJadual(updated);
    onToast('Rekod jadual bertugas dipadam.');
  };

  // File Upload Handler (CSV / Excel)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rows: Array<Record<string, unknown>> = [];

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const cleanText = text.replace(/^\uFEFF/, ''); // Strip BOM
        const wb = XLSX.read(cleanText, { type: 'string', raw: true });
        const sheetName = wb.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          raw: false,
          dateNF: 'yyyy-mm-dd',
          defval: ''
        });
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          raw: false,
          dateNF: 'yyyy-mm-dd',
          defval: ''
        });
      }

      if (!rows.length) {
        setUploadMsg({ text: 'Fail Excel/CSV kosong atau tiada baris data.', success: false });
        return;
      }

      const parsedEntries: JadualBertugas[] = [];
      let skipped = 0;

      rows.forEach((r, idx) => {
        let tVal = '';
        let nVal = '';
        let cVal = '';
        let kVal = '';

        for (const [key, val] of Object.entries(r)) {
          const lk = key.toLowerCase();
          if (/tarikh|minggu|mula|date|isnin/.test(lk)) {
            tVal = parseDateInput(val);
          } else if (/nama|guru|name|teacher/.test(lk)) {
            nVal = String(val || '').trim();
          } else if (/kumpulan|group|team/.test(lk)) {
            kVal = String(val || '').trim();
          } else if (/catat|peranan|tugas|note|jawatan/.test(lk)) {
            cVal = String(val || '').trim();
          }
        }

        if (tVal && nVal) {
          parsedEntries.push({
            id: `import-${Date.now()}-${idx}`,
            mula: getMonday(tVal),
            nama: nVal,
            kumpulan: kVal || undefined,
            catatan: cVal,
            created_at: new Date().toISOString()
          });
        } else {
          skipped++;
        }
      });

      if (parsedEntries.length === 0) {
        setUploadMsg({
          text: 'Tiada rekod sah dijumpai. Pastikan fail mengandungi lajur "Tarikh Mula Minggu" dan "Nama Guru Bertugas".',
          success: false
        });
        return;
      }

      const finalJadual = replaceExisting ? parsedEntries : [...jadual, ...parsedEntries];
      onSaveJadual(finalJadual);

      setUploadMsg({
        text: `Berjaya memuat naik ${parsedEntries.length} rekod jadual bertugas!${
          skipped > 0 ? ` (${skipped} baris kosong/tidak sah dilangkau)` : ''
        }`,
        success: true
      });
      onToast(`Berjaya muat naik ${parsedEntries.length} jadual!`);
      // Reset input
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setUploadMsg({
        text: 'Ralat membaca fail: Pastikan format fail .csv atau .xlsx yang sah.',
        success: false
      });
    }
  };

  // Download Sample CSV template
  const downloadTemplate = (format: 'csv' | 'xlsx') => {
    const activeGurus = users.filter((u) => u.peranan === 'guru');
    const templateData = activeGurus.length > 0
      ? activeGurus.slice(0, 3).map((g, idx) => ({
          'Tarikh Mula Minggu': thisMonday,
          'Nama Guru Bertugas': g.nama,
          'Kumpulan': 'Kumpulan 1',
          'Catatan': idx === 0 ? 'Ketua Guru Bertugas (Laporan Rasmi)' : 'Pengawasan Kantin & Disiplin'
        }))
      : [
          {
            'Tarikh Mula Minggu': thisMonday,
            'Nama Guru Bertugas': 'Nama Guru Bertugas 1',
            'Kumpulan': 'Kumpulan 1',
            'Catatan': 'Ketua Guru Bertugas (Laporan Rasmi)'
          },
          {
            'Tarikh Mula Minggu': thisMonday,
            'Nama Guru Bertugas': 'Nama Guru Bertugas 2',
            'Kumpulan': 'Kumpulan 1',
            'Catatan': 'Pengawasan Kantin & Disiplin'
          }
        ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JadualBertugas');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'Templat_Jadual_Guru_Bertugas.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, 'Templat_Jadual_Guru_Bertugas.xlsx', { bookType: 'xlsx' });
    }
    onToast(`Templat ${format.toUpperCase()} dimuat turun.`);
  };

  // Unique weeks list for filtering
  const uniqueWeeks = Array.from(new Set(jadual.map((j) => getMonday(j.mula)))).sort();

  // Filtered List
  const filteredJadual = jadual
    .filter((j) => {
      const jMonday = getMonday(j.mula);
      if (selectedWeekFilter !== 'all' && jMonday !== selectedWeekFilter) {
        return false;
      }
      if (selectedSidangFilter !== 'all') {
        if (selectedSidangFilter === 'pagi' && j.sidang !== 'pagi') return false;
        if (selectedSidangFilter === 'petang' && j.sidang !== 'petang') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          j.nama.toLowerCase().includes(q) ||
          (j.catatan && j.catatan.toLowerCase().includes(q)) ||
          (j.kumpulan && j.kumpulan.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => a.mula.localeCompare(b.mula));

  return (
    <div className="space-y-6">
      {/* Header and overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-maroon-800" />
            <span>Jadual Guru Bertugas Mingguan</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Urus takwim guru bertugas sepanjang tahun. Boleh dimuat naik serentak menggunakan Excel/CSV atau ditambah secara manual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToAgihan && (
            <button
              type="button"
              onClick={onNavigateToAgihan}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg transition-colors cursor-pointer shadow-xs border-b-2 border-kuning-400"
            >
              <Wand2 className="w-3.5 h-3.5 text-kuning-300" />
              <span>Jana Agihan Tugas</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadTemplate('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-maroon-800" />
            <span>Templat Excel</span>
          </button>
          <button
            type="button"
            onClick={() => downloadTemplate('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Templat CSV</span>
          </button>
          {jadual.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Adakah anda pasti mahu mengosongkan semua jadual bertugas? Tindakan ini akan memadam semua rekod bertugas sedia ada.'
                  )
                ) {
                  onSaveJadual([]);
                  onToast('Semua jadual bertugas telah dikosongkan.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Jadual</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Panel: File Upload & Manual Add */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Box 1: Muat Naik Fail Excel / CSV (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-maroon-800" />
              <h3 className="font-bold text-stone-900 text-sm">
                Muat Naik Jadual Bertugas (CSV / Excel)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
              Format .xlsx, .xls, .csv
            </span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Format lajur disokong: <strong>Tarikh Mula Minggu</strong> (contoh: <code>{thisMonday}</code> atau <code>05/10/2026</code>), <strong>Nama Guru Bertugas</strong>, <strong>Kumpulan</strong>, dan <strong>Catatan</strong>.
          </p>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="upload-roster-input"
                className="flex-1 border-2 border-dashed border-stone-300 hover:border-maroon-700 rounded-lg p-3 text-center cursor-pointer transition-colors bg-stone-50/50 hover:bg-maroon-50/30"
              >
                <FileSpreadsheet className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-stone-700 block">
                  Pilih fail jadual dari komputer
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Klik untuk semak imbas (.csv, .xlsx, .xls)
                </span>
                <input
                  id="upload-roster-input"
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex flex-col gap-2 shrink-0">
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded text-maroon-800 focus:ring-maroon-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Gantikan semua jadual sedia ada</span>
                </label>
              </div>
            </div>

            {uploadMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  uploadMsg.success
                    ? 'bg-maroon-50 text-maroon-900 border border-maroon-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {uploadMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-maroon-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{uploadMsg.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Box 2: Tambah Rekod Manual (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-maroon-800" />
            <h3 className="font-bold text-stone-900 text-sm">
              Tambah Guru Bertugas Manual
            </h3>
          </div>

          <form onSubmit={handleAddManual} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tarikh Mula Minggu (Hari Isnin)
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                required
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                {formDate ? `Minggu Isnin: ${formatDDMMYYYY(getMonday(formDate))}` : ''}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nama Guru Bertugas
              </label>
              <input
                type="text"
                list="registered-teachers"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Nama guru yang bertugas"
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                required
              />
              <datalist id="registered-teachers">
                {users.map((u) => (
                  <option key={u.id} value={u.nama} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kumpulan
                </label>
                <input
                  type="text"
                  value={formKumpulan}
                  onChange={(e) => setFormKumpulan(e.target.value)}
                  placeholder="Kumpulan 1"
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan / Skop
                </label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Ketua / Kantin"
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-b-2 border-kuning-400"
            >
              <Plus className="w-4 h-4 text-kuning-300" />
              <span>Simpan ke Jadual</span>
            </button>
          </form>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Controls (Search & Week Filter) */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-sm">
              Senarai Jadual Bertugas ({filteredJadual.length} Rekod)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Week Filter */}
            <div className="relative">
              <select
                aria-label="Tapis mengikut minggu persekolahan"
                value={selectedWeekFilter}
                onChange={(e) => setSelectedWeekFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 text-stone-700"
              >
                <option value="all">Semua Minggu</option>
                {uniqueWeeks.map((wm) => (
                  <option key={wm} value={wm}>
                    {formatMalayWeekRange(wm)} {wm === thisMonday ? '(Minggu Ini)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Sidang Filter */}
            <div className="relative">
              <select
                aria-label="Tapis mengikut sidang"
                value={selectedSidangFilter}
                onChange={(e) => setSelectedSidangFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 text-stone-700"
              >
                <option value="all">Semua Sidang</option>
                <option value="pagi">Sidang Pagi Sahaja</option>
                <option value="petang">Sidang Petang Sahaja</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama guru / catatan..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Minggu Persekolahan (Isnin)</th>
                <th className="py-3 px-4">Nama Guru Bertugas</th>
                <th className="py-3 px-4">Kumpulan</th>
                <th className="py-3 px-4">Catatan / Skop Tugasan</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredJadual.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400 text-xs">
                    Tiada rekod jadual bertugas yang sepadan dengan carian atau penapis.
                  </td>
                </tr>
              ) : (
                filteredJadual.map((item) => {
                  const monIso = getMonday(item.mula);
                  const isThisWeek = monIso === thisMonday;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-stone-50 transition-colors ${
                        isThisWeek ? 'bg-kuning-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{formatMalayWeekRange(monIso)}</span>
                          {isThisWeek && (
                            <span className="text-[10px] font-bold text-maroon-950 bg-kuning-400 px-1.5 py-0.5 rounded border border-kuning-500/40">
                              MINGGU INI
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 block">
                          Mula: {formatDDMMYYYY(monIso)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">{item.nama}</span>
                          {item.sidang && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                item.sidang === 'pagi'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {item.sidang}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {item.kumpulan ? (
                          <span className="inline-block text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {item.kumpulan}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-700 text-xs">
                        {item.catatan || <span className="text-stone-400">—</span>}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.nama)}
                          className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                          title="Padam Rekod"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
