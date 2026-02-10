import { EvidenceStoreState } from '../evidence';

export type BootLifecycleState =
  | 'IDLE'
  | 'ARMED_PENDING_CONFIRM'
  | 'ARMED_CONFIRMED'
  | 'OPERATOR_ASSISTED';

export type BootActionActor = 'operator' | 'system';

export type BootRuntimeEvent = {
  id: string;
  action: string;
  actor: BootActionActor;
  ts: number;
  slide?: number;
  anchorId?: string;
  note?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

export type BootOperatorLogEntry = {
  id: string;
  ts: number;
  level: 'info' | 'warning' | 'success';
  title: string;
  detail: string;
  action: string;
  actor: BootActionActor;
};

export type BootState = {
  status: BootLifecycleState;
  overrideEnabled: boolean;
  armedAtTs: number | null;
  pendingAtTs: number | null;
  operatorAssistedSinceTs: number | null;
  lastAction: string | null;
};

export type BootStateReducerAction =
  | { type: 'BOOT_ARM_REQUEST'; ts: number }
  | { type: 'BOOT_ARM_CONFIRM'; ts: number }
  | { type: 'BOOT_OVERRIDE_ENABLE'; ts: number }
  | { type: 'BOOT_OVERRIDE_DISABLE'; ts: number }
  | { type: 'BOOT_RESET'; ts: number }
  | { type: 'BOOT_SYNC_WITH_EVIDENCE'; evidence: EvidenceStoreState };

export type BootRuntimeState = {
  boot: BootState;
  evidence: EvidenceStoreState;
  operatorLog: BootOperatorLogEntry[];
  eventLog: BootRuntimeEvent[];
  eventSequence: number;
  lastSlideEntered: number | null;
  lastInteractedAnchor: string | null;
};

export type BootRuntimeAction =
  | { type: 'BOOT_RUNTIME_RECORD_SLIDE_ENTRY'; slide: number; ts?: number }
  | { type: 'BOOT_RUNTIME_RECORD_ANCHOR_INTERACTION'; anchorId: string; ts?: number; note?: string }
  | { type: 'BOOT_RUNTIME_REQUEST_ARM'; ts?: number }
  | { type: 'BOOT_RUNTIME_CONFIRM_ARM'; ts?: number }
  | { type: 'BOOT_RUNTIME_SET_OVERRIDE'; enabled: boolean; ts?: number }
  | { type: 'BOOT_RUNTIME_ADD_LOG'; level: BootOperatorLogEntry['level']; title: string; detail: string; action: string; ts?: number }
  | { type: 'BOOT_RUNTIME_RESET_LOCAL'; ts?: number }
  | { type: 'BOOT_RUNTIME_RESTORE'; snapshot: BootRuntimeSnapshot };

export type BootRuntimeSnapshot = {
  schema: 'hitech.boot.snapshot.v1';
  exportedAtTs: number;
  boot: BootState;
  evidence: EvidenceStoreState;
  operatorLog: BootOperatorLogEntry[];
  eventLog: BootRuntimeEvent[];
  eventSequence: number;
  lastSlideEntered: number | null;
  lastInteractedAnchor: string | null;
};

export type BootGateDecision = {
  locked: boolean;
  ready: boolean;
  operatorAssisted: boolean;
  reason: string;
};

export type WowFeatureGates = {
  tour: BootGateDecision;
  tourAutostart: BootGateDecision;
  demoScript: BootGateDecision;
  openingCinema: BootGateDecision;
  mirrorIntro: BootGateDecision;
};
