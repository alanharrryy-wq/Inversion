import { ChoreoContract, ChoreoPhase, ChoreoTimelineEntry, DEFAULT_CHOREO_CONTRACT, PHASE_ORDER, REDUCED_CHOREO_CONTRACT } from './types';

export function resolveChoreoContract(contract: Partial<ChoreoContract> | undefined, reducedMotion: boolean): ChoreoContract {
  const base = reducedMotion ? REDUCED_CHOREO_CONTRACT : DEFAULT_CHOREO_CONTRACT;
  return {
    durations: {
      ...base.durations,
      ...(contract?.durations ?? {}),
    },
  };
}

export function getPhaseClassName(phase: ChoreoPhase): string {
  return `wow-tour--phase-${phase}`;
}

export function getPhaseTimeline(contract: ChoreoContract): ChoreoTimelineEntry[] {
  return PHASE_ORDER.map((phase) => ({
    phase,
    durationMs:
      phase === 'intro'
        ? contract.durations.introMs
        : phase === 'guide'
        ? contract.durations.guideMs
        : phase === 'success'
        ? contract.durations.successMs
        : contract.durations.teaseMs,
  }));
}
