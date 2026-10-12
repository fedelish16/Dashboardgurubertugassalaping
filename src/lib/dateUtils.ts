export const HARI_MELAYU = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
export const HARI_SEKOLAH = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];

export const BULAN_MELAYU = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

/**
 * Format Date to YYYY-MM-DD local
 */
export function toISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse string into YYYY-MM-DD
 */
export function parseDateInput(value: unknown): string {
  if (!value) return '';
  const str = String(value).trim();
  
  // Format YYYY-MM-DD
  const m1 = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m1) {
    return `${m1[1]}-${m1[2].padStart(2, '0')}-${m1[3].padStart(2, '0')}`;
  }

  // Format DD/MM/YYYY
  const m2 = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m2) {
    const yr = m2[3].length === 2 ? `20${m2[3]}` : m2[3];
    return `${yr}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  }

  return '';
}

/**
 * Add days to YYYY-MM-DD
 */
export function addDays(isoStr: string, days: number): string {
  const parts = isoStr.split('-').map(Number);
  if (parts.length !== 3) return isoStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Get Monday for the given date (YYYY-MM-DD)
 */
export function getMonday(isoStr: string): string {
  const parts = isoStr.split('-').map(Number);
  if (parts.length !== 3) return isoStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  // getDay: 0 (Sun), 1 (Mon), ..., 6 (Sat)
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/**
 * Format to DD/MM/YYYY
 */
export function formatDDMMYYYY(isoStr: string): string {
  if (!isoStr || isoStr.length < 10) return '';
  const parts = isoStr.slice(0, 10).split('-');
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Format to 'Hari, D MMMM YYYY'
 */
export function formatMalayDate(isoStr: string): string {
  if (!isoStr || isoStr.length < 10) return '';
  const parts = isoStr.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3) return isoStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const hari = HARI_MELAYU[d.getDay()];
  const bulan = BULAN_MELAYU[parts[1] - 1];
  return `${hari}, ${parts[2]} ${bulan} ${parts[0]}`;
}

/**
 * Format weekly range e.g. "5 Okt 2026 – 9 Okt 2026"
 */
export function formatMalayWeekRange(mondayIso: string): string {
  const fridayIso = addDays(mondayIso, 4);
  const mParts = mondayIso.split('-').map(Number);
  const fParts = fridayIso.split('-').map(Number);
  if (mParts.length !== 3 || fParts.length !== 3) return mondayIso;
  
  const mMonth = BULAN_MELAYU[mParts[1] - 1].slice(0, 3);
  const fMonth = BULAN_MELAYU[fParts[1] - 1].slice(0, 3);

  if (mParts[1] === fParts[1]) {
    return `${mParts[2]} – ${fParts[2]} ${fMonth} ${fParts[0]}`;
  }
  return `${mParts[2]} ${mMonth} – ${fParts[2]} ${fMonth} ${fParts[0]}`;
}

/**
 * Get weekday name from ISO string
 */
export function getMalayDayName(isoStr: string): string {
  const parts = isoStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return HARI_MELAYU[d.getDay()];
}
