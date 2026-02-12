import { strict as assert } from "node:assert";
import { createInitialLockState, reduceLockMachine, assertMachineInvariants } from "../core/fsm";
import { LockAction, LockMachineState, RouteId } from "../core/types";

function step(state: LockMachineState, action: LockAction): LockMachineState {
  return reduceLockMachine(state, action);
}

function runSequence(actions: LockAction[]): LockMachineState {
  return actions.reduce((state, action) => step(state, action), createInitialLockState());
}

function test_initial_state_contract() {
  const state = createInitialLockState();

  assert.equal(state.phase, "idle");
  assert.equal(state.selectedRouteId, null);
  assert.equal(state.sealAttemptCount, 0);
  assert.equal(state.successfulSealCount, 0);
  assert.equal(state.hold.progress, 0);
  assert.equal(state.hold.pointerActive, false);
  assert.equal(state.hold.thresholdMs > 0, true);

  const invariants = assertMachineInvariants(state);
  assert.deepEqual(invariants, []);
}

function test_route_select_enters_arming() {
  const state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
  ]);

  assert.equal(state.phase, "arming");
  assert.equal(state.selectedRouteId, "route-service-led");
  assert.equal(state.lastGuardFailure, null);
}

function test_route_clear_returns_idle() {
  const state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
    {
      type: "route.clear",
      atMs: 20,
    },
  ]);

  assert.equal(state.phase, "idle");
  assert.equal(state.selectedRouteId, null);
}

function test_lock_guard_blocks_without_route() {
  const state = runSequence([
    {
      type: "seal.pointer.down",
      atMs: 100,
    },
  ]);

  assert.equal(state.phase, "idle");
  assert.equal(state.lastGuardFailure?.code, "invalid-phase");
}

function test_lock_guard_blocks_when_evidence_below_two() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-direct-oem",
      atMs: 10,
    },
    {
      type: "evidence.toggle",
      evidenceId: "chain-of-custody",
      atMs: 11,
    },
    {
      type: "evidence.toggle",
      evidenceId: "service-ledger",
      atMs: 12,
    },
  ]);

  assert.equal(state.selectedEvidenceIds.length, 1);

  state = step(state, {
    type: "seal.pointer.down",
    atMs: 20,
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.lastGuardFailure?.code, "insufficient-evidence");
}

function test_lock_guard_blocks_when_constraint_blocked() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-direct-oem",
      atMs: 10,
    },
    {
      type: "constraint.set",
      constraintId: "integration-risk",
      state: "blocked",
      atMs: 12,
    },
  ]);

  state = step(state, {
    type: "seal.pointer.down",
    atMs: 20,
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.lastGuardFailure?.code, "blocked-constraints");
}

function test_locking_phase_updates_progress_with_ticks() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
    {
      type: "seal.pointer.down",
      atMs: 20,
    },
  ]);

  assert.equal(state.phase, "locking");
  assert.equal(state.hold.startedAtMs, 20);

  state = step(state, {
    type: "seal.pointer.tick",
    atMs: 620,
  });

  assert.equal(state.hold.elapsedMs, 600);
  assert.equal(state.hold.progress > 0.4, true);

  state = step(state, {
    type: "seal.pointer.tick",
    atMs: 1500,
  });

  assert.equal(state.hold.progress, 1);
}

function test_pointer_up_before_threshold_returns_arming() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
    {
      type: "seal.pointer.down",
      atMs: 20,
    },
    {
      type: "seal.pointer.tick",
      atMs: 900,
    },
    {
      type: "seal.pointer.up",
      atMs: 900,
    },
  ]);

  assert.equal(state.phase, "arming");
  assert.equal(state.sealedSummary, null);
  assert.equal(state.lastGuardFailure?.code, "hold-incomplete");
}

function test_full_hold_seals_summary() {
  const state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
    {
      type: "seal.pointer.down",
      atMs: 20,
    },
    {
      type: "seal.pointer.tick",
      atMs: 1400,
    },
    {
      type: "seal.pointer.up",
      atMs: 1400,
    },
  ]);

  assert.equal(state.phase, "sealed");
  assert.equal(!!state.sealedSummary, true);
  assert.equal(state.sealedSummary?.seal.holdMs ? state.sealedSummary.seal.holdMs >= 1200 : false, true);
  assert.equal(state.successfulSealCount, 1);
}

function test_sealed_state_rejects_edits_until_unseal() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-service-led",
      atMs: 10,
    },
    {
      type: "seal.pointer.down",
      atMs: 20,
    },
    {
      type: "seal.pointer.tick",
      atMs: 1400,
    },
    {
      type: "seal.pointer.up",
      atMs: 1400,
    },
  ]);

  const sealedHash = state.sealedSummary?.seal.hash;

  state = step(state, {
    type: "evidence.toggle",
    evidenceId: "board-brief",
    atMs: 1410,
  });

  assert.equal(state.phase, "sealed");
  assert.equal(state.sealedSummary?.seal.hash, sealedHash);
  assert.equal(state.lastGuardFailure?.code, "invalid-phase");

  state = step(state, {
    type: "seal.unseal",
    atMs: 1500,
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.sealedSummary, null);
}

function test_cancel_paths_return_to_arming() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-direct-oem",
      atMs: 0,
    },
    {
      type: "seal.pointer.down",
      atMs: 10,
    },
  ]);

  state = step(state, {
    type: "seal.pointer.cancel",
    atMs: 20,
    reason: "blur",
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.lastGuardFailure?.message.includes("blur"), true);

  state = step(state, {
    type: "seal.pointer.down",
    atMs: 30,
  });

  state = step(state, {
    type: "seal.pointer.cancel",
    atMs: 35,
    reason: "lost-capture",
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.lastGuardFailure?.message.includes("lost-capture"), true);
}

function test_reset_keeps_selected_route_context() {
  let state = runSequence([
    {
      type: "route.select",
      routeId: "route-white-label",
      atMs: 0,
    },
    {
      type: "seal.pointer.down",
      atMs: 10,
    },
    {
      type: "seal.pointer.tick",
      atMs: 1400,
    },
    {
      type: "seal.pointer.up",
      atMs: 1400,
    },
  ]);

  state = step(state, {
    type: "seal.reset",
    atMs: 1500,
  });

  assert.equal(state.phase, "arming");
  assert.equal(state.selectedRouteId, "route-white-label");
  assert.equal(state.sealedSummary, null);
}

function test_reducer_determinism_same_sequence_same_result() {
  const actions: LockAction[] = [
    {
      type: "route.select",
      routeId: "route-direct-oem",
      atMs: 10,
    },
    {
      type: "constraint.set",
      constraintId: "integration-risk",
      state: "satisfied",
      atMs: 11,
    },
    {
      type: "evidence.toggle",
      evidenceId: "board-brief",
      atMs: 12,
    },
    {
      type: "seal.pointer.down",
      atMs: 14,
    },
    {
      type: "seal.pointer.tick",
      atMs: 1300,
    },
    {
      type: "seal.pointer.up",
      atMs: 1300,
    },
  ];

  const first = runSequence(actions);
  const second = runSequence(actions);

  assert.equal(first.phase, second.phase);
  assert.equal(first.sealedSummary?.seal.hash, second.sealedSummary?.seal.hash);
  assert.equal(first.revision, second.revision);
  assert.deepEqual(first.selectedEvidenceIds, second.selectedEvidenceIds);
}

function test_reducer_matrix_multiple_routes() {
  const routeIds: RouteId[] = ["route-direct-oem", "route-service-led", "route-white-label"];

  for (const routeId of routeIds) {
    const state = runSequence([
      {
        type: "route.select",
        routeId,
        atMs: 10,
      },
      {
        type: "constraint.set",
        constraintId: "integration-risk",
        state: "satisfied",
        atMs: 11,
      },
      {
        type: "seal.pointer.down",
        atMs: 12,
      },
      {
        type: "seal.pointer.tick",
        atMs: 1400,
      },
      {
        type: "seal.pointer.up",
        atMs: 1400,
      },
    ]);

    assert.equal(state.phase, "sealed");
    assert.equal(!!state.sealedSummary, true);
    assert.equal(state.sealedSummary?.route.id, routeId);

    const invariantErrors = assertMachineInvariants(state);
    assert.deepEqual(invariantErrors, []);
  }
}

function test_replay_action_status_updates() {
  let state = createInitialLockState();

  state = step(state, {
    type: "replay.failed",
    error: "bad replay",
    atMs: 0,
  });

  assert.equal(state.replayStatus, "error");
  assert.equal(state.replayLastError, "bad replay");

  state = step(state, {
    type: "replay.applied",
    hash: "abc12345",
    atMs: 0,
  });

  assert.equal(state.replayStatus, "applied");
  assert.equal(state.replayLastHash, "abc12345");
}

function test_invariants_detect_invalid_manual_state() {
  const broken: LockMachineState = {
    ...createInitialLockState(),
    phase: "sealed",
    sealedSummary: null,
  };

  const errors = assertMachineInvariants(broken);
  assert.equal(errors.length > 0, true);
  assert.equal(errors.some((entry) => entry.includes("sealedSummary")), true);
}

export function runSlide04ReducerSpecs() {
  test_initial_state_contract();
  test_route_select_enters_arming();
  test_route_clear_returns_idle();
  test_lock_guard_blocks_without_route();
  test_lock_guard_blocks_when_evidence_below_two();
  test_lock_guard_blocks_when_constraint_blocked();
  test_locking_phase_updates_progress_with_ticks();
  test_pointer_up_before_threshold_returns_arming();
  test_full_hold_seals_summary();
  test_sealed_state_rejects_edits_until_unseal();
  test_cancel_paths_return_to_arming();
  test_reset_keeps_selected_route_context();
  test_reducer_determinism_same_sequence_same_result();
  test_reducer_matrix_multiple_routes();
  test_replay_action_status_updates();
  test_invariants_detect_invalid_manual_state();
}
