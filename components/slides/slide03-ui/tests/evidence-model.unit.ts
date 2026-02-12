import {
  computeConstraintPressure,
  computeStepPreview,
  createScenarioInput,
  evaluateEvidenceLadder,
  MODEL_SCENARIOS,
  normalizeRevealedSteps,
  stableInputHash,
  toDeterministicProbe,
} from "../core/evidence";
import {
  assertDeepEqual,
  assertEqual,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertMonotonicDecrease,
  assertMonotonicIncrease,
  assertTruthy,
  section,
} from "./assert";

const expectedNormalizationCases: Array<{
  input: Array<"E1" | "E2" | "E3">;
  expected: Array<"E1" | "E2" | "E3">;
}> = [
  { input: [], expected: [] },
  { input: ["E1"], expected: ["E1"] },
  { input: ["E2"], expected: [] },
  { input: ["E3"], expected: [] },
  { input: ["E1", "E2"], expected: ["E1", "E2"] },
  { input: ["E1", "E3"], expected: ["E1"] },
  { input: ["E2", "E1"], expected: ["E1"] },
  { input: ["E1", "E2", "E3"], expected: ["E1", "E2", "E3"] },
  { input: ["E1", "E2", "E3", "E3"], expected: ["E1", "E2", "E3"] },
  { input: ["E1", "E1", "E2", "E3"], expected: ["E1", "E2", "E3"] },
  { input: ["E3", "E2", "E1"], expected: ["E1"] },
  { input: ["E2", "E2", "E1", "E1", "E3"], expected: ["E1"] },
  { input: ["E1", "E2", "E1", "E2", "E3"], expected: ["E1", "E2", "E3"] },
];

const expectedStageSnapshots: Record<
  string,
  {
    open: number;
    forming: number;
    sealed: number;
  }
> = {
  "route-proof-first": { open: 0, forming: 0, sealed: 0 },
  "route-speed-first": { open: 0, forming: 0, sealed: 0 },
  "route-min-capex": { open: 0, forming: 0, sealed: 0 },
  "route-balanced": { open: 0, forming: 0, sealed: 0 },
};

const assertScenario = (scenario: (typeof MODEL_SCENARIOS)[number]) => {
  const input = createScenarioInput(scenario.routeId);
  const evaluation = evaluateEvidenceLadder(input, scenario.reveal);

  const hasAllSteps = evaluation.revealedSteps.length === 3;

  if (hasAllSteps) {
    assertEqual(
      evaluation.seal.level,
      "sealed",
      `Scenario ${scenario.id} should be sealed when all steps are present`
    );
  } else {
    assertTruthy(
      evaluation.seal.level === "open" || evaluation.seal.level === "forming",
      `Scenario ${scenario.id} should remain open/forming before full ladder`
    );
  }

  assertGreaterOrEqual(
    evaluation.confidence,
    scenario.expectedMinConfidence,
    `Scenario ${scenario.id} confidence floor mismatch`
  );

  assertLessOrEqual(
    evaluation.uncertainty,
    scenario.expectedMaxUncertainty,
    `Scenario ${scenario.id} uncertainty cap mismatch`
  );

  expectedStageSnapshots[scenario.routeId][evaluation.seal.level] += 1;

  return evaluation;
};

const test_normalization_rules = () => {
  section("model.normalize");
  for (const testCase of expectedNormalizationCases) {
    const normalized = normalizeRevealedSteps(testCase.input);
    assertDeepEqual(
      normalized,
      testCase.expected,
      `normalizeRevealedSteps mismatch for ${JSON.stringify(testCase.input)}`
    );
  }
};

const test_constraint_pressure_computation = () => {
  section("model.constraint-pressure");
  const input = createScenarioInput("route-proof-first");
  const pressure = computeConstraintPressure(input.constraints);

  assertGreaterOrEqual(pressure.totalSeverity, pressure.satisfiedSeverity, "total severity must be >= satisfied");
  assertGreaterOrEqual(pressure.totalSeverity, pressure.unsatisfiedSeverity, "total severity must be >= unsatisfied");
  assertLessOrEqual(pressure.satisfiedRatioScaled, 1000, "satisfied ratio must be <= 1000");
  assertGreaterOrEqual(pressure.satisfiedRatioScaled, 0, "satisfied ratio must be >= 0");
  assertTruthy(pressure.digest.length > 0, "pressure digest should not be empty");
};

const test_scenario_matrix_expectations = () => {
  section("model.scenarios");
  for (const scenario of MODEL_SCENARIOS) {
    assertScenario(scenario);
  }

  assertGreaterOrEqual(
    expectedStageSnapshots["route-proof-first"].sealed,
    1,
    "proof-first should produce at least one sealed scenario"
  );
  assertGreaterOrEqual(
    expectedStageSnapshots["route-speed-first"].sealed,
    1,
    "speed-first should produce at least one sealed scenario"
  );
  assertGreaterOrEqual(
    expectedStageSnapshots["route-min-capex"].forming,
    1,
    "min-capex should produce forming scenarios"
  );
};

const test_monotonic_confidence_and_uncertainty = () => {
  section("model.monotonic");

  const routeIds = [
    "route-proof-first",
    "route-speed-first",
    "route-min-capex",
    "route-balanced",
  ];

  for (const routeId of routeIds) {
    const input = createScenarioInput(routeId);
    const eval0 = evaluateEvidenceLadder(input, []);
    const eval1 = evaluateEvidenceLadder(input, ["E1"]);
    const eval2 = evaluateEvidenceLadder(input, ["E1", "E2"]);
    const eval3 = evaluateEvidenceLadder(input, ["E1", "E2", "E3"]);

    assertMonotonicIncrease(
      [eval0.confidence, eval1.confidence, eval2.confidence, eval3.confidence],
      `${routeId} confidence`
    );
    assertMonotonicDecrease(
      [eval0.uncertainty, eval1.uncertainty, eval2.uncertainty, eval3.uncertainty],
      `${routeId} uncertainty`
    );
  }
};

const test_step_preview_consistency = () => {
  section("model.step-preview");

  const input = createScenarioInput("route-proof-first");

  const previewE1 = computeStepPreview(input, [], "E1");
  assertTruthy(previewE1 !== null, "preview E1 should exist");
  if (!previewE1) return;

  assertGreaterOrEqual(previewE1.confidenceGain, 1, "preview E1 confidence gain must be positive");
  assertGreaterOrEqual(previewE1.uncertaintyDrop, 1, "preview E1 uncertainty drop must be positive");

  const previewInvalid = computeStepPreview(input, [], "E2");
  assertEqual(previewInvalid, null, "preview E2 should be null without E1");

  const previewE2 = computeStepPreview(input, ["E1"], "E2");
  assertTruthy(previewE2 !== null, "preview E2 should exist after E1");

  const previewDuplicate = computeStepPreview(input, ["E1"], "E1");
  assertEqual(previewDuplicate, null, "preview duplicate should be null");
};

const test_hash_stability = () => {
  section("model.hash");

  const inputA = createScenarioInput("route-proof-first");
  const inputB = createScenarioInput("route-proof-first");
  const hashA = stableInputHash(inputA);
  const hashB = stableInputHash(inputB);

  assertEqual(hashA, hashB, "input hash should be stable for same scenario");

  const inputC = createScenarioInput("route-speed-first");
  const hashC = stableInputHash(inputC);
  assertTruthy(hashA !== hashC, "hash should differ for different scenarios");
};

const test_probe_determinism = () => {
  section("model.probe");

  const input = createScenarioInput("route-balanced");
  const actionDigest = "E1>E2>E3>COMMIT";

  const probeA = toDeterministicProbe(input, ["E1", "E2", "E3"], actionDigest);
  const probeB = toDeterministicProbe(input, ["E1", "E2", "E3"], actionDigest);

  assertDeepEqual(probeA, probeB, "determinism probe must match across repeated executions");
};

const deterministicSweepCases: Array<{
  routeId: string;
  reveals: Array<Array<"E1" | "E2" | "E3">>;
}> = [
  {
    routeId: "route-proof-first",
    reveals: [
      [],
      ["E1"],
      ["E1", "E2"],
      ["E1", "E2", "E3"],
      ["E1", "E3"],
      ["E2"],
      ["E3"],
      ["E1", "E2", "E3", "E3"],
    ],
  },
  {
    routeId: "route-speed-first",
    reveals: [
      [],
      ["E1"],
      ["E1", "E2"],
      ["E1", "E2", "E3"],
      ["E1", "E3"],
      ["E2"],
      ["E3"],
      ["E1", "E2", "E3", "E1"],
    ],
  },
  {
    routeId: "route-min-capex",
    reveals: [
      [],
      ["E1"],
      ["E1", "E2"],
      ["E1", "E2", "E3"],
      ["E1", "E3"],
      ["E2"],
      ["E3"],
      ["E1", "E2", "E3", "E2"],
    ],
  },
  {
    routeId: "route-balanced",
    reveals: [
      [],
      ["E1"],
      ["E1", "E2"],
      ["E1", "E2", "E3"],
      ["E1", "E3"],
      ["E2"],
      ["E3"],
      ["E1", "E2", "E3", "E2"],
    ],
  },
];

const test_deterministic_sweep = () => {
  section("model.sweep");

  deterministicSweepCases.forEach((entry) => {
    const input = createScenarioInput(entry.routeId);

    entry.reveals.forEach((revealed, index) => {
      const first = evaluateEvidenceLadder(input, revealed);
      const second = evaluateEvidenceLadder(input, revealed);

      assertEqual(
        first.confidence,
        second.confidence,
        `sweep confidence mismatch ${entry.routeId} case ${index}`
      );
      assertEqual(
        first.uncertainty,
        second.uncertainty,
        `sweep uncertainty mismatch ${entry.routeId} case ${index}`
      );
      assertEqual(
        first.seal.level,
        second.seal.level,
        `sweep seal mismatch ${entry.routeId} case ${index}`
      );

      const normalized = normalizeRevealedSteps(revealed);
      assertLessOrEqual(
        first.revealedSteps.length,
        normalized.length,
        `normalized length mismatch ${entry.routeId} case ${index}`
      );
    });
  });
};

export const runEvidenceModelSpecs = () => {
  test_normalization_rules();
  test_constraint_pressure_computation();
  test_scenario_matrix_expectations();
  test_monotonic_confidence_and_uncertainty();
  test_step_preview_consistency();
  test_hash_stability();
  test_probe_determinism();
  test_deterministic_sweep();
};
