import {
  ConstraintProfile,
  EvidenceAxis,
  EvidenceModelInput,
  EvidenceStepDefinition,
  RouteProfile,
} from "./types";

const axisWeights = (
  fit: number,
  defensibility: number,
  velocity: number,
  resilience: number
): Record<EvidenceAxis, number> => ({
  fit,
  defensibility,
  velocity,
  resilience,
});

export const ROUTE_LIBRARY: RouteProfile[] = [
  {
    id: "route-proof-first",
    label: "Proof-First Route",
    thesis:
      "Prioritize defensible evidence generation before scale assumptions so board-level decisions are based on verifiable operational truth.",
    baselineConfidence: 46,
    baselineUncertainty: 74,
    axisWeights: axisWeights(0.31, 0.34, 0.17, 0.18),
    routeStrength: 83,
  },
  {
    id: "route-speed-first",
    label: "Speed-First Route",
    thesis:
      "Prioritize deployment speed and post-hoc explanation, accepting higher audit burden in exchange for faster rollout.",
    baselineConfidence: 41,
    baselineUncertainty: 79,
    axisWeights: axisWeights(0.24, 0.19, 0.41, 0.16),
    routeStrength: 72,
  },
  {
    id: "route-min-capex",
    label: "Capex-Min Route",
    thesis:
      "Prioritize low fixed cost by reducing instrumentation depth and delaying traceability infrastructure.",
    baselineConfidence: 39,
    baselineUncertainty: 82,
    axisWeights: axisWeights(0.26, 0.21, 0.29, 0.24),
    routeStrength: 68,
  },
  {
    id: "route-balanced",
    label: "Balanced Route",
    thesis:
      "Pursue balanced execution while preserving enough traceability to satisfy external stakeholders.",
    baselineConfidence: 44,
    baselineUncertainty: 76,
    axisWeights: axisWeights(0.29, 0.27, 0.23, 0.21),
    routeStrength: 76,
  },
];

export const DEFAULT_ROUTE: RouteProfile = ROUTE_LIBRARY[0];

export const DEFAULT_CONSTRAINTS: ConstraintProfile[] = [
  {
    id: "constraint-audit-window",
    label: "Audit response window <= 24h",
    axis: "defensibility",
    severity: 93,
    satisfied: true,
    penaltyIfUnsatisfied: 24,
    rationale:
      "Without immediate evidence lineage the team cannot provide defensible answers inside investor or regulator timelines.",
  },
  {
    id: "constraint-ops-variability",
    label: "Operational variance must stay inside control limits",
    axis: "resilience",
    severity: 88,
    satisfied: true,
    penaltyIfUnsatisfied: 19,
    rationale:
      "High variance creates contradictory narratives and undermines decision confidence.",
  },
  {
    id: "constraint-board-translation",
    label: "Signals must be translatable to board language",
    axis: "fit",
    severity: 79,
    satisfied: true,
    penaltyIfUnsatisfied: 14,
    rationale:
      "If evidence cannot be translated into strategic outcomes, route acceptance collapses.",
  },
  {
    id: "constraint-latency",
    label: "Telemetry freshness <= 5 seconds",
    axis: "velocity",
    severity: 73,
    satisfied: true,
    penaltyIfUnsatisfied: 12,
    rationale:
      "Late signals encourage post-fact interpretation and weaken the route claim.",
  },
  {
    id: "constraint-lineage",
    label: "Evidence chain-of-custody must remain intact",
    axis: "defensibility",
    severity: 91,
    satisfied: true,
    penaltyIfUnsatisfied: 26,
    rationale:
      "Broken lineage introduces audit rejection risk and confidence collapse.",
  },
  {
    id: "constraint-change-discipline",
    label: "Route updates require explicit rationale",
    axis: "fit",
    severity: 67,
    satisfied: true,
    penaltyIfUnsatisfied: 10,
    rationale:
      "Unstructured route changes invalidate comparative outcome claims.",
  },
  {
    id: "constraint-cost-pressure",
    label: "Execution cost remains inside approved band",
    axis: "velocity",
    severity: 64,
    satisfied: true,
    penaltyIfUnsatisfied: 8,
    rationale:
      "Budget overruns reduce confidence even when technical outputs look promising.",
  },
  {
    id: "constraint-incident-recovery",
    label: "Recoverability under incident stress",
    axis: "resilience",
    severity: 75,
    satisfied: true,
    penaltyIfUnsatisfied: 15,
    rationale:
      "If incident recovery is opaque, the route cannot be trusted under stress.",
  },
];

export const EVIDENCE_STEPS: EvidenceStepDefinition[] = [
  {
    id: "E1",
    ordinal: 1,
    title: "Visibility Baseline",
    purpose:
      "Demonstrate that the chosen route reveals operational truth at source, not through post-fact reports.",
    unlockThreshold: 0.72,
    baseConfidenceGain: 14,
    baseUncertaintyDrop: 20,
    axisInfluence: {
      defensibility: 0.55,
      fit: 0.2,
      velocity: 0.15,
      resilience: 0.1,
    },
    rationale: [
      "Source-level signals become attributable immediately.",
      "Initial uncertainty drops when visibility covers high-severity constraints.",
      "Executives can evaluate route quality without narrative lag.",
    ],
  },
  {
    id: "E2",
    ordinal: 2,
    title: "Constraint Fit",
    purpose:
      "Show that route behavior satisfies hard constraints without hidden tradeoff debt.",
    unlockThreshold: 0.78,
    baseConfidenceGain: 17,
    baseUncertaintyDrop: 18,
    axisInfluence: {
      fit: 0.42,
      defensibility: 0.28,
      resilience: 0.18,
      velocity: 0.12,
    },
    rationale: [
      "Constraint-fit evidence links route assumptions to observed outcomes.",
      "Uncertainty narrows as unsatisfied-constraint risk is reduced.",
      "Decision quality improves because tradeoffs become explicit and bounded.",
    ],
  },
  {
    id: "E3",
    ordinal: 3,
    title: "Variance Suppression",
    purpose:
      "Prove that under constraints the route converges toward stable, defensible outcomes.",
    unlockThreshold: 0.83,
    baseConfidenceGain: 19,
    baseUncertaintyDrop: 21,
    axisInfluence: {
      resilience: 0.38,
      defensibility: 0.25,
      fit: 0.2,
      velocity: 0.17,
    },
    rationale: [
      "Outcome variance narrows under real operating pressure.",
      "The evidence trail remains exportable and audit-ready.",
      "Confidence is promoted from plausible to decision-grade.",
    ],
  },
];

export const STEP_ORDER = EVIDENCE_STEPS.map((step) => step.id);

export const EVIDENCE_CARD_COPY: Record<string, { headline: string; body: string; metricLabel: string }> = {
  E1: {
    headline: "Prove source-level visibility",
    body:
      "The route only earns trust when signals are visible at the moment they occur, with explicit attribution and no retrospective stitching.",
    metricLabel: "Signal attribution coverage",
  },
  E2: {
    headline: "Prove fit against constraints",
    body:
      "Route quality is measured by constraint compliance under pressure, not by isolated wins in unconstrained environments.",
    metricLabel: "Constraint-fit confidence",
  },
  E3: {
    headline: "Prove stable outcomes",
    body:
      "Confidence becomes board-ready when variance contracts while traceability remains intact.",
    metricLabel: "Variance suppression index",
  },
};

const cloneConstraints = (constraints: ConstraintProfile[]): ConstraintProfile[] =>
  constraints.map((constraint) => ({ ...constraint }));

export const createDefaultEvidenceModelInput = (): EvidenceModelInput => ({
  route: { ...DEFAULT_ROUTE },
  constraints: cloneConstraints(DEFAULT_CONSTRAINTS),
  steps: EVIDENCE_STEPS.map((step) => ({
    ...step,
    axisInfluence: { ...step.axisInfluence },
    rationale: [...step.rationale],
  })),
});

export interface ModelScenario {
  id: string;
  label: string;
  routeId: string;
  reveal: Array<"E1" | "E2" | "E3">;
  expectedBand: "fragile" | "emerging" | "credible" | "dominant";
  expectedSeal: "open" | "forming" | "sealed";
  expectedMinConfidence: number;
  expectedMaxUncertainty: number;
}

export const MODEL_SCENARIOS: ModelScenario[] = [
  {
    id: "scn-01",
    label: "proof-first baseline no reveal",
    routeId: "route-proof-first",
    reveal: [],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 40,
    expectedMaxUncertainty: 80,
  },
  {
    id: "scn-02",
    label: "proof-first after E1",
    routeId: "route-proof-first",
    reveal: ["E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 58,
    expectedMaxUncertainty: 58,
  },
  {
    id: "scn-03",
    label: "proof-first after E1+E2",
    routeId: "route-proof-first",
    reveal: ["E1", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 73,
    expectedMaxUncertainty: 45,
  },
  {
    id: "scn-04",
    label: "proof-first sealed",
    routeId: "route-proof-first",
    reveal: ["E1", "E2", "E3"],
    expectedBand: "dominant",
    expectedSeal: "sealed",
    expectedMinConfidence: 85,
    expectedMaxUncertainty: 30,
  },
  {
    id: "scn-05",
    label: "speed-first no reveal",
    routeId: "route-speed-first",
    reveal: [],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 34,
    expectedMaxUncertainty: 86,
  },
  {
    id: "scn-06",
    label: "speed-first after E1",
    routeId: "route-speed-first",
    reveal: ["E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 50,
    expectedMaxUncertainty: 65,
  },
  {
    id: "scn-07",
    label: "speed-first after E1+E2",
    routeId: "route-speed-first",
    reveal: ["E1", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 66,
    expectedMaxUncertainty: 52,
  },
  {
    id: "scn-08",
    label: "speed-first sealed",
    routeId: "route-speed-first",
    reveal: ["E1", "E2", "E3"],
    expectedBand: "dominant",
    expectedSeal: "sealed",
    expectedMinConfidence: 82,
    expectedMaxUncertainty: 38,
  },
  {
    id: "scn-09",
    label: "min-capex no reveal",
    routeId: "route-min-capex",
    reveal: [],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 32,
    expectedMaxUncertainty: 88,
  },
  {
    id: "scn-10",
    label: "min-capex after E1",
    routeId: "route-min-capex",
    reveal: ["E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 48,
    expectedMaxUncertainty: 68,
  },
  {
    id: "scn-11",
    label: "min-capex after E1+E2",
    routeId: "route-min-capex",
    reveal: ["E1", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 62,
    expectedMaxUncertainty: 55,
  },
  {
    id: "scn-12",
    label: "min-capex sealed",
    routeId: "route-min-capex",
    reveal: ["E1", "E2", "E3"],
    expectedBand: "credible",
    expectedSeal: "sealed",
    expectedMinConfidence: 78,
    expectedMaxUncertainty: 41,
  },
  {
    id: "scn-13",
    label: "balanced no reveal",
    routeId: "route-balanced",
    reveal: [],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 36,
    expectedMaxUncertainty: 84,
  },
  {
    id: "scn-14",
    label: "balanced after E1",
    routeId: "route-balanced",
    reveal: ["E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 52,
    expectedMaxUncertainty: 63,
  },
  {
    id: "scn-15",
    label: "balanced after E1+E2",
    routeId: "route-balanced",
    reveal: ["E1", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 67,
    expectedMaxUncertainty: 51,
  },
  {
    id: "scn-16",
    label: "balanced sealed",
    routeId: "route-balanced",
    reveal: ["E1", "E2", "E3"],
    expectedBand: "dominant",
    expectedSeal: "sealed",
    expectedMinConfidence: 81,
    expectedMaxUncertainty: 39,
  },
  {
    id: "scn-17",
    label: "proof-first out-of-order reveal request E2 only",
    routeId: "route-proof-first",
    reveal: ["E2"],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 40,
    expectedMaxUncertainty: 80,
  },
  {
    id: "scn-18",
    label: "proof-first duplicate reveal E1 E1",
    routeId: "route-proof-first",
    reveal: ["E1", "E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 58,
    expectedMaxUncertainty: 58,
  },
  {
    id: "scn-19",
    label: "proof-first E1 then E3 skip",
    routeId: "route-proof-first",
    reveal: ["E1", "E3"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 58,
    expectedMaxUncertainty: 58,
  },
  {
    id: "scn-20",
    label: "speed-first duplicate E2 after E1",
    routeId: "route-speed-first",
    reveal: ["E1", "E2", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 66,
    expectedMaxUncertainty: 52,
  },
  {
    id: "scn-21",
    label: "balanced full with duplicate E3",
    routeId: "route-balanced",
    reveal: ["E1", "E2", "E3", "E3"],
    expectedBand: "dominant",
    expectedSeal: "sealed",
    expectedMinConfidence: 81,
    expectedMaxUncertainty: 39,
  },
  {
    id: "scn-22",
    label: "min-capex skip to E3",
    routeId: "route-min-capex",
    reveal: ["E3"],
    expectedBand: "fragile",
    expectedSeal: "open",
    expectedMinConfidence: 32,
    expectedMaxUncertainty: 88,
  },
  {
    id: "scn-23",
    label: "speed-first E1 then E3 then E2",
    routeId: "route-speed-first",
    reveal: ["E1", "E3", "E2"],
    expectedBand: "credible",
    expectedSeal: "forming",
    expectedMinConfidence: 66,
    expectedMaxUncertainty: 52,
  },
  {
    id: "scn-24",
    label: "proof-first complete reversed request",
    routeId: "route-proof-first",
    reveal: ["E3", "E2", "E1"],
    expectedBand: "emerging",
    expectedSeal: "forming",
    expectedMinConfidence: 58,
    expectedMaxUncertainty: 58,
  },
];

export const routeById = (routeId: string): RouteProfile => {
  const found = ROUTE_LIBRARY.find((route) => route.id === routeId);
  if (found) {
    return { ...found, axisWeights: { ...found.axisWeights } };
  }
  return { ...DEFAULT_ROUTE, axisWeights: { ...DEFAULT_ROUTE.axisWeights } };
};

export const cloneConstraintsForRoute = (routeId: string): ConstraintProfile[] => {
  const base = cloneConstraints(DEFAULT_CONSTRAINTS);
  if (routeId === "route-speed-first") {
    return base.map((constraint) => {
      if (constraint.axis === "defensibility") {
        return {
          ...constraint,
          severity: Math.min(99, constraint.severity + 4),
          penaltyIfUnsatisfied: constraint.penaltyIfUnsatisfied + 2,
        };
      }
      return constraint;
    });
  }

  if (routeId === "route-min-capex") {
    return base.map((constraint) => {
      if (constraint.axis === "resilience") {
        return {
          ...constraint,
          severity: Math.min(99, constraint.severity + 6),
          penaltyIfUnsatisfied: constraint.penaltyIfUnsatisfied + 3,
        };
      }
      if (constraint.axis === "velocity") {
        return {
          ...constraint,
          satisfied: false,
        };
      }
      return constraint;
    });
  }

  if (routeId === "route-balanced") {
    return base.map((constraint) => {
      if (constraint.axis === "fit") {
        return {
          ...constraint,
          severity: Math.max(55, constraint.severity - 3),
        };
      }
      return constraint;
    });
  }

  return base;
};

export const createScenarioInput = (routeId: string): EvidenceModelInput => ({
  route: routeById(routeId),
  constraints: cloneConstraintsForRoute(routeId),
  steps: EVIDENCE_STEPS.map((step) => ({
    ...step,
    axisInfluence: { ...step.axisInfluence },
    rationale: [...step.rationale],
  })),
});
