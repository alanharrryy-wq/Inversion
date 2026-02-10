import { selectIsStepComplete, selectIsTerminalStep, selectStepResolution } from './selectors';
import {
  GuideRuntimeAction,
  GuideRuntimeContext,
  GuideRuntimeState,
  GuideScript,
} from './types';

export function initialGuideRuntimeState(scriptId: string | null = null): GuideRuntimeState {
  return {
    status: 'idle',
    scriptId,
    stepIndex: 0,
    currentSlide: 0,
    completedStepIds: [],
    eventLog: [],
    lastActionTs: 0,
    startedAtTs: 0,
    stoppedAtTs: 0,
  };
}

function markStepComplete(script: GuideScript, state: GuideRuntimeState): GuideRuntimeState {
  if (state.status !== 'running') return state;

  const step = script.steps[state.stepIndex];
  if (!step) return state;

  const completedStepIds = state.completedStepIds.includes(step.id)
    ? state.completedStepIds
    : [...state.completedStepIds, step.id];

  if (selectIsTerminalStep(script, state)) {
    return {
      ...state,
      completedStepIds,
      status: 'completed',
      stoppedAtTs: state.lastActionTs,
    };
  }

  return {
    ...state,
    completedStepIds,
    stepIndex: state.stepIndex + 1,
  };
}

function completeIfSatisfied(script: GuideScript, state: GuideRuntimeState, ctx: GuideRuntimeContext): GuideRuntimeState {
  if (state.status !== 'running') return state;

  const resolution = selectStepResolution(script, state, ctx);
  if (!resolution.complete) return state;

  return markStepComplete(script, state);
}

function startScript(state: GuideRuntimeState, scriptId: string, ts: number): GuideRuntimeState {
  return {
    status: 'running',
    scriptId,
    stepIndex: 0,
    currentSlide: state.currentSlide,
    completedStepIds: [],
    eventLog: [{ name: 'guide:started', payload: { scriptId }, ts }],
    lastActionTs: ts,
    startedAtTs: ts,
    stoppedAtTs: 0,
  };
}

export function reduceGuideRuntimeState(
  script: GuideScript,
  state: GuideRuntimeState,
  action: GuideRuntimeAction,
  ctx: GuideRuntimeContext,
): GuideRuntimeState {
  switch (action.type) {
    case 'START':
      return completeIfSatisfied(script, startScript(state, action.scriptId, action.ts), ctx);

    case 'RESTART':
      return completeIfSatisfied(script, startScript(state, action.scriptId, action.ts), ctx);

    case 'STOP':
      return {
        ...initialGuideRuntimeState(state.scriptId),
        currentSlide: state.currentSlide,
        stoppedAtTs: action.ts,
      };

    case 'SKIP':
      return {
        ...state,
        status: 'completed',
        lastActionTs: action.ts,
        stoppedAtTs: action.ts,
      };

    case 'BACK': {
      if (state.status !== 'running') return state;
      return {
        ...state,
        stepIndex: Math.max(0, state.stepIndex - 1),
        lastActionTs: action.ts,
      };
    }

    case 'NEXT': {
      if (state.status !== 'running') return state;
      const allowIncomplete = action.allowIncomplete === true;

      if (!allowIncomplete && !selectIsStepComplete(script, state, ctx)) {
        return {
          ...state,
          lastActionTs: action.ts,
        };
      }

      if (selectIsTerminalStep(script, state)) {
        return {
          ...state,
          status: 'completed',
          lastActionTs: action.ts,
          stoppedAtTs: action.ts,
        };
      }

      return {
        ...state,
        stepIndex: state.stepIndex + 1,
        lastActionTs: action.ts,
      };
    }

    case 'SLIDE_CHANGED': {
      const next = {
        ...state,
        currentSlide: action.slide,
        lastActionTs: action.ts,
      };
      return completeIfSatisfied(script, next, ctx);
    }

    case 'EVIDENCE_CAPTURED': {
      const next = {
        ...state,
        eventLog: [...state.eventLog, action.event],
        lastActionTs: action.event.ts,
      };
      return completeIfSatisfied(script, next, ctx);
    }

    default:
      return state;
  }
}

export function replayGuideActions(
  script: GuideScript,
  actions: GuideRuntimeAction[],
  ctx: GuideRuntimeContext,
  seed?: GuideRuntimeState,
): GuideRuntimeState {
  let state = seed ?? initialGuideRuntimeState(script.id);
  for (const action of actions) {
    state = reduceGuideRuntimeState(script, state, action, ctx);
  }
  return state;
}
