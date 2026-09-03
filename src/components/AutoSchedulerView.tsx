import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Calendar, 
  Users, 
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { MonthSchedule, Staff, ShiftCode } from '../types';
import { 
  SHIFT_DEFINITIONS, 
  INITIAL_STAFF_LIST, 
  getInitialAugust2026Days, 
  SEPTEMBER_2026_STAFF_LIST, 
  getInitialSeptember2026Days 
} from '../data/initialSchedule';
import { generateAutoSchedule, INDONESIAN_MONTH_NAMES } from '../utils/scheduler';
import { soundManager } from '../utils/audio';

interface AutoSchedulerViewProps {
  schedule: MonthSchedule;
  setSchedule: React.Dispatch<React.SetStateAction<MonthSchedule>>;
  staffList: Staff[];
  onNavigateToMatrix: () => void;
}

export const AutoSchedulerView: React.FC<AutoSchedulerViewProps> = ({
  schedule,
  setSchedule,
  staffList,
  onNavigateToMatrix,
}) => {
  // Generator form states
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [targetMonth, setTargetMonth] = useState<number>(9); // Default September
  const [rotationPattern, setRotationPattern] = useState<'standard' | 'balanced' | 'weekend_priority'>('standard');
  const [generatedSuccess, setGeneratedSuccess] = useState<boolean>(false);

  // Swap shift form states
  const [swapDay, setSwapDay] = useState<number>(1);
  const [staffAId, setStaffAId] = useState<number>(1);
  const [staffBId, setStaffBId] = useState<number>(2);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string>('');

  const handleGenerate = () => {
    const newSchedule = generateAutoSchedule(targetYear, targetMonth, staffList);
    setSchedule(newSchedule);
    setGeneratedSuccess(true);
    soundManager.playBell();
    setTimeout(() => setGeneratedSuccess(false), 3500);
  };

  const handleResetToSeptemberOfficial = () => {
    setSchedule({
      year: 2026,
      month: 9,
      monthName: 'September',
      totalDays: 30,
      staffList: SEPTEMBER_2026_STAFF_LIST,
      days: getInitialSeptember2026Days(),
    });
    soundManager.playChime();
    onNavigateToMatrix();
  };

  const handleResetToAugustOfficial = () => {
    setSchedule({
      year: 2026,
      month: 8,
      monthName: 'Agustus',
      totalDays: 31,
      staffList: INITIAL_STAFF_LIST,
      days: getInitialAugust2026Days(),
    });
    soundManager.playChime();
    onNavigateToMatrix();
  };

  const handleExecuteSwap = () => {
    if (staffAId === staffBId) {
      alert('Pilih dua wali asuh yang berbeda untuk proses tukar shif.');
      return;
    }

    const shiftA = schedule.days[swapDay]?.[staffAId] || 'O';
    const shiftB = schedule.days[swapDay]?.[staffBId] || 'O';

    const staffA = staffList.find((s) => s.id === staffAId)?.name || 'Wali Asuh A';
    const staffB = staffList.find((s) => s.id === staffBId)?.name || 'Wali Asuh B';

    setSchedule((prev) => {
      const newDays = { ...prev.days };
      newDays[swapDay] = {
        ...newDays[swapDay],
        [staffAId]: shiftB,
        [staffBId]: shiftA,
      };
      return { ...prev, days: newDays };
    });

    setSwapSuccessMessage(
      `Berhasil menukar shif Tgl ${swapDay}: ${staffA} (${shiftB}) ⟷ ${staffB} (${shiftA})`
    );
    soundManager.playBell();
    setTimeout(() => setSwapSuccessMessage(''), 4000);
  };

  const shiftAOnDay = schedule.days[swapDay]?.[staffAId] || 'O';
  const shiftBOnDay = schedule.days[swapDay]?.[staffBId] || 'O';

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Otomatisasi Penjadwalan & Algoritma Rotasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Pengatur Shif Otomatis & Pertukaran Dinas
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
              Aplikasi dapat menghasilkan pembagian jadwal shif harian dan bulanan secara otomatis berdasarkan siklus baku rotasi dinas (Malam ➔ Lepas Piket ➔ Libur ➔ Pagi ➔ Sore) dengan penyeimbangan kuota harian yang adil.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={handleResetToSeptemberOfficial}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all"
            >
              <RotateCcw className="w-4 h-4 text-emerald-100" />
              <span>Muat Jadwal Resmi September 2026 (31 Petugas)</span>
            </button>
            <button
              onClick={handleResetToAugustOfficial}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>Muat Jadwal Asli Agustus 2026 (38 Petugas)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Auto Schedule Generator for Any Month */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Generate Jadwal Bulan Baru Otomatis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih periode bulan dan buat rotasi 20 wali asuh secara instan
              </p>
            </div>
          </div>

          {generatedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Jadwal otomatis untuk <strong>{INDONESIAN_MONTH_NAMES[targetMonth - 1]} {targetYear}</strong> berhasil dibuat dan diterapkan!</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Bulan:
                </label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                >
                  {INDONESIAN_MONTH_NAMES.map((mName, i) => (
                    <option key={i + 1} value={i + 1}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tahun:
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pola Algoritma Rotasi:
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <input
                    type="radio"
                    name="pattern"
                    checked={rotationPattern === 'standard'}
                    onChange={() => setRotationPattern('standard')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Rotasi Standar Kemensos (6 Hari)</div>
                    <div className="text-[11px] text-slate-500">Malam ➔ Lepas Piket ➔ Off ➔ Pagi ➔ Sore ➔ Sore</div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                  <input
                    type="radio"
                    name="pattern"
                    checked={rotationPattern === 'balanced'}
                    onChange={() => setRotationPattern('balanced')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Rotasi Berimbang (7 Hari)</div>
                    <div className="text-[11px] text-slate-500">Malam ➔ LP ➔ Off ➔ P2 ➔ P3 ➔ Sore ➔ Sore</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Quota targets */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Distribusi Kuota Harian & Preferensi:</span>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Jaga Pagi (P, P2, P3): 4 - 5 Petugas per hari</li>
                <li>Jaga Sore: Dibagi proporsional & adil:
                  <ul className="pl-4 space-y-0.5 list-none text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <li>🍱 <strong className="text-amber-700 dark:text-amber-300">S2A (Kantin SMP - 2 org):</strong> Cenderung: <em>Eko Wahyudi (prioritas utama Sabtu & Minggu), Sholeh, Muji Santoso, Chusfia, Siti Maslukah, Asrofi, Yusak, Nanang, Furi, Iva, Hariadi, Rindani, Erna, Rizki</em></li>
                    <li>🍲 <strong className="text-orange-700 dark:text-orange-300">S3A (Kantin SMA - 2 org):</strong> Cenderung: <em>Mahmud, Fico, Suhariyono, Pricil, Rafif, Chabib, Teguh, Mufid, Dewi, Afida, Ambika, Anita, Retnowati</em></li>
                    <li>🕌 <strong className="text-emerald-700 dark:text-emerald-300">S4A (Jaga Masjid & Lingkungan):</strong> Pengarahan santri ibadah di masjid, monitoring luar kantin dan asrama</li>
                  </ul>
                </li>
                <li>Jaga Malam (M): Dibagi menjadi M1 (Laki-laki s.d 00:00) & M2 (Perempuan Subuh - 07:00)</li>
                <li>Lepas Piket + Off (LP & O): Rotasi aman</li>
              </ul>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Jadwal {INDONESIAN_MONTH_NAMES[targetMonth - 1]} {targetYear} Sekarang</span>
            </button>
          </div>
        </div>

        {/* Module 2: Tukar Shif (Shift Swapping Tool) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Asisten Tukar Shif Antar Petugas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tukar penugasan antara 2 wali asuh secara aman dan valid
              </p>
            </div>
          </div>

          {swapSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{swapSuccessMessage}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Tanggal Pertukaran:
              </label>
              <select
                value={swapDay}
                onChange={(e) => setSwapDay(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
              >
                {Array.from({ length: schedule.totalDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tanggal {d} {schedule.monthName} {schedule.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Staff A */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Petugas Pertama (A):
                </label>
                <select
                  value={staffAId}
                  onChange={(e) => setStaffAId(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.id}. {st.name}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Shif Saat Ini:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${SHIFT_DEFINITIONS[shiftAOnDay].badgeClass}`}>
                    {shiftAOnDay} ({SHIFT_DEFINITIONS[shiftAOnDay].startTime})
                  </span>
                </div>
              </div>

              {/* Staff B */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Petugas Kedua (B):
                </label>
                <select
                  value={staffBId}
                  onChange={(e) => setStaffBId(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.id}. {st.name}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Shif Saat Ini:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${SHIFT_DEFINITIONS[shiftBOnDay].badgeClass}`}>
                    {shiftBOnDay} ({SHIFT_DEFINITIONS[shiftBOnDay].startTime})
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Setelah ditukar, jam kerja dan total statistik pada matriks 31 hari akan otomatis dihitung ulang secara real-time.
              </span>
            </div>

            <button
              onClick={handleExecuteSwap}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Tukar Shif Tanggal {swapDay} Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
