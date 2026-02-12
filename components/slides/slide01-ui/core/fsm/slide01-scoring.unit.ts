import { strict as assert } from "node:assert";
import { SLIDE01_CRITERIA } from "./constants";
import {
  criterionSignalsFromMetrics,
  decisionFromScore,
  pickWinnerFromScores,
  scoreFromMetrics,
} from "./scoring";
import { GestureMetrics } from "./types";

function buildMetrics(overrides: Partial<GestureMetrics>): GestureMetrics {
  return {
    sampleCount: 18,
    totalDistance: 1.24,
    horizontalTravel: 0.82,
    verticalTravel: 0.42,
    meanX: 0.5,
    meanY: 0.5,
    spreadX: 0.4,
    spreadY: 0.3,
    momentum: 0.52,
    stability: 0.65,
    commitment: 0.58,
    urgency: 0.46,
    biasRight: 0.5,
    deliberation: 0.62,
    ...overrides,
  };
}

function assertBetween(value: number, min: number, max: number, label: string): void {
  assert.ok(
    value >= min && value <= max,
    `${label} expected between ${min} and ${max}, received ${value}`
  );
}

function test_weight_sum_is_one(): void {
  const total = SLIDE01_CRITERIA.reduce((sum, criterion) => sum + criterion.weight, 0);
  assert.equal(total, 1);
}

function test_signal_ranges_are_clamped(): void {
  const extremeCases: GestureMetrics[] = [
    buildMetrics({
      momentum: 2,
      stability: -1,
      commitment: 2,
      urgency: 2,
      meanY: -1,
      spreadX: 2,
      spreadY: 2,
      biasRight: 2,
      deliberation: 2,
    }),
    buildMetrics({
      momentum: -1,
      stability: 2,
      commitment: -1,
      urgency: -1,
      meanY: 2,
      spreadX: -1,
      spreadY: -1,
      biasRight: -1,
      deliberation: -1,
    }),
  ];

  for (const [index, metrics] of extremeCases.entries()) {
    const signals = criterionSignalsFromMetrics(metrics);
    assert.equal(signals.length, 5, `signal count mismatch for case ${index}`);
    for (const signal of signals) {
      assertBetween(signal.emphasis, 0, 1, `signal ${signal.criterionId}`);
    }
  }
}

function test_route_b_favored_by_deliberate_deep_right_bias(): void {
  const metrics = buildMetrics({
    sampleCount: 26,
    totalDistance: 1.46,
    horizontalTravel: 0.86,
    verticalTravel: 0.72,
    meanX: 0.72,
    meanY: 0.68,
    spreadX: 0.56,
    spreadY: 0.44,
    momentum: 0.51,
    stability: 0.86,
    commitment: 0.88,
    urgency: 0.22,
    biasRight: 0.82,
    deliberation: 0.87,
  });
  const score = scoreFromMetrics(metrics);
  assert.equal(score.winner, "B");
  assert.equal(score.tie, false);
  assert.ok(score.routeB > score.routeA);
  assert.ok(score.difference > 0);
  assertBetween(score.routeA, 0, 100, "routeA");
  assertBetween(score.routeB, 0, 100, "routeB");
}

function test_route_a_favored_by_urgent_shallow_left_bias(): void {
  const metrics = buildMetrics({
    sampleCount: 11,
    totalDistance: 1.12,
    horizontalTravel: 0.74,
    verticalTravel: 0.21,
    meanX: 0.24,
    meanY: 0.29,
    spreadX: 0.61,
    spreadY: 0.19,
    momentum: 0.83,
    stability: 0.38,
    commitment: 0.24,
    urgency: 0.91,
    biasRight: 0.18,
    deliberation: 0.31,
  });
  const score = scoreFromMetrics(metrics);
  assert.equal(score.winner, "A");
  assert.equal(score.tie, false);
  assert.ok(score.routeA > score.routeB);
  assert.ok(score.difference < 0);
}

function test_tie_breaker_prefers_route_b(): void {
  const result = pickWinnerFromScores(72.225, 72.225);
  assert.equal(result.tie, true);
  assert.equal(result.winner, "B");
}

function test_decision_shape_contains_expected_headline_and_reasons(): void {
  const metrics = buildMetrics({
    meanX: 0.71,
    meanY: 0.66,
    spreadX: 0.52,
    spreadY: 0.38,
    stability: 0.87,
    commitment: 0.84,
    biasRight: 0.8,
    urgency: 0.24,
    deliberation: 0.85,
  });
  const score = scoreFromMetrics(metrics);
  const decision = decisionFromScore(score);
  assert.ok(decision.headline.startsWith("Route "));
  assert.ok(decision.summary.length > 12);
  assert.ok(decision.reasons.length >= 4);
  assert.ok(decision.reasons.every((line) => line.length > 5));
}

function test_scoring_is_deterministic_for_identical_inputs(): void {
  const metrics = buildMetrics({
    sampleCount: 19,
    totalDistance: 1.11,
    horizontalTravel: 0.7,
    verticalTravel: 0.41,
    meanX: 0.64,
    meanY: 0.57,
    spreadX: 0.49,
    spreadY: 0.27,
    momentum: 0.6,
    stability: 0.73,
    commitment: 0.66,
    urgency: 0.38,
    biasRight: 0.68,
    deliberation: 0.71,
  });

  const first = scoreFromMetrics(metrics);
  const second = scoreFromMetrics(metrics);
  assert.deepEqual(second, first);
}

function test_score_ranges_for_scenario_matrix(): void {
  type Scenario = {
    name: string;
    expectedWinner: "A" | "B";
    metrics: Partial<GestureMetrics>;
  };

  const scenarios: Scenario[] = [
    {
      name: "deep-governed-right",
      expectedWinner: "B",
      metrics: {
        meanX: 0.74,
        meanY: 0.69,
        stability: 0.89,
        commitment: 0.9,
        urgency: 0.21,
        spreadX: 0.58,
        spreadY: 0.46,
        biasRight: 0.84,
        deliberation: 0.89,
      },
    },
    {
      name: "balanced-but-right",
      expectedWinner: "B",
      metrics: {
        meanX: 0.61,
        meanY: 0.58,
        stability: 0.78,
        commitment: 0.73,
        urgency: 0.33,
        spreadX: 0.47,
        spreadY: 0.31,
        biasRight: 0.67,
        deliberation: 0.76,
      },
    },
    {
      name: "urgent-left-sweep",
      expectedWinner: "A",
      metrics: {
        meanX: 0.22,
        meanY: 0.3,
        stability: 0.42,
        commitment: 0.28,
        urgency: 0.9,
        spreadX: 0.64,
        spreadY: 0.22,
        biasRight: 0.17,
        deliberation: 0.33,
      },
    },
    {
      name: "left-with-high-momentum",
      expectedWinner: "A",
      metrics: {
        meanX: 0.28,
        meanY: 0.33,
        momentum: 0.87,
        stability: 0.37,
        commitment: 0.29,
        urgency: 0.86,
        spreadX: 0.6,
        spreadY: 0.25,
        biasRight: 0.2,
        deliberation: 0.32,
      },
    },
    {
      name: "deliberate-neutral-right",
      expectedWinner: "B",
      metrics: {
        meanX: 0.57,
        meanY: 0.55,
        stability: 0.81,
        commitment: 0.77,
        urgency: 0.31,
        spreadX: 0.43,
        spreadY: 0.29,
        biasRight: 0.61,
        deliberation: 0.79,
      },
    },
    {
      name: "high-urgency-without-depth",
      expectedWinner: "A",
      metrics: {
        meanX: 0.35,
        meanY: 0.34,
        stability: 0.51,
        commitment: 0.32,
        urgency: 0.78,
        spreadX: 0.57,
        spreadY: 0.21,
        biasRight: 0.31,
        deliberation: 0.42,
      },
    },
    {
      name: "structured-right-wide-spread",
      expectedWinner: "B",
      metrics: {
        meanX: 0.69,
        meanY: 0.62,
        stability: 0.82,
        commitment: 0.84,
        urgency: 0.28,
        spreadX: 0.68,
        spreadY: 0.44,
        biasRight: 0.78,
        deliberation: 0.83,
      },
    },
    {
      name: "shallow-left-fast",
      expectedWinner: "A",
      metrics: {
        meanX: 0.19,
        meanY: 0.27,
        stability: 0.34,
        commitment: 0.25,
        urgency: 0.93,
        spreadX: 0.62,
        spreadY: 0.17,
        biasRight: 0.13,
        deliberation: 0.28,
      },
    },
    {
      name: "medium-right-medium-urgency",
      expectedWinner: "B",
      metrics: {
        meanX: 0.6,
        meanY: 0.57,
        stability: 0.74,
        commitment: 0.7,
        urgency: 0.4,
        spreadX: 0.5,
        spreadY: 0.33,
        biasRight: 0.64,
        deliberation: 0.72,
      },
    },
    {
      name: "left-biased-high-jitter",
      expectedWinner: "A",
      metrics: {
        meanX: 0.31,
        meanY: 0.36,
        stability: 0.29,
        commitment: 0.34,
        urgency: 0.82,
        spreadX: 0.59,
        spreadY: 0.24,
        biasRight: 0.27,
        deliberation: 0.32,
      },
    },
  ];

  for (const scenario of scenarios) {
    const metrics = buildMetrics(scenario.metrics);
    const score = scoreFromMetrics(metrics);
    assert.equal(score.winner, scenario.expectedWinner, scenario.name);
    assertBetween(score.routeA, 0, 100, `${scenario.name}: routeA`);
    assertBetween(score.routeB, 0, 100, `${scenario.name}: routeB`);
    assert.equal(score.contributions.length, 5, `${scenario.name}: contribution count`);
    assert.equal(score.signals.length, 5, `${scenario.name}: signal count`);
  }
}

function test_decision_bullets_are_stable_for_known_matrix(): void {
  const matrix: Partial<GestureMetrics>[] = [
    {
      meanX: 0.7,
      meanY: 0.67,
      spreadX: 0.55,
      spreadY: 0.44,
      stability: 0.88,
      commitment: 0.86,
      urgency: 0.25,
      biasRight: 0.81,
      deliberation: 0.87,
    },
    {
      meanX: 0.26,
      meanY: 0.29,
      spreadX: 0.63,
      spreadY: 0.2,
      stability: 0.36,
      commitment: 0.24,
      urgency: 0.92,
      biasRight: 0.16,
      deliberation: 0.3,
    },
    {
      meanX: 0.58,
      meanY: 0.55,
      spreadX: 0.45,
      spreadY: 0.3,
      stability: 0.72,
      commitment: 0.69,
      urgency: 0.42,
      biasRight: 0.63,
      deliberation: 0.7,
    },
  ];

  for (const [index, entry] of matrix.entries()) {
    const score = scoreFromMetrics(buildMetrics(entry));
    const decision = decisionFromScore(score);
    assert.ok(
      decision.reasons.some((reason) => reason.includes("Gesture certainty")),
      `matrix ${index} should include certainty bullet`
    );
    assert.ok(
      decision.reasons.some((reason) => reason.includes("Route")),
      `matrix ${index} should include route bullet`
    );
  }
}

export function runSlide01ScoringSpecs(): void {
  test_weight_sum_is_one();
  test_signal_ranges_are_clamped();
  test_route_b_favored_by_deliberate_deep_right_bias();
  test_route_a_favored_by_urgent_shallow_left_bias();
  test_tie_breaker_prefers_route_b();
  test_decision_shape_contains_expected_headline_and_reasons();
  test_scoring_is_deterministic_for_identical_inputs();
  test_score_ranges_for_scenario_matrix();
  test_decision_bullets_are_stable_for_known_matrix();
}
