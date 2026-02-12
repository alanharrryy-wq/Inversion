
import {
  createInitialSlide07State,
  deriveSlide07Snapshot,
  resolveSlide07Thresholds,
  transitionSlide07State,
} from "./slide07.helpers";
import {
  Slide07FixtureReplayAssertion,
  Slide07GestureInputEvent,
  Slide07ReplayFixture,
  Slide07ReplayResult,
  Slide07Thresholds,
} from "./slide07.types";

export function runSlide07ReplayScript(
  script: Slide07GestureInputEvent[],
  options?: {
    thresholds?: Partial<Slide07Thresholds>;
  }
): Slide07ReplayResult {
  const thresholds = resolveSlide07Thresholds(options?.thresholds);
  let state = createInitialSlide07State(thresholds);
  const domainEvents: Slide07ReplayResult["domainEvents"] = [];

  for (const machineEvent of script) {
    const transition = transitionSlide07State(state, machineEvent, thresholds);
    state = transition.state;
    if (transition.domainEvents.length > 0) {
      domainEvents.push(...transition.domainEvents);
    }
  }

  const snapshot = deriveSlide07Snapshot(state, thresholds);

  return {
    state,
    snapshot,
    domainEvents,
  };
}

export function runSlide07FixtureReplay(
  fixture: Slide07ReplayFixture,
  options?: {
    thresholds?: Partial<Slide07Thresholds>;
  }
): Slide07FixtureReplayAssertion {
  const replay = runSlide07ReplayScript(fixture.script, options);
  const names = replay.domainEvents.map((event) => event.name);

  const passedStage = replay.state.stage === fixture.expectedStage;
  const passedEvidence = replay.snapshot.primaryEvidenceSatisfied === fixture.expectedEvidenceSatisfied;
  const passedEvents =
    names.length === fixture.expectedEvents.length &&
    names.every((name, index) => name === fixture.expectedEvents[index]);

  return {
    fixtureId: fixture.id,
    passedStage,
    passedEvidence,
    passedEvents,
    replay,
  };
}

export function assertSlide07ReplayDeterminism(
  fixture: Slide07ReplayFixture,
  iterations = 3,
  options?: {
    thresholds?: Partial<Slide07Thresholds>;
  }
): {
  fixtureId: string;
  deterministic: boolean;
  reference: Slide07ReplayResult;
  compared: Slide07ReplayResult[];
} {
  const reference = runSlide07ReplayScript(fixture.script, options);
  const compared: Slide07ReplayResult[] = [];
  let deterministic = true;

  const referenceState = JSON.stringify(reference.state);
  const referenceSnapshot = JSON.stringify(reference.snapshot);
  const referenceEvents = JSON.stringify(reference.domainEvents.map((event) => event.name));

  for (let index = 0; index < iterations; index += 1) {
    const replay = runSlide07ReplayScript(fixture.script, options);
    compared.push(replay);

    const nextState = JSON.stringify(replay.state);
    const nextSnapshot = JSON.stringify(replay.snapshot);
    const nextEvents = JSON.stringify(replay.domainEvents.map((event) => event.name));

    if (nextState !== referenceState || nextSnapshot !== referenceSnapshot || nextEvents !== referenceEvents) {
      deterministic = false;
      break;
    }
  }

  return {
    fixtureId: fixture.id,
    deterministic,
    reference,
    compared,
  };
}

export function runSlide07FixtureSuite(
  fixtures: Slide07ReplayFixture[],
  options?: {
    thresholds?: Partial<Slide07Thresholds>;
  }
): Slide07FixtureReplayAssertion[] {
  return fixtures.map((fixture) => runSlide07FixtureReplay(fixture, options));
}

