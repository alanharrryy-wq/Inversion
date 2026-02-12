import {
  EvidenceEvaluation,
  EvidenceModelInput,
  EvidenceStepDefinition,
  EvidenceStepId,
} from "../evidence";

export type Slide03Stage = "idle" | "step1" | "step2" | "step3" | "sealed";

export type Slide03CardVisualState =
  | "pending"
  | "in_progress"
  | "armed"
  | "revealed"
  | "locked"
  | "disabled";

export type Slide03ActionSource = "user" | "replay" | "system";

export interface Slide03PointerState {
  active: boolean;
  stepId: EvidenceStepId | null;
  pointerId: number | null;
  progress: number;
  lastFrameRatio: number;
}

export interface Slide03CardState {
  stepId: EvidenceStepId;
  ordinal: number;
  unlockThreshold: number;
  visualState: Slide03CardVisualState;
  progress: number;
  armed: boolean;
  revealed: boolean;
  locked: boolean;
  pointerActive: boolean;
  attempts: number;
  confirmations: number;
  lastReason: string;
}

export interface Slide03ActionEnvelope {
  actionType: Slide03ActionType;
  accepted: boolean;
  reason: string;
  stageBefore: Slide03Stage;
  stageAfter: Slide03Stage;
  confidenceBefore: number;
  confidenceAfter: number;
  uncertaintyBefore: number;
  uncertaintyAfter: number;
  revealedAfter: EvidenceStepId[];
}

export interface Slide03ReplayRecord {
  seq: number;
  source: Slide03ActionSource;
  capture: boolean;
  at: string;
  action: Slide03Action;
  envelope: Slide03ActionEnvelope;
}

export interface Slide03ReplaySummary {
  totalActions: number;
  acceptedActions: number;
  rejectedActions: number;
  lastReplayStatus: "none" | "ready" | "played" | "failed";
  lastReplayMessage: string;
}

export interface Slide03State {
  contractVersion: "slide03-contract-v1";
  sessionId: string;
  stage: Slide03Stage;
  steps: EvidenceStepDefinition[];
  cards: Record<EvidenceStepId, Slide03CardState>;
  pointer: Slide03PointerState;
  revealedSteps: EvidenceStepId[];
  nextExpectedStep: EvidenceStepId | null;
  evaluation: EvidenceEvaluation;
  modelInput: EvidenceModelInput;
  replayLog: Slide03ReplayRecord[];
  replaySummary: Slide03ReplaySummary;
  transitionCount: number;
  lastActionType: Slide03ActionType;
  lastActionReason: string;
  lastAccepted: boolean;
}

export type Slide03ActionType =
  | "POINTER_START"
  | "POINTER_FRAME"
  | "POINTER_END"
  | "POINTER_CANCEL"
  | "CONFIRM_STEP"
  | "COMMIT_SEAL"
  | "RESET_SESSION"
  | "REPLACE_STATE";

export interface ActionMeta {
  source?: Slide03ActionSource;
  capture?: boolean;
}

export interface PointerStartAction extends ActionMeta {
  type: "POINTER_START";
  stepId: EvidenceStepId;
  pointerId: number;
}

export interface PointerFrameAction extends ActionMeta {
  type: "POINTER_FRAME";
  stepId: EvidenceStepId;
  pointerId: number;
  ratio: number;
}

export interface PointerEndAction extends ActionMeta {
  type: "POINTER_END";
  stepId: EvidenceStepId;
  pointerId: number;
}

export interface PointerCancelAction extends ActionMeta {
  type: "POINTER_CANCEL";
  stepId: EvidenceStepId;
  pointerId: number;
  reason: string;
}

export interface ConfirmStepAction extends ActionMeta {
  type: "CONFIRM_STEP";
  stepId: EvidenceStepId;
}

export interface CommitSealAction extends ActionMeta {
  type: "COMMIT_SEAL";
}

export interface ResetSessionAction extends ActionMeta {
  type: "RESET_SESSION";
  reason: string;
}

export interface ReplaceStateAction extends ActionMeta {
  type: "REPLACE_STATE";
  nextState: Slide03State;
  reason: string;
}

export type Slide03Action =
  | PointerStartAction
  | PointerFrameAction
  | PointerEndAction
  | PointerCancelAction
  | ConfirmStepAction
  | CommitSealAction
  | ResetSessionAction
  | ReplaceStateAction;

export interface Slide03ReducerResult {
  state: Slide03State;
  envelope: Slide03ActionEnvelope;
}

export interface ReplayableActionShape {
  type: Exclude<Slide03ActionType, "REPLACE_STATE">;
  stepId?: EvidenceStepId;
  pointerId?: number;
  ratio?: number;
  reason?: string;
}

export interface Slide03ReplayPayload {
  version: 1;
  createdAtIso: string;
  routeId: string;
  constraintDigest: string;
  actions: ReplayableActionShape[];
  expectedFinalStage: Slide03Stage;
  expectedFinalConfidence: number;
  expectedFinalUncertainty: number;
  expectedSealLevel: "open" | "forming" | "sealed";
}

export interface ReplayRunMismatch {
  index: number;
  reason: string;
  expectedStage?: Slide03Stage;
  actualStage?: Slide03Stage;
}

export interface ReplayRunResult {
  success: boolean;
  mismatches: ReplayRunMismatch[];
  finalState: Slide03State;
  message: string;
}
