export type RouteId =
  | "route-direct-oem"
  | "route-service-led"
  | "route-white-label";

export type ConstraintId =
  | "capital-window"
  | "integration-risk"
  | "audit-pressure"
  | "delivery-speed"
  | "compliance-rigor";

export type EvidenceId =
  | "live-telemetry"
  | "chain-of-custody"
  | "quality-snapshot"
  | "service-ledger"
  | "board-brief";

export type ConstraintState = "satisfied" | "at-risk" | "blocked";

export type RouteRiskBand = "conservative" | "balanced" | "aggressive";

export type EvidenceSource =
  | "telemetry"
  | "operations"
  | "quality"
  | "finance"
  | "governance";

export type LockPhase = "idle" | "arming" | "locking" | "sealed";

export type LockGuardFailureCode =
  | "route-missing"
  | "insufficient-evidence"
  | "blocked-constraints"
  | "hold-incomplete"
  | "invalid-phase";

export interface RouteDefinition {
  id: RouteId;
  label: string;
  thesis: string;
  owner: string;
  horizonDays: number;
  riskBand: RouteRiskBand;
  handoffTag: string;
}

export interface ConstraintDefinition {
  id: ConstraintId;
  label: string;
  weight: number;
  rationale: string;
}

export interface EvidenceDefinition {
  id: EvidenceId;
  label: string;
  source: EvidenceSource;
  confidence: number;
  note: string;
}

export interface ConstraintDigestItem {
  id: ConstraintId;
  label: string;
  weight: number;
  state: ConstraintState;
  rationale: string;
}

export interface EvidenceDigestItem {
  id: EvidenceId;
  label: string;
  source: EvidenceSource;
  confidence: number;
  note: string;
}

export interface DecisionDigest {
  routeScore: number;
  confidenceScore: number;
  blockedCount: number;
  atRiskCount: number;
  satisfiedCount: number;
  evidenceCount: number;
  lockReady: boolean;
  narrative: string;
}

export interface SealDigest {
  hash: string;
  signature: string;
  holdMs: number;
  sealedAtMs: number;
}

export interface SummaryOutput {
  schemaVersion: "slide04-summary.v1";
  route: RouteDefinition;
  constraintDigest: {
    totalWeight: number;
    blockedWeight: number;
    atRiskWeight: number;
    satisfiedWeight: number;
    items: ConstraintDigestItem[];
  };
  evidenceDigest: {
    totalConfidence: number;
    averageConfidence: number;
    bySource: Record<EvidenceSource, number>;
    items: EvidenceDigestItem[];
  };
  decision: DecisionDigest;
  seal: SealDigest;
}

export interface SummaryInput {
  route: RouteDefinition;
  constraints: ConstraintDigestItem[];
  evidence: EvidenceDigestItem[];
  holdMs: number;
  sealedAtMs: number;
}

export interface LockGuardFailure {
  code: LockGuardFailureCode;
  message: string;
}

export interface HoldState {
  startedAtMs: number | null;
  elapsedMs: number;
  progress: number;
  thresholdMs: number;
  pointerActive: boolean;
}

export interface ReplayMeta {
  scenario: string;
  capturedAt: string;
}

export type ReplayEventKind =
  | "route.select"
  | "route.clear"
  | "constraint.set"
  | "evidence.toggle"
  | "seal.pointer.down"
  | "seal.pointer.up"
  | "seal.pointer.cancel"
  | "seal.unseal"
  | "seal.reset";

export type ReplayPayload =
  | { routeId: RouteId }
  | Record<string, never>
  | { constraintId: ConstraintId; state: ConstraintState }
  | { evidenceId: EvidenceId }
  | { atMs: number };

export interface ReplayEvent {
  seq: number;
  atMs: number;
  kind: ReplayEventKind;
  payload: ReplayPayload;
}

export interface ReplayTraceV1 {
  version: "slide04-replay.v1";
  seed: string;
  meta: ReplayMeta;
  events: ReplayEvent[];
}

export type ReplayDecodeResult =
  | {
      ok: true;
      trace: ReplayTraceV1;
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
    };

export interface ReplayPlaybackResult {
  ok: boolean;
  state: LockMachineState;
  errors: string[];
}

export type ReplayStatus = "idle" | "ready" | "applied" | "error";

export interface LockMachineState {
  phase: LockPhase;
  selectedRouteId: RouteId | null;
  constraints: Record<ConstraintId, ConstraintState>;
  selectedEvidenceIds: EvidenceId[];
  hold: HoldState;
  sealAttemptCount: number;
  successfulSealCount: number;
  lastGuardFailure: LockGuardFailure | null;
  sealedSummary: SummaryOutput | null;
  replayStatus: ReplayStatus;
  replayLastHash: string | null;
  replayLastError: string | null;
  revision: number;
}

export type LockAction =
  | {
      type: "route.select";
      routeId: RouteId;
      atMs: number;
    }
  | {
      type: "route.clear";
      atMs: number;
    }
  | {
      type: "constraint.set";
      constraintId: ConstraintId;
      state: ConstraintState;
      atMs: number;
    }
  | {
      type: "evidence.toggle";
      evidenceId: EvidenceId;
      atMs: number;
    }
  | {
      type: "seal.pointer.down";
      atMs: number;
    }
  | {
      type: "seal.pointer.tick";
      atMs: number;
    }
  | {
      type: "seal.pointer.up";
      atMs: number;
    }
  | {
      type: "seal.pointer.cancel";
      atMs: number;
      reason: "pointer-cancel" | "blur" | "unmount" | "lost-capture";
    }
  | {
      type: "seal.unseal";
      atMs: number;
    }
  | {
      type: "seal.reset";
      atMs: number;
    }
  | {
      type: "replay.applied";
      hash: string | null;
      atMs: number;
    }
  | {
      type: "replay.failed";
      error: string;
      atMs: number;
    };

export interface LockReducerDependencies {
  getRouteById: (routeId: RouteId) => RouteDefinition;
  getConstraintDefinition: (constraintId: ConstraintId) => ConstraintDefinition;
  getEvidenceDefinition: (evidenceId: EvidenceId) => EvidenceDefinition;
  createSummary: (input: SummaryInput) => SummaryOutput;
}

export interface GuardEvaluation {
  ok: boolean;
  failure: LockGuardFailure | null;
}

export interface SummarySnapshot {
  phase: LockPhase;
  hash: string | null;
  signature: string | null;
}

export const EMPTY_REPLAY_PAYLOAD: Record<string, never> = {};

export interface TraceCapture {
  seed: string;
  scenario: string;
  startedAt: string;
  events: ReplayEvent[];
}

export interface TraceCaptureAction {
  append: (event: ReplayEvent) => void;
  reset: () => void;
}

export interface LockSelectors {
  canArm: boolean;
  canAttemptLock: boolean;
  selectedRouteLabel: string;
  holdPercentLabel: string;
  summarySnapshot: SummarySnapshot;
}
