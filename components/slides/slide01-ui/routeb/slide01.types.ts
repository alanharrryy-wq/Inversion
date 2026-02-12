export type Slide01StepKey = "drag" | "hold" | "release";
export type Slide01StepStatus = "locked" | "active" | "complete";

export type Slide01SealStatus =
  | "incomplete"
  | "intent-registered"
  | "responsibility-pending"
  | "evidence-accepted"
  | "sealed";

export type Slide01RitualStage =
  | "Idle"
  | "Dragging"
  | "DragReady"
  | "Holding"
  | "ReleaseReady"
  | "Sealed";

export type Slide01PointerPoint = {
  x: number;
  y: number;
};

export type Slide01Thresholds = {
  requiredFaults: number;
  dragMinimumTravelPx: number;
  holdRequiredMs: number;
  holdTickClampMs: number;
  scannerRadiusPx: number;
};

export type Slide01FaultCardSeverity = "critical" | "high";

export type Slide01FaultCardModel = {
  id: string;
  label: string;
  detail: string;
  severity: Slide01FaultCardSeverity;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type Slide01OperationalEventName =
  | "slide:01:entered"
  | `anchor:slide01-${string}:engaged`
  | "gesture:slide01-drag:completed"
  | "gesture:slide01-hold:completed"
  | "gesture:slide01-release:completed"
  | "state:slide01-sealed:set"
  | "evidence:slide01-primary:satisfied";

export type Slide01OperationalEvent = {
  id: string;
  name: Slide01OperationalEventName;
  timestampMs: number;
  payload?: Record<string, string | number | boolean>;
};

export type Slide01RitualState = {
  stage: Slide01RitualStage;
  entered: boolean;
  pointerActive: boolean;
  activePointerId: number | null;
  originPoint: Slide01PointerPoint | null;
  pointerPoint: Slide01PointerPoint | null;
  scannerPoint: Slide01PointerPoint;
  totalDragTravelPx: number;
  holdElapsedMs: number;
  engagedFaultIds: string[];
  completedEvents: Slide01OperationalEvent[];
  debug: {
    frameCount: number;
    lastDeltaMs: number;
  };
};

export type Slide01StepModel = {
  key: Slide01StepKey;
  status: Slide01StepStatus;
  progress: number;
};

export type Slide01RitualSnapshot = {
  stage: Slide01RitualStage;
  activeStep: Slide01StepKey | "sealed";
  completed: boolean;
  pointerActive: boolean;
  dragProgress: number;
  holdProgress: number;
  releaseProgress: number;
  totalProgress: number;
  sealStatus: Slide01SealStatus;
  engagedFaultIds: string[];
  steps: Slide01StepModel[];
  scannerPoint: Slide01PointerPoint;
  judgmentScore: number;
  eventNames: Slide01OperationalEventName[];
};

export type Slide01MachineEvent =
  | {
      type: "entered";
      timestampMs: number;
    }
  | {
      type: "pointer_down";
      pointerId: number;
      x: number;
      y: number;
      timestampMs: number;
    }
  | {
      type: "pointer_move";
      pointerId: number;
      x: number;
      y: number;
      timestampMs: number;
    }
  | {
      type: "pointer_up";
      pointerId: number;
      x: number;
      y: number;
      timestampMs: number;
    }
  | {
      type: "pointer_cancel";
      pointerId: number;
      x: number;
      y: number;
      timestampMs: number;
    }
  | {
      type: "hold_tick";
      deltaMs: number;
      timestampMs: number;
    }
  | {
      type: "reset";
      timestampMs: number;
    };

export type Slide01ReplayTraceEvent = Slide01MachineEvent;

export type Slide01TransitionResult = {
  state: Slide01RitualState;
  events: Slide01OperationalEvent[];
};

export type Slide01ReplayExpectation = {
  stage: Slide01RitualStage;
  sealStatus: Slide01SealStatus;
  completed: boolean;
  engagedFaultCount: number;
  totalProgressMin: number;
  requiredEventNames: Slide01OperationalEventName[];
};

export type Slide01ReplayFixture = {
  id: string;
  description: string;
  trace: Slide01ReplayTraceEvent[];
  expected: Slide01ReplayExpectation;
};

export type Slide01ReplayResult = {
  finalState: Slide01RitualState;
  snapshot: Slide01RitualSnapshot;
  emittedEvents: Slide01OperationalEvent[];
  normalizedTrace: Slide01ReplayTraceEvent[];
};
