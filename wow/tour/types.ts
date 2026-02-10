export type TourEvent = {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
};

export type StepAction =
  | { type: 'click'; selector: string }
  | { type: 'state'; text: string }
  | { type: 'navigate'; text: string }
  | { type: 'chat'; text: string }
  | { type: 'open'; text: string };

export type CompletionRule =
  | { type: 'manual' }
  | { type: 'slide'; slide: number }
  | { type: 'event'; name: string; count?: number; where?: Record<string, unknown> }
  | { type: 'all'; rules: CompletionRule[] }
  | { type: 'any'; rules: CompletionRule[] };

export type TourStep = {
  id: string;
  title: string;
  body: string;
  footnote?: string;
  nextTease?: string;
  directorNotes?: string[];
  readAloudText?: string;
  successLabel?: string;
  action: StepAction;
  successText: string;
  targetSelector?: string;
  missingTargetWarning?: string;
  fallbackAllowNext?: boolean;
  spotlightPadding?: number;
  spotlightRadius?: number;
  pulseTarget?: boolean;
  connector?: boolean;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  completion: CompletionRule;
  pasteQuestion?: string;
  allowNextBeforeComplete?: boolean;
};

export type TourScript = {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
};

export type TourStatus = 'idle' | 'running' | 'paused' | 'completed';

export type TourState = {
  status: TourStatus;
  scriptId: string | null;
  scriptTitle: string;
  stepIndex: number;
  steps: TourStep[];
  completedStepIds: string[];
  eventLog: TourEvent[];
};

export type TourApi = {
  start: (scriptId?: string) => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  stop: () => void;
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
};

export type TourAutostartStatus = {
  attempts: number;
  started: boolean;
  reason: string;
  lastMissingSelector?: string;
};

export type TourOverlayPhase = 'intro' | 'guide' | 'success' | 'tease';
