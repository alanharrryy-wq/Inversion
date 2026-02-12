import { ConstraintValues, DecisionCode, OperabilityBand, ReplayEvent, Slide02RouteId } from "./types";

export interface ModelScenario {
  id: string;
  route: Slide02RouteId;
  constraints: ConstraintValues;
  expectedDecision: DecisionCode;
  expectedBand: OperabilityBand;
  expectedReadinessRange: [number, number];
  expectedContinuityRange: [number, number];
  expectedRiskRange: [number, number];
}

export interface ReplayScenario {
  id: string;
  base: {
    route: Slide02RouteId;
    constraints: ConstraintValues;
  };
  trace: ReplayEvent[];
  expected: {
    route: Slide02RouteId;
    constraints: ConstraintValues;
    decision: DecisionCode;
    band: OperabilityBand;
  };
}

export const MODEL_SCENARIOS: ModelScenario[] = [
  {
    id: "default-baseline",
    route: "stabilize-operations",
    constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [56, 74],
    expectedContinuityRange: [55, 75],
    expectedRiskRange: [30, 55],
  },
  {
    id: "ops-budget-collapse",
    route: "stabilize-operations",
    constraints: { strictness: 56, budgetGuard: 10, latencyGuard: 38 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [35, 55],
    expectedContinuityRange: [40, 62],
    expectedRiskRange: [45, 72],
  },
  {
    id: "ops-latency-heavy",
    route: "stabilize-operations",
    constraints: { strictness: 58, budgetGuard: 65, latencyGuard: 86 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [30, 55],
    expectedContinuityRange: [20, 55],
    expectedRiskRange: [55, 95],
  },
  {
    id: "ops-hard-lock-funded",
    route: "stabilize-operations",
    constraints: { strictness: 84, budgetGuard: 87, latencyGuard: 20 },
    expectedDecision: "PROCEED+",
    expectedBand: "Hardened",
    expectedReadinessRange: [68, 90],
    expectedContinuityRange: [70, 95],
    expectedRiskRange: [8, 35],
  },
  {
    id: "throughput-balanced",
    route: "throughput-push",
    constraints: { strictness: 52, budgetGuard: 63, latencyGuard: 41 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [60, 84],
    expectedContinuityRange: [40, 66],
    expectedRiskRange: [38, 64],
  },
  {
    id: "throughput-latency-overhang",
    route: "throughput-push",
    constraints: { strictness: 44, budgetGuard: 71, latencyGuard: 84 },
    expectedDecision: "TIGHTEN",
    expectedBand: "Managed",
    expectedReadinessRange: [42, 68],
    expectedContinuityRange: [10, 38],
    expectedRiskRange: [68, 95],
  },
  {
    id: "throughput-low-budget",
    route: "throughput-push",
    constraints: { strictness: 48, budgetGuard: 22, latencyGuard: 44 },
    expectedDecision: "TIGHTEN",
    expectedBand: "Managed",
    expectedReadinessRange: [28, 52],
    expectedContinuityRange: [20, 46],
    expectedRiskRange: [55, 80],
  },
  {
    id: "throughput-high-budget-low-latency",
    route: "throughput-push",
    constraints: { strictness: 41, budgetGuard: 86, latencyGuard: 18 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [72, 94],
    expectedContinuityRange: [44, 70],
    expectedRiskRange: [30, 55],
  },
  {
    id: "throughput-hard-lock-funded",
    route: "throughput-push",
    constraints: { strictness: 92, budgetGuard: 92, latencyGuard: 14 },
    expectedDecision: "PROCEED+",
    expectedBand: "Hardened",
    expectedReadinessRange: [76, 100],
    expectedContinuityRange: [64, 95],
    expectedRiskRange: [0, 45],
  },
  {
    id: "margin-baseline",
    route: "margin-defense",
    constraints: { strictness: 57, budgetGuard: 60, latencyGuard: 38 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [52, 76],
    expectedContinuityRange: [46, 72],
    expectedRiskRange: [32, 58],
  },
  {
    id: "margin-strict-low-budget",
    route: "margin-defense",
    constraints: { strictness: 88, budgetGuard: 28, latencyGuard: 30 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [40, 64],
    expectedContinuityRange: [48, 74],
    expectedRiskRange: [24, 48],
  },
  {
    id: "margin-low-strict-low-budget",
    route: "margin-defense",
    constraints: { strictness: 20, budgetGuard: 20, latencyGuard: 50 },
    expectedDecision: "HOLD",
    expectedBand: "Fragile",
    expectedReadinessRange: [20, 42],
    expectedContinuityRange: [8, 34],
    expectedRiskRange: [62, 90],
  },
  {
    id: "margin-latency-crisis",
    route: "margin-defense",
    constraints: { strictness: 62, budgetGuard: 56, latencyGuard: 94 },
    expectedDecision: "TIGHTEN",
    expectedBand: "Managed",
    expectedReadinessRange: [20, 44],
    expectedContinuityRange: [6, 45],
    expectedRiskRange: [60, 100],
  },
  {
    id: "margin-hard-lock-funded",
    route: "margin-defense",
    constraints: { strictness: 84, budgetGuard: 84, latencyGuard: 16 },
    expectedDecision: "PROCEED+",
    expectedBand: "Hardened",
    expectedReadinessRange: [68, 96],
    expectedContinuityRange: [66, 94],
    expectedRiskRange: [6, 32],
  },
  {
    id: "quality-baseline",
    route: "quality-ringfence",
    constraints: { strictness: 62, budgetGuard: 58, latencyGuard: 34 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [50, 74],
    expectedContinuityRange: [56, 82],
    expectedRiskRange: [20, 48],
  },
  {
    id: "quality-hard-lock",
    route: "quality-ringfence",
    constraints: { strictness: 90, budgetGuard: 64, latencyGuard: 12 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [58, 84],
    expectedContinuityRange: [74, 100],
    expectedRiskRange: [0, 24],
  },
  {
    id: "quality-low-budget",
    route: "quality-ringfence",
    constraints: { strictness: 74, budgetGuard: 18, latencyGuard: 28 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [28, 52],
    expectedContinuityRange: [44, 68],
    expectedRiskRange: [36, 62],
  },
  {
    id: "quality-latency-overrun",
    route: "quality-ringfence",
    constraints: { strictness: 72, budgetGuard: 52, latencyGuard: 82 },
    expectedDecision: "PROCEED",
    expectedBand: "Managed",
    expectedReadinessRange: [26, 50],
    expectedContinuityRange: [34, 58],
    expectedRiskRange: [50, 84],
  },
  {
    id: "quality-extreme-latency-low-budget",
    route: "quality-ringfence",
    constraints: { strictness: 66, budgetGuard: 20, latencyGuard: 98 },
    expectedDecision: "HOLD",
    expectedBand: "Fragile",
    expectedReadinessRange: [0, 28],
    expectedContinuityRange: [0, 45],
    expectedRiskRange: [60, 100],
  },
  {
    id: "ops-min-values",
    route: "stabilize-operations",
    constraints: { strictness: 0, budgetGuard: 0, latencyGuard: 0 },
    expectedDecision: "TIGHTEN",
    expectedBand: "Managed",
    expectedReadinessRange: [20, 40],
    expectedContinuityRange: [20, 42],
    expectedRiskRange: [48, 74],
  },
  {
    id: "ops-max-values",
    route: "stabilize-operations",
    constraints: { strictness: 100, budgetGuard: 100, latencyGuard: 100 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [58, 84],
    expectedContinuityRange: [46, 72],
    expectedRiskRange: [40, 82],
  },
  {
    id: "throughput-min-values",
    route: "throughput-push",
    constraints: { strictness: 0, budgetGuard: 0, latencyGuard: 0 },
    expectedDecision: "HOLD",
    expectedBand: "Fragile",
    expectedReadinessRange: [30, 56],
    expectedContinuityRange: [10, 34],
    expectedRiskRange: [60, 88],
  },
  {
    id: "throughput-max-values",
    route: "throughput-push",
    constraints: { strictness: 100, budgetGuard: 100, latencyGuard: 100 },
    expectedDecision: "TIGHTEN",
    expectedBand: "Stable",
    expectedReadinessRange: [66, 92],
    expectedContinuityRange: [36, 62],
    expectedRiskRange: [64, 90],
  },
  {
    id: "margin-min-values",
    route: "margin-defense",
    constraints: { strictness: 0, budgetGuard: 0, latencyGuard: 0 },
    expectedDecision: "HOLD",
    expectedBand: "Fragile",
    expectedReadinessRange: [16, 44],
    expectedContinuityRange: [16, 44],
    expectedRiskRange: [54, 80],
  },
  {
    id: "margin-max-values",
    route: "margin-defense",
    constraints: { strictness: 100, budgetGuard: 100, latencyGuard: 100 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [56, 84],
    expectedContinuityRange: [48, 76],
    expectedRiskRange: [50, 84],
  },
  {
    id: "quality-min-values",
    route: "quality-ringfence",
    constraints: { strictness: 0, budgetGuard: 0, latencyGuard: 0 },
    expectedDecision: "HOLD",
    expectedBand: "Managed",
    expectedReadinessRange: [12, 36],
    expectedContinuityRange: [28, 54],
    expectedRiskRange: [42, 70],
  },
  {
    id: "quality-max-values",
    route: "quality-ringfence",
    constraints: { strictness: 100, budgetGuard: 100, latencyGuard: 100 },
    expectedDecision: "PROCEED",
    expectedBand: "Stable",
    expectedReadinessRange: [54, 78],
    expectedContinuityRange: [54, 82],
    expectedRiskRange: [40, 76],
  },
];

export const REPLAY_SCENARIOS: ReplayScenario[] = [
  {
    id: "route-plus-three-controls",
    base: {
      route: "stabilize-operations",
      constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    },
    trace: [
      { seq: 1, kind: "set-route", value: "margin-defense" },
      { seq: 2, kind: "set-strictness", value: 73 },
      { seq: 3, kind: "set-budget", value: 74 },
      { seq: 4, kind: "set-latency", value: 22 },
    ],
    expected: {
      route: "margin-defense",
      constraints: { strictness: 73, budgetGuard: 74, latencyGuard: 22 },
      decision: "PROCEED",
      band: "Stable",
    },
  },
  {
    id: "reset-after-tightening",
    base: {
      route: "throughput-push",
      constraints: { strictness: 42, budgetGuard: 64, latencyGuard: 48 },
    },
    trace: [
      { seq: 1, kind: "set-budget", value: 18 },
      { seq: 2, kind: "set-latency", value: 90 },
      { seq: 3, kind: "reset-constraints", value: null },
    ],
    expected: {
      route: "throughput-push",
      constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
      decision: "PROCEED",
      band: "Stable",
    },
  },
  {
    id: "multi-route-handoffs",
    base: {
      route: "quality-ringfence",
      constraints: { strictness: 68, budgetGuard: 60, latencyGuard: 32 },
    },
    trace: [
      { seq: 1, kind: "set-route", value: "throughput-push" },
      { seq: 2, kind: "set-route", value: "margin-defense" },
      { seq: 3, kind: "set-route", value: "quality-ringfence" },
      { seq: 4, kind: "set-strictness", value: 88 },
      { seq: 5, kind: "set-budget", value: 70 },
      { seq: 6, kind: "set-latency", value: 16 },
    ],
    expected: {
      route: "quality-ringfence",
      constraints: { strictness: 88, budgetGuard: 70, latencyGuard: 16 },
      decision: "PROCEED",
      band: "Stable",
    },
  },
  {
    id: "clamp-out-of-range-values",
    base: {
      route: "stabilize-operations",
      constraints: { strictness: 50, budgetGuard: 50, latencyGuard: 50 },
    },
    trace: [
      { seq: 1, kind: "set-strictness", value: 1000 },
      { seq: 2, kind: "set-budget", value: -500 },
      { seq: 3, kind: "set-latency", value: 300 },
    ],
    expected: {
      route: "stabilize-operations",
      constraints: { strictness: 100, budgetGuard: 0, latencyGuard: 100 },
      decision: "HOLD",
      band: "Fragile",
    },
  },
  {
    id: "route-alias-resolution",
    base: {
      route: "throughput-push",
      constraints: { strictness: 40, budgetGuard: 70, latencyGuard: 20 },
    },
    trace: [
      { seq: 1, kind: "set-route", value: "margin-defense" },
      { seq: 2, kind: "set-route", value: "quality-ringfence" },
    ],
    expected: {
      route: "quality-ringfence",
      constraints: { strictness: 40, budgetGuard: 70, latencyGuard: 20 },
      decision: "PROCEED",
      band: "Stable",
    },
  },
];
