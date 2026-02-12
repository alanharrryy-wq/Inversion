
import {
  Slide07DomainEvent,
  Slide07DomainEventName,
  Slide07GestureInputEvent,
  Slide07GraphNodeId,
  Slide07GraphSnapshotLink,
  Slide07GraphSnapshotNode,
  Slide07MarkerState,
  Slide07Snapshot,
  Slide07State,
  Slide07Thresholds,
  Slide07TransitionResult,
} from "./slide07.types";
import { getSlide07SealStateLabel } from "./slide07.copy";

export const SLIDE07_DEFAULT_THRESHOLDS: Slide07Thresholds = {
  dragThresholdPx: 184,
  maxDragTravelPx: 420,
  dragResistance: 0.36,
  holdThresholdMs: 820,
  holdTickCeilingMs: 120,
  releaseSnapPx: 236,
};

const BASE_GRAPH_NODES: ReadonlyArray<{
  id: Slide07GraphNodeId;
  label: string;
  role: Slide07GraphSnapshotNode["role"];
  x: number;
  y: number;
}> = [
  { id: "layer-intake", label: "Layer Intake", role: "input", x: 0.12, y: 0.26 },
  { id: "signal-clean", label: "Signal Clean", role: "logic", x: 0.33, y: 0.18 },
  { id: "risk-core", label: "Risk Core", role: "logic", x: 0.54, y: 0.34 },
  { id: "allocator", label: "Allocator", role: "output", x: 0.73, y: 0.22 },
  { id: "ops-seal", label: "Ops Seal", role: "seal", x: 0.88, y: 0.44 },
];

const BASE_GRAPH_LINKS: ReadonlyArray<{
  id: string;
  from: Slide07GraphNodeId;
  to: Slide07GraphNodeId;
}> = [
  { id: "link-intake-clean", from: "layer-intake", to: "signal-clean" },
  { id: "link-clean-core", from: "signal-clean", to: "risk-core" },
  { id: "link-core-allocator", from: "risk-core", to: "allocator" },
  { id: "link-allocator-seal", from: "allocator", to: "ops-seal" },
  { id: "link-clean-allocator", from: "signal-clean", to: "allocator" },
];

const INITIAL_MARKERS: Slide07MarkerState = {
  graphAnchorEngaged: false,
  dragCompleted: false,
  holdAnchorEngaged: false,
  holdCompleted: false,
  releaseCompleted: false,
  sealedStateSet: false,
  primaryEvidenceSet: false,
};

type Slide07MarkerKey = keyof Slide07MarkerState;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function appendRecentDomainEvent(
  source: Slide07DomainEventName[],
  name: Slide07DomainEventName
): Slide07DomainEventName[] {
  const next = source.slice(-11);
  next.push(name);
  return next;
}

function applyDragResistance(rawDragPx: number, thresholds: Slide07Thresholds): number {
  const raw = clamp(rawDragPx, 0, thresholds.maxDragTravelPx);
  if (raw <= thresholds.dragThresholdPx) {
    return raw;
  }
  const overshoot = raw - thresholds.dragThresholdPx;
  return thresholds.dragThresholdPx + overshoot * thresholds.dragResistance;
}

function makeDomainEvent(
  name: Slide07DomainEventName,
  note: string,
  atMs: number,
  payload?: Record<string, unknown>
): Slide07DomainEvent {
  return { name, note, atMs, payload };
}

function emitOnce(
  state: Slide07State,
  domainEvents: Slide07DomainEvent[],
  marker: Slide07MarkerKey,
  domainEvent: Slide07DomainEvent
): Slide07State {
  if (state.markers[marker]) {
    return state;
  }

  domainEvents.push(domainEvent);

  return {
    ...state,
    markers: {
      ...state.markers,
      [marker]: true,
    } as Slide07MarkerState,
    recentDomainEvents: appendRecentDomainEvent(state.recentDomainEvents, domainEvent.name),
  };
}

function withDerivedState(state: Slide07State, thresholds: Slide07Thresholds): Slide07State {
  const dragProgress = clamp(state.dragRawPx / thresholds.dragThresholdPx, 0, 1);
  const holdProgress = clamp(state.holdElapsedMs / thresholds.holdThresholdMs, 0, 1);

  const releaseProgress =
    state.stage === "sealed"
      ? 1
      : state.stage === "hold-complete"
        ? Math.max(state.releaseProgress, 0.82)
        : clamp(state.releaseProgress, 0, 0.72);

  const alignmentOffsetPx =
    state.stage === "sealed"
      ? thresholds.releaseSnapPx
      : clamp(state.dragVisualPx, 0, thresholds.releaseSnapPx);

  return {
    ...state,
    dragProgress,
    holdProgress,
    releaseProgress,
    alignmentOffsetPx,
    sealCollapsed: state.stage === "sealed",
  };
}

export function resolveSlide07Thresholds(overrides?: Partial<Slide07Thresholds>): Slide07Thresholds {
  if (!overrides) {
    return SLIDE07_DEFAULT_THRESHOLDS;
  }

  return {
    dragThresholdPx: clamp(
      overrides.dragThresholdPx ?? SLIDE07_DEFAULT_THRESHOLDS.dragThresholdPx,
      80,
      420
    ),
    maxDragTravelPx: clamp(
      overrides.maxDragTravelPx ?? SLIDE07_DEFAULT_THRESHOLDS.maxDragTravelPx,
      140,
      840
    ),
    dragResistance: clamp(
      overrides.dragResistance ?? SLIDE07_DEFAULT_THRESHOLDS.dragResistance,
      0.08,
      0.92
    ),
    holdThresholdMs: clamp(
      overrides.holdThresholdMs ?? SLIDE07_DEFAULT_THRESHOLDS.holdThresholdMs,
      280,
      2200
    ),
    holdTickCeilingMs: clamp(
      overrides.holdTickCeilingMs ?? SLIDE07_DEFAULT_THRESHOLDS.holdTickCeilingMs,
      16,
      240
    ),
    releaseSnapPx: clamp(
      overrides.releaseSnapPx ?? SLIDE07_DEFAULT_THRESHOLDS.releaseSnapPx,
      120,
      360
    ),
  };
}

export function createInitialSlide07State(
  thresholds: Slide07Thresholds = SLIDE07_DEFAULT_THRESHOLDS
): Slide07State {
  return withDerivedState(
    {
      stage: "idle",
      pointerActive: false,
      pointerId: null,
      originPoint: null,
      pointerPoint: null,
      dragRawPx: 0,
      dragVisualPx: 0,
      dragProgress: 0,
      holdElapsedMs: 0,
      holdProgress: 0,
      releaseProgress: 0,
      alignmentOffsetPx: 0,
      sealCollapsed: false,
      markers: { ...INITIAL_MARKERS },
      recentDomainEvents: [],
    },
    thresholds
  );
}

function handlePointerDown(
  state: Slide07State,
  machineEvent: Extract<Slide07GestureInputEvent, { type: "pointer_down" }>,
  thresholds: Slide07Thresholds
): Slide07TransitionResult {
  if (state.stage === "sealed" || state.pointerActive) {
    return { state, domainEvents: [] };
  }

  const nextState = withDerivedState(
    {
      ...state,
      pointerActive: true,
      pointerId: machineEvent.pointerId,
      originPoint: {
        x: machineEvent.x,
        y: machineEvent.y,
        nowMs: machineEvent.nowMs,
      },
      pointerPoint: {
        x: machineEvent.x,
        y: machineEvent.y,
        nowMs: machineEvent.nowMs,
      },
      stage: state.stage === "idle" ? "dragging" : state.stage,
    },
    thresholds
  );

  return { state: nextState, domainEvents: [] };
}

function handlePointerMove(
  state: Slide07State,
  machineEvent: Extract<Slide07GestureInputEvent, { type: "pointer_move" }>,
  thresholds: Slide07Thresholds
): Slide07TransitionResult {
  if (
    state.stage === "sealed" ||
    !state.pointerActive ||
    state.pointerId !== machineEvent.pointerId ||
    !state.originPoint
  ) {
    return { state, domainEvents: [] };
  }

  const rawDragPx = clamp(machineEvent.x - state.originPoint.x, 0, thresholds.maxDragTravelPx);
  const dragVisualPx = applyDragResistance(rawDragPx, thresholds);

  let nextStage = state.stage;
  if (nextStage === "idle" || nextStage === "dragging") {
    nextStage = rawDragPx > 0 ? "dragging" : nextStage;
  }

  let nextState = withDerivedState(
    {
      ...state,
      stage: nextStage,
      pointerPoint: {
        x: machineEvent.x,
        y: machineEvent.y,
        nowMs: machineEvent.nowMs,
      },
      dragRawPx: rawDragPx,
      dragVisualPx,
    },
    thresholds
  );

  const domainEvents: Slide07DomainEvent[] = [];

  if (nextState.dragProgress >= 1 && nextState.stage !== "hold-complete") {
    if (nextState.stage === "dragging" || nextState.stage === "idle") {
      nextState = withDerivedState(
        {
          ...nextState,
          stage: "drag-complete",
        },
        thresholds
      );
    }

    nextState = emitOnce(
      nextState,
      domainEvents,
      "graphAnchorEngaged",
      makeDomainEvent(
        "anchor:slide07-graph-link:engaged",
        "Primary graph link engaged.",
        machineEvent.nowMs,
        { dragProgress: nextState.dragProgress }
      )
    );

    nextState = emitOnce(
      nextState,
      domainEvents,
      "dragCompleted",
      makeDomainEvent(
        "gesture:slide07-drag:completed",
        "Drag threshold completed.",
        machineEvent.nowMs,
        { dragProgress: nextState.dragProgress }
      )
    );
  }

  return { state: nextState, domainEvents };
}

function handleHoldTick(
  state: Slide07State,
  machineEvent: Extract<Slide07GestureInputEvent, { type: "hold_tick" }>,
  thresholds: Slide07Thresholds
): Slide07TransitionResult {
  if (!state.pointerActive) {
    return { state, domainEvents: [] };
  }

  if (state.stage === "idle" || state.stage === "dragging" || state.stage === "sealed") {
    return { state, domainEvents: [] };
  }

  if (state.stage === "hold-complete") {
    return { state, domainEvents: [] };
  }

  const clampedDelta = clamp(machineEvent.deltaMs, 0, thresholds.holdTickCeilingMs);
  if (clampedDelta <= 0) {
    return { state, domainEvents: [] };
  }

  const holdElapsedMs = clamp(state.holdElapsedMs + clampedDelta, 0, thresholds.holdThresholdMs);

  const stage = holdElapsedMs >= thresholds.holdThresholdMs ? "hold-complete" : "holding";

  let nextState = withDerivedState(
    {
      ...state,
      stage,
      holdElapsedMs,
    },
    thresholds
  );

  const domainEvents: Slide07DomainEvent[] = [];

  if (holdElapsedMs > 0) {
    nextState = emitOnce(
      nextState,
      domainEvents,
      "holdAnchorEngaged",
      makeDomainEvent(
        "anchor:slide07-check-runner:engaged",
        "Deterministic check runner engaged.",
        machineEvent.nowMs,
        { holdElapsedMs }
      )
    );
  }

  if (stage === "hold-complete") {
    nextState = emitOnce(
      nextState,
      domainEvents,
      "holdCompleted",
      makeDomainEvent(
        "gesture:slide07-hold:completed",
        "Hold check completed.",
        machineEvent.nowMs,
        { holdProgress: nextState.holdProgress }
      )
    );
  }

  return { state: nextState, domainEvents };
}

function handlePointerRelease(
  state: Slide07State,
  machineEvent:
    | Extract<Slide07GestureInputEvent, { type: "pointer_up" }>
    | Extract<Slide07GestureInputEvent, { type: "pointer_cancel" }>,
  thresholds: Slide07Thresholds
): Slide07TransitionResult {
  if (!state.pointerActive || state.pointerId !== machineEvent.pointerId) {
    return { state, domainEvents: [] };
  }

  let nextState: Slide07State = {
    ...state,
    pointerActive: false,
    pointerId: null,
    originPoint: null,
    pointerPoint: {
      x: machineEvent.x,
      y: machineEvent.y,
      nowMs: machineEvent.nowMs,
    },
  };

  const domainEvents: Slide07DomainEvent[] = [];

  if (state.stage === "hold-complete") {
    nextState = withDerivedState(
      {
        ...nextState,
        stage: "sealed",
        releaseProgress: 1,
        dragRawPx: thresholds.dragThresholdPx,
        dragVisualPx: thresholds.releaseSnapPx,
      },
      thresholds
    );

    nextState = emitOnce(
      nextState,
      domainEvents,
      "releaseCompleted",
      makeDomainEvent(
        "gesture:slide07-release:completed",
        "Release confirmed after deterministic hold.",
        machineEvent.nowMs,
        { releaseProgress: 1 }
      )
    );

    nextState = emitOnce(
      nextState,
      domainEvents,
      "sealedStateSet",
      makeDomainEvent("state:slide07-sealed:set", "Slide07 seal state written.", machineEvent.nowMs)
    );

    nextState = emitOnce(
      nextState,
      domainEvents,
      "primaryEvidenceSet",
      makeDomainEvent(
        "evidence:slide07-primary:satisfied",
        "Primary evidence satisfied by sealed graph.",
        machineEvent.nowMs
      )
    );

    return { state: nextState, domainEvents };
  }

  if (state.stage === "drag-complete" || state.stage === "holding") {
    nextState = withDerivedState(
      {
        ...nextState,
        stage: "drag-complete",
        dragRawPx: Math.max(state.dragRawPx, thresholds.dragThresholdPx),
        dragVisualPx: Math.max(state.dragVisualPx * 0.86, thresholds.dragThresholdPx * 0.76),
        releaseProgress: Math.max(state.releaseProgress, 0.22),
      },
      thresholds
    );

    return { state: nextState, domainEvents };
  }

  nextState = withDerivedState(
    {
      ...nextState,
      stage: "idle",
      dragRawPx: 0,
      dragVisualPx: 0,
      holdElapsedMs: 0,
      releaseProgress: 0,
    },
    thresholds
  );

  return { state: nextState, domainEvents };
}

export function transitionSlide07State(
  state: Slide07State,
  machineEvent: Slide07GestureInputEvent,
  thresholds: Slide07Thresholds = SLIDE07_DEFAULT_THRESHOLDS
): Slide07TransitionResult {
  if (machineEvent.type === "reset") {
    return {
      state: createInitialSlide07State(thresholds),
      domainEvents: [],
    };
  }

  if (machineEvent.type === "pointer_down") {
    return handlePointerDown(state, machineEvent, thresholds);
  }

  if (machineEvent.type === "pointer_move") {
    return handlePointerMove(state, machineEvent, thresholds);
  }

  if (machineEvent.type === "hold_tick") {
    return handleHoldTick(state, machineEvent, thresholds);
  }

  if (machineEvent.type === "pointer_up" || machineEvent.type === "pointer_cancel") {
    return handlePointerRelease(state, machineEvent, thresholds);
  }

  return { state, domainEvents: [] };
}

function buildStepModels(state: Slide07State): Slide07Snapshot["steps"] {
  return [
    {
      key: "drag",
      status: state.dragProgress >= 1 ? "complete" : "active",
      progress: state.dragProgress,
    },
    {
      key: "hold",
      status: state.dragProgress < 1 ? "locked" : state.holdProgress >= 1 ? "complete" : "active",
      progress: state.holdProgress,
    },
    {
      key: "release",
      status: state.holdProgress < 1 ? "locked" : state.stage === "sealed" ? "complete" : "active",
      progress: state.stage === "sealed" ? 1 : state.holdProgress >= 1 ? 0.72 : 0,
    },
  ];
}

function buildGraphNodes(state: Slide07State, thresholds: Slide07Thresholds): Slide07GraphSnapshotNode[] {
  const alignmentNormalized = clamp(state.alignmentOffsetPx / thresholds.releaseSnapPx, 0, 1);

  return BASE_GRAPH_NODES.map((node, index) => {
    const spread = 0.02 + index * 0.006;
    const lockedX = 0.16 + index * 0.18;
    const lockedY = index % 2 === 0 ? 0.24 : 0.38;

    const x =
      state.stage === "sealed"
        ? clamp(lockedX, 0.06, 0.94)
        : clamp(node.x + alignmentNormalized * spread, 0.06, 0.94);

    const yDrift =
      state.stage === "sealed"
        ? (lockedY - node.y) * 0.64
        : (state.holdProgress - state.dragProgress * 0.35) * (index % 2 === 0 ? 0.016 : -0.014);

    const y = clamp(node.y + yDrift, 0.12, 0.88);

    return {
      id: node.id,
      label: node.label,
      role: node.role,
      x,
      y,
      linked: state.dragProgress >= 0.26 + index * 0.11,
      sealed: state.stage === "sealed",
    };
  });
}

function buildGraphLinks(nodes: Slide07GraphSnapshotNode[], state: Slide07State): Slide07GraphSnapshotLink[] {
  const nodeById: Record<Slide07GraphNodeId, Slide07GraphSnapshotNode> = Object.fromEntries(
    nodes.map((node) => [node.id, node])
  ) as Record<Slide07GraphNodeId, Slide07GraphSnapshotNode>;

  return BASE_GRAPH_LINKS.map((baseLink, index) => {
    const from = nodeById[baseLink.from];
    const to = nodeById[baseLink.to];

    const distance = Math.hypot((to.x - from.x) * 100, (to.y - from.y) * 100);
    const distancePenalty = clamp(distance / 120, 0, 0.24);

    const compositeStrength =
      state.stage === "sealed"
        ? 1
        : clamp(
            state.dragProgress * (0.62 + index * 0.08) +
              state.holdProgress * (0.3 + index * 0.06) -
              distancePenalty,
            0,
            0.99
          );

    return {
      id: baseLink.id,
      from: baseLink.from,
      to: baseLink.to,
      strength: compositeStrength,
      visible: compositeStrength > 0.04,
      locked: state.stage === "sealed",
    };
  });
}

export function deriveSlide07Snapshot(
  state: Slide07State,
  thresholds: Slide07Thresholds = SLIDE07_DEFAULT_THRESHOLDS
): Slide07Snapshot {
  const nodes = buildGraphNodes(state, thresholds);
  const links = buildGraphLinks(nodes, state);

  const releaseProgress = state.stage === "sealed" ? 1 : state.holdProgress >= 1 ? 0.72 : 0;
  const totalProgress =
    state.stage === "sealed"
      ? 1
      : clamp(state.dragProgress * 0.44 + state.holdProgress * 0.44 + releaseProgress * 0.12, 0, 0.98);

  const activeStep =
    state.stage === "sealed"
      ? "sealed"
      : state.holdProgress >= 1
        ? "release"
        : state.dragProgress >= 1
          ? "hold"
          : "drag";

  const eventCounter = Object.values(state.markers).filter(Boolean).length;

  return {
    stage: state.stage,
    activeStep,
    pointerActive: state.pointerActive,
    dragProgress: state.dragProgress,
    holdProgress: state.holdProgress,
    releaseProgress,
    totalProgress,
    rightSealCollapsed: state.sealCollapsed,
    sealStateLabel: getSlide07SealStateLabel(state.stage),
    deterministicCheckArmed: state.stage === "hold-complete" || state.stage === "sealed",
    primaryEvidenceSatisfied: state.stage === "sealed",
    eventCounter,
    recentDomainEvents: state.recentDomainEvents,
    steps: buildStepModels(state),
    nodes,
    links,
  };
}

export function hasSlide07PrimaryEvidenceSatisfied(snapshot: Slide07Snapshot): boolean {
  return snapshot.primaryEvidenceSatisfied;
}

export function buildSlide07EnteredEvent(atMs: number = Date.now()): Slide07DomainEvent {
  return makeDomainEvent("slide:07:entered", "Slide07 entered.", atMs, { slide: 7 });
}

export function formatPercent(value: number): string {
  return Math.round(clamp(value, 0, 1) * 100).toString() + "%";
}

