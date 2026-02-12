import {
  CRITERION_LABELS,
  SCORING_EXPLANATION_PRIORITY,
  SLIDE01_CRITERIA,
  SLIDE01_ROUTES,
  SLIDE01_TIE_BREAKER,
} from "./constants";
import { clamp01, round } from "./math";
import {
  CriterionContribution,
  CriterionId,
  CriterionSignal,
  GestureMetrics,
  RouteDecision,
  RouteId,
  ScoreSnapshot,
} from "./types";

function compatibility(emphasis: number, profile: number): number {
  return clamp01(1 - Math.abs(emphasis - profile));
}

export function criterionSignalsFromMetrics(metrics: GestureMetrics): CriterionSignal[] {
  const deliverySpeed = clamp01(
    0.25 + metrics.urgency * 0.5 + metrics.momentum * 0.2 - metrics.stability * 0.15
  );
  const operationalRisk = clamp01(
    0.2 + metrics.deliberation * 0.5 + metrics.biasRight * 0.2 + metrics.meanY * 0.1
  );
  const scalability = clamp01(
    0.15 + metrics.biasRight * 0.45 + metrics.spreadX * 0.2 + metrics.commitment * 0.2
  );
  const budgetPredictability = clamp01(
    0.2 +
      metrics.stability * 0.45 +
      metrics.commitment * 0.25 +
      metrics.meanY * 0.1 -
      metrics.urgency * 0.1
  );
  const knowledgeRetention = clamp01(
    0.15 +
      metrics.deliberation * 0.35 +
      metrics.meanY * 0.2 +
      metrics.biasRight * 0.2 +
      metrics.spreadY * 0.1
  );

  return [
    { criterionId: "deliverySpeed", emphasis: round(deliverySpeed) },
    { criterionId: "operationalRisk", emphasis: round(operationalRisk) },
    { criterionId: "scalability", emphasis: round(scalability) },
    { criterionId: "budgetPredictability", emphasis: round(budgetPredictability) },
    { criterionId: "knowledgeRetention", emphasis: round(knowledgeRetention) },
  ];
}

function createContribution(
  criterionId: CriterionId,
  emphasis: number,
  weight: number
): CriterionContribution {
  const profileA = SLIDE01_ROUTES.A.profiles[criterionId];
  const profileB = SLIDE01_ROUTES.B.profiles[criterionId];
  const routeA = weight * compatibility(emphasis, profileA);
  const routeB = weight * compatibility(emphasis, profileB);
  const delta = routeB - routeA;
  return {
    criterionId,
    label: CRITERION_LABELS[criterionId],
    weight: round(weight),
    emphasis: round(emphasis),
    routeA: round(routeA),
    routeB: round(routeB),
    delta: round(delta),
  };
}

export function pickWinnerFromScores(routeA: number, routeB: number): {
  winner: RouteId;
  tie: boolean;
} {
  const difference = routeB - routeA;
  if (Math.abs(difference) <= 0.0001) {
    return { winner: SLIDE01_TIE_BREAKER, tie: true };
  }
  return {
    winner: difference > 0 ? "B" : "A",
    tie: false,
  };
}

function createReasonBullets(
  winner: RouteId,
  tie: boolean,
  contributions: CriterionContribution[],
  metrics: GestureMetrics
): string[] {
  const prioritized = [...contributions].sort((left, right) => {
    const leftPriority = SCORING_EXPLANATION_PRIORITY.indexOf(left.criterionId);
    const rightPriority = SCORING_EXPLANATION_PRIORITY.indexOf(right.criterionId);
    const byMagnitude = Math.abs(right.delta) - Math.abs(left.delta);
    if (Math.abs(byMagnitude) > 0.0001) return byMagnitude;
    return leftPriority - rightPriority;
  });

  const topThree = prioritized.slice(0, 3).map((entry) => {
    if (entry.delta === 0) {
      return `${entry.label}: neutral impact`;
    }
    const favorRoute = entry.delta > 0 ? "Route B" : "Route A";
    const sign = entry.delta > 0 ? "+" : "-";
    return `${entry.label}: ${sign}${Math.abs(entry.delta * 100).toFixed(2)} pts for ${favorRoute}`;
  });

  const certaintyScore =
    metrics.deliberation * 0.5 + metrics.stability * 0.3 + metrics.commitment * 0.2;

  const metricsBullet = `Gesture certainty ${(certaintyScore * 100).toFixed(
    2
  )}% (bias-right ${(metrics.biasRight * 100).toFixed(1)}%, urgency ${(
    metrics.urgency * 100
  ).toFixed(1)}%).`;

  const tieBullet = tie
    ? "Tie detected; deterministic tie-breaker selected Route B."
    : `Winner confidence delta: ${Math.abs(
        contributions.reduce((total, item) => total + item.delta, 0) * 100
      ).toFixed(2)} pts for Route ${winner}.`;

  return [...topThree, metricsBullet, tieBullet];
}

export function scoreFromMetrics(metrics: GestureMetrics): ScoreSnapshot {
  const signals = criterionSignalsFromMetrics(metrics);
  const contributions = SLIDE01_CRITERIA.map((criterion) => {
    const signal = signals.find((entry) => entry.criterionId === criterion.id);
    const emphasis = signal ? signal.emphasis : 0.5;
    return createContribution(criterion.id, emphasis, criterion.weight);
  });

  const routeA = contributions.reduce((total, item) => total + item.routeA, 0) * 100;
  const routeB = contributions.reduce((total, item) => total + item.routeB, 0) * 100;
  const { winner, tie } = pickWinnerFromScores(routeA, routeB);
  return {
    routeA: round(routeA, 4),
    routeB: round(routeB, 4),
    difference: round(routeB - routeA, 4),
    winner,
    tie,
    signals,
    contributions,
  };
}

export function decisionFromScore(score: ScoreSnapshot): RouteDecision {
  const winnerRoute = score.winner;
  const winnerInfo = SLIDE01_ROUTES[winnerRoute];
  const reasons = createReasonBullets(
    winnerRoute,
    score.tie,
    score.contributions,
    summarizeMetrics(score)
  );
  return {
    winner: winnerRoute,
    headline: `${winnerInfo.label} selected`,
    summary: `${winnerInfo.name}: ${winnerInfo.summary}`,
    reasons,
  };
}

function summarizeMetrics(score: ScoreSnapshot): GestureMetrics {
  const byId = (id: CriterionId) => score.signals.find((entry) => entry.criterionId === id)?.emphasis ?? 0.5;
  const spreadX = Math.abs(byId("scalability") - byId("deliverySpeed"));
  const spreadY = Math.abs(byId("operationalRisk") - byId("budgetPredictability"));

  const momentum = clamp01(byId("deliverySpeed") * 0.8 + (1 - byId("knowledgeRetention")) * 0.2);
  const stability = clamp01(byId("budgetPredictability") * 0.7 + byId("operationalRisk") * 0.3);
  const commitment = clamp01(byId("knowledgeRetention") * 0.7 + byId("scalability") * 0.3);
  const urgency = clamp01(byId("deliverySpeed"));
  const biasRight = clamp01(byId("scalability") * 0.65 + byId("operationalRisk") * 0.35);
  const deliberation = clamp01(stability * 0.55 + commitment * 0.45);

  return {
    sampleCount: 0,
    totalDistance: 0,
    horizontalTravel: 0,
    verticalTravel: 0,
    meanX: biasRight,
    meanY: clamp01(byId("operationalRisk") * 0.5 + byId("budgetPredictability") * 0.5),
    spreadX,
    spreadY,
    momentum,
    stability,
    commitment,
    urgency,
    biasRight,
    deliberation,
  };
}
