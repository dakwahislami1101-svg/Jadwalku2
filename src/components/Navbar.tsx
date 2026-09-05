import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Bell, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  User, 
  LayoutDashboard, 
  CalendarDays, 
  Sparkles, 
  Printer, 
  Settings,
  ShieldCheck,
  FileText,
  LogOut,
  ArrowLeftRight,
  Database,
  RefreshCw,
  ListTodo
} from 'lucide-react';
import { Staff } from '../types';
import { INSTITUTION_INFO } from '../data/initialSchedule';
import { soundManager } from '../utils/audio';

interface NavbarProps {
  userRole?: 'admin' | 'staff';
  currentTab: 'dashboard' | 'matrix' | 'personal' | 'admin' | 'auto' | 'notifications' | 'print' | 'handover' | 'sop';
  setCurrentTab: (tab: 'dashboard' | 'matrix' | 'personal' | 'admin' | 'auto' | 'notifications' | 'print' | 'handover' | 'sop') => void;
  staffList: Staff[];
  selectedStaffId: number;
  setSelectedStaffId: (id: number) => void;
  selectedMonth: { year: number; month: number; monthName: string };
  onSelectMonth: (year: number, month: number) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  activeShiftTitle: string;
  onLogout?: () => void;
  cloudStatus?: 'connected' | 'syncing' | 'offline' | 'error';
  onForceSyncToCloud?: () => void;
  onShowSplash?: () => void;
  isRefreshing?: boolean;
  onRefreshServer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userRole = 'staff',
  currentTab,
  setCurrentTab,
  staffList,
  selectedStaffId,
  setSelectedStaffId,
  selectedMonth,
  onSelectMonth,
  darkMode,
  setDarkMode,
  soundEnabled,
  setSoundEnabled,
  activeShiftTitle,
  onLogout,
  cloudStatus = 'connected',
  onForceSyncToCloud,
  onShowSplash,
  isRefreshing = false,
  onRefreshServer,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${mins}:${secs} WIB`);

      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setDateStr(now.toLocaleDateString('id-ID', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    soundManager.setEnabled(newVal);
    if (newVal) {
      soundManager.playChime();
    }
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Top Banner / Institution Title */}
      <div className="bg-slate-100/95 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 py-1 text-[11px] font-medium border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5 transition-colors">
        <div className="flex items-center gap-1.5">
          {userRole === 'admin' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              👑 Administrator SRT 1
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-2xs">
              <ShieldCheck className="w-2.5 h-2.5" /> Kemensos RI
            </span>
          )}
          <span className="hidden sm:inline text-slate-800 dark:text-slate-200 font-bold text-[11px]">{INSTITUTION_INFO.sekolah}</span>
          <span className="text-slate-500 dark:text-slate-400 hidden md:inline text-[10.5px]">• {INSTITUTION_INFO.gedung}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
          {/* Cloud Database Status Badge */}
          <div 
            onClick={onForceSyncToCloud}
            title={
              cloudStatus === 'connected' 
                ? 'Firestore Database Terhubung (Real-time Cloud Sync Aktif). Klik untuk sinkronkan ulang.'
                : cloudStatus === 'syncing'
                ? 'Sedang menyinkronkan data ke Cloud Firestore...'
                : cloudStatus === 'error'
                ? 'Koneksi Firestore mengalami kendala (menggunakan penyimpanan lokal).'
                : 'Mode Offline (Penyimpanan lokal aktif).'
            }
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-all shadow-2xs ${
              cloudStatus === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/80 hover:bg-emerald-100'
                : cloudStatus === 'syncing'
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700/80 animate-pulse'
                : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/80'
            }`}
          >
            <Database className={`w-2.5 h-2.5 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {cloudStatus === 'connected' && 'Cloud DB Terhubung'}
              {cloudStatus === 'syncing' && 'Menyinkronkan...'}
              {cloudStatus === 'offline' && 'Lokal (Offline)'}
              {cloudStatus === 'error' && 'DB Terputus'}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              cloudStatus === 'connected' ? 'bg-emerald-500' :
              cloudStatus === 'syncing' ? 'bg-blue-500' : 'bg-amber-500'
            }`} />
          </div>

          {/* Dedicated Refresh from Server Button in Top Bar */}
          {onRefreshServer && (
            <button
              type="button"
              onClick={onRefreshServer}
              disabled={isRefreshing}
              title={isRefreshing ? 'Sedang memuat data dari server...' : 'Ambil data terbaru dari server (Cloud Firestore)'}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-2.5 h-2.5 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="font-mono text-slate-800 dark:text-amber-300 font-bold">{timeStr}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>{dateStr}</span>
          </div>

          {/* Speaker Sound Toggle (Sejajar Kemensos RI) */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Suara Notifikasi Aktif' : 'Suara Notifikasi Dinonaktifkan'}
            className={`p-1 rounded text-xs transition-colors cursor-pointer flex items-center shadow-2xs ${
              soundEnabled
                ? 'text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-50 dark:bg-slate-800/90 border border-amber-300 dark:border-amber-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* Mode Gelap/Terang Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            className="p-1 rounded bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center shadow-2xs"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          {/* Ikon Keluar (Logout) Sejajar Kemensos RI */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Keluar / Kunci Sesi"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 dark:bg-rose-950/90 dark:hover:bg-rose-900 dark:text-rose-300 dark:border-rose-700/80 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-[1680px] mx-auto px-2 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <img 
            src="/logo.svg" 
            alt="Logo Sekolah Rakyat" 
            className="w-8 h-8 rounded-lg shadow-xs object-contain bg-white border border-slate-200 dark:border-slate-700 p-0.5 shrink-0" 
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                Sistem Jadwal Shif Wali Asuh
              </h1>
              <span className="hidden lg:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                {activeShiftTitle}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-none">
              Otomatisasi Jadwal Harian & Notifikasi Pengingat Tugas
            </p>
          </div>
        </div>

        {/* User Identity & Quick Controls (Ringkas, Pas Layar HP Tanpa Geser) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Month Selector Switcher */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] shadow-2xs">
            <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <select
              aria-label="Pilih Periode Bulan Jadwal"
              value={`${selectedMonth.year}-${selectedMonth.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                onSelectMonth(y, m);
              }}
              className="bg-transparent font-bold text-blue-900 dark:text-blue-200 focus:outline-none cursor-pointer pr-1 text-[11px]"
            >
              <option value="2026-8" className="dark:bg-slate-800 dark:text-slate-100 font-bold">
                Agustus 2026 (38 Petugas)
              </option>
              <option value="2026-9" className="dark:bg-slate-800 dark:text-slate-100 font-bold">
                September 2026 (31 Petugas)
              </option>
            </select>
          </div>

          {/* Active Staff Profile Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <User className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Saya:</span>
            <select
              aria-label="Pilih Profil Wali Asuh"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-0.5 text-[11px] max-w-[130px] truncate"
            >
              {staffList.map((st) => (
                <option key={st.id} value={st.id} className="dark:bg-slate-800 dark:text-slate-100">
                  {st.code ? `[${st.code}] ` : ''}{st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1680px] mx-auto px-2 sm:px-4">
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          {userRole === 'admin' ? (
            /* ADMIN PORTAL TABS */
            <>
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  currentTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                <span>Panel Tukar Shif (Admin)</span>
              </button>

              <button
                onClick={() => setCurrentTab('matrix')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'matrix'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Matriks Roster 31 Hari</span>
              </button>

              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard Hari Ini</span>
              </button>

              <button
                onClick={() => setCurrentTab('handover')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'handover'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Laporan Serah Terima Shift</span>
              </button>

              <button
                onClick={() => setCurrentTab('sop')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'sop'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-indigo-800 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
                <span>SOP & Checklist Shif (Admin)</span>
              </button>

              <button
                onClick={() => setCurrentTab('auto')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'auto'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Atur Shif Otomatis</span>
              </button>

              <button
                onClick={() => setCurrentTab('notifications')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'notifications'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notifikasi & Pengingat</span>
              </button>

              <button
                onClick={() => setCurrentTab('print')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'print'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Jadwal Resmi</span>
              </button>

            </>
          ) : (
            /* REGULAR WALI ASUH (STAFF) TABS - TUKAR SHIF DISEMBUNYIKAN */
            <>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard Hari Ini</span>
              </button>

              <button
                onClick={() => setCurrentTab('matrix')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'matrix'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Matriks Roster 31 Hari</span>
              </button>

              <button
                onClick={() => setCurrentTab('personal')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'personal'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Jadwal Personal ({selectedStaff?.name.split(' ')[0]})</span>
              </button>

              <button
                onClick={() => setCurrentTab('handover')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'handover'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Laporan Serah Terima Shift</span>
              </button>

              <button
                onClick={() => setCurrentTab('notifications')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'notifications'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Notifikasi & Pengingat</span>
              </button>

              <button
                onClick={() => setCurrentTab('print')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  currentTab === 'print'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Jadwal Resmi</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
