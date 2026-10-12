import {
  UserProfile,
  TetapanSekolah,
  JadualBertugas,
  LaporanHarian,
  LaporanMingguan,
  DomainPemerhatianKey,
  ItemPemerhatian,
  StatusPemerhatian
} from '../types';
import { toISODate, getMonday, addDays } from './dateUtils';

export const DOMAIN_PEMERHATIAN: Array<{ key: DomainPemerhatianKey; title: string; desc: string }> = [
  {
    key: 'perhimpunan',
    title: 'Perhimpunan / Kedatangan Pagi',
    desc: 'Disiplin murid hadir awal, bacaan doa, lagu kebangsaan & makluman pagi.'
  },
  {
    key: 'rehat',
    title: 'Waktu Rehat & Kantin',
    desc: 'Ketenteraman beratur di kantin, kebersihan meja makan & pemantauan guru.'
  },
  {
    key: 'pulang',
    title: 'Waktu Pulang & Penyuraian',
    desc: 'Keselamatan pergerakan murid ke pintu pagar, bas sekolah & lalu lintas.'
  },
  {
    key: 'bersih',
    title: 'Kebersihan Persekitaran & Tandas',
    desc: 'Keadaan tong sampah, kelas, koridor, longkang dan sanitasi tandas.'
  },
  {
    key: 'selamat',
    title: 'Keselamatan & Kemudahan Fizikal',
    desc: 'Pagar keselamatan, alat pemadam api, bilik khas, keselamatan elektrik.'
  }
];

export const STATUS_OPTIONS: StatusPemerhatian[] = ['Cemerlang', 'Baik', 'Sederhana', 'Perlu tindakan'];

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'u-1',
    nama: 'Cikgu Fed',
    email: 'g-fed@moe-dl.edu.my',
    peranan: 'guru',
    jawatan: 'Ketua Guru Bertugas',
    sidang: 'pagi',
    gred: 'DG44',
    kata_laluan: 'delima123'
  },
  {
    id: 'u-admin-1',
    nama: 'Tuan Sanaleh bin Daud',
    email: 'g-sanaleh@moe-dl.edu.my',
    peranan: 'pentadbir',
    jawatan: 'Pengetua',
    gred: 'DG52',
    kata_laluan: 'admin123'
  },
  {
    id: 'u-admin-2',
    nama: 'En. Arman bin Aliamat',
    email: 'g-arman@moe-dl.edu.my',
    peranan: 'pentadbir',
    jawatan: 'Penolong Kanan Hal Ehwal Murid (PK HEM)',
    gred: 'DG48',
    kata_laluan: 'admin123'
  },
  {
    id: 'u-2',
    nama: 'Ustaz Hafiz bin Ismail',
    email: 'g-hafiz@moe-dl.edu.my',
    peranan: 'guru',
    jawatan: 'Guru Pendidikan Islam',
    sidang: 'pagi',
    gred: 'DG41',
    kata_laluan: 'delima123'
  },
  {
    id: 'u-3',
    nama: 'Cikgu Dayang Nuraisyah',
    email: 'g-nuraisyah@moe-dl.edu.my',
    peranan: 'guru',
    jawatan: 'Guru Bahasa Melayu',
    sidang: 'petang',
    gred: 'DG41',
    kata_laluan: 'delima123'
  }
];

export const DEFAULT_TETAPAN: TetapanSekolah = {
  id: 1,
  sekolah: 'SMK Salaping, Kota Marudu',
  kod_sekolah: 'XEA5101',
  alamat: 'Peti Surat 248, 89108 Kota Marudu, Sabah',
  pentadbir: 'Tuan Sanaleh bin Daud',
  jawatan: 'Pengetua',
  sesi: '2026/2027',
  moto: 'Ilmuan Gemilang'
};

export const DEFAULT_JADUAL: JadualBertugas[] = [];

function defaultPem(s1: StatusPemerhatian = 'Baik', n1 = '', s2: StatusPemerhatian = 'Baik', n2 = ''): Record<DomainPemerhatianKey, ItemPemerhatian> {
  return {
    perhimpunan: { s: s1, n: n1 || 'Perhimpunan berjalan lancar, murid beratur mengikut kelas masing-masing.' },
    rehat: { s: s2, n: n2 || 'Murid mematuhi giliran membeli makanan, tiada tumpahan dikesan.' },
    pulang: { s: 'Baik', n: 'Penyuraian terkawal di bawah pemantauan pengawal keselamatan & guru bertugas.' },
    bersih: { s: 'Baik', n: 'Kawasan kelas ceria, tong sampah dikosongkan sebelum sesi berakhir.' },
    selamat: { s: 'Baik', n: 'Pintu pagar berkunci selepas 7.45 pagi, kawalan pelawat dipatuhi.' }
  };
}

export const DEFAULT_LAPORAN_HARIAN: Record<string, LaporanHarian> = {};

export const DEFAULT_LAPORAN_MINGGUAN: Record<string, LaporanMingguan> = {};

// Storage Keys (v3 starts with clean active rosters)
const K_USERS = 'sgb_users_v3';
const K_TETAPAN = 'sgb_tetapan_v3';
const K_JADUAL = 'sgb_jadual_v3';
const K_HARIAN = 'sgb_harian_v3';
const K_MINGGUAN = 'sgb_mingguan_v3';
const K_ACTIVE_USER = 'sgb_active_user_v3';

export function getStoredUsers(): UserProfile[] {
  try {
    const data = localStorage.getItem(K_USERS);
    if (data) {
      const users: UserProfile[] = JSON.parse(data);
      // Migrate any previous names if present
      let changed = false;
      const updated = users.map((u) => {
        let modified = false;
        let newU = { ...u };
        if (/nurul\s*huda/i.test(newU.nama)) {
          newU = { ...newU, nama: 'Cikgu Fed', email: 'g-fed@moe-dl.edu.my' };
          modified = true;
        }
        if (/azman/i.test(newU.nama) || newU.id === 'u-admin-1') {
          newU = { ...newU, nama: 'Tuan Sanaleh bin Daud', email: 'g-sanaleh@moe-dl.edu.my', jawatan: 'Pengetua' };
          modified = true;
        }
        if (/rohana/i.test(newU.nama) || newU.id === 'u-admin-2') {
          newU = { ...newU, nama: 'En. Arman bin Aliamat', email: 'g-arman@moe-dl.edu.my', jawatan: 'Penolong Kanan Hal Ehwal Murid (PK HEM)' };
          modified = true;
        }
        if (!newU.kata_laluan) {
          newU.kata_laluan = newU.peranan === 'pentadbir' ? 'admin123' : 'delima123';
          modified = true;
        }
        if (newU.email === 'fed@moe.edu.my') {
          newU.email = 'g-fed@moe-dl.edu.my';
          modified = true;
        }
        if (newU.email === 'azman.kassim@moe.edu.my' || newU.email === 'g-azman@moe-dl.edu.my') {
          newU.email = 'g-sanaleh@moe-dl.edu.my';
          modified = true;
        }
        if (newU.email === 'rohana.salleh@moe.edu.my' || newU.email === 'g-rohana@moe-dl.edu.my') {
          newU.email = 'g-arman@moe-dl.edu.my';
          modified = true;
        }
        if (modified) changed = true;
        return newU;
      });
      if (changed) saveStoredUsers(updated);
      return updated;
    }
  } catch (e) {
    console.error(e);
  }
  saveStoredUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: UserProfile[]) {
  localStorage.setItem(K_USERS, JSON.stringify(users));
}

export function getStoredTetapan(): TetapanSekolah {
  try {
    const data = localStorage.getItem(K_TETAPAN);
    if (data) {
      const t: TetapanSekolah = JSON.parse(data);
      if (/seri\s*bintang/i.test(t.sekolah) || !t.sekolah || /azman/i.test(t.pentadbir)) {
        const migrated: TetapanSekolah = {
          ...t,
          sekolah: 'SMK Salaping, Kota Marudu',
          kod_sekolah: 'XEA5101',
          alamat: 'Peti Surat 248, 89108 Kota Marudu, Sabah',
          pentadbir: /azman/i.test(t.pentadbir) || !t.pentadbir ? 'Tuan Sanaleh bin Daud' : t.pentadbir,
          jawatan: t.jawatan || 'Pengetua',
          moto: 'Ilmuan Gemilang'
        };
        saveStoredTetapan(migrated);
        return migrated;
      }
      return t;
    }
  } catch (e) {
    console.error(e);
  }
  saveStoredTetapan(DEFAULT_TETAPAN);
  return DEFAULT_TETAPAN;
}

export function saveStoredTetapan(tetapan: TetapanSekolah) {
  localStorage.setItem(K_TETAPAN, JSON.stringify(tetapan));
}

export function getStoredJadual(): JadualBertugas[] {
  try {
    const data = localStorage.getItem(K_JADUAL);
    if (data) {
      const arr: JadualBertugas[] = JSON.parse(data);
      let changed = false;
      const updated = arr.map((item) => {
        if (/nurul\s*huda/i.test(item.nama)) {
          changed = true;
          return { ...item, nama: 'Cikgu Fed' };
        }
        return item;
      });
      if (changed) saveStoredJadual(updated);
      return updated;
    }
  } catch (e) {
    console.error(e);
  }
  saveStoredJadual(DEFAULT_JADUAL);
  return DEFAULT_JADUAL;
}

export function saveStoredJadual(jadual: JadualBertugas[]) {
  localStorage.setItem(K_JADUAL, JSON.stringify(jadual));
}

export function getStoredLaporanHarian(): Record<string, LaporanHarian> {
  try {
    const data = localStorage.getItem(K_HARIAN);
    if (data) {
      const records: Record<string, LaporanHarian> = JSON.parse(data);
      let changed = false;
      Object.values(records).forEach((r) => {
        if (/nurul\s*huda/i.test(r.pelapor)) {
          r.pelapor = 'Cikgu Fed';
          changed = true;
        }
      });
      if (changed) saveStoredLaporanHarian(records);
      return records;
    }
  } catch (e) {
    console.error(e);
  }
  saveStoredLaporanHarian(DEFAULT_LAPORAN_HARIAN);
  return DEFAULT_LAPORAN_HARIAN;
}

export function saveStoredLaporanHarian(records: Record<string, LaporanHarian>) {
  localStorage.setItem(K_HARIAN, JSON.stringify(records));
}

export function getStoredLaporanMingguan(): Record<string, LaporanMingguan> {
  try {
    const data = localStorage.getItem(K_MINGGUAN);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  saveStoredLaporanMingguan(DEFAULT_LAPORAN_MINGGUAN);
  return DEFAULT_LAPORAN_MINGGUAN;
}

export function saveStoredLaporanMingguan(records: Record<string, LaporanMingguan>) {
  localStorage.setItem(K_MINGGUAN, JSON.stringify(records));
}

export function getActiveUser(): UserProfile | null {
  try {
    const data = localStorage.getItem(K_ACTIVE_USER);
    if (data) {
      const user: UserProfile = JSON.parse(data);
      if (/nurul\s*huda/i.test(user.nama)) {
        const migrated = { ...user, nama: 'Cikgu Fed', email: 'g-fed@moe-dl.edu.my' };
        saveActiveUser(migrated);
        return migrated;
      }
      if (/azman/i.test(user.nama) || user.id === 'u-admin-1') {
        const migrated = { ...user, nama: 'Tuan Sanaleh bin Daud', email: 'g-sanaleh@moe-dl.edu.my', jawatan: 'Pengetua' };
        saveActiveUser(migrated);
        return migrated;
      }
      if (/rohana/i.test(user.nama) || user.id === 'u-admin-2') {
        const migrated = { ...user, nama: 'En. Arman bin Aliamat', email: 'g-arman@moe-dl.edu.my', jawatan: 'Penolong Kanan Hal Ehwal Murid (PK HEM)' };
        saveActiveUser(migrated);
        return migrated;
      }
      return user;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveActiveUser(user: UserProfile | null) {
  if (user) {
    localStorage.setItem(K_ACTIVE_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(K_ACTIVE_USER);
  }
}

export function logoutUser() {
  localStorage.removeItem(K_ACTIVE_USER);
}

export function clearAllJadual() {
  saveStoredJadual([]);
}

export function clearAllLaporan() {
  saveStoredLaporanHarian({});
  saveStoredLaporanMingguan({});
}

export function resetAllToDefault() {
  saveStoredUsers(DEFAULT_USERS);
  saveStoredTetapan(DEFAULT_TETAPAN);
  saveStoredJadual([]);
  saveStoredLaporanHarian({});
  saveStoredLaporanMingguan({});
  saveActiveUser(DEFAULT_USERS[0]);
}

export function exportBackupJSON(): string {
  const payload = {
    app: 'Sistem Guru Bertugas',
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    users: getStoredUsers(),
    tetapan: getStoredTetapan(),
    jadual: getStoredJadual(),
    laporan_harian: getStoredLaporanHarian(),
    laporan_mingguan: getStoredLaporanMingguan()
  };
  return JSON.stringify(payload, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.tetapan) saveStoredTetapan(parsed.tetapan);
    if (Array.isArray(parsed.users)) saveStoredUsers(parsed.users);
    if (Array.isArray(parsed.jadual)) saveStoredJadual(parsed.jadual);
    if (parsed.laporan_harian) saveStoredLaporanHarian(parsed.laporan_harian);
    if (parsed.laporan_mingguan) saveStoredLaporanMingguan(parsed.laporan_mingguan);
    return true;
  } catch (e) {
    console.error('Import error:', e);
    return false;
  }
}
