import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Edit3, 
  X, 
  Check, 
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  CheckCircle2,
  ArrowLeftRight
} from 'lucide-react';
import { MonthSchedule, Staff, ShiftCode, ShiftSummary } from '../types';
import { SHIFT_DEFINITIONS, getStaffInitials, distributeSeptemberMorningShifts, distributeSeptemberNightShifts } from '../data/initialSchedule';
import { calculateStaffSummary, calculateDailyStats, exportScheduleToCSV, downloadCSV } from '../utils/scheduler';
import { generateOfficialSchedulePDF } from '../utils/pdfExport';
import { exportScheduleToExcel } from '../utils/excelExport';
import { soundManager } from '../utils/audio';

interface ScheduleMatrixProps {
  userRole?: 'admin' | 'staff';
  schedule: MonthSchedule;
  setSchedule: React.Dispatch<React.SetStateAction<MonthSchedule>>;
  staffList: Staff[];
  selectedStaffId: number;
  setSelectedStaffId: (id: number) => void;
  activeDay: number;
  setActiveDay: (day: number) => void;
  onOpenPrint: () => void;
  onOpenAuto: () => void;
  onOpenAdminSwap?: () => void;
}

export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  userRole = 'staff',
  schedule,
  setSchedule,
  staffList,
  selectedStaffId,
  setSelectedStaffId,
  activeDay,
  setActiveDay,
  onOpenPrint,
  onOpenAuto,
  onOpenAdminSwap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [editingCell, setEditingCell] = useState<{ day: number; staffId: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate summaries for all staff
  const staffSummaries = useMemo(() => {
    return staffList.map((st) => calculateStaffSummary(st, schedule.days, schedule.totalDays));
  }, [staffList, schedule.days, schedule.totalDays]);

  // Daily bottom stats for days 1 to 31
  const dailyStatsList = useMemo(() => {
    return Array.from({ length: schedule.totalDays }, (_, i) => {
      return calculateDailyStats(i + 1, schedule.days, staffList);
    });
  }, [schedule.days, schedule.totalDays, staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchName) return false;

      // Filter by group
      if (groupFilter === 'UTAMA' && (s.id > 20 || s.gender !== undefined)) return false;
      if (groupFilter === 'BARU' && s.id <= 20) return false;
      if (groupFilter === 'LAKI' && s.gender !== 'L') return false;
      if (groupFilter === 'PEREMPUAN' && s.gender !== 'P') return false;

      if (shiftFilter === 'ALL') return true;
      // Filter by shift type on active day
      const shiftOnActiveDay = schedule.days[activeDay]?.[s.id];
      if (shiftFilter === 'PAGI_ALL') {
        return shiftOnActiveDay === 'P' || shiftOnActiveDay === 'P1' || shiftOnActiveDay === 'P2' || shiftOnActiveDay === 'P3';
      }
      if (shiftFilter === 'P1') {
        return shiftOnActiveDay === 'P1' || shiftOnActiveDay === 'P';
      }
      if (shiftFilter === 'SORE_ALL') {
        return shiftOnActiveDay === 'S' || shiftOnActiveDay === 'S2A' || shiftOnActiveDay === 'S3A' || shiftOnActiveDay === 'S4A';
      }
      if (shiftFilter === 'MALAM_ALL') {
        return shiftOnActiveDay === 'M' || shiftOnActiveDay === 'M1' || shiftOnActiveDay === 'M2';
      }
      return shiftOnActiveDay === shiftFilter;
    });
  }, [staffList, searchTerm, groupFilter, shiftFilter, schedule.days, activeDay]);

  const handleCellClick = (day: number, staffId: number) => {
    if (userRole !== 'admin') {
      setToastMessage('🔒 Hanya Administrator yang berwenang mengubah jadwal dinas. Akses staf bersifat baca.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setEditingCell({ day, staffId });
  };

  const handleUpdateShift = (newShift: ShiftCode) => {
    if (!editingCell) return;
    const { day, staffId } = editingCell;

    setSchedule((prev) => {
      const newDays = { ...prev.days };
      newDays[day] = { ...newDays[day], [staffId]: newShift };
      return { ...prev, days: newDays };
    });

    soundManager.playChime();
    setEditingCell(null);
  };

  const handleExportCSV = () => {
    const csvContent = exportScheduleToCSV(schedule, staffSummaries);
    downloadCSV(`Jadwal_Shif_Wali_Asuh_${schedule.monthName}_${schedule.year}.csv`, csvContent);
    soundManager.playBell();
  };

  const editingStaff = editingCell ? staffList.find((s) => s.id === editingCell.staffId) : null;
  const currentShiftOfEditing = editingCell ? schedule.days[editingCell.day]?.[editingCell.staffId] || 'O' : 'O';

  return (
    <div className="space-y-2">
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[240px]">
          {/* Search Box */}
          <div className="relative min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama wali asuh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-6 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter by Group */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Grup:</span>
            <select
              aria-label="Filter grup wali asuh"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">Semua Petugas ({staffList.length})</option>
              <option value="LAKI">Petugas Laki-laki (17)</option>
              <option value="PEREMPUAN">Petugas Perempuan (14)</option>
            </select>
          </div>

          {/* Filter by Shift */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Shif Tgl {activeDay}:</span>
            <select
              aria-label="Filter jenis shif"
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">Semua Shif</option>
              <option value="PAGI_ALL">Semua Pagi (P1/P2/P 07:00-16:00)</option>
              <option value="P1">P1 (Pagi 07:00-15:00)</option>
              <option value="P2">P2 (Pagi 08:00-16:00)</option>
              <option value="SORE_ALL">Semua Sore (S2A/S3A/S4A 15:00-23:00)</option>
              <option value="S2A">S2A (Kantin SMP)</option>
              <option value="S3A">S3A (Kantin SMA)</option>
              <option value="S4A">S4A (Jaga Masjid)</option>
              <option value="MALAM_ALL">Semua Malam (M/M1/M2 15:00-07:00)</option>
              <option value="M">M (Malam Standar)</option>
              <option value="M1">M1 (Malam Sesi 1)</option>
              <option value="M2">M2 (Malam Sesi 2)</option>
              <option value="LP">LP (Lepas Piket)</option>
              <option value="O">O (Libur / Off)</option>
              <option value="C">C (Cuti)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {userRole === 'admin' && onOpenAdminSwap && (
            <button
              onClick={onOpenAdminSwap}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="Buka panel admin untuk menukar shif antar wali asuh"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Tukar Shif (Admin)</span>
            </button>
          )}
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => {
                  if (
                    !window.confirm(
                      'Perhatian: Tindakan ini akan mengatur ulang rotasi shift pagi (P1 & P2) untuk semua staf dalam bulan ini. Apakah Anda yakin ingin melanjutkan?'
                    )
                  ) {
                    return;
                  }
                  const updatedDays = distributeSeptemberMorningShifts(
                    schedule.days,
                    schedule.year,
                    schedule.month,
                    schedule.staffList
                  );
                  setSchedule((prev) => ({
                    ...prev,
                    days: updatedDays,
                  }));
                  soundManager.playChime();
                  setToastMessage('Pembagian Shif P1, P2, dan P3 (Senin Upacara 07:00-16:00) berhasil diperbarui!');
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Terapkan pembagian P1 (07-15), P2 (08-16), dan P3 Upacara Senin (07-16)"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Terapkan P1, P2 & P3</span>
              </button>
              <button
                onClick={() => {
                  const updatedDays = distributeSeptemberNightShifts(
                    schedule.days,
                    schedule.year,
                    schedule.month,
                    schedule.staffList
                  );
                  setSchedule((prev) => ({
                    ...prev,
                    days: updatedDays,
                  }));
                  soundManager.playChime();
                  setToastMessage('Shif Malam M1 & M2 berhasil diterapkan (M1 Laki-laki s.d 00:00, M2 Perempuan Subuh-07:00)!');
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Terapkan pembagian M1 & M2 sesuai aturan gender"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Terapkan M1 & M2</span>
              </button>
              <button
                onClick={onOpenAuto}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Atur Otomatis</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              try {
                const monthName = schedule.monthName || 'September';
                const filename = `Jadwal_Dinas_Wali_Asuh_${monthName}_${schedule.year}.xlsx`;
                exportScheduleToExcel(schedule, staffSummaries, filename);
                soundManager.playChime();
                setToastMessage(`File Excel (.xlsx) berhasil diunduh: ${filename}`);
                setTimeout(() => setToastMessage(null), 4000);
              } catch (err) {
                console.error('Error exporting to Excel:', err);
                setToastMessage('Gagal mengunduh file Excel.');
                setTimeout(() => setToastMessage(null), 3000);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Unduh jadwal lengkap matriks dan rekapitulasi ke format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            title="Download Format CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => {
              try {
                const fileName = generateOfficialSchedulePDF(schedule, staffList);
                setToastMessage(`File PDF Resmi berhasil diunduh: ${fileName}`);
                setTimeout(() => setToastMessage(null), 4000);
              } catch (e) {
                console.error(e);
                onOpenPrint();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Unduh langsung dokumen format PDF resmi"
          >
            <FileDown className="w-3 h-3" />
            <span>Unduh PDF</span>
          </button>
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            title="Cetak Jadwal Format Resmi"
          >
            <Printer className="w-3 h-3" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Legend & Instructions */}
      <div className="bg-white dark:bg-slate-800 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1.5 text-[10.5px]">
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-bold text-slate-700 dark:text-slate-300">Petunjuk:</span>
          {Object.values(SHIFT_DEFINITIONS).map((s) => (
            <span
              key={s.code}
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${s.bgLight} ${s.bgDark}`}
              title={`${s.name}: ${s.startTime} - ${s.endTime}`}
            >
              {s.code}: {s.name.split(' ')[0]}
            </span>
          ))}
        </div>
        <span className="text-slate-400 italic text-[10px] hidden md:inline">
          {userRole === 'admin' 
            ? '💡 Mode Admin Aktif: Klik sel tanggal untuk mengubah shif langsung' 
            : '🔒 Mode Tinjau Staf: Hubungi Admin untuk permohonan tukar shif'}
        </span>
      </div>

      {/* Main Schedule Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              {/* Main Column Header */}
              <tr className="bg-slate-100 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                <th className="p-1 border-r border-slate-300 dark:border-slate-700 sticky left-0 z-20 bg-slate-100 dark:bg-slate-900 w-7 text-[10px]">
                  No
                </th>
                <th className="p-1 border-r border-slate-300 dark:border-slate-700 sticky left-7 z-20 bg-slate-100 dark:bg-slate-900 text-left min-w-[135px] max-w-[155px] truncate shadow-xs text-[11px]">
                  Nama Wali Asuh
                </th>

                {/* Day Columns 1 to 31 */}
                {Array.from({ length: schedule.totalDays }, (_, i) => i + 1).map((day) => {
                  const isSelectedDay = day === activeDay;
                  const dateObj = new Date(schedule.year, schedule.month - 1, day);
                  const dayOfWeek = dateObj.getDay();
                  const isSunday = dayOfWeek === 0;
                  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

                  return (
                    <th
                      key={day}
                      onClick={() => setActiveDay(day)}
                      className={`p-0.5 border-r border-slate-300 dark:border-slate-700 cursor-pointer transition-colors w-7 min-w-[26px] ${
                        isSelectedDay
                          ? 'bg-blue-600 text-white font-extrabold ring-1 ring-blue-500'
                          : isSunday
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/80 font-bold'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                      title={`Klik untuk fokus tanggal ${day} (${dayNames[dayOfWeek]})`}
                    >
                      <div className="flex flex-col items-center justify-center leading-none py-0.5">
                        <span className="text-[10px] font-bold">{day}</span>
                        <span className={`text-[7.5px] uppercase font-semibold ${
                          isSelectedDay 
                            ? 'text-blue-100' 
                            : isSunday 
                            ? 'text-red-600 dark:text-red-400 font-extrabold' 
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {dayNames[dayOfWeek]}
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Statistical Summary Column Headers */}
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold text-[9.5px] min-w-[28px]" title="Pagi Full (P + P2 + P3)">
                  P FUL
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 font-extrabold text-[9.5px] min-w-[24px]" title="Jaga Sore">
                  S
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-extrabold text-[9.5px] min-w-[24px]" title="Jaga Malam">
                  M
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 font-extrabold text-[9.5px] min-w-[24px]" title="Lepas Piket">
                  LP
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 font-extrabold text-[9.5px] min-w-[26px]" title="Libur / Off">
                  OFF
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold text-[9.5px] min-w-[22px]" title="Pagi 1 (07:00-15:00)">
                  P1
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 font-semibold text-[9.5px] min-w-[22px]" title="Pagi 2 (08:00-16:00)">
                  P2
                </th>
                <th className="p-0.5 border-r border-slate-300 dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-300 font-semibold text-[9.5px] min-w-[22px]" title="Pagi 3 (07:00-15:00)">
                  P3
                </th>
                <th className="p-0.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-[9.5px] min-w-[32px]" title="Total Jam Kerja (JK)">
                  JK
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={schedule.totalDays + 11} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Data Jadwal Bersih (Kosong)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Semua data jadwal dan daftar petugas telah dibersihkan secara total. Silakan kirimkan data baru untuk dimasukkan ke jadwal.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff, idx) => {
                const isSelectedStaff = staff.id === selectedStaffId;
                const summary = staffSummaries.find((s) => s.staffId === staff.id);

                return (
                  <tr
                    key={staff.id}
                    className={`border-b border-slate-200 dark:border-slate-700/80 transition-colors ${
                      isSelectedStaff
                        ? 'bg-blue-50/80 dark:bg-blue-950/30'
                        : idx % 2 === 0
                        ? 'bg-white dark:bg-slate-800'
                        : 'bg-slate-50/50 dark:bg-slate-850/50'
                    } hover:bg-amber-50/40 dark:hover:bg-slate-700/50`}
                  >
                    {/* No */}
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 sticky left-0 z-10 bg-inherit font-medium text-slate-500 text-[10px]">
                      {staff.id}
                    </td>

                    {/* Name */}
                    <td
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`p-1 border-r border-slate-200 dark:border-slate-700/80 sticky left-7 z-10 bg-inherit text-left font-semibold cursor-pointer truncate text-[11px] ${
                        isSelectedStaff
                          ? 'text-blue-700 dark:text-blue-300 underline decoration-blue-400'
                          : 'text-slate-800 dark:text-slate-200 hover:text-blue-600'
                      }`}
                      title={`Klik untuk memilih profil ini (${staff.group || (staff.id <= 20 ? 'Wali Asuh Utama' : 'Wali Asuh Baru')})`}
                    >
                      <div className="flex items-center gap-1 truncate">
                        {staff.code && (
                          <span className={`shrink-0 px-1 py-0.2 text-[8.5px] rounded font-bold ${
                            staff.gender === 'L'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              : 'bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-800'
                          }`}>
                            {staff.code}
                          </span>
                        )}
                        <span className="truncate">{staff.name}</span>
                        {staff.jenjang && staff.jenjang !== '-' && (
                          <span className="shrink-0 px-1 py-0.2 text-[8px] rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {staff.jenjang}
                          </span>
                        )}
                        {schedule.month !== 9 && staff.id > 20 && (
                          <span className="shrink-0 px-1 py-0.2 text-[8px] rounded font-medium bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            Baru
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Shift Days 1 to 31 */}
                    {Array.from({ length: schedule.totalDays }, (_, i) => i + 1).map((day) => {
                      const shift = schedule.days[day]?.[staff.id] || 'O';
                      const meta = SHIFT_DEFINITIONS[shift] || SHIFT_DEFINITIONS['P1'];
                      const isFocusedDay = day === activeDay;

                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(day, staff.id)}
                          className={`p-0.2 border-r border-slate-200 dark:border-slate-700/80 cursor-pointer select-none transition-all ${
                            isFocusedDay ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : ''
                          }`}
                          title={`Tgl ${day} - ${staff.name}: ${meta?.name || shift} (${meta?.startTime || '07:00'}-${meta?.endTime || '15:00'})`}
                        >
                          <span
                            className={`inline-flex items-center justify-center min-w-[24px] max-w-[34px] py-0 px-0.5 rounded text-[9.5px] font-bold border leading-tight ${meta?.bgLight || 'bg-slate-100'} ${meta?.bgDark || 'dark:bg-slate-800'}`}
                          >
                            {shift}
                          </span>
                        </td>
                      );
                    })}

                    {/* Summary Columns */}
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-bold bg-sky-50/40 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 text-[10px]">
                      {summary?.pFull || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-bold bg-orange-50/40 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 text-[10px]">
                      {summary?.s || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-bold bg-blue-50/40 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 text-[10px]">
                      {summary?.m || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-bold bg-slate-100/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-300 text-[10px]">
                      {summary?.lp || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-bold bg-red-50/60 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[10px]">
                      {summary?.off || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-semibold text-sky-700 dark:text-sky-400 text-[10px]">
                      {(summary?.p1 || 0) + (summary?.p || 0)}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-semibold text-teal-700 dark:text-teal-400 text-[10px]">
                      {summary?.p2 || 0}
                    </td>
                    <td className="p-0.5 border-r border-slate-200 dark:border-slate-700/80 font-semibold text-yellow-700 dark:text-yellow-400 text-[10px]">
                      {summary?.p3 || 0}
                    </td>
                    <td className="p-0.5 font-mono font-extrabold bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white text-[10px]">
                      {summary?.totalHours || 0}
                    </td>
                  </tr>
                );
              }))}
            </tbody>

            {/* Bottom Summary Table (Exact Match to Official Document OCR) */}
            <tfoot>
              {/* (P1) 07:00 - 15:00 */}
              <tr className="bg-sky-50/80 dark:bg-sky-950/40 text-slate-800 dark:text-slate-200 border-t-2 border-slate-400 dark:border-slate-600 font-semibold text-[10px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-sky-50 dark:bg-sky-950 font-bold text-sky-900 dark:text-sky-200">
                  (P1) 07:00 - 15:00
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-sky-800 dark:text-sky-300 font-bold">
                    {(st.p1 || 0) + (st.p || 0)}
                  </td>
                ))}
                <td colSpan={9} className="bg-sky-50 dark:bg-sky-950"></td>
              </tr>

              {/* (P2) 08:00 - 16:00 */}
              <tr className="bg-teal-50/80 dark:bg-teal-950/40 text-slate-800 dark:text-slate-200 border-t border-slate-300 dark:border-slate-700 font-semibold text-[10px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-teal-50 dark:bg-teal-950 font-bold">
                  (P2) 08:00 - 16:00
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-teal-800 dark:text-teal-300 font-bold">
                    {st.p2}
                  </td>
                ))}
                <td colSpan={9} className="bg-teal-50 dark:bg-teal-950"></td>
              </tr>

              {/* (P3) 07:00 - 16:00 (Upacara) */}
              <tr className="bg-yellow-50/80 dark:bg-yellow-950/40 text-slate-800 dark:text-slate-200 border-t border-slate-300 dark:border-slate-700 font-semibold text-[10px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-yellow-50 dark:bg-yellow-950 font-bold">
                  (P3) 07:00 - 16:00 (Upacara)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-yellow-800 dark:text-yellow-300 font-bold">
                    {st.p3}
                  </td>
                ))}
                <td colSpan={9} className="bg-yellow-50 dark:bg-yellow-950"></td>
              </tr>

              {/* (PAGI FULL) */}
              <tr className="bg-sky-100 dark:bg-sky-900/70 text-slate-900 dark:text-white border-t border-sky-300 dark:border-sky-700 font-extrabold text-[10px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-sky-100 dark:bg-sky-900 font-bold text-sky-950 dark:text-sky-100">
                  (PAGI FULL)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-sky-950 dark:text-sky-100 font-black">
                    {st.pagiFull}
                  </td>
                ))}
                <td colSpan={9} className="bg-sky-100 dark:bg-sky-900"></td>
              </tr>

              {/* (S) 15:00 - 23:00 */}
              <tr className="bg-orange-100/70 dark:bg-orange-950/60 text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700 font-extrabold text-[10px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-orange-100 dark:bg-orange-950 font-bold">
                  (S) TOTAL SORE (15:00-23:00)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-orange-950 dark:text-orange-100 font-black">
                    {st.s}
                  </td>
                ))}
                <td colSpan={9} className="bg-orange-100 dark:bg-orange-950"></td>
              </tr>

              {/* (S2A) Kantin SMP */}
              <tr className="bg-purple-50/80 dark:bg-purple-950/30 text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 text-[9.5px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-purple-50 dark:bg-purple-950 font-semibold text-purple-900 dark:text-purple-300">
                  - S2A (Kantin SMP)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-purple-800 dark:text-purple-300 font-bold">
                    {st.s2a}
                  </td>
                ))}
                <td colSpan={9} className="bg-purple-50 dark:bg-purple-950"></td>
              </tr>

              {/* (S3A) Kantin SMA */}
              <tr className="bg-orange-50/70 dark:bg-orange-950/30 text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 text-[9.5px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-orange-50 dark:bg-orange-950 font-semibold text-orange-900 dark:text-orange-300">
                  - S3A (Kantin SMA)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-orange-800 dark:text-orange-300 font-bold">
                    {st.s3a}
                  </td>
                ))}
                <td colSpan={9} className="bg-orange-50 dark:bg-orange-950"></td>
              </tr>

              {/* (S4A) Jaga Masjid */}
              <tr className="bg-emerald-50/80 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 text-[9.5px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950 font-semibold text-emerald-900 dark:text-emerald-300">
                  - S4A (Jaga Masjid)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-bold">
                    {st.s4a}
                  </td>
                ))}
                <td colSpan={9} className="bg-emerald-50 dark:bg-emerald-950"></td>
              </tr>

              {/* (M) 15:00 - 07:00 */}
              <tr className="bg-blue-100/70 dark:bg-blue-950/60 text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700 font-extrabold">
                <td colSpan={2} className="p-1.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-blue-100 dark:bg-blue-950 font-bold">
                  (M) TOTAL MALAM (15:00-07:00)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-1 border-r border-slate-300 dark:border-slate-700 text-blue-950 dark:text-blue-100 font-black">
                    {st.m}
                  </td>
                ))}
                <td colSpan={9} className="bg-blue-100 dark:bg-blue-950"></td>
              </tr>

              {/* M1 (Malam Sesi 1) */}
              <tr className="bg-indigo-50/70 dark:bg-indigo-950/30 text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 text-[9.5px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-indigo-50 dark:bg-indigo-950 font-semibold text-indigo-900 dark:text-indigo-300">
                  - M1 (Malam Sesi 1)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-indigo-800 dark:text-indigo-300 font-bold">
                    {st.m1}
                  </td>
                ))}
                <td colSpan={9} className="bg-indigo-50 dark:bg-indigo-950"></td>
              </tr>

              {/* M2 (Malam Sesi 2) */}
              <tr className="bg-blue-50/70 dark:bg-blue-950/30 text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700 text-[9.5px]">
                <td colSpan={2} className="p-0.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-blue-50 dark:bg-blue-950 font-semibold text-blue-900 dark:text-blue-300">
                  - M2 (Malam Sesi 2)
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-0.2 border-r border-slate-300 dark:border-slate-700 text-blue-800 dark:text-blue-300 font-bold">
                    {st.m2}
                  </td>
                ))}
                <td colSpan={9} className="bg-blue-50 dark:bg-blue-950"></td>
              </tr>

              {/* CUTI */}
              <tr className="bg-teal-50/70 dark:bg-teal-950/40 text-slate-800 dark:text-slate-200 border-t border-slate-300 dark:border-slate-700 font-semibold">
                <td colSpan={2} className="p-1.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-teal-50 dark:bg-teal-950 font-bold">
                  CUTI
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-1 border-r border-slate-300 dark:border-slate-700 text-teal-800 dark:text-teal-300 font-bold">
                    {st.cuti}
                  </td>
                ))}
                <td colSpan={9} className="bg-teal-50 dark:bg-teal-950"></td>
              </tr>

              {/* OFF / LIBUR + LEPAS */}
              <tr className="bg-red-50/70 dark:bg-red-950/40 text-slate-800 dark:text-slate-200 border-t border-slate-300 dark:border-slate-700 font-semibold">
                <td colSpan={2} className="p-1.5 border-r border-slate-300 dark:border-slate-700 text-right sticky left-0 z-10 bg-red-50 dark:bg-red-950 font-bold text-red-900 dark:text-red-200">
                  OFF / LIBUR + LEPAS
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-1 border-r border-slate-300 dark:border-slate-700 text-red-700 dark:text-red-300 font-bold">
                    {st.offDanLepas}
                  </td>
                ))}
                <td colSpan={9} className="bg-red-50 dark:bg-red-950"></td>
              </tr>

              {/* JUMLAH */}
              <tr className="bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-white border-t-2 border-slate-500 font-black">
                <td colSpan={2} className="p-1.5 border-r border-slate-400 text-right sticky left-0 z-10 bg-slate-200 dark:bg-slate-900 font-black">
                  JUMLAH
                </td>
                {dailyStatsList.map((st, i) => (
                  <td key={i} className="p-1 border-r border-slate-400 font-black">
                    {st.total}
                  </td>
                ))}
                <td colSpan={9} className="bg-slate-200 dark:bg-slate-900"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Special Shift Notes & Instructions Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300 uppercase tracking-wide text-[11px]">
            <span>📋 CATATAN KHUSUS PENUGASAN SORE</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            <li><strong>S2A</strong>: Menjaga asrama, merawat anak asuh sakit, kantin SMP dan memimpin makan malam di SMP.</li>
            <li><strong>S3A</strong>: Menjaga asrama, merawat anak asuh sakit, kantin SMA dan memimpin makan malam di SMA.</li>
            <li><strong>S4A</strong>: Pengarahan dan pendampingan anak asuh ibadah di masjid, monitoring luar kantin dan asrama.</li>
          </ol>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300 uppercase tracking-wide text-[11px]">
            <span>🌙 CATATAN KHUSUS PENUGASAN MALAM</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
            <li>Untuk <strong>laki-laki</strong> bertugas sampai jam <strong>00:00</strong></li>
            <li>Untuk <strong>perempuan</strong> bertugas setelah subuh sampai jam <strong>07:00</strong></li>
          </ol>
        </div>
      </div>

      {/* Quick Edit Modal Dialog */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ubah Shif Wali Asuh
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingStaff?.name} • Tanggal {editingCell.day} {schedule.monthName} {schedule.year}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Pilih Jenis Shif:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SHIFT_DEFINITIONS) as ShiftCode[]).map((code) => {
                  const info = SHIFT_DEFINITIONS[code];
                  const isCurrent = currentShiftOfEditing === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleUpdateShift(code)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50 dark:bg-blue-950/50'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/50'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${info.badgeClass}`}>
                        {code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {info.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {info.startTime} - {info.endTime}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
