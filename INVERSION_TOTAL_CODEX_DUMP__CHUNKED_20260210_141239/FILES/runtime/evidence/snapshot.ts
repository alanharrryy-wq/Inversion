
import {
  EvidenceSnapshot,
  EvidenceStoreState,
} from './types';

export const EVIDENCE_SNAPSHOT_SCHEMA = 'hitech.evidence.snapshot.v1';

export function serializeEvidenceSnapshot(state: EvidenceStoreState, exportedAtTs: number): EvidenceSnapshot {
  return {
    schema: EVIDENCE_SNAPSHOT_SCHEMA,
    exportedAtTs,
    registryVersion: state.registryVersion,
    entries: state.entries,
    eventLog: state.eventLog,
    eventCount: state.eventCount,
    lastInteractedAnchor: state.lastInteractedAnchor,
  };
}

export function parseEvidenceSnapshot(raw: string): EvidenceSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as EvidenceSnapshot;
    if (parsed?.schema !== EVIDENCE_SNAPSHOT_SCHEMA) return null;
    if (typeof parsed.registryVersion !== 'string') return null;
    if (!parsed.entries || typeof parsed.entries !== 'object') return null;
    if (!Array.isArray(parsed.eventLog)) return null;
    if (typeof parsed.eventCount !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

