export type FirstProofRitualStage =
  | "idle"
  | "dragging"
  | "drag-satisfied"
  | "holding"
  | "hold-satisfied"
  | "sealed";

export type FirstProofStepKey = "drag" | "hold" | "release";
export type FirstProofStepStatus = "locked" | "active" | "complete";

export type FirstProofSealStatus =
  | "incomplete"
  | "intent-registered"
  | "responsibility-pending"
  | "system-armed"
  | "sealed";

export type FirstProofCanonicalProfile = "legacy" | "speed";

export type FirstProofPointerPoint = {
  x: number;
  y: number;
};

export type FirstProofThresholds = {
  dragThresholdPx: number;
  dragMaxTravelPx: number;
  dragDirectionRatio: number;
  holdDurationMs: number;
  holdTickClampMs: number;
  releaseSnapPx: number;
};

export type FirstProofState = {
  stage: FirstProofRitualStage;
  pointerActive: boolean;
  activePointerId: number | null;
  originPoint: FirstProofPointerPoint | null;
  pointerPoint: FirstProofPointerPoint | null;

  dragDistancePx: number;
  dragDxPx: number;
  dragDyPx: number;
  dragDirectionRatio: number;
  dragDirectionValid: boolean;
  dragThresholdReached: boolean;

  holdElapsedMs: number;
  holdTickCount: number;
  holdThresholdReached: boolean;

  releaseAttempted: boolean;
  releaseBlocked: boolean;
  releaseCommitted: boolean;
};

export type FirstProofMachineEvent =
  | {
      type: "pointer_down";
      pointerId: number;
      x: number;
      y: number;
      ts: number;
    }
  | {
      type: "pointer_move";
      pointerId: number;
      x: number;
      y: number;
      ts: number;
    }
  | {
      type: "pointer_up";
      pointerId: number;
      x: number;
      y: number;
      ts: number;
    }
  | {
      type: "pointer_cancel";
      pointerId: number;
      x: number;
      y: number;
      ts: number;
    }
  | {
      type: "hold_tick";
      pointerId: number;
      deltaMs: number;
      ts: number;
    }
  | {
      type: "reset";
      ts: number;
    };

export type FirstProofAnchorSignal = {
  kind: "anchor";
  anchorId: string;
  note: string;
};

export type FirstProofEvidenceSignal = {
  kind: "evidence";
  level: "info" | "success" | "warning";
  title: string;
  detail: string;
  action: string;
};

export type FirstProofRuntimeSignal = FirstProofAnchorSignal | FirstProofEvidenceSignal;

export type FirstProofTransitionResult = {
  state: FirstProofState;
  signals: FirstProofRuntimeSignal[];
};

export type FirstProofStepModel = {
  key: FirstProofStepKey;
  status: FirstProofStepStatus;
  progress: number;
  label: string;
};

export type FirstProofSnapshot = {
  stage: FirstProofRitualStage;
  activeStep: FirstProofStepKey | "sealed";
  completed: boolean;
  pointerActive: boolean;

  dragProgress: number;
  holdProgress: number;
  releaseProgress: number;
  totalProgress: number;

  layerOffsetPx: number;
  layerReveal: number;
  compression: number;
  glowIntensity: number;

  dragDistancePx: number;
  dragDirectionRatio: number;
  holdElapsedMs: number;

  sealStatus: FirstProofSealStatus;
  releaseReady: boolean;
  releaseBlocked: boolean;
  steps: FirstProofStepModel[];
};

export type FirstProofStepCopy = {
  key: FirstProofStepKey;
  label: string;
  detail: string;
};

export type FirstProofReplayMetadata = {
  id: string;
  title: string;
  category: "happy" | "boundary" | "blocked" | "stress";
  expectedFinalStage: FirstProofRitualStage;
  expectedSealStatus: FirstProofSealStatus;
};

export type FirstProofReplayTrace = {
  metadata: FirstProofReplayMetadata;
  events: FirstProofMachineEvent[];
};

export type FirstProofReplayFrame = {
  index: number;
  event: FirstProofMachineEvent;
  state: FirstProofState;
  snapshot: FirstProofSnapshot;
  signals: FirstProofRuntimeSignal[];
};

export type FirstProofReplayResult = {
  metadata: FirstProofReplayMetadata;
  thresholds: FirstProofThresholds;
  initialState: FirstProofState;
  finalState: FirstProofState;
  finalSnapshot: FirstProofSnapshot;
  frames: FirstProofReplayFrame[];
  allSignals: FirstProofRuntimeSignal[];
};
