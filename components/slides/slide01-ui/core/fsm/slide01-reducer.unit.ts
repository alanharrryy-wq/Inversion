import { strict as assert } from "node:assert";
import { pointerTraceEventToActions } from "./actions";
import { createSlide01InitialState, reduceActions, slide01Reducer } from "./reducer";
import { Slide01Action, Slide01PointerTraceEvent, Slide01State } from "./types";

function event(
  kind: Slide01PointerTraceEvent["kind"],
  seq: number,
  x: number,
  y: number,
  pointerId = 1
): Slide01PointerTraceEvent {
  return {
    kind,
    seq,
    x,
    y,
    pointerId,
    button: 0,
    targetId: "slide01-weigh-arena",
  };
}

function applyActions(
  state: Slide01State,
  actions: Slide01Action[] | Slide01Action
): Slide01State {
  if (Array.isArray(actions)) {
    return reduceActions(state, actions);
  }
  return slide01Reducer(state, actions);
}

function applyEvent(
  state: Slide01State,
  traceEvent: Slide01PointerTraceEvent,
  source: "live" | "replay" = "live"
): Slide01State {
  const actions = pointerTraceEventToActions(traceEvent, source);
  return applyActions(state, actions);
}

function test_initial_state_shape(): void {
  const state = createSlide01InitialState();
  assert.equal(state.phase, "idle");
  assert.deepEqual(state.phaseHistory, ["idle"]);
  assert.equal(state.pointerDown, false);
  assert.equal(state.trace.length, 0);
  assert.equal(state.metrics.sampleCount, 0);
  assert.equal(state.score.winner, "B");
  assert.equal(state.decision.winner, null);
}

function test_idle_to_aiming_on_pointer_down(): void {
  const state = createSlide01InitialState();
  const next = applyEvent(state, event("pointerdown", 1, 0.2, 0.5));
  assert.equal(next.phase, "aiming");
  assert.equal(next.pointerDown, true);
  assert.equal(next.activePointerId, 1);
  assert.equal(next.trace.length, 1);
  assert.equal(next.gestureSamples.length, 1);
  assert.equal(next.metrics.sampleCount, 1);
}

function test_aiming_stays_aiming_below_threshold(): void {
  const start = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.5));
  const next = applyEvent(start, event("pointermove", 2, 0.22, 0.51));
  assert.equal(next.phase, "aiming");
  assert.equal(next.trace.length, 2);
}

function test_aiming_to_weighing_after_threshold_crossed(): void {
  const start = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.5));
  const next = applyEvent(start, event("pointermove", 2, 0.31, 0.62));
  assert.equal(next.phase, "weighing");
  assert.equal(next.trace.length, 2);
  assert.equal(next.gestureSamples.length, 2);
}

function test_weighing_updates_metrics_and_score(): void {
  let state = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.5));
  state = applyEvent(state, event("pointermove", 2, 0.4, 0.62));
  const next = applyEvent(state, event("pointermove", 3, 0.57, 0.7));
  assert.equal(next.phase, "weighing");
  assert.equal(next.metrics.sampleCount, 3);
  assert.ok(next.score.routeA >= 0);
  assert.ok(next.score.routeB >= 0);
}

function test_pointer_up_commits_then_auto_resolves_via_actions_mapper(): void {
  let state = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.44));
  state = applyEvent(state, event("pointermove", 2, 0.35, 0.58));
  state = applyEvent(state, event("pointermove", 3, 0.55, 0.67));
  const next = applyEvent(state, event("pointerup", 4, 0.79, 0.74));
  assert.equal(next.phase, "resolved");
  assert.equal(next.pointerDown, false);
  assert.equal(next.activePointerId, null);
  assert.ok(next.decision.headline.startsWith("Route"));
  assert.equal(next.trace.length, 4);
}

function test_resolve_action_is_noop_when_not_committed(): void {
  const state = createSlide01InitialState();
  const next = slide01Reducer(state, {
    type: "RESOLVE_COMMITTED",
    source: "live",
    reason: "pointer-release",
  });
  assert.deepEqual(next, state);
}

function test_pointer_move_without_session_is_ignored(): void {
  const state = createSlide01InitialState();
  const next = applyEvent(state, event("pointermove", 1, 0.4, 0.5));
  assert.equal(next.phase, "idle");
  assert.equal(next.trace.length, 0);
}

function test_pointer_up_without_session_is_ignored(): void {
  const state = createSlide01InitialState();
  const next = applyEvent(state, event("pointerup", 1, 0.4, 0.5));
  assert.equal(next.phase, "idle");
  assert.equal(next.trace.length, 0);
}

function test_mismatched_pointer_id_is_ignored(): void {
  let state = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.44, 7));
  state = applyEvent(state, event("pointermove", 2, 0.3, 0.5, 8));
  assert.equal(state.trace.length, 1);
  assert.equal(state.phase, "aiming");
}

function test_reset_returns_idle_and_clears_trace(): void {
  let state = applyEvent(createSlide01InitialState(), event("pointerdown", 1, 0.2, 0.44));
  state = applyEvent(state, event("pointermove", 2, 0.36, 0.56));
  state = applyEvent(state, event("pointerup", 3, 0.62, 0.76));
  assert.equal(state.phase, "resolved");
  const reset = slide01Reducer(state, { type: "RESET" });
  assert.equal(reset.phase, "idle");
  assert.equal(reset.trace.length, 0);
  assert.equal(reset.gestureSamples.length, 0);
  assert.equal(reset.decision.winner, null);
}

function test_toggle_hud_flips_flag(): void {
  const state = createSlide01InitialState();
  const on = slide01Reducer(state, { type: "TOGGLE_HUD" });
  const off = slide01Reducer(on, { type: "TOGGLE_HUD" });
  assert.equal(state.hudVisible, false);
  assert.equal(on.hudVisible, true);
  assert.equal(off.hudVisible, false);
}

function test_phase_history_records_transitions(): void {
  let state = createSlide01InitialState();
  state = applyEvent(state, event("pointerdown", 1, 0.2, 0.44));
  state = applyEvent(state, event("pointermove", 2, 0.4, 0.6));
  state = applyEvent(state, event("pointerup", 3, 0.78, 0.79));
  assert.deepEqual(state.phaseHistory, ["idle", "aiming", "weighing", "committed", "resolved"]);
  assert.equal(state.transitionCount, 4);
}

function test_resolved_state_can_start_new_run_without_manual_reset(): void {
  let state = createSlide01InitialState();
  state = applyEvent(state, event("pointerdown", 1, 0.2, 0.44));
  state = applyEvent(state, event("pointermove", 2, 0.4, 0.6));
  state = applyEvent(state, event("pointerup", 3, 0.78, 0.79));
  assert.equal(state.phase, "resolved");

  const next = applyEvent(state, event("pointerdown", 4, 0.7, 0.52));
  assert.equal(next.phase, "aiming");
  assert.equal(next.pointerDown, true);
  assert.equal(next.trace.length, 4);
}

function test_route_b_path_resolves_to_route_b(): void {
  let state = createSlide01InitialState();
  const trace: Slide01PointerTraceEvent[] = [
    event("pointerdown", 1, 0.22, 0.44),
    event("pointermove", 2, 0.34, 0.54),
    event("pointermove", 3, 0.51, 0.64),
    event("pointermove", 4, 0.66, 0.74),
    event("pointerup", 5, 0.82, 0.78),
  ];
  for (const item of trace) {
    state = applyEvent(state, item);
  }
  assert.equal(state.phase, "resolved");
  assert.equal(state.decision.winner, "B");
}

function test_route_a_path_resolves_to_route_a(): void {
  let state = createSlide01InitialState();
  const trace: Slide01PointerTraceEvent[] = [
    event("pointerdown", 1, 0.74, 0.62),
    event("pointermove", 2, 0.58, 0.53),
    event("pointermove", 3, 0.39, 0.41),
    event("pointermove", 4, 0.26, 0.3),
    event("pointerup", 5, 0.12, 0.2),
  ];
  for (const item of trace) {
    state = applyEvent(state, item);
  }
  assert.equal(state.phase, "resolved");
  assert.equal(state.decision.winner, "A");
}

function test_replay_apply_merges_hud_from_current_state(): void {
  let current = createSlide01InitialState();
  current = slide01Reducer(current, { type: "TOGGLE_HUD" });
  assert.equal(current.hudVisible, true);

  let replayed = createSlide01InitialState();
  replayed = applyEvent(replayed, event("pointerdown", 1, 0.22, 0.44), "replay");
  replayed = applyEvent(replayed, event("pointermove", 2, 0.36, 0.56), "replay");
  replayed = applyEvent(replayed, event("pointerup", 3, 0.8, 0.76), "replay");
  assert.equal(replayed.phase, "resolved");

  const merged = slide01Reducer(current, {
    type: "REPLAY_APPLY",
    replayedState: replayed,
    envelopeHash: "abc",
  });
  assert.equal(merged.hudVisible, true);
  assert.equal(merged.phase, "resolved");
  assert.equal(merged.replay.status, "replayed");
  assert.equal(merged.replay.lastEnvelopeHash, "abc");
}

function test_replay_error_sets_status_to_error(): void {
  const state = createSlide01InitialState();
  const next = slide01Reducer(state, {
    type: "REPLAY_ERROR",
    message: "Replay error: invalid JSON.",
  });
  assert.equal(next.replay.status, "error");
  assert.ok(next.replay.message.includes("invalid JSON"));
}

function test_phase_matrix_by_action_sequence(): void {
  type Case = {
    name: string;
    events: Slide01PointerTraceEvent[];
    expectedPhase: Slide01State["phase"];
    expectedWinner: Slide01State["decision"]["winner"];
  };

  const matrix: Case[] = [
    {
      name: "minimal click release",
      events: [
        event("pointerdown", 1, 0.5, 0.5),
        event("pointerup", 2, 0.5, 0.5),
      ],
      expectedPhase: "resolved",
      expectedWinner: "A",
    },
    {
      name: "single move then release",
      events: [
        event("pointerdown", 1, 0.2, 0.5),
        event("pointermove", 2, 0.3, 0.55),
        event("pointerup", 3, 0.6, 0.7),
      ],
      expectedPhase: "resolved",
      expectedWinner: "A",
    },
    {
      name: "left urgent sweep",
      events: [
        event("pointerdown", 1, 0.8, 0.64),
        event("pointermove", 2, 0.52, 0.47),
        event("pointermove", 3, 0.31, 0.33),
        event("pointerup", 4, 0.15, 0.2),
      ],
      expectedPhase: "resolved",
      expectedWinner: "B",
    },
    {
      name: "right deliberate spread",
      events: [
        event("pointerdown", 1, 0.28, 0.46),
        event("pointermove", 2, 0.4, 0.55),
        event("pointermove", 3, 0.57, 0.63),
        event("pointermove", 4, 0.73, 0.75),
        event("pointerup", 5, 0.86, 0.81),
      ],
      expectedPhase: "resolved",
      expectedWinner: "B",
    },
  ];

  for (const testCase of matrix) {
    let state = createSlide01InitialState();
    for (const pointerEvent of testCase.events) {
      state = applyEvent(state, pointerEvent);
    }
    assert.equal(state.phase, testCase.expectedPhase, testCase.name);
    assert.equal(state.decision.winner, testCase.expectedWinner, testCase.name);
  }
}

export function runSlide01ReducerSpecs(): void {
  test_initial_state_shape();
  test_idle_to_aiming_on_pointer_down();
  test_aiming_stays_aiming_below_threshold();
  test_aiming_to_weighing_after_threshold_crossed();
  test_weighing_updates_metrics_and_score();
  test_pointer_up_commits_then_auto_resolves_via_actions_mapper();
  test_resolve_action_is_noop_when_not_committed();
  test_pointer_move_without_session_is_ignored();
  test_pointer_up_without_session_is_ignored();
  test_mismatched_pointer_id_is_ignored();
  test_reset_returns_idle_and_clears_trace();
  test_toggle_hud_flips_flag();
  test_phase_history_records_transitions();
  test_resolved_state_can_start_new_run_without_manual_reset();
  test_route_b_path_resolves_to_route_b();
  test_route_a_path_resolves_to_route_a();
  test_replay_apply_merges_hud_from_current_state();
  test_replay_error_sets_status_to_error();
  test_phase_matrix_by_action_sequence();
}
