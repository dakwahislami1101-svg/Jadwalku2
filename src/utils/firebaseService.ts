import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection,
  getDocs,
  getDocsFromServer,
  getDocFromServer,
  onSnapshot, 
  Firestore,
  Unsubscribe,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { MonthSchedule, ShiftCode, ShiftSwapRecord, HandoverReport, DailyTask, AnnouncementData, StudentMedicalPlan, StudentPortfolioNote, Student } from '../types';

// Set Firebase Firestore log level to silent to suppress internal connection retry messages in offline/iframe environments
setLogLevel('silent');

// Initialize Firebase App
const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Optional Firebase Auth instance
export const auth: Auth = getAuth(app);

// Initialize Firestore with robust auto-detect long polling and multi-tab local cache
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfigJson.firestoreDatabaseId || undefined
  );
} catch {
  dbInstance = firebaseConfigJson.firestoreDatabaseId 
    ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
    : getFirestore(app);
}

export const db: Firestore = dbInstance;

export const FIREBASE_DB_NAME = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const FIREBASE_PROJECT_ID = firebaseConfigJson.projectId;

// ==================== FIRESTORE ERROR HANDLING ====================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  if (errCode === 'resource-exhausted' || errMessage.includes('Quota limit exceeded')) {
    markQuotaExhausted();
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
  };

  // Only log if not a standard silent offline fallback
  if (errCode !== 'unavailable') {
    console.warn('[Firestore Diagnostic]', JSON.stringify(errInfo));
  }
}

// ==================== QUOTA & OFFLINE RESILIENCE ====================

const QUOTA_STORAGE_KEY = 'firestore_quota_exhausted_date';

function getTodayDateStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function checkIsQuotaExhausted(): boolean {
  try {
    const savedDate = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (!savedDate) return false;
    if (savedDate === getTodayDateStr()) {
      return true;
    } else {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      return false;
    }
  } catch {
    return false;
  }
}

let quotaExhaustedState: boolean = checkIsQuotaExhausted();
let networkDisabled: boolean = false;

// If quota was already exhausted today on startup, immediately disable network
if (quotaExhaustedState) {
  try {
    disableNetwork(db).then(() => {
      networkDisabled = true;
    }).catch(() => {});
  } catch {
    // Ignore
  }
}

type QuotaListener = (exhausted: boolean) => void;
const quotaListeners = new Set<QuotaListener>();

export function subscribeQuotaStatus(listener: QuotaListener): () => void {
  quotaListeners.add(listener);
  listener(quotaExhaustedState);
  return () => quotaListeners.delete(listener);
}

export function markQuotaExhausted(): void {
  if (!quotaExhaustedState) {
    console.warn('[Firestore] Kuota Firestore hari ini telah tercapai (20.000 unit penulisan/hari). Mengalihkan sistem ke mode offline lokal.');
  }
  quotaExhaustedState = true;
  try {
    localStorage.setItem(QUOTA_STORAGE_KEY, getTodayDateStr());
  } catch {}

  quotaListeners.forEach((fn) => {
    try { fn(true); } catch {}
  });

  if (!networkDisabled) {
    try {
      disableNetwork(db).then(() => {
        networkDisabled = true;
      }).catch(() => {});
    } catch {}
  }
}

export async function resetQuotaExhausted(): Promise<boolean> {
  quotaExhaustedState = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}

  quotaListeners.forEach((fn) => {
    try { fn(false); } catch {}
  });

  try {
    await enableNetwork(db);
    networkDisabled = false;
    return true;
  } catch (e) {
    console.warn('[Firestore] Gagal mengaktifkan kembali jaringan Firestore:', e);
    return false;
  }
}

export function isFirestoreOfflineOrQuotaExhausted(): boolean {
  return quotaExhaustedState || checkIsQuotaExhausted();
}

// ==================== SCHEDULES SYNC ====================

/**
 * Generate a standard doc ID for monthly schedule
 */
export const getScheduleDocId = (year: number, month: number) => `schedule_${year}_${String(month).padStart(2, '0')}`;

/**
 * One-time direct fetch of monthly schedule from Cloud Firestore
 */
export async function fetchScheduleFromFirestore(
  year: number,
  month: number
): Promise<{ year: number; month: number; totalDays?: number; days: Record<number, Record<number, ShiftCode>> } | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return null;
  }
  try {
    const docRef = doc(db, 'schedules', getScheduleDocId(year, month));
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        year: data.year,
        month: data.month,
        totalDays: data.totalDays,
        days: data.days || {},
      };
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return null;
    }
    if (err?.code === 'unavailable') {
      console.warn('[Firestore] Backend Firestore tidak dapat dihubungi saat mengambil jadwal.');
      return null;
    }
    console.warn('[Firestore] Failed to fetch schedule from server:', err);
    return null;
  }
}

/**
 * Realtime subscription to monthly schedule in Cloud Firestore
 */
export function subscribeToSchedule(
  year: number,
  month: number,
  onData: (schedule: { year: number; month: number; totalDays?: number; days: Record<number, Record<number, ShiftCode>> } | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    if (onError) onError(new Error('Firestore offline/quota-exceeded'));
    return () => {};
  }
  try {
    const docRef = doc(db, 'schedules', getScheduleDocId(year, month));
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onData({
            year: data.year,
            month: data.month,
            totalDays: data.totalDays,
            days: data.days || {},
          });
        } else {
          onData(null);
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        } else if (err?.code === 'unavailable') {
          console.warn('[Firestore] Koneksi backend offline, menggunakan data lokal.');
        } else {
          console.warn('[Firestore] Error subscribing to schedule:', err);
        }
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save / update monthly schedule in Cloud Firestore
 */
export async function saveScheduleToFirestore(
  schedule: MonthSchedule,
  updatedBy: string = 'Admin'
): Promise<boolean> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return false;
  }
  try {
    const docRef = doc(db, 'schedules', getScheduleDocId(schedule.year, schedule.month));
    await setDoc(
      docRef,
      {
        year: schedule.year,
        month: schedule.month,
        totalDays: schedule.totalDays,
        days: schedule.days,
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (err?.code === 'unavailable') {
      console.warn('[Firestore] Tidak dapat menjangkau server Firestore saat menyimpan jadwal.');
      return false;
    }
    console.error('[Firestore] Failed to save schedule:', err);
    return false;
  }
}

// ==================== SHIFT SWAP LOGS SYNC ====================

/**
 * Realtime subscription to admin swap records for a given month
 */
export function subscribeToSwapLogs(
  year: number,
  month: number,
  onData: (logs: ShiftSwapRecord[]) => void
): Unsubscribe {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'swap_logs_month', `swaps_${year}_${String(month).padStart(2, '0')}`);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onData(data.logs || []);
        } else {
          onData([]);
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        } else {
          console.warn('[Firestore] Error subscribing to swap logs:', err);
        }
      }
    );
  } catch (err) {
    return () => {};
  }
}

/**
 * Save swap logs to Firestore
 */
export async function saveSwapLogsToFirestore(
  year: number,
  month: number,
  logs: ShiftSwapRecord[]
): Promise<boolean> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return false;
  }
  try {
    const docRef = doc(db, 'swap_logs_month', `swaps_${year}_${String(month).padStart(2, '0')}`);
    await setDoc(
      docRef,
      {
        year,
        month,
        logs,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (err?.code === 'unavailable') {
      return false;
    }
    console.error('[Firestore] Failed to save swap logs:', err);
    return false;
  }
}

// ==================== HANDOVER REPORTS SYNC ====================

/**
 * Realtime subscription to handover reports
 */
export function subscribeToHandoverReports(
  onData: (reports: HandoverReport[]) => void
): Unsubscribe {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'handover_system', 'all_reports');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onData(data.reports || []);
        } else {
          onData([]);
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        } else {
          console.warn('[Firestore] Error subscribing to handover reports:', err);
        }
      }
    );
  } catch (err) {
    return () => {};
  }
}

/**
 * Save list of handover reports to Firestore
 */
export async function saveHandoverReportsToFirestore(
  reports: HandoverReport[]
): Promise<boolean> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return false;
  }
  try {
    const docRef = doc(db, 'handover_system', 'all_reports');
    await setDoc(
      docRef,
      {
        reports,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (err?.code === 'unavailable') {
      return false;
    }
    console.error('[Firestore] Failed to save handover reports:', err);
    return false;
  }
}

// ==================== DAILY TASKS SYNC ====================

/**
 * Subscribe to tasks completion for a specific date and staff
 */
export function subscribeToDailyTasks(
  dateKey: string,
  staffId: number,
  onData: (tasks: DailyTask[] | null) => void
): Unsubscribe {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'daily_tasks', `${dateKey}_staff_${staffId}`);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onData(data.tasks || null);
        } else {
          onData(null);
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        } else {
          console.warn('[Firestore] Error subscribing to tasks:', err);
        }
      }
    );
  } catch (err) {
    return () => {};
  }
}

/**
 * Save daily tasks completion to Firestore
 */
export async function saveDailyTasksToFirestore(
  dateKey: string,
  staffId: number,
  tasks: DailyTask[]
): Promise<boolean> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return false;
  }
  try {
    const docRef = doc(db, 'daily_tasks', `${dateKey}_staff_${staffId}`);
    await setDoc(
      docRef,
      {
        dateKey,
        staffId,
        tasks,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (err?.code === 'unavailable') {
      return false;
    }
    console.error('[Firestore] Failed to save daily tasks:', err);
    return false;
  }
}

// ==================== CUSTOM SOP CHECKLIST TASKS SYNC ====================

/**
 * Subscribe to customizable SOP checklist tasks
 */
export function subscribeToSopTasks(
  onData: (tasks: DailyTask[] | null) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    if (onError) onError(new Error('Firestore offline/quota-exceeded'));
    return () => {};
  }
  try {
    const docRef = doc(db, 'settings', 'checklist_sop');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.tasks)) {
            onData(data.tasks);
            return;
          }
        }
        onData(null);
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        } else {
          console.warn('[Firestore] Error subscribing to SOP checklist tasks:', err);
        }
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save custom SOP checklist tasks to Firestore
 */
export async function saveSopTasksToFirestore(
  tasks: DailyTask[],
  updatedBy: string = 'Admin'
): Promise<boolean> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return false;
  }
  try {
    const docRef = doc(db, 'settings', 'checklist_sop');
    await setDoc(
      docRef,
      {
        id: 'checklist_sop',
        tasks,
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
      { merge: true }
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    if (err?.code === 'unavailable') {
      return false;
    }
    console.error('[Firestore] Failed to save SOP checklist tasks:', err);
    return false;
  }
}

/**
 * One-time fetch of custom SOP checklist tasks from Firestore
 */
export async function fetchSopTasksFromFirestore(): Promise<DailyTask[] | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    return null;
  }
  try {
    const docRef = doc(db, 'settings', 'checklist_sop');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (Array.isArray(data.tasks)) {
        return data.tasks;
      }
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
    }
    console.warn('[Firestore] Failed to fetch SOP checklist tasks:', err);
    return null;
  }
}

// ==================== ANNOUNCEMENT TICKER SYNC ====================

export const DEFAULT_ANNOUNCEMENT: AnnouncementData = {
  text: '📢 Pengumuman: Shif Sore tidak dapat ditukar dengan Shif Malam (M), karena memiliki jam kerja yang sama & ketentuan operasional asrama.',
  enabled: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin',
};

const ANNOUNCEMENT_STORAGE_KEY = 'wali_asuh_announcement_ticker_v1';

export function getLocalAnnouncement(): AnnouncementData {
  try {
    const saved = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.text === 'string') {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_ANNOUNCEMENT;
}

export function subscribeToAnnouncement(
  onData: (data: AnnouncementData) => void
): Unsubscribe {
  // Emit local value immediately for instant zero-latency UI display
  onData(getLocalAnnouncement());

  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'settings', 'announcement_ticker');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const parsed: AnnouncementData = {
            text: typeof data.text === 'string' ? data.text : DEFAULT_ANNOUNCEMENT.text,
            enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
            updatedAt: data.updatedAt || new Date().toISOString(),
            updatedBy: data.updatedBy || 'Admin',
          };
          try {
            localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
          onData(parsed);
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        }
      }
    );
  } catch {
    return () => {};
  }
}

export async function saveAnnouncementToFirestore(
  announcement: Partial<AnnouncementData>,
  updaterName: string = 'Admin'
): Promise<boolean> {
  const current = getLocalAnnouncement();
  const updated: AnnouncementData = {
    ...current,
    ...announcement,
    updatedAt: new Date().toISOString(),
    updatedBy: updaterName,
  };

  try {
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) {
    return true;
  }

  try {
    const docRef = doc(db, 'settings', 'announcement_ticker');
    await setDoc(docRef, updated, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    console.warn('[Firestore] Failed to save announcement:', err);
    return false;
  }
}

// ==================== STUDENT MEDICAL PLANS (UKS / PUSKESMAS / RS) ====================

const MEDICAL_PLANS_STORAGE_KEY = 'wali_asuh_student_medical_plans_v1';

export function getInitialDefaultMedicalPlans(): StudentMedicalPlan[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = toDateStr(now);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = toDateStr(tomorrow);
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in3DaysStr = toDateStr(in3Days);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = toDateStr(yesterday);

  return [
    {
      id: 'med-plan-1',
      studentName: 'Mokhamad Yoga Abi Rama',
      studentClassOrRoom: 'SD 1-2 (Kamar Abu Bakar)',
      facility: 'Puskesmas',
      facilityDetail: 'Puskesmas Semen Kediri',
      date: tomorrowStr,
      time: '08:30',
      planType: 'kontrol_kembali',
      complaint: 'Kontrol luka jahitan siku pasca terjatuh saat olahraga & ganti perban steril',
      accompanyingStaffName: 'Miftahudin',
      accompanyingStaffId: 1,
      notes: 'Bawa kartu KIS/BPJS dan resep obat sebelumnya dari dokter',
      status: 'rencana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Wali Asuh Shif',
    },
    {
      id: 'med-plan-2',
      studentName: 'Azzura Fauziah',
      studentClassOrRoom: 'SD 1-2 (Asrama Putri Flamboyan)',
      facility: 'UKS',
      facilityDetail: 'Ruang UKS Asrama Utama',
      date: todayStr,
      time: '09:15',
      planType: 'berobat',
      complaint: 'Demam ringan 38.1°C, pusing dan badan lemas',
      accompanyingStaffName: 'Siti Masitoh',
      accompanyingStaffId: 21,
      notes: 'Sudah diberi kompres hangat, cek suhu berkala dan berikan paracetamol',
      status: 'rencana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Wali Asuh Shif Pagi',
    },
    {
      id: 'med-plan-3',
      studentName: 'Rashky Anugrah Afrilieo',
      studentClassOrRoom: 'VII-1 (Kamar Umar Bin Khattab)',
      facility: 'Rumah Sakit',
      facilityDetail: 'RSUD Gambiran Kota Kediri (Poli THT)',
      date: in3DaysStr,
      time: '09:00',
      planType: 'rujukan',
      complaint: 'Konsultasi dokter spesialis THT untuk pemeriksaan telinga berdenging pasca flu',
      accompanyingStaffName: 'Eko Wahyudi',
      accompanyingStaffId: 2,
      notes: 'Surat rujukan faskes tingkat 1 sudah siap di pos administrasi',
      status: 'rencana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Koordinator Kesehatan',
    },
    {
      id: 'med-plan-4',
      studentName: 'Adam Julian Shano',
      studentClassOrRoom: 'SD 1-2 (Kamar Ali Bin Abi Thalib)',
      facility: 'Puskesmas',
      facilityDetail: 'Puskesmas Semen',
      date: yesterdayStr,
      time: '10:00',
      planType: 'berobat',
      complaint: 'Batuk pilek & sakit tenggorokan',
      accompanyingStaffName: 'Ahmad Muzani',
      accompanyingStaffId: 3,
      notes: 'Pemeriksaan rutin dokter jaga puskesmas',
      status: 'selesai',
      actionResult: 'Diberikan antibiotik amoxicillin & sirup batuk, dianjurkan minum air hangat dan istirahat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Wali Asuh',
    },
  ];
}

export function getLocalStudentMedicalPlans(): StudentMedicalPlan[] {
  try {
    const saved = localStorage.getItem(MEDICAL_PLANS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}

  const defaults = getInitialDefaultMedicalPlans();
  try {
    localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

/**
 * Fetch all student medical plans directly from Cloud Firestore (bypassing stale cache)
 */
export async function fetchStudentMedicalPlansFromFirestore(): Promise<StudentMedicalPlan[] | null> {
  // If offline state was previously tripped, attempt to restore connection
  if (isFirestoreOfflineOrQuotaExhausted()) {
    try {
      await resetQuotaExhausted();
    } catch {}
  }

  try {
    const plansMap = new Map<string, StudentMedicalPlan>();

    // 1. Fetch from individual docs collection 'student_medical_plans' (prefer server to prevent stale cache)
    try {
      const colRef = collection(db, 'student_medical_plans');
      let snap;
      try {
        snap = await getDocsFromServer(colRef);
      } catch {
        snap = await getDocs(colRef);
      }
      snap.forEach((d) => {
        const data = d.data() as StudentMedicalPlan;
        if (data && data.id && data.studentName) {
          plansMap.set(data.id, { ...data, id: data.id });
        }
      });
    } catch (colErr: any) {
      if (colErr?.code === 'resource-exhausted' || colErr?.message?.includes('Quota limit exceeded')) {
        markQuotaExhausted();
        return null;
      }
      console.warn('[Firestore] Note reading student_medical_plans collection:', colErr);
    }

    // 2. Also check backward-compatible single document 'settings/student_medical_plans'
    try {
      const docRef = doc(db, 'settings', 'student_medical_plans');
      let docSnap;
      try {
        docSnap = await getDocFromServer(docRef);
      } catch {
        docSnap = await getDoc(docRef);
      }
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.plans)) {
          for (const p of data.plans) {
            if (p && p.id && !plansMap.has(p.id)) {
              plansMap.set(p.id, p);
              // Migrate to collection asynchronously
              setDoc(doc(db, 'student_medical_plans', p.id), p, { merge: true }).catch(() => {});
            }
          }
        }
      }
    } catch (docErr: any) {
      if (docErr?.code === 'resource-exhausted' || docErr?.message?.includes('Quota limit exceeded')) {
        markQuotaExhausted();
        return null;
      }
    }

    const plansList = Array.from(plansMap.values());
    try {
      localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(plansList));
    } catch {}
    return plansList;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return null;
    }
    console.warn('[Firestore] Error fetching student medical plans:', err);
    return null;
  }
}

/**
 * Realtime subscription to student medical plans across all devices
 */
export function subscribeToStudentMedicalPlans(
  onData: (plans: StudentMedicalPlan[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  // Emit local value immediately for instant UI responsiveness
  onData(getLocalStudentMedicalPlans());

  if (isFirestoreOfflineOrQuotaExhausted()) {
    // Attempt re-enable in case connection has recovered
    resetQuotaExhausted().catch(() => {});
  }

  // Direct server fetch to ensure zero staleness
  fetchStudentMedicalPlansFromFirestore().then((fetched) => {
    if (fetched) {
      onData(fetched);
    }
  }).catch(() => {});

  try {
    const colRef = collection(db, 'student_medical_plans');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const plans: StudentMedicalPlan[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as StudentMedicalPlan;
          if (data && data.id && data.studentName) {
            plans.push({ ...data, id: data.id });
          }
        });

        if (plans.length > 0) {
          try {
            localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(plans));
          } catch {}
          onData(plans);
          return;
        }

        // If snapshot is empty, also check legacy document
        const docRef = doc(db, 'settings', 'student_medical_plans');
        getDoc(docRef).then((dSnap) => {
          if (dSnap.exists()) {
            const data = dSnap.data();
            if (Array.isArray(data.plans) && data.plans.length > 0) {
              try {
                localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(data.plans));
              } catch {}
              onData(data.plans);
              // Migrate items to collection
              for (const p of data.plans) {
                if (p?.id) {
                  setDoc(doc(db, 'student_medical_plans', p.id), p, { merge: true }).catch(() => {});
                }
              }
              return;
            }
          }
          // If server confirmed empty collection
          if (!snapshot.metadata.fromCache) {
            onData([]);
          }
        }).catch(() => {
          if (!snapshot.metadata.fromCache) {
            onData([]);
          }
        });
      },
      (err) => {
        if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
          markQuotaExhausted();
        }
        if (onError) onError(err);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save a single medical plan directly to Cloud Firestore collection
 * (Prevents race conditions / clobbering concurrent edits from other devices)
 */
export async function saveStudentMedicalPlanToFirestore(
  plan: StudentMedicalPlan
): Promise<boolean> {
  // 1. Update local cache immediately
  try {
    const current = getLocalStudentMedicalPlans();
    const idx = current.findIndex((p) => p.id === plan.id);
    const updated = idx >= 0 ? current.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...current];
    localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // 2. Ensure network is enabled
  if (isFirestoreOfflineOrQuotaExhausted()) {
    try {
      await resetQuotaExhausted();
    } catch {}
  }

  try {
    // Save individual document in 'student_medical_plans'
    const planDocRef = doc(db, 'student_medical_plans', plan.id);
    await setDoc(planDocRef, plan, { merge: true });

    // Keep 'settings/student_medical_plans' synced as aggregate backup
    const backupDocRef = doc(db, 'settings', 'student_medical_plans');
    const localPlans = getLocalStudentMedicalPlans();
    await setDoc(backupDocRef, { plans: localPlans, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    console.warn('[Firestore] Failed to save medical plan:', err);
    return false;
  }
}

/**
 * Delete a medical plan from Cloud Firestore collection & backup
 */
export async function deleteStudentMedicalPlanFromFirestore(
  planId: string
): Promise<boolean> {
  // 1. Update local cache immediately
  try {
    const current = getLocalStudentMedicalPlans();
    const updated = current.filter((p) => p.id !== planId);
    localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) {
    try {
      await resetQuotaExhausted();
    } catch {}
  }

  try {
    // Delete individual doc from collection
    const planDocRef = doc(db, 'student_medical_plans', planId);
    await deleteDoc(planDocRef);

    // Update backup settings doc
    const backupDocRef = doc(db, 'settings', 'student_medical_plans');
    const localPlans = getLocalStudentMedicalPlans();
    await setDoc(backupDocRef, { plans: localPlans, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});

    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    console.warn('[Firestore] Failed to delete medical plan:', err);
    return false;
  }
}

/**
 * Save all medical plans to Firestore (batch sync)
 */
export async function saveAllStudentMedicalPlansToFirestore(
  plans: StudentMedicalPlan[]
): Promise<boolean> {
  try {
    localStorage.setItem(MEDICAL_PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) {
    return true;
  }

  try {
    // Save to collection
    for (const plan of plans) {
      if (plan?.id) {
        setDoc(doc(db, 'student_medical_plans', plan.id), plan, { merge: true }).catch(() => {});
      }
    }

    // Save to backup aggregate doc
    const docRef = doc(db, 'settings', 'student_medical_plans');
    await setDoc(docRef, { plans, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      markQuotaExhausted();
      return false;
    }
    console.warn('[Firestore] Failed to save medical plans:', err);
    return false;
  }
}

// ==================== STUDENT PORTFOLIO NOTES ====================
const STUDENT_NOTES_STORAGE_KEY = 'student_portfolio_notes';

/**
 * Get initial sample notes for demo/starter
 */
export function getInitialStudentNotes(): StudentPortfolioNote[] {
  return [
    {
      id: 'note-sample-1',
      studentNo: 1,
      studentName: 'Adam Julian Shano',
      date: '2026-09-05',
      category: 'Ibadah',
      content: 'Aktif mengikuti sholat Subuh dan Maghrib berjamaah di musholla asrama. Hafalan juz 30 surat An-Naba lancar.',
      authorName: 'M. Ali Shodikin',
      authorRole: 'Wali Asuh',
      createdAt: '2026-09-05T19:30:00.000Z',
    },
    {
      id: 'note-sample-2',
      studentNo: 21,
      studentName: 'Ahmad Syaiful Arsyad',
      date: '2026-09-07',
      category: 'Akademik',
      content: 'Menunjukkan peningkatan pemahaman dalam pelajaran Matematika dan rajin belajar mandiri saat shif malam.',
      authorName: 'A. Choirul',
      authorRole: 'Wali Asuh',
      createdAt: '2026-09-07T20:15:00.000Z',
    },
    {
      id: 'note-sample-3',
      studentNo: 23,
      studentName: 'Alfiyah Amaliatul Hasanah',
      date: '2026-09-08',
      category: 'Kedisiplinan',
      content: 'Kerapihan kamar asrama dan lemari pakaian sangat rapi. Membantu adik kelas merapikan tempat tidur.',
      authorName: 'Siti Rahma',
      authorRole: 'Wali Asuh',
      createdAt: '2026-09-08T08:45:00.000Z',
    },
  ];
}

/**
 * Get local student portfolio notes
 */
export function getLocalStudentNotes(): StudentPortfolioNote[] {
  try {
    const raw = localStorage.getItem(STUDENT_NOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const defaults = getInitialStudentNotes();
  try {
    localStorage.setItem(STUDENT_NOTES_STORAGE_KEY, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

/**
 * Fetch student notes from Firestore
 */
export async function fetchStudentNotesFromFirestore(): Promise<StudentPortfolioNote[] | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) return null;

  try {
    const notesMap = new Map<string, StudentPortfolioNote>();

    try {
      const colRef = collection(db, 'student_portfolio_notes');
      let snap;
      try {
        snap = await getDocsFromServer(colRef);
      } catch {
        snap = await getDocs(colRef);
      }
      snap.forEach((d) => {
        const data = d.data() as StudentPortfolioNote;
        if (data && data.id && data.content) {
          notesMap.set(data.id, { ...data, id: data.id });
        }
      });
    } catch (colErr: any) {
      if (colErr?.code === 'resource-exhausted') {
        markQuotaExhausted();
        return null;
      }
    }

    try {
      const docRef = doc(db, 'settings', 'student_portfolio_notes');
      let docSnap;
      try {
        docSnap = await getDocFromServer(docRef);
      } catch {
        docSnap = await getDoc(docRef);
      }
      if (docSnap.exists()) {
        const payload = docSnap.data();
        if (Array.isArray(payload?.notes)) {
          payload.notes.forEach((n: StudentPortfolioNote) => {
            if (n?.id && !notesMap.has(n.id)) {
              notesMap.set(n.id, n);
            }
          });
        }
      }
    } catch {}

    if (notesMap.size > 0) {
      const result = Array.from(notesMap.values());
      try {
        localStorage.setItem(STUDENT_NOTES_STORAGE_KEY, JSON.stringify(result));
      } catch {}
      return result;
    }

    return null;
  } catch (err: any) {
    return null;
  }
}

/**
 * Real-time subscription for student notes
 */
export function subscribeToStudentNotes(
  onData: (notes: StudentPortfolioNote[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  onData(getLocalStudentNotes());

  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }

  fetchStudentNotesFromFirestore().then((fetched) => {
    if (fetched && fetched.length > 0) {
      onData(fetched);
    }
  }).catch(() => {});

  try {
    const colRef = collection(db, 'student_portfolio_notes');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const notes: StudentPortfolioNote[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as StudentPortfolioNote;
            if (data && data.id) notes.push({ ...data, id: data.id });
          });
          if (notes.length > 0) {
            try {
              localStorage.setItem(STUDENT_NOTES_STORAGE_KEY, JSON.stringify(notes));
            } catch {}
            onData(notes);
          }
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted') markQuotaExhausted();
        if (onError) onError(err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save single student note to Firestore & local storage
 */
export async function saveStudentNoteToFirestore(note: StudentPortfolioNote): Promise<boolean> {
  const current = getLocalStudentNotes();
  const index = current.findIndex((n) => n.id === note.id);
  const updated = index >= 0 ? [...current] : [note, ...current];
  if (index >= 0) updated[index] = note;

  try {
    localStorage.setItem(STUDENT_NOTES_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    await setDoc(doc(db, 'student_portfolio_notes', note.id), note, { merge: true });
    // update aggregate backup
    const docRef = doc(db, 'settings', 'student_portfolio_notes');
    setDoc(docRef, { notes: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Delete student note from Firestore & local storage
 */
export async function deleteStudentNoteFromFirestore(noteId: string): Promise<boolean> {
  const current = getLocalStudentNotes();
  const updated = current.filter((n) => n.id !== noteId);
  try {
    localStorage.setItem(STUDENT_NOTES_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    await deleteDoc(doc(db, 'student_portfolio_notes', noteId));
    const docRef = doc(db, 'settings', 'student_portfolio_notes');
    setDoc(docRef, { notes: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

// ==================== STUDENT CUSTOM OVERRIDES (ROOM, PHONE, ETC.) ====================
const STUDENT_OVERRIDES_STORAGE_KEY = 'student_custom_overrides';

/**
 * Get local student custom overrides (room, phone, bloodType, etc.)
 */
export function getLocalStudentOverrides(): Record<number, Partial<Student>> {
  try {
    const raw = localStorage.getItem(STUDENT_OVERRIDES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch {}
  return {};
}

/**
 * Fetch student overrides from Firestore
 */
export async function fetchStudentOverridesFromFirestore(): Promise<Record<number, Partial<Student>> | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) return null;

  try {
    const overridesMap: Record<number, Partial<Student>> = {};

    // First try single collection
    try {
      const colRef = collection(db, 'student_custom_overrides');
      let snap;
      try {
        snap = await getDocsFromServer(colRef);
      } catch {
        snap = await getDocs(colRef);
      }
      snap.forEach((d) => {
        const data = d.data();
        if (data && typeof data.studentNo === 'number') {
          overridesMap[data.studentNo] = data as Partial<Student>;
        }
      });
    } catch (colErr: any) {
      if (colErr?.code === 'resource-exhausted') {
        markQuotaExhausted();
        return null;
      }
    }

    // Also check settings aggregate backup
    try {
      const docRef = doc(db, 'settings', 'student_custom_overrides');
      let docSnap;
      try {
        docSnap = await getDocFromServer(docRef);
      } catch {
        docSnap = await getDoc(docRef);
      }
      if (docSnap.exists()) {
        const payload = docSnap.data();
        if (payload?.overrides && typeof payload.overrides === 'object') {
          Object.entries(payload.overrides).forEach(([k, v]) => {
            const sNo = parseInt(k, 10);
            if (!isNaN(sNo) && v && !overridesMap[sNo]) {
              overridesMap[sNo] = v as Partial<Student>;
            }
          });
        }
      }
    } catch {}

    if (Object.keys(overridesMap).length > 0) {
      try {
        localStorage.setItem(STUDENT_OVERRIDES_STORAGE_KEY, JSON.stringify(overridesMap));
      } catch {}
      return overridesMap;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Real-time subscription for student overrides
 */
export function subscribeToStudentOverrides(
  onData: (overrides: Record<number, Partial<Student>>) => void,
  onError?: (err: any) => void
): Unsubscribe {
  onData(getLocalStudentOverrides());

  if (isFirestoreOfflineOrQuotaExhausted()) {
    return () => {};
  }

  fetchStudentOverridesFromFirestore().then((fetched) => {
    if (fetched && Object.keys(fetched).length > 0) {
      onData(fetched);
    }
  }).catch(() => {});

  try {
    const colRef = collection(db, 'student_custom_overrides');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const overrides: Record<number, Partial<Student>> = {};
          snapshot.forEach((d) => {
            const data = d.data();
            if (data && typeof data.studentNo === 'number') {
              overrides[data.studentNo] = data as Partial<Student>;
            }
          });
          if (Object.keys(overrides).length > 0) {
            try {
              localStorage.setItem(STUDENT_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
            } catch {}
            onData(overrides);
          }
        }
      },
      (err) => {
        if (err?.code === 'resource-exhausted') markQuotaExhausted();
        if (onError) onError(err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * Save single student override to Firestore and local storage
 */
export async function saveStudentOverrideToFirestore(
  studentNo: number,
  updatedFields: Partial<Student>
): Promise<boolean> {
  const current = getLocalStudentOverrides();
  const merged = {
    ...(current[studentNo] || {}),
    ...updatedFields,
    studentNo,
    updatedAt: new Date().toISOString(),
  };
  current[studentNo] = merged;

  try {
    localStorage.setItem(STUDENT_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    await setDoc(doc(db, 'student_custom_overrides', String(studentNo)), merged, { merge: true });
    const docRef = doc(db, 'settings', 'student_custom_overrides');
    setDoc(docRef, { overrides: current, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}




