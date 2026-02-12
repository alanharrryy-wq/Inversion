import { strict as assert } from "node:assert";
import {
  CONSTRAINT_REGISTRY,
  EVIDENCE_REGISTRY,
  getRouteById,
} from "../core/constants";
import {
  createSummaryCanonicalJson,
  createSummaryModel,
  fnv1aHash,
  pickHighestConfidenceSource,
  stableStringify,
  summarizeSourceMix,
} from "../core/summary";
import { ConstraintDigestItem, EvidenceDigestItem, RouteId, SummaryInput } from "../core/types";

function buildConstraints(
  states: Array<"satisfied" | "at-risk" | "blocked">
): ConstraintDigestItem[] {
  return CONSTRAINT_REGISTRY.map((definition, index) => ({
    id: definition.id,
    label: definition.label,
    weight: definition.weight,
    rationale: definition.rationale,
    state: states[index] ?? "satisfied",
  }));
}

function buildEvidence(ids: string[]): EvidenceDigestItem[] {
  return ids
    .map((id) => EVIDENCE_REGISTRY.find((item) => item.id === id))
    .filter((item): item is (typeof EVIDENCE_REGISTRY)[number] => !!item)
    .map((item) => ({
      id: item.id,
      label: item.label,
      source: item.source,
      confidence: item.confidence,
      note: item.note,
    }));
}

function buildInput(routeId: RouteId, options?: Partial<SummaryInput>): SummaryInput {
  return {
    route: getRouteById(routeId),
    constraints: buildConstraints(["satisfied", "at-risk", "satisfied", "satisfied", "at-risk"]),
    evidence: buildEvidence(["live-telemetry", "chain-of-custody", "service-ledger"]),
    holdMs: 1300,
    sealedAtMs: 2200,
    ...options,
  };
}

function test_stable_stringify_orders_keys() {
  const unordered = {
    z: 1,
    a: 2,
    nested: {
      c: 3,
      b: 4,
    },
  };

  const output = stableStringify(unordered);
  assert.equal(output, '{"a":2,"nested":{"b":4,"c":3},"z":1}');
}

function test_fnv1a_hash_is_stable() {
  const value = "slide04-deterministic-hash";
  const first = fnv1aHash(value);
  const second = fnv1aHash(value);
  assert.equal(first, second);
  assert.equal(first.length, 8);
}

function test_summary_model_generates_deterministic_hash_for_same_input() {
  const input = buildInput("route-service-led");
  const summaryA = createSummaryModel(input);
  const summaryB = createSummaryModel(input);

  assert.equal(summaryA.seal.hash, summaryB.seal.hash);
  assert.equal(summaryA.seal.signature, summaryB.seal.signature);
  assert.equal(summaryA.decision.routeScore, summaryB.decision.routeScore);
}

function test_summary_model_hash_is_order_independent() {
  const input = buildInput("route-service-led");

  const shuffledConstraints = [...input.constraints].reverse();
  const shuffledEvidence = [...input.evidence].reverse();

  const ordered = createSummaryModel(input);
  const shuffled = createSummaryModel({
    ...input,
    constraints: shuffledConstraints,
    evidence: shuffledEvidence,
  });

  assert.equal(ordered.seal.hash, shuffled.seal.hash);
  assert.equal(createSummaryCanonicalJson(ordered), createSummaryCanonicalJson(shuffled));
}

function test_blocked_constraints_reduce_lock_readiness() {
  const input = buildInput("route-direct-oem", {
    constraints: buildConstraints(["blocked", "blocked", "at-risk", "satisfied", "satisfied"]),
  });

  const summary = createSummaryModel(input);
  assert.equal(summary.decision.lockReady, false);
  assert.equal(summary.decision.blockedCount, 2);
  assert.equal(summary.decision.routeScore < 70, true);
}

function test_evidence_count_impacts_confidence() {
  const sparse = createSummaryModel(
    buildInput("route-white-label", {
      evidence: buildEvidence(["live-telemetry"]),
    })
  );

  const rich = createSummaryModel(
    buildInput("route-white-label", {
      evidence: buildEvidence([
        "live-telemetry",
        "chain-of-custody",
        "quality-snapshot",
        "service-ledger",
      ]),
    })
  );

  assert.equal(rich.decision.confidenceScore >= sparse.decision.confidenceScore, true);
  assert.equal(rich.evidenceDigest.items.length > sparse.evidenceDigest.items.length, true);
}

function test_source_mix_summary_includes_all_selected_sources() {
  const summary = createSummaryModel(
    buildInput("route-service-led", {
      evidence: buildEvidence([
        "live-telemetry",
        "chain-of-custody",
        "quality-snapshot",
        "service-ledger",
        "board-brief",
      ]),
    })
  );

  const mix = summarizeSourceMix(summary);
  assert.equal(mix.includes("telemetry"), true);
  assert.equal(mix.includes("governance"), true);
  assert.equal(mix.includes("quality"), true);
  assert.equal(mix.includes("operations"), true);
  assert.equal(mix.includes("finance"), true);
}

function test_highest_confidence_source_selection() {
  const summary = createSummaryModel(
    buildInput("route-service-led", {
      evidence: buildEvidence([
        "board-brief",
        "service-ledger",
        "quality-snapshot",
        "live-telemetry",
      ]),
    })
  );

  const source = pickHighestConfidenceSource(summary);
  assert.equal(source, "telemetry");
}

function test_route_variants_produce_distinct_hashes() {
  const routeIds: RouteId[] = ["route-direct-oem", "route-service-led", "route-white-label"];
  const hashes = routeIds.map((routeId) => createSummaryModel(buildInput(routeId)).seal.hash);

  const unique = new Set(hashes);
  assert.equal(unique.size, routeIds.length);
}

function test_summary_schema_and_signature_format() {
  const summary = createSummaryModel(buildInput("route-direct-oem"));

  assert.equal(summary.schemaVersion, "slide04-summary.v1");
  assert.equal(summary.seal.signature.startsWith("S04-"), true);
  assert.equal(summary.seal.hash.length, 8);
}

function test_stable_stringify_handles_arrays_of_objects() {
  const value = {
    rows: [
      { b: 2, a: 1 },
      { z: 4, y: 3 },
    ],
  };

  const output = stableStringify(value);
  assert.equal(output, '{"rows":[{"a":1,"b":2},{"y":3,"z":4}]}');
}

function test_scenario_matrix_for_decision_narratives() {
  const matrix: Array<{
    name: string;
    routeId: RouteId;
    states: Array<"satisfied" | "at-risk" | "blocked">;
    evidenceIds: string[];
    expectedReady: boolean;
  }> = [
    {
      name: "balanced-ready",
      routeId: "route-direct-oem",
      states: ["satisfied", "at-risk", "satisfied", "satisfied", "at-risk"],
      evidenceIds: ["live-telemetry", "chain-of-custody", "service-ledger"],
      expectedReady: true,
    },
    {
      name: "blocked-no-ready",
      routeId: "route-direct-oem",
      states: ["blocked", "at-risk", "satisfied", "satisfied", "at-risk"],
      evidenceIds: ["live-telemetry", "chain-of-custody", "service-ledger"],
      expectedReady: false,
    },
    {
      name: "insufficient-evidence",
      routeId: "route-service-led",
      states: ["satisfied", "satisfied", "satisfied", "satisfied", "satisfied"],
      evidenceIds: ["live-telemetry"],
      expectedReady: false,
    },
    {
      name: "wide-evidence-ready",
      routeId: "route-service-led",
      states: ["satisfied", "satisfied", "at-risk", "satisfied", "satisfied"],
      evidenceIds: [
        "live-telemetry",
        "chain-of-custody",
        "quality-snapshot",
        "service-ledger",
      ],
      expectedReady: true,
    },
    {
      name: "aggressive-route-ready",
      routeId: "route-white-label",
      states: ["satisfied", "at-risk", "at-risk", "satisfied", "satisfied"],
      evidenceIds: ["live-telemetry", "chain-of-custody", "board-brief"],
      expectedReady: true,
    },
    {
      name: "aggressive-route-blocked",
      routeId: "route-white-label",
      states: ["blocked", "blocked", "satisfied", "satisfied", "satisfied"],
      evidenceIds: ["live-telemetry", "chain-of-custody", "board-brief"],
      expectedReady: false,
    },
    {
      name: "all-satisfied-max-ready",
      routeId: "route-service-led",
      states: ["satisfied", "satisfied", "satisfied", "satisfied", "satisfied"],
      evidenceIds: [
        "live-telemetry",
        "chain-of-custody",
        "quality-snapshot",
        "service-ledger",
        "board-brief",
      ],
      expectedReady: true,
    },
    {
      name: "all-blocked",
      routeId: "route-service-led",
      states: ["blocked", "blocked", "blocked", "blocked", "blocked"],
      evidenceIds: ["live-telemetry", "chain-of-custody", "quality-snapshot"],
      expectedReady: false,
    },
  ];

  for (const scenario of matrix) {
    const summary = createSummaryModel(
      buildInput(scenario.routeId, {
        constraints: buildConstraints(scenario.states),
        evidence: buildEvidence(scenario.evidenceIds),
      })
    );

    assert.equal(
      summary.decision.lockReady,
      scenario.expectedReady,
      `${scenario.name} produced unexpected lockReady state`
    );

    if (scenario.expectedReady) {
      assert.equal(
        summary.decision.narrative.includes("sealed") ||
          summary.decision.narrative.includes("proceed"),
        true,
        `${scenario.name} expected a positive narrative`
      );
    } else {
      assert.equal(
        summary.decision.narrative.includes("not lockable") ||
          summary.decision.narrative.includes("requires additional evidence"),
        true,
        `${scenario.name} expected a blocking narrative`
      );
    }
  }
}

function test_summary_hash_changes_when_hold_changes() {
  const base = buildInput("route-direct-oem", { holdMs: 1200 });
  const altered = buildInput("route-direct-oem", { holdMs: 1400 });

  const baseSummary = createSummaryModel(base);
  const alteredSummary = createSummaryModel(altered);

  assert.equal(baseSummary.seal.hash === alteredSummary.seal.hash, false);
}

function test_canonical_json_hash_self_consistency() {
  const summary = createSummaryModel(buildInput("route-service-led"));
  const canonical = createSummaryCanonicalJson(summary);
  const hash = fnv1aHash(canonical);

  assert.equal(typeof canonical, "string");
  assert.equal(typeof hash, "string");
  assert.equal(hash.length, 8);
}

export function runSlide04SummaryModelSpecs() {
  test_stable_stringify_orders_keys();
  test_fnv1a_hash_is_stable();
  test_summary_model_generates_deterministic_hash_for_same_input();
  test_summary_model_hash_is_order_independent();
  test_blocked_constraints_reduce_lock_readiness();
  test_evidence_count_impacts_confidence();
  test_source_mix_summary_includes_all_selected_sources();
  test_highest_confidence_source_selection();
  test_route_variants_produce_distinct_hashes();
  test_summary_schema_and_signature_format();
  test_stable_stringify_handles_arrays_of_objects();
  test_scenario_matrix_for_decision_narratives();
  test_summary_hash_changes_when_hold_changes();
  test_canonical_json_hash_self_consistency();
}
