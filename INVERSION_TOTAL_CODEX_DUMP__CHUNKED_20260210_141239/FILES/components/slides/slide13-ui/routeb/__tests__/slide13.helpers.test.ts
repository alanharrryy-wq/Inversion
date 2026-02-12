
import { strict as assert } from "node:assert";
import {
  createInitialSlide13State,
  resolveSlide13Thresholds,
  transitionSlide13State,
} from "../slide13.helpers";
import { Slide13State } from "../slide13.types";

const TEST_THRESHOLDS = resolveSlide13Thresholds({
  dragThresholdPx: 100,
  maxDragTravelPx: 300,
  holdTravelThresholdPx: 180,
  holdGain: 1,
  releaseSnapPx: 150,
  railStepCount: 8,
});

function down(state: Slide13State, pointerId: number, x: number, y: number) {
  return transitionSlide13State(state, { type: "pointer_down", pointerId, x, y }, TEST_THRESHOLDS);
}

function move(state: Slide13State, pointerId: number, x: number, y: number) {
  return transitionSlide13State(state, { type: "pointer_move", pointerId, x, y }, TEST_THRESHOLDS);
}

function up(state: Slide13State, pointerId: number, x: number, y: number) {
  return transitionSlide13State(state, { type: "pointer_up", pointerId, x, y }, TEST_THRESHOLDS);
}

function test_threshold_resolution_boundaries() {
  const resolved = resolveSlide13Thresholds({
    dragThresholdPx: 4,
    maxDragTravelPx: 9999,
    holdTravelThresholdPx: 12,
    dragResistance: -3,
    holdGain: 42,
    releaseSnapPx: 1,
    freezeFloor: -1,
    railStepCount: 200,
  });

  assert.equal(resolved.dragThresholdPx, 96);
  assert.equal(resolved.maxDragTravelPx, 680);
  assert.equal(resolved.holdTravelThresholdPx, 100);
  assert.equal(resolved.dragResistance, 0.08);
  assert.equal(resolved.holdGain, 3);
  assert.equal(resolved.releaseSnapPx, 112);
  assert.equal(resolved.freezeFloor, 0.2);
  assert.equal(resolved.railStepCount, 32);
}

function test_drag_boundary_and_event_emission() {
  let state = createInitialSlide13State(TEST_THRESHOLDS);
  state = down(state, 11, 0, 0).state;

  const beforeThreshold = move(state, 11, 99, 0);
  assert.equal(beforeThreshold.state.stage, "Idle");
  assert.equal(beforeThreshold.emitted.length, 0);

  const atThreshold = move(beforeThreshold.state, 11, 100, 0);
  assert.equal(atThreshold.state.stage, "Dragged");
  assert.equal(atThreshold.emitted.length, 2);
  assert.equal(atThreshold.emitted[0].name, "anchor:slide13-kpi-threshold:engaged");
  assert.equal(atThreshold.emitted[1].name, "gesture:slide13-drag:completed");
}

function test_hold_boundary_and_event_emission() {
  let state = createInitialSlide13State(TEST_THRESHOLDS);
  state = down(state, 7, 0, 0).state;
  state = move(state, 7, 120, 0).state;

  const holdEarly = move(state, 7, 120, 30);
  assert.equal(holdEarly.state.stage, "Dragged");
  assert.equal(holdEarly.state.holdProgress < 1, true);

  const holdComplete = move(holdEarly.state, 7, 80, -40);
  assert.equal(holdComplete.state.stage, "Holding");
  assert.equal(holdComplete.state.holdProgress, 1);
  assert.equal(holdComplete.emitted.length, 2);
  assert.equal(holdComplete.emitted[0].name, "anchor:slide13-kpi-freeze:engaged");
  assert.equal(holdComplete.emitted[1].name, "gesture:slide13-hold:completed");
}

function test_release_seals_and_collapses_right_seal() {
  let state = createInitialSlide13State(TEST_THRESHOLDS);
  state = down(state, 2, 0, 0).state;
  state = move(state, 2, 120, 0).state;
  state = move(state, 2, 120, 50).state;
  state = move(state, 2, 80, -50).state;

  const released = up(state, 2, 132, -44);
  assert.equal(released.state.stage, "Sealed");
  assert.equal(released.state.sealed, true);
  assert.equal(released.state.rightSealCollapsed, true);
  assert.equal(released.state.sealState, "collapsed");
  assert.equal(released.emitted.some((event) => event.name === "gesture:slide13-release:completed"), true);
  assert.equal(released.emitted.some((event) => event.name === "state:slide13-sealed:set"), true);
  assert.equal(released.emitted.some((event) => event.name === "evidence:slide13-primary:satisfied"), true);
}

function test_idempotence_same_input_same_output() {
  let state = createInitialSlide13State(TEST_THRESHOLDS);
  state = down(state, 4, 0, 0).state;
  state = move(state, 4, 96, 0).state;

  const first = move(state, 4, 96, 0);
  const second = move(first.state, 4, 96, 0);
  assert.deepEqual(first.state, second.state);
  assert.equal(second.emitted.length, 0);
}

function test_foreign_pointer_ignored() {
  let state = createInitialSlide13State(TEST_THRESHOLDS);
  state = down(state, 1, 0, 0).state;
  const moved = move(state, 9, 190, 0);
  assert.deepEqual(moved.state, state);
  assert.equal(moved.emitted.length, 0);
}

export function runSlide13HelperSpecs() {
  test_threshold_resolution_boundaries();
  test_drag_boundary_and_event_emission();
  test_hold_boundary_and_event_emission();
  test_release_seals_and_collapses_right_seal();
  test_idempotence_same_input_same_output();
  test_foreign_pointer_ignored();
}

