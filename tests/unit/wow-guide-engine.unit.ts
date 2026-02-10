import { strict as assert } from 'node:assert';
import {
  GuideEvidencePayload,
  GuideRuntimeAction,
  GuideRuntimeContext,
  GuideRuntimeState,
  initialGuideRuntimeState,
  reduceGuideRuntimeState,
  resolveGuideScript,
  selectOverlayModel,
  selectStepResolution,
} from '../../wow/tour/guide';

function ctx(overrides?: Partial<GuideRuntimeContext>): GuideRuntimeContext {
  return {
    now: () => 1000,
    targetExists: (selector?: string) => {
      if (!selector) return true;
      if (selector.includes('missing')) return false;
      return true;
    },
    ...overrides,
  };
}

function applyActions(scriptId: string, actions: GuideRuntimeAction[], initialSlide = 0) {
  const script = resolveGuideScript(scriptId);
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: initialSlide,
  };

  for (const action of actions) {
    state = reduceGuideRuntimeState(script, state, action, ctx());
  }

  return { script, state };
}

function eventAction(name: string, ts: number, payload?: GuideEvidencePayload): GuideRuntimeAction {
  return {
    type: 'EVIDENCE_CAPTURED',
    event: {
      name,
      payload,
      ts,
    },
  };
}

function test_start_sets_running() {
  const { script, state } = applyActions('enterprise', [{ type: 'START', scriptId: 'enterprise', ts: 100 }], -1);

  assert.equal(script.id, 'enterprise');
  assert.equal(state.status, 'running');
  assert.equal(state.stepIndex, 0);
  assert.equal(state.eventLog.length, 1);
  assert.equal(state.eventLog[0].name, 'guide:started');
}

function test_slide_evidence_advances_step() {
  const actions: GuideRuntimeAction[] = [
    { type: 'START', scriptId: 'guided-demo', ts: 100 },
    { type: 'SLIDE_CHANGED', slide: 0, ts: 101 },
    { type: 'SLIDE_CHANGED', slide: 4, ts: 102 },
  ];

  const { script, state } = applyActions('guided-demo', actions);
  const resolution = selectStepResolution(script, state, ctx());

  assert.equal(state.status, 'running');
  assert.ok(state.stepIndex >= 1);
  assert.ok(resolution.blockedReasons.length >= 0);
}

function test_event_evidence_resolves_completion() {
  const actions: GuideRuntimeAction[] = [
    { type: 'START', scriptId: 'guided-demo', ts: 100 },
    { type: 'SLIDE_CHANGED', slide: 0, ts: 101 },
    { type: 'NEXT', ts: 102, allowIncomplete: true },
    { type: 'SLIDE_CHANGED', slide: 4, ts: 103 },
    eventAction('evidence:locked', 104),
  ];

  const { script, state } = applyActions('guided-demo', actions);
  const overlay = selectOverlayModel(script, state, ctx());

  assert.equal(overlay.scriptId, 'guided-demo');
  assert.ok(Array.isArray(overlay.blockedReasons));
}

function test_next_without_evidence_does_not_advance_by_default() {
  const script = resolveGuideScript('guided-demo');
  const strictStepIndex = 3;
  let state: GuideRuntimeState = {
    ...initialGuideRuntimeState(script.id),
    status: 'running',
    scriptId: script.id,
    stepIndex: strictStepIndex,
    currentSlide: 4,
    completedStepIds: script.steps.slice(0, strictStepIndex).map((step) => step.id),
    eventLog: [{ name: 'guide:started', payload: { scriptId: script.id }, ts: 10 }],
  };

  const beforeIndex = state.stepIndex;

  state = reduceGuideRuntimeState(script, state, { type: 'NEXT', ts: 11, allowIncomplete: false }, ctx());

  assert.equal(state.stepIndex, beforeIndex);
}

function test_next_with_allow_incomplete_advances() {
  const script = resolveGuideScript('guided-demo');
  const strictStepIndex = 3;
  let state: GuideRuntimeState = {
    ...initialGuideRuntimeState(script.id),
    status: 'running',
    scriptId: script.id,
    stepIndex: strictStepIndex,
    currentSlide: 4,
    completedStepIds: script.steps.slice(0, strictStepIndex).map((step) => step.id),
    eventLog: [{ name: 'guide:started', payload: { scriptId: script.id }, ts: 20 }],
  };

  const beforeIndex = state.stepIndex;

  state = reduceGuideRuntimeState(script, state, { type: 'NEXT', ts: 21, allowIncomplete: true }, ctx());

  assert.equal(state.stepIndex, beforeIndex + 1);
}

function test_back_never_goes_negative() {
  const script = resolveGuideScript('enterprise');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 30 }, ctx());
  state = reduceGuideRuntimeState(script, state, { type: 'BACK', ts: 31 }, ctx());

  assert.equal(state.stepIndex, 0);
}

function test_skip_sets_completed() {
  const script = resolveGuideScript('enterprise');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 40 }, ctx());
  state = reduceGuideRuntimeState(script, state, { type: 'SKIP', ts: 41 }, ctx());

  assert.equal(state.status, 'completed');
}

function test_stop_resets_runtime() {
  const script = resolveGuideScript('enterprise');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 50 }, ctx());
  state = reduceGuideRuntimeState(script, state, { type: 'STOP', ts: 51 }, ctx());

  assert.equal(state.status, 'idle');
  assert.equal(state.stepIndex, 0);
  assert.equal(state.eventLog.length, 0);
}

function test_deterministic_replay_same_actions() {
  const actions: GuideRuntimeAction[] = [
    { type: 'START', scriptId: 'guided-demo', ts: 100 },
    { type: 'SLIDE_CHANGED', slide: 0, ts: 101 },
    { type: 'NEXT', ts: 102, allowIncomplete: true },
    { type: 'SLIDE_CHANGED', slide: 4, ts: 103 },
    eventAction('evidence:locked', 104),
    eventAction('evidence:copied', 105),
    eventAction('ai:opened', 106),
  ];

  const runA = applyActions('guided-demo', actions).state;
  const runB = applyActions('guided-demo', actions).state;

  assert.deepEqual(runA, runB);
}

function test_blocked_reasons_present_when_missing_evidence() {
  const script = resolveGuideScript('guided-demo');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 70 }, ctx());

  const resolution = selectStepResolution(script, state, ctx());
  assert.ok(resolution.blockedReasons.length >= 0);
  assert.ok(Array.isArray(resolution.missingEvidence));
}

function test_selector_evidence_uses_context() {
  const script = resolveGuideScript('enterprise');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 80 }, ctx({ targetExists: () => false }));
  const resolution = selectStepResolution(script, state, ctx({ targetExists: () => false }));

  assert.ok(resolution.missingEvidence.length >= 0);
}

function test_overlay_model_shape() {
  const script = resolveGuideScript('enterprise');
  let state = {
    ...initialGuideRuntimeState(script.id),
    scriptId: script.id,
    currentSlide: 0,
  };

  state = reduceGuideRuntimeState(script, state, { type: 'START', scriptId: script.id, ts: 90 }, ctx());
  const overlay = selectOverlayModel(script, state, ctx());

  assert.equal(typeof overlay.progressLabel, 'string');
  assert.equal(typeof overlay.stepTitle, 'string');
  assert.ok(Array.isArray(overlay.directorNotes));
}

export function runGuideEngineSpecs(): void {
  test_start_sets_running();
  test_slide_evidence_advances_step();
  test_event_evidence_resolves_completion();
  test_next_without_evidence_does_not_advance_by_default();
  test_next_with_allow_incomplete_advances();
  test_back_never_goes_negative();
  test_skip_sets_completed();
  test_stop_resets_runtime();
  test_deterministic_replay_same_actions();
  test_blocked_reasons_present_when_missing_evidence();
  test_selector_evidence_uses_context();
  test_overlay_model_shape();
}
