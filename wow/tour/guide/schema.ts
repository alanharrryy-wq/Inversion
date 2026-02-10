import { GuideCompletionRule, GuideSchemaIssue, GuideScript, GuideStep } from './types';

function hasText(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function collectEvidenceRefs(rule: GuideCompletionRule, refs: string[]): void {
  if (rule.type === 'evidence') {
    refs.push(rule.evidenceId);
    return;
  }

  if (rule.type === 'all' || rule.type === 'any') {
    for (const child of rule.rules) {
      collectEvidenceRefs(child, refs);
    }
  }
}

function checkActionSelector(step: GuideStep, issues: GuideSchemaIssue[], script: GuideScript): void {
  if (step.action.type !== 'click') return;
  if (hasText(step.action.selector)) return;
  issues.push({
    level: 'error',
    scriptId: script.id,
    stepId: step.id,
    code: 'ACTION_SELECTOR_EMPTY',
    message: `Step ${step.id} has click action with empty selector.`,
  });
}

function checkRuleGroups(scriptId: string, stepId: string, rule: GuideCompletionRule, issues: GuideSchemaIssue[]): void {
  if (rule.type !== 'all' && rule.type !== 'any') return;

  if (rule.rules.length === 0) {
    issues.push({
      level: 'error',
      scriptId,
      stepId,
      code: 'RULE_EMPTY_GROUP',
      message: `Step ${stepId} defines an empty ${rule.type.toUpperCase()} rule group.`,
    });
    return;
  }

  for (const child of rule.rules) {
    checkRuleGroups(scriptId, stepId, child, issues);
  }
}

export function validateGuideScript(script: GuideScript): GuideSchemaIssue[] {
  const issues: GuideSchemaIssue[] = [];

  if (!hasText(script.id)) {
    issues.push({
      level: 'error',
      scriptId: script.id,
      code: 'SCRIPT_ID_EMPTY',
      message: 'Guide script id is required.',
    });
  }

  if (script.steps.length === 0) {
    issues.push({
      level: 'error',
      scriptId: script.id,
      code: 'SCRIPT_HAS_NO_STEPS',
      message: `Guide script ${script.id} has no steps.`,
    });
    return issues;
  }

  const seenStepIds = new Set<string>();

  for (const step of script.steps) {
    if (!hasText(step.id)) {
      issues.push({
        level: 'error',
        scriptId: script.id,
        stepId: step.id,
        code: 'STEP_ID_EMPTY',
        message: 'Guide step id cannot be empty.',
      });
      continue;
    }

    if (seenStepIds.has(step.id)) {
      issues.push({
        level: 'error',
        scriptId: script.id,
        stepId: step.id,
        code: 'STEP_ID_DUPLICATE',
        message: `Duplicate step id ${step.id} in script ${script.id}.`,
      });
    }
    seenStepIds.add(step.id);

    if (step.evidence.length === 0) {
      issues.push({
        level: 'warning',
        scriptId: script.id,
        stepId: step.id,
        code: 'STEP_MISSING_EVIDENCE',
        message: `Step ${step.id} has no explicit evidence declarations.`,
      });
    }

    const seenEvidenceIds = new Set<string>();
    for (const evidence of step.evidence) {
      if (!hasText(evidence.id)) {
        issues.push({
          level: 'error',
          scriptId: script.id,
          stepId: step.id,
          evidenceId: evidence.id,
          code: 'EVIDENCE_ID_EMPTY',
          message: `Step ${step.id} has evidence item with empty id.`,
        });
        continue;
      }

      if (seenEvidenceIds.has(evidence.id)) {
        issues.push({
          level: 'error',
          scriptId: script.id,
          stepId: step.id,
          evidenceId: evidence.id,
          code: 'EVIDENCE_ID_DUPLICATE',
          message: `Step ${step.id} duplicates evidence id ${evidence.id}.`,
        });
      }
      seenEvidenceIds.add(evidence.id);
    }

    const ruleRefs: string[] = [];
    collectEvidenceRefs(step.completion, ruleRefs);
    for (const ref of ruleRefs) {
      if (!seenEvidenceIds.has(ref)) {
        issues.push({
          level: 'error',
          scriptId: script.id,
          stepId: step.id,
          evidenceId: ref,
          code: 'RULE_REFERENCES_UNKNOWN_EVIDENCE',
          message: `Step ${step.id} completion references unknown evidence id ${ref}.`,
        });
      }
    }

    checkRuleGroups(script.id, step.id, step.completion, issues);
    checkActionSelector(step, issues, script);
  }

  return issues;
}

export function assertGuideScript(script: GuideScript): GuideScript {
  const issues = validateGuideScript(script);
  const errors = issues.filter((issue) => issue.level === 'error');
  if (errors.length > 0) {
    const detail = errors.map((item) => `${item.code}${item.stepId ? `(${item.stepId})` : ''}: ${item.message}`).join('; ');
    throw new Error(`Invalid guide script ${script.id}: ${detail}`);
  }
  return script;
}

export function assertGuideScripts(scripts: GuideScript[]): GuideScript[] {
  const seen = new Set<string>();
  for (const script of scripts) {
    if (seen.has(script.id)) {
      throw new Error(`Duplicate guide script id: ${script.id}`);
    }
    seen.add(script.id);
    assertGuideScript(script);
  }
  return scripts;
}
