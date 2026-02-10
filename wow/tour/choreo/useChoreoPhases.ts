import { useMemo } from 'react';
import { TourOverlayPhase } from '../types';
import { useStepChoreo } from './useStepChoreo';
import { ChoreoContract, ChoreoParams, ChoreoState, PHASE_ORDER } from './choreo.types';
import { getPhaseClassName, getPhaseTimeline, resolveChoreoContract } from './choreo.utils';

export function useChoreoPhases(params: ChoreoParams): ChoreoState {
  const { enabled, reducedMotion, stepId, stepComplete, contract } = params;
  const resolved = useMemo<ChoreoContract>(() => resolveChoreoContract(contract, reducedMotion), [contract, reducedMotion]);

  const legacy = useStepChoreo({
    enabled,
    reducedMotion,
    stepId,
    stepComplete,
  });

  const phase: TourOverlayPhase = legacy.phase;
  const phaseIndex = PHASE_ORDER.indexOf(phase);

  return {
    ...legacy,
    phase,
    phaseIndex,
    phaseClassName: getPhaseClassName(phase),
    phaseTimeline: getPhaseTimeline(resolved),
    contract: resolved,
  };
}
