import { createDefaultEvidenceModelInput } from "../core/evidence";
import {
  createInitialSlide03State,
  reduceSlide03State,
  reduceSlide03StateWithEnvelope,
  selectAllCardViews,
  Slide03Action,
  Slide03State,
  summarizeActionDigest,
} from "../core/fsm";
import {
  assertDeepEqual,
  assertEqual,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertTruthy,
  section,
} from "./assert";

const pointerArmSequence = (
  state: Slide03State,
  stepId: "E1" | "E2" | "E3",
  pointerId: number
): Slide03State => {
  const start = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId,
    pointerId,
    source: "user",
    capture: true,
  });

  const frame = reduceSlide03State(start, {
    type: "POINTER_FRAME",
    stepId,
    pointerId,
    ratio: 1,
    source: "user",
    capture: true,
  });

  const end = reduceSlide03State(frame, {
    type: "POINTER_END",
    stepId,
    pointerId,
    source: "user",
    capture: true,
  });

  return end;
};

const confirmStep = (
  state: Slide03State,
  stepId: "E1" | "E2" | "E3"
): Slide03State =>
  reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId,
    source: "user",
    capture: true,
  });

const buildFullyRevealedState = (): Slide03State => {
  const base = createInitialSlide03State(createDefaultEvidenceModelInput());
  const e1Armed = pointerArmSequence(base, "E1", 101);
  const e1Confirmed = confirmStep(e1Armed, "E1");
  const e2Armed = pointerArmSequence(e1Confirmed, "E2", 102);
  const e2Confirmed = confirmStep(e2Armed, "E2");
  const e3Armed = pointerArmSequence(e2Confirmed, "E3", 103);
  const e3Confirmed = confirmStep(e3Armed, "E3");
  return e3Confirmed;
};

const test_initial_state_contract = () => {
  section("fsm.initial");

  const state = createInitialSlide03State(createDefaultEvidenceModelInput());

  assertEqual(state.stage, "idle", "initial stage must be idle");
  assertEqual(state.contractVersion, "slide03-contract-v1", "contract version mismatch");
  assertEqual(state.revealedSteps.length, 0, "initial revealed should be empty");
  assertEqual(state.nextExpectedStep, "E1", "initial next expected should be E1");
  assertEqual(state.pointer.active, false, "pointer must start inactive");
  assertEqual(state.evaluation.seal.level, "open", "initial seal must be open");
  assertEqual(state.cards.E1.visualState, "pending", "E1 should be pending initially");
  assertEqual(state.cards.E2.visualState, "disabled", "E2 should be disabled initially");
  assertEqual(state.cards.E3.visualState, "disabled", "E3 should be disabled initially");
};

const test_initial_enabled_card_wiring = () => {
  section("fsm.initial-enabled-card");

  const state = createInitialSlide03State(createDefaultEvidenceModelInput());
  const cards = selectAllCardViews(state);
  const enabledCards = cards.filter((card) => card.enabled);

  assertEqual(enabledCards.length, 1, "exactly one card must be enabled at init");
  assertEqual(enabledCards[0]?.stepId, "E1", "E1 must be the enabled card at init");
};

const test_idle_to_step1_after_confirm_e1 = () => {
  section("fsm.idle-to-step1");

  const initial = createInitialSlide03State(createDefaultEvidenceModelInput());
  const armed = pointerArmSequence(initial, "E1", 404);

  const result = reduceSlide03StateWithEnvelope(armed, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  assertEqual(result.envelope.accepted, true, "confirm E1 should be accepted after arming");
  assertEqual(result.state.stage, "step1", "state should advance to step1 after confirming E1");
  assertDeepEqual(result.state.revealedSteps, ["E1"], "E1 should be revealed after confirming E1");
  assertEqual(result.state.nextExpectedStep, "E2", "E2 must be next expected after E1");
};

const test_pointer_start_guard = () => {
  section("fsm.pointer-start");

  const state = createInitialSlide03State(createDefaultEvidenceModelInput());

  const wrongStep = reduceSlide03StateWithEnvelope(state, {
    type: "POINTER_START",
    stepId: "E2",
    pointerId: 1,
    source: "user",
    capture: true,
  });

  assertEqual(wrongStep.envelope.accepted, false, "pointer start on wrong step should be rejected");
  assertEqual(wrongStep.state.stage, "idle", "rejected pointer start should not change stage");
  assertEqual(wrongStep.state.pointer.active, false, "rejected pointer start should keep pointer inactive");

  const rightStep = reduceSlide03StateWithEnvelope(state, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 2,
    source: "user",
    capture: true,
  });

  assertEqual(rightStep.envelope.accepted, true, "pointer start on expected step should be accepted");
  assertEqual(rightStep.state.pointer.active, true, "pointer should be active");
  assertEqual(rightStep.state.pointer.stepId, "E1", "pointer step should be E1");
};

const test_pointer_frame_guard = () => {
  section("fsm.pointer-frame");

  const state = createInitialSlide03State(createDefaultEvidenceModelInput());

  const rejectedNoStart = reduceSlide03StateWithEnvelope(state, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 11,
    ratio: 0.6,
    source: "user",
    capture: true,
  });

  assertEqual(rejectedNoStart.envelope.accepted, false, "frame without start should be rejected");

  const started = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 11,
    source: "user",
    capture: true,
  });

  const mismatchPointer = reduceSlide03StateWithEnvelope(started, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 12,
    ratio: 0.7,
    source: "user",
    capture: true,
  });

  assertEqual(mismatchPointer.envelope.accepted, false, "frame with wrong pointer id should reject");

  const validFrame = reduceSlide03State(started, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 11,
    ratio: 0.95,
    source: "user",
    capture: true,
  });

  assertTruthy(validFrame.cards.E1.armed, "valid frame above threshold should arm card");
  assertGreaterOrEqual(validFrame.cards.E1.progress, validFrame.cards.E1.unlockThreshold, "progress should reach threshold");
};

const test_pointer_end_behavior = () => {
  section("fsm.pointer-end");

  const base = createInitialSlide03State(createDefaultEvidenceModelInput());

  const lowProgress = reduceSlide03State(base, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 20,
    source: "user",
    capture: true,
  });

  const lowProgressFrame = reduceSlide03State(lowProgress, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 20,
    ratio: 0.25,
    source: "user",
    capture: true,
  });

  const lowProgressEnd = reduceSlide03State(lowProgressFrame, {
    type: "POINTER_END",
    stepId: "E1",
    pointerId: 20,
    source: "user",
    capture: true,
  });

  assertEqual(lowProgressEnd.cards.E1.armed, false, "below-threshold end should not arm card");
  assertEqual(lowProgressEnd.cards.E1.progress, 0, "below-threshold end should reset progress");

  const highProgress = pointerArmSequence(base, "E1", 21);
  assertEqual(highProgress.cards.E1.armed, true, "high-threshold end should arm card");
  assertTruthy(highProgress.cards.E1.progress >= highProgress.cards.E1.unlockThreshold, "progress should remain high");
};

const test_confirm_guards = () => {
  section("fsm.confirm");

  const base = createInitialSlide03State(createDefaultEvidenceModelInput());

  const confirmBeforeArm = reduceSlide03StateWithEnvelope(base, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  assertEqual(confirmBeforeArm.envelope.accepted, false, "confirm before arm should reject");

  const armed = pointerArmSequence(base, "E1", 30);
  const wrongStep = reduceSlide03StateWithEnvelope(armed, {
    type: "CONFIRM_STEP",
    stepId: "E2",
    source: "user",
    capture: true,
  });

  assertEqual(wrongStep.envelope.accepted, false, "confirm wrong step should reject");

  const confirmed = confirmStep(armed, "E1");

  assertEqual(confirmed.stage, "step1", "confirm E1 should move stage to step1");
  assertDeepEqual(confirmed.revealedSteps, ["E1"], "confirm E1 should reveal E1");
  assertEqual(confirmed.nextExpectedStep, "E2", "after E1, next expected must be E2");
  assertEqual(confirmed.cards.E1.revealed, true, "E1 should be revealed");
  assertEqual(confirmed.cards.E1.locked, true, "E1 should be locked");
};

const test_full_ladder_and_seal_commit = () => {
  section("fsm.full-ladder");

  const revealed = buildFullyRevealedState();

  assertEqual(revealed.stage, "step3", "after E3 confirm stage should be step3");
  assertDeepEqual(revealed.revealedSteps, ["E1", "E2", "E3"], "all steps should be revealed");
  assertEqual(revealed.nextExpectedStep, null, "after E3 next expected should be null");
  assertEqual(revealed.evaluation.seal.level, "sealed", "evaluation should be sealed-ready");

  const committed = reduceSlide03State(revealed, {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  assertEqual(committed.stage, "sealed", "commit should move stage to sealed");
  assertEqual(committed.cards.E1.visualState, "locked", "E1 should be locked after commit");
  assertEqual(committed.cards.E2.visualState, "locked", "E2 should be locked after commit");
  assertEqual(committed.cards.E3.visualState, "locked", "E3 should be locked after commit");
};

const test_commit_seal_guards = () => {
  section("fsm.commit-guards");

  const initial = createInitialSlide03State(createDefaultEvidenceModelInput());
  const rejectedEarly = reduceSlide03StateWithEnvelope(initial, {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  assertEqual(rejectedEarly.envelope.accepted, false, "commit before step3 should reject");

  const step3 = buildFullyRevealedState();
  const committed = reduceSlide03State(step3, {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  const secondCommit = reduceSlide03StateWithEnvelope(committed, {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  assertEqual(secondCommit.envelope.accepted, false, "commit on sealed should reject");
};

const test_reset_session = () => {
  section("fsm.reset");

  const sealed = reduceSlide03State(buildFullyRevealedState(), {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  const reset = reduceSlide03State(sealed, {
    type: "RESET_SESSION",
    reason: "unit-test",
    source: "user",
    capture: true,
  });

  assertEqual(reset.stage, "idle", "reset should return to idle");
  assertDeepEqual(reset.revealedSteps, [], "reset should clear revealed steps");
  assertEqual(reset.nextExpectedStep, "E1", "reset should restore E1 as next expected");
  assertEqual(reset.cards.E1.visualState, "pending", "reset should restore E1 pending");
  assertEqual(reset.cards.E2.visualState, "disabled", "reset should restore E2 disabled");
};

const test_replay_log_accounting = () => {
  section("fsm.replay-log");

  let state = createInitialSlide03State(createDefaultEvidenceModelInput());

  const actions: Slide03Action[] = [
    {
      type: "POINTER_START",
      stepId: "E1",
      pointerId: 201,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_FRAME",
      stepId: "E1",
      pointerId: 201,
      ratio: 1,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_END",
      stepId: "E1",
      pointerId: 201,
      source: "user",
      capture: true,
    },
    {
      type: "CONFIRM_STEP",
      stepId: "E1",
      source: "user",
      capture: true,
    },
    {
      type: "CONFIRM_STEP",
      stepId: "E3",
      source: "user",
      capture: true,
    },
  ];

  actions.forEach((action) => {
    state = reduceSlide03State(state, action);
  });

  assertEqual(state.replayLog.length, actions.length, "replay log length should match captured actions");
  assertEqual(state.replaySummary.totalActions, actions.length, "replay summary total mismatch");
  assertEqual(state.replaySummary.rejectedActions, 1, "replay summary rejected mismatch");
  assertEqual(state.replaySummary.acceptedActions, actions.length - 1, "replay summary accepted mismatch");

  const digest = summarizeActionDigest(state);
  assertTruthy(digest.includes("CONFIRM_STEP"), "digest should include confirm actions");
};

const test_reducer_determinism_for_script = () => {
  section("fsm.determinism");

  const script: Slide03Action[] = [
    {
      type: "POINTER_START",
      stepId: "E1",
      pointerId: 301,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_FRAME",
      stepId: "E1",
      pointerId: 301,
      ratio: 1,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_END",
      stepId: "E1",
      pointerId: 301,
      source: "user",
      capture: true,
    },
    {
      type: "CONFIRM_STEP",
      stepId: "E1",
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_START",
      stepId: "E2",
      pointerId: 302,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_FRAME",
      stepId: "E2",
      pointerId: 302,
      ratio: 1,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_END",
      stepId: "E2",
      pointerId: 302,
      source: "user",
      capture: true,
    },
    {
      type: "CONFIRM_STEP",
      stepId: "E2",
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_START",
      stepId: "E3",
      pointerId: 303,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_FRAME",
      stepId: "E3",
      pointerId: 303,
      ratio: 1,
      source: "user",
      capture: true,
    },
    {
      type: "POINTER_END",
      stepId: "E3",
      pointerId: 303,
      source: "user",
      capture: true,
    },
    {
      type: "CONFIRM_STEP",
      stepId: "E3",
      source: "user",
      capture: true,
    },
    {
      type: "COMMIT_SEAL",
      source: "user",
      capture: true,
    },
  ];

  let stateA = createInitialSlide03State(createDefaultEvidenceModelInput());
  let stateB = createInitialSlide03State(createDefaultEvidenceModelInput());

  script.forEach((action) => {
    stateA = reduceSlide03State(stateA, action);
  });

  script.forEach((action) => {
    stateB = reduceSlide03State(stateB, action);
  });

  assertEqual(stateA.stage, "sealed", "determinism script should end sealed (A)");
  assertEqual(stateB.stage, "sealed", "determinism script should end sealed (B)");
  assertEqual(stateA.evaluation.confidence, stateB.evaluation.confidence, "confidence must match deterministically");
  assertEqual(stateA.evaluation.uncertainty, stateB.evaluation.uncertainty, "uncertainty must match deterministically");
  assertEqual(stateA.replayLog.length, stateB.replayLog.length, "replay length must match deterministically");

  assertGreaterOrEqual(stateA.evaluation.confidence, 85, "sealed confidence should be high");
  assertLessOrEqual(stateA.evaluation.uncertainty, 35, "sealed uncertainty should be low");
};

export const runFsmReducerSpecs = () => {
  test_initial_state_contract();
  test_initial_enabled_card_wiring();
  test_idle_to_step1_after_confirm_e1();
  test_pointer_start_guard();
  test_pointer_frame_guard();
  test_pointer_end_behavior();
  test_confirm_guards();
  test_full_ladder_and_seal_commit();
  test_commit_seal_guards();
  test_reset_session();
  test_replay_log_accounting();
  test_reducer_determinism_for_script();
};
