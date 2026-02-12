import {
  DecisionCode,
  EvidenceStatus,
  OperabilityBand,
  Slide02MachineState,
  SystemEvidenceRow,
} from "./types";
import { describeConstraints, getRouteOption } from "./model";
import { routeIdToHuman, routeSourceLabel } from "./context";

export interface Slide02ScoreCard {
  key: "readiness" | "continuity" | "risk";
  label: string;
  value: number;
  tone: "good" | "watch" | "risk";
  detail: string;
}

export interface Slide02StatusBadge {
  label: string;
  tone: "neutral" | "good" | "warning" | "risk";
}

export interface Slide02EvidenceViewModel {
  rows: SystemEvidenceRow[];
  decisionBadge: Slide02StatusBadge;
  bandBadge: Slide02StatusBadge;
  cards: Slide02ScoreCard[];
}

export interface Slide02HudSummary {
  route: string;
  routeSource: string;
  status: string;
  constraints: string;
  signature: string;
  traceLength: number;
}

export function statusTone(status: Slide02MachineState["status"]): "neutral" | "good" | "warning" | "risk" {
  if (status === "REPLAY_APPLIED") return "good";
  if (status === "REPLAY_ERROR") return "risk";
  if (status === "REPLAY_READY") return "warning";
  return "neutral";
}

export function evidenceTone(status: EvidenceStatus): "good" | "watch" | "risk" {
  if (status === "good") return "good";
  if (status === "watch") return "watch";
  return "risk";
}

export function decisionTone(decision: DecisionCode): "good" | "warning" | "risk" {
  if (decision === "PROCEED+" || decision === "PROCEED") return "good";
  if (decision === "TIGHTEN") return "warning";
  return "risk";
}

export function bandTone(band: OperabilityBand): "good" | "warning" | "risk" {
  if (band === "Hardened" || band === "Stable") return "good";
  if (band === "Managed") return "warning";
  return "risk";
}

export function findEvidenceRow(
  state: Slide02MachineState,
  key: SystemEvidenceRow["key"]
): SystemEvidenceRow | null {
  return state.response.evidenceRows.find((row) => row.key === key) ?? null;
}

export function buildScoreCards(state: Slide02MachineState): Slide02ScoreCard[] {
  const response = state.response;

  const readinessTone: Slide02ScoreCard["tone"] =
    response.executionReadiness >= 70
      ? "good"
      : response.executionReadiness >= 45
      ? "watch"
      : "risk";

  const continuityTone: Slide02ScoreCard["tone"] =
    response.continuityIndex >= 70
      ? "good"
      : response.continuityIndex >= 45
      ? "watch"
      : "risk";

  const riskTone: Slide02ScoreCard["tone"] =
    response.riskPressure <= 35
      ? "good"
      : response.riskPressure <= 60
      ? "watch"
      : "risk";

  return [
    {
      key: "readiness",
      label: "Execution Readiness",
      value: response.executionReadiness,
      tone: readinessTone,
      detail: response.narrativeByAxis.readiness,
    },
    {
      key: "continuity",
      label: "Continuity Index",
      value: response.continuityIndex,
      tone: continuityTone,
      detail: response.narrativeByAxis.continuity,
    },
    {
      key: "risk",
      label: "Risk Pressure",
      value: response.riskPressure,
      tone: riskTone,
      detail: response.narrativeByAxis.risk,
    },
  ];
}

export function buildEvidenceViewModel(state: Slide02MachineState): Slide02EvidenceViewModel {
  const cards = buildScoreCards(state);

  return {
    rows: state.response.evidenceRows,
    decisionBadge: {
      label: state.response.decision,
      tone: decisionTone(state.response.decision) === "good"
        ? "good"
        : decisionTone(state.response.decision) === "warning"
        ? "warning"
        : "risk",
    },
    bandBadge: {
      label: state.response.operabilityBand,
      tone: bandTone(state.response.operabilityBand) === "good"
        ? "good"
        : bandTone(state.response.operabilityBand) === "warning"
        ? "warning"
        : "risk",
    },
    cards,
  };
}

export function buildHudSummary(state: Slide02MachineState): Slide02HudSummary {
  const routeInfo = getRouteOption(state.route);
  const constraints = describeConstraints(state.constraints);

  return {
    route: `${routeInfo.label} (${routeInfo.routeCode})`,
    routeSource: routeSourceLabel(state.seed.routeSource),
    status: state.status,
    constraints: constraints.summary,
    signature: state.response.signature,
    traceLength: state.trace.length,
  };
}

export function statusLabel(status: Slide02MachineState["status"]): string {
  if (status === "BOOTSTRAPPED") return "Bootstrapped";
  if (status === "INTERACTIVE") return "Interactive";
  if (status === "REPLAY_READY") return "Replay Ready";
  if (status === "REPLAY_APPLIED") return "Replay Applied";
  return "Replay Error";
}

export function controlTone(
  value: number,
  axis: "strictness" | "budget" | "latency"
): "good" | "watch" | "risk" {
  if (axis === "strictness") {
    if (value >= 70) return "good";
    if (value >= 40) return "watch";
    return "risk";
  }

  if (axis === "budget") {
    if (value >= 65) return "good";
    if (value >= 35) return "watch";
    return "risk";
  }

  if (value <= 35) return "good";
  if (value <= 65) return "watch";
  return "risk";
}

export function toneClass(tone: "neutral" | "good" | "warning" | "risk" | "watch"): string {
  if (tone === "good") return "slide02-tone-good";
  if (tone === "warning" || tone === "watch") return "slide02-tone-watch";
  if (tone === "risk") return "slide02-tone-risk";
  return "slide02-tone-neutral";
}

export function traceRows(state: Slide02MachineState): string[] {
  return state.trace.map((entry) => {
    return [
      `#${entry.seq}`,
      entry.action,
      `${entry.before.signature} -> ${entry.after.signature}`,
    ].join(" | ");
  });
}

export function routeLabel(route: Slide02MachineState["route"]): string {
  return routeIdToHuman(route);
}

export function flattenEvidenceSummary(state: Slide02MachineState): string {
  return state.response.evidenceRows
    .map((row) => `${row.label}:${row.status}:${row.value}`)
    .join(" || ");
}
