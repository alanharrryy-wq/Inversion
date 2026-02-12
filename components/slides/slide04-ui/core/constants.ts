import {
  ConstraintDefinition,
  ConstraintId,
  ConstraintState,
  EvidenceDefinition,
  EvidenceId,
  RouteDefinition,
  RouteId,
} from "./types";

export const SLIDE04_REPLAY_VERSION = "slide04-replay.v1" as const;
export const SLIDE04_SUMMARY_VERSION = "slide04-summary.v1" as const;

export const LOCK_HOLD_THRESHOLD_MS = 1200;

export const ROUTE_REGISTRY: RouteDefinition[] = [
  {
    id: "route-direct-oem",
    label: "Direct OEM Lock-In",
    thesis:
      "Prioritize direct OEM deployment for top-tier plants with strict audit obligations and immediate telemetry value.",
    owner: "Enterprise Delivery",
    horizonDays: 90,
    riskBand: "balanced",
    handoffTag: "OEM-PRIMARY",
  },
  {
    id: "route-service-led",
    label: "Service-Led Expansion",
    thesis:
      "Enter through service operations to prove value in maintenance workflows, then expand into manufacturing and finance.",
    owner: "Field Operations",
    horizonDays: 120,
    riskBand: "conservative",
    handoffTag: "SERVICE-HUB",
  },
  {
    id: "route-white-label",
    label: "Partner White-Label",
    thesis:
      "Scale through certified integration partners that embed the evidence core in existing client portals.",
    owner: "Partner Success",
    horizonDays: 150,
    riskBand: "aggressive",
    handoffTag: "PARTNER-NET",
  },
];

export const CONSTRAINT_REGISTRY: ConstraintDefinition[] = [
  {
    id: "capital-window",
    label: "Capital Window",
    weight: 30,
    rationale: "Procurement and capex approval timelines must align with implementation runway.",
  },
  {
    id: "integration-risk",
    label: "Integration Risk",
    weight: 25,
    rationale: "Legacy stack integration complexity affects rollout certainty.",
  },
  {
    id: "audit-pressure",
    label: "Audit Pressure",
    weight: 20,
    rationale: "Regulatory and client audits require immediate evidentiary traceability.",
  },
  {
    id: "delivery-speed",
    label: "Delivery Speed",
    weight: 15,
    rationale: "Operational value must appear within the commercial commitment horizon.",
  },
  {
    id: "compliance-rigor",
    label: "Compliance Rigor",
    weight: 10,
    rationale: "Standards and policy alignment determine acceptance by risk teams.",
  },
];

export const EVIDENCE_REGISTRY: EvidenceDefinition[] = [
  {
    id: "live-telemetry",
    label: "Live Telemetry Stream",
    source: "telemetry",
    confidence: 94,
    note: "Frame-level operational signal continuity.",
  },
  {
    id: "chain-of-custody",
    label: "Chain Of Custody Log",
    source: "governance",
    confidence: 92,
    note: "Immutable lineage for event-level provenance.",
  },
  {
    id: "quality-snapshot",
    label: "Quality Snapshot Ledger",
    source: "quality",
    confidence: 89,
    note: "Defect and variance deltas tied to shift timeline.",
  },
  {
    id: "service-ledger",
    label: "Service Workorder Ledger",
    source: "operations",
    confidence: 88,
    note: "Linked intervention records and maintenance outcomes.",
  },
  {
    id: "board-brief",
    label: "Board Brief Consistency",
    source: "finance",
    confidence: 85,
    note: "Executive narrative aligned with source evidence.",
  },
];

export const DEFAULT_CONSTRAINT_STATES: Record<ConstraintId, ConstraintState> = {
  "capital-window": "satisfied",
  "integration-risk": "at-risk",
  "audit-pressure": "satisfied",
  "delivery-speed": "satisfied",
  "compliance-rigor": "at-risk",
};

export const DEFAULT_EVIDENCE_SELECTION: EvidenceId[] = [
  "live-telemetry",
  "chain-of-custody",
  "service-ledger",
];

const ROUTE_LOOKUP: Record<RouteId, RouteDefinition> = ROUTE_REGISTRY.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<RouteId, RouteDefinition>
);

const CONSTRAINT_LOOKUP: Record<ConstraintId, ConstraintDefinition> = CONSTRAINT_REGISTRY.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ConstraintId, ConstraintDefinition>
);

const EVIDENCE_LOOKUP: Record<EvidenceId, EvidenceDefinition> = EVIDENCE_REGISTRY.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<EvidenceId, EvidenceDefinition>
);

export function getRouteById(routeId: RouteId): RouteDefinition {
  const route = ROUTE_LOOKUP[routeId];
  if (!route) {
    throw new Error(`Unknown route id: ${routeId}`);
  }
  return route;
}

export function getConstraintDefinition(constraintId: ConstraintId): ConstraintDefinition {
  const constraint = CONSTRAINT_LOOKUP[constraintId];
  if (!constraint) {
    throw new Error(`Unknown constraint id: ${constraintId}`);
  }
  return constraint;
}

export function getEvidenceDefinition(evidenceId: EvidenceId): EvidenceDefinition {
  const evidence = EVIDENCE_LOOKUP[evidenceId];
  if (!evidence) {
    throw new Error(`Unknown evidence id: ${evidenceId}`);
  }
  return evidence;
}

export function createDefaultConstraintState(): Record<ConstraintId, ConstraintState> {
  return {
    "capital-window": DEFAULT_CONSTRAINT_STATES["capital-window"],
    "integration-risk": DEFAULT_CONSTRAINT_STATES["integration-risk"],
    "audit-pressure": DEFAULT_CONSTRAINT_STATES["audit-pressure"],
    "delivery-speed": DEFAULT_CONSTRAINT_STATES["delivery-speed"],
    "compliance-rigor": DEFAULT_CONSTRAINT_STATES["compliance-rigor"],
  };
}

export function sortConstraintIds(ids: ConstraintId[]): ConstraintId[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function sortEvidenceIds(ids: EvidenceId[]): EvidenceId[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function sortRouteIds(ids: RouteId[]): RouteId[] {
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function createConstraintStateLabel(state: ConstraintState): string {
  if (state === "satisfied") {
    return "Satisfied";
  }
  if (state === "at-risk") {
    return "At Risk";
  }
  return "Blocked";
}

export function isKnownRouteId(value: string): value is RouteId {
  return value in ROUTE_LOOKUP;
}

export function isKnownConstraintId(value: string): value is ConstraintId {
  return value in CONSTRAINT_LOOKUP;
}

export function isKnownEvidenceId(value: string): value is EvidenceId {
  return value in EVIDENCE_LOOKUP;
}

export function isConstraintState(value: string): value is ConstraintState {
  return value === "satisfied" || value === "at-risk" || value === "blocked";
}

export const ROUTE_ORDER: RouteId[] = ROUTE_REGISTRY.map((route) => route.id);
export const CONSTRAINT_ORDER: ConstraintId[] = CONSTRAINT_REGISTRY.map((constraint) => constraint.id);
export const EVIDENCE_ORDER: EvidenceId[] = EVIDENCE_REGISTRY.map((evidence) => evidence.id);

export function createReplaySeed(routeId: RouteId | null): string {
  const routePart = routeId ?? "none";
  return `slide04-${routePart}-seed-v1`;
}

export function createReplayScenario(routeId: RouteId | null): string {
  if (!routeId) {
    return "slide04-idle";
  }
  return `slide04-${routeId}`;
}

export function createEmptySourceCounter() {
  return {
    telemetry: 0,
    operations: 0,
    quality: 0,
    finance: 0,
    governance: 0,
  };
}

export function routeRiskFactor(riskBand: RouteDefinition["riskBand"]): number {
  if (riskBand === "conservative") {
    return 6;
  }
  if (riskBand === "balanced") {
    return 4;
  }
  return 2;
}

export function dedupeEvidenceIds(ids: EvidenceId[]): EvidenceId[] {
  const seen = new Set<EvidenceId>();
  const result: EvidenceId[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return sortEvidenceIds(result);
}

export function upsertEvidenceId(ids: EvidenceId[], evidenceId: EvidenceId): EvidenceId[] {
  if (ids.includes(evidenceId)) {
    return sortEvidenceIds(ids.filter((id) => id !== evidenceId));
  }
  return sortEvidenceIds([...ids, evidenceId]);
}

export function hasBlockedConstraint(state: Record<ConstraintId, ConstraintState>): boolean {
  return Object.values(state).some((item) => item === "blocked");
}

export function countConstraintState(
  state: Record<ConstraintId, ConstraintState>,
  target: ConstraintState
): number {
  return Object.values(state).filter((item) => item === target).length;
}
