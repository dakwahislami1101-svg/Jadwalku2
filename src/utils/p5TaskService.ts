import { P5TaskAssignment, P5CustomTaskOption } from '../types';
import { db, isFirestoreOfflineOrQuotaExhausted, markQuotaExhausted } from './firebaseService';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

export const DEFAULT_P5_TASK_OPTIONS: P5CustomTaskOption[] = [
  { id: 'perhotelan', label: 'Mendampingi Perhotelan', isDefault: true },
  { id: 'tata_boga', label: 'Mendampingi Tata Boga', isDefault: true },
  { id: 'peternakan', label: 'Mendampingi Peternakan', isDefault: true },
  { id: 'pertanian', label: 'Mendampingi Pertanian', isDefault: true },
  { id: 'tata_rias', label: 'Mendampingi Tata Rias', isDefault: true },
];

const P5_OPTIONS_STORAGE_KEY = 'wali_asuh_p5_task_options_v1';
const P5_ASSIGNMENTS_STORAGE_PREFIX = 'wali_asuh_p5_assignments_v1';

/**
 * Get current P5 task options from localStorage
 */
export function getLocalP5TaskOptions(): P5CustomTaskOption[] {
  try {
    const saved = localStorage.getItem(P5_OPTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_P5_TASK_OPTIONS;
}

/**
 * Save P5 task options locally & to Firestore
 */
export async function saveP5TaskOptions(options: P5CustomTaskOption[]): Promise<boolean> {
  try {
    localStorage.setItem(P5_OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'settings', 'p5_task_options');
    await setDoc(docRef, { options, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Fetch P5 task options from Firestore
 */
export async function fetchP5TaskOptionsFromFirestore(): Promise<P5CustomTaskOption[] | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) return null;

  try {
    const docRef = doc(db, 'settings', 'p5_task_options');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data?.options && Array.isArray(data.options)) {
        localStorage.setItem(P5_OPTIONS_STORAGE_KEY, JSON.stringify(data.options));
        return data.options;
      }
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return null;
  }
}

/**
 * Realtime subscribe to P5 task options
 */
export function subscribeToP5TaskOptions(
  onData: (options: P5CustomTaskOption[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    onData(getLocalP5TaskOptions());
    return () => {};
  }

  try {
    const docRef = doc(db, 'settings', 'p5_task_options');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.options && Array.isArray(data.options)) {
            try {
              localStorage.setItem(P5_OPTIONS_STORAGE_KEY, JSON.stringify(data.options));
            } catch {}
            onData(data.options);
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
 * Get local P5 task assignments map for year and month
 * Key: `${day}_${staffId}` -> P5TaskAssignment
 */
export function getLocalP5Assignments(year: number, month: number): Record<string, P5TaskAssignment> {
  try {
    const key = `${P5_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {}
  return {};
}

/**
 * Save single or multiple P5 assignments locally and to Firestore
 */
export async function saveP5AssignmentToFirestore(
  assignment: P5TaskAssignment
): Promise<boolean> {
  const { year, month, day, staffId } = assignment;
  const current = getLocalP5Assignments(year, month);
  const key = `${day}_${staffId}`;
  current[key] = {
    ...assignment,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${P5_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(current));
  } catch {}

  // Trigger cross-component storage event for instant UI update
  window.dispatchEvent(new CustomEvent('p5_assignments_updated', { detail: { year, month, assignment } }));

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'p5_assignments', `${year}_${month}`);
    await setDoc(docRef, { assignments: current, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Delete a P5 assignment
 */
export async function deleteP5Assignment(
  year: number,
  month: number,
  day: number,
  staffId: number
): Promise<boolean> {
  const current = getLocalP5Assignments(year, month);
  const key = `${day}_${staffId}`;
  delete current[key];

  try {
    localStorage.setItem(`${P5_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(current));
  } catch {}

  window.dispatchEvent(new CustomEvent('p5_assignments_updated', { detail: { year, month } }));

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'p5_assignments', `${year}_${month}`);
    await setDoc(docRef, { assignments: current, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Realtime subscribe to P5 assignments for a specific month
 */
export function subscribeToP5Assignments(
  year: number,
  month: number,
  onData: (assignments: Record<string, P5TaskAssignment>) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    onData(getLocalP5Assignments(year, month));
    return () => {};
  }

  try {
    const docRef = doc(db, 'p5_assignments', `${year}_${month}`);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.assignments && typeof data.assignments === 'object') {
            try {
              localStorage.setItem(`${P5_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(data.assignments));
            } catch {}
            onData(data.assignments);
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
