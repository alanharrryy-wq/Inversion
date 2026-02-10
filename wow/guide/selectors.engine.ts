import { getPredicate } from './selectors';
import { GuideCompletionRule, GuideEvidenceEvent, GuidePredicateContext, GuideScript, GuideState, GuideStep } from './script.types';

export function countEvent(events: GuideEvidenceEvent[], name: string, where?: Record<string, unknown>): number {
  return events.filter((event) => {
    if (event.name !== name) return false;
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => event.payload?.[key] === value);
  }).length;
}

export function isRuleComplete(rule: GuideCompletionRule, step: GuideStep, state: GuideState, ctx: GuidePredicateContext): boolean {
  if (rule.type === 'manual') return false;
  if (rule.type === 'event') return countEvent(state.eventLog, rule.name, rule.where) >= (rule.count ?? 1);
  if (rule.type === 'predicate') {
    const predicate = getPredicate(rule.key);
    return predicate ? predicate(step, state, ctx) : false;
  }
  if (rule.type === 'all') return rule.rules.every((child) => isRuleComplete(child, step, state, ctx));
  if (rule.type === 'any') return rule.rules.some((child) => isRuleComplete(child, step, state, ctx));
  return false;
}

export function getCurrentStep(script: GuideScript, state: GuideState): GuideStep | null {
  return script.steps[state.stepIndex] ?? null;
}

export function isStepBlocked(step: GuideStep | null, completedStepIds: string[]): boolean {
  if (!step) return true;
  const prereqs = step.prerequisites ?? [];
  return prereqs.some((id) => !completedStepIds.includes(id));
}

export function canGoNext(script: GuideScript, state: GuideState, ctx: GuidePredicateContext): boolean {
  const step = getCurrentStep(script, state);
  if (!step) return false;
  if (isStepBlocked(step, state.completedStepIds)) return false;
  if (step.allowNextBeforeComplete || step.fallbackAllowNext) return true;
  return isRuleComplete(step.completion, step, state, ctx);
}
