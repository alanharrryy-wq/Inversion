
import { BootRuntimeSnapshot, BootRuntimeState } from './types';

export const BOOT_SNAPSHOT_SCHEMA = 'hitech.boot.snapshot.v1';

export function serializeBootSnapshot(state: BootRuntimeState, exportedAtTs: number): BootRuntimeSnapshot {
  return {
    schema: BOOT_SNAPSHOT_SCHEMA,
    exportedAtTs,
    boot: state.boot,
    evidence: state.evidence,
    operatorLog: state.operatorLog,
    eventLog: state.eventLog,
    eventSequence: state.eventSequence,
    lastSlideEntered: state.lastSlideEntered,
    lastInteractedAnchor: state.lastInteractedAnchor,
  };
}

export function parseBootSnapshot(raw: string): BootRuntimeSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as BootRuntimeSnapshot;
    if (parsed?.schema !== BOOT_SNAPSHOT_SCHEMA) return null;
    if (!parsed.boot || !parsed.evidence) return null;
    if (!Array.isArray(parsed.operatorLog)) return null;
    if (!Array.isArray(parsed.eventLog)) return null;
    if (typeof parsed.eventSequence !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

