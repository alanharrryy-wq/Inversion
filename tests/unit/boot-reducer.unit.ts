import { strict as assert } from 'node:assert';
import {
  createInitialBootState,
  reduceBootState,
} from '../../runtime/boot';
import {
  createInitialEvidenceState,
  reduceEvidenceState,
  transitionsForEvidenceAction,
} from '../../runtime/evidence';

function ingestArmConfirmedEvidence() {
  const base = createInitialEvidenceState();
  return reduceEvidenceState(base, {
    type: 'EVIDENCE_INGEST_EVENT',
    event: {
      id: 'ev-000001',
      action: 'boot:arm:confirmed',
      actor: 'operator',
      ts: 123,
      payload: {},
    },
    transitions: transitionsForEvidenceAction('boot:arm:confirmed'),
  });
}

function test_boot_initial_state() {
  const state = createInitialBootState();
  assert.equal(state.status, 'IDLE');
  assert.equal(state.overrideEnabled, false);
  assert.equal(state.armedAtTs, null);
}

function test_boot_request_transitions_to_pending() {
  const state = createInitialBootState();
  const next = reduceBootState(state, { type: 'BOOT_ARM_REQUEST', ts: 10 });

  assert.equal(next.status, 'ARMED_PENDING_CONFIRM');
  assert.equal(next.pendingAtTs, 10);
}

function test_boot_confirm_requires_pending_or_assisted() {
  const idle = createInitialBootState();
  const ignored = reduceBootState(idle, { type: 'BOOT_ARM_CONFIRM', ts: 11 });

  assert.equal(ignored.status, 'IDLE');
  assert.equal(ignored.lastAction, 'boot:arm:confirm:ignored');

  const pending = reduceBootState(idle, { type: 'BOOT_ARM_REQUEST', ts: 12 });
  const confirmed = reduceBootState(pending, { type: 'BOOT_ARM_CONFIRM', ts: 13 });

  assert.equal(confirmed.status, 'ARMED_CONFIRMED');
  assert.equal(confirmed.armedAtTs, 13);
}

function test_boot_override_sets_operator_assisted() {
  const idle = createInitialBootState();
  const assisted = reduceBootState(idle, { type: 'BOOT_OVERRIDE_ENABLE', ts: 15 });

  assert.equal(assisted.status, 'OPERATOR_ASSISTED');
  assert.equal(assisted.overrideEnabled, true);

  const disabled = reduceBootState(assisted, { type: 'BOOT_OVERRIDE_DISABLE', ts: 16 });

  assert.equal(disabled.status, 'IDLE');
  assert.equal(disabled.overrideEnabled, false);
}

function test_boot_override_can_confirm_to_armed() {
  const idle = createInitialBootState();
  const assisted = reduceBootState(idle, { type: 'BOOT_OVERRIDE_ENABLE', ts: 20 });
  const confirmed = reduceBootState(assisted, { type: 'BOOT_ARM_CONFIRM', ts: 21 });

  assert.equal(confirmed.status, 'ARMED_CONFIRMED');
  assert.equal(confirmed.overrideEnabled, false);
  assert.equal(confirmed.armedAtTs, 21);
}

function test_boot_sync_with_evidence() {
  const armed = reduceBootState(
    reduceBootState(createInitialBootState(), { type: 'BOOT_ARM_REQUEST', ts: 30 }),
    { type: 'BOOT_ARM_CONFIRM', ts: 31 }
  );

  const unsatisfiedEvidence = createInitialEvidenceState();
  const syncedDown = reduceBootState(armed, { type: 'BOOT_SYNC_WITH_EVIDENCE', evidence: unsatisfiedEvidence });

  assert.equal(syncedDown.status, 'IDLE');

  const satisfiedEvidence = ingestArmConfirmedEvidence();
  const syncedUp = reduceBootState(createInitialBootState(), {
    type: 'BOOT_SYNC_WITH_EVIDENCE',
    evidence: satisfiedEvidence,
  });

  assert.equal(syncedUp.status, 'ARMED_CONFIRMED');
  assert.equal(syncedUp.armedAtTs, 123);
}

function test_boot_reset() {
  const pending = reduceBootState(createInitialBootState(), { type: 'BOOT_ARM_REQUEST', ts: 40 });
  const reset = reduceBootState(pending, { type: 'BOOT_RESET', ts: 41 });

  assert.equal(reset.status, 'IDLE');
  assert.equal(reset.lastAction, 'boot:local:reset');
}

export function runBootReducerSpecs() {
  test_boot_initial_state();
  test_boot_request_transitions_to_pending();
  test_boot_confirm_requires_pending_or_assisted();
  test_boot_override_sets_operator_assisted();
  test_boot_override_can_confirm_to_armed();
  test_boot_sync_with_evidence();
  test_boot_reset();
}
