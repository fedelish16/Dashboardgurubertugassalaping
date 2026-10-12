import { addDays, formatDDMMYYYY, formatMalayWeekRange } from './dateUtils';
import { HasilAgihanMinggu, SkopTugasan, UserProfile, Sidang } from '../types';

export interface MingguKPM {
  mingguKe: number;
  penggal: 1 | 2 | 3;
  tarikhIsnin: string;
  tarikhJumaat: string;
  adakahCuti: boolean;
  namaCuti?: string;
}

/**
 * Takwim Persekolahan KPM Tahun Semasa 2026/2027 (Kumpulan B - Sabah/Sarawak/Semenanjung)
 * Sesi persekolahan 2026 bermula Mac 2026 hingga Januari/Februari 2027.
 */
export function generateKalendarAkademikKPM(tahunMula: number = 2026): MingguKPM[] {
  // Isnin pertama persekolahan sesi 2026 (cth: 16 Mac 2026)
  const tarikhMulaSesi = `${tahunMula}-03-16`;
  const kalendar: MingguKPM[] = [];

  let curMonday = tarikhMulaSesi;
  let mingguAkademik = 1;

  for (let w = 0; w < 44; w++) {
    const curFriday = addDays(curMonday, 4);

    let adakahCuti = false;
    let namaCuti: string | undefined = undefined;
    let penggal: 1 | 2 | 3 = 1;

    // Struktur Penggal KPM:
    // Penggal 1: Minggu 1 - 10 (Mac - Mei)
    // Cuti Penggal 1: Minggu 11 (Akhir Mei - Awal Jun)
    // Penggal 2: Minggu 12 - 23 (Jun - Ogos)
    // Cuti Penggal 2: Minggu 24 (Awal September)
    // Penggal 3: Minggu 25 - 40 (September - Disember/Januari)
    // Cuti Akhir Persekolahan: Minggu 41+ (Januari/Februari)

    if (w === 10) {
      adakahCuti = true;
      namaCuti = 'Cuti Penggal 1, Sesi 2026/2027';
      penggal = 1;
    } else if (w < 10) {
      penggal = 1;
    } else if (w === 23) {
      adakahCuti = true;
      namaCuti = 'Cuti Penggal 2, Sesi 2026/2027';
      penggal = 2;
    } else if (w < 23) {
      penggal = 2;
    } else if (w === 39 || w === 40) {
      adakahCuti = true;
      namaCuti = 'Cuti Penggal 3 / Akhir Persekolahan';
      penggal = 3;
    } else {
      penggal = 3;
    }

    kalendar.push({
      mingguKe: adakahCuti ? 0 : mingguAkademik,
      penggal,
      tarikhIsnin: curMonday,
      tarikhJumaat: curFriday,
      adakahCuti,
      namaCuti
    });

    if (!adakahCuti) {
      mingguAkademik++;
    }

    curMonday = addDays(curMonday, 7);
  }

  return kalendar;
}

/**
 * Standard Task Scopes by Session (Sidang Pagi & Sidang Petang)
 */
export const SKOP_SIDANG_PAGI: SkopTugasan[] = [
  { id: 'pagi-1', nama: 'Ketua Guru Bertugas (Laporan Rasmi & Perhimpunan Pagi)' },
  { id: 'pagi-2', nama: 'Kawalan Pintu Pagar Utama & Trafik Pagi (7.00 pg - 7.30 pg)' },
  { id: 'pagi-3', nama: 'Pengawasan Kantin & Disiplin Rehat Pagi (9.40 pg - 10.30 pg)' },
  { id: 'pagi-4', nama: 'Pemantauan Kebersihan Blok Tingkatan 3, 4, 5 & Tandas' },
  { id: 'pagi-5', nama: 'Kawalan Penyuraian Tengah Hari & Pintu Pagar (1.00 ptg - 1.30 ptg)' }
];

export const SKOP_SIDANG_PETANG: SkopTugasan[] = [
  { id: 'ptg-1', nama: 'Penyelaras / Ketua Guru Bertugas Sidang Petang' },
  { id: 'ptg-2', nama: 'Kawalan Ketibaan Murid & Pagar Tengah Hari (12.30 tgh - 1.15 ptg)' },
  { id: 'ptg-3', nama: 'Perhimpunan Petang & Disiplin Masuk Kelas (1.15 ptg - 1.45 ptg)' },
  { id: 'ptg-4', nama: 'Pengawasan Kantin & Disiplin Rehat Petang (3.30 ptg - 4.15 ptg)' },
  { id: 'ptg-5', nama: 'Kawalan Waktu Pulang & Penyuraian Petang (6.00 ptg - 6.45 ptg)' },
  { id: 'ptg-6', nama: 'Pemeriksaan Bangunan, Suis Elektrik & Kunci Bilik Darjah' }
];

/**
 * Agihan Tugas Engine dengan Sokongan Sidang Pagi & Sidang Petang
 */
export function generateAgihanDenganSidang(params: {
  tarikhMula: string;
  bilanganMinggu: number;
  abaikanCutiSekolah: boolean;
  sesiSasaran: 'kedua' | 'pagi' | 'petang';
  guruPagi: UserProfile[];
  guruPetang: UserProfile[];
  skopPagi: SkopTugasan[];
  skopPetang: SkopTugasan[];
  bilanganKumpulanPagi: number;
  bilanganKumpulanPetang: number;
  kaedah: 'kumpulan' | 'seimbang' | 'rawak';
}): HasilAgihanMinggu[] {
  const {
    tarikhMula,
    bilanganMinggu,
    abaikanCutiSekolah,
    sesiSasaran,
    guruPagi,
    guruPetang,
    skopPagi,
    skopPetang,
    bilanganKumpulanPagi,
    bilanganKumpulanPetang,
    kaedah
  } = params;

  const kalendarRujukan = generateKalendarAkademikKPM(2026);
  // Match start week or build sequence from tarikhMula
  let curMonday = tarikhMula;
  const results: HasilAgihanMinggu[] = [];

  // Group pools for 'kumpulan' mode
  const grpPagiCount = Math.max(1, Math.min(bilanganKumpulanPagi, Math.max(1, guruPagi.length)));
  const grpPetangCount = Math.max(1, Math.min(bilanganKumpulanPetang, Math.max(1, guruPetang.length)));

  const kumpulanPagiPool: UserProfile[][] = Array.from({ length: grpPagiCount }, () => []);
  const kumpulanPetangPool: UserProfile[][] = Array.from({ length: grpPetangCount }, () => []);

  guruPagi.forEach((g, idx) => kumpulanPagiPool[idx % grpPagiCount].push(g));
  guruPetang.forEach((g, idx) => kumpulanPetangPool[idx % grpPetangCount].push(g));

  let indexPagiTracker = 0;
  let indexPetangTracker = 0;
  let mingguKira = 1;

  for (let w = 0; w < bilanganMinggu; w++) {
    const curFriday = addDays(curMonday, 4);
    
    // Check if this week aligns with a KPM school holiday
    const refWeek = kalendarRujukan.find((k) => k.tarikhIsnin === curMonday);
    const isHoliday = refWeek?.adakahCuti || false;
    const holidayName = refWeek?.namaCuti;

    if (isHoliday && !abaikanCutiSekolah) {
      // Record holiday week without duty burden
      results.push({
        mingguKe: mingguKira,
        tarikhIsnin: curMonday,
        tarikhJumaat: curFriday,
        kumpulanNama: 'Cuti Persekolahan KPM',
        adakahCuti: true,
        namaCuti: holidayName || 'Cuti Penggal Persekolahan KPM',
        tugasan: []
      });
      curMonday = addDays(curMonday, 7);
      continue;
    }

    const currentAssignments: Array<{ skop: string; guruNama: string; sidang: 'pagi' | 'petang' }> = [];

    // --- SIDANG PAGI ---
    if (sesiSasaran === 'pagi' || sesiSasaran === 'kedua') {
      if (guruPagi.length > 0 && skopPagi.length > 0) {
        if (kaedah === 'kumpulan') {
          const gIdx = w % grpPagiCount;
          const members = kumpulanPagiPool[gIdx];
          skopPagi.forEach((sk, sIdx) => {
            const assigned = members[sIdx % members.length] || guruPagi[0];
            currentAssignments.push({
              skop: `[PAGI] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'pagi'
            });
          });
        } else if (kaedah === 'seimbang') {
          skopPagi.forEach((sk) => {
            const assigned = guruPagi[indexPagiTracker % guruPagi.length];
            currentAssignments.push({
              skop: `[PAGI] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'pagi'
            });
            indexPagiTracker++;
          });
        } else {
          // Rawak
          const shuffled = [...guruPagi].sort(() => Math.random() - 0.5);
          skopPagi.forEach((sk, sIdx) => {
            const assigned = shuffled[sIdx % shuffled.length];
            currentAssignments.push({
              skop: `[PAGI] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'pagi'
            });
          });
        }
      }
    }

    // --- SIDANG PETANG ---
    if (sesiSasaran === 'petang' || sesiSasaran === 'kedua') {
      if (guruPetang.length > 0 && skopPetang.length > 0) {
        if (kaedah === 'kumpulan') {
          const gIdx = w % grpPetangCount;
          const members = kumpulanPetangPool[gIdx];
          skopPetang.forEach((sk, sIdx) => {
            const assigned = members[sIdx % members.length] || guruPetang[0];
            currentAssignments.push({
              skop: `[PETANG] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'petang'
            });
          });
        } else if (kaedah === 'seimbang') {
          skopPetang.forEach((sk) => {
            const assigned = guruPetang[indexPetangTracker % guruPetang.length];
            currentAssignments.push({
              skop: `[PETANG] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'petang'
            });
            indexPetangTracker++;
          });
        } else {
          // Rawak
          const shuffled = [...guruPetang].sort(() => Math.random() - 0.5);
          skopPetang.forEach((sk, sIdx) => {
            const assigned = shuffled[sIdx % shuffled.length];
            currentAssignments.push({
              skop: `[PETANG] ${sk.nama}`,
              guruNama: assigned.nama,
              sidang: 'petang'
            });
          });
        }
      }
    }

    const groupLabel =
      sesiSasaran === 'kedua'
        ? `Kump. ${(w % grpPagiCount) + 1} (Pagi) & Kump. ${(w % grpPetangCount) + 1} (Petang)`
        : sesiSasaran === 'pagi'
        ? `Kumpulan ${(w % grpPagiCount) + 1} (Pagi)`
        : `Kumpulan ${(w % grpPetangCount) + 1} (Petang)`;

    results.push({
      mingguKe: mingguKira,
      tarikhIsnin: curMonday,
      tarikhJumaat: curFriday,
      kumpulanNama: groupLabel,
      adakahCuti: false,
      tugasan: currentAssignments
    });

    mingguKira++;
    curMonday = addDays(curMonday, 7);
  }

  return results;
}
