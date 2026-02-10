
import { BootRuntimeSnapshot } from './types';
import { parseBootSnapshot } from './snapshot';

export const BOOT_LOCAL_STORAGE_KEY = 'hitech.boot.snapshot.v1';

export function readBootSnapshotFromLocalStorage(storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): BootRuntimeSnapshot | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(BOOT_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return parseBootSnapshot(raw);
  } catch {
    return null;
  }
}

export function writeBootSnapshotToLocalStorage(snapshot: BootRuntimeSnapshot, storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): boolean {
  if (!storage) return false;
  try {
    storage.setItem(BOOT_LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function clearBootSnapshotFromLocalStorage(storage: Storage | null = typeof window !== 'undefined' ? window.localStorage : null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(BOOT_LOCAL_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

