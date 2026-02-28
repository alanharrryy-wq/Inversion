import { createDefaultEvidenceModelInput } from "../core/evidence";
import {
  buildReplayPayload,
  parseReplayPayload,
  playReplayPayload,
  replayDigest,
  replayIdentity,
  replayPayloadToJson,
  runReplayFromJson,
} from "../core/replay";
import {
  createInitialSlide03State,
  reduceSlide03State,
  Slide03State,
} from "../core/fsm";
import {
  assertDeepEqual,
  assertEqual,
  assertGreaterOrEqual,
  assertTruthy,
  section,
} from "./assert";

const driveToSealed = (): Slide03State => {
  let state = createInitialSlide03State(createDefaultEvidenceModelInput());

  state = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 1,
    ratio: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_END",
    stepId: "E1",
    pointerId: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E2",
    pointerId: 2,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_FRAME",
    stepId: "E2",
    pointerId: 2,
    ratio: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_END",
    stepId: "E2",
    pointerId: 2,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E2",
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E3",
    pointerId: 3,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_FRAME",
    stepId: "E3",
    pointerId: 3,
    ratio: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_END",
    stepId: "E3",
    pointerId: 3,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E3",
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "COMMIT_SEAL",
    source: "user",
    capture: true,
  });

  return state;
};

const test_build_payload_contract = () => {
  section("replay.build");

  const state = driveToSealed();
  const payload = buildReplayPayload(state);

  assertEqual(payload.version, 1, "payload version should be 1");
  assertEqual(payload.routeId, state.modelInput.route.id, "payload route id mismatch");
  assertEqual(payload.expectedFinalStage, state.stage, "payload final stage mismatch");
  assertEqual(payload.expectedSealLevel, state.evaluation.seal.level, "payload seal level mismatch");
  assertGreaterOrEqual(payload.actions.length, 12, "payload should include multiple actions");
};

const test_minimal_interaction_captures_trace = () => {
  section("replay.minimal-trace");

  let state = createInitialSlide03State(createDefaultEvidenceModelInput());
  state = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 701,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 701,
    ratio: 1,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "POINTER_END",
    stepId: "E1",
    pointerId: 701,
    source: "user",
    capture: true,
  });
  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  const payload = buildReplayPayload(state, { onlyAccepted: true });

  assertTruthy(state.replayLog.length > 0, "state replay log should capture accepted minimal interaction");
  assertTruthy(payload.actions.length > 0, "replay payload should contain captured actions");
  assertEqual(payload.routeId, state.modelInput.route.id, "payload routeId should match model route");
  assertTruthy(payload.constraintDigest.length > 0, "payload constraint digest should be non-empty");
};

const test_payload_json_roundtrip = () => {
  section("replay.roundtrip");

  const state = driveToSealed();
  const payload = buildReplayPayload(state);
  const json = replayPayloadToJson(payload);

  assertTruthy(json.includes("\"version\": 1"), "json should include version field");
  assertTruthy(json.includes("\"expectedFinalStage\""), "json should include final stage field");

  const parsed = parseReplayPayload(json);
  assertTruthy(parsed !== null, "parsed payload should not be null");
  if (!parsed) return;

  assertDeepEqual(parsed.actions, payload.actions, "parsed actions should equal original actions");
  assertEqual(parsed.expectedFinalStage, payload.expectedFinalStage, "parsed final stage mismatch");
  assertEqual(parsed.expectedSealLevel, payload.expectedSealLevel, "parsed seal level mismatch");
};

const invalidPayloadSamples = [
  "",
  "{}",
  "{\"version\":2}",
  "{\"version\":1,\"actions\":[]}",
  "{\"version\":1,\"routeId\":\"x\",\"constraintDigest\":\"y\",\"actions\":[{\"type\":\"NOPE\"}],\"expectedFinalStage\":\"idle\",\"expectedFinalConfidence\":1,\"expectedFinalUncertainty\":1,\"expectedSealLevel\":\"open\"}",
  "{\"version\":1,\"routeId\":\"x\",\"constraintDigest\":\"y\",\"actions\":[{\"type\":\"POINTER_START\",\"stepId\":\"E1\"}],\"expectedFinalStage\":\"idle\",\"expectedFinalConfidence\":1,\"expectedFinalUncertainty\":1,\"expectedSealLevel\":\"open\"}",
];

const test_invalid_parse_cases = () => {
  section("replay.invalid-parse");

  invalidPayloadSamples.forEach((sample, index) => {
    const parsed = parseReplayPayload(sample);
    assertEqual(parsed, null, `invalid payload sample ${index} should parse as null`);
  });
};

const test_playback_success = () => {
  section("replay.playback-success");

  const sealed = driveToSealed();
  const payload = buildReplayPayload(sealed);

  const replayResult = playReplayPayload(sealed, payload);

  assertEqual(replayResult.success, true, "replay should succeed");
  assertEqual(replayResult.finalState.stage, sealed.stage, "replay final stage mismatch");
  assertEqual(
    replayResult.finalState.evaluation.confidence,
    sealed.evaluation.confidence,
    "replay final confidence mismatch"
  );
  assertEqual(
    replayResult.finalState.evaluation.uncertainty,
    sealed.evaluation.uncertainty,
    "replay final uncertainty mismatch"
  );
  assertEqual(replayResult.finalState.evaluation.seal.level, "sealed", "replay final seal should be sealed");
};

const test_playback_mismatch_detection = () => {
  section("replay.playback-mismatch");

  const sealed = driveToSealed();
  const payload = buildReplayPayload(sealed);

  payload.expectedFinalStage = "idle";

  const replayResult = playReplayPayload(sealed, payload);

  assertEqual(replayResult.success, false, "tampered replay should fail");
  assertTruthy(replayResult.mismatches.length > 0, "tampered replay should report mismatch");
  assertTruthy(
    replayResult.mismatches.some((mismatch) => mismatch.reason.includes("stage mismatch")),
    "tampered replay should include stage mismatch"
  );
};

const test_run_replay_from_json = () => {
  section("replay.run-from-json");

  const sealed = driveToSealed();
  const payload = buildReplayPayload(sealed);
  const json = replayPayloadToJson(payload);

  const ok = runReplayFromJson(sealed, json);
  assertEqual(ok.success, true, "runReplayFromJson should succeed with valid json");
  assertEqual(ok.finalState.stage, "sealed", "runReplayFromJson should end sealed");

  const bad = runReplayFromJson(sealed, "{ bad json");
  assertEqual(bad.success, false, "runReplayFromJson should fail with invalid json");
  assertTruthy(bad.mismatches.length > 0, "invalid run should include mismatches");
};

const test_replay_digest_and_identity = () => {
  section("replay.digest");

  const sealed = driveToSealed();
  const payloadA = buildReplayPayload(sealed);
  const payloadB = buildReplayPayload(sealed);

  const digestA = replayDigest(payloadA);
  const digestB = replayDigest(payloadB);

  assertEqual(digestA, digestB, "replay digest should be deterministic");

  const identityA = replayIdentity(sealed, payloadA);
  const identityB = replayIdentity(sealed, payloadB);

  assertEqual(identityA, identityB, "replay identity should be deterministic");
};

const test_replay_only_accepted_actions = () => {
  section("replay.only-accepted");

  let state = createInitialSlide03State(createDefaultEvidenceModelInput());

  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "POINTER_START",
    stepId: "E1",
    pointerId: 901,
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "POINTER_FRAME",
    stepId: "E1",
    pointerId: 901,
    ratio: 1,
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "POINTER_END",
    stepId: "E1",
    pointerId: 901,
    source: "user",
    capture: true,
  });

  state = reduceSlide03State(state, {
    type: "CONFIRM_STEP",
    stepId: "E1",
    source: "user",
    capture: true,
  });

  const acceptedOnly = buildReplayPayload(state, { onlyAccepted: true });
  const all = buildReplayPayload(state, { onlyAccepted: false });

  assertTruthy(all.actions.length >= acceptedOnly.actions.length, "all actions should be >= accepted-only actions");
  assertTruthy(
    acceptedOnly.actions.length < all.actions.length,
    "accepted-only payload should drop rejected actions"
  );
};

export const runReplaySpecs = () => {
  test_build_payload_contract();
  test_minimal_interaction_captures_trace();
  test_payload_json_roundtrip();
  test_invalid_parse_cases();
  test_playback_success();
  test_playback_mismatch_detection();
  test_run_replay_from_json();
  test_replay_digest_and_identity();
  test_replay_only_accepted_actions();
};
