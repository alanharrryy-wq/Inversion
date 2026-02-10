import { reduceGuideRuntimeState, initialGuideRuntimeState } from './reducer';
import { selectOverlayModel, selectStepResolution } from './selectors';
import {
  GuideRuntimeAction,
  GuideRuntimeContext,
  GuideRuntimeState,
  GuideScript,
} from './types';

export type GuideEngine = {
  dispatch: (action: GuideRuntimeAction) => GuideRuntimeState;
  getState: () => GuideRuntimeState;
  getStepResolution: () => ReturnType<typeof selectStepResolution>;
  getOverlayModel: () => ReturnType<typeof selectOverlayModel>;
};

export function transitionGuideState(args: {
  script: GuideScript;
  state: GuideRuntimeState;
  action: GuideRuntimeAction;
  context: GuideRuntimeContext;
}): GuideRuntimeState {
  return reduceGuideRuntimeState(args.script, args.state, args.action, args.context);
}

export function createGuideEngine(script: GuideScript, context: GuideRuntimeContext): GuideEngine {
  let state = initialGuideRuntimeState(script.id);

  const dispatch = (action: GuideRuntimeAction): GuideRuntimeState => {
    state = transitionGuideState({
      script,
      state,
      action,
      context,
    });
    return state;
  };

  return {
    dispatch,
    getState: () => state,
    getStepResolution: () => selectStepResolution(script, state, context),
    getOverlayModel: () => selectOverlayModel(script, state, context),
  };
}
