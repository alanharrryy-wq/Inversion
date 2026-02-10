import { DEFAULT_EVIDENCE_REGISTRY } from './registry';
import {
  EvidenceDefinition,
  EvidenceIngestionEvent,
  EvidenceKey,
  EvidenceStoreState,
} from './types';

export function selectEvidenceEntry(state: EvidenceStoreState, key: EvidenceKey) {
  return state.entries[key];
}

export function selectEvidenceDefinition(key: EvidenceKey): EvidenceDefinition {
  return DEFAULT_EVIDENCE_REGISTRY.definitions[key];
}

export function selectBlockerEvidence(state: EvidenceStoreState) {
  return DEFAULT_EVIDENCE_REGISTRY.orderedKeys
    .map((key) => ({ definition: DEFAULT_EVIDENCE_REGISTRY.definitions[key], entry: state.entries[key] }))
    .filter((row) => row.definition.level === 'blocker');
}

export function selectInformationalEvidence(state: EvidenceStoreState) {
  return DEFAULT_EVIDENCE_REGISTRY.orderedKeys
    .map((key) => ({ definition: DEFAULT_EVIDENCE_REGISTRY.definitions[key], entry: state.entries[key] }))
    .filter((row) => row.definition.level !== 'blocker');
}

export function selectSatisfiedEvidenceKeys(state: EvidenceStoreState): EvidenceKey[] {
  return DEFAULT_EVIDENCE_REGISTRY.orderedKeys.filter((key) => state.entries[key].satisfied);
}

export function selectMissingBlockerEvidenceKeys(state: EvidenceStoreState): EvidenceKey[] {
  return selectBlockerEvidence(state)
    .filter((row) => !row.entry.satisfied)
    .map((row) => row.definition.key);
}

export function isEvidenceSatisfied(state: EvidenceStoreState, key: EvidenceKey): boolean {
  return state.entries[key].satisfied;
}

export function selectEvidenceReady(state: EvidenceStoreState): boolean {
  return selectMissingBlockerEvidenceKeys(state).length === 0;
}

export function selectLastEvidenceEvent(state: EvidenceStoreState): EvidenceIngestionEvent | null {
  return state.lastEvent;
}

export function selectEvidenceTimeline(state: EvidenceStoreState): EvidenceIngestionEvent[] {
  return state.eventLog;
}

export function selectEvidenceByAction(state: EvidenceStoreState, action: string): EvidenceIngestionEvent[] {
  return state.eventLog.filter((event) => event.action === action);
}

export function selectEvidenceLastAnchor(state: EvidenceStoreState): string | null {
  return state.lastInteractedAnchor;
}
