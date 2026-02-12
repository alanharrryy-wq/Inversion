import { strict as assert } from "node:assert";
import { createInitialSlide02State, reduceSlide02State, slide02MachineSnapshot } from "./fsm";
import { SLIDE02_DEFAULT_CONSTRAINTS, normalizeRoute } from "./model";
import { createReplayPayload, serializeReplayPayload } from "./replay";
import { runSuite, expectNonEmpty } from "./test-utils";

function createState() {
  return createInitialSlide02State({
    route: "stabilize-operations",
    routeSource: "default",
    constraints: { ...SLIDE02_DEFAULT_CONSTRAINTS },
  });
}

function test_initial_state_shape() {
  const state = createState();

  assert.equal(state.status, "BOOTSTRAPPED");
  assert.equal(state.route, "stabilize-operations");
  assert.deepEqual(state.constraints, SLIDE02_DEFAULT_CONSTRAINTS);
  assert.equal(state.trace.length, 1);
  assert.equal(state.trace[0].action, "boot");
  assert.equal(state.sequence, 1);
  assert.equal(state.hudOpen, false);
  expectNonEmpty(state.response.signature, "initial signature");
}

function test_set_route_transition() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_ROUTE", route: "throughput-push" });

  assert.equal(next.status, "INTERACTIVE");
  assert.equal(next.route, "throughput-push");
  assert.equal(next.trace.length, 2);
  assert.equal(next.trace[1].action, "set-route");
  assert.equal(next.sequence, 2);
  assert.notEqual(next.response.signature, state.response.signature);
}

function test_set_route_noop_for_same_route() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_ROUTE", route: "stabilize-operations" });

  assert.deepEqual(next, state);
}

function test_set_strictness_transition() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_STRICTNESS", value: 78 });

  assert.equal(next.status, "INTERACTIVE");
  assert.equal(next.constraints.strictness, 78);
  assert.equal(next.trace.length, 2);
  assert.equal(next.trace[1].action, "set-strictness");
  assert.equal(next.sequence, 2);
}

function test_set_budget_transition() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_BUDGET_GUARD", value: 12 });

  assert.equal(next.status, "INTERACTIVE");
  assert.equal(next.constraints.budgetGuard, 12);
  assert.equal(next.trace.length, 2);
  assert.equal(next.trace[1].action, "set-budget");
}

function test_set_latency_transition() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_LATENCY_GUARD", value: 64 });

  assert.equal(next.status, "INTERACTIVE");
  assert.equal(next.constraints.latencyGuard, 64);
  assert.equal(next.trace.length, 2);
  assert.equal(next.trace[1].action, "set-latency");
}

function test_constraint_clamping_in_reducer() {
  const state = createState();

  const strict = reduceSlide02State(state, { type: "SET_STRICTNESS", value: 1200 });
  assert.equal(strict.constraints.strictness, 100);

  const budget = reduceSlide02State(state, { type: "SET_BUDGET_GUARD", value: -999 });
  assert.equal(budget.constraints.budgetGuard, 0);

  const latency = reduceSlide02State(state, { type: "SET_LATENCY_GUARD", value: 42.6 });
  assert.equal(latency.constraints.latencyGuard, 43);
}

function test_reset_constraints_transition() {
  const state = createState();

  const changed = reduceSlide02State(
    reduceSlide02State(state, { type: "SET_STRICTNESS", value: 88 }),
    { type: "SET_BUDGET_GUARD", value: 10 }
  );

  assert.notDeepEqual(changed.constraints, SLIDE02_DEFAULT_CONSTRAINTS);

  const reset = reduceSlide02State(changed, { type: "RESET_CONSTRAINTS" });

  assert.deepEqual(reset.constraints, SLIDE02_DEFAULT_CONSTRAINTS);
  assert.equal(reset.status, "INTERACTIVE");
  assert.equal(reset.trace[reset.trace.length - 1].action, "reset-constraints");
}

function test_reset_constraints_noop_when_defaults() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "RESET_CONSTRAINTS" });
  assert.deepEqual(next, state);
}

function test_toggle_hud() {
  const state = createState();
  const open = reduceSlide02State(state, { type: "TOGGLE_HUD" });
  assert.equal(open.hudOpen, true);

  const close = reduceSlide02State(open, { type: "TOGGLE_HUD" });
  assert.equal(close.hudOpen, false);
}

function test_replay_stage_invalid_json() {
  const state = createState();

  const staged = reduceSlide02State(state, {
    type: "REPLAY_STAGE_JSON",
    json: "not-json",
  });

  assert.equal(staged.status, "REPLAY_ERROR");
  assert.equal(staged.replay.stagedPayload, null);
  expectNonEmpty(staged.replay.stagedError ?? "", "replay error message");
}

function test_replay_stage_missing_version() {
  const state = createState();

  const bad = JSON.stringify({
    base: {
      route: "stabilize-operations",
      constraints: SLIDE02_DEFAULT_CONSTRAINTS,
    },
    trace: [],
    meta: { createdBy: "x", createdAt: "x", signature: "x" },
  });

  const staged = reduceSlide02State(state, {
    type: "REPLAY_STAGE_JSON",
    json: bad,
  });

  assert.equal(staged.status, "REPLAY_ERROR");
  assert.equal(staged.replay.stagedPayload, null);
}

function test_replay_stage_and_apply() {
  const state = createState();

  const payload = createReplayPayload(
    "stabilize-operations",
    SLIDE02_DEFAULT_CONSTRAINTS,
    [
      { seq: 1, kind: "set-route", value: "margin-defense" },
      { seq: 2, kind: "set-strictness", value: 79 },
      { seq: 3, kind: "set-budget", value: 78 },
      { seq: 4, kind: "set-latency", value: 18 },
    ],
    state.response.signature
  );

  const staged = reduceSlide02State(state, {
    type: "REPLAY_STAGE_JSON",
    json: serializeReplayPayload(payload),
  });

  assert.equal(staged.status, "REPLAY_READY");
  assert.notEqual(staged.replay.stagedPayload, null);

  const applied = reduceSlide02State(staged, { type: "REPLAY_APPLY_STAGED" });

  assert.equal(applied.status, "REPLAY_APPLIED");
  assert.equal(applied.route, "margin-defense");
  assert.equal(applied.constraints.strictness, 79);
  assert.equal(applied.constraints.budgetGuard, 78);
  assert.equal(applied.constraints.latencyGuard, 18);
  assert.equal(applied.trace[applied.trace.length - 1].action, "replay-applied");
  assert.equal(applied.replay.lastAppliedSignature, applied.response.signature);
}

function test_replay_apply_without_payload_is_noop() {
  const state = createState();
  const applied = reduceSlide02State(state, { type: "REPLAY_APPLY_STAGED" });
  assert.deepEqual(applied, state);
}

function test_replay_clear_from_error() {
  const state = createState();
  const errorState = reduceSlide02State(state, {
    type: "REPLAY_STAGE_JSON",
    json: "broken-json",
  });

  assert.equal(errorState.status, "REPLAY_ERROR");

  const cleared = reduceSlide02State(errorState, { type: "REPLAY_CLEAR" });
  assert.equal(cleared.status, "BOOTSTRAPPED");
  assert.equal(cleared.replay.stagedError, null);
  assert.equal(cleared.replay.stagedJson, "");
}

function test_replay_clear_preserves_interactive_status() {
  const state = createState();
  const edited = reduceSlide02State(state, { type: "SET_BUDGET_GUARD", value: 74 });

  const errored = reduceSlide02State(edited, {
    type: "REPLAY_STAGE_JSON",
    json: "bad",
  });

  const cleared = reduceSlide02State(errored, { type: "REPLAY_CLEAR" });
  assert.equal(cleared.status, "INTERACTIVE");
}

function test_boot_action_reinitializes_state() {
  const state = createState();
  const edited = reduceSlide02State(state, { type: "SET_ROUTE", route: "throughput-push" });
  assert.equal(edited.route, "throughput-push");

  const rebooted = reduceSlide02State(edited, {
    type: "BOOT",
    seed: {
      route: "quality-ringfence",
      routeSource: "external-payload",
      constraints: {
        strictness: 88,
        budgetGuard: 75,
        latencyGuard: 24,
      },
    },
  });

  assert.equal(rebooted.status, "BOOTSTRAPPED");
  assert.equal(rebooted.route, "quality-ringfence");
  assert.equal(rebooted.trace.length, 1);
  assert.equal(rebooted.sequence, 1);
}

function test_sequence_is_monotonic() {
  const state = createState();

  const transitions = [
    { type: "SET_STRICTNESS", value: 60 } as const,
    { type: "SET_BUDGET_GUARD", value: 58 } as const,
    { type: "SET_LATENCY_GUARD", value: 42 } as const,
    { type: "SET_ROUTE", route: "margin-defense" } as const,
    { type: "SET_ROUTE", route: "quality-ringfence" } as const,
    { type: "RESET_CONSTRAINTS" } as const,
  ];

  const final = transitions.reduce((acc, action) => reduceSlide02State(acc, action as never), state);

  const sequences = final.trace.map((entry) => entry.seq);
  const sorted = [...sequences].sort((a, b) => a - b);

  assert.deepEqual(sequences, sorted);

  const unique = new Set(sequences);
  assert.equal(unique.size, sequences.length);
}

function test_trace_before_after_consistency() {
  const state = createState();

  const next = reduceSlide02State(state, { type: "SET_ROUTE", route: "margin-defense" });
  const entry = next.trace[next.trace.length - 1];

  assert.equal(entry.before.route, "stabilize-operations");
  assert.equal(entry.after.route, "margin-defense");

  assert.equal(entry.before.signature, state.response.signature);
  assert.equal(entry.after.signature, next.response.signature);
}

function test_machine_snapshot_string() {
  const state = createState();
  const snapshot = slide02MachineSnapshot(state);

  expectNonEmpty(snapshot, "snapshot string");
  assert.equal(snapshot.includes("status:BOOTSTRAPPED"), true);
  assert.equal(snapshot.includes("route:stabilize-operations"), true);
}

function test_status_evolution_with_mixed_actions() {
  const state = createState();

  const withRoute = reduceSlide02State(state, { type: "SET_ROUTE", route: "throughput-push" });
  assert.equal(withRoute.status, "INTERACTIVE");

  const invalidReplay = reduceSlide02State(withRoute, {
    type: "REPLAY_STAGE_JSON",
    json: "broken",
  });
  assert.equal(invalidReplay.status, "REPLAY_ERROR");

  const cleared = reduceSlide02State(invalidReplay, { type: "REPLAY_CLEAR" });
  assert.equal(cleared.status, "INTERACTIVE");
}

function test_route_normalization_inside_reducer() {
  const state = createState();
  const next = reduceSlide02State(state, { type: "SET_ROUTE", route: "speed" });
  assert.equal(next.route, normalizeRoute("speed"));
}

function test_replay_apply_updates_seed_from_payload_base() {
  const state = createState();

  const payload = createReplayPayload(
    "quality-ringfence",
    { strictness: 61, budgetGuard: 66, latencyGuard: 29 },
    [{ seq: 1, kind: "set-route", value: "margin-defense" }],
    state.response.signature
  );

  const staged = reduceSlide02State(state, {
    type: "REPLAY_STAGE_JSON",
    json: serializeReplayPayload(payload),
  });

  const applied = reduceSlide02State(staged, { type: "REPLAY_APPLY_STAGED" });

  assert.equal(applied.seed.route, "quality-ringfence");
  assert.equal(applied.seed.constraints.strictness, 61);
  assert.equal(applied.seed.routeSource, "external-payload");
}

export function runSlide02FsmSpecs() {
  const result = runSuite("slide02-fsm", [
    { id: "initial_state_shape", run: test_initial_state_shape },
    { id: "set_route_transition", run: test_set_route_transition },
    { id: "set_route_noop_for_same_route", run: test_set_route_noop_for_same_route },
    { id: "set_strictness_transition", run: test_set_strictness_transition },
    { id: "set_budget_transition", run: test_set_budget_transition },
    { id: "set_latency_transition", run: test_set_latency_transition },
    { id: "constraint_clamping_in_reducer", run: test_constraint_clamping_in_reducer },
    { id: "reset_constraints_transition", run: test_reset_constraints_transition },
    { id: "reset_constraints_noop_when_defaults", run: test_reset_constraints_noop_when_defaults },
    { id: "toggle_hud", run: test_toggle_hud },
    { id: "replay_stage_invalid_json", run: test_replay_stage_invalid_json },
    { id: "replay_stage_missing_version", run: test_replay_stage_missing_version },
    { id: "replay_stage_and_apply", run: test_replay_stage_and_apply },
    { id: "replay_apply_without_payload_is_noop", run: test_replay_apply_without_payload_is_noop },
    { id: "replay_clear_from_error", run: test_replay_clear_from_error },
    { id: "replay_clear_preserves_interactive_status", run: test_replay_clear_preserves_interactive_status },
    { id: "boot_action_reinitializes_state", run: test_boot_action_reinitializes_state },
    { id: "sequence_is_monotonic", run: test_sequence_is_monotonic },
    { id: "trace_before_after_consistency", run: test_trace_before_after_consistency },
    { id: "machine_snapshot_string", run: test_machine_snapshot_string },
    { id: "status_evolution_with_mixed_actions", run: test_status_evolution_with_mixed_actions },
    { id: "route_normalization_inside_reducer", run: test_route_normalization_inside_reducer },
    { id: "replay_apply_updates_seed_from_payload_base", run: test_replay_apply_updates_seed_from_payload_base },
  ]);

  return result;
}
