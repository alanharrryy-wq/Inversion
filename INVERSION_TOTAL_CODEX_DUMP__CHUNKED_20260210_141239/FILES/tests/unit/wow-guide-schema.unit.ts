
import { strict as assert } from 'node:assert';
import {
  GuideScript,
  assertGuideScript,
  createScript,
  createStep,
  eventEvidence,
  evidenceRef,
  validateGuideScript,
} from '../../wow/tour/guide';

function baseScript(): GuideScript {
  return createScript({
    id: 'schema-test',
    title: 'Schema Test',
    description: 'Schema validation test script',
    steps: [
      createStep({
        id: 'step-1',
        title: 'Step 1',
        body: 'Body',
        action: { type: 'state', text: 'State text' },
        successText: 'ok',
        evidence: [
          eventEvidence({
            id: 'ev-1',
            label: 'Event 1',
            hint: 'Emit test:event',
            name: 'test:event',
            count: 1,
          }),
        ],
        completion: evidenceRef('ev-1'),
      }),
    ],
  });
}

function test_valid_script_has_no_errors() {
  const script = baseScript();
  const issues = validateGuideScript(script);
  const errors = issues.filter((item) => item.level === 'error');
  assert.equal(errors.length, 0);
}

function test_empty_script_id_errors() {
  const script = baseScript();
  script.id = '';

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'SCRIPT_ID_EMPTY'));
}

function test_duplicate_step_ids_error() {
  const script = baseScript();
  const duplicate = createStep({
    id: 'step-1',
    title: 'Duplicate',
    body: 'Body',
    action: { type: 'state', text: 'noop' },
    successText: 'ok',
    evidence: [],
    completion: { type: 'manual' },
  });

  script.steps.push(duplicate);

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'STEP_ID_DUPLICATE'));
}

function test_duplicate_evidence_ids_error() {
  const script = baseScript();
  script.steps[0].evidence.push(
    eventEvidence({
      id: 'ev-1',
      label: 'Dup',
      hint: 'Dup',
      name: 'test:event',
    })
  );

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'EVIDENCE_ID_DUPLICATE'));
}

function test_unknown_evidence_ref_error() {
  const script = baseScript();
  script.steps[0].completion = evidenceRef('not-found');

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'RULE_REFERENCES_UNKNOWN_EVIDENCE'));
}

function test_empty_rule_group_error() {
  const script = baseScript();
  script.steps[0].completion = { type: 'all', rules: [] };

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'RULE_EMPTY_GROUP'));
}

function test_click_action_requires_selector() {
  const script = baseScript();
  script.steps[0].action = { type: 'click', selector: '' };

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'ACTION_SELECTOR_EMPTY'));
}

function test_step_missing_evidence_warns() {
  const script = baseScript();
  script.steps.push(
    createStep({
      id: 'step-2',
      title: 'Step 2',
      body: 'Body',
      action: { type: 'state', text: 'No evidence' },
      successText: 'ok',
      evidence: [],
      completion: { type: 'manual' },
    })
  );

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'STEP_MISSING_EVIDENCE'));
}

function test_assertGuideScript_throws_on_error() {
  const script = baseScript();
  script.steps[0].completion = evidenceRef('missing-ref');

  let threw = false;
  try {
    assertGuideScript(script);
  } catch {
    threw = true;
  }

  assert.equal(threw, true);
}

function test_assertGuideScript_passes_valid_script() {
  const script = baseScript();
  const validated = assertGuideScript(script);
  assert.equal(validated.id, script.id);
}

function test_script_with_no_steps_fails() {
  const script = createScript({
    id: 'empty',
    title: 'Empty',
    description: 'No steps',
    steps: [],
  });

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'SCRIPT_HAS_NO_STEPS'));
}

function test_empty_evidence_id_fails() {
  const script = baseScript();
  script.steps[0].evidence.push({
    id: '',
    label: 'bad',
    hint: 'bad',
    source: { type: 'event', name: 'bad:event' },
  });

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'EVIDENCE_ID_EMPTY'));
}

function test_empty_step_id_fails() {
  const script = baseScript();
  script.steps.push(
    createStep({
      id: '',
      title: 'bad step',
      body: 'bad step',
      action: { type: 'state', text: 'bad' },
      successText: 'bad',
      evidence: [],
      completion: { type: 'manual' },
    })
  );

  const issues = validateGuideScript(script);
  assert.ok(issues.some((item) => item.code === 'STEP_ID_EMPTY'));
}

export function runGuideSchemaSpecs(): void {
  test_valid_script_has_no_errors();
  test_empty_script_id_errors();
  test_duplicate_step_ids_error();
  test_duplicate_evidence_ids_error();
  test_unknown_evidence_ref_error();
  test_empty_rule_group_error();
  test_click_action_requires_selector();
  test_step_missing_evidence_warns();
  test_assertGuideScript_throws_on_error();
  test_assertGuideScript_passes_valid_script();
  test_script_with_no_steps_fails();
  test_empty_evidence_id_fails();
  test_empty_step_id_fails();
}

