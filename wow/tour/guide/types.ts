export type GuideStatus = 'idle' | 'running' | 'paused' | 'completed';

export type GuidePlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type GuideActionHint =
  | { type: 'click'; selector: string }
  | { type: 'state'; text: string }
  | { type: 'navigate'; text: string }
  | { type: 'chat'; text: string }
  | { type: 'open'; text: string };

export type GuideEvidenceValue = string | number | boolean | null;

export type GuideEvidencePayload = Record<string, GuideEvidenceValue | GuideEvidenceValue[]>;

export type GuideEvidenceEvent = {
  name: string;
  payload?: GuideEvidencePayload;
  ts: number;
};

export type GuideEvidenceSource =
  | {
      type: 'event';
      name: string;
      count?: number;
      where?: Record<string, GuideEvidenceValue>;
      description?: string;
    }
  | {
      type: 'slide';
      slide: number | number[];
      description?: string;
    }
  | {
      type: 'selector';
      selector: string;
      mode?: 'exists' | 'missing';
      description?: string;
    };

export type GuideEvidenceItem = {
  id: string;
  label: string;
  hint: string;
  required?: boolean;
  source: GuideEvidenceSource;
};

export type GuideCompletionRule =
  | { type: 'manual' }
  | { type: 'evidence'; evidenceId: string }
  | { type: 'event'; name: string; count?: number; where?: Record<string, GuideEvidenceValue> }
  | { type: 'slide'; slide: number | number[] }
  | { type: 'all'; rules: GuideCompletionRule[] }
  | { type: 'any'; rules: GuideCompletionRule[] };

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  footnote?: string;
  nextTease?: string;
  directorNotes?: string[];
  readAloudText?: string;
  successLabel?: string;
  successText: string;
  action: GuideActionHint;
  targetSelector?: string;
  missingTargetWarning?: string;
  fallbackAllowNext?: boolean;
  spotlightPadding?: number;
  spotlightRadius?: number;
  pulseTarget?: boolean;
  connector?: boolean;
  placement?: GuidePlacement;
  pasteQuestion?: string;
  allowNextBeforeComplete?: boolean;
  evidence: GuideEvidenceItem[];
  completion: GuideCompletionRule;
};

export type GuideScriptMeta = {
  version: string;
  owner: string;
  audience: string;
  durationMin?: number;
  tags?: string[];
};

export type GuideScript = {
  id: string;
  title: string;
  description: string;
  meta: GuideScriptMeta;
  steps: GuideStep[];
};

export type GuideRuntimeState = {
  status: GuideStatus;
  scriptId: string | null;
  stepIndex: number;
  currentSlide: number;
  completedStepIds: string[];
  eventLog: GuideEvidenceEvent[];
  lastActionTs: number;
  startedAtTs: number;
  stoppedAtTs: number;
};

export type GuideRuntimeAction =
  | { type: 'START'; scriptId: string; ts: number }
  | { type: 'RESTART'; scriptId: string; ts: number }
  | { type: 'STOP'; ts: number }
  | { type: 'SKIP'; ts: number }
  | { type: 'NEXT'; ts: number; allowIncomplete?: boolean }
  | { type: 'BACK'; ts: number }
  | { type: 'SLIDE_CHANGED'; slide: number; ts: number }
  | { type: 'EVIDENCE_CAPTURED'; event: GuideEvidenceEvent };

export type GuideRuntimeContext = {
  targetExists: (selector?: string) => boolean;
  now: () => number;
};

export type GuideEvidenceResolution = {
  id: string;
  label: string;
  hint: string;
  required: boolean;
  matched: boolean;
  expected: string;
  observed: string;
  sourceType: GuideEvidenceSource['type'];
};

export type GuideRuleResolution = {
  matched: boolean;
  missingEvidenceIds: string[];
  unmetRuleSummaries: string[];
};

export type GuideStepResolution = {
  stepId: string;
  complete: boolean;
  canAdvance: boolean;
  blockedReasons: string[];
  missingEvidence: GuideEvidenceResolution[];
  satisfiedEvidence: GuideEvidenceResolution[];
  ruleResolution: GuideRuleResolution;
};

export type GuideOverlayModel = {
  enabled: boolean;
  scriptId: string | null;
  stepId: string | null;
  stepTitle: string;
  progressLabel: string;
  blockedReasons: string[];
  missingEvidence: GuideEvidenceResolution[];
  satisfiedEvidence: GuideEvidenceResolution[];
  nextTease?: string;
  directorNotes: string[];
  nextStepTitle?: string;
};

export type GuideSchemaIssueLevel = 'error' | 'warning';

export type GuideSchemaIssue = {
  level: GuideSchemaIssueLevel;
  scriptId: string;
  stepId?: string;
  evidenceId?: string;
  code:
    | 'SCRIPT_ID_EMPTY'
    | 'SCRIPT_HAS_NO_STEPS'
    | 'STEP_ID_DUPLICATE'
    | 'STEP_ID_EMPTY'
    | 'STEP_MISSING_EVIDENCE'
    | 'EVIDENCE_ID_DUPLICATE'
    | 'EVIDENCE_ID_EMPTY'
    | 'RULE_REFERENCES_UNKNOWN_EVIDENCE'
    | 'RULE_EMPTY_GROUP'
    | 'ACTION_SELECTOR_EMPTY';
  message: string;
};

export type GuideScriptCatalog = Record<string, GuideScript>;
