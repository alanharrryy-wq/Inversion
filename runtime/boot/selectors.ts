import {
  isEvidenceSatisfied,
  selectLastEvidenceEvent,
  selectMissingBlockerEvidenceKeys,
  selectSatisfiedEvidenceKeys,
  summarizeEvidence,
} from '../evidence';
import { BootRuntimeState } from './types';

export function selectBootStatus(state: BootRuntimeState) {
  return state.boot.status;
}

export function selectBootIsArmed(state: BootRuntimeState): boolean {
  return state.boot.status === 'ARMED_CONFIRMED' && isEvidenceSatisfied(state.evidence, 'evidence:system:armed');
}

export function selectBootIsOperatorAssisted(state: BootRuntimeState): boolean {
  return state.boot.overrideEnabled && !selectBootIsArmed(state);
}

export function selectBootGateLocked(state: BootRuntimeState): boolean {
  return !selectBootIsArmed(state) && !state.boot.overrideEnabled;
}

export function selectBootStateLabel(state: BootRuntimeState): string {
  return state.boot.status;
}

export function selectBootMissingBlockers(state: BootRuntimeState) {
  return selectMissingBlockerEvidenceKeys(state.evidence);
}

export function selectBootSatisfiedEvidence(state: BootRuntimeState) {
  return selectSatisfiedEvidenceKeys(state.evidence);
}

export function selectBootEvidenceSummary(state: BootRuntimeState) {
  return summarizeEvidence(state.evidence);
}

export function selectBootLastEvent(state: BootRuntimeState) {
  return selectLastEvidenceEvent(state.evidence);
}

export function selectBootLastOperatorLog(state: BootRuntimeState) {
  return state.operatorLog[state.operatorLog.length - 1] ?? null;
}

export function selectBootCanArm(state: BootRuntimeState): boolean {
  if (selectBootIsArmed(state)) return false;
  return state.boot.status === 'IDLE' || state.boot.status === 'OPERATOR_ASSISTED';
}

export function selectBootCanConfirm(state: BootRuntimeState): boolean {
  if (selectBootIsArmed(state)) return false;
  return state.boot.status === 'ARMED_PENDING_CONFIRM' || state.boot.status === 'OPERATOR_ASSISTED';
}

export function selectBootDiagnostics(state: BootRuntimeState) {
  return {
    status: state.boot.status,
    overrideEnabled: state.boot.overrideEnabled,
    gateLocked: selectBootGateLocked(state),
    armed: selectBootIsArmed(state),
    operatorAssisted: selectBootIsOperatorAssisted(state),
    lastSlideEntered: state.lastSlideEntered,
    lastInteractedAnchor: state.lastInteractedAnchor,
    eventCount: state.eventSequence,
    evidenceSummary: summarizeEvidence(state.evidence),
    missingBlockers: selectMissingBlockerEvidenceKeys(state.evidence),
    satisfiedEvidence: selectSatisfiedEvidenceKeys(state.evidence),
    lastEvent: selectLastEvidenceEvent(state.evidence),
    lastOperatorLog: state.operatorLog[state.operatorLog.length - 1] ?? null,
  };
}
