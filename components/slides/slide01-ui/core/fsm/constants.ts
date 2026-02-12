import {
  CriterionDefinition,
  CriterionId,
  GestureMetrics,
  RouteDecision,
  RouteDefinition,
  RouteId,
  ScoreSnapshot,
} from "./types";

export const SLIDE01_TRACE_VERSION = "slide01.trace.v1" as const;
export const SLIDE01_TRACE_SOURCE = "Slide01" as const;
export const SLIDE01_TIE_BREAKER: RouteId = "B";
export const SLIDE01_MOVEMENT_THRESHOLD = 0.045;

export const SLIDE01_CRITERIA: CriterionDefinition[] = [
  {
    id: "deliverySpeed",
    label: "Delivery Speed",
    description: "How quickly the route can stabilize immediate operations.",
    weight: 0.22,
  },
  {
    id: "operationalRisk",
    label: "Operational Risk",
    description: "How strongly the route reduces recurring production risk.",
    weight: 0.24,
  },
  {
    id: "scalability",
    label: "Scalability",
    description: "How well the route supports growth and multi-line deployment.",
    weight: 0.22,
  },
  {
    id: "budgetPredictability",
    label: "Budget Predictability",
    description: "How stable and predictable execution cost remains over time.",
    weight: 0.16,
  },
  {
    id: "knowledgeRetention",
    label: "Knowledge Retention",
    description: "How effectively process knowledge remains inside the organization.",
    weight: 0.16,
  },
];

export const SLIDE01_ROUTES: Record<RouteId, RouteDefinition> = {
  A: {
    id: "A",
    label: "Route A",
    name: "Rapid Stabilization",
    summary: "Fast mitigation to reduce immediate pressure.",
    profiles: {
      deliverySpeed: 0.92,
      operationalRisk: 0.38,
      scalability: 0.34,
      budgetPredictability: 0.45,
      knowledgeRetention: 0.32,
    },
  },
  B: {
    id: "B",
    label: "Route B",
    name: "Standardized Scale Path",
    summary: "Structured rollout with durable controls and evidence.",
    profiles: {
      deliverySpeed: 0.58,
      operationalRisk: 0.9,
      scalability: 0.9,
      budgetPredictability: 0.84,
      knowledgeRetention: 0.9,
    },
  },
};

export const CRITERION_LABELS: Record<CriterionId, string> = {
  deliverySpeed: "Delivery Speed",
  operationalRisk: "Operational Risk",
  scalability: "Scalability",
  budgetPredictability: "Budget Predictability",
  knowledgeRetention: "Knowledge Retention",
};

export const SCORING_EXPLANATION_PRIORITY: CriterionId[] = [
  "operationalRisk",
  "scalability",
  "budgetPredictability",
  "knowledgeRetention",
  "deliverySpeed",
];

export const EMPTY_METRICS: GestureMetrics = {
  sampleCount: 0,
  totalDistance: 0,
  horizontalTravel: 0,
  verticalTravel: 0,
  meanX: 0.5,
  meanY: 0.5,
  spreadX: 0,
  spreadY: 0,
  momentum: 0,
  stability: 1,
  commitment: 0,
  urgency: 0,
  biasRight: 0.5,
  deliberation: 0.5,
};

export const EMPTY_SCORE: ScoreSnapshot = {
  routeA: 50,
  routeB: 50,
  difference: 0,
  winner: SLIDE01_TIE_BREAKER,
  tie: true,
  signals: [],
  contributions: [],
};

export const EMPTY_DECISION: RouteDecision = {
  winner: null,
  headline: "No route selected yet",
  summary: "Start a deliberate drag gesture to weigh criteria.",
  reasons: [
    "Click and drag in the weighing arena to begin.",
    "Release pointer to commit and resolve the deterministic decision.",
  ],
};

export const SLIDE01_TEST_IDS = {
  scene: "slide01-scene",
  title: "slide01-title",
  subtitle: "slide01-subtitle",
  phaseChip: "slide01-phase-chip",
  mainGrid: "slide01-main-grid",
  routesPanel: "slide01-routes-panel",
  routeCardA: "slide01-route-card-A",
  routeCardB: "slide01-route-card-B",
  routeTitleA: "slide01-route-title-A",
  routeTitleB: "slide01-route-title-B",
  routeTagA: "slide01-route-tag-A",
  routeTagB: "slide01-route-tag-B",
  routeScoreA: "slide01-route-score-A",
  routeScoreB: "slide01-route-score-B",
  routeSelectedA: "slide01-route-selected-A",
  routeSelectedB: "slide01-route-selected-B",
  weighPanel: "slide01-weigh-panel",
  weighInstruction: "slide01-weigh-instruction",
  weighArena: "slide01-weigh-arena",
  weighArenaGrid: "slide01-weigh-arena-grid",
  weighAxisX: "slide01-weigh-axis-x",
  weighAxisY: "slide01-weigh-axis-y",
  pointerDot: "slide01-pointer-dot",
  pointerStartDot: "slide01-pointer-start-dot",
  liveBias: "slide01-live-bias",
  liveDeliberation: "slide01-live-deliberation",
  liveUrgency: "slide01-live-urgency",
  liveSamples: "slide01-live-samples",
  outcomePanel: "slide01-outcome-panel",
  outcomeState: "slide01-outcome-state",
  outcomeHeadline: "slide01-outcome-headline",
  outcomeScore: "slide01-outcome-score",
  outcomeBullets: "slide01-outcome-bullets",
  outcomeWinner: "slide01-outcome-winner",
  outcomeReset: "slide01-outcome-reset",
  replayPanel: "slide01-replay-panel",
  traceLength: "slide01-trace-length",
  traceExport: "slide01-trace-export",
  traceCopy: "slide01-trace-copy",
  replayInput: "slide01-replay-input",
  replayLoadSample: "slide01-replay-load-sample",
  replayApply: "slide01-replay-apply",
  replayStatus: "slide01-replay-status",
  hudToggle: "slide01-hud-toggle",
  hudPanel: "slide01-hud-panel",
  hudPhase: "slide01-hud-phase",
  hudScoreA: "slide01-hud-score-A",
  hudScoreB: "slide01-hud-score-B",
  hudDelta: "slide01-hud-delta",
  hudTrace: "slide01-hud-trace",
  hudTransitionCount: "slide01-hud-transition-count",
} as const;

export const SLIDE01_OPTIONAL_CRITERION_SIGNAL_TEST_IDS: Record<CriterionId, string> = {
  deliverySpeed: "slide01-criterion-signal-deliverySpeed",
  operationalRisk: "slide01-criterion-signal-operationalRisk",
  scalability: "slide01-criterion-signal-scalability",
  budgetPredictability: "slide01-criterion-signal-budgetPredictability",
  knowledgeRetention: "slide01-criterion-signal-knowledgeRetention",
};
