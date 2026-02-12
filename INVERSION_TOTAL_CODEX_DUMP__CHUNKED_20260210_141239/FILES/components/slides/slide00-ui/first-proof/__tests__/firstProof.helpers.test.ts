
import { strict as assert } from "node:assert";
import {
  createInitialFirstProofState,
  deriveFirstProofSnapshot,
  resolveFirstProofThresholds,
  transitionFirstProofState,
} from "../firstProof.helpers";
import { FirstProofMachineEvent, FirstProofState } from "../firstProof.types";
import { runFirstProofReplaySpecs } from "./firstProof.replay.test";

const TEST_THRESHOLDS = resolveFirstProofThresholds({
  dragThresholdPx: 100,
  dragMaxTravelPx: 260,
  dragDirectionRatio: 0.74,
  holdDurationMs: 240,
  holdTickClampMs: 50,
  releaseSnapPx: 160,
});

function dispatch(state: FirstProofState, event: FirstProofMachineEvent) {
  return transitionFirstProofState(state, event, TEST_THRESHOLDS);
}

function down(state: FirstProofState, pointerId: number, x: number, y: number, ts: number) {
  return dispatch(state, { type: "pointer_down", pointerId, x, y, ts });
}

function move(state: FirstProofState, pointerId: number, x: number, y: number, ts: number) {
  return dispatch(state, { type: "pointer_move", pointerId, x, y, ts });
}

function hold(state: FirstProofState, pointerId: number, deltaMs: number, ts: number) {
  return dispatch(state, { type: "hold_tick", pointerId, deltaMs, ts });
}

function up(state: FirstProofState, pointerId: number, x: number, y: number, ts: number) {
  return dispatch(state, { type: "pointer_up", pointerId, x, y, ts });
}

function test_drag_threshold_and_direction_sanity() {
  let state = createInitialFirstProofState();
  state = down(state, 1, 0, 0, 0).state;

  const invalidDirection = move(state, 1, 140, 120, 16);
  assert.equal(invalidDirection.state.dragThresholdReached, false);
  assert.equal(invalidDirection.state.stage, "dragging");
  assert.equal(invalidDirection.signals.length, 0);

  const validDirection = move(invalidDirection.state, 1, 130, 12, 32);
  assert.equal(validDirection.state.dragThresholdReached, true);
  assert.equal(validDirection.state.dragDirectionValid, true);
  assert.equal(validDirection.state.stage, "holding");
  assert.equal(validDirection.signals.length, 2);
  assert.equal(validDirection.signals[0].kind, "anchor");
}

function test_hold_threshold_requires_hold_tick() {
  let state = createInitialFirstProofState();
  state = down(state, 2, 0, 0, 0).state;
  state = move(state, 2, 120, 4, 16).state;

  const movedWithoutHoldTick = move(state, 2, 150, 4, 32);
  assert.equal(movedWithoutHoldTick.state.holdElapsedMs, 0);
  assert.equal(movedWithoutHoldTick.state.holdThresholdReached, false);

  const held = hold(movedWithoutHoldTick.state, 2, 50, 48);
  assert.equal(held.state.holdElapsedMs, 50);
  assert.equal(held.state.holdThresholdReached, false);

  const heldEnough = hold(held.state, 2, 200, 64);
  assert.equal(heldEnough.state.holdElapsedMs, 100);
  assert.equal(heldEnough.state.holdThresholdReached, false);

  const reached = hold(heldEnough.state, 2, 100, 80);
  assert.equal(reached.state.holdElapsedMs, 150);
  assert.equal(reached.state.holdThresholdReached, false);

  const final = hold(reached.state, 2, 100, 96);
  assert.equal(final.state.holdElapsedMs, 200);
  assert.equal(final.state.holdThresholdReached, false);
  assert.equal(final.state.stage, "holding");
  assert.equal(final.signals.length, 0);

  const threshold = hold(final.state, 2, 100, 112);
  assert.equal(threshold.state.holdElapsedMs, 240);
  assert.equal(threshold.state.holdThresholdReached, true);
  assert.equal(threshold.state.stage, "hold-satisfied");
  assert.equal(threshold.signals.length, 2);
}

function test_release_requires_prior_steps() {
  let state = createInitialFirstProofState();
  state = down(state, 3, 0, 0, 0).state;
  state = move(state, 3, 140, 3, 16).state;

  const blockedRelease = up(state, 3, 140, 3, 32);
  assert.equal(blockedRelease.state.releaseCommitted, false);
  assert.equal(blockedRelease.state.releaseBlocked, true);
  assert.equal(blockedRelease.state.stage, "drag-satisfied");
  assert.equal(blockedRelease.signals.length, 2);
  assert.equal(blockedRelease.signals[0].kind, "anchor");

  state = down(blockedRelease.state, 3, 140, 3, 48).state;
  state = move(state, 3, 250, 8, 64).state;
  state = hold(state, 3, 50, 80).state;
  state = hold(state, 3, 50, 96).state;
  state = hold(state, 3, 50, 112).state;
  state = hold(state, 3, 50, 128).state;
  state = hold(state, 3, 50, 144).state;

  const sealed = up(state, 3, 250, 8, 160);
  assert.equal(sealed.state.releaseCommitted, true);
  assert.equal(sealed.state.stage, "sealed");
  assert.equal(sealed.state.pointerActive, false);
  assert.equal(sealed.signals.length, 2);
}

function test_idempotence_same_event_does_not_mutate() {
  let state = createInitialFirstProofState();
  state = down(state, 7, 0, 0, 0).state;

  const moved = move(state, 7, 20, 0, 16);
  const sameMove = move(moved.state, 7, 20, 0, 32);

  assert.deepEqual(sameMove.state, moved.state);
  assert.equal(sameMove.signals.length, 0);

  const noHold = hold(sameMove.state, 7, 0, 48);
  assert.deepEqual(noHold.state, sameMove.state);
  assert.equal(noHold.signals.length, 0);

  const foreignPointerMove = move(noHold.state, 99, 100, 0, 64);
  assert.deepEqual(foreignPointerMove.state, noHold.state);
  assert.equal(foreignPointerMove.signals.length, 0);
}

function test_snapshot_models_steps_and_status() {
  let state = createInitialFirstProofState();
  state = down(state, 8, 0, 0, 0).state;
  state = move(state, 8, 120, 2, 16).state;
  state = hold(state, 8, 50, 32).state;

  const intermediateSnapshot = deriveFirstProofSnapshot(state, TEST_THRESHOLDS);
  assert.equal(intermediateSnapshot.sealStatus, "intent-registered");
  assert.equal(intermediateSnapshot.steps[0].status, "complete");
  assert.equal(intermediateSnapshot.steps[1].status, "active");
  assert.equal(intermediateSnapshot.steps[2].status, "locked");

  state = hold(state, 8, 50, 48).state;
  state = hold(state, 8, 50, 64).state;
  state = hold(state, 8, 50, 80).state;
  state = hold(state, 8, 50, 96).state;
  state = up(state, 8, 120, 2, 112).state;

  const sealedSnapshot = deriveFirstProofSnapshot(state, TEST_THRESHOLDS);
  assert.equal(sealedSnapshot.completed, true);
  assert.equal(sealedSnapshot.sealStatus, "sealed");
  assert.equal(sealedSnapshot.steps[2].status, "complete");
}

function test_reset_restores_initial_state() {
  let state = createInitialFirstProofState();
  state = down(state, 9, 0, 0, 0).state;
  state = move(state, 9, 140, 3, 16).state;
  state = hold(state, 9, 80, 32).state;

  const reset = dispatch(state, { type: "reset", ts: 48 });
  const initial = createInitialFirstProofState();

  assert.deepEqual(reset.state, initial);
  assert.equal(reset.signals.length, 1);
  assert.equal(reset.signals[0].kind, "evidence");
}

export function runFirstProofHelperSpecs() {
  test_drag_threshold_and_direction_sanity();
  test_hold_threshold_requires_hold_tick();
  test_release_requires_prior_steps();
  test_idempotence_same_event_does_not_mutate();
  test_snapshot_models_steps_and_status();
  test_reset_restores_initial_state();
  runFirstProofReplaySpecs();
}

