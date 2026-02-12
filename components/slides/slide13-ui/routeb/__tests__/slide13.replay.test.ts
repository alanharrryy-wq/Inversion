import { strict as assert } from "node:assert";
import { SLIDE13_REPLAY_FIXTURES } from "../slide13.fixtures";
import {
  assertSlide13Fixture,
  replaySlide13Events,
  runSlide13FixtureCatalog,
} from "../slide13.replay";

function test_single_fixture_assertion() {
  const fixture = SLIDE13_REPLAY_FIXTURES.find((entry) => entry.id === "slide13-seal-001");
  assert.ok(fixture);
  if (!fixture) return;

  const result = assertSlide13Fixture(fixture);
  assert.equal(result.pass, true, result.reasons.join("; "));
}

function test_catalog_assertions_pass() {
  const sealedFixtures = SLIDE13_REPLAY_FIXTURES.filter((entry) => entry.id.startsWith("slide13-seal-"));
  const summary = runSlide13FixtureCatalog(sealedFixtures);
  assert.equal(summary.failed, 0, JSON.stringify(summary.failures, null, 2));
  assert.equal(summary.passed, summary.total);
  assert.equal(summary.total > 0, true);
}

function test_replay_determinism_same_trace_same_result() {
  const fixture = SLIDE13_REPLAY_FIXTURES.find((entry) => entry.id === "slide13-seal-012");
  assert.ok(fixture);
  if (!fixture) return;

  const first = replaySlide13Events(fixture.events, { thresholds: fixture.thresholds });
  const second = replaySlide13Events(fixture.events, { thresholds: fixture.thresholds });

  assert.deepEqual(first.finalState, second.finalState);
  assert.deepEqual(first.finalSnapshot, second.finalSnapshot);
  assert.deepEqual(first.emitted, second.emitted);
}

function test_open_fixture_never_emits_seal_events() {
  const fixture = SLIDE13_REPLAY_FIXTURES.find((entry) => entry.id === "slide13-open-005");
  assert.ok(fixture);
  if (!fixture) return;

  const replay = replaySlide13Events(fixture.events, { thresholds: fixture.thresholds });
  const eventNames = replay.emitted.map((entry) => entry.name);

  assert.equal(eventNames.includes("anchor:slide13-rightseal:engaged"), false);
  assert.equal(eventNames.includes("gesture:slide13-release:completed"), false);
  assert.equal(eventNames.includes("state:slide13-sealed:set"), false);
  assert.equal(eventNames.includes("evidence:slide13-primary:satisfied"), false);
}

function test_all_sealed_fixtures_emit_full_contract() {
  const sealedFixtures = SLIDE13_REPLAY_FIXTURES.filter((entry) => entry.id.startsWith("slide13-seal-"));
  assert.equal(sealedFixtures.length > 0, true);

  for (const fixture of sealedFixtures) {
    const replay = replaySlide13Events(fixture.events, { thresholds: fixture.thresholds });
    const eventNames = replay.emitted.map((entry) => entry.name);
    assert.equal(
      eventNames.includes("anchor:slide13-kpi-threshold:engaged"),
      true,
      `${fixture.id} missing threshold anchor`
    );
    assert.equal(
      eventNames.includes("anchor:slide13-kpi-freeze:engaged"),
      true,
      `${fixture.id} missing freeze anchor`
    );
    assert.equal(
      eventNames.includes("anchor:slide13-rightseal:engaged"),
      true,
      `${fixture.id} missing right seal anchor`
    );
    assert.equal(
      eventNames.includes("evidence:slide13-primary:satisfied"),
      true,
      `${fixture.id} missing primary evidence`
    );
  }
}

export function runSlide13ReplaySpecs() {
  test_single_fixture_assertion();
  test_catalog_assertions_pass();
  test_replay_determinism_same_trace_same_result();
  test_open_fixture_never_emits_seal_events();
  test_all_sealed_fixtures_emit_full_contract();
}
