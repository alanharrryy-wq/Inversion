import { createDefaultEvidenceModelInput } from "../core/evidence";
import {
  createInitialSlide03State,
  reduceSlide03State,
  Slide03Action,
  Slide03State,
} from "../core/fsm";
import {
  assertEqual,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertTruthy,
  section,
} from "./assert";

interface ScriptCase {
  id: string;
  label: string;
  actions: Slide03Action[];
  expectedStage: Slide03State["stage"];
  expectedSeal: "open" | "forming" | "sealed";
  minConfidence: number;
  maxUncertainty: number;
}

const S = (stepId: "E1" | "E2" | "E3", pointerId: number): Slide03Action => ({
  type: "POINTER_START",
  stepId,
  pointerId,
  source: "user",
  capture: true,
});

const F = (stepId: "E1" | "E2" | "E3", pointerId: number, ratio: number): Slide03Action => ({
  type: "POINTER_FRAME",
  stepId,
  pointerId,
  ratio,
  source: "user",
  capture: true,
});

const E = (stepId: "E1" | "E2" | "E3", pointerId: number): Slide03Action => ({
  type: "POINTER_END",
  stepId,
  pointerId,
  source: "user",
  capture: true,
});

const C = (stepId: "E1" | "E2" | "E3"): Slide03Action => ({
  type: "CONFIRM_STEP",
  stepId,
  source: "user",
  capture: true,
});

const X = (stepId: "E1" | "E2" | "E3", pointerId: number, reason: string): Slide03Action => ({
  type: "POINTER_CANCEL",
  stepId,
  pointerId,
  reason,
  source: "user",
  capture: true,
});

const COMMIT: Slide03Action = {
  type: "COMMIT_SEAL",
  source: "user",
  capture: true,
};

const scripts: ScriptCase[] = [
  {
    id: "script-01",
    label: "single step commit attempt rejected",
    actions: [S("E1", 1), F("E1", 1, 1), E("E1", 1), C("E1"), COMMIT],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-02",
    label: "full flow with seal commit",
    actions: [
      S("E1", 1), F("E1", 1, 1), E("E1", 1), C("E1"),
      S("E2", 2), F("E2", 2, 1), E("E2", 2), C("E2"),
      S("E3", 3), F("E3", 3, 1), E("E3", 3), C("E3"),
      COMMIT,
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-03",
    label: "cancel first attempt then succeed",
    actions: [
      S("E1", 11), F("E1", 11, 0.5), X("E1", 11, "manual-cancel"),
      S("E1", 12), F("E1", 12, 1), E("E1", 12), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-04",
    label: "partial progress release then retry",
    actions: [
      S("E1", 21), F("E1", 21, 0.3), E("E1", 21),
      S("E1", 22), F("E1", 22, 1), E("E1", 22), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-05",
    label: "wrong step attempts ignored before E1",
    actions: [
      S("E2", 31),
      S("E3", 32),
      C("E2"),
      S("E1", 33), F("E1", 33, 1), E("E1", 33), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-06",
    label: "E1 and E2 only",
    actions: [
      S("E1", 41), F("E1", 41, 1), E("E1", 41), C("E1"),
      S("E2", 42), F("E2", 42, 1), E("E2", 42), C("E2"),
    ],
    expectedStage: "step2",
    expectedSeal: "forming",
    minConfidence: 72,
    maxUncertainty: 50,
  },
  {
    id: "script-07",
    label: "E2 confirm before arm rejected",
    actions: [
      S("E1", 51), F("E1", 51, 1), E("E1", 51), C("E1"),
      C("E2"),
      S("E2", 52), F("E2", 52, 1), E("E2", 52), C("E2"),
    ],
    expectedStage: "step2",
    expectedSeal: "forming",
    minConfidence: 72,
    maxUncertainty: 50,
  },
  {
    id: "script-08",
    label: "full flow without commit remains step3",
    actions: [
      S("E1", 61), F("E1", 61, 1), E("E1", 61), C("E1"),
      S("E2", 62), F("E2", 62, 1), E("E2", 62), C("E2"),
      S("E3", 63), F("E3", 63, 1), E("E3", 63), C("E3"),
    ],
    expectedStage: "step3",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-09",
    label: "full flow with extra invalid pointer after sealed",
    actions: [
      S("E1", 71), F("E1", 71, 1), E("E1", 71), C("E1"),
      S("E2", 72), F("E2", 72, 1), E("E2", 72), C("E2"),
      S("E3", 73), F("E3", 73, 1), E("E3", 73), C("E3"),
      COMMIT,
      S("E3", 74),
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-10",
    label: "multiple frame updates before release",
    actions: [
      S("E1", 81), F("E1", 81, 0.25), F("E1", 81, 0.48), F("E1", 81, 0.77), F("E1", 81, 1), E("E1", 81), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-11",
    label: "pointer id mismatch produces stable state",
    actions: [
      S("E1", 91), F("E1", 99, 1), E("E1", 99),
      F("E1", 91, 1), E("E1", 91), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-12",
    label: "duplicate confirm after reveal rejected",
    actions: [
      S("E1", 101), F("E1", 101, 1), E("E1", 101), C("E1"), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-13",
    label: "reset mid flow",
    actions: [
      S("E1", 111), F("E1", 111, 1), E("E1", 111), C("E1"),
      { type: "RESET_SESSION", reason: "test-reset", source: "user", capture: true },
    ],
    expectedStage: "idle",
    expectedSeal: "open",
    minConfidence: 35,
    maxUncertainty: 80,
  },
  {
    id: "script-14",
    label: "reset after full reveal",
    actions: [
      S("E1", 121), F("E1", 121, 1), E("E1", 121), C("E1"),
      S("E2", 122), F("E2", 122, 1), E("E2", 122), C("E2"),
      S("E3", 123), F("E3", 123, 1), E("E3", 123), C("E3"),
      { type: "RESET_SESSION", reason: "late-reset", source: "user", capture: true },
    ],
    expectedStage: "idle",
    expectedSeal: "open",
    minConfidence: 35,
    maxUncertainty: 80,
  },
  {
    id: "script-15",
    label: "full flow with extra commit attempt",
    actions: [
      S("E1", 131), F("E1", 131, 1), E("E1", 131), C("E1"),
      S("E2", 132), F("E2", 132, 1), E("E2", 132), C("E2"),
      S("E3", 133), F("E3", 133, 1), E("E3", 133), C("E3"),
      COMMIT,
      COMMIT,
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-16",
    label: "arm E1 twice before confirm",
    actions: [
      S("E1", 141), F("E1", 141, 1), E("E1", 141),
      S("E1", 142), F("E1", 142, 1), E("E1", 142),
      C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-17",
    label: "cancel on E2 then complete",
    actions: [
      S("E1", 151), F("E1", 151, 1), E("E1", 151), C("E1"),
      S("E2", 152), F("E2", 152, 0.5), X("E2", 152, "cancel-e2"),
      S("E2", 153), F("E2", 153, 1), E("E2", 153), C("E2"),
    ],
    expectedStage: "step2",
    expectedSeal: "forming",
    minConfidence: 72,
    maxUncertainty: 50,
  },
  {
    id: "script-18",
    label: "try E3 directly and fail then complete full",
    actions: [
      S("E3", 161),
      S("E1", 162), F("E1", 162, 1), E("E1", 162), C("E1"),
      S("E2", 163), F("E2", 163, 1), E("E2", 163), C("E2"),
      S("E3", 164), F("E3", 164, 1), E("E3", 164), C("E3"),
      COMMIT,
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-19",
    label: "replay-like deterministic repeated E1 reject cases",
    actions: [
      C("E1"),
      S("E1", 171), F("E1", 171, 1), E("E1", 171), C("E1"),
      C("E1"),
      C("E2"),
      C("E3"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-20",
    label: "commit attempted at each stage",
    actions: [
      COMMIT,
      S("E1", 181), F("E1", 181, 1), E("E1", 181), C("E1"),
      COMMIT,
      S("E2", 182), F("E2", 182, 1), E("E2", 182), C("E2"),
      COMMIT,
      S("E3", 183), F("E3", 183, 1), E("E3", 183), C("E3"),
      COMMIT,
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
  {
    id: "script-21",
    label: "pointer cancel by blur reason simulation",
    actions: [
      S("E1", 191), F("E1", 191, 0.6), X("E1", 191, "window-blur"),
      S("E1", 192), F("E1", 192, 1), E("E1", 192), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-22",
    label: "progress decreases but max retained",
    actions: [
      S("E1", 201), F("E1", 201, 0.8), F("E1", 201, 0.4), F("E1", 201, 0.9), E("E1", 201), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-23",
    label: "minimal accepted actions for step1",
    actions: [
      S("E1", 211), F("E1", 211, 1), E("E1", 211), C("E1"),
    ],
    expectedStage: "step1",
    expectedSeal: "forming",
    minConfidence: 55,
    maxUncertainty: 60,
  },
  {
    id: "script-24",
    label: "minimal accepted actions for sealed",
    actions: [
      S("E1", 221), F("E1", 221, 1), E("E1", 221), C("E1"),
      S("E2", 222), F("E2", 222, 1), E("E2", 222), C("E2"),
      S("E3", 223), F("E3", 223, 1), E("E3", 223), C("E3"),
      COMMIT,
    ],
    expectedStage: "sealed",
    expectedSeal: "sealed",
    minConfidence: 85,
    maxUncertainty: 35,
  },
];

const executeScript = (script: ScriptCase): Slide03State => {
  let state = createInitialSlide03State(createDefaultEvidenceModelInput());
  script.actions.forEach((action) => {
    state = reduceSlide03State(state, action);
  });
  return state;
};

const test_script_matrix = () => {
  section("determinism.script-matrix");

  scripts.forEach((script) => {
    const finalState = executeScript(script);

    assertEqual(finalState.stage, script.expectedStage, `${script.id} stage mismatch`);
    assertEqual(finalState.evaluation.seal.level, script.expectedSeal, `${script.id} seal mismatch`);
    assertGreaterOrEqual(
      finalState.evaluation.confidence,
      script.minConfidence,
      `${script.id} confidence floor mismatch`
    );
    assertLessOrEqual(
      finalState.evaluation.uncertainty,
      script.maxUncertainty,
      `${script.id} uncertainty ceiling mismatch`
    );

    const hasReset = script.actions.some((action) => action.type === "RESET_SESSION");
    if (hasReset) {
      assertTruthy(
        finalState.replayLog.length <= script.actions.length,
        `${script.id} replay log should be bounded after reset`
      );
    } else {
      assertTruthy(
        finalState.replayLog.length === script.actions.length,
        `${script.id} replay log should track all actions`
      );
    }
  });
};

const test_repeated_execution_stability = () => {
  section("determinism.repeat");

  scripts.forEach((script) => {
    const first = executeScript(script);
    const second = executeScript(script);

    assertEqual(first.stage, second.stage, `${script.id} repeated stage mismatch`);
    assertEqual(
      first.evaluation.confidence,
      second.evaluation.confidence,
      `${script.id} repeated confidence mismatch`
    );
    assertEqual(
      first.evaluation.uncertainty,
      second.evaluation.uncertainty,
      `${script.id} repeated uncertainty mismatch`
    );
    assertEqual(first.evaluation.seal.level, second.evaluation.seal.level, `${script.id} repeated seal mismatch`);
  });
};

export const runDeterminismScriptSpecs = () => {
  test_script_matrix();
  test_repeated_execution_stability();
};
