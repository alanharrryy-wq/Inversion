import { strict as assert } from "node:assert";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  createInitialSlide07State,
  resolveSlide07Thresholds,
  transitionSlide07State,
} from "../slide07.helpers";
import { Slide07State } from "../slide07.types";

const TEST_THRESHOLDS = resolveSlide07Thresholds({
  dragThresholdPx: 120,
  maxDragTravelPx: 320,
  holdThresholdMs: 600,
  holdTickCeilingMs: 80,
  releaseSnapPx: 180,
});

function down(state: Slide07State, pointerId: number, x: number, y: number, nowMs: number) {
  return transitionSlide07State(
    state,
    { type: "pointer_down", pointerId, x, y, nowMs },
    TEST_THRESHOLDS
  );
}

function move(state: Slide07State, pointerId: number, x: number, y: number, nowMs: number) {
  return transitionSlide07State(
    state,
    { type: "pointer_move", pointerId, x, y, nowMs },
    TEST_THRESHOLDS
  );
}

function tick(state: Slide07State, deltaMs: number, nowMs: number) {
  return transitionSlide07State(
    state,
    { type: "hold_tick", deltaMs, nowMs },
    TEST_THRESHOLDS
  );
}

function up(state: Slide07State, pointerId: number, x: number, y: number, nowMs: number) {
  return transitionSlide07State(
    state,
    { type: "pointer_up", pointerId, x, y, nowMs },
    TEST_THRESHOLDS
  );
}

function collectDomainFiles(rootDir: string): string[] {
  const stack = [rootDir];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry)) {
        continue;
      }
      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return files;
}

function test_drag_boundary_and_event_emission() {
  let state = createInitialSlide07State(TEST_THRESHOLDS);
  state = down(state, 1, 0, 0, 0).state;

  let result = move(state, 1, 119, 0, 16);
  assert.equal(result.state.dragProgress < 1, true);
  assert.equal(result.domainEvents.length, 0);

  result = move(result.state, 1, 120, 0, 32);
  assert.equal(result.state.stage, "drag-complete");
  assert.equal(
    result.domainEvents.map((event) => event.name).join("|"),
    "anchor:slide07-graph-link:engaged|gesture:slide07-drag:completed"
  );
}

function test_hold_completion_boundary_and_release_to_seal() {
  let state = createInitialSlide07State(TEST_THRESHOLDS);
  state = down(state, 2, 0, 0, 0).state;
  state = move(state, 2, 120, 0, 16).state;

  let result = tick(state, 300, 32);
  assert.equal(result.state.stage, "holding");
  assert.equal(result.state.holdProgress < 1, true);

  result = tick(result.state, 300, 64);
  assert.equal(result.state.stage, "hold-complete");
  assert.equal(result.state.holdProgress, 1);
  assert.equal(result.domainEvents.map((event) => event.name).join("|"), "gesture:slide07-hold:completed");

  const sealed = up(result.state, 2, 120, 0, 80);
  assert.equal(sealed.state.stage, "sealed");
  assert.equal(
    sealed.domainEvents.map((event) => event.name).join("|"),
    "gesture:slide07-release:completed|state:slide07-sealed:set|evidence:slide07-primary:satisfied"
  );
}

function test_idempotence_for_same_move_input() {
  let state = createInitialSlide07State(TEST_THRESHOLDS);
  state = down(state, 3, 0, 0, 0).state;

  const first = move(state, 3, 40, 0, 16);
  const second = move(first.state, 3, 40, 0, 16);

  assert.deepEqual(second.state, first.state);
  assert.equal(second.domainEvents.length, 0);
}

function test_no_timers_in_routeb_modules() {
  const routebRoot = path.join(process.cwd(), "components", "slides", "slide07-ui", "routeb");
  const files = collectDomainFiles(routebRoot);

  assert.equal(files.length > 0, true);

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    assert.equal(/\bsetTimeout\s*\(/.test(content), false, "setTimeout found in " + filePath);
    assert.equal(/\bsetInterval\s*\(/.test(content), false, "setInterval found in " + filePath);
  }
}

export function runSlide07HelperSpecs() {
  test_drag_boundary_and_event_emission();
  test_hold_completion_boundary_and_release_to_seal();
  test_idempotence_for_same_move_input();
  test_no_timers_in_routeb_modules();
}
