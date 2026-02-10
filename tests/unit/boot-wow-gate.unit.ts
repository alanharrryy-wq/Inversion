import { strict as assert } from 'node:assert';
import {
  createInitialBootRuntimeState,
  reduceBootRuntimeState,
  resolveWowFeatureGates,
} from '../../runtime/boot';

const FLAGS_ON = {
  WOW_DEMO: true,
  WOW_TOUR: true,
  WOW_TOUR_AUTOSTART: true,
  WOW_DEMO_SCRIPT: true,
  WOW_OPENING_CINEMA: true,
  WOW_MIRROR: true,
} as const;

function test_gate_locked_before_arming() {
  const state = createInitialBootRuntimeState();
  const gates = resolveWowFeatureGates(state, FLAGS_ON);

  assert.equal(gates.tour.locked, true);
  assert.equal(gates.demoScript.locked, true);
  assert.equal(gates.openingCinema.locked, true);
  assert.equal(gates.tour.reason, 'boot-gate-locked:not-armed');
}

function test_gate_opens_after_arm_confirm_but_autostart_stays_off() {
  let state = createInitialBootRuntimeState();
  state = reduceBootRuntimeState(state, { type: 'BOOT_RUNTIME_REQUEST_ARM', ts: 100 });
  state = reduceBootRuntimeState(state, { type: 'BOOT_RUNTIME_CONFIRM_ARM', ts: 101 });

  const gates = resolveWowFeatureGates(state, FLAGS_ON);

  assert.equal(gates.tour.locked, false);
  assert.equal(gates.tour.ready, true);
  assert.equal(gates.demoScript.locked, false);
  assert.equal(gates.openingCinema.locked, false);

  assert.equal(gates.tourAutostart.locked, false);
  assert.equal(gates.tourAutostart.ready, false);
  assert.equal(gates.tourAutostart.reason, 'autostart-disabled-by-boot-contract');
}

function test_operator_override_enables_assisted_gate_without_arming() {
  let state = createInitialBootRuntimeState();
  state = reduceBootRuntimeState(state, { type: 'BOOT_RUNTIME_SET_OVERRIDE', enabled: true, ts: 200 });

  const gates = resolveWowFeatureGates(state, FLAGS_ON);

  assert.equal(state.boot.status, 'OPERATOR_ASSISTED');
  assert.equal(state.evidence.entries['evidence:system:armed'].satisfied, false);
  assert.equal(gates.tour.locked, false);
  assert.equal(gates.tour.operatorAssisted, true);
  assert.equal(gates.demoScript.operatorAssisted, true);
}

function test_flags_off_keep_features_disabled_even_when_armed() {
  let state = createInitialBootRuntimeState();
  state = reduceBootRuntimeState(state, { type: 'BOOT_RUNTIME_REQUEST_ARM', ts: 300 });
  state = reduceBootRuntimeState(state, { type: 'BOOT_RUNTIME_CONFIRM_ARM', ts: 301 });

  const gates = resolveWowFeatureGates(state, {
    WOW_DEMO: true,
    WOW_TOUR: false,
    WOW_TOUR_AUTOSTART: false,
    WOW_DEMO_SCRIPT: false,
    WOW_OPENING_CINEMA: false,
    WOW_MIRROR: false,
  });

  assert.equal(gates.tour.locked, true);
  assert.equal(gates.demoScript.locked, true);
  assert.equal(gates.openingCinema.locked, true);
  assert.equal(gates.mirrorIntro.locked, true);
}

function test_wow_demo_off_locks_everything() {
  const state = createInitialBootRuntimeState();
  const gates = resolveWowFeatureGates(state, {
    WOW_DEMO: false,
    WOW_TOUR: true,
    WOW_TOUR_AUTOSTART: true,
    WOW_DEMO_SCRIPT: true,
    WOW_OPENING_CINEMA: true,
    WOW_MIRROR: true,
  });

  assert.equal(gates.tour.reason, 'wow-demo-disabled');
  assert.equal(gates.demoScript.reason, 'wow-demo-disabled');
  assert.equal(gates.openingCinema.reason, 'wow-demo-disabled');
}

export function runBootWowGateSpecs() {
  test_gate_locked_before_arming();
  test_gate_opens_after_arm_confirm_but_autostart_stays_off();
  test_operator_override_enables_assisted_gate_without_arming();
  test_flags_off_keep_features_disabled_even_when_armed();
  test_wow_demo_off_locks_everything();
}
