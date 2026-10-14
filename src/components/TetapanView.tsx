import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  School,
  Image as ImageIcon,
  Calendar,
  Users,
  Database,
  Upload,
  Download,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  FileSpreadsheet,
  Eye,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  PenTool,
  RefreshCw,
  X,
  Phone,
  Mail,
  Sun,
  Moon,
  Clock,
  ExternalLink
} from 'lucide-react';
import { TetapanSekolah, UserProfile, JadualBertugas, Sidang } from '../types';
import { SmkSalapingLogo } from './SmkSalapingLogo';
import { compressImage } from '../lib/imageUtils';
import { getMonday, formatMalayWeekRange, formatDDMMYYYY, parseDateInput } from '../lib/dateUtils';

interface TetapanViewProps {
  tetapan: TetapanSekolah;
  onSaveTetapan: (updated: TetapanSekolah) => void;
  users: UserProfile[];
  onSaveUsers: (updated: UserProfile[]) => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  jadual: JadualBertugas[];
  onSaveJadual: (updated: JadualBertugas[]) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetDemo: () => void;
  onToast: (msg: string) => void;
}

type SubTab = 'profil' | 'imej' | 'jadual' | 'guru' | 'sandaran';

export const TetapanView: React.FC<TetapanViewProps> = ({
  tetapan,
  onSaveTetapan,
  users,
  onSaveUsers,
  currentUser,
  onSelectUser,
  jadual,
  onSaveJadual,
  onExportBackup,
  onImportBackup,
  onResetDemo,
  onToast
}) => {
  const isAdmin = currentUser.peranan === 'pentadbir';
  const [activeTab, setActiveTab] = useState<SubTab>('profil');

  // ==========================================
  // TAB 1: PROFIL SEKOLAH STATE
  // ==========================================
  const [sekolah, setSekolah] = useState(tetapan.sekolah || '');
  const [kodSekolah, setKodSekolah] = useState(tetapan.kod_sekolah || '');
  const [alamat, setAlamat] = useState(tetapan.alamat || '');
  const [telefonSekolah, setTelefonSekolah] = useState(tetapan.telefon_sekolah || '');
  const [emelSekolah, setEmelSekolah] = useState(tetapan.emel_sekolah || '');
  const [pentadbir, setPentadbir] = useState(tetapan.pentadbir || '');
  const [jawatan, setJawatan] = useState(tetapan.jawatan || '');
  const [sesi, setSesi] = useState(tetapan.sesi || '');
  const [moto, setMoto] = useState(tetapan.moto || '');

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TetapanSekolah = {
      ...tetapan,
      sekolah: sekolah.trim(),
      kod_sekolah: kodSekolah.trim(),
      alamat: alamat.trim(),
      telefon_sekolah: telefonSekolah.trim(),
      emel_sekolah: emelSekolah.trim(),
      pentadbir: pentadbir.trim(),
      jawatan: jawatan.trim(),
      sesi: sesi.trim(),
      moto: moto.trim()
    };
    onSaveTetapan(updated);

    if (pentadbir.trim()) {
      const updatedUsers = users.map((u) => {
        if (u.peranan === 'pentadbir' && (u.id === 'u-admin-1' || users.filter((x) => x.peranan === 'pentadbir').length === 1)) {
          return { ...u, nama: pentadbir.trim(), jawatan: jawatan.trim() || u.jawatan };
        }
        return u;
      });
      onSaveUsers(updatedUsers);
    }

    onToast('Maklumat profil sekolah berjaya disimpan!');
  };

  // ==========================================
  // TAB 2: IMEJ & LOGO STATE
  // ==========================================
  const [customLogoUrl, setCustomLogoUrl] = useState(tetapan.logo_url || '');
  const [customCapUrl, setCustomCapUrl] = useState(tetapan.cap_url || '');
  const [customTandatanganUrl, setCustomTandatanganUrl] = useState(tetapan.tandatangan_url || '');
  const [urlInputLogo, setUrlInputLogo] = useState('');
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  // Logo file upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Sila pilih fail imej yang sah (PNG, JPG, SVG, WebP).');
      return;
    }

    try {
      setIsProcessingImg(true);
      const compressed = await compressImage(file, 600, 600, 0.9);
      setCustomLogoUrl(compressed);
      const updated: TetapanSekolah = {
        ...tetapan,
        logo_url: compressed
      };
      onSaveTetapan(updated);
      onToast('Logo utama sekolah berjaya dimuat naik & disimpan!');
    } catch (err) {
      console.error(err);
      onToast('Gagal memproses fail logo.');
    } finally {
      setIsProcessingImg(false);
      e.target.value = '';
    }
  };

  // Reset logo to SMK Salaping default SVG
  const handleResetDefaultLogo = () => {
    setCustomLogoUrl('');
    const updated: TetapanSekolah = {
      ...tetapan,
      logo_url: undefined
    };
    onSaveTetapan(updated);
    onToast('Logo telah ditetapkan semula kepada lencana rasmi default SMK Salaping.');
  };

  // Cap Mohor upload handler
  const handleCapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImg(true);
      const compressed = await compressImage(file, 400, 400, 0.85);
      setCustomCapUrl(compressed);
      const updated: TetapanSekolah = {
        ...tetapan,
        cap_url: compressed
      };
      onSaveTetapan(updated);
      onToast('Cap mohor rasmi sekolah berjaya dimuat naik!');
    } catch (err) {
      console.error(err);
      onToast('Gagal memproses fail cap rasmi.');
    } finally {
      setIsProcessingImg(false);
      e.target.value = '';
    }
  };

  // Tandatangan Pentadbir upload handler
  const handleTandatanganUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingImg(true);
      const compressed = await compressImage(file, 500, 300, 0.9);
      setCustomTandatanganUrl(compressed);
      const updated: TetapanSekolah = {
        ...tetapan,
        tandatangan_url: compressed
      };
      onSaveTetapan(updated);
      onToast('Tandatangan digital pentadbir berjaya dimuat naik!');
    } catch (err) {
      console.error(err);
      onToast('Gagal memproses fail tandatangan.');
    } finally {
      setIsProcessingImg(false);
      e.target.value = '';
    }
  };

  // Set logo via external URL
  const handleApplyLogoUrl = () => {
    if (!urlInputLogo.trim()) {
      onToast('Sila masukkan URL pautan imej.');
      return;
    }
    setCustomLogoUrl(urlInputLogo.trim());
    const updated: TetapanSekolah = {
      ...tetapan,
      logo_url: urlInputLogo.trim()
    };
    onSaveTetapan(updated);
    setUrlInputLogo('');
    onToast('Logo melalui pautan URL berjaya disimpan!');
  };

  // ==========================================
  // TAB 3: MUAT NAIK JADUAL BERTUGAS STATE
  // ==========================================
  const [jadualImportMode, setJadualImportMode] = useState<'replace' | 'append'>('replace');
  const [jadualPreview, setJadualPreview] = useState<JadualBertugas[] | null>(null);
  const [jadualFileName, setJadualFileName] = useState('');
  const [isProcessingJadual, setIsProcessingJadual] = useState(false);

  // File Parser for Duty Roster (.xlsx, .csv)
  const handleJadualFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJadualFileName(file.name);
    setIsProcessingJadual(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

      if (rawData.length < 2) {
        onToast('Fail jadual kosong atau tiada baris data.');
        setIsProcessingJadual(false);
        return;
      }

      // Detect header row
      const headerRow = (rawData[0] || []).map((col) =>
        String(col || '').trim().toLowerCase()
      );

      const findColIdx = (patterns: RegExp[]) => {
        return headerRow.findIndex((col) => patterns.some((p) => p.test(col)));
      };

      const dateIdx = findColIdx([/tarikh/i, /mula/i, /isnin/i, /minggu/i, /date/i]);
      const namaIdx = findColIdx([/nama/i, /guru/i, /teacher/i, /petugas/i]);
      const kumpulanIdx = findColIdx([/kumpulan/i, /kump/i, /group/i, /pasukan/i]);
      const catatanIdx = findColIdx([/catatan/i, /tugas/i, /skop/i, /peranan/i, /remark/i]);
      const sidangIdx = findColIdx([/sidang/i, /sesi/i, /session/i]);

      const parsed: JadualBertugas[] = [];
      const rows = rawData.slice(1);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const namaVal = namaIdx !== -1 && row[namaIdx] ? String(row[namaIdx]).trim() : '';
        if (!namaVal) continue;

        let dateVal = '';
        if (dateIdx !== -1 && row[dateIdx] !== undefined) {
          const rawCell = row[dateIdx];
          if (typeof rawCell === 'number') {
            const parsedJsDate = XLSX.SSF.parse_date_code(rawCell);
            if (parsedJsDate) {
              const y = parsedJsDate.y;
              const m = String(parsedJsDate.m).padStart(2, '0');
              const d = String(parsedJsDate.d).padStart(2, '0');
              dateVal = `${y}-${m}-${d}`;
            }
          } else {
            const parsedStr = parseDateInput(String(rawCell));
            if (parsedStr) dateVal = parsedStr;
          }
        }

        const validMonday = dateVal ? getMonday(dateVal) : getMonday(new Date().toISOString().slice(0, 10));
        const kumpVal = kumpulanIdx !== -1 && row[kumpulanIdx] ? String(row[kumpulanIdx]).trim() : undefined;
        const catVal = catatanIdx !== -1 && row[catatanIdx] ? String(row[catatanIdx]).trim() : 'Guru Bertugas';
        
        let sVal: Sidang | undefined = undefined;
        if (sidangIdx !== -1 && row[sidangIdx]) {
          const rawS = String(row[sidangIdx]).toLowerCase();
          if (rawS.includes('petang')) sVal = 'petang';
          else if (rawS.includes('pagi')) sVal = 'pagi';
        }

        parsed.push({
          id: 'j-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substr(2, 4),
          mula: validMonday,
          nama: namaVal,
          kumpulan: kumpVal,
          catatan: catVal,
          sidang: sVal,
          created_at: new Date().toISOString()
        });
      }

      if (parsed.length === 0) {
        onToast('Tiada rekod guru berjaya dikesan dalam fail ini. Sila semak lajur fail.');
      } else {
        setJadualPreview(parsed);
        onToast(`${parsed.length} rekod jadual berjaya dikesan daripada fail ${file.name}.`);
      }
    } catch (err) {
      console.error(err);
      onToast('Ralat semasa membaca fail jadual Excel/CSV.');
    } finally {
      setIsProcessingJadual(false);
      e.target.value = '';
    }
  };

  // Commit imported roster to active schedule
  const handleConfirmImportJadual = () => {
    if (!jadualPreview || jadualPreview.length === 0) return;

    if (jadualImportMode === 'replace') {
      onSaveJadual(jadualPreview);
      onToast(`Jadual sedia ada digantikan dengan ${jadualPreview.length} rekod baharu!`);
    } else {
      const merged = [...jadual, ...jadualPreview];
      onSaveJadual(merged);
      onToast(`${jadualPreview.length} rekod baharu ditambah ke dalam jadual utama!`);
    }

    setJadualPreview(null);
    setJadualFileName('');
  };

  // Download Sample Roster Template
  const handleDownloadJadualTemplate = (format: 'xlsx' | 'csv') => {
    const sampleMonday = getMonday(new Date().toISOString().slice(0, 10));
    const activeGurus = users.filter((u) => u.peranan === 'guru');
    const sampleData = activeGurus.length > 0
      ? activeGurus.slice(0, 4).map((g, idx) => ({
          'Tarikh Mula Minggu': sampleMonday,
          'Nama Guru Bertugas': g.nama,
          'Kumpulan': `Kumpulan ${Math.floor(idx / 2) + 1}`,
          'Catatan / Skop': idx === 0 ? 'Ketua Guru Bertugas (Laporan Rasmi)' : 'Pengawasan Kawasan & Disiplin',
          'Sidang': (g.sidang || 'Pagi').charAt(0).toUpperCase() + (g.sidang || 'pagi').slice(1)
        }))
      : [
          {
            'Tarikh Mula Minggu': sampleMonday,
            'Nama Guru Bertugas': 'Nama Guru Bertugas 1',
            'Kumpulan': 'Kumpulan 1',
            'Catatan / Skop': 'Ketua Guru Bertugas (Laporan Rasmi)',
            'Sidang': 'Pagi'
          },
          {
            'Tarikh Mula Minggu': sampleMonday,
            'Nama Guru Bertugas': 'Nama Guru Bertugas 2',
            'Kumpulan': 'Kumpulan 1',
            'Catatan / Skop': 'Kawalan Pintu Pagar & Perhimpunan',
            'Sidang': 'Pagi'
          }
        ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JadualBertugas');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'Templat_Jadual_Guru_Bertugas.xlsx');
    } else {
      XLSX.writeFile(wb, 'Templat_Jadual_Guru_Bertugas.csv');
    }
    onToast(`Templat jadual ${format.toUpperCase()} dimuat turun.`);
  };

  // Clear All Roster entries
  const handleClearAllJadual = () => {
    if (jadual.length === 0) {
      onToast('Jadual sudah sedia kosong.');
      return;
    }
    if (
      window.confirm(
        `Adakah anda pasti mahu memadam kesemua ${jadual.length} rekod jadual bertugas? Tindakan ini tidak boleh diundur.`
      )
    ) {
      onSaveJadual([]);
      onToast('Kesemua rekod jadual bertugas telah dikosongkan.');
    }
  };

  // ==========================================
  // TAB 4: DIREKTORI GURU & PENGGUNA STATE
  // ==========================================
  const [searchTeacher, setSearchTeacher] = useState('');
  const [filterSidang, setFilterSidang] = useState<'all' | 'pagi' | 'petang' | 'kedua'>('all');
  const [filterPeranan, setFilterPeranan] = useState<'all' | 'guru' | 'pentadbir'>('all');
  
  // Add Teacher
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJawatan, setNewJawatan] = useState('Guru Akademik');
  const [newPeranan, setNewPeranan] = useState<'guru' | 'pentadbir'>('guru');
  const [newSidang, setNewSidang] = useState<Sidang>('pagi');
  const [newTelefon, setNewTelefon] = useState('');
  const [newKataLaluan, setNewKataLaluan] = useState('delima123');
  const [newGred, setNewGred] = useState('DG41');

  // Edit Teacher Modal
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) {
      onToast('Sila masukkan nama guru.');
      return;
    }

    const cleanEmail =
      newEmail.trim() ||
      `g-${newNama.toLowerCase().replace(/[^a-z0-9]/g, '')}@moe-dl.edu.my`;

    const newU: UserProfile = {
      id: 'u-' + Date.now(),
      nama: newNama.trim(),
      email: cleanEmail,
      jawatan: newJawatan.trim() || 'Guru Akademik',
      peranan: newPeranan,
      sidang: newSidang,
      gred: newGred.trim() || 'DG41',
      telefon: newTelefon.trim() || undefined,
      kata_laluan: newKataLaluan.trim() || 'delima123'
    };

    onSaveUsers([...users, newU]);
    setNewNama('');
    setNewEmail('');
    setNewJawatan('Guru Akademik');
    setNewTelefon('');
    setNewKataLaluan('delima123');
    setNewGred('DG41');
    setShowAddTeacher(false);
    onToast(`Akaun untuk ${newU.nama} berjaya didaftarkan!`);
  };

  const handleSaveEditedTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.nama.trim()) return;

    const updated = users.map((u) => (u.id === editingTeacher.id ? editingTeacher : u));
    onSaveUsers(updated);

    if (currentUser.id === editingTeacher.id) {
      onSelectUser(editingTeacher);
    }

    setEditingTeacher(null);
    onToast(`Maklumat guru ${editingTeacher.nama} berjaya dikemaskini.`);
  };

  const handleDeleteTeacher = (id: string, nama: string) => {
    if (users.length <= 1) {
      onToast('Tidak boleh memadamkan satu-satunya pengguna dalam sistem.');
      return;
    }
    if (id === currentUser.id) {
      onToast('Anda tidak boleh memadam akaun yang sedang anda aktifkan.');
      return;
    }
    if (!window.confirm(`Adakah anda pasti untuk memadam profil guru: ${nama}?`)) {
      return;
    }
    const updated = users.filter((u) => u.id !== id);
    onSaveUsers(updated);
    onToast(`Pengguna ${nama} telah dipadam.`);
  };

  // Bulk Upload Teachers (.xlsx, .csv)
  const handleBulkTeacherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

      if (rawData.length < 2) {
        onToast('Fail senarai guru kosong.');
        return;
      }

      const headerRow = (rawData[0] || []).map((c) => String(c || '').toLowerCase().trim());
      const namaIdx = headerRow.findIndex((c) => /nama/i.test(c));
      const sidangIdx = headerRow.findIndex((c) => /sidang|sesi/i.test(c));
      const jawatanIdx = headerRow.findIndex((c) => /jawatan|tugas/i.test(c));
      const perananIdx = headerRow.findIndex((c) => /peranan|role/i.test(c));

      const newTeachers: UserProfile[] = [];
      const rows = rawData.slice(1);

      rows.forEach((row, i) => {
        const r = row;
        if (!r || r.length === 0) return;
        const nVal = namaIdx !== -1 && r[namaIdx] ? String(r[namaIdx]).trim() : '';
        if (!nVal) return;

        let sVal: Sidang = 'pagi';
        if (sidangIdx !== -1 && r[sidangIdx]) {
          const strS = String(r[sidangIdx]).toLowerCase();
          if (strS.includes('petang')) sVal = 'petang';
          else if (strS.includes('kedua')) sVal = 'kedua';
        }

        const jVal = jawatanIdx !== -1 && r[jawatanIdx] ? String(r[jawatanIdx]).trim() : 'Guru Akademik';
        let pVal: 'guru' | 'pentadbir' = 'guru';
        if (perananIdx !== -1 && r[perananIdx]) {
          const strP = String(r[perananIdx]).toLowerCase();
          if (strP.includes('pentadbir') || strP.includes('admin') || strP.includes('pengetua')) pVal = 'pentadbir';
        }

        const cleanSlug = nVal.toLowerCase().replace(/[^a-z0-9]/g, '');
        newTeachers.push({
          id: 'u-' + Date.now() + '-' + i,
          nama: nVal,
          email: `g-${cleanSlug || 'guru' + i}@moe-dl.edu.my`,
          jawatan: jVal,
          peranan: pVal,
          sidang: sVal,
          gred: 'DG41',
          kata_laluan: pVal === 'pentadbir' ? 'admin123' : 'delima123'
        });
      });

      if (newTeachers.length === 0) {
        onToast('Tiada rekod nama guru dikesan dalam fail.');
      } else {
        onSaveUsers([...users, ...newTeachers]);
        onToast(`${newTeachers.length} orang guru berjaya ditambah ke direktori!`);
      }
    } catch (err) {
      console.error(err);
      onToast('Ralat semasa membaca fail senarai guru.');
    } finally {
      e.target.value = '';
    }
  };

  // Download Teacher Template
  const handleDownloadTeacherTemplate = () => {
    const existingUsers = users.filter((u) => u.peranan === 'guru');
    const sampleData = existingUsers.length > 0
      ? existingUsers.slice(0, 5).map((u) => ({
          'Nama Guru': u.nama,
          'Sidang': (u.sidang || 'Pagi').charAt(0).toUpperCase() + (u.sidang || 'pagi').slice(1),
          'Jawatan': u.jawatan || 'Guru Akademik',
          'Peranan': u.peranan === 'pentadbir' ? 'Pentadbir' : 'Guru'
        }))
      : [
          {
            'Nama Guru': 'Nama Guru 1',
            'Sidang': 'Pagi',
            'Jawatan': 'Guru Akademik',
            'Peranan': 'Guru'
          },
          {
            'Nama Guru': 'Nama Guru 2',
            'Sidang': 'Pagi',
            'Jawatan': 'Guru Akademik',
            'Peranan': 'Guru'
          },
          {
            'Nama Guru': 'Nama Guru 3',
            'Sidang': 'Petang',
            'Jawatan': 'Guru Akademik',
            'Peranan': 'Guru'
          }
        ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SenaraiGuru');
    XLSX.writeFile(wb, 'Templat_Senarai_Guru.xlsx');
    onToast('Templat senarai guru Excel dimuat turun.');
  };

  // Filtered teachers list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama.toLowerCase().includes(searchTeacher.toLowerCase()) ||
        u.jawatan.toLowerCase().includes(searchTeacher.toLowerCase());
      const matchSidang =
        filterSidang === 'all' || (u.sidang || 'pagi') === filterSidang || u.sidang === 'kedua';
      const matchPeranan = filterPeranan === 'all' || u.peranan === filterPeranan;
      return matchSearch && matchSidang && matchPeranan;
    });
  }, [users, searchTeacher, filterSidang, filterPeranan]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-maroon-800 text-xs font-bold uppercase tracking-wider mb-1">
            <School className="w-4 h-4" />
            <span>Pusat Kawalan &amp; Konfigurasi Sistem</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Ruang Tetapan &amp; Pengurusan Data Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Sunting maklumat sekolah, muat naik logo &amp; imej lencana, import fail jadual bertugas (.xlsx / .csv), serta urus direktori guru mengikut sidang.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto bg-stone-50 p-2.5 rounded-xl border border-stone-200">
          <div className="w-12 h-12 bg-white rounded-lg p-1 border border-stone-200 flex items-center justify-center shrink-0">
            <SmkSalapingLogo className="w-full h-full" alt="Lencana Sekolah" logoUrl={tetapan.logo_url} />
          </div>
          <div className="text-left text-xs">
            <span className="font-bold text-stone-900 block truncate max-w-[180px]">
              {tetapan.sekolah}
            </span>
            <span className="text-[11px] text-stone-500 block">
              Kod: {tetapan.kod_sekolah || '-'} &bull; Sesi {tetapan.sesi}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Sub-Tab Pill Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/80 rounded-xl overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profil'
              ? 'bg-white text-maroon-950 shadow-xs font-bold border-b-2 border-kuning-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <School className="w-4 h-4 text-maroon-800" />
          <span>Profil Sekolah</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('imej')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'imej'
              ? 'bg-white text-maroon-950 shadow-xs font-bold border-b-2 border-kuning-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-indigo-600" />
          <span>Imej &amp; Logo</span>
          {tetapan.logo_url && (
            <span className="w-2 h-2 rounded-full bg-kuning-500 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('jadual')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'jadual'
              ? 'bg-white text-maroon-950 shadow-xs font-bold border-b-2 border-kuning-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Muat Naik Jadual Bertugas</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-200 text-stone-700 font-bold">
            {jadual.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guru')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'guru'
              ? 'bg-white text-maroon-950 shadow-xs font-bold border-b-2 border-kuning-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600" />
          <span>Direktori Guru &amp; Sidang</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-stone-200 text-stone-700 font-bold">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sandaran')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sandaran'
              ? 'bg-white text-maroon-950 shadow-xs font-bold border-b-2 border-kuning-400'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Database className="w-4 h-4 text-rose-600" />
          <span>Sandaran &amp; Sistem</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL SEKOLAH */}
      {/* ========================================================================= */}
      {activeTab === 'profil' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <School className="w-5 h-5 text-maroon-800" />
                <span>Maklumat Rasmi Profil Sekolah</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Maklumat ini akan dicetak secara automatik pada kepala surat, laporan harian, takwim, dan dokumen rasmi KPM.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSchool} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Penuh Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sekolah}
                  onChange={(e) => setSekolah(e.target.value)}
                  placeholder="Contoh: SMK Salaping, Kota Marudu"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kod Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={kodSekolah}
                  onChange={(e) => setKodSekolah(e.target.value)}
                  placeholder="XEA5101"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 uppercase font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Alamat Surat-Menyurat Sekolah
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Peti Surat 248, 89108 Kota Marudu, Sabah"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  No. Telefon Pejabat
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={telefonSekolah}
                    onChange={(e) => setTelefonSekolah(e.target.value)}
                    placeholder="088-661234"
                    className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Emel Rasmi Sekolah
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emelSekolah}
                    onChange={(e) => setEmelSekolah(e.target.value)}
                    placeholder="xea5101@moe.edu.my"
                    className="w-full text-xs sm:text-sm pl-9 pr-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Pentadbir / Pengesah Laporan Rasmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pentadbir}
                  onChange={(e) => setPentadbir(e.target.value)}
                  placeholder="Nama Pengetua / Guru Besar"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 font-semibold"
                  required
                />
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Nama ini dipaparkan di bawah ruangan tanda tangan pengesahan mingguan.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jawatan Pentadbir Pengesah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={jawatan}
                  onChange={(e) => setJawatan(e.target.value)}
                  placeholder="Pengetua / PK Hal Ehwal Murid"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600 font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sesi Persekolahan
                </label>
                <input
                  type="text"
                  value={sesi}
                  onChange={(e) => setSesi(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Moto Sekolah
                </label>
                <input
                  type="text"
                  value={moto}
                  onChange={(e) => setMoto(e.target.value)}
                  placeholder="Ilmuan Gemilang"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-600"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer border-b-2 border-kuning-400"
              >
                <Save className="w-4 h-4 text-kuning-300" />
                <span>Simpan Maklumat Profil Sekolah</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: IMEJ & LOGO UTAMA */}
      {/* ========================================================================= */}
      {activeTab === 'imej' && (
        <div className="space-y-6">
          {/* Card 1: Logo / Lencana Utama */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <span>Logo &amp; Lencana Utama Sekolah</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Logo ini akan dipaparkan di bahagian atas sistem (Header), kepala surat laporan mingguan (Letterhead), dan cetakan PDF rasmi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {customLogoUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Logo Kustom Aktif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-maroon-50 border border-maroon-200 text-maroon-900 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-maroon-700" />
                    <span>Lencana Rasmi SMK Salaping (Default)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Visual Previews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
              {/* Preview 1: Header Context */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Paparan Header Sistem
                </span>
                <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="w-10 h-10 shrink-0 bg-white rounded-lg p-0.5 border border-stone-200 flex items-center justify-center">
                    <SmkSalapingLogo className="w-full h-full" logoUrl={customLogoUrl} alt="Logo" />
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-stone-900 truncate">{tetapan.sekolah}</p>
                    <p className="text-[10px] text-stone-500">Sistem Guru Bertugas</p>
                  </div>
                </div>
              </div>

              {/* Preview 2: Document Letterhead Context */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Paparan Dokumen Cetakan
                </span>
                <div className="text-center p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="w-14 h-14 mx-auto mb-1 flex items-center justify-center">
                    <SmkSalapingLogo className="w-full h-full" logoUrl={customLogoUrl} alt="Logo" />
                  </div>
                  <p className="text-[11px] font-bold text-stone-900 uppercase truncate font-serif">
                    {tetapan.sekolah}
                  </p>
                  <p className="text-[9px] text-stone-500 uppercase">Buku Laporan Rasmi</p>
                </div>
              </div>

              {/* Preview 3: Big Badge */}
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                  Saiz Penuh Lencana
                </span>
                <div className="w-20 h-20 p-1 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center">
                  <SmkSalapingLogo className="w-full h-full" logoUrl={customLogoUrl} alt="Logo Penuh" />
                </div>
              </div>
            </div>

            {/* Authentic Badge Specification Card */}
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1FB7B6] shrink-0"></span>
                <h4 className="font-bold text-stone-900 text-xs">
                  Ciri &amp; Struktur Rasmi Lencana SMK Salaping (Kekal Asli)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-[11px] text-stone-600">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                  <span className="font-bold text-stone-900 block mb-0.5">Perisai Toska Rasmi</span>
                  Latar turquoise/toska rasmi (#199E95 - #22BFB6) dengan sempadan putih tebal &amp; tulisan tajuk putih.
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                  <span className="font-bold text-stone-900 block mb-0.5">Kuadran Kuning &amp; Skrol</span>
                  Latar kuning diraja dengan skrol sijil merah bergulung berikat reben toska rasmi.
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                  <span className="font-bold text-stone-900 block mb-0.5">Kuadran Angkasa (STEM)</span>
                  Angkasa malam berbintang, satelit orbit, dan planet Zuhal bergelung elips putih.
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs">
                  <span className="font-bold text-stone-900 block mb-0.5">Buku, Zaitun &amp; Reben</span>
                  Buku putih bertapak merah, kalungan daun hijau, reben toska tulisan putih "ILMUAN GEMILANG 2006 / 1427".
                </div>
              </div>
            </div>

            {/* Upload Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option A: Upload Local Image File */}
              <div className="p-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors text-center">
                <ImageIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                  Muat Naik Fail Imej Logo
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 mb-3">
                  Sokongan fail PNG, JPG, WebP, atau SVG. Imej akan dioptimumkan secara automatik.
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingImg ? 'Memproses Imej...' : 'Pilih Fail Imej'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isProcessingImg}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option B: Direct Image URL or Reset */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-1">
                    Atau Masukkan Pautan URL Imej
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInputLogo}
                      onChange={(e) => setUrlInputLogo(e.target.value)}
                      placeholder="https://contoh.com/logo-sekolah.png"
                      className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Guna
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefaultLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kembali ke Lencana Rasmi SMK Salaping</span>
                  </button>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLogoUrl('');
                        onSaveTetapan({ ...tetapan, logo_url: undefined });
                        onToast('Logo kustom dipadam.');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Buang Logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cap Mohor Rasmi & Tandatangan Pentadbir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cap Mohor */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-maroon-800" />
                    <span>Cap Mohor Rasmi Sekolah</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Dipaparkan bersebelahan tandatangan pentadbir pengesah.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 shrink-0 rounded-xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center">
                  {customCapUrl ? (
                    <img
                      src={customCapUrl}
                      alt="Cap Rasmi"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium text-center">
                      Tiada Cap Dimuat Naik
                    </span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customCapUrl ? 'Gantikan Cap' : 'Muat Naik Cap'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCapUpload}
                      className="hidden"
                    />
                  </label>

                  {customCapUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCapUrl('');
                        onSaveTetapan({ ...tetapan, cap_url: undefined });
                        onToast('Cap rasmi sekolah dibuang.');
                      }}
                      className="block text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      Padam Cap
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tandatangan Digital */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-blue-700" />
                    <span>Tandatangan Digital Pentadbir</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Imej tandatangan Pengetua / PK HEM (PNG lutsinar digalakkan).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-28 h-20 shrink-0 rounded-xl bg-stone-50 border border-stone-200 p-2 flex items-center justify-center">
                  {customTandatanganUrl ? (
                    <img
                      src={customTandatanganUrl}
                      alt="Tandatangan"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium text-center">
                      Tiada Tandatangan
                    </span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customTandatanganUrl ? 'Gantikan Fail' : 'Muat Naik Tandatangan'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTandatanganUpload}
                      className="hidden"
                    />
                  </label>

                  {customTandatanganUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTandatanganUrl('');
                        onSaveTetapan({ ...tetapan, tandatangan_url: undefined });
                        onToast('Tandatangan digital dibuang.');
                      }}
                      className="block text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                    >
                      Padam Tandatangan
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MUAT NAIK JADUAL BERTUGAS */}
      {/* ========================================================================= */}
      {activeTab === 'jadual' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>Muat Naik &amp; Import Jadual Guru Bertugas</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Muat naik fail Excel (.xlsx, .xls) atau CSV untuk memasukkan jadual bertugas mingguan secara pukal ke dalam sistem.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadJadualTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Turun Templat Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadJadualTemplate('csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Templat CSV</span>
                </button>
              </div>
            </div>

            {/* Roster Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 uppercase">Jumlah Rekod Bertugas</span>
                <p className="text-2xl font-bold text-amber-950 mt-1">{jadual.length} Rekod</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Tersimpan dalam takwim bertugas
                </p>
              </div>

              <div className="p-4 rounded-xl bg-maroon-50/60 border border-maroon-200">
                <span className="text-[11px] font-bold text-maroon-900 uppercase">Minggu Diliputi</span>
                <p className="text-2xl font-bold text-maroon-950 mt-1">
                  {new Set(jadual.map((j) => j.mula)).size} Minggu
                </p>
                <p className="text-[11px] text-maroon-800 mt-0.5">
                  Pusingan giliran bertugas
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-stone-600 uppercase">Tindakan Pantas</span>
                <button
                  type="button"
                  onClick={handleClearAllJadual}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Semua Jadual</span>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-4 pt-2">
              <div className="p-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 transition-colors text-center">
                <FileSpreadsheet className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-stone-900 text-sm">
                  Pilih Fail Jadual Guru Bertugas (.xlsx, .xls, .csv)
                </h4>
                <p className="text-xs text-stone-600 max-w-xl mx-auto mt-1 mb-4">
                  Sistem mengecam lajur secara pintar: <strong>Tarikh / Mula Minggu</strong>, <strong>Nama Guru Bertugas</strong>, <strong>Kumpulan</strong>, <strong>Catatan / Skop</strong>, dan <strong>Sidang</strong>.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-xs">
                    <span className="font-semibold text-stone-700">Mod Kemasukan:</span>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="jadualMode"
                        checked={jadualImportMode === 'replace'}
                        onChange={() => setJadualImportMode('replace')}
                        className="text-amber-600"
                      />
                      <span className="font-medium text-stone-800">Ganti Semua</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="jadualMode"
                        checked={jadualImportMode === 'append'}
                        onChange={() => setJadualImportMode('append')}
                        className="text-amber-600"
                      />
                      <span className="font-medium text-stone-800">Tambah ke Sedia Ada</span>
                    </label>
                  </div>

                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{isProcessingJadual ? 'Memproses Fail...' : 'Pilih Fail Jadual'}</span>
                    <input
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleJadualFileSelected}
                      disabled={isProcessingJadual}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preview of Imported Duty Roster */}
              {jadualPreview && (
                <div className="p-5 rounded-2xl bg-white border-2 border-maroon-300 shadow-md space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-maroon-100 pb-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-900 bg-maroon-100 px-2.5 py-0.5 rounded-full mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-maroon-700" />
                        <span>Pratonton Fail Berjaya ({jadualPreview.length} Baris Dikesan)</span>
                      </div>
                      <p className="text-xs text-stone-600">
                        Fail: <strong>{jadualFileName}</strong> &bull; Mod:{' '}
                        <strong>
                          {jadualImportMode === 'replace' ? 'Gantikan Semua' : 'Tambah Rekod'}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setJadualPreview(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImportJadual}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg shadow-xs cursor-pointer border-b-2 border-kuning-400"
                      >
                        <Save className="w-3.5 h-3.5 text-kuning-300" />
                        <span>Sahkan &amp; Masukkan ke Sistem</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 sticky top-0 text-stone-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Tarikh Mula</th>
                          <th className="py-2 px-3">Nama Guru</th>
                          <th className="py-2 px-3">Kumpulan</th>
                          <th className="py-2 px-3">Skop / Catatan</th>
                          <th className="py-2 px-3">Sidang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {jadualPreview.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50">
                            <td className="py-2 px-3 font-mono font-semibold text-stone-900">
                              {item.mula}
                            </td>
                            <td className="py-2 px-3 font-bold text-stone-900">{item.nama}</td>
                            <td className="py-2 px-3 text-stone-600">{item.kumpulan || '-'}</td>
                            <td className="py-2 px-3 text-stone-600">{item.catatan || '-'}</td>
                            <td className="py-2 px-3 capitalize text-stone-700 font-medium">
                              {item.sidang || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {jadualPreview.length > 10 && (
                    <p className="text-[11px] text-stone-500 italic text-center">
                      ... dan {jadualPreview.length - 10} baris rekod lagi.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIREKTORI GURU & SIDANG */}
      {/* ========================================================================= */}
      {activeTab === 'guru' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            {/* Header and Controls */}
            <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <span>Direktori Warga Pendidik &amp; Sidang Persekolahan</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Senarai guru digunakan untuk agihan jadual bertugas, pemilihan sidang pagi/petang, dan pengesahan laporan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(!showAddTeacher)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-xl transition-colors cursor-pointer shadow-xs border-b-2 border-kuning-400"
                >
                  <Plus className="w-3.5 h-3.5 text-kuning-300" />
                  <span>Daftar Guru Baharu</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-xl transition-colors cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-sky-700" />
                  <span>Import Senarai Guru</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleBulkTeacherUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTeacherTemplate}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer"
                  title="Muat turun templat senarai guru"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Templat</span>
                </button>
              </div>
            </div>

            {/* Add Teacher Collapsible Form */}
            {showAddTeacher && (
              <div className="p-5 bg-maroon-50/50 border-b border-maroon-100 animate-fade-in">
                <form onSubmit={handleAddTeacher} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-maroon-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-maroon-800" />
                      <span>Daftar Guru / Pengguna Baharu</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddTeacher(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Nama Penuh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newNama}
                        onChange={(e) => setNewNama(e.target.value)}
                        placeholder="Nama penuh guru"
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 font-medium"
                        required
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Emel Rasmi DELIMa (KPM)
                      </label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="g-12345678@moe-dl.edu.my"
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Jawatan / Skop
                      </label>
                      <input
                        type="text"
                        value={newJawatan}
                        onChange={(e) => setNewJawatan(e.target.value)}
                        placeholder="Guru Akademik"
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Kata Laluan
                      </label>
                      <input
                        type="text"
                        value={newKataLaluan}
                        onChange={(e) => setNewKataLaluan(e.target.value)}
                        placeholder="delima123"
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Sidang
                      </label>
                      <select
                        value={newSidang}
                        onChange={(e) => setNewSidang(e.target.value as Sidang)}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white font-semibold text-stone-800"
                      >
                        <option value="pagi">Sidang Pagi</option>
                        <option value="petang">Sidang Petang</option>
                        <option value="kedua">Kedua-dua Sidang</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Peranan Sistem
                      </label>
                      <select
                        value={newPeranan}
                        onChange={(e) => setNewPeranan(e.target.value as 'guru' | 'pentadbir')}
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white font-semibold text-stone-800"
                      >
                        <option value="guru">Guru (Isi Laporan)</option>
                        <option value="pentadbir">Pentadbir (Pengesah)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Gred Jawatan
                      </label>
                      <input
                        type="text"
                        value={newGred}
                        onChange={(e) => setNewGred(e.target.value)}
                        placeholder="DG41 / DG44"
                        className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg transition-colors cursor-pointer shadow-xs border-b-2 border-kuning-400"
                      >
                        Simpan Guru
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Search and Filters Bar */}
            <div className="p-4 bg-white border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTeacher}
                  onChange={(e) => setSearchTeacher(e.target.value)}
                  placeholder="Cari nama guru atau jawatan..."
                  className="w-full text-xs pl-9 pr-3.5 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterSidang('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterSidang === 'all' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-500'
                    }`}
                  >
                    Semua Sidang
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSidang('pagi')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterSidang === 'pagi' ? 'bg-white shadow-2xs text-amber-900 font-bold' : 'text-stone-500'
                    }`}
                  >
                    Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSidang('petang')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterSidang === 'petang' ? 'bg-white shadow-2xs text-indigo-900 font-bold' : 'text-stone-500'
                    }`}
                  >
                    Petang
                  </button>
                </div>
              </div>
            </div>

            {/* Teachers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Nama Guru</th>
                    <th className="py-2.5 px-4">Jawatan / Skop</th>
                    <th className="py-2.5 px-4">Sidang</th>
                    <th className="py-2.5 px-4">Peranan</th>
                    <th className="py-2.5 px-4">Status Pengguna</th>
                    <th className="py-2.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-stone-500 italic">
                        Tiada guru dikesan mengikut carian ini.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-stone-50 transition-colors ${
                            isCurrent ? 'bg-kuning-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-stone-900">
                            <div className="flex items-center gap-2">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-maroon-950 bg-kuning-400 px-1.5 py-0.5 rounded border border-kuning-500/40">
                                  SEDANG AKTIF
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-normal text-stone-500 block">
                              {u.email}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-stone-700 text-xs">
                            {u.jawatan || 'Guru Akademik'}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                                (u.sidang || 'pagi') === 'petang'
                                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                  : u.sidang === 'kedua'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {(u.sidang || 'pagi') === 'petang' ? (
                                <Moon className="w-3 h-3 text-indigo-600" />
                              ) : (
                                <Sun className="w-3 h-3 text-amber-600" />
                              )}
                              <span>
                                {u.sidang === 'petang'
                                  ? 'Sidang Petang'
                                  : u.sidang === 'kedua'
                                  ? 'Kedua-dua'
                                  : 'Sidang Pagi'}
                              </span>
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                                u.peranan === 'pentadbir'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {u.peranan === 'pentadbir' ? 'Pentadbir' : 'Guru'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isCurrent ? (
                              <span className="text-xs font-bold text-maroon-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-maroon-700" />
                                <span>Akaun Semasa</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onSelectUser(u)}
                                className="text-xs font-medium text-stone-600 hover:text-maroon-800 underline cursor-pointer"
                              >
                                Tukar ke pengguna ini
                              </button>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingTeacher(u)}
                                className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 p-1.5 rounded transition-colors cursor-pointer"
                                title="Sunting Maklumat Guru"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeacher(u.id, u.nama)}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded transition-colors cursor-pointer"
                                  title="Padam Pengguna"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SANDARAN & SISTEM */}
      {/* ========================================================================= */}
      {activeTab === 'sandaran' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-maroon-800" />
              <span>Eksport &amp; Pemulihan Sandaran Data</span>
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              Semua data disimpan secara selamat di dalam storan peranti anda (localStorage). Anda boleh mengeksport fail sandaran lengkap untuk tujuan arkib atau memindahkannya ke komputer lain.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full py-2.5 px-4 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-maroon-800" />
                <span>Muat Turun Fail Sandaran Penuh (JSON)</span>
              </button>

              <label className="w-full py-2.5 px-4 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Pulihkan Sistem daripada Fail JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportBackup(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>

              <div className="pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onResetDemo}
                  className="w-full py-2.5 px-4 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Set Semula ke Data Contoh SMK Salaping, Kota Marudu</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-maroon-800" />
              <span>Struktur &amp; Piawaian Pangkalan Data</span>
            </h3>

            <p className="text-xs text-stone-600 leading-relaxed">
              Sistem ini serasi dengan piawaian entiti pangkalan data SQL &amp; Supabase Kementerian Pendidikan Malaysia:
            </p>

            <div className="space-y-2 text-xs font-mono text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1">
                <span className="font-bold text-maroon-950">profiles</span>
                <span className="text-stone-500 text-[11px]">{users.length} rekod pengguna</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1">
                <span className="font-bold text-maroon-950">tetapan</span>
                <span className="text-stone-500 text-[11px]">1 rekod profil sekolah</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1">
                <span className="font-bold text-maroon-950">jadual</span>
                <span className="text-stone-500 text-[11px]">{jadual.length} giliran bertugas</span>
              </div>
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1">
                <span className="font-bold text-maroon-950">laporan_harian</span>
                <span className="text-stone-500 text-[11px]">rekod harian guru bertugas</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-maroon-950">laporan_mingguan</span>
                <span className="text-stone-500 text-[11px]">rumusan mingguan rasmi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT TEACHER MODAL */}
      {/* ========================================================================= */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-maroon-800" />
                <span>Sunting Maklumat Guru</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nama Guru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingTeacher.nama}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, nama: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Jawatan / Skop
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.jawatan}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, jawatan: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Emel Rasmi
                  </label>
                  <input
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, email: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sidang Persekolahan
                  </label>
                  <select
                    value={editingTeacher.sidang || 'pagi'}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        sidang: e.target.value as Sidang
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white font-semibold text-stone-800"
                  >
                    <option value="pagi">Sidang Pagi</option>
                    <option value="petang">Sidang Petang</option>
                    <option value="kedua">Kedua-dua Sidang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Peranan Sistem
                  </label>
                  <select
                    value={editingTeacher.peranan}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...editingTeacher,
                        peranan: e.target.value as 'guru' | 'pentadbir'
                      })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white font-semibold text-stone-800"
                  >
                    <option value="guru">Guru (Isi Laporan Harian)</option>
                    <option value="pentadbir">Pentadbir (Sahkan Laporan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Gred Jawatan
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.gred || ''}
                    placeholder="DG41 / DG44"
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, gred: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Kata Laluan Log Masuk
                  </label>
                  <input
                    type="text"
                    value={editingTeacher.kata_laluan || ''}
                    placeholder="Masukkan kata laluan"
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, kata_laluan: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-maroon-600 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-maroon-800 hover:bg-maroon-900 rounded-lg cursor-pointer shadow-xs border-b-2 border-kuning-400"
                >
                  Simpan Kemas Kini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
