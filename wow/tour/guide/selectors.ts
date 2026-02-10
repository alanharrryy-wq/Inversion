import {
  GuideOverlayModel,
  GuideRuntimeContext,
  GuideRuntimeState,
  GuideScript,
  GuideStep,
  GuideStepResolution,
} from './types';
import {
  buildEvidenceMap,
  evaluateCompletionRule,
  evaluateStepEvidence,
  splitEvidence,
  summarizeRuleResolution,
} from './evidence';

export function selectActiveStep(script: GuideScript, state: GuideRuntimeState): GuideStep | null {
  if (script.steps.length === 0) return null;
  if (state.stepIndex < 0 || state.stepIndex >= script.steps.length) return null;
  return script.steps[state.stepIndex] ?? null;
}

export function selectNextStep(script: GuideScript, state: GuideRuntimeState): GuideStep | null {
  const index = state.stepIndex + 1;
  if (index < 0 || index >= script.steps.length) return null;
  return script.steps[index] ?? null;
}

export function selectProgressLabel(script: GuideScript, state: GuideRuntimeState): string {
  const total = Math.max(1, script.steps.length);
  const current = Math.min(total, Math.max(1, state.stepIndex + 1));
  return `Step ${current} / ${total}`;
}

export function selectStepResolution(script: GuideScript, state: GuideRuntimeState, ctx: GuideRuntimeContext): GuideStepResolution {
  const step = selectActiveStep(script, state);
  if (!step) {
    return {
      stepId: 'none',
      complete: state.status === 'completed',
      canAdvance: state.status === 'completed',
      blockedReasons: state.status === 'completed' ? [] : ['No active step.'],
      missingEvidence: [],
      satisfiedEvidence: [],
      ruleResolution: {
        matched: state.status === 'completed',
        missingEvidenceIds: [],
        unmetRuleSummaries: [],
      },
    };
  }

  const evidence = evaluateStepEvidence(step, state, ctx);
  const evidenceById = buildEvidenceMap(evidence);
  const ruleResolution = evaluateCompletionRule(step.completion, evidenceById, state);
  const split = splitEvidence(evidence);

  const blockedReasons = [
    ...summarizeRuleResolution(ruleResolution),
    ...split.missing.map((item) => `${item.label}: ${item.hint}`),
  ];

  const complete = ruleResolution.matched;
  const canAdvance =
    complete ||
    step.allowNextBeforeComplete === true ||
    step.fallbackAllowNext === true;

  return {
    stepId: step.id,
    complete,
    canAdvance,
    blockedReasons: complete ? [] : Array.from(new Set(blockedReasons)),
    missingEvidence: split.missing,
    satisfiedEvidence: split.satisfied,
    ruleResolution,
  };
}

export function selectCanAdvance(script: GuideScript, state: GuideRuntimeState, ctx: GuideRuntimeContext): boolean {
  if (state.status !== 'running') return false;
  const step = selectActiveStep(script, state);
  if (!step) return false;
  return selectStepResolution(script, state, ctx).canAdvance;
}

export function selectIsStepComplete(script: GuideScript, state: GuideRuntimeState, ctx: GuideRuntimeContext): boolean {
  const resolution = selectStepResolution(script, state, ctx);
  return resolution.complete;
}

export function selectOverlayModel(script: GuideScript, state: GuideRuntimeState, ctx: GuideRuntimeContext): GuideOverlayModel {
  const step = selectActiveStep(script, state);
  const resolution = selectStepResolution(script, state, ctx);
  const nextStep = selectNextStep(script, state);

  return {
    enabled: state.status === 'running' || state.status === 'completed',
    scriptId: state.scriptId,
    stepId: step?.id ?? null,
    stepTitle: step?.title ?? 'Guide complete',
    progressLabel: selectProgressLabel(script, state),
    blockedReasons: resolution.blockedReasons,
    missingEvidence: resolution.missingEvidence,
    satisfiedEvidence: resolution.satisfiedEvidence,
    nextTease: step?.nextTease,
    directorNotes: step?.directorNotes ?? [],
    nextStepTitle: nextStep?.title,
  };
}

export function selectCompletionToast(script: GuideScript, state: GuideRuntimeState): string {
  if (state.completedStepIds.length === 0) return '';
  const previousStepId = state.completedStepIds[state.completedStepIds.length - 1];
  const previous = script.steps.find((step) => step.id === previousStepId);
  if (!previous) return '';
  return previous.successLabel ?? previous.successText;
}

export function selectIsTerminalStep(script: GuideScript, state: GuideRuntimeState): boolean {
  return state.stepIndex >= script.steps.length - 1;
}

export function selectCompletedCount(state: GuideRuntimeState): number {
  return state.completedStepIds.length;
}
