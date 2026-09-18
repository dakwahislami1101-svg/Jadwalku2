import { LeavePermissionRecord, LeaveType } from '../types';
import { db, isFirestoreOfflineOrQuotaExhausted, markQuotaExhausted } from './firebaseService';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

const LEAVE_STORAGE_PREFIX = 'wali_asuh_leave_records_v1';

export function getLeaveRecordStorageKey(year: number, month: number): string {
  return `${LEAVE_STORAGE_PREFIX}_${year}_${month}`;
}

export function getLeaveRecordId(year: number, month: number, day: number, staffId: number): string {
  return `${year}_${month}_${day}_${staffId}`;
}

/**
 * Get all leave records for a specific year & month from LocalStorage
 */
export function getLocalLeaveRecords(year: number, month: number): Record<string, LeavePermissionRecord> {
  try {
    const key = getLeaveRecordStorageKey(year, month);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to read local leave records:', err);
  }
  return {};
}

/**
 * Save single leave permission record (Admin assigns or updates)
 */
export async function saveLeaveRecord(record: LeavePermissionRecord): Promise<boolean> {
  const { year, month } = record;
  const key = getLeaveRecordStorageKey(year, month);
  const current = getLocalLeaveRecords(year, month);
  current[record.id] = record;

  try {
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('leave_records_updated', { detail: { record } }));
  } catch (err) {
    console.error('Failed to save leave record to localStorage:', err);
  }

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'leave_permissions', record.id);
    await setDoc(docRef, record, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Delete leave permission record
 */
export async function deleteLeaveRecord(year: number, month: number, day: number, staffId: number): Promise<boolean> {
  const id = getLeaveRecordId(year, month, day, staffId);
  const key = getLeaveRecordStorageKey(year, month);
  const current = getLocalLeaveRecords(year, month);
  delete current[id];

  try {
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('leave_records_updated', { detail: { id, deleted: true } }));
  } catch (err) {
    console.error('Failed to delete leave record from localStorage:', err);
  }

  if (isFirestoreOfflineOrQuotaExhausted()) return true;

  try {
    const docRef = doc(db, 'leave_permissions', id);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted') markQuotaExhausted();
    return false;
  }
}

/**
 * Upload or attach proof file (JPG/PNG Base64) to existing or new leave record
 */
export async function attachLeaveProof(
  year: number,
  month: number,
  day: number,
  staffId: number,
  staffName: string,
  leaveType: LeaveType,
  proofUrl: string,
  proofFileName: string,
  uploadedBy: string
): Promise<boolean> {
  const id = getLeaveRecordId(year, month, day, staffId);
  const current = getLocalLeaveRecords(year, month);
  const existing = current[id];

  const updatedRecord: LeavePermissionRecord = {
    id,
    staffId,
    staffName: existing?.staffName || staffName,
    day,
    month,
    year,
    leaveType: existing?.leaveType || leaveType,
    notes: existing?.notes || '',
    proofUrl,
    proofFileName,
    proofUploadedAt: new Date().toISOString(),
    proofUploadedBy: uploadedBy,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await saveLeaveRecord(updatedRecord);
}

/**
 * Subscribe to leave records in Firestore
 */
export function subscribeToLeaveRecords(
  year: number,
  month: number,
  callback: (records: Record<string, LeavePermissionRecord>) => void
): () => void {
  if (isFirestoreOfflineOrQuotaExhausted()) {
    callback(getLocalLeaveRecords(year, month));
    return () => {};
  }

  try {
    const colRef = collection(db, 'leave_permissions');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const local = getLocalLeaveRecords(year, month);
        const result: Record<string, LeavePermissionRecord> = { ...local };

        snapshot.forEach((d) => {
          const data = d.data() as LeavePermissionRecord;
          if (data && data.year === year && data.month === month && data.id) {
            result[data.id] = data;
          }
        });

        try {
          localStorage.setItem(getLeaveRecordStorageKey(year, month), JSON.stringify(result));
        } catch {}

        callback(result);
      },
      (err) => {
        if (err?.code === 'resource-exhausted') markQuotaExhausted();
        callback(getLocalLeaveRecords(year, month));
      }
    );

    return unsub;
  } catch {
    callback(getLocalLeaveRecords(year, month));
    return () => {};
  }
}

/**
 * Get human readable label for leave type
 */
export function getLeaveTypeLabel(type: LeaveType): string {
  switch (type) {
    case 'sakit':
      return 'Sakit (Surat Dokter)';
    case 'dinas':
      return 'Dinas Luar (Surat Tugas)';
    case 'keperluan_lain':
      return 'Keperluan Lain';
    default:
      return 'Izin';
  }
}
