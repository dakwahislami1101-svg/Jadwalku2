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
  onSnapshot, 
  Firestore,
  Unsubscribe,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { MonthSchedule, ShiftCode, ShiftSwapRecord, HandoverReport, DailyTask } from '../types';

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


