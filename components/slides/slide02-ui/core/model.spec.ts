import { strict as assert } from "node:assert";
import {
  SLIDE02_DEFAULT_CONSTRAINTS,
  SLIDE02_DEFAULT_ROUTE,
  SLIDE02_ROUTE_OPTIONS,
  buildSignature,
  computeSystemResponse,
  createDefaultSeedContext,
  describeConstraints,
  formatConstraintSummary,
  formatReadableDecision,
  getRouteOption,
  isConstraintEqual,
  isKnownRoute,
  normalizeRoute,
  sanitizeConstraints,
} from "./model";
import { MODEL_SCENARIOS } from "./fixtures";
import { expectNonEmpty, expectWithinRange, runSuite } from "./test-utils";
import { Slide02RouteId } from "./types";

function test_route_option_catalog() {
  assert.equal(Array.isArray(SLIDE02_ROUTE_OPTIONS), true);
  assert.equal(SLIDE02_ROUTE_OPTIONS.length, 4);

  const routeIds = SLIDE02_ROUTE_OPTIONS.map((route) => route.id);
  assert.deepEqual(routeIds.sort(), [
    "margin-defense",
    "quality-ringfence",
    "stabilize-operations",
    "throughput-push",
  ]);

  SLIDE02_ROUTE_OPTIONS.forEach((route) => {
    expectNonEmpty(route.label, `route ${route.id} label`);
    expectNonEmpty(route.synopsis, `route ${route.id} synopsis`);
    expectNonEmpty(route.rationale, `route ${route.id} rationale`);
  });
}

function test_route_normalization_aliases() {
  const aliasCases: Array<{ raw: unknown; expected: Slide02RouteId }> = [
    { raw: "stabilize", expected: "stabilize-operations" },
    { raw: "ops", expected: "stabilize-operations" },
    { raw: "operations", expected: "stabilize-operations" },
    { raw: "throughput", expected: "throughput-push" },
    { raw: "speed", expected: "throughput-push" },
    { raw: "flow", expected: "throughput-push" },
    { raw: "margin", expected: "margin-defense" },
    { raw: "cost", expected: "margin-defense" },
    { raw: "defense", expected: "margin-defense" },
    { raw: "quality", expected: "quality-ringfence" },
    { raw: "qa", expected: "quality-ringfence" },
    { raw: "ringfence", expected: "quality-ringfence" },
    { raw: "unknown-route", expected: "stabilize-operations" },
    { raw: "", expected: "stabilize-operations" },
    { raw: null, expected: "stabilize-operations" },
    { raw: undefined, expected: "stabilize-operations" },
    { raw: 14, expected: "stabilize-operations" },
  ];

  aliasCases.forEach((item) => {
    assert.equal(normalizeRoute(item.raw), item.expected, `route alias failed for ${String(item.raw)}`);
  });

  assert.equal(isKnownRoute("stabilize-operations"), true);
  assert.equal(isKnownRoute("bad-route"), false);
}

function test_constraints_sanitization() {
  const sanitized = sanitizeConstraints({
    strictness: 200,
    budgetGuard: -40,
    latencyGuard: 43.7,
  });

  assert.deepEqual(sanitized, {
    strictness: 100,
    budgetGuard: 0,
    latencyGuard: 44,
  });

  const fallback = sanitizeConstraints({
    strictness: Number.NaN,
    budgetGuard: Number.POSITIVE_INFINITY,
    latencyGuard: Number.NEGATIVE_INFINITY,
  });

  assert.deepEqual(fallback, SLIDE02_DEFAULT_CONSTRAINTS);

  const same = isConstraintEqual(
    { strictness: 10, budgetGuard: 20, latencyGuard: 30 },
    { strictness: 10, budgetGuard: 20, latencyGuard: 30 }
  );

  assert.equal(same, true);

  const notSame = isConstraintEqual(
    { strictness: 10, budgetGuard: 20, latencyGuard: 30 },
    { strictness: 11, budgetGuard: 20, latencyGuard: 30 }
  );

  assert.equal(notSame, false);
}

function test_default_seed_context() {
  const seed = createDefaultSeedContext();
  assert.equal(seed.route, SLIDE02_DEFAULT_ROUTE);
  assert.equal(seed.routeSource, "default");
  assert.deepEqual(seed.constraints, SLIDE02_DEFAULT_CONSTRAINTS);
}

function test_get_route_option() {
  const route = getRouteOption("throughput-push");
  assert.equal(route.routeCode, "THR");

  const fallback = getRouteOption("stabilize-operations");
  assert.equal(fallback.routeCode, "OPS");
}

function test_signature_builder() {
  const signature = buildSignature(
    "margin-defense",
    78,
    64,
    22,
    "PROCEED+",
    "Hardened"
  );

  assert.equal(signature, "S2|MRG|78|64|22|PP|H");
}

function test_constraint_narratives() {
  const narratives = [
    describeConstraints({ strictness: 10, budgetGuard: 15, latencyGuard: 15 }),
    describeConstraints({ strictness: 40, budgetGuard: 40, latencyGuard: 40 }),
    describeConstraints({ strictness: 60, budgetGuard: 70, latencyGuard: 70 }),
    describeConstraints({ strictness: 90, budgetGuard: 90, latencyGuard: 20 }),
  ];

  assert.equal(narratives[0].tightnessLabel, "Loose Window");
  assert.equal(narratives[1].tightnessLabel, "Guided");
  assert.equal(narratives[2].tightnessLabel, "Tightened");
  assert.equal(narratives[3].tightnessLabel, "Hard Lock");

  assert.equal(narratives[0].budgetPosture, "Constrained");
  assert.equal(narratives[1].budgetPosture, "Balanced");
  assert.equal(narratives[2].budgetPosture, "Funded");

  assert.equal(narratives[0].latencyPosture, "Low latency tolerance");
  assert.equal(narratives[1].latencyPosture, "Moderate latency tolerance");
  assert.equal(narratives[2].latencyPosture, "High latency tolerance");

  narratives.forEach((narrative) => {
    expectNonEmpty(narrative.summary, "constraint summary should not be empty");
  });
}

function test_format_helpers() {
  const constraints = { strictness: 50, budgetGuard: 70, latencyGuard: 30 };
  const summary = formatConstraintSummary(constraints);
  assert.equal(summary, "strictness:50|budget:70|latency:30");

  const response = computeSystemResponse("quality-ringfence", constraints, "default");
  const readable = formatReadableDecision(response);
  assert.equal(readable, `${response.decision} · ${response.operabilityBand}`);
}

function test_model_scenarios_expected_ranges() {
  MODEL_SCENARIOS.forEach((scenario) => {
    const response = computeSystemResponse(
      scenario.route,
      scenario.constraints,
      "default"
    );

    expectWithinRange(
      response.executionReadiness,
      scenario.expectedReadinessRange,
      `${scenario.id} readiness`
    );

    expectWithinRange(
      response.continuityIndex,
      scenario.expectedContinuityRange,
      `${scenario.id} continuity`
    );

    expectWithinRange(
      response.riskPressure,
      scenario.expectedRiskRange,
      `${scenario.id} risk`
    );

    assert.equal(
      response.decision,
      scenario.expectedDecision,
      `${scenario.id} decision mismatch`
    );

    assert.equal(
      response.operabilityBand,
      scenario.expectedBand,
      `${scenario.id} band mismatch`
    );

    expectNonEmpty(response.signature, `${scenario.id} signature`);
    assert.equal(response.signature.startsWith("S2|"), true, `${scenario.id} signature prefix`);

    assert.equal(response.evidenceRows.length, 5, `${scenario.id} evidence row count`);
  });
}

function test_deterministic_repeatability() {
  const route: Slide02RouteId = "throughput-push";
  const constraints = { strictness: 64, budgetGuard: 72, latencyGuard: 32 };

  const first = computeSystemResponse(route, constraints, "default");
  const second = computeSystemResponse(route, constraints, "default");
  const third = computeSystemResponse(route, constraints, "default");

  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
}

function test_evidence_structure() {
  const response = computeSystemResponse(
    "margin-defense",
    { strictness: 72, budgetGuard: 70, latencyGuard: 24 },
    "query"
  );

  const keys = response.evidenceRows.map((row) => row.key);
  assert.deepEqual(keys, ["route", "fit", "capacity", "latency", "verdict"]);

  response.evidenceRows.forEach((row) => {
    expectNonEmpty(row.label, `row ${row.key} label`);
    expectNonEmpty(row.value, `row ${row.key} value`);
    expectNonEmpty(row.rationale, `row ${row.key} rationale`);
    assert.equal(["good", "watch", "risk"].includes(row.status), true);
  });

  expectNonEmpty(response.narrative, "response narrative");
  expectNonEmpty(response.narrativeByAxis.readiness, "axis readiness");
  expectNonEmpty(response.narrativeByAxis.continuity, "axis continuity");
  expectNonEmpty(response.narrativeByAxis.risk, "axis risk");
}

function test_decision_progression_monotonicity() {
  const route: Slide02RouteId = "quality-ringfence";

  const low = computeSystemResponse(route, { strictness: 40, budgetGuard: 30, latencyGuard: 78 }, "default");
  const medium = computeSystemResponse(route, { strictness: 60, budgetGuard: 50, latencyGuard: 50 }, "default");
  const high = computeSystemResponse(route, { strictness: 84, budgetGuard: 76, latencyGuard: 20 }, "default");

  assert.equal(low.executionReadiness <= medium.executionReadiness, true);
  assert.equal(medium.executionReadiness <= high.executionReadiness, true);

  assert.equal(low.continuityIndex <= medium.continuityIndex, true);
  assert.equal(medium.continuityIndex <= high.continuityIndex, true);

  assert.equal(low.riskPressure >= medium.riskPressure, true);
  assert.equal(medium.riskPressure >= high.riskPressure, true);
}

function test_route_bias_impact() {
  const baselineConstraints = { strictness: 58, budgetGuard: 64, latencyGuard: 32 };

  const ops = computeSystemResponse("stabilize-operations", baselineConstraints, "default");
  const thr = computeSystemResponse("throughput-push", baselineConstraints, "default");
  const mrg = computeSystemResponse("margin-defense", baselineConstraints, "default");
  const qlt = computeSystemResponse("quality-ringfence", baselineConstraints, "default");

  assert.equal(thr.executionReadiness >= ops.executionReadiness, true);
  assert.equal(qlt.continuityIndex >= thr.continuityIndex, true);
  assert.equal(qlt.riskPressure <= thr.riskPressure, true);
  assert.equal(mrg.riskPressure <= thr.riskPressure, true);
}

function test_signature_uniqueness_on_changes() {
  const base = computeSystemResponse(
    "stabilize-operations",
    { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    "default"
  );

  const routeChange = computeSystemResponse(
    "throughput-push",
    { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    "default"
  );

  const strictnessChange = computeSystemResponse(
    "stabilize-operations",
    { strictness: 70, budgetGuard: 62, latencyGuard: 38 },
    "default"
  );

  const budgetChange = computeSystemResponse(
    "stabilize-operations",
    { strictness: 56, budgetGuard: 76, latencyGuard: 38 },
    "default"
  );

  const latencyChange = computeSystemResponse(
    "stabilize-operations",
    { strictness: 56, budgetGuard: 62, latencyGuard: 62 },
    "default"
  );

  assert.notEqual(base.signature, routeChange.signature);
  assert.notEqual(base.signature, strictnessChange.signature);
  assert.notEqual(base.signature, budgetChange.signature);
  assert.notEqual(base.signature, latencyChange.signature);
}

export function runSlide02ModelSpecs() {
  const result = runSuite("slide02-model", [
    { id: "route_option_catalog", run: test_route_option_catalog },
    { id: "route_normalization_aliases", run: test_route_normalization_aliases },
    { id: "constraints_sanitization", run: test_constraints_sanitization },
    { id: "default_seed_context", run: test_default_seed_context },
    { id: "get_route_option", run: test_get_route_option },
    { id: "signature_builder", run: test_signature_builder },
    { id: "constraint_narratives", run: test_constraint_narratives },
    { id: "format_helpers", run: test_format_helpers },
    { id: "model_scenarios_expected_ranges", run: test_model_scenarios_expected_ranges },
    { id: "deterministic_repeatability", run: test_deterministic_repeatability },
    { id: "evidence_structure", run: test_evidence_structure },
    { id: "decision_progression_monotonicity", run: test_decision_progression_monotonicity },
    { id: "route_bias_impact", run: test_route_bias_impact },
    { id: "signature_uniqueness_on_changes", run: test_signature_uniqueness_on_changes },
  ]);

  return result;
}
