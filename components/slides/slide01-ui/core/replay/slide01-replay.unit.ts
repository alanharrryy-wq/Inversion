import { strict as assert } from "node:assert";
import { pointerTraceEventToActions } from "../fsm/actions";
import { reduceActions } from "../fsm/reducer";
import { Slide01PointerTraceEvent } from "../fsm/types";
import { replayResult, replayTraceFromInitial, replayTraceFromState } from "./runner";
import { SAMPLE_TRACE_ROUTE_A, SAMPLE_TRACE_ROUTE_B } from "./samples";
import {
  createTraceEnvelope,
  parseTraceEnvelope,
  serializeTraceEnvelope,
  validateTraceEnvelope,
} from "./trace";

function event(kind: Slide01PointerTraceEvent["kind"], seq: number, x: number, y: number) {
  return {
    kind,
    seq,
    x,
    y,
    pointerId: 1,
    button: 0,
    targetId: "slide01-weigh-arena",
  } satisfies Slide01PointerTraceEvent;
}

function test_serialize_and_parse_roundtrip(): void {
  const trace = [
    event("pointerdown", 1, 0.2, 0.44),
    event("pointermove", 2, 0.36, 0.56),
    event("pointerup", 3, 0.82, 0.78),
  ];
  const text = serializeTraceEnvelope(trace);
  assert.ok(text.includes("\"version\": \"slide01.trace.v1\""));
  const parsed = parseTraceEnvelope(text);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.envelope.events.length, trace.length);
  assert.equal(parsed.envelope.events[0].kind, "pointerdown");
  assert.equal(parsed.envelope.events[2].kind, "pointerup");
}

function test_parse_invalid_json_reports_error(): void {
  const parsed = parseTraceEnvelope("{ invalid }");
  assert.equal(parsed.ok, false);
  if (parsed.ok) return;
  assert.ok(parsed.message.includes("invalid JSON"));
}

function test_validate_rejects_out_of_order_sequence(): void {
  const payload = {
    version: "slide01.trace.v1",
    source: "Slide01",
    events: [
      event("pointerdown", 1, 0.2, 0.4),
      event("pointermove", 1, 0.3, 0.5),
    ],
  };
  const result = validateTraceEnvelope(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.message.includes("sequence"));
}

function test_validate_rejects_unknown_kind(): void {
  const payload = {
    version: "slide01.trace.v1",
    source: "Slide01",
    events: [
      {
        kind: "mousedown",
        seq: 1,
        x: 0.2,
        y: 0.4,
        pointerId: 1,
        button: 0,
        targetId: "slide01-weigh-arena",
      },
    ],
  };
  const result = validateTraceEnvelope(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.message.includes("unsupported pointer kind"));
}

function test_validate_rejects_missing_target_id(): void {
  const payload = {
    version: "slide01.trace.v1",
    source: "Slide01",
    events: [
      {
        kind: "pointerdown",
        seq: 1,
        x: 0.2,
        y: 0.4,
        pointerId: 1,
        button: 0,
        targetId: "",
      },
    ],
  };
  const result = validateTraceEnvelope(payload);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.message.includes("target id"));
}

function test_replay_b_sample_resolves_to_route_b(): void {
  const state = replayTraceFromInitial(SAMPLE_TRACE_ROUTE_B);
  assert.equal(state.phase, "resolved");
  assert.equal(state.decision.winner, "B");
  assert.equal(state.trace.length, SAMPLE_TRACE_ROUTE_B.events.length);
}

function test_replay_a_sample_resolves_to_route_a(): void {
  const state = replayTraceFromInitial(SAMPLE_TRACE_ROUTE_A);
  assert.equal(state.phase, "resolved");
  assert.equal(state.decision.winner, "A");
  assert.equal(state.trace.length, SAMPLE_TRACE_ROUTE_A.events.length);
}

function test_replay_result_matches_direct_reducer_application(): void {
  const seedEnvelope = createTraceEnvelope([
    event("pointerdown", 1, 0.22, 0.44),
    event("pointermove", 2, 0.36, 0.56),
    event("pointermove", 3, 0.57, 0.66),
    event("pointerup", 4, 0.82, 0.78),
  ]);

  const replayState = replayTraceFromInitial(seedEnvelope);
  let manualState = replayTraceFromInitial(createTraceEnvelope([]));
  for (const pointerEvent of seedEnvelope.events) {
    const actions = pointerTraceEventToActions(pointerEvent, "replay");
    manualState = reduceActions(manualState, actions);
  }

  assert.deepEqual(replayState.phase, manualState.phase);
  assert.deepEqual(replayState.decision.winner, manualState.decision.winner);
  assert.deepEqual(replayState.score.routeA, manualState.score.routeA);
  assert.deepEqual(replayState.score.routeB, manualState.score.routeB);
}

function test_parse_returns_hash_for_same_payload(): void {
  const envelope = createTraceEnvelope([
    event("pointerdown", 1, 0.3, 0.4),
    event("pointermove", 2, 0.42, 0.55),
    event("pointerup", 3, 0.65, 0.7),
  ]);
  const text = JSON.stringify(envelope, null, 2);
  const first = parseTraceEnvelope(text);
  const second = parseTraceEnvelope(text);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.envelopeHash, second.envelopeHash);
}

function test_replay_from_state_ignores_existing_runtime_state(): void {
  const initialState = replayTraceFromInitial(SAMPLE_TRACE_ROUTE_A);
  assert.equal(initialState.decision.winner, "A");
  const replayed = replayTraceFromState(initialState, SAMPLE_TRACE_ROUTE_B);
  assert.equal(replayed.decision.winner, "B");
}

function test_replay_result_payload_shape(): void {
  const current = replayTraceFromInitial(createTraceEnvelope([]));
  const replay = replayResult(current, SAMPLE_TRACE_ROUTE_B, "hash-1");
  assert.equal(replay.ok, true);
  assert.equal(replay.envelopeHash, "hash-1");
  assert.equal(replay.state.phase, "resolved");
  assert.equal(replay.state.decision.winner, "B");
}

function test_validation_clamps_coordinates(): void {
  const payload = {
    version: "slide01.trace.v1",
    source: "Slide01",
    events: [
      {
        kind: "pointerdown",
        seq: 1,
        x: 2.2,
        y: -1.4,
        pointerId: 1,
        button: 0,
        targetId: "slide01-weigh-arena",
      },
    ],
  };
  const result = validateTraceEnvelope(payload);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.envelope.events[0].x, 1);
  assert.equal(result.envelope.events[0].y, 0);
}

function test_parse_reports_invalid_source(): void {
  const payload = {
    version: "slide01.trace.v1",
    source: "OtherSlide",
    events: [],
  };
  const parsed = parseTraceEnvelope(JSON.stringify(payload));
  assert.equal(parsed.ok, false);
  if (parsed.ok) return;
  assert.ok(parsed.message.includes("source"));
}

function test_replay_long_trace_stability(): void {
  const events: Slide01PointerTraceEvent[] = [];
  events.push(event("pointerdown", 1, 0.2, 0.46));
  for (let step = 2; step <= 30; step += 1) {
    const x = Math.min(0.88, 0.2 + step * 0.02);
    const y = Math.min(0.84, 0.46 + step * 0.012);
    events.push(event("pointermove", step, x, y));
  }
  events.push(event("pointerup", 31, 0.89, 0.84));
  const envelope = createTraceEnvelope(events);
  const replayed = replayTraceFromInitial(envelope);
  assert.equal(replayed.phase, "resolved");
  assert.equal(replayed.trace.length, 31);
  assert.ok(replayed.score.routeA >= 0);
  assert.ok(replayed.score.routeB >= 0);
}

function test_replay_empty_trace_returns_idle_state(): void {
  const envelope = createTraceEnvelope([]);
  const replayed = replayTraceFromInitial(envelope);
  assert.equal(replayed.phase, "idle");
  assert.equal(replayed.trace.length, 0);
  assert.equal(replayed.decision.winner, null);
}

export function runSlide01ReplaySpecs(): void {
  test_serialize_and_parse_roundtrip();
  test_parse_invalid_json_reports_error();
  test_validate_rejects_out_of_order_sequence();
  test_validate_rejects_unknown_kind();
  test_validate_rejects_missing_target_id();
  test_replay_b_sample_resolves_to_route_b();
  test_replay_a_sample_resolves_to_route_a();
  test_replay_result_matches_direct_reducer_application();
  test_parse_returns_hash_for_same_payload();
  test_replay_from_state_ignores_existing_runtime_state();
  test_replay_result_payload_shape();
  test_validation_clamps_coordinates();
  test_parse_reports_invalid_source();
  test_replay_long_trace_stability();
  test_replay_empty_trace_returns_idle_state();
}
