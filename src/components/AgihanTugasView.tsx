import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Wand2,
  Calendar,
  Users,
  CheckCircle2,
  ListOrdered,
  Download,
  Printer,
  Plus,
  Trash2,
  ArrowRight,
  BarChart3,
  Sparkles,
  Settings2,
  Upload,
  FileSpreadsheet,
  Sun,
  Moon,
  Clock,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  UserProfile,
  JadualBertugas,
  TetapanSekolah,
  SkopTugasan,
  HasilAgihanMinggu,
  Sidang
} from '../types';
import {
  toISODate,
  getMonday,
  addDays,
  formatDDMMYYYY,
  formatMalayWeekRange,
  parseDateInput
} from '../lib/dateUtils';
import {
  generateKalendarAkademikKPM,
  generateAgihanDenganSidang,
  SKOP_SIDANG_PAGI,
  SKOP_SIDANG_PETANG
} from '../lib/kpmCalendar';
import { SmkSalapingLogo } from './SmkSalapingLogo';

interface AgihanTugasViewProps {
  users: UserProfile[];
  onSaveUsers: (updated: UserProfile[]) => void;
  jadual: JadualBertugas[];
  onSaveJadual: (updated: JadualBertugas[]) => void;
  tetapan: TetapanSekolah;
  onToast: (msg: string) => void;
  onNavigateToJadual: () => void;
}

export const AgihanTugasView: React.FC<AgihanTugasViewProps> = ({
  users,
  onSaveUsers,
  jadual,
  onSaveJadual,
  tetapan,
  onToast,
  onNavigateToJadual
}) => {
  const today = toISODate();
  const currentMonday = getMonday(today);

  // Sub-tabs in this view: 'penjana' (Generator) | 'muatnaik_guru' (Upload Teachers)
  const [activeSection, setActiveSection] = useState<'penjana' | 'muatnaik_guru'>('penjana');

  // Filter teachers by session
  const guruPagiList = useMemo(() => users.filter((u) => u.peranan === 'guru' && (u.sidang === 'pagi' || !u.sidang || u.sidang === 'kedua')), [users]);
  const guruPetangList = useMemo(() => users.filter((u) => u.peranan === 'guru' && (u.sidang === 'petang' || u.sidang === 'kedua')), [users]);

  // Upload Tab Form States
  const [quickPastePagi, setQuickPastePagi] = useState('');
  const [quickPastePetang, setQuickPastePetang] = useState('');
  const [uploadMsg, setUploadMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Generator Configuration States
  const [tempohMod, setTempohMod] = useState<'semua_42' | 'penggal1' | 'penggal2' | 'penggal3' | 'manual'>('semua_42');
  const [tarikhMula, setTarikhMula] = useState<string>('2026-03-16'); // Isnin mula Sesi KPM 2026
  const [bilanganMingguManual, setBilanganMingguManual] = useState<number>(42);
  const [kecualikanCutiKPM, setKecualikanCutiKPM] = useState<boolean>(true);
  const [sesiSasaran, setSesiSasaran] = useState<'kedua' | 'pagi' | 'petang'>('kedua');
  const [kaedah, setKaedah] = useState<'kumpulan' | 'seimbang' | 'rawak'>('kumpulan');
  const [bilanganKumpulanPagi, setBilanganKumpulanPagi] = useState<number>(4);
  const [bilanganKumpulanPetang, setBilanganKumpulanPetang] = useState<number>(4);

  // Scopes list
  const [skopPagi, setSkopPagi] = useState<SkopTugasan[]>(SKOP_SIDANG_PAGI);
  const [skopPetang, setSkopPetang] = useState<SkopTugasan[]>(SKOP_SIDANG_PETANG);
  const [newSkopPagiInput, setNewSkopPagiInput] = useState('');
  const [newSkopPetangInput, setNewSkopPetangInput] = useState('');

  // Generated Results
  const [hasilAgihan, setHasilAgihan] = useState<HasilAgihanMinggu[]>([]);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // Calculate actual number of weeks according to selected period
  const computedWeeksCount = useMemo(() => {
    if (tempohMod === 'semua_42') return 44; // includes holidays
    if (tempohMod === 'penggal1') return 11;
    if (tempohMod === 'penggal2') return 13;
    if (tempohMod === 'penggal3') return 18;
    return bilanganMingguManual;
  }, [tempohMod, bilanganMingguManual]);

  // Determine start date based on term
  const computedStartDate = useMemo(() => {
    if (tempohMod === 'semua_42' || tempohMod === 'penggal1') return '2026-03-16';
    if (tempohMod === 'penggal2') return '2026-06-08';
    if (tempohMod === 'penggal3') return '2026-09-07';
    return tarikhMula;
  }, [tempohMod, tarikhMula]);

  // Handle Upload of Teacher List File (Excel or CSV)
  const handleUploadTeacherFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetSidang?: 'pagi' | 'petang'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rows: Array<Record<string, unknown>> = [];
      if (file.name.endsWith('.csv')) {
        const text = (await file.text()).replace(/^\uFEFF/, '');
        const wb = XLSX.read(text, { type: 'string', raw: true });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, defval: '' });
      }

      if (!rows.length) {
        setUploadMsg({ text: 'Fail tidak mempunyai baris data.', success: false });
        return;
      }

      const importedTeachers: UserProfile[] = [];
      let skipped = 0;

      rows.forEach((r, idx) => {
        let name = '';
        let sidangDetect: Sidang = targetSidang || 'pagi';
        let jawatan = 'Guru Akademik';
        let email = '';
        let phone = '';

        for (const [k, v] of Object.entries(r)) {
          const lk = k.toLowerCase();
          const strVal = String(v || '').trim();
          if (/nama|guru|name|teacher/.test(lk)) {
            name = strVal;
          } else if (/sidang|sesi|session/.test(lk)) {
            if (/petang|afternoon/i.test(strVal)) sidangDetect = 'petang';
            else if (/kedua|both|all/i.test(strVal)) sidangDetect = 'kedua';
            else sidangDetect = 'pagi';
          } else if (/jawatan|tugas|skop|role/.test(lk)) {
            if (strVal) jawatan = strVal;
          } else if (/emel|email/.test(lk)) {
            if (strVal) email = strVal;
          } else if (/tel|phone|hp/.test(lk)) {
            if (strVal) phone = strVal;
          }
        }

        if (name) {
          importedTeachers.push({
            id: `guru-imp-${Date.now()}-${idx}`,
            nama: name,
            email: email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sekolah.edu.my`,
            peranan: 'guru',
            jawatan: jawatan,
            sidang: targetSidang || sidangDetect,
            telefon: phone
          });
        } else {
          skipped++;
        }
      });

      if (importedTeachers.length === 0) {
        setUploadMsg({
          text: 'Tiada nama guru dijumpai. Pastikan lajur "Nama Guru" wujud dalam fail.',
          success: false
        });
        return;
      }

      // Merge with existing users (preserving existing admins and unique names)
      const existingNames = new Set(users.map((u) => u.nama.toLowerCase().trim()));
      const newUnique = importedTeachers.filter((it) => !existingNames.has(it.nama.toLowerCase().trim()));

      const updatedUsers = [...users, ...newUnique];
      onSaveUsers(updatedUsers);

      const msg = `Berjaya mengimport ${importedTeachers.length} guru (${
        targetSidang ? `Sidang ${targetSidang.toUpperCase()}` : 'Sidang Pagi & Petang'
      })! ${skipped > 0 ? `(${skipped} baris kosong dilangkau)` : ''}`;
      setUploadMsg({ text: msg, success: true });
      onToast(msg);
      e.target.value = '';
    } catch (err) {
      console.error(err);
      setUploadMsg({ text: 'Ralat membaca fail Excel/CSV.', success: false });
    }
  };

  // Quick Paste Save Handler
  const handleSaveQuickPaste = () => {
    const pagiNames = quickPastePagi
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);
    const petangNames = quickPastePetang
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean);

    if (pagiNames.length === 0 && petangNames.length === 0) {
      onToast('Sila masukkan sekurang-kurangnya satu nama guru.');
      return;
    }

    const newUsersList: UserProfile[] = [];

    pagiNames.forEach((name, i) => {
      newUsersList.push({
        id: `pagi-paste-${Date.now()}-${i}`,
        nama: name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sekolah.edu.my`,
        peranan: 'guru',
        jawatan: 'Guru Sidang Pagi',
        sidang: 'pagi'
      });
    });

    petangNames.forEach((name, i) => {
      newUsersList.push({
        id: `ptg-paste-${Date.now()}-${i}`,
        nama: name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sekolah.edu.my`,
        peranan: 'guru',
        jawatan: 'Guru Sidang Petang',
        sidang: 'petang'
      });
    });

    // Merge avoiding exact duplicates
    const currentNameSet = new Set(users.map((u) => u.nama.toLowerCase().trim()));
    const finalNew = newUsersList.filter((nu) => !currentNameSet.has(nu.nama.toLowerCase().trim()));

    onSaveUsers([...users, ...finalNew]);
    setQuickPastePagi('');
    setQuickPastePetang('');
    onToast(`Berjaya menambah ${finalNew.length} guru daripada senarai teks!`);
  };

  // Clear all non-admin teachers
  const handleClearTeachers = () => {
    if (
      window.confirm(
        'Adakah anda pasti untuk mengosongkan senarai semua guru (kecuali pentadbir rasmi)? Ini memudahkan anda memuat naik senarai guru baharu.'
      )
    ) {
      const retained = users.filter((u) => u.peranan === 'pentadbir');
      onSaveUsers(retained.length > 0 ? retained : users.slice(0, 1));
      onToast('Senarai guru telah dikosongkan.');
    }
  };

  // Download Sample Template for Morning & Afternoon Teachers
  const handleDownloadTeacherTemplate = (format: 'xlsx' | 'csv') => {
    const existingGurus = users.filter((u) => u.peranan === 'guru');
    const sample = existingGurus.length > 0
      ? existingGurus.slice(0, 4).map((g) => ({
          'Nama Guru': g.nama,
          'Sidang': (g.sidang || 'Pagi').charAt(0).toUpperCase() + (g.sidang || 'pagi').slice(1),
          'Jawatan': g.jawatan || 'Guru Akademik',
          'Emel': g.email,
          'No Telefon': '-'
        }))
      : [
          {
            'Nama Guru': 'Nama Penuh Guru 1',
            'Sidang': 'Pagi',
            'Jawatan': 'Guru Akademik',
            'Emel': 'guru1@moe-dl.edu.my',
            'No Telefon': '-'
          },
          {
            'Nama Guru': 'Nama Penuh Guru 2',
            'Sidang': 'Pagi',
            'Jawatan': 'Guru Akademik',
            'Emel': 'guru2@moe-dl.edu.my',
            'No Telefon': '-'
          },
          {
            'Nama Guru': 'Nama Penuh Guru 3',
            'Sidang': 'Petang',
            'Jawatan': 'Guru Akademik',
            'Emel': 'guru3@moe-dl.edu.my',
            'No Telefon': '-'
          }
        ];

    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SenaraiGuru');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'Templat_Senarai_Guru_Sidang_Pagi_Petang.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, 'Templat_Senarai_Guru_Sidang_Pagi_Petang.xlsx', { bookType: 'xlsx' });
    }
    onToast(`Templat ${format.toUpperCase()} senarai guru dimuat turun.`);
  };

  // Generate Duty Schedule using KPM Calendar Engine
  const handleGenerateSchedule = () => {
    if (guruPagiList.length === 0 && guruPetangList.length === 0) {
      onToast('Sila muat naik atau masukkan senarai guru sidang pagi/petang terlebih dahulu.');
      setActiveSection('muatnaik_guru');
      return;
    }

    const generatedWeeks = generateAgihanDenganSidang({
      tarikhMula: computedStartDate,
      bilanganMinggu: computedWeeksCount,
      abaikanCutiSekolah: !kecualikanCutiKPM,
      sesiSasaran,
      guruPagi: guruPagiList,
      guruPetang: guruPetangList,
      skopPagi,
      skopPetang,
      bilanganKumpulanPagi,
      bilanganKumpulanPetang,
      kaedah
    });

    setHasilAgihan(generatedWeeks);
    setIsGenerated(true);
    onToast(`Berjaya menjana takwim agihan tugas ${computedWeeksCount} minggu persekolahan KPM!`);
  };

  // Apply to Main Duty Roster (Jadual Bertugas)
  const handleApplyToActiveRoster = (mode: 'replace' | 'append') => {
    if (hasilAgihan.length === 0) return;

    const entries: JadualBertugas[] = [];

    hasilAgihan.forEach((wk) => {
      if (wk.adakahCuti) return; // do not create duty records on holiday weeks

      // Group assignments by teacher
      const teacherMap: Record<string, { skops: string[]; sidang: Sidang }> = {};

      wk.tugasan.forEach((t) => {
        if (!teacherMap[t.guruNama]) {
          teacherMap[t.guruNama] = { skops: [], sidang: t.sidang };
        }
        teacherMap[t.guruNama].skops.push(t.skop);
      });

      Object.entries(teacherMap).forEach(([namaGuru, data], idx) => {
        entries.push({
          id: `kpm-${Date.now()}-${wk.mingguKe}-${idx}`,
          mula: wk.tarikhIsnin,
          nama: namaGuru,
          kumpulan: wk.kumpulanNama,
          catatan: data.skops.join('; '),
          sidang: data.sidang,
          mingguKe: wk.mingguKe,
          created_at: new Date().toISOString()
        });
      });
    });

    const finalRoster = mode === 'replace' ? entries : [...jadual, ...entries];
    onSaveJadual(finalRoster);
    onToast(
      mode === 'replace'
        ? `Jadual utama digantikan dengan ${entries.length} rekod tugasan baharu!`
        : `Berjaya menambah ${entries.length} rekod tugasan ke jadual sedia ada!`
    );
    onNavigateToJadual();
  };

  // Export Full Generated Schedule to Excel (.xlsx)
  const handleExportFullExcel = () => {
    if (hasilAgihan.length === 0) return;

    const excelRows: Array<Record<string, unknown>> = [];

    hasilAgihan.forEach((wk) => {
      if (wk.adakahCuti) {
        excelRows.push({
          'Minggu Persekolahan': `Minggu ${wk.mingguKe}`,
          'Tarikh Mula (Isnin)': formatDDMMYYYY(wk.tarikhIsnin),
          'Julat Tarikh': formatMalayWeekRange(wk.tarikhIsnin),
          'Status / Penggal': wk.namaCuti || 'Cuti Persekolahan KPM',
          'Sidang': '—',
          'Pos / Skop Tugasan': 'CUTI PERSEKOLAHAN',
          'Nama Guru Bertugas': 'TIADA TUGAS'
        });
      } else {
        wk.tugasan.forEach((t) => {
          excelRows.push({
            'Minggu Persekolahan': `Minggu ${wk.mingguKe}`,
            'Tarikh Mula (Isnin)': formatDDMMYYYY(wk.tarikhIsnin),
            'Julat Tarikh': formatMalayWeekRange(wk.tarikhIsnin),
            'Status / Penggal': wk.kumpulanNama,
            'Sidang': t.sidang.toUpperCase(),
            'Pos / Skop Tugasan': t.skop,
            'Nama Guru Bertugas': t.guruNama
          });
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TakwimKPM_AgihanTugas');
    XLSX.writeFile(wb, `Takwim_Agihan_Tugas_KPM_${tetapan.kod_sekolah || 'SMK_Salaping'}.xlsx`, {
      bookType: 'xlsx'
    });
    onToast('Fail Excel Takwim KPM dimuat turun!');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-maroon-800" />
            <span>Agihan Tugas &amp; Takwim Persekolahan KPM</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Muat naik senarai guru sidang pagi dan petang, seterusnya jana jadual bertugas rasmi mengikut kalendar persekolahan KPM 2026/2027.
          </p>
        </div>

        {/* Section Navigation Switcher */}
        <div className="no-print inline-flex p-1 bg-stone-200/80 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSection('penjana')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'penjana'
                ? 'bg-white text-maroon-950 font-bold shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-kuning-600" />
            <span>Penjana Takwim KPM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('muatnaik_guru')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'muatnaik_guru'
                ? 'bg-white text-maroon-950 font-bold shadow-xs border-b-2 border-kuning-400'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-maroon-800" />
            <span>Muat Naik Guru Sidang Pagi/Petang</span>
          </button>
        </div>
      </div>

      {/* Teacher Session Counts Overview Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sun className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block uppercase font-semibold">Sidang Pagi</span>
              <span className="text-sm font-extrabold text-stone-900">{guruPagiList.length} Orang Guru</span>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Moon className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block uppercase font-semibold">Sidang Petang</span>
              <span className="text-sm font-extrabold text-stone-900">{guruPetangList.length} Orang Guru</span>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-maroon-100 text-maroon-900 border border-maroon-200 flex items-center justify-center font-bold">
              <Users className="w-4 h-4 text-maroon-800" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block uppercase font-semibold">Jumlah Keseluruhan Staf</span>
              <span className="text-sm font-extrabold text-stone-900">{users.length} Orang</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSection === 'penjana' && (
            <button
              type="button"
              onClick={() => setActiveSection('muatnaik_guru')}
              className="text-xs font-bold text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              + Muat Naik / Tambah Guru
            </button>
          )}
          <button
            type="button"
            onClick={handleClearTeachers}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Kosongkan senarai guru jika ingin mengisi senarai sebenar dari awal"
          >
            Kosongkan Guru
          </button>
        </div>
      </div>

      {/* SECTION 1: UPLOAD GURU SIDANG PAGI & SIDANG PETANG */}
      {activeSection === 'muatnaik_guru' && (
        <div className="space-y-6 no-print">
          {/* Box 1: File Uploader (Excel / CSV) */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-maroon-800" />
                  <span>Muat Naik Fail Senarai Guru (Excel / CSV)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Muat naik fail mengikut sidang atau muat naik satu fail induk yang mempunyai lajur &apos;Sidang&apos;.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTeacherTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-maroon-800" />
                  <span>Templat Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTeacherTemplate('csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Templat CSV</span>
                </button>
              </div>
            </div>

            {uploadMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  uploadMsg.success
                    ? 'bg-maroon-50 text-maroon-900 border border-maroon-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {uploadMsg.success ? (
                  <CheckCircle2 className="w-4 h-4 text-maroon-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{uploadMsg.text}</span>
              </div>
            )}

            {/* Two Side-by-Side Dropzones: Pagi vs Petang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Dropzone Sidang Pagi */}
              <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 transition-colors text-center">
                <Sun className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                  Muat Naik Guru Sidang Pagi
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 mb-3">
                  Pilih fail senarai guru yang mengajar di Sidang Pagi (.xlsx, .csv).
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih Fail Sidang Pagi</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => handleUploadTeacherFile(e, 'pagi')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Dropzone Sidang Petang */}
              <div className="p-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors text-center">
                <Moon className="w-7 h-7 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                  Muat Naik Guru Sidang Petang
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 mb-3">
                  Pilih fail senarai guru yang mengajar di Sidang Petang (.xlsx, .csv).
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Pilih Fail Sidang Petang</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => handleUploadTeacherFile(e, 'petang')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Combined Single File Option */}
            <div className="pt-2 text-center border-t border-stone-100">
              <label className="text-xs font-semibold text-maroon-800 hover:text-maroon-950 underline cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Atau muat naik satu fail gabungan (mengandungi lajur nama dan sidang)</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => handleUploadTeacherFile(e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Box 2: Quick Text Paste (Salin & Tampal Senarai Guru) */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
              <FileText className="w-4 h-4 text-maroon-800" />
              <h3 className="font-bold text-stone-900 text-sm">
                Tampal Senarai Nama (Quick Paste dari WhatsApp / Word)
              </h3>
            </div>
            <p className="text-xs text-stone-600">
              Salin senarai nama guru dari mana-mana dokumen dan tampal di bawah (satu nama bagi setiap baris).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Senarai Guru Sidang Pagi (Satu nama sebaris)</span>
                </label>
                <textarea
                  value={quickPastePagi}
                  onChange={(e) => setQuickPastePagi(e.target.value)}
                  rows={5}
                  placeholder="Contoh:&#10;Cikgu Muhammad Faiz bin Azlan&#10;Cikgu Dayang Roziana binti Jamil&#10;Ustaz Mohd Hanafi bin Razali"
                  className="w-full text-xs p-3 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Senarai Guru Sidang Petang (Satu nama sebaris)</span>
                </label>
                <textarea
                  value={quickPastePetang}
                  onChange={(e) => setQuickPastePetang(e.target.value)}
                  rows={5}
                  placeholder="Contoh:&#10;Cikgu Alexius Justin&#10;Ustazah Maryam binti Kassim&#10;Cikgu Brenda Wong"
                  className="w-full text-xs p-3 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveQuickPaste}
                className="px-4 py-2 rounded-lg bg-maroon-800 hover:bg-maroon-900 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs border-b-2 border-kuning-400"
              >
                Simpan &amp; Import Nama Guru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: PENJANA TAKWIM & JADUAL BERTUGAS KPM */}
      {activeSection === 'penjana' && (
        <div className="space-y-6">
          {/* Configuration Form Card */}
          <div className="no-print bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-maroon-800" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Parameter Penjana Takwim Persekolahan KPM 2026/2027
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-maroon-900 bg-maroon-50 px-2.5 py-0.5 rounded-full border border-maroon-200">
                Sesi 2026: 42 Minggu Persekolahan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Tempoh Penggal KPM */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tempoh / Penggal Persekolahan
                </label>
                <select
                  value={tempohMod}
                  onChange={(e) => setTempohMod(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 text-stone-800"
                >
                  <option value="semua_42">Seluruh Sesi Persekolahan KPM (42 Minggu)</option>
                  <option value="penggal1">Penggal 1 KPM Sahaja (10 Minggu Persekolahan)</option>
                  <option value="penggal2">Penggal 2 KPM Sahaja (12 Minggu Persekolahan)</option>
                  <option value="penggal3">Penggal 3 KPM Sahaja (16 Minggu Persekolahan)</option>
                  <option value="manual">Pilihan Manual (Tentukan Sendiri)</option>
                </select>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Tarikh Mula: {formatDDMMYYYY(computedStartDate)}
                </span>
              </div>

              {/* 2. Sesi Sidang Sasaran */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Sidang Persekolahan Yang Dijana
                </label>
                <select
                  value={sesiSasaran}
                  onChange={(e) => setSesiSasaran(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 text-stone-800"
                >
                  <option value="kedua">Kedua-dua Sidang (Pagi &amp; Petang Serentak)</option>
                  <option value="pagi">Sidang Pagi Sahaja</option>
                  <option value="petang">Sidang Petang Sahaja</option>
                </select>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  {sesiSasaran === 'kedua'
                    ? `Pagi: ${guruPagiList.length} guru | Petang: ${guruPetangList.length} guru`
                    : sesiSasaran === 'pagi'
                    ? `Pagi: ${guruPagiList.length} orang guru`
                    : `Petang: ${guruPetangList.length} orang guru`}
                </span>
              </div>

              {/* 3. Kaedah Agihan */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kaedah Putaran Tugas
                </label>
                <select
                  value={kaedah}
                  onChange={(e) => setKaedah(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 text-stone-800"
                >
                  <option value="kumpulan">Putaran Berkumpulan Tetap (Kumpulan 1, 2, 3...)</option>
                  <option value="seimbang">Giliran Berseimbang (Round-Robin Adil)</option>
                  <option value="rawak">Kocokan Rawak Terkawal</option>
                </select>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  {kaedah === 'kumpulan'
                    ? `Pagi: ${bilanganKumpulanPagi} kump. | Petang: ${bilanganKumpulanPetang} kump.`
                    : 'Beban diagihkan sama rata'}
                </span>
              </div>
            </div>

            {/* Checkbox: Kecualikan Cuti Persekolahan KPM */}
            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={kecualikanCutiKPM}
                  onChange={(e) => setKecualikanCutiKPM(e.target.checked)}
                  className="rounded text-maroon-800 focus:ring-maroon-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  Kecualikan Minggu Cuti Penggal KPM (Tiada tugasan guru dijana semasa Cuti Penggal 1, 2, dan 3)
                </span>
              </label>

              <button
                type="button"
                onClick={handleGenerateSchedule}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-800 hover:from-maroon-900 hover:to-maroon-750 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all border border-kuning-400/40"
              >
                <Sparkles className="w-4 h-4 text-kuning-400" />
                <span>Jana Takwim Agihan KPM Sekarang</span>
              </button>
            </div>
          </div>

          {/* Generated Results & Preview Section */}
          {isGenerated && (
            <div className="space-y-6">
              {/* Action Bar: Apply to Active Schedule & Export */}
              <div className="no-print bg-maroon-50 border border-maroon-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-maroon-800" />
                    <h3 className="font-bold text-maroon-950 text-base">
                      Takwim Agihan KPM Berjaya Dijana ({hasilAgihan.length} Minggu)
                    </h3>
                  </div>
                  <p className="text-xs text-maroon-900 mt-1 max-w-2xl leading-relaxed">
                    Sistem telah menyusun guru mengikut sidang dan minggu persekolahan KPM 2026. Anda boleh memasukkannya ke dalam takwim jadual bertugas utama atau memuat turun fail Excel.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyToActiveRoster('replace')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer border-b-2 border-kuning-400"
                    title="Gantikan semua jadual dengan agihan KPM ini"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Gantikan Jadual Utama</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportFullExcel}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-maroon-50 text-maroon-950 font-bold text-xs border border-maroon-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-maroon-800" />
                    <span>Eksport Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs border border-stone-300 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-stone-500" />
                    <span>Cetak Takwim</span>
                  </button>
                </div>
              </div>

              {/* Printable Official Document / Full Table */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-8 card-print-clean">
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-stone-900 pb-4 mb-6">
                  <div className="inline-flex items-center justify-center mb-2">
                    <SmkSalapingLogo className="w-16 h-16 sm:w-20 sm:h-20" alt="Logo SMK Salaping" logoUrl={tetapan.logo_url} />
                  </div>
                  <h1 className="text-base sm:text-xl font-bold uppercase font-serif-report tracking-wide text-stone-950">
                    {tetapan.sekolah}
                  </h1>
                  <p className="text-xs font-semibold text-stone-600 mt-0.5">
                    KOD SEKOLAH: {tetapan.kod_sekolah} &bull; SESI: {tetapan.sesi} &bull; MOTO: &quot;{tetapan.moto}&quot;
                  </p>
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-stone-900 mt-3 pt-2 border-t border-stone-300">
                    TAKWIM AGIHAN TUGAS GURU BERTUGAS MINGGUAN KPM
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Sidang Persekolahan: {sesiSasaran === 'kedua' ? 'Sidang Pagi & Sidang Petang' : sesiSasaran === 'pagi' ? 'Sidang Pagi Sahaja' : 'Sidang Petang Sahaja'}
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs print-table border-collapse border border-stone-300">
                    <thead className="bg-stone-100 text-stone-800 font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 border border-stone-300 w-28">Minggu / Tarikh</th>
                        <th className="py-2.5 px-3 border border-stone-300 w-36">Kumpulan / Status</th>
                        <th className="py-2.5 px-3 border border-stone-300">Guru Bertugas &amp; Pos Tugasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {hasilAgihan.map((wk) => {
                        if (wk.adakahCuti) {
                          return (
                            <tr key={wk.mingguKe} className="bg-amber-50/50">
                              <td className="py-2.5 px-3 border border-stone-300 whitespace-nowrap">
                                <span className="font-bold text-stone-900 block">Minggu {wk.mingguKe}</span>
                                <span className="text-[11px] text-stone-500 block">{formatDDMMYYYY(wk.tarikhIsnin)}</span>
                              </td>
                              <td colSpan={2} className="py-2.5 px-3 border border-stone-300">
                                <div className="flex items-center gap-2 font-bold text-amber-900">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-amber-200 text-amber-900">
                                    CUTI PERSEKOLAHAN
                                  </span>
                                  <span>{wk.namaCuti || 'Cuti Penggal KPM'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Separate tasks into morning and afternoon
                        const tasksPagi = wk.tugasan.filter((t) => t.sidang === 'pagi');
                        const tasksPetang = wk.tugasan.filter((t) => t.sidang === 'petang');

                        return (
                          <tr key={wk.mingguKe} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-2.5 px-3 border border-stone-300 whitespace-nowrap align-top">
                              <span className="font-bold text-stone-900 block">Minggu {wk.mingguKe}</span>
                              <span className="text-[11px] text-stone-600 block mt-0.5">
                                {formatDDMMYYYY(wk.tarikhIsnin)}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {formatMalayWeekRange(wk.tarikhIsnin)}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 border border-stone-300 align-top whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-maroon-50 text-maroon-900 border border-maroon-200">
                                {wk.kumpulanNama}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 border border-stone-300 align-top">
                              <div className="space-y-3">
                                {/* Sidang Pagi Tasks */}
                                {tasksPagi.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded inline-flex items-center gap-1 uppercase">
                                      <Sun className="w-3 h-3" />
                                      <span>Sidang Pagi</span>
                                    </span>
                                    <div className="space-y-1 pl-1">
                                      {tasksPagi.map((t, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-[11px]">
                                          <span className="font-semibold text-stone-700 min-w-[250px]">
                                            &bull; {t.skop}:
                                          </span>
                                          <span className="font-bold text-stone-950">
                                            {t.guruNama}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sidang Petang Tasks */}
                                {tasksPetang.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-stone-100">
                                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded inline-flex items-center gap-1 uppercase">
                                      <Moon className="w-3 h-3" />
                                      <span>Sidang Petang</span>
                                    </span>
                                    <div className="space-y-1 pl-1">
                                      {tasksPetang.map((t, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-[11px]">
                                          <span className="font-semibold text-stone-700 min-w-[250px]">
                                            &bull; {t.skop}:
                                          </span>
                                          <span className="font-bold text-stone-950">
                                            {t.guruNama}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Signatures for Print */}
                <div className="pt-10 border-t border-stone-300 mt-8 print-avoid-break">
                  <div className="grid grid-cols-2 gap-12 text-xs">
                    <div>
                      <p className="text-stone-600 mb-14">Disediakan oleh:</p>
                      <div className="border-t border-stone-800 pt-1.5">
                        <p className="font-bold text-stone-900">Penyelaras Guru Bertugas (Pagi &amp; Petang)</p>
                        <p className="text-stone-500">SMK Salaping, Kota Marudu</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-stone-600 mb-14">Disahkan oleh:</p>
                      <div className="border-t border-stone-800 pt-1.5">
                        <p className="font-bold text-stone-900">{tetapan.pentadbir}</p>
                        <p className="text-stone-500">{tetapan.jawatan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
