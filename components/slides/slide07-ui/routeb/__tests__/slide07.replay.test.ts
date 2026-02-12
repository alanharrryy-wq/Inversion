import { strict as assert } from "node:assert";
import { SLIDE07_REPLAY_FIXTURES, SLIDE07_SMOKE_FIXTURES } from "../slide07.fixtures";
import {
  assertSlide07ReplayDeterminism,
  runSlide07FixtureReplay,
  runSlide07ReplayScript,
} from "../slide07.replay";

function test_fixture_scale_and_distribution() {
  assert.equal(SLIDE07_REPLAY_FIXTURES.length >= 200, true);

  const sealed = SLIDE07_REPLAY_FIXTURES.filter((fixture) => fixture.expectedStage === "sealed").length;
  const partial = SLIDE07_REPLAY_FIXTURES.filter((fixture) => fixture.expectedStage !== "sealed").length;

  assert.equal(sealed >= 150, true);
  assert.equal(partial >= 40, true);
}

function test_smoke_fixtures_match_contract() {
  for (const fixture of SLIDE07_SMOKE_FIXTURES) {
    const assertion = runSlide07FixtureReplay(fixture);
    assert.equal(assertion.passedStage, true, fixture.id + " stage mismatch");
    assert.equal(assertion.passedEvidence, true, fixture.id + " evidence mismatch");
    assert.equal(assertion.passedEvents, true, fixture.id + " events mismatch");
  }
}

function test_full_fixture_suite_replay_contract() {
  for (const fixture of SLIDE07_REPLAY_FIXTURES) {
    const assertion = runSlide07FixtureReplay(fixture);
    assert.equal(assertion.passedStage, true, fixture.id + " stage mismatch");
    assert.equal(assertion.passedEvidence, true, fixture.id + " evidence mismatch");
    assert.equal(assertion.passedEvents, true, fixture.id + " events mismatch");
  }
}

function test_determinism_on_sparse_subset() {
  const sampled = SLIDE07_REPLAY_FIXTURES.filter((_, index) => index % 7 === 0);

  for (const fixture of sampled) {
    const assertion = assertSlide07ReplayDeterminism(fixture, 4);
    assert.equal(assertion.deterministic, true, fixture.id + " deterministic mismatch");
  }
}

function test_reference_replay_has_stable_serialization() {
  const fixture = SLIDE07_REPLAY_FIXTURES[0];
  const first = runSlide07ReplayScript(fixture.script);
  const second = runSlide07ReplayScript(fixture.script);

  assert.equal(JSON.stringify(first.state), JSON.stringify(second.state));
  assert.equal(JSON.stringify(first.snapshot), JSON.stringify(second.snapshot));
  assert.equal(
    JSON.stringify(first.domainEvents.map((event) => event.name)),
    JSON.stringify(second.domainEvents.map((event) => event.name))
  );
}

export function runSlide07ReplaySpecs() {
  test_fixture_scale_and_distribution();
  test_smoke_fixtures_match_contract();
  test_full_fixture_suite_replay_contract();
  test_determinism_on_sparse_subset();
  test_reference_replay_has_stable_serialization();
}
