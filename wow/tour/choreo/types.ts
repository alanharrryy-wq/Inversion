import { TourOverlayPhase } from '../types';

export type StepChoreoDurations = {
  introMs: number;
  guideMs: number;
  successMs: number;
  teaseMs: number;
};

export type StepChoreoState = {
  phase: TourOverlayPhase;
  cycle: number;
  progress: number;
  successVisible: boolean;
};

export const DEFAULT_CHOREO_DURATIONS: StepChoreoDurations = {
  introMs: 620,
  guideMs: 1800,
  successMs: 760,
  teaseMs: 480,
};

export const REDUCED_CHOREO_DURATIONS: StepChoreoDurations = {
  introMs: 220,
  guideMs: 900,
  successMs: 360,
  teaseMs: 220,
};
