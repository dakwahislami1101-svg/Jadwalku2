import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Sun, 
  Sunset, 
  Moon, 
  Coffee, 
  Bell, 
  BellRing, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Save, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  ArrowRight,
  ListTodo,
  FileDown,
  Download,
  Share2,
  Edit3,
  Megaphone,
  X,
  Radio,
  Send
} from 'lucide-react';
import { MonthSchedule, Staff, ShiftCode, DailyTask, AnnouncementData, StudentMedicalPlan } from '../types';
import { SHIFT_DEFINITIONS, SHIFT_TASKS_TEMPLATE } from '../data/initialSchedule';
import { calculateDailyStats, INDONESIAN_MONTH_NAMES, INDONESIAN_DAY_NAMES, validateShiftAssignment } from '../utils/scheduler';
import { generateDailySchedulePDF } from '../utils/pdfExport';
import { soundManager } from '../utils/audio';
import { notificationService } from '../utils/notification';
import { 
  subscribeToAnnouncement, 
  saveAnnouncementToFirestore, 
  getLocalAnnouncement, 
  DEFAULT_ANNOUNCEMENT 
} from '../utils/firebaseService';
import { AnnouncementPopup } from './AnnouncementPopup';
import { IcsExportModal } from './IcsExportModal';
import { getCurrentTwoHourTheme, TwoHourTheme } from '../utils/themeTwoHour';

interface TodayDashboardProps {
  schedule: MonthSchedule;
  staffList: Staff[];
  selectedStaffId: number;
  activeDay: number;
  setActiveDay: (day: number) => void;
  onNavigateToTab: (tab: 'matrix' | 'personal' | 'admin' | 'auto' | 'notifications' | 'print' | 'handover' | 'sop' | 'medical' | 'assignment') => void;
  sopTasks?: DailyTask[];
  userRole?: 'admin' | 'staff';
  medicalPlans?: StudentMedicalPlan[];
  onOpenMedicalModal?: () => void;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  schedule,
  staffList,
  selectedStaffId,
  activeDay,
  setActiveDay,
  onNavigateToTab,
  sopTasks,
  userRole = 'staff',
  medicalPlans = [],
  onOpenMedicalModal,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`tasks_${schedule.year}_${schedule.month}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [logBookText, setLogBookText] = useState<string>(() => {
    try {
      return localStorage.getItem(`logbook_${schedule.year}_${schedule.month}_${activeDay}`) || '';
    } catch {
      return '';
    }
  });

  const [logSavedToast, setLogSavedToast] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState('');
  const [twoHourTheme, setTwoHourTheme] = useState<TwoHourTheme>(() => getCurrentTwoHourTheme());

  // Running text announcement state
  const [announcement, setAnnouncement] = useState<AnnouncementData>(() => getLocalAnnouncement());
  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(false);
  const [showPopupForce, setShowPopupForce] = useState<boolean>(false);
  const [tempAnnouncementText, setTempAnnouncementText] = useState<string>('');
  const [tempAnnouncementEnabled, setTempAnnouncementEnabled] = useState<boolean>(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState<boolean>(false);
  const [announcementToast, setAnnouncementToast] = useState<string | null>(null);
  const [isIcsModalOpen, setIsIcsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToAnnouncement((data) => {
      setAnnouncement(data);
    });
    return () => unsub();
  }, []);

  const handleOpenAnnouncementModal = () => {
    setTempAnnouncementText(announcement.text);
    setTempAnnouncementEnabled(announcement.enabled);
    setShowAnnouncementModal(true);
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    const newText = tempAnnouncementText.trim() || DEFAULT_ANNOUNCEMENT.text;
    await saveAnnouncementToFirestore(
      {
        text: newText,
        enabled: tempAnnouncementEnabled,
      },
      userRole === 'admin' ? 'Administrator SRT 1' : 'Admin'
    );
    setIsSavingAnnouncement(false);
    setShowAnnouncementModal(false);
    setAnnouncementToast('Pengumuman berjalan berhasil diperbarui dan tersinkronisasi!');
    setTimeout(() => setAnnouncementToast(null), 3500);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
      setCurrentTimeFormatted(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setTwoHourTheme(getCurrentTwoHourTheme(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update log text when activeDay changes
  useEffect(() => {
    try {
      const text = localStorage.getItem(`logbook_${schedule.year}_${schedule.month}_${activeDay}`) || '';
      setLogBookText(text);
    } catch {
      setLogBookText('');
    }
  }, [activeDay, schedule.year, schedule.month]);

  const showToast = (msg: string) => {
    setDownloadToast(msg);
    soundManager.playChime();
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleDownloadTodayPDF = () => {
    try {
      const filename = generateDailySchedulePDF(schedule, activeDay, staffList, logBookText);
      showToast(`Jadwal tanggal ${activeDay} berhasil diunduh sebagai PDF: ${filename}`);
    } catch (e) {
      console.error(e);
      showToast('Gagal membuat PDF, mengalihkan ke mode cetak...');
      onNavigateToTab('print');
    }
  };

  const handleDownloadTodayCSV = () => {
    let csv = `JADWAL PENUGASAN DINAS HARIAN WALI ASUH SRT 1 KAB KEDIRI\n`;
    csv += `Tanggal,${activeDay} ${schedule.monthName} ${schedule.year}\n\n`;
    csv += `No,Nama Petugas,Posisi,Kode Shif,Nama Shif,Jam Dinas,Pos Penugasan\n`;

    staffList.forEach((staff) => {
      const shift = schedule.days[activeDay]?.[staff.id] || 'O';
      const sInfo = SHIFT_DEFINITIONS[shift] || SHIFT_DEFINITIONS['O'];
      let pos = sInfo.description;
      if (shift === 'S2A') pos = 'Kantin SMP (2 Petugas)';
      if (shift === 'S3A') pos = 'Kantin SMA (2 Petugas)';
      if (shift === 'S4A') pos = 'Jaga Masjid & Lingkungan';
      if (shift === 'M1') pos = 'Piket Malam - Sesi 1 (15:00 - 00:00)';
      if (shift === 'M2') pos = 'Piket Malam - Sesi 2 (Subuh - 07:00)';
      if (shift === 'M3') pos = 'Piket Malam Pendamping (23:00 - 07:00)';

      csv += `${staff.id},"${staff.name}","${staff.role}",${shift},"${sInfo.name}","${sInfo.startTime} - ${sInfo.endTime}","${pos}"\n`;
    });

    if (logBookText) {
      csv += `\nCatatan Buku Jaga & Mutasi:,"${logBookText.replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Jadwal_Dinas_Harian_Tgl_${activeDay}_${schedule.monthName}_${schedule.year}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Jadwal tanggal ${activeDay} berhasil diekspor ke CSV!`);
  };

  const handleShareWhatsApp = () => {
    const dateStr = `${dayName}, ${activeDay} ${schedule.monthName} ${schedule.year}`;
    let text = `*LEMBAR PENUGASAN DINAS WALI ASUH SRT 1 KAB KEDIRI*\n📅 *${dateStr}*\n\n`;

    text += `*DAFTAR PETUGAS JAGA HARI INI:*\n`;
    staffList.forEach((staff) => {
      const shift = schedule.days[activeDay]?.[staff.id] || 'O';
      const sInfo = SHIFT_DEFINITIONS[shift];
      if (shift !== 'O' && shift !== 'LP') {
        text += `• ${staff.name}: *[${shift}]* ${sInfo.name} (${sInfo.startTime} - ${sInfo.endTime})\n`;
      }
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveLogBook = () => {
    try {
      localStorage.setItem(`logbook_${schedule.year}_${schedule.month}_${activeDay}`, logBookText);
      setLogSavedToast(true);
      soundManager.playChime();
      setTimeout(() => setLogSavedToast(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = (taskId: string) => {
    const key = `${activeDay}_${taskId}`;
    const nextState = !completedTasks[key];
    const updated = { ...completedTasks, [key]: nextState };
    setCompletedTasks(updated);
    try {
      localStorage.setItem(`tasks_${schedule.year}_${schedule.month}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (nextState) {
      soundManager.playBell();
    }
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || staffList[0] || {
    id: 0,
    name: 'Belum Ada Petugas',
    role: 'Wali Asuh',
    group: 'Umum',
    initials: '-',
    gender: 'L' as const,
  };
  const userTodayShift: ShiftCode = selectedStaff.id ? (schedule.days[activeDay]?.[selectedStaff.id] || 'O') : 'O';
  const shiftMeta = SHIFT_DEFINITIONS[userTodayShift] || SHIFT_DEFINITIONS['O'];

  // Daily statistics for active day
  const dailyStats = calculateDailyStats(activeDay, schedule.days, staffList);

  // Relevant tasks for the user's shift today (derived from customizable SOP tasks or default template)
  const taskSource = sopTasks && sopTasks.length > 0 ? sopTasks : SHIFT_TASKS_TEMPLATE;
  const hasSpecificTasks = taskSource.some((t) => t.shiftCode === userTodayShift);
  const relevantTasks = taskSource.filter((t) => {
    if (hasSpecificTasks) {
      return t.shiftCode === userTodayShift;
    }
    if (userTodayShift === 'P1' || userTodayShift === 'P2' || userTodayShift === 'P3') {
      return t.shiftCode === userTodayShift || t.shiftCode === 'P';
    }
    if (['S2A', 'S3A', 'S4A'].includes(userTodayShift)) {
      return t.shiftCode === userTodayShift || t.shiftCode === 'S';
    }
    if (userTodayShift === 'M1' || userTodayShift === 'M2' || userTodayShift === 'M3') {
      return t.shiftCode === userTodayShift || t.shiftCode === 'M';
    }
    if (userTodayShift === 'P') return t.shiftCode === 'P' || t.shiftCode === 'P1';
    if (userTodayShift === 'S') return t.shiftCode === 'S';
    if (userTodayShift === 'M') return t.shiftCode === 'M';
    return false;
  });

  // Calculate day date
  const dayDate = new Date(schedule.year, schedule.month - 1, activeDay);
  const dayName = INDONESIAN_DAY_NAMES[dayDate.getDay()];
  const dateFormatted = `${dayName}, ${activeDay} ${schedule.monthName} ${schedule.year}`;

  // Otomatis memicu pengingat khusus saat staf ditugaskan pada kode M3
  useEffect(() => {
    if (userTodayShift === 'M3') {
      const reminderKey = `m3_auto_notified_${schedule.year}_${schedule.month}_${activeDay}_${selectedStaff.id}`;
      if (!sessionStorage.getItem(reminderKey)) {
        sessionStorage.setItem(reminderKey, 'true');
        const val = validateShiftAssignment(selectedStaff, 'M3', activeDay, schedule.days);
        if (val.hasSpecialReminder && val.specialReminder) {
          notificationService.triggerNotification(val.specialReminder.title, {
            body: val.specialReminder.message,
            sound: 'bell',
          });
        }
      }
    }
  }, [userTodayShift, selectedStaff.id, selectedStaff.name, activeDay, schedule.year, schedule.month, schedule.days, selectedStaff]);

  const triggerTestAlarm = () => {
    notificationService.triggerNotification(
      `Pengingat Shif: ${selectedStaff.name}`,
      {
        body: `Hari ini Anda bertugas pada ${shiftMeta.name} (${shiftMeta.startTime} - ${shiftMeta.endTime}). Siapkan kelengkapan tugas!`,
        sound: 'chime',
      }
    );
  };

  // Next day shift preview
  const nextDay = activeDay < schedule.totalDays ? activeDay + 1 : 1;
  const nextDayShift: ShiftCode = selectedStaff.id ? (schedule.days[nextDay]?.[selectedStaff.id] || 'O') : 'O';
  const nextShiftMeta = SHIFT_DEFINITIONS[nextDayShift] || SHIFT_DEFINITIONS['O'];

  return (
    <div className="space-y-2.5">
      {/* Animated Interactive Announcement Pop-up on initial device load */}
      <AnnouncementPopup
        announcement={announcement}
        onOpenManagement={handleOpenAnnouncementModal}
        userRole={userRole}
        forceOpen={showPopupForce}
        onCloseForceOpen={() => setShowPopupForce(false)}
      />

      {/* Toast Notification for Download / Action */}
      {downloadToast && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs">{downloadToast}</span>
          </div>
        </div>
      )}

      {/* Date Switcher & Live Status Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 sm:p-3 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600 shadow-2xs">
            <button
              onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
              disabled={activeDay === 1}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <select
              id="jump-day-select"
              aria-label="Pilih Hari"
              value={activeDay}
              onChange={(e) => setActiveDay(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 font-bold text-xs text-slate-900 dark:text-white px-1.5 py-0.5 rounded border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {Array.from({ length: schedule.totalDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Tgl {d}
                </option>
              ))}
            </select>
            <button
              onClick={() => setActiveDay(Math.min(schedule.totalDays, activeDay + 1))}
              disabled={activeDay === schedule.totalDays}
              className="p-1 rounded hover:bg-white dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {dateFormatted}
              </h2>
              {activeDay === 22 && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Hari Ini
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Monitoring {staffList.length} Wali Asuh • {schedule.monthName} {schedule.year}
            </p>
          </div>
        </div>

        {/* Action Buttons (1 Baris Rapi, Dapat Digeser ke Kiri & Kanan) */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar scroll-smooth -mx-1 px-1 py-0.5">
          <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
            {/* Tombol Pengingat Penugasan (Share WA) */}
            <button
              onClick={() => onNavigateToTab('assignment')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Buka Pengingat Penugasan Pos Sore & Malam (Siap Kirim WhatsApp)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Pengingat Penugasan</span>
            </button>

            {/* Tombol Laporan Serah Terima Shift */}
            <button
              onClick={() => onNavigateToTab('handover')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Buat Laporan Serah Terima Pergantian Shift & Kirim ke WhatsApp"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Laporan Serah Terima</span>
            </button>

            {/* Tombol Unduh PDF Hari Ini */}
            <button
              onClick={handleDownloadTodayPDF}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Unduh jadwal penugasan hari ini langsung ke file PDF resmi"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {/* Tombol Ekspor CSV */}
            <button
              onClick={handleDownloadTodayCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title="Ekspor daftar petugas hari ini ke Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Running Text Announcement / Ticker Berjalan Pengumuman */}
        {announcement.enabled && announcement.text ? (
          <div className="w-full mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 rounded-lg px-2.5 py-1.5 shadow-2xs overflow-hidden">
              <div className="flex items-center gap-1 shrink-0 text-amber-800 dark:text-amber-300 font-bold text-[11px] select-none">
                <span className="p-1 rounded bg-amber-200/90 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 shadow-2xs">
                  <Megaphone className="w-3 h-3 animate-pulse" />
                </span>
                <span className="hidden sm:inline font-black uppercase text-[10px] tracking-wider text-amber-900 dark:text-amber-200">
                  INFO PENGUMUMAN:
                </span>
              </div>

              {/* Running Marquee Text Area - Continuous Endless Loop */}
              <div className="relative flex-1 overflow-hidden h-5 flex items-center">
                <div 
                  className="animate-continuous-marquee text-xs font-semibold text-amber-950 dark:text-amber-100 cursor-pointer select-none whitespace-nowrap"
                  title="Klik untuk membuka pop-up pengumuman resmi"
                  onClick={() => {
                    setShowPopupForce(true);
                  }}
                >
                  <span className="inline-flex items-center gap-5 pr-8">
                    <span>{announcement.text}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0"></span>
                    <span>{announcement.text}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0"></span>
                  </span>
                  <span className="inline-flex items-center gap-5 pr-8" aria-hidden="true">
                    <span>{announcement.text}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0"></span>
                    <span>{announcement.text}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 shrink-0"></span>
                  </span>
                </div>
              </div>

              {/* Action Button: Edit for Admin / Detail for Staff */}
              {userRole === 'admin' ? (
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => setShowPopupForce(true)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                    title="Buka tampilan pop-up pengumuman"
                  >
                    <span>Pratinjau</span>
                  </button>
                  <button
                    onClick={handleOpenAnnouncementModal}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-2xs transition-colors cursor-pointer"
                    title="Atur teks pengumuman berjalan ini (Khusus Admin)"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Atur</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowPopupForce(true)}
                  className="shrink-0 text-[10.5px] font-bold text-amber-700 dark:text-amber-400 hover:underline px-1 py-0.5 cursor-pointer"
                  title="Buka pop-up pengumuman"
                >
                  Detail
                </button>
              )}
            </div>
          </div>
        ) : userRole === 'admin' ? (
          <div className="w-full mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="italic text-[10.5px]">Pengumuman berjalan saat ini dinonaktifkan.</span>
            <button
              onClick={handleOpenAnnouncementModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold text-[10px] hover:bg-amber-200 transition-colors cursor-pointer"
            >
              <Megaphone className="w-2.5 h-2.5" />
              <span>+ Pasang Pengumuman (Admin)</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* User's Assigned Shift Banner - Dynamic 2-Hour Theme Block */}
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${twoHourTheme.gradientClass} border ${twoHourTheme.borderClass} text-white p-3 sm:p-4 shadow-sm transition-all duration-1000`}>
        {/* Ambient glow accent */}
        <div className={`absolute inset-0 bg-gradient-to-r ${twoHourTheme.accentGlow} pointer-events-none transition-all duration-1000`} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 backdrop-blur text-[11px] font-medium text-white border border-white/20">
                <Sparkles className={`w-3 h-3 ${twoHourTheme.iconColor} animate-pulse`} />
                <span>Penugasan Wali Asuh: <strong>{selectedStaff.name}</strong></span>
              </div>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-xs">
                <Clock className="w-2.5 h-2.5 text-white/80" />
                <span>Tema: {twoHourTheme.name} ({twoHourTheme.timeSlot})</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight drop-shadow-xs">
                {shiftMeta.name}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold shadow-xs ${shiftMeta.badgeClass}`}>
                Kode: {shiftMeta.code}
              </span>
            </div>
            <p className="text-xs text-white/90 max-w-3xl leading-relaxed">
              {shiftMeta.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-white/80 pt-0.5">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Jam: <strong>{shiftMeta.startTime} - {shiftMeta.endTime}</strong> ({shiftMeta.hours} Jam)</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                <span>Besok (Tgl {nextDay}): <strong>{nextShiftMeta.name} ({nextShiftMeta.code})</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col gap-1.5 shrink-0">
            <button
              onClick={triggerTestAlarm}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-transform active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-slate-950" />
              <span>Alarm Tugas</span>
            </button>
            <button
              onClick={() => onNavigateToTab('personal')}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/25 transition-colors"
            >
              <span>Jadwal Personal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Khusus Validasi & Pengingat Shif M3 (23:00 WIB) */}
      {userTodayShift === 'M3' && (
        <div className="rounded-xl bg-gradient-to-r from-fuchsia-950/90 via-purple-900/90 to-slate-900 text-white p-3 sm:p-4 border-2 border-fuchsia-500 shadow-md animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40 text-[10.5px] font-bold">
                <Moon className="w-3.5 h-3.5 text-fuchsia-300" />
                <span>PENGINGAT KHUSUS PENUGASAN SHIF M3 (23:00 WIB)</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-fuchsia-100 flex flex-wrap items-center gap-2">
                <span>Tugas Wajib Keliling Asrama & Kirim Foto ke Grup Dinas</span>
                <span className="px-2 py-0.5 rounded bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  Jam 23:00 WIB
                </span>
              </h4>
              <p className="text-xs text-fuchsia-100/90 leading-relaxed max-w-3xl">
                Petugas <strong>{selectedStaff.name}</strong> ditugaskan pada kode <strong>M3 (Jaga Malam Pendamping)</strong>.
                Saat datang tepat pukul <strong>23:00 WIB</strong>, wajib melakukan kontrol keliling asrama santri dan lingkungan sekitar,
                serta <strong>mengirimkan foto dokumentasi ke grup dinas</strong>. Mendampingi full shif malam s.d 07:00 WIB (pukul 03:00 WIB dan seterusnya menjalankan SOP tugas M2).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundManager.playBell();
                  notificationService.triggerNotification(`🚨 Pengingat Shif M3: Tugas Keliling Asrama 23:00 WIB`, {
                    body: `${selectedStaff.name} wajib keliling asrama & lingkungan sekitar pukul 23:00 WIB serta kirim foto ke grup dinas!`,
                    sound: 'bell',
                  });
                  showToast('Alarm pengingat tugas patroli keliling 23:00 WIB dibunyikan!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Bunyikan Pengingat 23:00</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Shift Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Shif Pagi */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-sky-200 dark:border-sky-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-sky-100 dark:border-sky-900/40">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Jaga Pagi (P1/P2)</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">07:00 - 16:00</p>
              </div>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10.5px] font-bold">
              {dailyStats.pagiFull} Org
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {dailyStats.pagiWali.length > 0 ? (
              dailyStats.pagiWali.map((st) => {
                const shiftCode = schedule.days[activeDay]?.[st.id];
                const isP1 = shiftCode === 'P1' || shiftCode === 'P';
                const badgeClass = isP1
                  ? 'bg-sky-600 text-white'
                  : shiftCode === 'P2'
                  ? 'bg-teal-600 text-white'
                  : 'bg-yellow-500 text-slate-900';
                return (
                  <div
                    key={st.id}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-sky-50/70 dark:bg-sky-950/40 text-slate-800 dark:text-slate-200"
                  >
                    <span className="font-medium truncate">{st.name}</span>
                    <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded shrink-0 ${badgeClass}`}>
                      {shiftCode}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-400 italic">Tidak ada petugas pagi</p>
            )}
          </div>
        </div>

        {/* Shif Sore */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-orange-200 dark:border-orange-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-orange-100 dark:border-orange-900/40">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                <Sunset className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Jaga Sore (S)</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">15:00 - 23:00</p>
              </div>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[10.5px] font-bold">
              {dailyStats.s} Org
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {dailyStats.soreWali.length > 0 ? (
              dailyStats.soreWali.map((st) => {
                const shiftCode = schedule.days[activeDay]?.[st.id] || 'S';
                let badgeBg = 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100';
                let postLabel = '';
                if (shiftCode === 'S2A') {
                  badgeBg = 'bg-purple-600 text-white';
                  postLabel = 'Kantin SMP';
                } else if (shiftCode === 'S3A') {
                  badgeBg = 'bg-orange-500 text-white';
                  postLabel = 'Kantin SMA';
                } else if (shiftCode === 'S4A') {
                  badgeBg = 'bg-emerald-600 text-white';
                  postLabel = 'Jaga Masjid';
                }

                return (
                  <div
                    key={st.id}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-orange-50/70 dark:bg-orange-950/40 text-slate-800 dark:text-slate-200 gap-1"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-medium truncate">{st.name}</span>
                      {postLabel && (
                        <span className="text-[8.5px] text-slate-500 dark:text-slate-400 shrink-0">({postLabel})</span>
                      )}
                    </div>
                    <span className={`text-[9.5px] font-bold px-1 py-0.2 rounded shrink-0 ${badgeBg}`}>
                      {shiftCode}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-400 italic">Tidak ada petugas sore</p>
            )}
          </div>
        </div>

        {/* Shif Malam */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-blue-200 dark:border-blue-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Jaga Malam (M)</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">15:00 - 07:00 (Pagi)</p>
              </div>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10.5px] font-bold">
              {dailyStats.m} Org
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {dailyStats.malamWali.length > 0 ? (
              dailyStats.malamWali.map((st) => {
                const shiftCode = schedule.days[activeDay]?.[st.id] || 'M';
                let badgeBg = 'bg-blue-600 text-white';
                let postLabel = '';
                if (shiftCode === 'M1') {
                  badgeBg = 'bg-indigo-600 text-white';
                  postLabel = 'Sesi 1 (s.d 00:00)';
                } else if (shiftCode === 'M2') {
                  badgeBg = 'bg-blue-600 text-white';
                  postLabel = 'Sesi 2 (Subuh-07:00)';
                } else if (shiftCode === 'M3') {
                  badgeBg = 'bg-fuchsia-600 text-white';
                  postLabel = 'Pendamping (23:00-07:00)';
                }

                return (
                  <div
                    key={st.id}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-blue-50/70 dark:bg-blue-950/40 text-slate-800 dark:text-slate-200 gap-1"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-medium truncate">{st.name}</span>
                      {postLabel && (
                        <span className="text-[8.5px] text-slate-500 dark:text-slate-400 shrink-0">({postLabel})</span>
                      )}
                    </div>
                    <span className={`text-[9.5px] font-bold px-1 py-0.2 rounded shrink-0 ${badgeBg}`}>
                      {shiftCode}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-400 italic">Tidak ada petugas malam</p>
            )}
          </div>
        </div>

        {/* Lepas Piket & Libur */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-750">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                <Coffee className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">Lepas & Libur</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Istirahat / Off</p>
              </div>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold">
              {dailyStats.offDanLepas + dailyStats.cuti} Org
            </span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {dailyStats.lepasWali.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-sky-50 dark:bg-sky-950/40 text-slate-700 dark:text-slate-300">
                <span className="font-medium truncate">{st.name}</span>
                <span className="text-[9.5px] font-bold px-1 py-0.2 rounded bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 shrink-0">LP</span>
              </div>
            ))}
            {dailyStats.offWali.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-red-50 dark:bg-red-950/40 text-slate-700 dark:text-slate-300">
                <span className="font-medium truncate">{st.name}</span>
                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white shrink-0">L / OFF</span>
              </div>
            ))}
            {dailyStats.cutiWali.map((st) => (
              <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-teal-50 dark:bg-teal-950/40 text-slate-700 dark:text-slate-300">
                <span className="font-medium truncate">{st.name}</span>
                <span className="text-[9.5px] font-bold px-1 py-0.2 rounded bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200 shrink-0">CUTI</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Checklist Tugas Harian & Buku Laporan Jaga */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        {/* Checklist Tugas Harian Wali Asuh (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <ListTodo className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  Checklist & Pengingat Tugas Shif ({shiftMeta.name})
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  Agenda SOP wali asuh dengan notifikasi waktu
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setIsIcsModalOpen(true)}
                className="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Unduh pengingat tugas harian ke format .ICS untuk disinkronkan ke kalender pribadi Google Calendar / Outlook"
              >
                <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Sinkron Kalender (.ICS)</span>
                <span className="sm:hidden">Kalender .ICS</span>
              </button>

              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('sop')}
                  className="px-2 py-0.5 rounded-lg text-[10.5px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Buka Pengaturan SOP untuk mengubah kata-kata dan jam checklist"
                >
                  <Edit3 className="w-3 h-3 text-indigo-500" />
                  <span className="hidden sm:inline">Ubah Kata & Jam</span>
                  <span className="sm:hidden">Edit SOP</span>
                </button>
              )}
              <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {relevantTasks.filter((t) => completedTasks[`${activeDay}_${t.id}`]).length} / {relevantTasks.length} Selesai
              </div>
            </div>
          </div>

          {relevantTasks.length > 0 ? (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {relevantTasks.map((task) => {
                const isDone = Boolean(completedTasks[`${activeDay}_${task.id}`]);
                const isM3Patrol = task.time === '23:00' && (userTodayShift === 'M3' || task.shiftCode === 'M3');
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer rounded-lg p-2 border transition-all flex items-start gap-2 ${
                      isDone
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                        : isM3Patrol
                        ? 'bg-fuchsia-50/70 dark:bg-fuchsia-950/30 border-fuchsia-400 dark:border-fuchsia-700 shadow-2xs hover:border-fuchsia-500'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0"
                      title={isDone ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 hover:text-blue-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className={`font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded border ${
                          isM3Patrol
                            ? 'bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-800'
                            : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {task.time} WIB
                        </span>
                        <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {task.title}
                        </h4>
                        {isM3Patrol && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-fuchsia-600 text-white flex items-center gap-0.5 shadow-2xs">
                            <Moon className="w-2.5 h-2.5" />
                            <span>Wajib Keliling 23:00 (Foto Grup)</span>
                          </span>
                        )}
                        {task.priority === 'krusial' && !isM3Patrol && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Wajib
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-snug ${isDone ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {task.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playChime();
                        notificationService.triggerNotification(`Pengingat Tugas: ${task.title}`, {
                          body: `Waktu: ${task.time} WIB - ${task.description}`,
                          sound: 'bell',
                        });
                      }}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Bunyikan Alarm Tugas"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 space-y-1">
              <Coffee className="w-6 h-6 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hari Ini Bebas Tugas Piket ({shiftMeta.name})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Anda tidak memiliki jadwal piket aktif hari ini.
              </p>
            </div>
          )}
        </div>

        {/* Buku Jaga / Handover Logbook */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Buku Jaga & Laporan Mutasi
              </h3>
            </div>
            <span className="text-[10.5px] text-slate-500 font-mono">Tgl {activeDay} {schedule.monthName}</span>
          </div>

          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
            Catat mutasi anak asuh, sakit/izin, dan catatan serah terima shif.
          </p>

          <textarea
            value={logBookText}
            onChange={(e) => setLogBookText(e.target.value)}
            placeholder="Contoh catatan:&#10;- Jam 16:30: 2 anak asuh izin berobat di UKS.&#10;- Jam 19:45: Belajar malam tertib.&#10;- Jam 22:00: Pintu gerbang & barak dikunci..."
            rows={4}
            className="w-full flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs border border-slate-300 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none font-sans"
          />

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <span className="text-[10.5px] text-slate-400">
              {logSavedToast ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Tersimpan
                </span>
              ) : (
                'Tersimpan otomatis'
              )}
            </span>
            <button
              onClick={handleSaveLogBook}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification for Announcement */}
      {announcementToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{announcementToast}</span>
        </div>
      )}

      {/* Modal Pengumuman Berjalan (Admin / Staf) */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  <Megaphone className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {userRole === 'admin' ? 'Pengaturan Pengumuman Berjalan' : 'Pemberitahuan & Informasi Resmi'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {userRole === 'admin' 
                      ? 'Kelola teks berjalan yang tampil di bagian atas dashboard' 
                      : 'Informasi dan instruksi operasional kedinasan dari Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userRole === 'admin' ? (
              /* Admin Edit Form */
              <div className="space-y-3.5">
                {/* Status Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Status Tampilan Ticker
                    </label>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      Tampilkan teks berjalan di dashboard utama semua pengguna
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempAnnouncementEnabled}
                      onChange={(e) => setTempAnnouncementEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Isi Teks Pengumuman
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tempAnnouncementText.length} karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={tempAnnouncementText}
                    onChange={(e) => setTempAnnouncementText(e.target.value)}
                    placeholder="Tuliskan teks pengumuman yang akan berjalan di dashboard..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Template / Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Contoh Cepat / Rekomendasi Aturan:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTempAnnouncementText('📢 Pengumuman: Shif Sore tidak dapat ditukar dengan Shif Malam (M), karena memiliki jam kerja yang sama & ketentuan operasional asrama.')}
                      className="text-left text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <strong className="text-amber-700 dark:text-amber-400 block mb-0.5">Aturan Tukar Shif Sore & Malam:</strong>
                      "Shif Sore tidak dapat ditukar dengan Shif Malam (M), karena memiliki jam kerja yang sama & ketentuan operasional asrama."
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempAnnouncementText('⚠️ Perhatian: Serah terima tugas dan buku jaga wajib diisi lengkap setiap pergantian shif melalui menu Laporan Serah Terima.')}
                      className="text-left text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <strong className="text-amber-700 dark:text-amber-400 block mb-0.5">Kewajiban Serah Terima:</strong>
                      "Serah terima tugas dan buku jaga wajib diisi lengkap setiap pergantian shif melalui menu Laporan Serah Terima."
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempAnnouncementText('⏱️ Disiplin Piket: Seluruh Wali Asuh wajib hadir 15 menit sebelum jam shif dimulai untuk apel operan jaga.')}
                      className="text-left text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <strong className="text-amber-700 dark:text-amber-400 block mb-0.5">Ketepatan Waktu:</strong>
                      "Seluruh Wali Asuh wajib hadir 15 menit sebelum jam shif dimulai untuk apel operan jaga."
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementModal(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingAnnouncement}
                    onClick={handleSaveAnnouncement}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingAnnouncement ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Staff View Modal */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                    Pengumuman Saat Ini:
                  </span>
                  <p className="text-sm font-medium text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                    {announcement.text}
                  </p>
                  {announcement.updatedAt && (
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 font-mono">
                      Diperbarui oleh: {announcement.updatedBy || 'Admin'}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAnnouncementModal(false)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ICS Calendar Export Modal */}
      <IcsExportModal
        isOpen={isIcsModalOpen}
        onClose={() => setIsIcsModalOpen(false)}
        staff={selectedStaff}
        schedule={schedule}
        activeDay={activeDay}
        sopTasks={sopTasks}
      />
    </div>
  );
};
