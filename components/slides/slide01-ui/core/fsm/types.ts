export type Slide01Phase = "idle" | "aiming" | "weighing" | "committed" | "resolved";

export type RouteId = "A" | "B";

export type CriterionId =
  | "deliverySpeed"
  | "operationalRisk"
  | "scalability"
  | "budgetPredictability"
  | "knowledgeRetention";

export type ReplayStatus = "idle" | "ready" | "replayed" | "error";

export type PointerKind = "pointerdown" | "pointermove" | "pointerup";

export type PointerSource = "live" | "replay";

export interface CriterionDefinition {
  id: CriterionId;
  label: string;
  description: string;
  weight: number;
}

export interface RouteDefinition {
  id: RouteId;
  label: string;
  name: string;
  summary: string;
  profiles: Record<CriterionId, number>;
}

export interface PointSample {
  x: number;
  y: number;
}

export interface GestureSample extends PointSample {
  seq: number;
  kind: PointerKind;
  pointerId: number;
  targetId: string;
  button: number;
  dx: number;
  dy: number;
  distance: number;
}

export interface GestureMetrics {
  sampleCount: number;
  totalDistance: number;
  horizontalTravel: number;
  verticalTravel: number;
  meanX: number;
  meanY: number;
  spreadX: number;
  spreadY: number;
  momentum: number;
  stability: number;
  commitment: number;
  urgency: number;
  biasRight: number;
  deliberation: number;
}

export interface CriterionSignal {
  criterionId: CriterionId;
  emphasis: number;
}

export interface CriterionContribution {
  criterionId: CriterionId;
  label: string;
  weight: number;
  emphasis: number;
  routeA: number;
  routeB: number;
  delta: number;
}

export interface ScoreSnapshot {
  routeA: number;
  routeB: number;
  difference: number;
  winner: RouteId;
  tie: boolean;
  signals: CriterionSignal[];
  contributions: CriterionContribution[];
}

export interface RouteDecision {
  winner: RouteId | null;
  headline: string;
  summary: string;
  reasons: string[];
}

export interface ReplayMeta {
  status: ReplayStatus;
  message: string;
  lastEnvelopeHash: string;
}

export interface Slide01PointerTraceEvent {
  kind: PointerKind;
  seq: number;
  x: number;
  y: number;
  pointerId: number;
  button: number;
  targetId: string;
}

export interface Slide01TraceEnvelope {
  version: "slide01.trace.v1";
  source: "Slide01";
  events: Slide01PointerTraceEvent[];
}

export interface Slide01State {
  phase: Slide01Phase;
  phaseHistory: Slide01Phase[];
  transitionCount: number;
  activePointerId: number | null;
  pointerDown: boolean;
  gestureStart: PointSample | null;
  pointerCurrent: PointSample | null;
  gestureSamples: GestureSample[];
  metrics: GestureMetrics;
  score: ScoreSnapshot;
  decision: RouteDecision;
  trace: Slide01PointerTraceEvent[];
  hudVisible: boolean;
  replay: ReplayMeta;
  routes: Record<RouteId, RouteDefinition>;
  criteria: CriterionDefinition[];
}

export type Slide01Action =
  | {
      type: "POINTER_EVENT";
      source: PointerSource;
      event: Slide01PointerTraceEvent;
    }
  | {
      type: "RESOLVE_COMMITTED";
      source: PointerSource;
      reason: "pointer-release" | "replay";
    }
  | {
      type: "RESET";
    }
  | {
      type: "TOGGLE_HUD";
    }
  | {
      type: "REPLAY_APPLY";
      replayedState: Slide01State;
      envelopeHash: string;
    }
  | {
      type: "REPLAY_ERROR";
      message: string;
    }
  | {
      type: "REPLAY_NOTE";
      message: string;
    };

export interface Slide01ReplayResult {
  ok: boolean;
  message: string;
  envelopeHash: string;
  state: Slide01State;
}
