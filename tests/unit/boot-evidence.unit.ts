import { strict as assert } from 'node:assert';
import {
  createInitialEvidenceState,
  reduceEvidenceState,
  selectEvidenceReady,
  selectMissingBlockerEvidenceKeys,
  summarizeEvidence,
  transitionsForEvidenceAction,
} from '../../runtime/evidence';

function ingest(state: ReturnType<typeof createInitialEvidenceState>, action: string, ts: number, actor: 'operator' | 'system' = 'operator') {
  return reduceEvidenceState(state, {
    type: 'EVIDENCE_INGEST_EVENT',
    event: {
      id: `ev-${String(ts).padStart(6, '0')}`,
      action,
      actor,
      ts,
      payload: {},
    },
    transitions: transitionsForEvidenceAction(action),
  });
}

function test_initial_state_has_missing_blocker() {
  const state = createInitialEvidenceState();

  assert.equal(selectEvidenceReady(state), false);
  assert.deepEqual(selectMissingBlockerEvidenceKeys(state), ['evidence:system:armed']);
}

function test_arm_confirm_satisfies_primary_blocker() {
  let state = createInitialEvidenceState();
  state = ingest(state, 'boot:arm:requested', 11);
  state = ingest(state, 'boot:arm:confirmed', 12);

  assert.equal(state.entries['evidence:system:armed'].satisfied, true);
  assert.equal(state.entries['evidence:boot:arm:confirmed'].satisfied, true);
  assert.equal(selectEvidenceReady(state), true);
}

function test_override_does_not_satisfy_primary_blocker() {
  let state = createInitialEvidenceState();
  state = ingest(state, 'boot:override:enabled', 20);

  assert.equal(state.entries['evidence:boot:operator:override'].satisfied, true);
  assert.equal(state.entries['evidence:system:armed'].satisfied, false);
  assert.equal(selectEvidenceReady(state), false);
}

function test_reset_unsatisfies_all_evidence() {
  let state = createInitialEvidenceState();
  state = ingest(state, 'slide:00:entered', 31, 'system');
  state = ingest(state, 'boot:arm:requested', 32);
  state = ingest(state, 'boot:arm:confirmed', 33);

  assert.equal(selectEvidenceReady(state), true);

  state = ingest(state, 'boot:local:reset', 34);

  assert.equal(state.entries['evidence:slide00:entered'].satisfied, false);
  assert.equal(state.entries['evidence:system:armed'].satisfied, false);
  assert.equal(selectEvidenceReady(state), false);
}

function test_summary_counts_track_blockers_and_info() {
  let state = createInitialEvidenceState();
  state = ingest(state, 'slide:00:entered', 41, 'system');
  state = ingest(state, 'boot:arm:requested', 42);

  const summaryBefore = summarizeEvidence(state);
  assert.equal(summaryBefore.blockersSatisfied, 0);
  assert.equal(summaryBefore.blockersMissing, 1);
  assert.equal(summaryBefore.informationalSatisfied >= 2, true);

  state = ingest(state, 'boot:arm:confirmed', 43);
  const summaryAfter = summarizeEvidence(state);

  assert.equal(summaryAfter.blockersSatisfied, 1);
  assert.equal(summaryAfter.blockersMissing, 0);
}

function test_event_log_and_anchor_capture() {
  let state = createInitialEvidenceState();

  state = reduceEvidenceState(state, {
    type: 'EVIDENCE_INGEST_EVENT',
    event: {
      id: 'ev-000777',
      action: 'operator:anchor:interacted',
      actor: 'operator',
      ts: 777,
      anchorId: 'slide00:arm-system',
      payload: { anchorId: 'slide00:arm-system' },
    },
    transitions: transitionsForEvidenceAction('operator:anchor:interacted'),
  });

  assert.equal(state.eventCount, 1);
  assert.equal(state.lastInteractedAnchor, 'slide00:arm-system');
  assert.equal(state.lastEvent?.action, 'operator:anchor:interacted');
}

export function runBootEvidenceSpecs() {
  test_initial_state_has_missing_blocker();
  test_arm_confirm_satisfies_primary_blocker();
  test_override_does_not_satisfy_primary_blocker();
  test_reset_unsatisfies_all_evidence();
  test_summary_counts_track_blockers_and_info();
  test_event_log_and_anchor_capture();
}
