export type Slide02RouteId =
  | "stabilize-operations"
  | "throughput-push"
  | "margin-defense"
  | "quality-ringfence";

export type RouteSourceKind =
  | "default"
  | "query"
  | "history"
  | "local-storage"
  | "external-payload";

export type OperabilityBand = "Fragile" | "Managed" | "Stable" | "Hardened";

export type DecisionCode = "HOLD" | "TIGHTEN" | "PROCEED" | "PROCEED+";

export type EvidenceStatus = "good" | "watch" | "risk";

export type Slide02Status =
  | "BOOTSTRAPPED"
  | "INTERACTIVE"
  | "REPLAY_READY"
  | "REPLAY_APPLIED"
  | "REPLAY_ERROR";

export type ReplayEventKind =
  | "set-route"
  | "set-strictness"
  | "set-budget"
  | "set-latency"
  | "reset-constraints";

export interface RouteOption {
  id: Slide02RouteId;
  label: string;
  synopsis: string;
  rationale: string;
  routeCode: "OPS" | "THR" | "MRG" | "QLT";
  modelBias: {
    readiness: number;
    continuity: number;
    risk: number;
  };
}

export interface ConstraintValues {
  strictness: number;
  budgetGuard: number;
  latencyGuard: number;
}

export interface ConstraintNarrative {
  tightnessLabel: string;
  budgetPosture: string;
  latencyPosture: string;
  summary: string;
}

export interface SystemEvidenceRow {
  key: "route" | "fit" | "capacity" | "latency" | "verdict";
  label: string;
  value: string;
  status: EvidenceStatus;
  rationale: string;
}

export interface SystemResponse {
  executionReadiness: number;
  continuityIndex: number;
  riskPressure: number;
  operabilityBand: OperabilityBand;
  decision: DecisionCode;
  signature: string;
  narrative: string;
  evidenceRows: SystemEvidenceRow[];
  narrativeByAxis: {
    readiness: string;
    continuity: string;
    risk: string;
  };
}

export interface Slide02SeedContext {
  route: Slide02RouteId;
  routeSource: RouteSourceKind;
  constraints: ConstraintValues;
  rawRouteInput?: string;
}

export interface ReplayEvent {
  seq: number;
  kind: ReplayEventKind;
  value?: Slide02RouteId | number | null;
}

export interface ReplayBase {
  route: Slide02RouteId;
  constraints: ConstraintValues;
}

export interface ReplayMeta {
  createdBy: string;
  createdAt: string;
  signature: string;
}

export interface ReplayPayload {
  version: "slide02.replay.v1";
  base: ReplayBase;
  trace: ReplayEvent[];
  meta: ReplayMeta;
}

export interface ReplayParseResult {
  ok: boolean;
  payload: ReplayPayload | null;
  error: string | null;
}

export interface Slide02ReplayState {
  stagedJson: string;
  stagedPayload: ReplayPayload | null;
  stagedError: string | null;
  lastAppliedSignature: string | null;
}

export interface Slide02TraceEntry {
  seq: number;
  action:
    | "boot"
    | "set-route"
    | "set-strictness"
    | "set-budget"
    | "set-latency"
    | "reset-constraints"
    | "replay-applied";
  before: {
    route: Slide02RouteId;
    constraints: ConstraintValues;
    signature: string;
  };
  after: {
    route: Slide02RouteId;
    constraints: ConstraintValues;
    signature: string;
  };
}

export interface Slide02MachineState {
  status: Slide02Status;
  seed: Slide02SeedContext;
  route: Slide02RouteId;
  constraints: ConstraintValues;
  response: SystemResponse;
  trace: Slide02TraceEntry[];
  hudOpen: boolean;
  replay: Slide02ReplayState;
  sequence: number;
}

export type Slide02MachineAction =
  | { type: "BOOT"; seed?: Partial<Slide02SeedContext> | null }
  | { type: "SET_ROUTE"; route: string }
  | { type: "SET_STRICTNESS"; value: number }
  | { type: "SET_BUDGET_GUARD"; value: number }
  | { type: "SET_LATENCY_GUARD"; value: number }
  | { type: "RESET_CONSTRAINTS" }
  | { type: "TOGGLE_HUD" }
  | { type: "REPLAY_STAGE_JSON"; json: string }
  | { type: "REPLAY_APPLY_STAGED" }
  | { type: "REPLAY_CLEAR" };

export interface ReplayApplicationResult {
  route: Slide02RouteId;
  constraints: ConstraintValues;
  response: SystemResponse;
  trace: ReplayEvent[];
}

export interface Slide02UiStrings {
  heading: string;
  subheading: string;
  hint: string;
  replayHint: string;
}

export interface Slide02SceneProps {
  uiStrings?: Partial<Slide02UiStrings>;
}
