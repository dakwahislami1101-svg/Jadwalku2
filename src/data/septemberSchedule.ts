import { Staff, ShiftCode } from '../types';

export const SEPTEMBER_2026_STAFF_LIST: Staff[] = [
  // 17 Petugas Laki-laki (L1 - L17)
  { id: 1, code: 'L1', name: "Aris Mahmud Syafi'i", gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ams', phone: '0812-3456-7801' },
  { id: 2, code: 'L2', name: 'Muji Santoso', gender: 'L', jenjang: 'SD', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ms', phone: '0812-3456-7802' },
  { id: 3, code: 'L3', name: 'Moch. Chabib', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'mc', phone: '0812-3456-7803' },
  { id: 4, code: 'L4', name: 'Moh Asrofi', gender: 'L', jenjang: 'SD', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ma', phone: '0812-3456-7804' },
  { id: 5, code: 'L5', name: 'Hariadi', gender: 'L', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'hrd', phone: '0812-3456-7805' },
  { id: 6, code: 'L6', name: 'Dwi Chusnul Mufid', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'dcm', phone: '0812-3456-7806' },
  { id: 7, code: 'L7', name: 'Suhariyono', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'shy', phone: '0812-3456-7807' },
  { id: 8, code: 'L8', name: 'A. Zainudin Sholeh', gender: 'L', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'zs', phone: '0812-3456-7808' },
  { id: 9, code: 'L9', name: 'Abisarwan Rafif', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ar', phone: '0812-3456-7809' },
  { id: 10, code: 'L10', name: 'Hiras Mando Rajagukguk', gender: 'L', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'hmr', phone: '0812-3456-7810' },
  { id: 11, code: 'L11', name: 'Nanang Arifin', gender: 'L', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'na', phone: '0812-3456-7811' },
  { id: 12, code: 'L12', name: 'Yusak Wasis Pratonggo', gender: 'L', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ywp', phone: '0812-3456-7812' },
  { id: 13, code: 'L13', name: 'Akhmad Fadkhurriza I', gender: 'L', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'afi', phone: '0812-3456-7813' },
  { id: 14, code: 'L14', name: "Amirul Mu'minin Rofico P.K.", gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'amr', phone: '0812-3456-7814' },
  { id: 15, code: 'L15', name: 'Teguh Cahyono', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'tc', phone: '0812-3456-7815' },
  { id: 16, code: 'L16', name: 'Eko Wahyudi', gender: 'L', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'ew', phone: '0812-3456-7816' },
  { id: 17, code: 'L17', name: 'Adityo Rizky Winarno', gender: 'L', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Laki-laki', initials: 'arw', phone: '0812-3456-7817' },

  // 14 Petugas Perempuan (P1 - P14)
  { id: 18, code: 'P1', name: 'Dewi Askinu', gender: 'P', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'da', phone: '0812-3456-7818' },
  { id: 19, code: 'P2', name: 'Ambika Widya Asmara', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'awa', phone: '0812-3456-7819' },
  { id: 20, code: 'P3', name: 'Rindani', gender: 'P', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'rin', phone: '0812-3456-7820' },
  { id: 21, code: 'P4', name: 'Eky Venty Pricilia', gender: 'P', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'evp', phone: '0812-3456-7821' },
  { id: 22, code: 'P5', name: 'Retnowati', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'rn', phone: '0812-3456-7822' },
  { id: 23, code: 'P6', name: 'Deni Furitrinofi', gender: 'P', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'df', phone: '0812-3456-7823' },
  { id: 24, code: 'P7', name: 'Chusfia Hanik Wihayati', gender: 'P', jenjang: 'SD', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'chw', phone: '0812-3456-7824' },
  { id: 25, code: 'P8', name: 'Theresa Inganta Ginting', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'tig', phone: '0812-3456-7825' },
  { id: 26, code: 'P9', name: 'Siti Maslukah', gender: 'P', jenjang: 'SD', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'sm', phone: '0812-3456-7826' },
  { id: 27, code: 'P10', name: 'Alifia Senja', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'asj', phone: '0812-3456-7827' },
  { id: 28, code: 'P11', name: 'Erna Rizkiani', gender: 'P', jenjang: 'SMP', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'er', phone: '0812-3456-7828' },
  { id: 29, code: 'P12', name: 'Afida Saidatul Fuadia', gender: 'P', jenjang: 'SMA', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'asf', phone: '0812-3456-7829' },
  { id: 30, code: 'P13', name: 'Anita Kurniawati', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'ak', phone: '0812-3456-7830' },
  { id: 31, code: 'P14', name: 'Herlina Ratu Belia', gender: 'P', jenjang: '-', role: 'Wali Asuh', group: 'Petugas Perempuan', initials: 'hrb', phone: '0812-3456-7831' },
];

// Raw Shift Arrays for September 2026 (Days 1 to 30) - Exact CSV Mapping
export const RAW_SEPTEMBER_2026_SCHEDULE: Record<number, ShiftCode[]> = {
  1:  ['P',  'P',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L'],
  2:  ['P',  'P',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L'],
  3:  ['L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP'],
  4:  ['L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP'],
  5:  ['LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M'],
  6:  ['LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M'],
  7:  ['M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S'],
  8:  ['M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S'],
  9:  ['S',  'S',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S'],
  10: ['S',  'S',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S'],
  11: ['P',  'P',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P'],
  12: ['S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P'],
  13: ['P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L'],
  14: ['L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP'],
  15: ['LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M'],
  16: ['M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S'],
  17: ['S',  'S',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S'],
  18: ['P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L'],
  19: ['P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L'],
  20: ['L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP'],
  21: ['L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP'],
  22: ['LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M'],
  23: ['LP', 'P',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M'],
  24: ['M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S'],
  25: ['M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S'],
  26: ['S',  'S',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S'],
  27: ['S',  'S',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S'],
  28: ['S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P'],
  29: ['S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P'],
  30: ['S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P',  'S',  'S',  'M',  'LP', 'L',  'P'],
  31: ['P',  'P',  'L',  'P',  'P',  'P',  'P',  'P',  'P',  'L',  'P',  'P',  'P',  'P',  'P',  'P',  'L',  'P',  'P',  'P',  'P',  'P',  'P',  'L',  'P',  'P',  'P',  'P',  'P',  'P'],
};

export function isGroup1Staff(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('aris mahmud') ||
    n.includes('sholeh') ||
    n.includes('nanang') ||
    n.includes('fadkhurriza') ||
    n.includes('ivakhudin') ||
    n.includes('erna') ||
    n.includes('afida') ||
    n.includes('maslukah') ||
    n.includes('chusfia') ||
    n.includes('asrofi') ||
    n.includes('muji santoso') ||
    n.includes('senja')
  );
}

export function isGroup2Staff(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('eko wahyudi') ||
    n.includes('muji santoso') ||
    n.includes('yusak') ||
    n.includes('chusfia') ||
    n.includes('hiras') ||
    n.includes('theresa') ||
    n.includes('sholeh')
  );
}

export function isGroup3Staff(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('aris mahmud') ||
    n.includes('rindani') ||
    n.includes('mufid') ||
    n.includes('rafif') ||
    n.includes('anita')
  );
}

export function getStaffCanteenPreference(staffId: number, staffName: string): { canteen: 'SMP' | 'SMA'; area: 'MASJID' | 'KANTIN' } {
  if (isGroup1Staff(staffName)) {
    return { canteen: isGroup2Staff(staffName) ? 'SMP' : 'SMA', area: 'MASJID' };
  }
  if (isGroup2Staff(staffName)) {
    return { canteen: 'SMP', area: 'KANTIN' };
  }
  if (isGroup3Staff(staffName)) {
    return { canteen: 'SMA', area: 'KANTIN' };
  }
  return { canteen: 'SMP', area: 'KANTIN' };
}

export function distributeSeptemberSoreShifts(
  rawDays: Record<number, Record<number, ShiftCode>>,
  year: number = 2026,
  month: number = 9,
  staffList: Staff[] = SEPTEMBER_2026_STAFF_LIST
): Record<number, Record<number, ShiftCode>> {
  const result: Record<number, Record<number, ShiftCode>> = {};
  const totalDays = 30;

  // Track counts of S2A, S3A, S4A across the month to ensure fair rotation
  const s2aCounts: Record<number, number> = {};
  const s3aCounts: Record<number, number> = {};
  const s4aCounts: Record<number, number> = {};

  staffList.forEach((s) => {
    s2aCounts[s.id] = 0;
    s3aCounts[s.id] = 0;
    s4aCounts[s.id] = 0;
  });

  for (let d = 1; d <= totalDays; d++) {
    result[d] = { ...(rawDays[d] || {}) };

    // Identify staff with sore shift on day d (S, S2A, S3A, S4A)
    const soreStaffList: Staff[] = [];
    staffList.forEach((staff) => {
      const shift = rawDays[d]?.[staff.id];
      if (
        shift === 'S' ||
        shift === 'S2A' ||
        shift === 'S3A' ||
        shift === 'S4A'
      ) {
        soreStaffList.push(staff);
      }
    });

    const N = soreStaffList.length;
    if (N === 0) continue;

    // Rule: Exactly 2 people for S2A, 2 people for S3A, and remainder for S4A
    const s2aQuota = N >= 4 ? 2 : Math.min(2, Math.floor(N / 2));
    const s3aQuota = N >= 4 ? 2 : Math.min(2, N - s2aQuota);
    // All remaining will be S4A

    // --- Step 1: Allocate S2A (Kantin SMP - exactly 2 people) ---
    // Sort soreStaffList by suitability for S2A (Group 2 prioritized)
    soreStaffList.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (isGroup2Staff(a.name)) scoreA += 100;
      if (isGroup3Staff(a.name)) scoreA -= 40;
      if (isGroup1Staff(a.name) && !isGroup2Staff(a.name)) scoreA -= 20;

      if (isGroup2Staff(b.name)) scoreB += 100;
      if (isGroup3Staff(b.name)) scoreB -= 40;
      if (isGroup1Staff(b.name) && !isGroup2Staff(b.name)) scoreB -= 20;

      // Penalize higher prior S2A counts for fair rotation
      scoreA -= (s2aCounts[a.id] || 0) * 15;
      scoreB -= (s2aCounts[b.id] || 0) * 15;

      return scoreB - scoreA;
    });

    const s2aAssigned = soreStaffList.slice(0, s2aQuota);
    const remainingAfterS2A = soreStaffList.slice(s2aQuota);

    s2aAssigned.forEach((st) => {
      result[d][st.id] = 'S2A';
      s2aCounts[st.id] = (s2aCounts[st.id] || 0) + 1;
    });

    // --- Step 2: Allocate S3A (Kantin SMA - exactly 2 people) ---
    // Sort remaining staff by suitability for S3A (Group 3 prioritized)
    remainingAfterS3A_sorting:
    remainingAfterS2A.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (isGroup3Staff(a.name)) scoreA += 100;
      if (isGroup1Staff(a.name) && !isGroup3Staff(a.name)) scoreA -= 30;

      if (isGroup3Staff(b.name)) scoreB += 100;
      if (isGroup1Staff(b.name) && !isGroup3Staff(b.name)) scoreB -= 30;

      // Penalize higher prior S3A counts for fair rotation
      scoreA -= (s3aCounts[a.id] || 0) * 15;
      scoreB -= (s3aCounts[b.id] || 0) * 15;

      return scoreB - scoreA;
    });

    const s3aAssigned = remainingAfterS2A.slice(0, s3aQuota);
    const s4aAssigned = remainingAfterS2A.slice(s3aQuota);

    s3aAssigned.forEach((st) => {
      result[d][st.id] = 'S3A';
      s3aCounts[st.id] = (s3aCounts[st.id] || 0) + 1;
    });

    // --- Step 3: Allocate S4A (Jaga Masjid - ALL remaining staff) ---
    s4aAssigned.forEach((st) => {
      result[d][st.id] = 'S4A';
      s4aCounts[st.id] = (s4aCounts[st.id] || 0) + 1;
    });
  }

  return result;
}

export function distributeSeptemberMorningShifts(
  rawDays: Record<number, Record<number, ShiftCode>>,
  year: number = 2026,
  month: number = 9,
  staffList: Staff[] = SEPTEMBER_2026_STAFF_LIST
): Record<number, Record<number, ShiftCode>> {
  const result: Record<number, Record<number, ShiftCode>> = {};
  const totalDays = new Date(year, month, 0).getDate();

  // Track counts of P1 and P2 per staffId across the month
  const p1Counts: Record<number, number> = {};
  const p2Counts: Record<number, number> = {};
  staffList.forEach((s) => {
    p1Counts[s.id] = 0;
    p2Counts[s.id] = 0;
  });

  for (let d = 1; d <= totalDays; d++) {
    result[d] = { ...(rawDays[d] || {}) };
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 1 = Senin, ...

    // Identify staff with morning shift on day d
    const morningStaffIds: number[] = [];
    staffList.forEach((staff) => {
      const shift = rawDays[d]?.[staff.id];
      if (shift === 'P' || shift === 'P1' || shift === 'P2' || shift === 'P3') {
        morningStaffIds.push(staff.id);
      }
    });

    if (morningStaffIds.length === 0) continue;

    if (dayOfWeek === 1) {
      // Aturan Hari Senin: Seluruh petugas piket pagi menjadi P3 (07:00 - 16:00) dikarenakan ada upacara bendera
      morningStaffIds.forEach((id) => {
        result[d][id] = 'P3';
      });
    } else {
      // Non-Monday: Atur secara adil sehingga orang yang mendapat p1 atau p2 kurang lebih jumlahnya sama
      // Sort staff so those with fewer P1s (or higher P2 vs P1 ratio) get P1 first
      morningStaffIds.sort((a, b) => {
        const netA = (p1Counts[a] || 0) - (p2Counts[a] || 0);
        const netB = (p1Counts[b] || 0) - (p2Counts[b] || 0);
        if (netA !== netB) return netA - netB;
        return (p1Counts[a] || 0) - (p1Counts[b] || 0);
      });

      // Split evenly: floor(N/2) get P1, ceil(N/2) get P2
      const p1CountToday = Math.floor(morningStaffIds.length / 2);

      morningStaffIds.forEach((id, index) => {
        if (index < p1CountToday) {
          result[d][id] = 'P1';
          p1Counts[id] = (p1Counts[id] || 0) + 1;
        } else {
          result[d][id] = 'P2';
          p2Counts[id] = (p2Counts[id] || 0) + 1;
        }
      });
    }
  }

  return result;
}

export function distributeSeptemberNightShifts(
  rawDays: Record<number, Record<number, ShiftCode>>,
  year: number = 2026,
  month: number = 9,
  staffList: Staff[] = SEPTEMBER_2026_STAFF_LIST
): Record<number, Record<number, ShiftCode>> {
  const result: Record<number, Record<number, ShiftCode>> = {};
  const totalDays = new Date(year, month, 0).getDate();

  const staffMap = new Map<number, Staff>();
  staffList.forEach((s) => staffMap.set(s.id, s));

  for (let d = 1; d <= totalDays; d++) {
    result[d] = { ...(rawDays[d] || {}) };

    const nightStaffIds: number[] = [];
    staffList.forEach((staff) => {
      const shift = rawDays[d]?.[staff.id];
      if (shift === 'M' || shift === 'M1' || shift === 'M2') {
        nightStaffIds.push(staff.id);
      }
    });

    if (nightStaffIds.length === 0) continue;

    // Separate night staff by gender based on official Kemensos decree:
    // 1. Petugas Laki-laki bertugas sampai jam 00:00 -> M1
    // 2. Petugas Perempuan bertugas setelah subuh sampai jam 07:00 -> M2
    const maleStaffIds: number[] = [];
    const femaleStaffIds: number[] = [];

    nightStaffIds.forEach((id) => {
      const st = staffMap.get(id);
      const isFemale =
        st?.gender === 'P' ||
        st?.group?.toLowerCase().includes('perempuan') ||
        (st?.code && st.code.startsWith('P') && Number(st.code.replace('P', '')) >= 1 && Number(st.code.replace('P', '')) <= 20);

      if (isFemale) {
        femaleStaffIds.push(id);
      } else {
        maleStaffIds.push(id);
      }
    });

    if (maleStaffIds.length > 0 && femaleStaffIds.length > 0) {
      // Standard scenario: Laki-laki get M1, Perempuan get M2
      maleStaffIds.forEach((id) => {
        result[d][id] = 'M1';
      });
      femaleStaffIds.forEach((id) => {
        result[d][id] = 'M2';
      });
    } else if (maleStaffIds.length > 0) {
      // All are male on this day: split between M1 (first half) and M2 (second half)
      const m1Quota = Math.ceil(maleStaffIds.length / 2);
      maleStaffIds.forEach((id, idx) => {
        result[d][id] = idx < m1Quota ? 'M1' : 'M2';
      });
    } else if (femaleStaffIds.length > 0) {
      // All are female on this day: split between M1 (first half) and M2 (second half)
      const m1Quota = Math.ceil(femaleStaffIds.length / 2);
      femaleStaffIds.forEach((id, idx) => {
        result[d][id] = idx < m1Quota ? 'M1' : 'M2';
      });
    }
  }

  return result;
}

export function distributeAllScheduleShifts(
  rawDays: Record<number, Record<number, ShiftCode>>,
  year: number = 2026,
  month: number = 9,
  staffList: Staff[] = SEPTEMBER_2026_STAFF_LIST
): Record<number, Record<number, ShiftCode>> {
  const withMorning = distributeSeptemberMorningShifts(rawDays, year, month, staffList);
  const withSore = distributeSeptemberSoreShifts(withMorning, year, month, staffList);
  return distributeSeptemberNightShifts(withSore, year, month, staffList);
}

export function getInitialSeptember2026Days(): Record<number, Record<number, ShiftCode>> {
  const baseDays: Record<number, Record<number, ShiftCode>> = {};
  for (let d = 1; d <= 30; d++) {
    baseDays[d] = {};
    for (let staffId = 1; staffId <= 31; staffId++) {
      const staffShifts = RAW_SEPTEMBER_2026_SCHEDULE[staffId];
      if (staffShifts && staffShifts[d - 1]) {
        baseDays[d][staffId] = staffShifts[d - 1];
      } else {
        baseDays[d][staffId] = 'L';
      }
    }
  }
  return distributeAllScheduleShifts(baseDays, 2026, 9, SEPTEMBER_2026_STAFF_LIST);
}
