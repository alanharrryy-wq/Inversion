import { reduceGuideState, initialGuideState } from './reducer';
import { GuideAction, GuideEvidenceEvent, GuidePredicateContext, GuideScript, GuideState } from './script.types';

export function transitionGuide(args: {
  script: GuideScript;
  state: GuideState;
  action: GuideAction;
  context: GuidePredicateContext;
}): GuideState {
  return reduceGuideState(args.script, args.state, args.action, args.context);
}

export function createGuideEngine(script: GuideScript, context: GuidePredicateContext) {
  let state = initialGuideState(script.id);

  const dispatch = (action: GuideAction): GuideState => {
    state = transitionGuide({ script, state, action, context });
    return state;
  };

  const emitEvidence = (name: string, payload?: Record<string, unknown>): GuideState => {
    const event: GuideEvidenceEvent = { name, payload, ts: Date.now() };
    return dispatch({ type: 'EVIDENCE', event });
  };

  return {
    getState: () => state,
    dispatch,
    emitEvidence,
  };
}
