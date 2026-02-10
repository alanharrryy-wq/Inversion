import { canGoNext, getCurrentStep, isRuleComplete, isStepBlocked } from './selectors.engine';
import { GuideAction, GuidePredicateContext, GuideScript, GuideState } from './script.types';

export function initialGuideState(scriptId: string | null = null): GuideState {
  return {
    status: 'idle',
    scriptId,
    stepIndex: 0,
    completedStepIds: [],
    eventLog: [],
    currentSlide: 0,
  };
}

function maybeComplete(script: GuideScript, state: GuideState, ctx: GuidePredicateContext): GuideState {
  if (state.status !== 'running') return state;
  const step = getCurrentStep(script, state);
  if (!step || isStepBlocked(step, state.completedStepIds)) return state;
  if (!isRuleComplete(step.completion, step, state, ctx)) return state;

  const completed = state.completedStepIds.includes(step.id)
    ? state.completedStepIds
    : [...state.completedStepIds, step.id];

  if (state.stepIndex >= script.steps.length - 1) {
    return { ...state, completedStepIds: completed, status: 'completed' };
  }

  return { ...state, completedStepIds: completed, stepIndex: state.stepIndex + 1 };
}

export function reduceGuideState(script: GuideScript, state: GuideState, action: GuideAction, ctx: GuidePredicateContext): GuideState {
  switch (action.type) {
    case 'START':
    case 'RESTART': {
      return {
        ...initialGuideState(action.scriptId),
        status: 'running',
        eventLog: [{ name: 'guide:started', payload: { scriptId: action.scriptId }, ts: Date.now() }],
        currentSlide: ctx.currentSlide,
      };
    }
    case 'STOP':
      return initialGuideState(state.scriptId);
    case 'SKIP':
      return { ...state, status: 'completed' };
    case 'PREV':
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    case 'NEXT': {
      if (!canGoNext(script, state, ctx) && !action.allowIncomplete) return state;
      if (state.stepIndex >= script.steps.length - 1) return { ...state, status: 'completed' };
      return { ...state, stepIndex: state.stepIndex + 1 };
    }
    case 'SLIDE_CHANGED':
      return maybeComplete(script, { ...state, currentSlide: action.slide }, ctx);
    case 'EVIDENCE':
      return maybeComplete(script, { ...state, eventLog: [...state.eventLog, action.event] }, ctx);
    default:
      return state;
  }
}

export function guideEngineSelfTest(script: GuideScript, ctx: GuidePredicateContext): boolean {
  const boot = initialGuideState(script.id);
  const started = reduceGuideState(script, boot, { type: 'START', scriptId: script.id }, ctx);
  return started.status === 'running' && started.stepIndex === 0;
}
