export type TourEvent = {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
};

export type CompletionRule =
  | { type: 'manual' }
  | { type: 'slide'; slide: number }
  | { type: 'event'; name: string; count?: number; where?: Record<string, unknown> }
  | { type: 'all'; rules: CompletionRule[] }
  | { type: 'any'; rules: CompletionRule[] };

export type TourStep = {
  id: string;
  title: string;
  instruction: string;
  targetSelector?: string;
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
