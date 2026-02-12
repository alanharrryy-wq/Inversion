import { CriterionId, Slide01State } from "./types";

export function hasResolvedDecision(state: Slide01State): boolean {
  return state.phase === "resolved" && !!state.decision.winner;
}

export function decisionEvidenceLine(state: Slide01State): string {
  return `A: ${state.score.routeA.toFixed(2)} | B: ${state.score.routeB.toFixed(2)} | Delta: ${state.score.difference.toFixed(2)}`;
}

export function selectedRouteId(state: Slide01State): "A" | "B" | null {
  return state.decision.winner;
}

export function criterionContributionById(state: Slide01State, criterionId: CriterionId) {
  return state.score.contributions.find((item) => item.criterionId === criterionId) ?? null;
}

export function criterionSignalPercent(state: Slide01State, criterionId: CriterionId): number {
  const signal = state.score.signals.find((item) => item.criterionId === criterionId);
  return signal ? signal.emphasis * 100 : 50;
}

export function phaseLabel(state: Slide01State): string {
  if (state.phase === "idle") return "idle";
  if (state.phase === "aiming") return "aiming";
  if (state.phase === "weighing") return "weighing";
  if (state.phase === "committed") return "committed";
  return "resolved";
}
