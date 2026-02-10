import { GuidePredicateMap } from './script.types';

export const guidePredicates: GuidePredicateMap = {
  targetVisible: (step, _state, ctx) => ctx.targetExists(step.targetSelector),
  slideAligned: (_step, state) => {
    const payload = state.eventLog[state.eventLog.length - 1]?.payload;
    return typeof payload?.slide === 'number' ? payload.slide === state.currentSlide : true;
  },
};

export function getPredicate(key: string) {
  return guidePredicates[key];
}
