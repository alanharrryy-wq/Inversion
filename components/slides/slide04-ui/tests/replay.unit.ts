import { strict as assert } from "node:assert";
import {
  actionToReplayEvent,
  appendReplayEvent,
  applyReplayJson,
  buildReplayTrace,
  createReplayTraceCapture,
  decodeReplayTrace,
  encodeReplayTrace,
  playbackReplayTrace,
  replayEventToAction,
} from "../core/replay";
import { createInitialLockState, reduceLockMachine } from "../core/fsm";
import { LockAction, ReplayEvent, ReplayTraceV1 } from "../core/types";

function createBaseTrace(): ReplayTraceV1 {
  return {
    version: "slide04-replay.v1",
    seed: "seed-route-service-led",
    meta: {
      scenario: "slide04-route-service-led",
      capturedAt: "1970-01-01T00:00:00.000Z",
    },
    events: [
      {
        seq: 1,
        atMs: 10,
        kind: "route.select",
        payload: { routeId: "route-service-led" },
      },
      {
        seq: 2,
        atMs: 20,
        kind: "constraint.set",
        payload: { constraintId: "integration-risk", state: "satisfied" },
      },
      {
        seq: 3,
        atMs: 30,
        kind: "evidence.toggle",
        payload: { evidenceId: "board-brief" },
      },
      {
        seq: 4,
        atMs: 40,
        kind: "seal.pointer.down",
        payload: { atMs: 40 },
      },
      {
        seq: 5,
        atMs: 1400,
        kind: "seal.pointer.up",
        payload: { atMs: 1400 },
      },
    ],
  };
}

function applyActionsToState(actions: LockAction[]) {
  return actions.reduce((state, action) => reduceLockMachine(state, action), createInitialLockState());
}

function test_action_to_replay_event_mapping() {
  const actions: LockAction[] = [
    { type: "route.select", routeId: "route-service-led", atMs: 10 },
    { type: "constraint.set", constraintId: "integration-risk", state: "satisfied", atMs: 11 },
    { type: "evidence.toggle", evidenceId: "board-brief", atMs: 12 },
    { type: "seal.pointer.down", atMs: 13 },
    { type: "seal.pointer.up", atMs: 1400 },
    { type: "seal.pointer.cancel", atMs: 15, reason: "pointer-cancel" },
    { type: "seal.unseal", atMs: 16 },
    { type: "seal.reset", atMs: 17 },
  ];

  const events = actions
    .map((action, index) => actionToReplayEvent(action, index + 1))
    .filter((value): value is ReplayEvent => !!value);

  assert.equal(events.length, 8);
  assert.equal(events[0].kind, "route.select");
  assert.equal(events[1].kind, "constraint.set");
  assert.equal(events[2].kind, "evidence.toggle");
  assert.equal(events[3].kind, "seal.pointer.down");
  assert.equal(events[4].kind, "seal.pointer.up");
  assert.equal(events[5].kind, "seal.pointer.cancel");
  assert.equal(events[6].kind, "seal.unseal");
  assert.equal(events[7].kind, "seal.reset");
}

function test_trace_capture_append_and_build() {
  const capture = createReplayTraceCapture("seed", "scenario");
  const withEvent = appendReplayEvent(capture, {
    seq: 1,
    atMs: 10,
    kind: "route.select",
    payload: { routeId: "route-service-led" },
  });

  assert.equal(withEvent.events.length, 1);

  const trace = buildReplayTrace(withEvent);
  assert.equal(trace.version, "slide04-replay.v1");
  assert.equal(trace.seed, "seed");
  assert.equal(trace.meta.scenario, "scenario");
}

function test_encode_decode_roundtrip() {
  const trace = createBaseTrace();
  const encoded = encodeReplayTrace(trace);
  const decoded = decodeReplayTrace(encoded);

  assert.equal(decoded.ok, true);
  if (!decoded.ok) {
    throw new Error("decode failed unexpectedly");
  }

  assert.equal(decoded.trace.events.length, trace.events.length);
  assert.equal(decoded.trace.seed, trace.seed);
}

function test_decode_rejects_wrong_version() {
  const payload = {
    ...createBaseTrace(),
    version: "slide04-replay.v0",
  };

  const decoded = decodeReplayTrace(JSON.stringify(payload));
  assert.equal(decoded.ok, false);
  if (decoded.ok) {
    throw new Error("expected decode failure for wrong version");
  }
  assert.equal(decoded.error.includes("version mismatch"), true);
}

function test_decode_rejects_invalid_event_kind() {
  const payload = {
    ...createBaseTrace(),
    events: [
      {
        seq: 1,
        atMs: 0,
        kind: "unknown",
        payload: {},
      },
    ],
  };

  const decoded = decodeReplayTrace(JSON.stringify(payload));
  assert.equal(decoded.ok, false);
  if (decoded.ok) {
    throw new Error("expected decode failure for invalid kind");
  }
  assert.equal(decoded.error.includes("unknown kind"), true);
}

function test_decode_rejects_invalid_seq() {
  const payload = {
    ...createBaseTrace(),
    events: [
      {
        seq: 0,
        atMs: 0,
        kind: "route.clear",
        payload: {},
      },
    ],
  };

  const decoded = decodeReplayTrace(JSON.stringify(payload));
  assert.equal(decoded.ok, false);
}

function test_decode_reports_non_monotonic_warning() {
  const payload = {
    ...createBaseTrace(),
    events: [
      {
        seq: 2,
        atMs: 0,
        kind: "route.clear",
        payload: {},
      },
      {
        seq: 1,
        atMs: 1,
        kind: "route.select",
        payload: { routeId: "route-service-led" },
      },
    ],
  };

  const decoded = decodeReplayTrace(JSON.stringify(payload));
  assert.equal(decoded.ok, true);
  if (!decoded.ok) {
    throw new Error("expected decode success with warning");
  }

  assert.equal(decoded.warnings.length > 0, true);
}

function test_replay_event_to_action_validation() {
  const invalidRouteEvent: ReplayEvent = {
    seq: 1,
    atMs: 0,
    kind: "route.select",
    payload: { routeId: "route-invalid" as never },
  };

  const mapped = replayEventToAction(invalidRouteEvent);
  assert.equal(mapped.action.type, "replay.failed");

  const validRouteEvent: ReplayEvent = {
    seq: 1,
    atMs: 0,
    kind: "route.select",
    payload: { routeId: "route-service-led" },
  };

  const validMapped = replayEventToAction(validRouteEvent);
  assert.equal(validMapped.action.type, "route.select");
}

function test_playback_trace_reaches_sealed_state() {
  const trace = createBaseTrace();
  const result = playbackReplayTrace(trace);

  assert.equal(result.ok, true);
  assert.equal(result.state.phase, "sealed");
  assert.equal(!!result.state.sealedSummary, true);
  assert.equal(result.state.sealedSummary?.seal.hash ? result.state.sealedSummary.seal.hash.length : 0, 8);
}

function test_playback_replay_deterministic_repeated_runs() {
  const trace = createBaseTrace();

  const runA = playbackReplayTrace(trace);
  const runB = playbackReplayTrace(trace);

  assert.equal(runA.state.phase, runB.state.phase);
  assert.equal(runA.state.sealedSummary?.seal.hash, runB.state.sealedSummary?.seal.hash);
  assert.equal(runA.errors.length, runB.errors.length);
}

function test_apply_replay_json_success_and_status_flag() {
  const json = encodeReplayTrace(createBaseTrace());
  const result = applyReplayJson(json, createInitialLockState());

  assert.equal(result.ok, true);
  assert.equal(result.state.replayStatus, "applied");
  assert.equal(result.state.replayLastHash != null, true);
}

function test_apply_replay_json_fail_parse() {
  const result = applyReplayJson("not-json", createInitialLockState());
  assert.equal(result.ok, false);
  assert.equal(result.state.replayStatus, "error");
  assert.equal(result.errors.length, 1);
}

function test_apply_replay_json_fail_invalid_payload() {
  const invalid = JSON.stringify({
    version: "slide04-replay.v1",
    seed: "seed",
    meta: { scenario: "s", capturedAt: "x" },
    events: [
      {
        seq: 1,
        atMs: 0,
        kind: "constraint.set",
        payload: { constraintId: "bad-constraint", state: "blocked" },
      },
    ],
  });

  const result = applyReplayJson(invalid, createInitialLockState());
  assert.equal(result.ok, false);
  assert.equal(result.state.replayStatus, "error");
  assert.equal(result.errors.length > 0, true);
}

function test_playback_matrix_multiple_routes_and_sequences() {
  const variants: ReplayTraceV1[] = [
    createBaseTrace(),
    {
      version: "slide04-replay.v1",
      seed: "seed-route-direct",
      meta: {
        scenario: "slide04-route-direct",
        capturedAt: "1970-01-01T00:00:00.000Z",
      },
      events: [
        { seq: 1, atMs: 10, kind: "route.select", payload: { routeId: "route-direct-oem" } },
        { seq: 2, atMs: 12, kind: "constraint.set", payload: { constraintId: "integration-risk", state: "satisfied" } },
        { seq: 3, atMs: 13, kind: "seal.pointer.down", payload: { atMs: 13 } },
        { seq: 4, atMs: 1300, kind: "seal.pointer.up", payload: { atMs: 1300 } },
      ],
    },
    {
      version: "slide04-replay.v1",
      seed: "seed-route-white",
      meta: {
        scenario: "slide04-route-white",
        capturedAt: "1970-01-01T00:00:00.000Z",
      },
      events: [
        { seq: 1, atMs: 10, kind: "route.select", payload: { routeId: "route-white-label" } },
        { seq: 2, atMs: 11, kind: "constraint.set", payload: { constraintId: "integration-risk", state: "satisfied" } },
        { seq: 3, atMs: 12, kind: "evidence.toggle", payload: { evidenceId: "board-brief" } },
        { seq: 4, atMs: 13, kind: "seal.pointer.down", payload: { atMs: 13 } },
        { seq: 5, atMs: 1410, kind: "seal.pointer.up", payload: { atMs: 1410 } },
      ],
    },
  ];

  for (const trace of variants) {
    const result = playbackReplayTrace(trace);
    assert.equal(result.state.phase, "sealed");
    assert.equal(!!result.state.sealedSummary, true);
    assert.equal(result.errors.length, 0);
  }
}

function test_trace_from_actions_equals_manual_state() {
  const actions: LockAction[] = [
    { type: "route.select", routeId: "route-service-led", atMs: 10 },
    { type: "constraint.set", constraintId: "integration-risk", state: "satisfied", atMs: 11 },
    { type: "seal.pointer.down", atMs: 12 },
    { type: "seal.pointer.tick", atMs: 1410 },
    { type: "seal.pointer.up", atMs: 1410 },
  ];

  const manual = applyActionsToState(actions);

  const events = actions
    .map((action, index) => actionToReplayEvent(action, index + 1))
    .filter((event): event is ReplayEvent => !!event);

  const trace: ReplayTraceV1 = {
    version: "slide04-replay.v1",
    seed: "seed-route-service-led",
    meta: {
      scenario: "slide04-route-service-led",
      capturedAt: "1970-01-01T00:00:00.000Z",
    },
    events,
  };

  const replayed = playbackReplayTrace(trace).state;

  assert.equal(manual.phase, replayed.phase);
  assert.equal(manual.sealedSummary?.seal.hash, replayed.sealedSummary?.seal.hash);
}

export function runSlide04ReplaySpecs() {
  test_action_to_replay_event_mapping();
  test_trace_capture_append_and_build();
  test_encode_decode_roundtrip();
  test_decode_rejects_wrong_version();
  test_decode_rejects_invalid_event_kind();
  test_decode_rejects_invalid_seq();
  test_decode_reports_non_monotonic_warning();
  test_replay_event_to_action_validation();
  test_playback_trace_reaches_sealed_state();
  test_playback_replay_deterministic_repeated_runs();
  test_apply_replay_json_success_and_status_flag();
  test_apply_replay_json_fail_parse();
  test_apply_replay_json_fail_invalid_payload();
  test_playback_matrix_multiple_routes_and_sequences();
  test_trace_from_actions_equals_manual_state();
}
