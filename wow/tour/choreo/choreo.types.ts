import { TourOverlayPhase } from '../types';

export type ChoreoPhase = TourOverlayPhase;

export type ChoreoDurations = {
  introMs: number;
  guideMs: number;
  successMs: number;
  teaseMs: number;
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

export type ChoreoState = {
  phase: ChoreoPhase;
  cycle: number;
  progress: number;
  successVisible: boolean;
  phaseIndex: number;
  phaseClassName: string;
  phaseTimeline: ChoreoTimelineEntry[];
  contract: ChoreoContract;
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
