export type Slide13RitualStage = "Idle" | "Dragged" | "Holding" | "Sealed";

export type Slide13StepKey = "drag" | "hold" | "release";
export type Slide13StepStatus = "locked" | "active" | "complete";

export type Slide13SealState = "open" | "freezing" | "sealed" | "collapsed";

export type Slide13Point = {
  x: number;
  y: number;
};

export type Slide13Thresholds = {
  dragThresholdPx: number;
  maxDragTravelPx: number;
  holdTravelThresholdPx: number;
  dragResistance: number;
  holdGain: number;
  releaseSnapPx: number;
  freezeFloor: number;
  railStepCount: number;
};

export type Slide13State = {
  stage: Slide13RitualStage;
  pointerActive: boolean;
  activePointerId: number | null;
  originPoint: Slide13Point | null;
  pointerPoint: Slide13Point | null;
  dragRawPx: number;
  dragVisualPx: number;
  dragPeakPx: number;
  holdTravelPx: number;
  holdPeakPx: number;
  dragProgress: number;
  holdProgress: number;
  releaseProgress: number;
  railIndex: number;
  sealState: Slide13SealState;
  frozen: boolean;
  sealed: boolean;
  rightSealCollapsed: boolean;
};

export type Slide13MachineEvent =
  | { type: "pointer_down"; pointerId: number; x: number; y: number }
  | { type: "pointer_move"; pointerId: number; x: number; y: number }
  | { type: "pointer_up"; pointerId: number; x: number; y: number }
  | { type: "pointer_cancel"; pointerId: number; x: number; y: number }
  | { type: "reset" };

export type Slide13CanonicalEventName =
  | "slide:13:entered"
  | "gesture:slide13-drag:completed"
  | "gesture:slide13-hold:completed"
  | "gesture:slide13-release:completed"
  | "state:slide13-sealed:set"
  | "evidence:slide13-primary:satisfied";

export type Slide13CanonicalAnchorName =
  | "anchor:slide13-kpi-threshold:engaged"
  | "anchor:slide13-kpi-freeze:engaged"
  | "anchor:slide13-rightseal:engaged";

export type Slide13EmittedEvent = {
  name: Slide13CanonicalEventName | Slide13CanonicalAnchorName;
  detail: Record<string, unknown>;
};

export type Slide13TransitionResult = {
  state: Slide13State;
  emitted: Slide13EmittedEvent[];
};

export type Slide13StepModel = {
  key: Slide13StepKey;
  status: Slide13StepStatus;
  progress: number;
  label: string;
  note: string;
};

export type Slide13Snapshot = {
  stage: Slide13RitualStage;
  activeStep: Slide13StepKey | "sealed";
  completed: boolean;
  pointerActive: boolean;
  dragProgress: number;
  holdProgress: number;
  releaseProgress: number;
  totalProgress: number;
  thresholdTravelPx: number;
  thresholdNormalized: number;
  railIndex: number;
  railRatio: number;
  sealState: Slide13SealState;
  frozen: boolean;
  sealed: boolean;
  rightSealCollapsed: boolean;
  glow: number;
  compression: number;
  steps: Slide13StepModel[];
};

export type Slide13GestureHandlers = {
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
};

export type Slide13ReplayInputEvent = {
  id: string;
  machineEvent: Slide13MachineEvent;
};

export type Slide13ReplayFrame = {
  id: string;
  machineEvent: Slide13MachineEvent;
  state: Slide13State;
  snapshot: Slide13Snapshot;
  emitted: Slide13EmittedEvent[];
};

export type Slide13ReplayResult = {
  frames: Slide13ReplayFrame[];
  finalState: Slide13State;
  finalSnapshot: Slide13Snapshot;
  emitted: Slide13EmittedEvent[];
};

export type Slide13ReplayAssertion = {
  expectedStage: Slide13RitualStage;
  expectedSealState: Slide13SealState;
  expectedSealed: boolean;
  expectedRailIndex: number;
  dragProgressAtLeast: number;
  holdProgressAtLeast: number;
  releaseProgressAtLeast: number;
  requiredEventNames: Array<Slide13EmittedEvent["name"]>;
};

export type Slide13ReplayFixture = {
  id: string;
  title: string;
  description: string;
  thresholds?: Partial<Slide13Thresholds>;
  events: Slide13ReplayInputEvent[];
  assertion: Slide13ReplayAssertion;
};

export type Slide13CopyStep = {
  label: string;
  detail: string;
};

export type Slide13CopyPack = {
  ritualTitle: string;
  ritualSubtitle: string;
  railTitle: string;
  railSubtitle: string;
  sealTitle: string;
  sealOpen: string;
  sealFrozen: string;
  sealSealed: string;
  sealCollapsed: string;
  frozenBadge: string;
  releasedBadge: string;
  thresholdLabel: string;
  thresholdHint: string;
  debugTitle: string;
  debugHint: string;
  steps: Record<Slide13StepKey, Slide13CopyStep>;
};

export type Slide13DebugModel = {
  enabled: boolean;
  lastEvent: Slide13EmittedEvent | null;
  replayFrame: number;
};

export type Slide13FixtureCatalog = {
  version: string;
  generatedAt: string;
  fixtures: Slide13ReplayFixture[];
};
