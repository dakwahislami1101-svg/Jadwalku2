import { ShiftCode, Staff, ShiftSummary, MonthSchedule } from '../types';
import { SHIFT_DEFINITIONS, distributeSoreShiftsFairly, distributeSeptemberMorningShifts, distributeSeptemberNightShifts, OFFICIAL_WEEKLY_PATTERNS } from '../data/initialSchedule';

export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

// Calculate individual staff stats for a month
export function calculateStaffSummary(
  staff: Staff | undefined | null,
  days: Record<number, Record<number, ShiftCode>>,
  totalDays: number
): ShiftSummary {
  if (!staff) {
    return {
      staffId: 0,
      staffName: '-',
      pFull: 0,
      p: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      s: 0,
      s2a: 0,
      s3a: 0,
      s4a: 0,
      m: 0,
      mFull: 0,
      m1: 0,
      m2: 0,
      lp: 0,
      off: 0,
      cuti: 0,
      totalHours: 0,
    };
  }

  let p = 0;
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let s = 0;
  let s2a = 0;
  let s3a = 0;
  let s4a = 0;
  let m = 0;
  let m1 = 0;
  let m2 = 0;
  let lp = 0;
  let off = 0;
  let cuti = 0;

  for (let d = 1; d <= totalDays; d++) {
    const shift = days[d]?.[staff.id] || 'O';
    switch (shift) {
      case 'P1':
        p1++;
        break;
      case 'P':
        p++;
        break;
      case 'P2':
        p2++;
        break;
      case 'P3':
        p3++;
        break;
      case 'S':
        s++;
        break;
      case 'S2A':
        s++;
        s2a++;
        break;
      case 'S3A':
        s++;
        s3a++;
        break;
      case 'S4A':
        s++;
        s4a++;
        break;
      case 'M1':
        m++;
        m1++;
        break;
      case 'M2':
        m++;
        m2++;
        break;
      case 'M':
        m++;
        break;
      case 'LP':
        lp++;
        break;
      case 'O':
      case 'L':
        off++;
        break;
      case 'C':
        cuti++;
        break;
    }
  }

  const pFull = p + p1 + p2 + p3;
  // Calculate total working hours according to document hours:
  // P1 = 8h (07:00-15:00), P2 = 8h (08:00-16:00), P = 8h (07:00-15:00), P3 = 9h (07:00-16:00 Upacara Senin),
  // S, S2A, S3A, S4A = 8h (15:00-23:00), M, M1, M2 = 16h (15:00-07:00 next day / 16h shift duty)
  // LP, O, C = 0h
  const totalHours = (p1 * 8) + (p * 8) + (p2 * 8) + (p3 * 9) + (s * 8) + (m * 16);

  return {
    staffId: staff.id,
    staffName: staff.name,
    pFull,
    p,
    p1,
    p2,
    p3,
    s,
    s2a,
    s3a,
    s4a,
    m,
    mFull: m,
    m1,
    m2,
    lp,
    off,
    cuti,
    totalHours,
  };
}

// Calculate daily counts for the bottom table summary
export interface DailyColumnStats {
  p: number;
  p1: number;
  p2: number;
  p3: number;
  pagiFull: number;
  s: number;
  s2a: number;
  s3a: number;
  s4a: number;
  m: number;
  mFull: number;
  m1: number;
  m2: number;
  cuti: number;
  offDanLepas: number;
  total: number;
  pagiWali: Staff[];
  pagi1Wali: Staff[];
  pagi2Wali: Staff[];
  soreWali: Staff[];
  soreKantinSmp: Staff[];
  soreKantinSma: Staff[];
  soreMasjid: Staff[];
  malamWali: Staff[];
  malam1Wali: Staff[];
  malam2Wali: Staff[];
  lepasWali: Staff[];
  offWali: Staff[];
  cutiWali: Staff[];
}

export function calculateDailyStats(
  day: number,
  days: Record<number, Record<number, ShiftCode>>,
  staffList: Staff[]
): DailyColumnStats {
  let p = 0;
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let s = 0;
  let s2a = 0;
  let s3a = 0;
  let s4a = 0;
  let m = 0;
  let m1 = 0;
  let m2 = 0;
  let cuti = 0;
  let offDanLepas = 0;

  const pagiWali: Staff[] = [];
  const pagi1Wali: Staff[] = [];
  const pagi2Wali: Staff[] = [];
  const soreWali: Staff[] = [];
  const soreKantinSmp: Staff[] = [];
  const soreKantinSma: Staff[] = [];
  const soreMasjid: Staff[] = [];
  const malamWali: Staff[] = [];
  const malam1Wali: Staff[] = [];
  const malam2Wali: Staff[] = [];
  const lepasWali: Staff[] = [];
  const offWali: Staff[] = [];
  const cutiWali: Staff[] = [];

  staffList.forEach((staff) => {
    const shift = days[day]?.[staff.id] || 'O';
    switch (shift) {
      case 'P1':
        p1++;
        pagiWali.push(staff);
        pagi1Wali.push(staff);
        break;
      case 'P':
        p++;
        pagiWali.push(staff);
        pagi1Wali.push(staff);
        break;
      case 'P2':
        p2++;
        pagiWali.push(staff);
        pagi2Wali.push(staff);
        break;
      case 'P3':
        p3++;
        pagiWali.push(staff);
        break;
      case 'S':
        s++;
        soreWali.push(staff);
        break;
      case 'S2A':
        s++;
        s2a++;
        soreWali.push(staff);
        soreKantinSmp.push(staff);
        break;
      case 'S3A':
        s++;
        s3a++;
        soreWali.push(staff);
        soreKantinSma.push(staff);
        break;
      case 'S4A':
        s++;
        s4a++;
        soreWali.push(staff);
        soreMasjid.push(staff);
        break;
      case 'M1':
        m++;
        m1++;
        malamWali.push(staff);
        malam1Wali.push(staff);
        break;
      case 'M2':
        m++;
        m2++;
        malamWali.push(staff);
        malam2Wali.push(staff);
        break;
      case 'M':
        m++;
        malamWali.push(staff);
        break;
      case 'LP':
        offDanLepas++;
        lepasWali.push(staff);
        break;
      case 'O':
      case 'L':
        offDanLepas++;
        offWali.push(staff);
        break;
      case 'C':
        cuti++;
        cutiWali.push(staff);
        break;
    }
  });

  return {
    p,
    p1,
    p2,
    p3,
    pagiFull: p + p1 + p2 + p3,
    s,
    s2a,
    s3a,
    s4a,
    m,
    mFull: m,
    m1,
    m2,
    cuti,
    offDanLepas,
    total: staffList.length,
    pagiWali,
    pagi1Wali,
    pagi2Wali,
    soreWali,
    soreKantinSmp,
    soreKantinSma,
    soreMasjid,
    malamWali,
    malam1Wali,
    malam2Wali,
    lepasWali,
    offWali,
    cutiWali,
  };
}

// Get active shift based on current time
export function getActiveShiftsAtTime(timeStr: string): ShiftCode[] {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const currentMinutes = hours * 60 + minutes;

  const active: ShiftCode[] = [];

  // P1 (07:00 - 15:00 => 420 to 900)
  if (currentMinutes >= 7 * 60 && currentMinutes < 15 * 60) {
    active.push('P1');
    active.push('P');
    active.push('P3');
  }
  // P2 (08:00 - 16:00 => 480 to 960)
  if (currentMinutes >= 8 * 60 && currentMinutes < 16 * 60) {
    active.push('P2');
  }
  // S / S2A / S3A / S4A (15:00 - 23:00 => 900 to 1380)
  if (currentMinutes >= 15 * 60 && currentMinutes < 23 * 60) {
    active.push('S');
    active.push('S2A');
    active.push('S3A');
    active.push('S4A');
  }
  // M / M1 / M2 (15:00 - 07:00 next day => >= 900 OR < 420)
  if (currentMinutes >= 15 * 60 || currentMinutes < 7 * 60) {
    active.push('M');
    active.push('M1');
    active.push('M2');
  }

  return active;
}

// Generate new month automatic shift rotation based on the official Kemensos rotation cycle pattern:
// Pola: 1P - 4S - 1M - 1LP (Tanpa Off, hanya Lepas Piket setelah M)
export function generateAutoSchedule(
  year: number,
  month: number,
  staffList: Staff[],
  options?: {
    staggerDays?: number;
    priorMonthEndShifts?: Record<number, ShiftCode>;
  }
): MonthSchedule {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rawDays: Record<number, Record<number, ShiftCode>> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    rawDays[d] = {};
    const dObj = new Date(year, month - 1, d);
    const jsDay = dObj.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to index: 0=Senin, 1=Selasa, 2=Rabu, 3=Kamis, 4=Jumat, 5=Sabtu, 6=Minggu
    const patternIdx = (jsDay + 6) % 7;

    staffList.forEach((staff, index) => {
      // If staff has official weekly pattern registered by ID (either 1..18 or 21..38), use it
      const officialPattern = OFFICIAL_WEEKLY_PATTERNS[staff.id] || OFFICIAL_WEEKLY_PATTERNS[staff.id - 20];
      if (officialPattern) {
        rawDays[d][staff.id] = officialPattern[patternIdx];
      } else {
        // Fallback to rotation cycle based on index
        const fallbackPattern: ShiftCode[] = ['M', 'LP', 'S', 'S', 'S', 'S', 'P'];
        const shiftedIdx = (patternIdx + index) % 7;
        rawDays[d][staff.id] = fallbackPattern[shiftedIdx];
      }
    });
  }

  const soreDays = distributeSoreShiftsFairly(rawDays);
  const morningDays = distributeSeptemberMorningShifts(soreDays, year, month, staffList);
  const days = distributeSeptemberNightShifts(morningDays, year, month, staffList);

  return {
    year,
    month,
    monthName: INDONESIAN_MONTH_NAMES[month - 1],
    totalDays: daysInMonth,
    staffList,
    days,
  };
}

// Convert Schedule to CSV
export function exportScheduleToCSV(
  schedule: MonthSchedule,
  summaries: ShiftSummary[]
): string {
  const headerDays = Array.from({ length: schedule.totalDays }, (_, i) => i + 1).join(',');
  let csv = `No,Nama,${headerDays},P FUL,S,S2A (Kantin SMP),S3A (Kantin SMA),S4A (Jaga Masjid),M (Total),M1 (s.d 00:00),M2 (Subuh-07:00),LP,OFF,P1,P2,P3,JK (Jam)\n`;

  schedule.staffList.forEach((staff, idx) => {
    const summary = summaries.find((s) => s.staffId === staff.id);
    const rowShifts = Array.from({ length: schedule.totalDays }, (_, i) => {
      return schedule.days[i + 1]?.[staff.id] || 'O';
    }).join(',');

    const p1Val = (summary?.p1 || 0) + (summary?.p || 0);
    const statsStr = `${summary?.pFull || 0},${summary?.s || 0},${summary?.s2a || 0},${summary?.s3a || 0},${summary?.s4a || 0},${summary?.m || 0},${summary?.m1 || 0},${summary?.m2 || 0},${summary?.lp || 0},${summary?.off || 0},${p1Val},${summary?.p2 || 0},${summary?.p3 || 0},${summary?.totalHours || 0}`;

    csv += `${idx + 1},"${staff.name}",${rowShifts},${statsStr}\n`;
  });

  return csv;
}

/**
 * Generate Next Month Schedule derived from a Source Month Schedule.
 * Retains exact shift definitions, roles, staff list, and distribution rules,
 * while automatically adapting days, dates, calendar alignment, and Monday P3 ceremonies.
 */
export function generateNextMonthScheduleFromPrior(
  sourceSchedule: MonthSchedule,
  targetYear: number,
  targetMonth: number,
  mode: 'continuation' | 'day_matching' = 'continuation'
): MonthSchedule {
  const targetDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  const staffList = sourceSchedule.staffList;
  const rawDays: Record<number, Record<number, ShiftCode>> = {};

  // Cycle sequence for standard rotation: M -> LP -> O -> P -> S -> S -> S (7 steps)
  const ROTATION_CYCLE: ShiftCode[] = ['M', 'LP', 'O', 'P', 'S', 'S', 'S'];

  // Build a map of staff's last known shift category in the source schedule
  const lastKnownShift: Record<number, ShiftCode> = {};
  const sourceLastDay = sourceSchedule.totalDays;

  staffList.forEach((st) => {
    const rawShift = sourceSchedule.days[sourceLastDay]?.[st.id] || 'O';
    if (rawShift.startsWith('P')) lastKnownShift[st.id] = 'P';
    else if (rawShift.startsWith('S')) lastKnownShift[st.id] = 'S';
    else if (rawShift.startsWith('M')) lastKnownShift[st.id] = 'M';
    else if (rawShift === 'LP') lastKnownShift[st.id] = 'LP';
    else lastKnownShift[st.id] = 'O';
  });

  if (mode === 'continuation') {
    // Determine starting step for each staff on day 1
    const staffCurrentStep: Record<number, number> = {};

    staffList.forEach((st, idx) => {
      const lastShift = lastKnownShift[st.id];
      let nextStepIndex = 0;

      if (lastShift === 'M') nextStepIndex = 1; // M -> LP
      else if (lastShift === 'LP') nextStepIndex = 2; // LP -> O
      else if (lastShift === 'O') nextStepIndex = 3; // O -> P
      else if (lastShift === 'P') nextStepIndex = 4; // P -> S
      else if (lastShift === 'S') nextStepIndex = 5; // S -> S
      else nextStepIndex = (idx * 2) % ROTATION_CYCLE.length;

      staffCurrentStep[st.id] = nextStepIndex;
    });

    for (let d = 1; d <= targetDaysInMonth; d++) {
      rawDays[d] = {};
      staffList.forEach((st) => {
        const step = (staffCurrentStep[st.id] + (d - 1)) % ROTATION_CYCLE.length;
        rawDays[d][st.id] = ROTATION_CYCLE[step];
      });
    }
  } else {
    // Mode: Day-of-week matching
    for (let d = 1; d <= targetDaysInMonth; d++) {
      rawDays[d] = {};
      const targetDate = new Date(targetYear, targetMonth - 1, d);
      const jsDay = targetDate.getDay(); // 0=Minggu, 1=Senin...

      // Find days in source month with same jsDay
      const matchingSourceDays: number[] = [];
      for (let sd = 1; sd <= sourceSchedule.totalDays; sd++) {
        const sDate = new Date(sourceSchedule.year, sourceSchedule.month - 1, sd);
        if (sDate.getDay() === jsDay) {
          matchingSourceDays.push(sd);
        }
      }

      const sourceDayToCopy = matchingSourceDays.length > 0
        ? matchingSourceDays[(Math.floor((d - 1) / 7)) % matchingSourceDays.length]
        : ((d - 1) % sourceSchedule.totalDays) + 1;

      staffList.forEach((st) => {
        rawDays[d][st.id] = sourceSchedule.days[sourceDayToCopy]?.[st.id] || 'O';
      });
    }
  }

  // Refine through fair shift distribution pipelines:
  const soreDays = distributeSoreShiftsFairly(rawDays);
  const morningDays = distributeSeptemberMorningShifts(soreDays, targetYear, targetMonth, staffList);
  const finalDays = distributeSeptemberNightShifts(morningDays, targetYear, targetMonth, staffList);

  return {
    year: targetYear,
    month: targetMonth,
    monthName: INDONESIAN_MONTH_NAMES[targetMonth - 1],
    totalDays: targetDaysInMonth,
    staffList,
    days: finalDays,
  };
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
