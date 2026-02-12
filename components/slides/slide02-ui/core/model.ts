import {
  ConstraintNarrative,
  ConstraintValues,
  DecisionCode,
  OperabilityBand,
  ReplayBase,
  RouteOption,
  RouteSourceKind,
  Slide02RouteId,
  Slide02SeedContext,
  SystemEvidenceRow,
  SystemResponse,
} from "./types";

export const SLIDE02_REPLAY_VERSION = "slide02.replay.v1" as const;

export const SLIDE02_DEFAULT_ROUTE: Slide02RouteId = "stabilize-operations";

export const SLIDE02_DEFAULT_CONSTRAINTS: ConstraintValues = {
  strictness: 56,
  budgetGuard: 62,
  latencyGuard: 38,
};

export const SLIDE02_MIN_CONSTRAINT = 0;
export const SLIDE02_MAX_CONSTRAINT = 100;

export const SLIDE02_ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "stabilize-operations",
    label: "Stabilize Operations",
    synopsis: "Tighten fundamentals before scaling commitments.",
    rationale:
      "Designed for continuity-first transitions where avoiding execution shocks is the primary objective.",
    routeCode: "OPS",
    modelBias: {
      readiness: 6,
      continuity: 10,
      risk: -8,
    },
  },
  {
    id: "throughput-push",
    label: "Throughput Push",
    synopsis: "Favor velocity with bounded risk windows.",
    rationale:
      "Optimized for growth in flow, while preserving enough guardrails to avoid avoidable disruption.",
    routeCode: "THR",
    modelBias: {
      readiness: 14,
      continuity: -4,
      risk: 10,
    },
  },
  {
    id: "margin-defense",
    label: "Margin Defense",
    synopsis: "Protect unit economics under pressure.",
    rationale:
      "Prioritizes cost discipline and execution precision when capital efficiency is under scrutiny.",
    routeCode: "MRG",
    modelBias: {
      readiness: 2,
      continuity: 2,
      risk: -2,
    },
  },
  {
    id: "quality-ringfence",
    label: "Quality Ringfence",
    synopsis: "Preserve trust-critical quality thresholds.",
    rationale:
      "Suitable for reliability-led operations where defects and variance carry strategic downside.",
    routeCode: "QLT",
    modelBias: {
      readiness: -2,
      continuity: 12,
      risk: -12,
    },
  },
];

const ROUTE_ALIAS_TABLE: Array<{ alias: string; id: Slide02RouteId }> = [
  { alias: "stabilize-operations", id: "stabilize-operations" },
  { alias: "stabilize", id: "stabilize-operations" },
  { alias: "stability", id: "stabilize-operations" },
  { alias: "ops", id: "stabilize-operations" },
  { alias: "operations", id: "stabilize-operations" },
  { alias: "throughput-push", id: "throughput-push" },
  { alias: "throughput", id: "throughput-push" },
  { alias: "speed", id: "throughput-push" },
  { alias: "flow", id: "throughput-push" },
  { alias: "margin-defense", id: "margin-defense" },
  { alias: "margin", id: "margin-defense" },
  { alias: "cost", id: "margin-defense" },
  { alias: "defense", id: "margin-defense" },
  { alias: "quality-ringfence", id: "quality-ringfence" },
  { alias: "quality", id: "quality-ringfence" },
  { alias: "qa", id: "quality-ringfence" },
  { alias: "ringfence", id: "quality-ringfence" },
];

function clampConstraint(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(SLIDE02_MIN_CONSTRAINT, Math.min(SLIDE02_MAX_CONSTRAINT, Math.round(value)));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeRouteInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().toLowerCase();
}

export function isKnownRoute(input: unknown): input is Slide02RouteId {
  return SLIDE02_ROUTE_OPTIONS.some((route) => route.id === input);
}

export function normalizeRoute(input: unknown): Slide02RouteId {
  const normalized = normalizeRouteInput(input);
  const matched = ROUTE_ALIAS_TABLE.find((entry) => entry.alias === normalized);
  if (matched) return matched.id;
  return SLIDE02_DEFAULT_ROUTE;
}

export function getRouteOption(route: Slide02RouteId): RouteOption {
  const found = SLIDE02_ROUTE_OPTIONS.find((item) => item.id === route);
  return found ?? SLIDE02_ROUTE_OPTIONS[0];
}

export function sanitizeConstraints(input: Partial<ConstraintValues> | null | undefined): ConstraintValues {
  return {
    strictness: clampConstraint(input?.strictness ?? SLIDE02_DEFAULT_CONSTRAINTS.strictness, SLIDE02_DEFAULT_CONSTRAINTS.strictness),
    budgetGuard: clampConstraint(input?.budgetGuard ?? SLIDE02_DEFAULT_CONSTRAINTS.budgetGuard, SLIDE02_DEFAULT_CONSTRAINTS.budgetGuard),
    latencyGuard: clampConstraint(input?.latencyGuard ?? SLIDE02_DEFAULT_CONSTRAINTS.latencyGuard, SLIDE02_DEFAULT_CONSTRAINTS.latencyGuard),
  };
}

export function createDefaultSeedContext(): Slide02SeedContext {
  return {
    route: SLIDE02_DEFAULT_ROUTE,
    routeSource: "default",
    constraints: { ...SLIDE02_DEFAULT_CONSTRAINTS },
    rawRouteInput: undefined,
  };
}

export function createSeedContextFromBase(
  base: Partial<ReplayBase> | null | undefined,
  source: RouteSourceKind = "external-payload"
): Slide02SeedContext {
  const route = normalizeRoute(base?.route);
  const constraints = sanitizeConstraints(base?.constraints ?? undefined);
  return {
    route,
    routeSource: source,
    constraints,
    rawRouteInput: typeof base?.route === "string" ? base.route : undefined,
  };
}

function tightnessLabel(strictness: number): string {
  if (strictness <= 24) return "Loose Window";
  if (strictness <= 49) return "Guided";
  if (strictness <= 74) return "Tightened";
  return "Hard Lock";
}

function budgetPosture(budgetGuard: number): string {
  if (budgetGuard <= 29) return "Constrained";
  if (budgetGuard <= 59) return "Balanced";
  return "Funded";
}

function latencyPosture(latencyGuard: number): string {
  if (latencyGuard <= 29) return "Low latency tolerance";
  if (latencyGuard <= 59) return "Moderate latency tolerance";
  return "High latency tolerance";
}

export function describeConstraints(constraints: ConstraintValues): ConstraintNarrative {
  const strictnessLabel = tightnessLabel(constraints.strictness);
  const budgetLabel = budgetPosture(constraints.budgetGuard);
  const latencyLabel = latencyPosture(constraints.latencyGuard);

  const summary = [
    `strictness ${constraints.strictness} (${strictnessLabel})`,
    `budget ${constraints.budgetGuard} (${budgetLabel})`,
    `latency ${constraints.latencyGuard} (${latencyLabel})`,
  ].join(" | ");

  return {
    tightnessLabel: strictnessLabel,
    budgetPosture: budgetLabel,
    latencyPosture: latencyLabel,
    summary,
  };
}

function classifyBand(readiness: number, continuity: number, risk: number): OperabilityBand {
  const confidence = readiness * 0.46 + continuity * 0.34 + (100 - risk) * 0.2;

  if (confidence < 38) return "Fragile";
  if (confidence < 56) return "Managed";
  if (confidence < 74) return "Stable";
  return "Hardened";
}

function classifyDecision(
  readiness: number,
  continuity: number,
  risk: number,
  band: OperabilityBand
): DecisionCode {
  if (readiness < 36 || risk > 78) {
    return "HOLD";
  }

  if (band === "Fragile") {
    return "HOLD";
  }

  if (risk > 64 || continuity < 42) {
    return "TIGHTEN";
  }

  if (band === "Hardened" && readiness > 74 && risk < 42) {
    return "PROCEED+";
  }

  return "PROCEED";
}

function decisionNarrative(decision: DecisionCode): string {
  switch (decision) {
    case "HOLD":
      return "Execution window is too weak. Stabilize constraints before proceeding.";
    case "TIGHTEN":
      return "The route remains viable but constraints need tighter control first.";
    case "PROCEED":
      return "System posture supports controlled execution with active monitoring.";
    case "PROCEED+":
      return "Signal is strong enough for an accelerated but disciplined execution path.";
    default:
      return "Deterministic decision unavailable.";
  }
}

function axisNarrativeReadiness(score: number): string {
  if (score <= 30) return "Readiness is weak and sequencing risk is elevated.";
  if (score <= 50) return "Readiness is partial; execution can stall under variance.";
  if (score <= 70) return "Readiness is serviceable with expected operational friction.";
  if (score <= 85) return "Readiness is strong and supports deliberate scaling.";
  return "Readiness is very strong and can absorb controlled acceleration.";
}

function axisNarrativeContinuity(score: number): string {
  if (score <= 30) return "Continuity is unstable; handoff points are brittle.";
  if (score <= 50) return "Continuity is moderate; process gaps remain visible.";
  if (score <= 70) return "Continuity is coherent and failures are contained.";
  if (score <= 85) return "Continuity is robust and rollback exposure is low.";
  return "Continuity is hardened with high operational resilience.";
}

function axisNarrativeRisk(score: number): string {
  if (score <= 25) return "Risk pressure is low and manageable.";
  if (score <= 45) return "Risk pressure is moderate with clear controls.";
  if (score <= 65) return "Risk pressure is elevated and should stay monitored.";
  if (score <= 80) return "Risk pressure is high and can degrade delivery confidence.";
  return "Risk pressure is critical and likely to disrupt commitments.";
}

function evidenceStatusFromScore(score: number, higherIsBetter: boolean): "good" | "watch" | "risk" {
  const normalized = higherIsBetter ? score : 100 - score;
  if (normalized >= 70) return "good";
  if (normalized >= 45) return "watch";
  return "risk";
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function decisionCode(decision: DecisionCode): "H" | "T" | "P" | "PP" {
  if (decision === "HOLD") return "H";
  if (decision === "TIGHTEN") return "T";
  if (decision === "PROCEED") return "P";
  return "PP";
}

function bandCode(band: OperabilityBand): "F" | "M" | "S" | "H" {
  if (band === "Fragile") return "F";
  if (band === "Managed") return "M";
  if (band === "Stable") return "S";
  return "H";
}

export function buildSignature(
  route: Slide02RouteId,
  readiness: number,
  continuity: number,
  risk: number,
  decision: DecisionCode,
  band: OperabilityBand
): string {
  const routeCode = getRouteOption(route).routeCode;
  return `S2|${routeCode}|${readiness}|${continuity}|${risk}|${decisionCode(decision)}|${bandCode(band)}`;
}

function buildEvidenceRows(
  route: Slide02RouteId,
  sourceKind: RouteSourceKind,
  constraints: ConstraintValues,
  response: Pick<SystemResponse, "executionReadiness" | "continuityIndex" | "riskPressure" | "decision" | "operabilityBand">
): SystemEvidenceRow[] {
  const routeOption = getRouteOption(route);
  const narratives = describeConstraints(constraints);

  const routeValue = `${routeOption.label} (${routeOption.routeCode})`;
  const routeRationale =
    sourceKind === "default"
      ? "No prior route detected. Default route loaded for continuity."
      : `Route source: ${sourceKind}. ${routeOption.rationale}`;

  const fitValue = `${narratives.tightnessLabel} | ${narratives.summary}`;
  const fitScore = Math.round((constraints.strictness * 0.58 + constraints.budgetGuard * 0.42) * 0.5);

  const capacityValue = `${formatPercent(response.executionReadiness)} readiness`;
  const latencyValue = `${formatPercent(response.riskPressure)} pressure`;
  const verdictValue = `${response.decision} · ${response.operabilityBand}`;

  return [
    {
      key: "route",
      label: "Route Signal",
      value: routeValue,
      status: evidenceStatusFromScore(response.continuityIndex, true),
      rationale: routeRationale,
    },
    {
      key: "fit",
      label: "Constraint Fit",
      value: fitValue,
      status: evidenceStatusFromScore(fitScore, true),
      rationale: "Tightness blends strictness and budget to represent governance fit.",
    },
    {
      key: "capacity",
      label: "Execution Capacity",
      value: capacityValue,
      status: evidenceStatusFromScore(response.executionReadiness, true),
      rationale: "Capacity rises with budget posture and route readiness bias.",
    },
    {
      key: "latency",
      label: "Latency Exposure",
      value: latencyValue,
      status: evidenceStatusFromScore(response.riskPressure, false),
      rationale:
        "Latency tolerance increases risk pressure when strictness and funding cannot absorb response delays.",
    },
    {
      key: "verdict",
      label: "Bridge Verdict",
      value: verdictValue,
      status: response.decision === "HOLD" ? "risk" : response.decision === "TIGHTEN" ? "watch" : "good",
      rationale: decisionNarrative(response.decision),
    },
  ];
}

export function computeSystemResponse(
  route: Slide02RouteId,
  constraints: ConstraintValues,
  sourceKind: RouteSourceKind
): SystemResponse {
  const routeOption = getRouteOption(route);

  const strictness = clampConstraint(constraints.strictness, SLIDE02_DEFAULT_CONSTRAINTS.strictness);
  const budget = clampConstraint(constraints.budgetGuard, SLIDE02_DEFAULT_CONSTRAINTS.budgetGuard);
  const latency = clampConstraint(constraints.latencyGuard, SLIDE02_DEFAULT_CONSTRAINTS.latencyGuard);

  const readinessRaw =
    34 +
    budget * 0.44 +
    strictness * 0.08 -
    latency * 0.26 +
    routeOption.modelBias.readiness;

  const continuityRaw =
    30 +
    strictness * 0.31 +
    budget * 0.24 -
    latency * 0.27 +
    routeOption.modelBias.continuity;

  const riskRaw =
    62 +
    latency * 0.37 -
    strictness * 0.22 -
    budget * 0.21 +
    routeOption.modelBias.risk;

  const executionReadiness = clampScore(readinessRaw);
  const continuityIndex = clampScore(continuityRaw);
  const riskPressure = clampScore(riskRaw);

  const operabilityBand = classifyBand(executionReadiness, continuityIndex, riskPressure);
  const decision = classifyDecision(executionReadiness, continuityIndex, riskPressure, operabilityBand);
  const signature = buildSignature(
    route,
    executionReadiness,
    continuityIndex,
    riskPressure,
    decision,
    operabilityBand
  );

  const narrativeByAxis = {
    readiness: axisNarrativeReadiness(executionReadiness),
    continuity: axisNarrativeContinuity(continuityIndex),
    risk: axisNarrativeRisk(riskPressure),
  };

  const narrative = [
    decisionNarrative(decision),
    `Readiness ${executionReadiness}, continuity ${continuityIndex}, risk ${riskPressure}.`,
  ].join(" ");

  const evidenceRows = buildEvidenceRows(
    route,
    sourceKind,
    { strictness, budgetGuard: budget, latencyGuard: latency },
    { executionReadiness, continuityIndex, riskPressure, decision, operabilityBand }
  );

  return {
    executionReadiness,
    continuityIndex,
    riskPressure,
    operabilityBand,
    decision,
    signature,
    narrative,
    evidenceRows,
    narrativeByAxis,
  };
}

export function createResponseFromSeed(seed: Slide02SeedContext): SystemResponse {
  const route = normalizeRoute(seed.route);
  const constraints = sanitizeConstraints(seed.constraints);
  return computeSystemResponse(route, constraints, seed.routeSource);
}

export function isConstraintEqual(left: ConstraintValues, right: ConstraintValues): boolean {
  return (
    left.strictness === right.strictness &&
    left.budgetGuard === right.budgetGuard &&
    left.latencyGuard === right.latencyGuard
  );
}

export function formatConstraintSummary(constraints: ConstraintValues): string {
  return `strictness:${constraints.strictness}|budget:${constraints.budgetGuard}|latency:${constraints.latencyGuard}`;
}

export function formatReadableDecision(response: SystemResponse): string {
  return `${response.decision} · ${response.operabilityBand}`;
}
