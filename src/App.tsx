/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MonthSchedule, Staff, ShiftCode, DailyTask, StudentMedicalPlan } from './types';
import { 
  INITIAL_STAFF_LIST, 
  getInitialAugust2026Days, 
  SEPTEMBER_2026_STAFF_LIST,
  getInitialSeptember2026Days,
  distributeSeptemberMorningShifts,
  distributeSeptemberSoreShifts,
  distributeAllScheduleShifts,
  SHIFT_DEFINITIONS,
  SHIFT_TASKS_TEMPLATE
} from './data/initialSchedule';
import { getActiveShiftsAtTime, INDONESIAN_MONTH_NAMES, generateNextMonthScheduleFromPrior } from './utils/scheduler';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { TodayDashboard } from './components/TodayDashboard';
import { ScheduleMatrix } from './components/ScheduleMatrix';
import { PersonalSchedule } from './components/PersonalSchedule';
import { AutoSchedulerView } from './components/AutoSchedulerView';
import { NotificationSettings } from './components/NotificationSettings';
import { PrintReportModal } from './components/PrintReportModal';
import { HandoverReportView } from './components/HandoverReportView';
import { AdminShiftSwapView } from './components/AdminShiftSwapView';
import { AdminChecklistConfigView } from './components/AdminChecklistConfigView';
import { StudentMedicalView } from './components/StudentMedicalView';
import { AssignmentReminderView } from './components/AssignmentReminderView';
import { MedicalNotificationsModal } from './components/MedicalNotificationsModal';
import { StudentPortfolioView } from './components/StudentPortfolioView';
import { LoginPage } from './components/LoginPage';
import { SplashScreen } from './components/SplashScreen';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { 
  isSupabaseConfigured, 
  saveScheduleToSupabase, 
  fetchScheduleFromSupabase 
} from './utils/supabaseService';
import { AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  subscribeToSchedule, 
  saveScheduleToFirestore, 
  fetchScheduleFromFirestore,
  subscribeToSopTasks,
  saveSopTasksToFirestore,
  fetchSopTasksFromFirestore,
  isFirestoreOfflineOrQuotaExhausted,
  resetQuotaExhausted,
  subscribeQuotaStatus,
  subscribeToStudentMedicalPlans,
  fetchStudentMedicalPlansFromFirestore,
  saveStudentMedicalPlanToFirestore,
  deleteStudentMedicalPlanFromFirestore,
  saveAllStudentMedicalPlansToFirestore,
  getLocalStudentMedicalPlans,
  db,
  FIREBASE_DB_NAME
} from './utils/firebaseService';

function resolveScheduleDays(
  rawDays: Record<number, Record<number, ShiftCode>>,
  _year: number,
  _month: number,
  staffList: Staff[]
): Record<number, Record<number, ShiftCode>> {
  // Preserve all individual shift assignments exactly as saved.
  // Never re-shuffle or re-distribute other staff's shifts when a change is made.
  let modified = false;
  const result: Record<number, Record<number, ShiftCode>> = {};
  const staffMap = new Map<number, Staff>();
  (staffList || []).forEach((s) => staffMap.set(s.id, s));

  for (const dayStr in rawDays) {
    const day = Number(dayStr);
    result[day] = { ...rawDays[day] };
    const dateObj = new Date(_year, _month - 1, day);
    const isMonday = dateObj.getDay() === 1;

    for (const staffIdStr in result[day]) {
      const staffId = Number(staffIdStr);
      const val = result[day][staffId];
      // Only normalize old legacy shorthand codes ('P', 'S', 'M')
      // Strictly NEVER touch explicit user shift assignments (P1, P2, P3, S2A, S3A, S4A, M1, M2, LP, O, C)
      if (val === 'P') {
        result[day][staffId] = isMonday ? 'P3' : 'P1';
        modified = true;
      } else if (val === 'S' || (val as unknown as string) === 'S2B') {
        result[day][staffId] = 'S2A';
        modified = true;
      } else if ((val as unknown as string) === 'S3B') {
        result[day][staffId] = 'S3A';
        modified = true;
      } else if (val === 'M') {
        const staff = staffMap.get(staffId);
        const isFemale =
          staff?.gender === 'P' ||
          staff?.group?.toLowerCase().includes('perempuan') ||
          (staff?.code && staff.code.startsWith('P') && Number(staff.code.replace('P', '')) >= 1 && Number(staff.code.replace('P', '')) <= 20);
        result[day][staffId] = isFemale ? 'M2' : 'M1';
        modified = true;
      }
    }
  }
  return modified ? result : rawDays;
}

function getInitialScheduleForMonth(year: number, month: number): MonthSchedule {
  try {
    const saved = localStorage.getItem(`wali_asuh_schedule_v15_${year}_${month}`) ||
                  localStorage.getItem(`wali_asuh_schedule_v14_${year}_${month}`) ||
                  localStorage.getItem(`wali_asuh_schedule_v13_${year}_${month}`) || 
                  localStorage.getItem(`wali_asuh_schedule_v12_${year}_${month}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.staffList && parsed.staffList.length > 0 && parsed.days) {
        parsed.days = resolveScheduleDays(parsed.days, year, month, parsed.staffList);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved schedule:', e);
  }

  if (year === 2026 && month === 8) {
    return {
      year: 2026,
      month: 8,
      monthName: 'Agustus',
      totalDays: 31,
      staffList: INITIAL_STAFF_LIST,
      days: getInitialAugust2026Days(),
    };
  }

  // Official Baseline September 2026
  const septSchedule: MonthSchedule = {
    year: 2026,
    month: 9,
    monthName: 'September',
    totalDays: 30,
    staffList: SEPTEMBER_2026_STAFF_LIST,
    days: getInitialSeptember2026Days(),
  };

  if (year === 2026 && month === 9) {
    return septSchedule;
  }

  // If another month is requested (e.g. Oktober 2026) and not yet stored, generate dynamically
  return generateNextMonthScheduleFromPrior(septSchedule, year, month, 'continuation');
}

export default function App() {
  // Splash screen state (shown on initial launch, or manually triggered via logo / button)
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Authentication state (User: waliasuh/admin)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const local = localStorage.getItem('sr_auth_session');
      const session = sessionStorage.getItem('sr_auth_session');
      return Boolean(local || session);
    } catch {
      return false;
    }
  });

  // User role state ('admin' or 'staff')
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'staff'>(() => {
    try {
      const local = localStorage.getItem('sr_auth_session');
      const session = sessionStorage.getItem('sr_auth_session');
      const raw = local || session;
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.role === 'admin' ? 'admin' : 'staff';
      }
    } catch {}
    return 'staff';
  });

  // Dark mode state with localStorage persistence
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme_dark');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sound_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Active view tab (defaults to admin swap view if admin, or dashboard if staff)
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'matrix' | 'personal' | 'admin' | 'auto' | 'notifications' | 'print' | 'handover' | 'sop' | 'medical' | 'assignment' | 'portfolio'
  >(() => {
    try {
      const local = localStorage.getItem('sr_auth_session');
      const session = sessionStorage.getItem('sr_auth_session');
      const raw = local || session;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role === 'admin') return 'admin';
      }
    } catch {}
    return 'dashboard';
  });

  // Safeguard: redirect regular staff away from admin-only tabs
  useEffect(() => {
    if (currentUserRole !== 'admin' && (currentTab === 'admin' || currentTab === 'auto' || currentTab === 'sop')) {
      setCurrentTab('dashboard');
    }
  }, [currentUserRole, currentTab]);

  // Student medical plans state (persisted in Firestore & localStorage)
  const [medicalPlans, setMedicalPlans] = useState<StudentMedicalPlan[]>(() => {
    return getLocalStudentMedicalPlans();
  });
  const [isMedicalNotificationsOpen, setIsMedicalNotificationsOpen] = useState(false);

  // Cross-device sync: fetch directly and subscribe in realtime
  useEffect(() => {
    // 1. One-time direct fetch to guarantee latest cloud plans immediately
    fetchStudentMedicalPlansFromFirestore().then((remotePlans) => {
      if (remotePlans && remotePlans.length > 0) {
        setMedicalPlans(remotePlans);
      }
    }).catch(() => {});

    // 2. Realtime listener for live updates across all devices
    const unsubscribe = subscribeToStudentMedicalPlans(
      (remotePlans) => {
        if (remotePlans && remotePlans.length > 0) {
          setMedicalPlans(remotePlans);
          try {
            localStorage.setItem('wali_asuh_student_medical_plans_v1', JSON.stringify(remotePlans));
          } catch {}
        }
      },
      (err) => {
        console.warn('Medical plans subscription fallback to local cache:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSaveMedicalPlan = useCallback(async (plan: StudentMedicalPlan): Promise<boolean> => {
    // Optimistic local state update
    setMedicalPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id);
      const updated = idx >= 0 ? prev.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...prev];
      try {
        localStorage.setItem('wali_asuh_student_medical_plans_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const ok = await saveStudentMedicalPlanToFirestore(plan);
      if (ok) {
        soundManager.playChime();
      }
      return ok;
    } catch (e) {
      console.warn('Failed to sync saved plan to Firestore:', e);
      return false;
    }
  }, []);

  const handleDeleteMedicalPlan = useCallback(async (planId: string): Promise<boolean> => {
    // Optimistic local state update
    setMedicalPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      try {
        localStorage.setItem('wali_asuh_student_medical_plans_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      const ok = await deleteStudentMedicalPlanFromFirestore(planId);
      if (ok) {
        soundManager.playChime();
      }
      return ok;
    } catch (e) {
      console.warn('Failed to sync deleted plan to Firestore:', e);
      return false;
    }
  }, []);

  const handleMarkMedicalPlanCompleted = useCallback(async (planId: string) => {
    let planToSave: StudentMedicalPlan | null = null;
    setMedicalPlans((prev) => {
      const updated = prev.map((p) => {
        if (p.id === planId) {
          planToSave = { ...p, status: 'selesai' as const };
          return planToSave;
        }
        return p;
      });
      try {
        localStorage.setItem('wali_asuh_student_medical_plans_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (planToSave) {
      saveStudentMedicalPlanToFirestore(planToSave).catch(console.error);
    }
  }, []);

  const handleRefreshMedicalPlansFromServer = useCallback(async (): Promise<{ success: boolean; count: number; plans: StudentMedicalPlan[] }> => {
    try {
      if (isFirestoreOfflineOrQuotaExhausted()) {
        await resetQuotaExhausted();
      }
      const latest = await fetchStudentMedicalPlansFromFirestore();
      if (latest !== null) {
        setMedicalPlans(latest);
        try {
          localStorage.setItem('wali_asuh_student_medical_plans_v1', JSON.stringify(latest));
        } catch {}
        soundManager.playChime();
        return { success: true, count: latest.length, plans: latest };
      }
      return { success: false, count: 0, plans: [] };
    } catch (err) {
      console.warn('Failed to manually sync medical plans:', err);
      throw err;
    }
  }, []);

  // Customizable SOP checklist tasks state (persisted in Firestore & localStorage)
  const [sopTasks, setSopTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('wali_asuh_sop_tasks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return SHIFT_TASKS_TEMPLATE;
  });

  // Realtime subscription to SOP checklist tasks from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToSopTasks(
      (remoteTasks) => {
        if (remoteTasks && remoteTasks.length > 0) {
          setSopTasks(remoteTasks);
          try {
            localStorage.setItem('wali_asuh_sop_tasks_v1', JSON.stringify(remoteTasks));
          } catch {}
        }
      },
      (err) => {
        console.warn('SOP tasks subscription fallback to local cache:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handler to save SOP tasks to Firestore
  const handleSaveSopTasks = useCallback(async (updatedTasks: DailyTask[]) => {
    setSopTasks(updatedTasks);
    try {
      localStorage.setItem('wali_asuh_sop_tasks_v1', JSON.stringify(updatedTasks));
    } catch {}
    await saveSopTasksToFirestore(updatedTasks, 'Admin');
  }, []);

  // Handler to reset SOP tasks to default template
  const handleResetSopTasks = useCallback(async () => {
    setSopTasks(SHIFT_TASKS_TEMPLATE);
    try {
      localStorage.setItem('wali_asuh_sop_tasks_v1', JSON.stringify(SHIFT_TASKS_TEMPLATE));
    } catch {}
    await saveSopTasksToFirestore(SHIFT_TASKS_TEMPLATE, 'Admin Reset');
  }, []);

  // Selected month state (defaults to September 2026 since user just added September)
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number; monthName: string }>(() => {
    try {
      const saved = localStorage.getItem('active_schedule_month');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.year && parsed.month) return parsed;
      }
    } catch {}
    return { year: 2026, month: 9, monthName: 'September' };
  });

  // Cloud database status
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('syncing');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshToast, setRefreshToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const isCloudSyncedRef = React.useRef<boolean>(false);
  const isIncomingRemoteUpdateRef = React.useRef<boolean>(false);
  const lastSyncedScheduleHashRef = React.useRef<string>('');
  const currentUserRoleRef = React.useRef<string>(currentUserRole);

  useEffect(() => {
    currentUserRoleRef.current = currentUserRole;
  }, [currentUserRole]);

  // Schedule state
  const [schedule, setSchedule] = useState<MonthSchedule>(() => {
    return getInitialScheduleForMonth(selectedMonth.year, selectedMonth.month);
  });

  // Current staff list derived from schedule
  const staffList = schedule.staffList || (schedule.month === 9 ? SEPTEMBER_2026_STAFF_LIST : INITIAL_STAFF_LIST);

  // Selected staff profile
  const [selectedStaffId, setSelectedStaffId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('active_staff_id');
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  });

  // Active selected day in schedule
  const [activeDay, setActiveDay] = useState<number>(() => {
    const now = new Date();
    const day = now.getDate();
    return day >= 1 && day <= 30 ? day : 1;
  });

  // Real-time Cloud Firestore subscription for the active month
  useEffect(() => {
    // Listen to quota exhaustion events
    const unsubQuota = subscribeQuotaStatus((exhausted) => {
      if (exhausted) {
        setCloudStatus('offline');
      }
    });

    if (isFirestoreOfflineOrQuotaExhausted()) {
      setCloudStatus('offline');
      return () => unsubQuota();
    }

    setCloudStatus('syncing');
    const unsubscribe = subscribeToSchedule(
      selectedMonth.year,
      selectedMonth.month,
      (cloudData) => {
        if (cloudData && cloudData.days && Object.keys(cloudData.days).length > 0) {
          isIncomingRemoteUpdateRef.current = true;
          lastSyncedScheduleHashRef.current = JSON.stringify(cloudData.days);
          setSchedule((prev) => {
            const resolvedDays = resolveScheduleDays(
              cloudData.days,
              cloudData.year,
              cloudData.month,
              prev.staffList
            );
            return {
              ...prev,
              year: cloudData.year,
              month: cloudData.month,
              totalDays: cloudData.totalDays || prev.totalDays,
              days: resolvedDays,
            };
          });
          setCloudStatus('connected');
          isCloudSyncedRef.current = true;
        } else {
          // If cloud collection has no data, only write baseline once if not offline or quota exhausted
          if (!isCloudSyncedRef.current && !isFirestoreOfflineOrQuotaExhausted()) {
            saveScheduleToFirestore(schedule, 'Inisialisasi Database')
              .then((ok) => {
                if (ok) {
                  setCloudStatus('connected');
                  isCloudSyncedRef.current = true;
                  lastSyncedScheduleHashRef.current = JSON.stringify(schedule.days);
                } else {
                  setCloudStatus('offline');
                }
              })
              .catch(() => {
                setCloudStatus('offline');
              });
          } else {
            setCloudStatus('offline');
          }
        }
      },
      (err) => {
        console.warn('Firestore subscription failed, falling back to local cache:', err);
        setCloudStatus('offline');
      }
    );

    return () => {
      unsubscribe();
      unsubQuota();
    };
  }, [selectedMonth.year, selectedMonth.month]);

  // Handler to switch month without losing data
  const handleSelectMonth = useCallback((year: number, month: number) => {
    const monthName = INDONESIAN_MONTH_NAMES[month - 1] || 'Bulan';
    const newMonthObj = { year, month, monthName };
    setSelectedMonth(newMonthObj);
    localStorage.setItem('active_schedule_month', JSON.stringify(newMonthObj));

    const newSchedule = getInitialScheduleForMonth(year, month);
    setSchedule(newSchedule);

    // Adjust active day if it exceeds total days of new month
    setActiveDay((prev) => Math.min(prev, newSchedule.totalDays));

    // Ensure selected staff exists in new month's staff list
    const newStaffList = newSchedule.staffList;
    setSelectedStaffId((prevId) => {
      const exists = newStaffList.some((s) => s.id === prevId);
      return exists ? prevId : newStaffList[0]?.id || 1;
    });

    soundManager.playChime();
  }, []);

  // Save schedule to localStorage and Cloud Firestore on change
  useEffect(() => {
    try {
      localStorage.setItem(`wali_asuh_schedule_v15_${schedule.year}_${schedule.month}`, JSON.stringify(schedule));
      localStorage.setItem(`wali_asuh_schedule_v14_${schedule.year}_${schedule.month}`, JSON.stringify(schedule));
      localStorage.setItem(`wali_asuh_schedule_v13_${schedule.year}_${schedule.month}`, JSON.stringify(schedule));
    } catch (e) {
      console.warn('Failed to save schedule:', e);
    }

    if (isIncomingRemoteUpdateRef.current) {
      // Incoming update arrived from Firestore real-time listener; do not echo back to cloud!
      isIncomingRemoteUpdateRef.current = false;
      return;
    }

    const currentHash = JSON.stringify(schedule.days);
    // Only upload to Firestore if the schedule data actually changed
    if (currentHash === lastSyncedScheduleHashRef.current) {
      return;
    }

    // Skip cloud write if offline or quota exhausted to prevent network retry spam
    if (isFirestoreOfflineOrQuotaExhausted()) {
      setCloudStatus('offline');
      return;
    }

    if (isCloudSyncedRef.current) {
      setCloudStatus('syncing');
      const timer = setTimeout(() => {
        const updaterName = currentUserRoleRef.current === 'admin' ? 'Administrator SRT 1' : 'Wali Asuh';
        
        // Parallel sync to Supabase if configured
        if (isSupabaseConfigured()) {
          saveScheduleToSupabase(schedule, updaterName).catch(() => {});
        }

        saveScheduleToFirestore(schedule, updaterName)
          .then((ok) => {
            if (ok) {
              lastSyncedScheduleHashRef.current = currentHash;
              setCloudStatus('connected');
            } else {
              setCloudStatus('offline');
            }
          })
          .catch((err) => {
            console.error('Failed to sync schedule to cloud:', err);
            setCloudStatus('offline');
          });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [schedule]);

  // Manual Force Sync handler (Push to server)
  const handleForceSyncToCloud = useCallback(async () => {
    try {
      setCloudStatus('syncing');
      if (isFirestoreOfflineOrQuotaExhausted()) {
        const reconnected = await resetQuotaExhausted();
        if (!reconnected) {
          setCloudStatus('offline');
          setRefreshToast({
            message: 'Mode Offline Aktif (Batas kuota harian cloud tercapai). Seluruh data aman tersimpan di perangkat.',
            type: 'info'
          });
          return;
        }
      }
      if (isSupabaseConfigured()) {
        await saveScheduleToSupabase(schedule, 'Sinkronisasi Manual');
      }
      const ok = await saveScheduleToFirestore(schedule, 'Sinkronisasi Manual');
      if (ok) {
        setCloudStatus('connected');
        soundManager.playChime();
        setRefreshToast({ message: 'Data jadwal berhasil disinkronkan ke server!', type: 'success' });
      } else {
        setCloudStatus('offline');
        setRefreshToast({ 
          message: 'Mode Offline: Data aman tersimpan di penyimpanan lokal perangkat.', 
          type: 'info' 
        });
      }
    } catch {
      setCloudStatus('error');
      setRefreshToast({ message: 'Gagal menyinkronkan data ke server.', type: 'error' });
    } finally {
      setTimeout(() => setRefreshToast(null), 3500);
    }
  }, [schedule]);

  // Direct Fetch handler (Pull latest data from server)
  const handleRefreshDataFromServer = useCallback(async () => {
    setIsRefreshing(true);
    setCloudStatus('syncing');
    try {
      if (isFirestoreOfflineOrQuotaExhausted()) {
        await resetQuotaExhausted();
      }
      let cloudData = await fetchScheduleFromFirestore(selectedMonth.year, selectedMonth.month);
      if ((!cloudData || !cloudData.days || Object.keys(cloudData.days).length === 0) && isSupabaseConfigured()) {
        const supabaseData = await fetchScheduleFromSupabase(selectedMonth.year, selectedMonth.month);
        if (supabaseData && supabaseData.days && Object.keys(supabaseData.days).length > 0) {
          cloudData = supabaseData;
        }
      }
      if (cloudData && cloudData.days && Object.keys(cloudData.days).length > 0) {
        isIncomingRemoteUpdateRef.current = true;
        const resolvedDays = resolveScheduleDays(
          cloudData.days,
          cloudData.year,
          cloudData.month,
          schedule.staffList
        );
        setSchedule((prev) => ({
          ...prev,
          year: cloudData.year,
          month: cloudData.month,
          totalDays: cloudData.totalDays || prev.totalDays,
          days: resolvedDays,
        }));
        try {
          localStorage.setItem(
            `wali_asuh_schedule_v13_${cloudData.year}_${cloudData.month}`,
            JSON.stringify({
              ...schedule,
              year: cloudData.year,
              month: cloudData.month,
              days: resolvedDays,
            })
          );
        } catch {}
        setCloudStatus('connected');
        soundManager.playChime();
        setRefreshToast({ message: 'Data terbaru berhasil diambil dari server!', type: 'success' });
      } else {
        if (!isFirestoreOfflineOrQuotaExhausted()) {
          const ok = await saveScheduleToFirestore(schedule, 'Inisialisasi Sinkronisasi');
          if (ok) setCloudStatus('connected');
          else setCloudStatus('offline');
        } else {
          setCloudStatus('offline');
        }
        soundManager.playChime();
        setRefreshToast({ message: 'Mode Offline: Menggunakan data lokal perangkat.', type: 'info' });
      }

      // Also refresh SOP checklist tasks from server
      try {
        const latestSop = await fetchSopTasksFromFirestore();
        if (latestSop && latestSop.length > 0) {
          setSopTasks(latestSop);
          try {
            localStorage.setItem('wali_asuh_sop_tasks_v1', JSON.stringify(latestSop));
          } catch {}
        }
      } catch (sopErr) {
        console.warn('Could not refresh SOP tasks during manual fetch:', sopErr);
      }

      // Also refresh Student Medical Plans from server
      try {
        const latestPlans = await fetchStudentMedicalPlansFromFirestore();
        if (latestPlans && latestPlans.length > 0) {
          setMedicalPlans(latestPlans);
        }
      } catch (medErr) {
        console.warn('Could not refresh medical plans during manual fetch:', medErr);
      }
    } catch (err) {
      console.error('Error fetching schedule from server:', err);
      setCloudStatus('offline');
      setRefreshToast({ message: 'Data dimuat dari penyimpanan lokal perangkat.', type: 'info' });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
      setTimeout(() => setRefreshToast(null), 3500);
    }
  }, [selectedMonth.year, selectedMonth.month, schedule]);

  // Ensure any legacy 'P', 'S', 'M', or Monday morning codes are mapped strictly 1-to-1 without re-shuffling any other staff
  useEffect(() => {
    let hasLegacy = false;
    for (const day in schedule.days) {
      const dateObj = new Date(schedule.year, schedule.month - 1, Number(day));
      const isMonday = dateObj.getDay() === 1;
      for (const staffId in schedule.days[day]) {
        const val = schedule.days[day][staffId];
        if (
          val === 'P' ||
          val === 'S' ||
          val === 'M' ||
          (val as unknown as string) === 'S2B' ||
          (val as unknown as string) === 'S3B'
        ) {
          hasLegacy = true;
          break;
        }
      }
      if (hasLegacy) break;
    }

    if (hasLegacy) {
      const updatedDays = resolveScheduleDays(
        schedule.days,
        schedule.year,
        schedule.month,
        schedule.staffList
      );
      setSchedule((prev) => ({
        ...prev,
        days: updatedDays,
      }));
    }
  }, [schedule.days, schedule.year, schedule.month, schedule.staffList]);

  // Sync dark mode class with HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme_dark', JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  // Sync active staff to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('active_staff_id', String(selectedStaffId));
    } catch {}
  }, [selectedStaffId]);

  // Sync sound setting
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    try {
      localStorage.setItem('sound_enabled', JSON.stringify(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Compute active shift text for the navbar
  const [activeShiftTitle, setActiveShiftTitle] = useState<string>('Shif Aktif');
  useEffect(() => {
    const updateActiveShift = () => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const activeCodes = getActiveShiftsAtTime(timeStr);
      if (activeCodes.includes('M')) {
        setActiveShiftTitle('🌙 Shif Malam Aktif');
      } else if (activeCodes.includes('S')) {
        setActiveShiftTitle('🌅 Shif Sore Aktif');
      } else if (activeCodes.includes('P') || activeCodes.includes('P2') || activeCodes.includes('P3')) {
        setActiveShiftTitle('☀️ Shif Pagi Aktif');
      } else {
        setActiveShiftTitle('Standby Operasional');
      }
    };
    updateActiveShift();
    const interval = setInterval(updateActiveShift, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Login Success
  const handleLoginSuccess = (role: 'admin' | 'staff') => {
    setIsAuthenticated(true);
    setCurrentUserRole(role);
    if (role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  // Handle Logout
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('sr_auth_session');
      sessionStorage.removeItem('sr_auth_session');
    } catch {}
    setIsAuthenticated(false);
    setCurrentUserRole('staff');
    setCurrentTab('dashboard');
  }, []);

  return (
    <>
      {/* Native-style Mobile & Web Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen 
            onFinish={() => setShowSplash(false)} 
            minDuration={2400}
          />
        )}
      </AnimatePresence>

      {/* Gated: Show Login Page if not authenticated */}
      {!isAuthenticated ? (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onShowSplash={() => setShowSplash(true)}
        />
      ) : (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-blue-500 selection:text-white">
          {/* Header & Main Navigation */}
          <Navbar
            userRole={currentUserRole}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            setSelectedStaffId={setSelectedStaffId}
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            activeShiftTitle={activeShiftTitle}
            onLogout={handleLogout}
            cloudStatus={cloudStatus}
            onForceSyncToCloud={handleForceSyncToCloud}
            onShowSplash={() => setShowSplash(true)}
            isRefreshing={isRefreshing}
            onRefreshServer={handleRefreshDataFromServer}
            medicalNotificationCount={(() => {
              const padTwo = (n: number) => String(n).padStart(2, '0');
              const activeTodayKey = `${schedule.year}-${padTwo(schedule.month)}-${padTwo(activeDay)}`;
              const nextDayNum = activeDay < schedule.totalDays ? activeDay + 1 : 1;
              const activeTomorrowKey = `${schedule.year}-${padTwo(schedule.month)}-${padTwo(nextDayNum)}`;
              
              const now = new Date();
              const realTodayStr = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`;
              const realTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              const realTomorrowStr = `${realTomorrow.getFullYear()}-${padTwo(realTomorrow.getMonth() + 1)}-${padTwo(realTomorrow.getDate())}`;

              return medicalPlans.filter(
                (p) => p.status === 'rencana' && (
                  p.date === activeTodayKey || 
                  p.date === activeTomorrowKey ||
                  p.date === realTodayStr ||
                  p.date === realTomorrowStr
                )
              ).length;
            })()}
            onOpenMedicalNotifications={() => setIsMedicalNotificationsOpen(true)}
          />

          {/* Floating Cloud Refresh Toast Notification */}
          {refreshToast && (
            <div 
              role="status"
              aria-live="polite"
              className="fixed top-12 sm:top-14 right-3 sm:right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none"
            >
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
                refreshToast.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700 shadow-emerald-950/40'
                  : refreshToast.type === 'error'
                  ? 'bg-rose-950/90 text-rose-200 border-rose-700 shadow-rose-950/40'
                  : 'bg-blue-950/90 text-blue-200 border-blue-700 shadow-blue-950/40'
              }`}>
                {refreshToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {refreshToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                {refreshToast.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />}
                <span>{refreshToast.message}</span>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-[1680px] mx-auto px-2 sm:px-4 py-2 sm:py-3 space-y-2.5">
            {currentTab === 'dashboard' && (
              <TodayDashboard
                schedule={schedule}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                onNavigateToTab={(tab) => setCurrentTab(tab as any)}
                sopTasks={sopTasks}
                userRole={currentUserRole}
                medicalPlans={medicalPlans}
                onOpenMedicalModal={() => setIsMedicalNotificationsOpen(true)}
              />
            )}

            {currentTab === 'matrix' && (
              <ScheduleMatrix
                userRole={currentUserRole}
                schedule={schedule}
                setSchedule={setSchedule}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                onOpenPrint={() => setCurrentTab('print')}
                onOpenAuto={() => setCurrentTab('auto')}
                onOpenAdminSwap={() => setCurrentTab('admin')}
              />
            )}

            {currentTab === 'personal' && (
              <PersonalSchedule
                schedule={schedule}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                setSelectedStaffId={setSelectedStaffId}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                onNavigateToTab={(tab) => setCurrentTab(tab as any)}
                sopTasks={sopTasks}
              />
            )}

            {currentTab === 'medical' && (
              <StudentMedicalView
                plans={medicalPlans}
                onSavePlan={handleSaveMedicalPlan}
                onDeletePlan={handleDeleteMedicalPlan}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                cloudStatus={cloudStatus}
                onRefreshFromServer={handleRefreshMedicalPlansFromServer}
                scheduleYear={schedule.year}
                scheduleMonth={schedule.month}
                activeScheduleDay={activeDay}
              />
            )}

            {currentTab === 'admin' && currentUserRole === 'admin' && (
              <AdminShiftSwapView
                schedule={schedule}
                setSchedule={setSchedule}
                staffList={staffList}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                onNavigateToMatrix={() => setCurrentTab('matrix')}
                onNavigateToDashboard={() => setCurrentTab('dashboard')}
              />
            )}

            {currentTab === 'sop' && currentUserRole === 'admin' && (
              <AdminChecklistConfigView
                tasks={sopTasks}
                onSaveTasks={handleSaveSopTasks}
                onResetToDefault={handleResetSopTasks}
                onNavigateToDashboard={() => setCurrentTab('dashboard')}
                cloudStatus={cloudStatus}
              />
            )}

            {currentTab === 'auto' && (
              <AutoSchedulerView
                schedule={schedule}
                setSchedule={setSchedule}
                staffList={staffList}
                onNavigateToMatrix={() => setCurrentTab('matrix')}
                onSelectMonth={handleSelectMonth}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationSettings
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                onShowSplash={() => setShowSplash(true)}
              />
            )}

            {currentTab === 'print' && (
              <PrintReportModal
                schedule={schedule}
                staffList={staffList}
                onClose={() => setCurrentTab('matrix')}
              />
            )}

            {currentTab === 'handover' && (
              <HandoverReportView
                schedule={schedule}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
              />
            )}

            {currentTab === 'assignment' && (
              <AssignmentReminderView
                schedule={schedule}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                onNavigateToTab={(tab) => setCurrentTab(tab as any)}
              />
            )}

            {currentTab === 'portfolio' && (
              <StudentPortfolioView
                medicalPlans={medicalPlans}
                staffList={staffList}
                selectedStaffId={selectedStaffId}
                onNavigateToTab={(tab) => setCurrentTab(tab as any)}
                onOpenNewMedicalPlanForStudent={(name, cls) => {
                  setCurrentTab('medical');
                }}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 px-4 text-center text-[11px] text-slate-500 dark:text-slate-400 print:hidden">
            <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <span>
                © 2026 <strong>SRT 1 Kab Kediri</strong> • Kementerian Sosial RI
              </span>
              <span className="text-[10px] text-slate-400">
                Sistem Otomasi Shif & Notifikasi Tugas Wali Asuh
              </span>
            </div>
          </footer>

          {/* PWA Floating Install Banner at the bottom */}
          <PWAInstallBanner />

          {/* Modal Pop-up Notifikasi Rencana Berobat Siswa (UKS, Puskesmas, RS) */}
          <MedicalNotificationsModal
            isOpen={isMedicalNotificationsOpen}
            onClose={() => setIsMedicalNotificationsOpen(false)}
            plans={medicalPlans}
            referenceDate={`${schedule.year}-${String(schedule.month).padStart(2, '0')}-${String(activeDay).padStart(2, '0')}`}
            onOpenFullMedicalView={() => {
              setIsMedicalNotificationsOpen(false);
              setCurrentTab('medical');
            }}
            onMarkPlanCompleted={handleMarkMedicalPlanCompleted}
          />
        </div>
      )}
    </>
  );
}
