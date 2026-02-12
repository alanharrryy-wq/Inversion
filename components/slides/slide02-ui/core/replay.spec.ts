import { strict as assert } from "node:assert";
import {
  applyReplayPayload,
  createEmptyReplayPayload,
  createReplayPayload,
  createReplayPayloadFromMachine,
  createReplaySummary,
  ensureReplayVersion,
  isReplayEventKind,
  parseReplayPayload,
  repairReplayJson,
  replayEventsFromTrace,
  serializeReplayPayload,
} from "./replay";
import { REPLAY_SCENARIOS } from "./fixtures";
import { runSuite, expectNonEmpty, expectStringContains } from "./test-utils";

function test_create_empty_payload() {
  const payload = createEmptyReplayPayload();

  assert.equal(payload.version, "slide02.replay.v1");
  assert.equal(payload.base.route, "stabilize-operations");
  assert.equal(Array.isArray(payload.trace), true);
  assert.equal(payload.trace.length, 0);
  expectNonEmpty(payload.meta.signature, "empty payload signature");
}

function test_create_payload_and_serialize() {
  const payload = createReplayPayload(
    "margin-defense",
    { strictness: 70, budgetGuard: 75, latencyGuard: 20 },
    [
      { seq: 1, kind: "set-route", value: "quality-ringfence" },
      { seq: 2, kind: "set-strictness", value: 82 },
      { seq: 3, kind: "set-budget", value: 68 },
      { seq: 4, kind: "set-latency", value: 28 },
    ],
    "S2|MRG|70|65|20|P|S"
  );

  const serialized = serializeReplayPayload(payload);
  expectStringContains(serialized, '"version": "slide02.replay.v1"', "serialized version");
  expectStringContains(serialized, '"trace"', "serialized trace");

  const parsed = parseReplayPayload(serialized);
  assert.equal(parsed.ok, true);
  assert.notEqual(parsed.payload, null);

  if (!parsed.payload) {
    throw new Error("parsed payload missing");
  }

  assert.equal(parsed.payload.base.route, "margin-defense");
  assert.equal(parsed.payload.trace.length, 4);
}

function test_parse_invalid_json() {
  const invalidJson = parseReplayPayload("{{bad-json}}");
  assert.equal(invalidJson.ok, false);
  expectNonEmpty(invalidJson.error ?? "", "invalid json error message");
}

function test_parse_missing_version() {
  const json = JSON.stringify({
    base: {
      route: "stabilize-operations",
      constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    },
    trace: [],
    meta: { createdBy: "x", createdAt: "x", signature: "x" },
  });

  const parsed = parseReplayPayload(json);
  assert.equal(parsed.ok, false);
  expectStringContains(parsed.error ?? "", "version", "missing version error");
}

function test_parse_empty_string() {
  const parsed = parseReplayPayload("   ");
  assert.equal(parsed.ok, false);
  expectStringContains(parsed.error ?? "", "empty", "empty replay message");
}

function test_parse_unordered_trace_sanitizes_sequence() {
  const json = JSON.stringify({
    version: "slide02.replay.v1",
    base: {
      route: "throughput-push",
      constraints: { strictness: 40, budgetGuard: 70, latencyGuard: 28 },
    },
    trace: [
      { seq: 90, kind: "set-budget", value: 60 },
      { seq: 1, kind: "set-route", value: "margin-defense" },
      { seq: 1, kind: "set-latency", value: 22 },
      { seq: 45, kind: "set-strictness", value: 77 },
    ],
    meta: {
      createdBy: "test",
      createdAt: "today",
      signature: "sig",
    },
  });

  const parsed = parseReplayPayload(json);
  assert.equal(parsed.ok, true);

  if (!parsed.payload) {
    throw new Error("payload missing");
  }

  const seqs = parsed.payload.trace.map((event) => event.seq);
  assert.deepEqual(seqs, [1, 2, 3, 4]);
}

function test_parse_unknown_trace_kinds_are_ignored() {
  const json = JSON.stringify({
    version: "slide02.replay.v1",
    base: {
      route: "stabilize-operations",
      constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    },
    trace: [
      { seq: 1, kind: "set-route", value: "margin-defense" },
      { seq: 2, kind: "unsupported-kind", value: "x" },
      { seq: 3, kind: "set-budget", value: 80 },
      { seq: 4, kind: "another-unsupported", value: 42 },
    ],
    meta: {
      createdBy: "test",
      createdAt: "today",
      signature: "sig",
    },
  });

  const parsed = parseReplayPayload(json);
  assert.equal(parsed.ok, true);

  if (!parsed.payload) {
    throw new Error("payload missing");
  }

  assert.equal(parsed.payload.trace.length, 2);
  assert.deepEqual(
    parsed.payload.trace.map((event) => event.kind),
    ["set-route", "set-budget"]
  );
}

function test_apply_replay_scenarios() {
  REPLAY_SCENARIOS.forEach((scenario) => {
    const payload = createReplayPayload(
      scenario.base.route,
      scenario.base.constraints,
      scenario.trace,
      "sig"
    );

    const result = applyReplayPayload(payload);

    assert.equal(result.route, scenario.expected.route, `${scenario.id} route`);
    assert.deepEqual(result.constraints, scenario.expected.constraints, `${scenario.id} constraints`);
    assert.equal(result.response.decision, scenario.expected.decision, `${scenario.id} decision`);
    assert.equal(result.response.operabilityBand, scenario.expected.band, `${scenario.id} band`);
    expectNonEmpty(result.response.signature, `${scenario.id} signature`);
  });
}

function test_apply_replay_is_deterministic() {
  const payload = createReplayPayload(
    "stabilize-operations",
    { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    [
      { seq: 1, kind: "set-route", value: "throughput-push" },
      { seq: 2, kind: "set-budget", value: 74 },
      { seq: 3, kind: "set-latency", value: 30 },
      { seq: 4, kind: "set-strictness", value: 64 },
    ],
    "sig"
  );

  const first = applyReplayPayload(payload);
  const second = applyReplayPayload(payload);
  const third = applyReplayPayload(payload);

  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
}

function test_replay_events_from_machine_trace() {
  const machineTrace = [
    {
      seq: 1,
      action: "boot",
      before: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
      after: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
    },
    {
      seq: 2,
      action: "set-route",
      before: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
      after: {
        route: "margin-defense",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-2",
      },
    },
    {
      seq: 3,
      action: "set-strictness",
      before: {
        route: "margin-defense",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-2",
      },
      after: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-3",
      },
    },
    {
      seq: 4,
      action: "set-budget",
      before: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-3",
      },
      after: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 77, latencyGuard: 38 },
        signature: "sig-4",
      },
    },
    {
      seq: 5,
      action: "set-latency",
      before: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 77, latencyGuard: 38 },
        signature: "sig-4",
      },
      after: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 77, latencyGuard: 20 },
        signature: "sig-5",
      },
    },
    {
      seq: 6,
      action: "reset-constraints",
      before: {
        route: "margin-defense",
        constraints: { strictness: 74, budgetGuard: 77, latencyGuard: 20 },
        signature: "sig-5",
      },
      after: {
        route: "margin-defense",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-6",
      },
    },
    {
      seq: 7,
      action: "replay-applied",
      before: {
        route: "margin-defense",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-6",
      },
      after: {
        route: "quality-ringfence",
        constraints: { strictness: 88, budgetGuard: 70, latencyGuard: 15 },
        signature: "sig-7",
      },
    },
  ] as any;

  const events = replayEventsFromTrace(machineTrace);

  assert.deepEqual(events, [
    { seq: 1, kind: "set-route", value: "margin-defense" },
    { seq: 2, kind: "set-strictness", value: 74 },
    { seq: 3, kind: "set-budget", value: 77 },
    { seq: 4, kind: "set-latency", value: 20 },
    { seq: 5, kind: "reset-constraints", value: null },
  ]);
}

function test_create_replay_payload_from_machine() {
  const machineTrace = [
    {
      seq: 1,
      action: "boot",
      before: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
      after: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
    },
    {
      seq: 2,
      action: "set-route",
      before: {
        route: "stabilize-operations",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-1",
      },
      after: {
        route: "throughput-push",
        constraints: { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
        signature: "sig-2",
      },
    },
  ] as any;

  const payload = createReplayPayloadFromMachine(
    "throughput-push",
    { strictness: 56, budgetGuard: 62, latencyGuard: 38 },
    machineTrace,
    "sig-2"
  );

  assert.equal(payload.base.route, "throughput-push");
  assert.equal(payload.trace.length, 1);
  assert.deepEqual(payload.trace[0], {
    seq: 1,
    kind: "set-route",
    value: "throughput-push",
  });
}

function test_repair_replay_json() {
  const repairedFromBad = repairReplayJson("bad-json");
  const parsedBad = parseReplayPayload(repairedFromBad);
  assert.equal(parsedBad.ok, true);

  const source = JSON.stringify({
    version: "slide02.replay.v1",
    base: {
      route: "margin-defense",
      constraints: { strictness: 75, budgetGuard: 72, latencyGuard: 18 },
    },
    trace: [
      { seq: 7, kind: "set-route", value: "quality-ringfence" },
      { seq: 1, kind: "set-budget", value: 80 },
    ],
    meta: {
      createdBy: "unit",
      createdAt: "today",
      signature: "sig",
    },
  });

  const repaired = repairReplayJson(source);
  const parsed = parseReplayPayload(repaired);
  assert.equal(parsed.ok, true);

  if (!parsed.payload) {
    throw new Error("repaired payload missing");
  }

  assert.equal(parsed.payload.trace.length, 2);
  assert.deepEqual(parsed.payload.trace.map((item) => item.seq), [1, 2]);
}

function test_ensure_replay_version() {
  assert.equal(ensureReplayVersion("slide02.replay.v1"), "slide02.replay.v1");
  assert.equal(ensureReplayVersion("other"), "slide02.replay.v1");
  assert.equal(ensureReplayVersion(null), "slide02.replay.v1");
  assert.equal(ensureReplayVersion(undefined), "slide02.replay.v1");
}

function test_replay_event_kind_guard() {
  assert.equal(isReplayEventKind("set-route"), true);
  assert.equal(isReplayEventKind("set-budget"), true);
  assert.equal(isReplayEventKind("bad-kind"), false);
  assert.equal(isReplayEventKind(undefined), false);
}

function test_create_replay_summary() {
  const payload = createReplayPayload(
    "quality-ringfence",
    { strictness: 84, budgetGuard: 72, latencyGuard: 19 },
    [
      { seq: 1, kind: "set-strictness", value: 88 },
      { seq: 2, kind: "set-budget", value: 76 },
    ],
    "S2|QLT|82|90|18|PP|H"
  );

  const summary = createReplaySummary(payload);

  expectStringContains(summary, "version:slide02.replay.v1", "summary version");
  expectStringContains(summary, "base:quality-ringfence", "summary base");
  expectStringContains(summary, "trace:2", "summary trace length");
  expectStringContains(summary, "signature:S2|QLT|82|90|18|PP|H", "summary signature");
}

export function runSlide02ReplaySpecs() {
  const result = runSuite("slide02-replay", [
    { id: "create_empty_payload", run: test_create_empty_payload },
    { id: "create_payload_and_serialize", run: test_create_payload_and_serialize },
    { id: "parse_invalid_json", run: test_parse_invalid_json },
    { id: "parse_missing_version", run: test_parse_missing_version },
    { id: "parse_empty_string", run: test_parse_empty_string },
    { id: "parse_unordered_trace_sanitizes_sequence", run: test_parse_unordered_trace_sanitizes_sequence },
    { id: "parse_unknown_trace_kinds_are_ignored", run: test_parse_unknown_trace_kinds_are_ignored },
    { id: "apply_replay_scenarios", run: test_apply_replay_scenarios },
    { id: "apply_replay_is_deterministic", run: test_apply_replay_is_deterministic },
    { id: "replay_events_from_machine_trace", run: test_replay_events_from_machine_trace },
    { id: "create_replay_payload_from_machine", run: test_create_replay_payload_from_machine },
    { id: "repair_replay_json", run: test_repair_replay_json },
    { id: "ensure_replay_version", run: test_ensure_replay_version },
    { id: "replay_event_kind_guard", run: test_replay_event_kind_guard },
    { id: "create_replay_summary", run: test_create_replay_summary },
  ]);

  return result;
}
