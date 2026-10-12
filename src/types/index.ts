export type Peranan = 'guru' | 'pentadbir';
export type Sidang = 'pagi' | 'petang' | 'kedua';

export interface UserProfile {
  id: string;
  nama: string;
  email: string; // Emel DELIMa e.g. g-12345678@moe-dl.edu.my
  peranan: Peranan;
  jawatan: string; // e.g. 'Ketua Guru Bertugas', 'Guru Akademik', 'Pengetua', 'PK HEM'
  sidang?: Sidang; // 'pagi' | 'petang' | 'kedua'
  gred?: string;
  telefon?: string;
  kata_laluan?: string; // Kata laluan log masuk
  delima_id?: string;
}

export interface TetapanSekolah {
  id: number;
  sekolah: string;
  kod_sekolah: string;
  alamat: string;
  pentadbir: string;
  jawatan: string;
  sesi: string;
  moto: string;
  logo_url?: string; // Base64 data URL or external URL
  telefon_sekolah?: string;
  emel_sekolah?: string;
  cap_url?: string; // Base64 cap rasmi sekolah / mohor
  tandatangan_url?: string; // Base64 tandatangan pentadbir
  daerah?: string;
  negeri?: string;
}

export interface JadualBertugas {
  id: string;
  mula: string; // ISO Date YYYY-MM-DD (Isnin)
  nama: string; // Nama guru
  kumpulan?: string; // e.g. 'Kumpulan 1'
  catatan: string; // e.g. 'Ketua Guru Bertugas'
  sidang?: Sidang; // 'pagi' | 'petang'
  mingguKe?: number; // Minggu 1, Minggu 2, ...
  created_at: string;
}

export type StatusPemerhatian = 'Cemerlang' | 'Baik' | 'Sederhana' | 'Perlu tindakan';

export interface ItemPemerhatian {
  s: StatusPemerhatian;
  n: string;
}

export type DomainPemerhatianKey = 'perhimpunan' | 'rehat' | 'pulang' | 'bersih' | 'selamat';

export interface LaporanHarian {
  tarikh: string; // YYYY-MM-DD
  user_id: string;
  pelapor: string;
  jumlah: number;
  hadir: number;
  lewat: number;
  ponteng: number;
  pem: Record<DomainPemerhatianKey, ItemPemerhatian>;
  insiden: string;
  cadangan: string;
  komen_pentadbir: string;
  status: 'Draf' | 'Dihantar' | 'Disahkan';
  disahkan_oleh?: string;
  tarikh_sah?: string;
  updated_at: string;
}

export interface LaporanMingguan {
  mula: string; // YYYY-MM-DD (Isnin)
  ulasan: string;
  catatan_pentadbir?: string;
  disahkan_oleh?: string;
  status: 'Draf' | 'Lengkap' | 'Disahkan';
  updated_at: string;
}

export interface SkopTugasan {
  id: string;
  nama: string;
}

export interface HasilAgihanMinggu {
  mingguKe: number;
  tarikhIsnin: string;
  tarikhJumaat?: string;
  kumpulanNama: string;
  adakahCuti?: boolean;
  namaCuti?: string;
  penggal?: number;
  tugasan: Array<{
    skop: string;
    guruNama: string;
    sidang: 'pagi' | 'petang';
  }>;
}

export type TabAktif = 'dashboard' | 'jadual' | 'agihan' | 'harian' | 'mingguan' | 'tetapan';
