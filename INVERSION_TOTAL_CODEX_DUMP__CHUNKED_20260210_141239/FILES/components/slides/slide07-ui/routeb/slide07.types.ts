
export type Slide07RitualStage =
  | "idle"
  | "dragging"
  | "drag-complete"
  | "holding"
  | "hold-complete"
  | "sealed";

export type Slide07StepKey = "drag" | "hold" | "release";
export type Slide07StepStatus = "locked" | "active" | "complete";
export type Slide07CanonicalProfile = "legacy" | "speed";

export type Slide07GraphNodeId =
  | "layer-intake"
  | "signal-clean"
  | "risk-core"
  | "allocator"
  | "ops-seal";

export type Slide07GraphNodeRole = "input" | "logic" | "output" | "seal";

export type Slide07DomainEventName =
  | "slide:07:entered"
  | "state:slide07-sealed:set"
  | "evidence:slide07-primary:satisfied"
  | "gesture:slide07-drag:completed"
  | "gesture:slide07-hold:completed"
  | "gesture:slide07-release:completed"
  | `anchor:slide07-${string}:engaged`;

export type Slide07Thresholds = {
  dragThresholdPx: number;
  maxDragTravelPx: number;
  dragResistance: number;
  holdThresholdMs: number;
  holdTickCeilingMs: number;
  releaseSnapPx: number;
};

export type Slide07PointerPoint = {
  x: number;
  y: number;
  nowMs: number;
};

export type Slide07MarkerState = {
  graphAnchorEngaged: boolean;
  dragCompleted: boolean;
  holdAnchorEngaged: boolean;
  holdCompleted: boolean;
  releaseCompleted: boolean;
  sealedStateSet: boolean;
  primaryEvidenceSet: boolean;
};

export type Slide07State = {
  stage: Slide07RitualStage;
  pointerActive: boolean;
  pointerId: number | null;
  originPoint: Slide07PointerPoint | null;
  pointerPoint: Slide07PointerPoint | null;
  dragRawPx: number;
  dragVisualPx: number;
  dragProgress: number;
  holdElapsedMs: number;
  holdProgress: number;
  releaseProgress: number;
  alignmentOffsetPx: number;
  sealCollapsed: boolean;
  markers: Slide07MarkerState;
  recentDomainEvents: Slide07DomainEventName[];
};

export type Slide07DomainEvent = {
  name: Slide07DomainEventName;
  note: string;
  atMs: number;
  payload?: Record<string, unknown>;
};

export type Slide07TransitionResult = {
  state: Slide07State;
  domainEvents: Slide07DomainEvent[];
};

export type Slide07GestureInputEvent =
  | { type: "pointer_down"; pointerId: number; x: number; y: number; nowMs: number }
  | { type: "pointer_move"; pointerId: number; x: number; y: number; nowMs: number }
  | { type: "pointer_up"; pointerId: number; x: number; y: number; nowMs: number }
  | { type: "pointer_cancel"; pointerId: number; x: number; y: number; nowMs: number }
  | { type: "hold_tick"; deltaMs: number; nowMs: number }
  | { type: "reset"; nowMs: number };

export type Slide07StepModel = {
  key: Slide07StepKey;
  status: Slide07StepStatus;
  progress: number;
};

export type Slide07GraphSnapshotNode = {
  id: Slide07GraphNodeId;
  label: string;
  role: Slide07GraphNodeRole;
  x: number;
  y: number;
  linked: boolean;
  sealed: boolean;
};

export type Slide07GraphSnapshotLink = {
  id: string;
  from: Slide07GraphNodeId;
  to: Slide07GraphNodeId;
  strength: number;
  visible: boolean;
  locked: boolean;
};

export type Slide07Snapshot = {
  stage: Slide07RitualStage;
  activeStep: Slide07StepKey | "sealed";
  pointerActive: boolean;
  dragProgress: number;
  holdProgress: number;
  releaseProgress: number;
  totalProgress: number;
  rightSealCollapsed: boolean;
  sealStateLabel: string;
  deterministicCheckArmed: boolean;
  primaryEvidenceSatisfied: boolean;
  eventCounter: number;
  recentDomainEvents: Slide07DomainEventName[];
  steps: Slide07StepModel[];
  nodes: Slide07GraphSnapshotNode[];
  links: Slide07GraphSnapshotLink[];
};

export type Slide07ReplayScript = Slide07GestureInputEvent[];

export type Slide07ReplayResult = {
  state: Slide07State;
  snapshot: Slide07Snapshot;
  domainEvents: Slide07DomainEvent[];
};

export type Slide07ReplayFixture = {
  id: string;
  label: string;
  summary: string;
  expectedStage: Slide07RitualStage;
  expectedEvidenceSatisfied: boolean;
  expectedEvents: Slide07DomainEventName[];
  script: Slide07ReplayScript;
};

export type Slide07FixtureReplayAssertion = {
  fixtureId: string;
  passedStage: boolean;
  passedEvidence: boolean;
  passedEvents: boolean;
  replay: Slide07ReplayResult;
};

