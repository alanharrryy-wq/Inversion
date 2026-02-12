import {
  Slide13EmittedEvent,
  Slide13ReplayFixture,
  Slide13ReplayFrame,
  Slide13ReplayInputEvent,
  Slide13ReplayResult,
  Slide13State,
  Slide13Thresholds,
} from "./slide13.types";
import {
  SLIDE13_DEFAULT_THRESHOLDS,
  createInitialSlide13State,
  deriveSlide13Snapshot,
  resolveSlide13Thresholds,
  transitionSlide13State,
} from "./slide13.helpers";

export type Slide13ReplayOptions = {
  initialState?: Slide13State;
  thresholds?: Partial<Slide13Thresholds>;
};

function cloneEvent(event: Slide13ReplayInputEvent): Slide13ReplayInputEvent {
  return {
    id: event.id,
    machineEvent: { ...event.machineEvent },
  };
}

export function replaySlide13Events(
  events: Slide13ReplayInputEvent[],
  options: Slide13ReplayOptions = {}
): Slide13ReplayResult {
  const thresholds = options.thresholds
    ? resolveSlide13Thresholds(options.thresholds)
    : SLIDE13_DEFAULT_THRESHOLDS;
  let state = options.initialState
    ? { ...options.initialState }
    : createInitialSlide13State(thresholds);

  const frames: Slide13ReplayFrame[] = [];
  const emitted: Slide13EmittedEvent[] = [];

  for (const originalEvent of events) {
    const event = cloneEvent(originalEvent);
    const transition = transitionSlide13State(state, event.machineEvent, thresholds);
    state = transition.state;
    emitted.push(...transition.emitted);
    frames.push({
      id: event.id,
      machineEvent: event.machineEvent,
      state,
      snapshot: deriveSlide13Snapshot(state, thresholds),
      emitted: transition.emitted,
    });
  }

  const finalSnapshot = deriveSlide13Snapshot(state, thresholds);
  return {
    frames,
    finalState: state,
    finalSnapshot,
    emitted,
  };
}

export function assertSlide13Fixture(fixture: Slide13ReplayFixture): {
  fixtureId: string;
  pass: boolean;
  reasons: string[];
} {
  const replay = replaySlide13Events(fixture.events, { thresholds: fixture.thresholds });
  const { assertion } = fixture;
  const reasons: string[] = [];
  const finalState = replay.finalState;
  const finalSnapshot = replay.finalSnapshot;
  const finalEvents = replay.emitted.map((entry) => entry.name);

  if (finalState.stage !== assertion.expectedStage) {
    reasons.push(`expected stage ${assertion.expectedStage}, got ${finalState.stage}`);
  }
  if (finalState.sealState !== assertion.expectedSealState) {
    reasons.push(`expected seal state ${assertion.expectedSealState}, got ${finalState.sealState}`);
  }
  if (finalState.sealed !== assertion.expectedSealed) {
    reasons.push(`expected sealed ${String(assertion.expectedSealed)}, got ${String(finalState.sealed)}`);
  }
  if (finalSnapshot.railIndex !== assertion.expectedRailIndex) {
    reasons.push(`expected rail index ${assertion.expectedRailIndex}, got ${finalSnapshot.railIndex}`);
  }
  if (finalSnapshot.dragProgress < assertion.dragProgressAtLeast) {
    reasons.push(
      `expected drag progress >= ${assertion.dragProgressAtLeast}, got ${finalSnapshot.dragProgress}`
    );
  }
  if (finalSnapshot.holdProgress < assertion.holdProgressAtLeast) {
    reasons.push(
      `expected hold progress >= ${assertion.holdProgressAtLeast}, got ${finalSnapshot.holdProgress}`
    );
  }
  if (finalSnapshot.releaseProgress < assertion.releaseProgressAtLeast) {
    reasons.push(
      `expected release progress >= ${assertion.releaseProgressAtLeast}, got ${finalSnapshot.releaseProgress}`
    );
  }

  for (const requiredEventName of assertion.requiredEventNames) {
    if (!finalEvents.includes(requiredEventName)) {
      reasons.push(`required event missing: ${requiredEventName}`);
    }
  }

  return {
    fixtureId: fixture.id,
    pass: reasons.length === 0,
    reasons,
  };
}

export function runSlide13FixtureCatalog(fixtures: Slide13ReplayFixture[]): {
  total: number;
  passed: number;
  failed: number;
  failures: Array<{ fixtureId: string; reasons: string[] }>;
} {
  let passed = 0;
  const failures: Array<{ fixtureId: string; reasons: string[] }> = [];

  for (const fixture of fixtures) {
    const assertion = assertSlide13Fixture(fixture);
    if (assertion.pass) {
      passed += 1;
      continue;
    }
    failures.push({ fixtureId: assertion.fixtureId, reasons: assertion.reasons });
  }

  return {
    total: fixtures.length,
    passed,
    failed: fixtures.length - passed,
    failures,
  };
}
