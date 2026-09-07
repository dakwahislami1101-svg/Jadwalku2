import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  Printer, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Building, 
  Utensils, 
  GraduationCap, 
  Moon, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUpDown,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MonthSchedule, Staff, ShiftCode } from '../types';
import { INDONESIAN_DAY_NAMES, INDONESIAN_MONTH_NAMES } from '../utils/scheduler';
import { soundManager } from '../utils/audio';

export type PosCategory = 'masjid' | 'kantin_smp' | 'kantin_sma' | 'mobile';

export interface PosStaffItem {
  id: string; // unique assignment id
  staffId: number;
  name: string;
  shiftCode: ShiftCode;
  customName?: string;
}

export interface AssignmentReminderViewProps {
  schedule: MonthSchedule;
  staffList: Staff[];
  selectedStaffId: number;
  activeDay: number;
  setActiveDay: (day: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

const POS_CONFIG: Record<PosCategory, {
  id: PosCategory;
  title: string;
  codeTag: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  lightBg: string;
  darkBg: string;
  borderColor: string;
  desc: string;
}> = {
  masjid: {
    id: 'masjid',
    title: 'Pos Masjid',
    codeTag: 'S4A',
    icon: Building,
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-600 text-white',
    lightBg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    darkBg: 'border-emerald-200 dark:border-emerald-800/60',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Pengawalan sholat, ibadah, & pembinaan asrama masjid'
  },
  kantin_smp: {
    id: 'kantin_smp',
    title: 'Pos Kantin SMP',
    codeTag: 'S3A',
    icon: Utensils,
    accentColor: 'blue',
    badgeBg: 'bg-blue-600 text-white',
    lightBg: 'bg-blue-50/70 dark:bg-blue-950/20',
    darkBg: 'border-blue-200 dark:border-blue-800/60',
    borderColor: 'border-blue-200 dark:border-blue-800',
    desc: 'Piket makan malam & ketertiban area kantin SMP'
  },
  kantin_sma: {
    id: 'kantin_sma',
    title: 'Pos Kantin SMA',
    codeTag: 'S3A',
    icon: GraduationCap,
    accentColor: 'amber',
    badgeBg: 'bg-amber-600 text-white',
    lightBg: 'bg-amber-50/70 dark:bg-amber-950/20',
    darkBg: 'border-amber-200 dark:border-amber-800/60',
    borderColor: 'border-amber-200 dark:border-amber-800',
    desc: 'Piket makan malam & pendampingan santri di SMA'
  },
  mobile: {
    id: 'mobile',
    title: 'Mobile (Jaga Malam)',
    codeTag: 'M1 ,M2',
    icon: Moon,
    accentColor: 'purple',
    badgeBg: 'bg-purple-600 text-white',
    lightBg: 'bg-purple-50/70 dark:bg-purple-950/20',
    darkBg: 'border-purple-200 dark:border-purple-800/60',
    borderColor: 'border-purple-200 dark:border-purple-800',
    desc: 'Patroli keliling, keamanan malam hari & persiapan subuh'
  }
};

export const AssignmentReminderView: React.FC<AssignmentReminderViewProps> = ({
  schedule,
  staffList,
  selectedStaffId,
  activeDay,
  setActiveDay,
  onNavigateToTab
}) => {
  // Day range validation
  const safeDay = Math.min(Math.max(1, activeDay), schedule.totalDays || 30);

  // Time and message options
  const [timeRange, setTimeRange] = useState<string>('15.00 s.d. 22.00');
  const [headerPrefix, setHeaderPrefix] = useState<string>(
    'izin share untuk pembagian pos shift sore dan m hari ini nggih'
  );
  const [footerNote, setFooterNote] = useState<string>('Mohon ditindaklanjuti');
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editing modal/state for adding staff manually or renaming
  const [showAddStaffModal, setShowAddStaffModal] = useState<PosCategory | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');

  // Storage key for custom assignments
  const storageKey = `wali_asuh_pos_v1_${schedule.year}_${schedule.month}_${safeDay}`;

  // Date calculation
  const dateObj = useMemo(() => {
    return new Date(schedule.year, schedule.month - 1, safeDay);
  }, [schedule.year, schedule.month, safeDay]);

  const dayName = INDONESIAN_DAY_NAMES[dateObj.getDay()];
  const monthName = (schedule.monthName || INDONESIAN_MONTH_NAMES[schedule.month - 1] || '').toLowerCase();
  const dayStr = String(safeDay).padStart(2, '0');
  const formattedDateTitle = `${dayName}, ${dayStr} ${schedule.monthName || INDONESIAN_MONTH_NAMES[schedule.month - 1]} ${schedule.year}`;

  // Helper to build initial automatic pos assignment from schedule
  const getAutoAssignments = useCallback((): Record<PosCategory, PosStaffItem[]> => {
    const dayShifts = schedule.days[safeDay] || {};
    const staffMap = new Map<number, Staff>(staffList.map((s) => [s.id, s]));

    const soreStaff: { staff: Staff; shift: ShiftCode }[] = [];
    const malamStaff: { staff: Staff; shift: ShiftCode }[] = [];

    for (const [sIdStr, rawShift] of Object.entries(dayShifts)) {
      const staffId = Number(sIdStr);
      const staff = staffMap.get(staffId);
      if (!staff) continue;

      const shift = rawShift as ShiftCode;
      if (['S', 'S2A', 'S3A', 'S4A'].includes(shift as string)) {
        soreStaff.push({ staff, shift });
      } else if (['M', 'M1', 'M2'].includes(shift as string)) {
        malamStaff.push({ staff, shift });
      }
    }

    const posRes: Record<PosCategory, PosStaffItem[]> = {
      masjid: [],
      kantin_smp: [],
      kantin_sma: [],
      mobile: []
    };

    // 1. Mobile (Malam): All M, M1, M2 staff
    malamStaff.forEach(({ staff, shift }, idx) => {
      posRes.mobile.push({
        id: `auto-m-${staff.id}-${idx}`,
        staffId: staff.id,
        name: staff.name,
        shiftCode: shift
      });
    });

    // 2. Sore staff:
    // S4A goes to masjid
    // S2A goes to kantin_smp
    // S3A split between kantin_smp and kantin_sma
    const unallocatedSore: { staff: Staff; shift: ShiftCode }[] = [];

    soreStaff.forEach((item) => {
      if (item.shift === 'S4A') {
        posRes.masjid.push({
          id: `auto-s4a-${item.staff.id}`,
          staffId: item.staff.id,
          name: item.staff.name,
          shiftCode: item.shift
        });
      } else if (item.shift === 'S2A') {
        posRes.kantin_smp.push({
          id: `auto-s2a-${item.staff.id}`,
          staffId: item.staff.id,
          name: item.staff.name,
          shiftCode: item.shift
        });
      } else {
        unallocatedSore.push(item);
      }
    });

    // Distribute remaining S3A or generic S
    unallocatedSore.forEach((item) => {
      const sName = (item.staff.name || '').toLowerCase();
      const jenjang = (item.staff.jenjang || '').toUpperCase();

      // If jenjang is SMP or name hints SMP
      if (jenjang === 'SMP' || sName.includes('hiras') || sName.includes('yusak')) {
        if (posRes.kantin_smp.length < 3) {
          posRes.kantin_smp.push({
            id: `auto-s3a-smp-${item.staff.id}`,
            staffId: item.staff.id,
            name: item.staff.name,
            shiftCode: item.shift
          });
          return;
        }
      }

      // If kantin_smp is still less than 2
      if (posRes.kantin_smp.length < 2) {
        posRes.kantin_smp.push({
          id: `auto-s3a-smp-${item.staff.id}`,
          staffId: item.staff.id,
          name: item.staff.name,
          shiftCode: item.shift
        });
      } else if (posRes.kantin_sma.length < 3) {
        posRes.kantin_sma.push({
          id: `auto-s3a-sma-${item.staff.id}`,
          staffId: item.staff.id,
          name: item.staff.name,
          shiftCode: item.shift
        });
      } else {
        // Additional sore goes to masjid or SMA
        posRes.masjid.push({
          id: `auto-s-masjid-${item.staff.id}`,
          staffId: item.staff.id,
          name: item.staff.name,
          shiftCode: item.shift
        });
      }
    });

    return posRes;
  }, [schedule.days, safeDay, staffList]);

  // Current pos assignments state (with localStorage caching)
  const [posData, setPosData] = useState<Record<PosCategory, PosStaffItem[]>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.masjid && parsed.kantin_smp) {
          return parsed;
        }
      }
    } catch {}
    return getAutoAssignments();
  });

  // Re-sync when safeDay or schedule changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.masjid && parsed.kantin_smp) {
          setPosData(parsed);
          return;
        }
      }
    } catch {}
    setPosData(getAutoAssignments());
  }, [storageKey, getAutoAssignments]);

  // Save changes to localStorage
  const updateAndPersistPosData = (newData: Record<PosCategory, PosStaffItem[]>) => {
    setPosData(newData);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    } catch (e) {
      console.warn('Failed to persist pos data:', e);
    }
  };

  // Move a staff member between Pos categories
  const handleMoveStaff = (itemId: string, fromPos: PosCategory, toPos: PosCategory) => {
    if (fromPos === toPos) return;

    const sourceList = [...posData[fromPos]];
    const itemIndex = sourceList.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;

    const [itemToMove] = sourceList.splice(itemIndex, 1);
    const targetList = [...posData[toPos], itemToMove];

    const updated = {
      ...posData,
      [fromPos]: sourceList,
      [toPos]: targetList
    };

    updateAndPersistPosData(updated);
    soundManager.playClick();
  };

  // Move staff up/down within a pos list
  const handleReorderStaff = (pos: PosCategory, index: number, direction: 'up' | 'down') => {
    const list = [...posData[pos]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    updateAndPersistPosData({
      ...posData,
      [pos]: list
    });
  };

  // Remove staff from pos
  const handleRemoveStaff = (pos: PosCategory, itemId: string) => {
    const list = posData[pos].filter((it) => it.id !== itemId);
    updateAndPersistPosData({
      ...posData,
      [pos]: list
    });
    soundManager.playClick();
  };

  // Add staff to pos
  const handleAddStaffToPos = (pos: PosCategory, staff: Staff) => {
    const dayShifts = schedule.days[safeDay] || {};
    const currentShift = dayShifts[staff.id] || (pos === 'mobile' ? 'M1' : pos === 'masjid' ? 'S4A' : 'S3A');

    const newItem: PosStaffItem = {
      id: `manual-${staff.id}-${Date.now()}`,
      staffId: staff.id,
      name: staff.name,
      shiftCode: currentShift as ShiftCode
    };

    updateAndPersistPosData({
      ...posData,
      [pos]: [...posData[pos], newItem]
    });

    setShowAddStaffModal(null);
    soundManager.playClick();
    showToast(`${staff.name} ditambahkan ke ${POS_CONFIG[pos].title}`);
  };

  // Inline rename / custom label handler
  const handleSaveRename = (pos: PosCategory, itemId: string) => {
    if (!editNameValue.trim()) {
      setEditingItemId(null);
      return;
    }

    const list = posData[pos].map((it) => {
      if (it.id === itemId) {
        return { ...it, customName: editNameValue.trim() };
      }
      return it;
    });

    updateAndPersistPosData({
      ...posData,
      [pos]: list
    });
    setEditingItemId(null);
  };

  // Reset to default schedule assignments
  const handleResetToAuto = () => {
    const auto = getAutoAssignments();
    updateAndPersistPosData(auto);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    soundManager.playChime();
    showToast('Pos penugasan dikembalikan ke penempatan otomatis jadwal.');
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Build the clean WhatsApp message string
  const generateWhatsAppMessage = useCallback((): string => {
    const lines: string[] = [];

    // Header Line
    lines.push(
      `${headerPrefix} tanggal ${dayStr} ${monthName} ${schedule.year} (${timeRange})`
    );
    lines.push('');

    // Pos Masjid (S4A)
    lines.push('pos masjid ( S4A) :');
    if (posData.masjid.length === 0) {
      lines.push('- Belum ada petugas');
    } else {
      posData.masjid.forEach((item, idx) => {
        const displayName = item.customName || item.name;
        lines.push(`${idx + 1}. ${displayName}`);
      });
    }

    // Pos Kantin SMP (S3A)
    lines.push('pos kantin smp ( S3A ):');
    if (posData.kantin_smp.length === 0) {
      lines.push('- Belum ada petugas');
    } else {
      posData.kantin_smp.forEach((item, idx) => {
        const displayName = item.customName || item.name;
        lines.push(`${idx + 1}. ${displayName}`);
      });
    }

    // Pos Kantin SMA (S3A)
    lines.push('pos kantin sma ( S3A) :');
    if (posData.kantin_sma.length === 0) {
      lines.push('- Belum ada petugas');
    } else {
      posData.kantin_sma.forEach((item, idx) => {
        const displayName = item.customName || item.name;
        lines.push(`${idx + 1}. ${displayName}`);
      });
    }

    // Mobile (Jaga Malam) (M1, M2)
    lines.push('mobile (jaga malam) ( M1 ,M2 )');
    if (posData.mobile.length === 0) {
      lines.push('- Belum ada petugas');
    } else {
      posData.mobile.forEach((item, idx) => {
        const displayName = item.customName || item.name;
        lines.push(`${idx + 1}. ${displayName}`);
      });
    }

    lines.push('');
    lines.push(footerNote);

    return lines.join('\n');
  }, [headerPrefix, dayStr, monthName, schedule.year, timeRange, posData, footerNote]);

  const waMessage = useMemo(() => generateWhatsAppMessage(), [generateWhatsAppMessage]);

  // Copy to clipboard
  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      soundManager.playBell();
      showToast('Teks penugasan berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed, fallback to textarea:', err);
      const textArea = document.createElement('textarea');
      textArea.value = waMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      showToast('Teks penugasan berhasil disalin!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Open direct WhatsApp web/app
  const handleShareToWhatsApp = () => {
    const encoded = encodeURIComponent(waMessage);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Stats calculation
  const totalMasjid = posData.masjid.length;
  const totalKantinSMP = posData.kantin_smp.length;
  const totalKantinSMA = posData.kantin_sma.length;
  const totalMobile = posData.mobile.length;
  const totalAssigned = totalMasjid + totalKantinSMP + totalKantinSMA + totalMobile;

  // Real today dates
  const realNow = new Date();
  const isSelectedDayRealToday =
    realNow.getDate() === safeDay &&
    realNow.getMonth() + 1 === schedule.month &&
    realNow.getFullYear() === schedule.year;

  return (
    <div className="space-y-3 pb-8 max-w-[1600px] mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 text-white rounded-xl p-3 sm:p-4 shadow-xs border border-emerald-600/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title and description */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner border border-white/20">
              <Send className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Pengingat Penugasan Shif Sore & Malam
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Format WhatsApp Otomatis
                </span>
                {isSelectedDayRealToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 animate-pulse">
                    ● HARI INI
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 leading-tight mt-0.5">
                Otomatis mengelompokkan petugas Pos Masjid (S4A), Kantin SMP (S3A), Kantin SMA (S3A), dan Mobile Jaga Malam (M1, M2).
              </p>
            </div>
          </div>

          {/* Date Selector & Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Day Switcher */}
            <div className="flex items-center bg-black/25 backdrop-blur-md rounded-lg p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveDay(Math.max(1, safeDay - 1))}
                disabled={safeDay <= 1}
                title="Hari Sebelumnya"
                className="p-1 rounded hover:bg-white/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2.5 py-0.5 text-center min-w-[150px] sm:min-w-[170px]">
                <div className="text-[10px] text-emerald-200 font-medium leading-none">
                  {dayName}
                </div>
                <div className="text-xs sm:text-sm font-black tracking-wide leading-tight mt-0.5">
                  {dayStr} {schedule.monthName} {schedule.year}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDay(Math.min(schedule.totalDays, safeDay + 1))}
                disabled={safeDay >= schedule.totalDays}
                title="Hari Berikutnya"
                className="p-1 rounded hover:bg-white/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Button: Hari Ini & Besok */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const todayNum = realNow.getDate();
                  if (todayNum >= 1 && todayNum <= schedule.totalDays) {
                    setActiveDay(todayNum);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  isSelectedDayRealToday
                    ? 'bg-amber-400 text-amber-950 shadow-inner'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => {
                  const tom = new Date(realNow.getTime() + 24 * 60 * 60 * 1000);
                  const tomDay = tom.getDate();
                  if (tomDay >= 1 && tomDay <= schedule.totalDays) {
                    setActiveDay(tomDay);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all shadow-2xs cursor-pointer"
              >
                Besok (H-1)
              </button>
            </div>

            {/* Direct WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs active:scale-95 cursor-pointer ml-auto sm:ml-0"
              title="Buka WhatsApp & Kirim Teks Penugasan"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              <span>Bagikan ke WA</span>
              <ExternalLink className="w-3 h-3 text-white/80" />
            </button>
          </div>
        </div>

        {/* 4 Summary Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-white/15 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-emerald-100 font-medium">Pos Masjid (S4A)</span>
            <span className="font-extrabold text-sm">{totalMasjid} <span className="text-[10px] font-normal text-emerald-200">orang</span></span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-emerald-100 font-medium">Kantin SMP (S3A)</span>
            <span className="font-extrabold text-sm">{totalKantinSMP} <span className="text-[10px] font-normal text-emerald-200">orang</span></span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-emerald-100 font-medium">Kantin SMA (S3A)</span>
            <span className="font-extrabold text-sm">{totalKantinSMA} <span className="text-[10px] font-normal text-emerald-200">orang</span></span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-[10px] text-purple-200 font-medium">Mobile (Jaga Malam)</span>
            <span className="font-extrabold text-sm text-purple-100">{totalMobile} <span className="text-[10px] font-normal text-purple-200">orang</span></span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white/15 backdrop-blur-xs rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-white/20">
            <span className="text-[10px] text-amber-200 font-bold">Total Bertugas</span>
            <span className="font-black text-sm text-amber-300">{totalAssigned} <span className="text-[10px] font-normal text-white">staf</span></span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column: The 4 Pos Cards (col-span-7) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Daftar Pos & Penempatan Petugas
              </h3>
            </div>

            <button
              type="button"
              onClick={handleResetToAuto}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md transition-colors cursor-pointer"
              title="Kembalikan susunan petugas ke jadwal acuan otomatis"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset Standar Jadwal</span>
            </button>
          </div>

          {/* Pos Cards Loop */}
          {(Object.keys(POS_CONFIG) as PosCategory[]).map((posKey) => {
            const conf = POS_CONFIG[posKey];
            const items = posData[posKey];
            const Icon = conf.icon;

            return (
              <div
                key={posKey}
                className={`rounded-xl border bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all ${conf.borderColor}`}
              >
                {/* Pos Card Header */}
                <div className={`px-3 py-2 border-b flex items-center justify-between ${conf.lightBg} ${conf.borderColor}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${conf.badgeBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {conf.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900 leading-none">
                          {conf.codeTag}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                        {conf.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
                      {items.length} Petugas
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowAddStaffModal(posKey)}
                      title={`Tambah Petugas ke ${conf.title}`}
                      className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Staff List Inside Pos */}
                <div className="p-2 sm:p-2.5">
                  {items.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-950/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                      Belum ada petugas di pos ini. Klik <span className="font-semibold text-emerald-600">+ Tambah</span> atau pindahkan staf dari pos lain.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {items.map((item, idx) => {
                        const isEditingThis = editingItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-50/80 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs transition-colors"
                          >
                            {/* Left: Number & Name */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>

                              {isEditingThis ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <input
                                    type="text"
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    placeholder="Ubah nama tampilan..."
                                    className="px-2 py-0.5 text-xs rounded border border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none w-full max-w-[200px]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(posKey, item.id);
                                      if (e.key === 'Escape') setEditingItemId(null);
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRename(posKey, item.id)}
                                    className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 cursor-pointer"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    className="px-1.5 py-0.5 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {item.customName || item.name}
                                  </span>
                                  {item.customName && (
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium shrink-0">
                                      (kustom)
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                    {item.shiftCode}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right Actions: Reorder, Move to other Pos, Edit Name, Delete */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Quick Move To Pos Dropdown */}
                              <select
                                aria-label="Pindahkan Pos Tugas"
                                value={posKey}
                                onChange={(e) => handleMoveStaff(item.id, posKey, e.target.value as PosCategory)}
                                className="text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer hover:border-emerald-500"
                                title="Pindahkan ke pos lain"
                              >
                                <option value="masjid">🕌 Pos Masjid</option>
                                <option value="kantin_smp">🏫 Kantin SMP</option>
                                <option value="kantin_sma">🎓 Kantin SMA</option>
                                <option value="mobile">🌙 Jaga Malam</option>
                              </select>

                              {/* Reorder Up/Down */}
                              <div className="flex items-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => handleReorderStaff(posKey, idx, 'up')}
                                  disabled={idx === 0}
                                  title="Geser Naik"
                                  className="px-1 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReorderStaff(posKey, idx, 'down')}
                                  disabled={idx === items.length - 1}
                                  title="Geser Turun"
                                  className="px-1 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                                >
                                  ▼
                                </button>
                              </div>

                              {/* Edit Custom Name Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditNameValue(item.customName || item.name);
                                }}
                                title="Edit format nama yang dibagikan"
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              {/* Remove from Pos Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveStaff(posKey, item.id)}
                                title="Hapus dari pos ini"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: WhatsApp Live Preview & Quick Actions (col-span-5) */}
        <div className="lg:col-span-5 space-y-3 sticky top-16">
          {/* WhatsApp Preview Card */}
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/70 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* WA Card Header */}
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold leading-tight">
                    Pratinjau Pesan WhatsApp
                  </h4>
                  <p className="text-[10px] text-emerald-100 leading-none">
                    Format rapi sesuai standar dinas grup WA
                  </p>
                </div>
              </div>

              {/* Copy quick indicator */}
              {copied && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-bold animate-in fade-in">
                  <Check className="w-3 h-3 text-emerald-600" /> Tersalin!
                </span>
              )}
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="p-3 bg-[#e5ddd5]/40 dark:bg-slate-950/60">
              <div className="bg-[#dcf8c6] dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 shadow-2xs font-mono text-[11px] sm:text-xs text-slate-800 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed select-all">
                {waMessage}
              </div>
            </div>

            {/* Action Buttons Under Preview */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Salin Teks Button */}
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>Berhasil Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      <span>Salin Format WA</span>
                    </>
                  )}
                </button>

                {/* Buka WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs bg-[#25D366] hover:bg-[#20bd5a] text-white active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>Kirim ke WA</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Total: {totalAssigned} Petugas</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer font-medium"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Tugas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Template & Options Accordion */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kustomisasi Format & Waktu Tugas</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Rentang Jam Dinas:
                </label>
                <input
                  type="text"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  placeholder="15.00 s.d. 22.00"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Kalimat Pembuka (Header):
                </label>
                <input
                  type="text"
                  value={headerPrefix}
                  onChange={(e) => setHeaderPrefix(e.target.value)}
                  placeholder="izin share untuk pembagian pos shift sore dan m hari ini nggih"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                  Kalimat Penutup (Footer):
                </label>
                <input
                  type="text"
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  placeholder="Mohon ditindaklanjuti"
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange('15.00 s.d. 22.00');
                    setHeaderPrefix('izin share untuk pembagian pos shift sore dan m hari ini nggih');
                    setFooterNote('Mohon ditindaklanjuti');
                    showToast('Template kalimat dikembalikan ke awal.');
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
                >
                  Reset Template Teks
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Petugas Manual ke Pos Tertentu */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${POS_CONFIG[showAddStaffModal].badgeBg}`}>
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tambah Petugas ke {POS_CONFIG[showAddStaffModal].title}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Pilih nama wali asuh untuk ditempatkan pada pos ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Staff Selector List */}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {staffList.map((st) => {
                const dayShifts = schedule.days[safeDay] || {};
                const currentShift = dayShifts[st.id] || '-';
                const isAlreadyInPos = posData[showAddStaffModal].some((p) => p.staffId === st.id);

                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isAlreadyInPos}
                    onClick={() => handleAddStaffToPos(showAddStaffModal, st)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      isAlreadyInPos
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                        : 'hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-6">
                        {st.code || `#${st.id}`}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {st.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Shif: {currentShift}
                      </span>
                      {isAlreadyInPos && (
                        <span className="text-[9px] text-emerald-600 font-bold">
                          ✓ Sudah ada
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
