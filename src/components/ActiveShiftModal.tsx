import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sun, 
  Sunset, 
  Moon, 
  Clock, 
  Users, 
  X, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { MonthSchedule, Staff, ShiftCode } from '../types';
import { soundManager } from '../utils/audio';
import { getLocalP5Assignments } from '../utils/p5TaskService';
import { getLocalMorningPostAssignments } from '../utils/morningPostService';

interface ActiveShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: MonthSchedule;
  staffList: Staff[];
  selectedStaffId: number;
  onNavigateToTab?: (tab: string) => void;
}

export type ShiftPeriodType = 'pagi' | 'sore' | 'malam';

export interface ShiftPeriodInfo {
  type: ShiftPeriodType;
  title: string;
  timeRange: string;
  accentGradient: string;
  icon: React.ReactNode;
}

/**
 * Deteksi periode shif berdasarkan jam lokal sekarang
 * Pagi: 07:00 - 15:00 (P4 s.d 20:00)
 * Sore: 15:00 - 23:00
 * Malam: 23:00 - 07:00
 */
export function getCurrentShiftPeriod(date: Date = new Date()): ShiftPeriodInfo {
  const hours = date.getHours();

  if (hours >= 7 && hours < 15) {
    return {
      type: 'pagi',
      title: 'Shif Pagi',
      timeRange: '07:00 – 15:00 WIB',
      accentGradient: 'from-sky-700 via-teal-700 to-emerald-800',
      icon: <Sun className="w-3.5 h-3.5 text-amber-300" />,
    };
  }

  if (hours >= 15 && hours < 23) {
    return {
      type: 'sore',
      title: 'Shif Sore',
      timeRange: '15:00 – 23:00 WIB',
      accentGradient: 'from-orange-700 via-amber-700 to-purple-800',
      icon: <Sunset className="w-3.5 h-3.5 text-amber-300" />,
    };
  }

  // Malam: 23:00 s.d 07:00
  return {
    type: 'malam',
    title: 'Shif Malam',
    timeRange: '23:00 – 07:00 WIB',
    accentGradient: 'from-indigo-950 via-slate-900 to-blue-950',
    icon: <Moon className="w-3.5 h-3.5 text-indigo-300" />,
  };
}

/**
 * Keterangan singkat & padat untuk setiap kode shif (misal: S2A Jaga Kantin SMP)
 */
export function getShortShiftDescription(
  code: ShiftCode, 
  customP5Title?: string,
  morningPostTitle?: string
): { shortDesc: string; badgeBg: string } {
  switch (code) {
    case 'P1':
    case 'P':
      return { 
        shortDesc: morningPostTitle ? `Pos ${morningPostTitle} (07-15)` : 'Piket Pagi 1 (Apel & Makan Siang)', 
        badgeBg: 'bg-sky-600 text-white' 
      };
    case 'P2':
      return { 
        shortDesc: morningPostTitle ? `Pos ${morningPostTitle} (08-16)` : 'Piket Pagi 2 (Operasional Sekolah)', 
        badgeBg: 'bg-teal-600 text-white' 
      };
    case 'P3':
      return { shortDesc: 'Piket Pagi Khusus (Upacara / Senin)', badgeBg: 'bg-amber-600 text-white' };
    case 'P4':
      return { shortDesc: 'Pagi Acara & Patroli Luar (s.d 20:00)', badgeBg: 'bg-cyan-700 text-white' };
    case 'P5':
      return { 
        shortDesc: customP5Title ? `${customP5Title} (07-15)` : 'Pendamping Keterampilan/Vokasi (07-15)', 
        badgeBg: 'bg-emerald-700 text-white' 
      };
    case 'S2A':
      return { shortDesc: 'Jaga Kantin SMP & Maghrib', badgeBg: 'bg-purple-600 text-white' };
    case 'S3A':
      return { shortDesc: 'Jaga Kantin SMA & Belajar', badgeBg: 'bg-orange-500 text-white' };
    case 'S4A':
      return { shortDesc: 'Jaga Masjid & Pengkondisian', badgeBg: 'bg-emerald-600 text-white' };
    case 'S':
      return { shortDesc: 'Piket Sore Asrama', badgeBg: 'bg-orange-600 text-white' };
    case 'M1':
      return { shortDesc: 'Jaga Malam Sesi 1 & Subuh', badgeBg: 'bg-indigo-700 text-white' };
    case 'M2':
      return { shortDesc: 'Jaga Malam Sesi 2 & Qiyamul Lail', badgeBg: 'bg-blue-700 text-white' };
    case 'M3':
      return { shortDesc: 'Patroli Foto Barak 23:00 & Malam Penuh', badgeBg: 'bg-fuchsia-700 text-white' };
    case 'M':
      return { shortDesc: 'Jaga Malam Asrama', badgeBg: 'bg-slate-700 text-white' };
    default:
      return { shortDesc: 'Petugas Piket', badgeBg: 'bg-blue-600 text-white' };
  }
}

const STORAGE_KEY_LAST_POPUP = 'wali_asuh_last_active_shift_popup';
const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 jam = 7.200.000 ms

export function shouldShowTwoHourShiftPopup(): boolean {
  try {
    const lastTimestamp = localStorage.getItem(STORAGE_KEY_LAST_POPUP);
    if (!lastTimestamp) return true;

    const lastTime = parseInt(lastTimestamp, 10);
    if (isNaN(lastTime)) return true;

    const now = Date.now();
    return (now - lastTime) >= TWO_HOURS_MS;
  } catch {
    return true;
  }
}

export function recordTwoHourShiftPopupShown(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_POPUP, String(Date.now()));
  } catch {}
}

export const ActiveShiftModal: React.FC<ActiveShiftModalProps> = ({
  isOpen,
  onClose,
  schedule,
  staffList,
  selectedStaffId,
  onNavigateToTab,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen) {
      setCurrentDate(new Date());
    }
  }, [isOpen]);

  const activePeriod = useMemo(() => {
    return getCurrentShiftPeriod(currentDate);
  }, [currentDate]);

  const todayDay = currentDate.getDate();
  const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][currentDate.getDay()];
  const timeFormatted = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  // Filter daftar petugas aktif di jam/periode sekarang
  const onDutyStaff = useMemo(() => {
    const list: {
      staff: Staff;
      shiftCode: ShiftCode;
      isCurrentUser: boolean;
      shortDesc: string;
      badgeBg: string;
    }[] = [];

    const p5Assignments = getLocalP5Assignments(schedule.year, schedule.month);
    const morningPostAssignments = getLocalMorningPostAssignments(schedule.year, schedule.month);

    staffList.forEach((staff) => {
      const shiftCode = schedule.days[todayDay]?.[staff.id];
      if (!shiftCode || shiftCode === 'O' || shiftCode === 'LP' || shiftCode === 'L' || shiftCode === 'C') {
        return;
      }

      let isIncluded = false;
      if (activePeriod.type === 'pagi') {
        if (['P1', 'P2', 'P3', 'P4', 'P5', 'P'].includes(shiftCode)) {
          isIncluded = true;
        }
      } else if (activePeriod.type === 'sore') {
        if (['S2A', 'S3A', 'S4A', 'S', 'P4'].includes(shiftCode)) {
          isIncluded = true;
        }
      } else if (activePeriod.type === 'malam') {
        if (['M1', 'M2', 'M3', 'M'].includes(shiftCode)) {
          isIncluded = true;
        }
      }

      if (isIncluded) {
        const p5Custom = shiftCode === 'P5' ? p5Assignments[`${todayDay}_${staff.id}`]?.taskTitle : undefined;
        const morningPost = (shiftCode === 'P1' || shiftCode === 'P2' || shiftCode === 'P') 
          ? morningPostAssignments[`${todayDay}_${staff.id}`]?.postTitle 
          : undefined;
        const { shortDesc, badgeBg } = getShortShiftDescription(shiftCode, p5Custom, morningPost);
        list.push({
          staff,
          shiftCode,
          isCurrentUser: staff.id === selectedStaffId,
          shortDesc,
          badgeBg,
        });
      }
    });

    return list.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      return a.staff.name.localeCompare(b.staff.name);
    });
  }, [staffList, schedule.days, schedule.year, schedule.month, todayDay, activePeriod.type, selectedStaffId]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl max-w-[340px] sm:max-w-[380px] w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all select-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Kompak Rapat - 1 Halaman Kecil Pas */}
        <div className={`px-2.5 py-1.5 bg-gradient-to-r ${activePeriod.accentGradient} text-white relative shadow-xs`}>
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 pr-6">
            <div className="w-5 h-5 rounded bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
              {activePeriod.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 leading-none">
                <h2 className="text-xs font-black tracking-tight truncate">
                  Petugas {activePeriod.title}
                </h2>
                <span className="px-1 py-0.2 rounded bg-black/25 text-[8.5px] font-bold">
                  {activePeriod.timeRange}
                </span>
              </div>
              <p className="text-[9.5px] text-white/90 truncate font-mono mt-0.5">
                {dayName}, {todayDay} {schedule.monthName} • {timeFormatted} WIB
              </p>
            </div>
          </div>
        </div>

        {/* Konten Rapat: Hanya Nama, Kode Tugas & Keterangan Singkat - Tanpa Perlu Menggeser */}
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between px-0.5 pb-0.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
              Petugas Aktif ({onDutyStaff.length})
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8.5px] text-amber-600 dark:text-amber-400 font-medium">
              <Sparkles className="w-2 h-2" />
              Tiap 2 Jam
            </span>
          </div>

          {onDutyStaff.length > 0 ? (
            <div className="space-y-1">
              {onDutyStaff.map(({ staff, shiftCode, isCurrentUser, shortDesc, badgeBg }) => (
                <div
                  key={staff.id}
                  className={`px-2 py-1 rounded border flex items-center justify-between gap-1.5 transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-2xs'
                      : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {/* Nama & Keterangan Singkat Saja */}
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                        {staff.name}
                      </span>
                      {isCurrentUser && (
                        <span className="inline-flex items-center px-1 py-0.2 rounded text-[7.5px] font-black bg-blue-600 text-white shrink-0">
                          SAYA
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                      {shortDesc}
                    </p>
                  </div>

                  {/* Kode Tugas */}
                  <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black shrink-0 ${badgeBg} shadow-2xs`}>
                    {shiftCode}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2.5 px-2 rounded border border-dashed border-slate-300 dark:border-slate-700 text-center text-[10px] text-slate-400 italic">
              Tidak ada petugas yang dinas di jam ini.
            </div>
          )}
        </div>

        {/* Footer Rapat & Ringkas */}
        <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 text-[8.5px] text-slate-500 dark:text-slate-400">
            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>Otomatis 2 jam</span>
          </div>

          <div className="flex items-center gap-1">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('dashboard');
                }}
                className="px-2 py-0.5 rounded text-[9.5px] font-semibold bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Dasbor
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundManager.playChime();
                onClose();
              }}
              className="px-2.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

