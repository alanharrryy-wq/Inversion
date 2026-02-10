export type GuideCompletionRule =
  | { type: 'manual' }
  | { type: 'event'; name: string; count?: number; where?: Record<string, unknown> }
  | { type: 'predicate'; key: string }
  | { type: 'all'; rules: GuideCompletionRule[] }
  | { type: 'any'; rules: GuideCompletionRule[] };

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  targetSelector?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  completion: GuideCompletionRule;
  prerequisites?: string[];
  fallbackAllowNext?: boolean;
  allowNextBeforeComplete?: boolean;
  notes?: string[];
  tease?: string;
};

export type GuideScript = {
  id: string;
  title: string;
  description: string;
  steps: GuideStep[];
};

export type GuideEvidenceEvent = {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
};

export type GuideStatus = 'idle' | 'running' | 'paused' | 'completed';

export type GuideState = {
  status: GuideStatus;
  scriptId: string | null;
  stepIndex: number;
  completedStepIds: string[];
  eventLog: GuideEvidenceEvent[];
  currentSlide: number;
};

export type GuideAction =
  | { type: 'START'; scriptId: string }
  | { type: 'RESTART'; scriptId: string }
  | { type: 'NEXT'; allowIncomplete?: boolean }
  | { type: 'PREV' }
  | { type: 'SKIP' }
  | { type: 'STOP' }
  | { type: 'EVIDENCE'; event: GuideEvidenceEvent }
  | { type: 'SLIDE_CHANGED'; slide: number };

export type GuidePredicateContext = {
  currentSlide: number;
  targetExists: (selector?: string) => boolean;
};

export type GuidePredicateMap = Record<string, (step: GuideStep, state: GuideState, ctx: GuidePredicateContext) => boolean>;
