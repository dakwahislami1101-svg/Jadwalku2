import { MorningPostAssignment, MorningPostCustomOption } from '../types';
import { db, isFirestoreOfflineOrQuotaExhausted, markQuotaExhausted } from './firebaseService';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const DEFAULT_MORNING_POST_OPTIONS: MorningPostCustomOption[] = [
  { id: 'uks_sd', label: 'UKS SD', isDefault: true },
  { id: 'uks_smp', label: 'UKS SMP', isDefault: true },
  { id: 'uks_sma', label: 'UKS SMA', isDefault: true },
  { id: 'mobile_keliling', label: 'Mobile / Keliling', isDefault: true },
];

const MORNING_POST_OPTIONS_STORAGE_KEY = 'wali_asuh_morning_post_options_v1';
const MORNING_POST_ASSIGNMENTS_STORAGE_PREFIX = 'wali_asuh_morning_post_assignments_v1';

/**
 * Get current P1/P2 morning post options from localStorage
 */
export function getLocalMorningPostOptions(): MorningPostCustomOption[] {
  try {
    const saved = localStorage.getItem(MORNING_POST_OPTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_MORNING_POST_OPTIONS;
}

/**
 * Save morning post options locally & to Firestore
 */
export async function saveMorningPostOptions(options: MorningPostCustomOption[]): Promise<boolean> {
  try {
    localStorage.setItem(MORNING_POST_OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {}

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'settings', 'morning_post_options');
    await setDoc(docRef, { options, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Fetch morning post options from Firestore
 */
export async function fetchMorningPostOptionsFromFirestore(): Promise<MorningPostCustomOption[] | null> {
  if (isFirestoreOfflineOrQuotaExhausted()) return null;

  try {
    const docRef = doc(db, 'settings', 'morning_post_options');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data?.options && Array.isArray(data.options)) {
        localStorage.setItem(MORNING_POST_OPTIONS_STORAGE_KEY, JSON.stringify(data.options));
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
 * Realtime subscribe to morning post options
 */
export function subscribeToMorningPostOptions(
  onData: (options: MorningPostCustomOption[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    onData(getLocalMorningPostOptions());
    return () => {};
  }

  try {
    const docRef = doc(db, 'settings', 'morning_post_options');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.options && Array.isArray(data.options)) {
            try {
              localStorage.setItem(MORNING_POST_OPTIONS_STORAGE_KEY, JSON.stringify(data.options));
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
 * Get local morning post assignments map for year and month
 * Key: `${day}_${staffId}` -> MorningPostAssignment
 */
export function getLocalMorningPostAssignments(year: number, month: number): Record<string, MorningPostAssignment> {
  try {
    const key = `${MORNING_POST_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`;
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
 * Save single morning post assignment locally and to Firestore
 */
export async function saveMorningPostAssignmentToFirestore(
  assignment: MorningPostAssignment
): Promise<boolean> {
  const { year, month, day, staffId } = assignment;
  const current = getLocalMorningPostAssignments(year, month);
  const key = `${day}_${staffId}`;
  current[key] = {
    ...assignment,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${MORNING_POST_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(current));
  } catch {}

  // Trigger cross-component storage event for instant UI update
  window.dispatchEvent(new CustomEvent('morning_post_assignments_updated', { detail: { year, month, assignment } }));

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'morning_post_assignments', `${year}_${month}`);
    await setDoc(docRef, { assignments: current, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Delete a morning post assignment
 */
export async function deleteMorningPostAssignment(
  year: number,
  month: number,
  day: number,
  staffId: number
): Promise<boolean> {
  const current = getLocalMorningPostAssignments(year, month);
  const key = `${day}_${staffId}`;
  delete current[key];

  try {
    localStorage.setItem(`${MORNING_POST_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(current));
  } catch {}

  window.dispatchEvent(new CustomEvent('morning_post_assignments_updated', { detail: { year, month } }));

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'morning_post_assignments', `${year}_${month}`);
    await setDoc(docRef, { assignments: current, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Realtime subscribe to morning post assignments for a specific month
 */
export function subscribeToMorningPostAssignments(
  year: number,
  month: number,
  onData: (assignments: Record<string, MorningPostAssignment>) => void,
  onError?: (err: unknown) => void
): () => void {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    onData(getLocalMorningPostAssignments(year, month));
    return () => {};
  }

  try {
    const docRef = doc(db, 'morning_post_assignments', `${year}_${month}`);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.assignments && typeof data.assignments === 'object') {
            try {
              localStorage.setItem(`${MORNING_POST_ASSIGNMENTS_STORAGE_PREFIX}_${year}_${month}`, JSON.stringify(data.assignments));
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
