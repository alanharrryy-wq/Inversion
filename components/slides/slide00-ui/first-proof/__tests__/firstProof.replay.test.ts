import { strict as assert } from "node:assert";
import {
  FIRST_PROOF_TRACE_FIXTURES,
  countFirstProofTraceOutcomes,
  getFirstProofTraceCatalogByCategory,
} from "../firstProof.fixtures";
import {
  buildFirstProofReplaySignature,
  replayFirstProofTrace,
  replayFirstProofTraceCatalog,
} from "../firstProof.replay";

function test_catalog_shape() {
  assert.equal(FIRST_PROOF_TRACE_FIXTURES.length, 260);

  const outcomes = countFirstProofTraceOutcomes();
  assert.equal(outcomes["happy:sealed:sealed"], 120);
  assert.equal(outcomes["boundary:sealed:sealed"], 30);
  assert.equal(outcomes["boundary:drag-satisfied:responsibility-pending"], 30);
  assert.equal(outcomes["blocked:idle:incomplete"], 30);
  assert.equal(outcomes["blocked:drag-satisfied:responsibility-pending"], 30);
  assert.equal(outcomes["stress:sealed:sealed"], 20);

  assert.equal(getFirstProofTraceCatalogByCategory("happy").length, 120);
  assert.equal(getFirstProofTraceCatalogByCategory("boundary").length, 60);
  assert.equal(getFirstProofTraceCatalogByCategory("blocked").length, 60);
  assert.equal(getFirstProofTraceCatalogByCategory("stress").length, 20);
}

function test_replay_expected_outcomes_match_metadata() {
  const results = replayFirstProofTraceCatalog(FIRST_PROOF_TRACE_FIXTURES, {
    includeFrames: false,
  });

  for (const result of results) {
    assert.equal(result.finalState.stage, result.metadata.expectedFinalStage, result.metadata.id);
    assert.equal(result.finalSnapshot.sealStatus, result.metadata.expectedSealStatus, result.metadata.id);

    if (result.metadata.expectedFinalStage === "sealed") {
      assert.equal(result.finalSnapshot.completed, true, `${result.metadata.id} must complete`);
    } else {
      assert.equal(result.finalSnapshot.completed, false, `${result.metadata.id} must stay incomplete`);
    }
  }
}

function test_replay_determinism_same_trace_same_signature() {
  for (const trace of FIRST_PROOF_TRACE_FIXTURES) {
    const first = replayFirstProofTrace(trace, { includeFrames: true });
    const second = replayFirstProofTrace(trace, { includeFrames: true });

    assert.deepEqual(first.finalState, second.finalState, `${trace.metadata.id} final state mismatch`);
    assert.deepEqual(first.finalSnapshot, second.finalSnapshot, `${trace.metadata.id} snapshot mismatch`);
    assert.deepEqual(first.allSignals, second.allSignals, `${trace.metadata.id} signal mismatch`);
    assert.deepEqual(first.frames, second.frames, `${trace.metadata.id} frame mismatch`);

    const firstSignature = buildFirstProofReplaySignature(first);
    const secondSignature = buildFirstProofReplaySignature(second);
    assert.equal(firstSignature, secondSignature, `${trace.metadata.id} signature mismatch`);
  }
}

function test_replay_boundaries_produce_expected_blocked_signals() {
  const boundaryBlocked = FIRST_PROOF_TRACE_FIXTURES.filter(
    (trace) =>
      trace.metadata.category === "boundary" &&
      trace.metadata.expectedFinalStage === "drag-satisfied"
  );

  assert.equal(boundaryBlocked.length, 30);

  for (const trace of boundaryBlocked) {
    const replay = replayFirstProofTrace(trace, { includeFrames: true });
    const blockedSignalCount = replay.allSignals.filter((signal) => {
      return signal.kind === "anchor" && signal.anchorId === "slide00:firstproof:release-blocked";
    }).length;

    assert.equal(blockedSignalCount, 1, `${trace.metadata.id} blocked signal count`);
  }
}

export function runFirstProofReplaySpecs() {
  test_catalog_shape();
  test_replay_expected_outcomes_match_metadata();
  test_replay_determinism_same_trace_same_signature();
  test_replay_boundaries_produce_expected_blocked_signals();
}
