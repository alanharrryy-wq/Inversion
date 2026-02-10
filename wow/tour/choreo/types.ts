import { TourOverlayPhase } from '../types';

export type ChoreoPhase = TourOverlayPhase;

export type StepChoreoDurations = {
  introMs: number;
  guideMs: number;
  successMs: number;
  teaseMs: number;
};

export type ChoreoDurations = StepChoreoDurations;

export type StepChoreoState = {
  phase: TourOverlayPhase;
  cycle: number;
  progress: number;
  successVisible: boolean;
};

export type ChoreoContract = {
  durations: ChoreoDurations;
};

export type ChoreoParams = {
  enabled: boolean;
  reducedMotion: boolean;
  stepId?: string;
  stepComplete: boolean;
  contract?: Partial<ChoreoContract>;
};

export type ChoreoTimelineEntry = {
  phase: ChoreoPhase;
  durationMs: number;
};

export type ChoreoState = StepChoreoState & {
  phaseIndex: number;
  phaseClassName: string;
  phaseTimeline: ChoreoTimelineEntry[];
  contract: ChoreoContract;
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

export const DEFAULT_CHOREO_CONTRACT: ChoreoContract = {
  durations: {
    introMs: 460,
    guideMs: 1300,
    successMs: 760,
    teaseMs: 560,
  },
};

export const REDUCED_CHOREO_CONTRACT: ChoreoContract = {
  durations: {
    introMs: 60,
    guideMs: 420,
    successMs: 140,
    teaseMs: 80,
  },
};

export const PHASE_ORDER: ChoreoPhase[] = ['intro', 'guide', 'success', 'tease'];
