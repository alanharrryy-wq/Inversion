
import {
  Slide13EmittedEvent,
  Slide13MachineEvent,
  Slide13Snapshot,
  Slide13State,
  Slide13Thresholds,
  Slide13TransitionResult,
} from "./slide13.types";

export const SLIDE13_DEFAULT_THRESHOLDS: Slide13Thresholds = {
  dragThresholdPx: 164,
  maxDragTravelPx: 344,
  holdTravelThresholdPx: 232,
  dragResistance: 0.35,
  holdGain: 1,
  releaseSnapPx: 208,
  freezeFloor: 0.62,
  railStepCount: 8,
};

const STAGE_ORDER: Record<Slide13State["stage"], 0 | 1 | 2 | 3> = {
  Idle: 0,
  Dragged: 1,
  Holding: 2,
  Sealed: 3,
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function toRailIndex(value: number, stepCount: number): number {
  const safeSteps = Math.max(2, Math.floor(stepCount));
  const clamped = clamp(value, 0, 1);
  return clamp(Math.round(clamped * (safeSteps - 1)), 0, safeSteps - 1);
}

function applyDragResistance(rawTravelPx: number, thresholds: Slide13Thresholds): number {
  const clampedRaw = clamp(rawTravelPx, 0, thresholds.maxDragTravelPx);
  if (clampedRaw <= thresholds.dragThresholdPx) {
    return clampedRaw;
  }
  const overshoot = clampedRaw - thresholds.dragThresholdPx;
  return thresholds.dragThresholdPx + overshoot * thresholds.dragResistance;
}

function normalizeStage(
  currentStage: Slide13State["stage"],
  requestedStage: Slide13State["stage"]
): Slide13State["stage"] {
  return STAGE_ORDER[requestedStage] >= STAGE_ORDER[currentStage] ? requestedStage : currentStage;
}

function emitted(name: Slide13EmittedEvent["name"], detail: Record<string, unknown>): Slide13EmittedEvent {
  return { name, detail };
}

function deriveSealState(state: Slide13State): Slide13State["sealState"] {
  if (state.rightSealCollapsed) return "collapsed";
  if (state.sealed) return "sealed";
  if (state.stage === "Holding" || state.frozen) return "freezing";
  return "open";
}

function withDerivedValues(state: Slide13State, thresholds: Slide13Thresholds): Slide13State {
  const dragProgress = clamp(state.dragPeakPx / thresholds.dragThresholdPx, 0, 1);
  const holdProgress = clamp(state.holdPeakPx / thresholds.holdTravelThresholdPx, 0, 1);
  const releaseProgress = state.sealed
    ? 1
    : state.stage === "Holding"
      ? 0.56
      : state.stage === "Dragged"
        ? clamp(dragProgress * 0.18, 0, 0.34)
        : 0;
  const thresholdNormalized = clamp(dragProgress * 0.72 + holdProgress * 0.28, 0, 1);

  const next = {
    ...state,
    dragProgress,
    holdProgress,
    releaseProgress,
    railIndex: toRailIndex(thresholdNormalized, thresholds.railStepCount),
  };
  return {
    ...next,
    sealState: deriveSealState(next),
  };
}

export function resolveSlide13Thresholds(
  overrides?: Partial<Slide13Thresholds>
): Slide13Thresholds {
  if (!overrides) return SLIDE13_DEFAULT_THRESHOLDS;

  return {
    dragThresholdPx: clamp(
      overrides.dragThresholdPx ?? SLIDE13_DEFAULT_THRESHOLDS.dragThresholdPx,
      96,
      440
    ),
    maxDragTravelPx: clamp(
      overrides.maxDragTravelPx ?? SLIDE13_DEFAULT_THRESHOLDS.maxDragTravelPx,
      180,
      680
    ),
    holdTravelThresholdPx: clamp(
      overrides.holdTravelThresholdPx ?? SLIDE13_DEFAULT_THRESHOLDS.holdTravelThresholdPx,
      100,
      560
    ),
    dragResistance: clamp(
      overrides.dragResistance ?? SLIDE13_DEFAULT_THRESHOLDS.dragResistance,
      0.08,
      0.9
    ),
    holdGain: clamp(overrides.holdGain ?? SLIDE13_DEFAULT_THRESHOLDS.holdGain, 0.12, 3),
    releaseSnapPx: clamp(
      overrides.releaseSnapPx ?? SLIDE13_DEFAULT_THRESHOLDS.releaseSnapPx,
      112,
      420
    ),
    freezeFloor: clamp(overrides.freezeFloor ?? SLIDE13_DEFAULT_THRESHOLDS.freezeFloor, 0.2, 0.96),
    railStepCount: clamp(
      Math.round(overrides.railStepCount ?? SLIDE13_DEFAULT_THRESHOLDS.railStepCount),
      4,
      32
    ),
  };
}

export function createInitialSlide13State(
  thresholds: Slide13Thresholds = SLIDE13_DEFAULT_THRESHOLDS
): Slide13State {
  return withDerivedValues(
    {
      stage: "Idle",
      pointerActive: false,
      activePointerId: null,
      originPoint: null,
      pointerPoint: null,
      dragRawPx: 0,
      dragVisualPx: 0,
      dragPeakPx: 0,
      holdTravelPx: 0,
      holdPeakPx: 0,
      dragProgress: 0,
      holdProgress: 0,
      releaseProgress: 0,
      railIndex: 0,
      sealState: "open",
      frozen: false,
      sealed: false,
      rightSealCollapsed: false,
    },
    thresholds
  );
}

function shouldIgnorePointerEvent(state: Slide13State, machinePointerId: number): boolean {
  return (
    state.sealed ||
    !state.pointerActive ||
    state.activePointerId !== machinePointerId ||
    !state.originPoint ||
    !state.pointerPoint
  );
}

function handlePointerDown(
  state: Slide13State,
  pointerId: number,
  x: number,
  y: number,
  thresholds: Slide13Thresholds
): Slide13TransitionResult {
  if (state.sealed || state.pointerActive) {
    return { state, emitted: [] };
  }

  const nextState = withDerivedValues(
    {
      ...state,
      pointerActive: true,
      activePointerId: pointerId,
      originPoint: { x, y },
      pointerPoint: { x, y },
    },
    thresholds
  );

  return {
    state: nextState,
    emitted: [],
  };
}

function handlePointerMove(
  state: Slide13State,
  pointerId: number,
  x: number,
  y: number,
  thresholds: Slide13Thresholds
): Slide13TransitionResult {
  if (shouldIgnorePointerEvent(state, pointerId)) {
    return { state, emitted: [] };
  }

  const nextPoint = { x, y };
  const rawDrag = clamp(nextPoint.x - (state.originPoint as Point).x, 0, thresholds.maxDragTravelPx);
  const dragPeakPx = Math.max(state.dragPeakPx, rawDrag);
  const dragVisualPx = applyDragResistance(rawDrag, thresholds);
  const incrementalTravel = distance(state.pointerPoint as Point, nextPoint);

  let holdTravelPx = state.holdTravelPx;
  const crossedDragThreshold = state.stage === "Idle" && dragPeakPx >= thresholds.dragThresholdPx;
  if (state.stage === "Dragged" || state.stage === "Holding" || crossedDragThreshold) {
    holdTravelPx = clamp(
      state.holdTravelPx + incrementalTravel * thresholds.holdGain,
      0,
      thresholds.holdTravelThresholdPx
    );
  }

  const holdPeakPx = Math.max(state.holdPeakPx, holdTravelPx);
  let nextStage = state.stage;
  const nextEvents: Slide13TransitionResult["emitted"] = [];

  if (crossedDragThreshold) {
    nextStage = normalizeStage(nextStage, "Dragged");
    nextEvents.push(
      emitted("anchor:slide13-kpi-threshold:engaged", {
        dragPeakPx,
        thresholdPx: thresholds.dragThresholdPx,
      }),
      emitted("gesture:slide13-drag:completed", {
        dragPeakPx,
        dragProgress: clamp(dragPeakPx / thresholds.dragThresholdPx, 0, 1),
      })
    );
  }

  if (
    (nextStage === "Dragged" || nextStage === "Holding") &&
    holdPeakPx >= thresholds.holdTravelThresholdPx
  ) {
    if (nextStage !== "Holding") {
      nextStage = normalizeStage(nextStage, "Holding");
      nextEvents.push(
        emitted("anchor:slide13-kpi-freeze:engaged", {
          holdPeakPx,
          holdThresholdPx: thresholds.holdTravelThresholdPx,
        }),
        emitted("gesture:slide13-hold:completed", {
          holdPeakPx,
          holdProgress: clamp(holdPeakPx / thresholds.holdTravelThresholdPx, 0, 1),
        })
      );
    }
  }

  const nextState = withDerivedValues(
    {
      ...state,
      stage: nextStage,
      pointerPoint: nextPoint,
      dragRawPx: rawDrag,
      dragVisualPx,
      dragPeakPx,
      holdTravelPx,
      holdPeakPx,
      frozen:
        state.frozen ||
        nextStage === "Holding" ||
        clamp(holdPeakPx / thresholds.holdTravelThresholdPx, 0, 1) >= thresholds.freezeFloor,
    },
    thresholds
  );

  return {
    state: nextState,
    emitted: nextEvents,
  };
}

function handlePointerRelease(
  state: Slide13State,
  pointerId: number,
  x: number,
  y: number,
  thresholds: Slide13Thresholds
): Slide13TransitionResult {
  if (!state.pointerActive || state.activePointerId !== pointerId) {
    return { state, emitted: [] };
  }

  const nextEvents: Slide13TransitionResult["emitted"] = [];
  let nextStage = state.stage;
  let nextDragRawPx = 0;
  let nextDragVisualPx = state.dragVisualPx;
  let nextSealed = state.sealed;
  let nextCollapsed = state.rightSealCollapsed;
  let nextFrozen = state.frozen;

  if (state.stage === "Holding" && state.holdProgress >= 1) {
    nextStage = normalizeStage(state.stage, "Sealed");
    nextDragRawPx = thresholds.dragThresholdPx;
    nextDragVisualPx = thresholds.releaseSnapPx;
    nextSealed = true;
    nextCollapsed = true;
    nextFrozen = true;
    nextEvents.push(
      emitted("anchor:slide13-rightseal:engaged", {
        releaseAtX: x,
        releaseAtY: y,
        seal: true,
      }),
      emitted("gesture:slide13-release:completed", {
        releaseProgress: 1,
        releaseSnapPx: thresholds.releaseSnapPx,
      }),
      emitted("state:slide13-sealed:set", {
        stage: "Sealed",
        sealState: "collapsed",
      }),
      emitted("evidence:slide13-primary:satisfied", {
        sealed: true,
        completed: true,
      })
    );
  } else if (state.stage === "Dragged") {
    nextDragVisualPx = Math.max(thresholds.dragThresholdPx * 0.58, state.dragVisualPx * 0.64);
    nextDragRawPx = clamp(state.dragRawPx * 0.56, 0, thresholds.dragThresholdPx);
    nextFrozen = state.holdProgress >= thresholds.freezeFloor;
  } else {
    nextDragVisualPx = 0;
    nextDragRawPx = 0;
    nextFrozen = false;
  }

  const nextState = withDerivedValues(
    {
      ...state,
      stage: nextStage,
      pointerActive: false,
      activePointerId: null,
      originPoint: null,
      pointerPoint: { x, y },
      dragRawPx: nextDragRawPx,
      dragVisualPx: nextDragVisualPx,
      sealed: nextSealed,
      rightSealCollapsed: nextCollapsed,
      frozen: nextFrozen,
    },
    thresholds
  );

  return { state: nextState, emitted: nextEvents };
}

export function transitionSlide13State(
  state: Slide13State,
  machineEvent: Slide13MachineEvent,
  thresholds: Slide13Thresholds = SLIDE13_DEFAULT_THRESHOLDS
): Slide13TransitionResult {
  if (machineEvent.type === "reset") {
    return {
      state: createInitialSlide13State(thresholds),
      emitted: [],
    };
  }

  if (machineEvent.type === "pointer_down") {
    return handlePointerDown(
      state,
      machineEvent.pointerId,
      machineEvent.x,
      machineEvent.y,
      thresholds
    );
  }

  if (machineEvent.type === "pointer_move") {
    return handlePointerMove(
      state,
      machineEvent.pointerId,
      machineEvent.x,
      machineEvent.y,
      thresholds
    );
  }

  if (machineEvent.type === "pointer_up" || machineEvent.type === "pointer_cancel") {
    return handlePointerRelease(
      state,
      machineEvent.pointerId,
      machineEvent.x,
      machineEvent.y,
      thresholds
    );
  }

  return { state, emitted: [] };
}

function deriveActiveStep(state: Slide13State): Slide13Snapshot["activeStep"] {
  if (state.sealed) return "sealed";
  if (state.stage === "Holding") return "release";
  if (state.stage === "Dragged") return "hold";
  return "drag";
}

function deriveTotalProgress(state: Slide13State): number {
  if (state.sealed) return 1;
  return clamp(
    state.dragProgress * 0.46 + state.holdProgress * 0.44 + state.releaseProgress * 0.1,
    0,
    0.96
  );
}

function deriveCompression(state: Slide13State): number {
  if (state.sealed) return 1;
  if (state.stage === "Holding") return clamp(0.52 + state.holdProgress * 0.48, 0, 0.96);
  if (state.stage === "Dragged") return clamp(0.18 + state.dragProgress * 0.36, 0, 0.6);
  return 0.06;
}

function deriveGlow(state: Slide13State): number {
  if (state.sealed) return 1;
  return clamp(0.2 + state.dragProgress * 0.34 + state.holdProgress * 0.46, 0.2, 0.92);
}

export function deriveSlide13Snapshot(
  state: Slide13State,
  thresholds: Slide13Thresholds = SLIDE13_DEFAULT_THRESHOLDS
): Slide13Snapshot {
  const activeStep = deriveActiveStep(state);
  const railRatio = thresholds.railStepCount > 1
    ? state.railIndex / (thresholds.railStepCount - 1)
    : 0;

  return {
    stage: state.stage,
    activeStep,
    completed: state.sealed,
    pointerActive: state.pointerActive,
    dragProgress: state.dragProgress,
    holdProgress: state.holdProgress,
    releaseProgress: state.releaseProgress,
    totalProgress: deriveTotalProgress(state),
    thresholdTravelPx: state.dragVisualPx,
    thresholdNormalized: clamp(state.dragProgress * 0.72 + state.holdProgress * 0.28, 0, 1),
    railIndex: state.railIndex,
    railRatio,
    sealState: state.sealState,
    frozen: state.frozen,
    sealed: state.sealed,
    rightSealCollapsed: state.rightSealCollapsed,
    glow: deriveGlow(state),
    compression: deriveCompression(state),
    steps: [
      {
        key: "drag",
        status: state.dragProgress >= 1 ? "complete" : "active",
        progress: state.dragProgress,
        label: "Drag KPI Threshold",
        note: "Mueve el marcador hasta el umbral operativo.",
      },
      {
        key: "hold",
        status: state.dragProgress < 1 ? "locked" : state.holdProgress >= 1 ? "complete" : "active",
        progress: state.holdProgress,
        label: "Hold Freeze",
        note: "Sostén presión para congelar el reporte.",
      },
      {
        key: "release",
        status: state.holdProgress < 1 ? "locked" : state.sealed ? "complete" : "active",
        progress: state.releaseProgress,
        label: "Release Seal",
        note: "Suelta para sellar y colapsar el RightSeal.",
      },
    ],
  };
}

export function collectSlide13EventNames(events: Slide13EmittedEvent[]): string[] {
  return events.map((event) => event.name);
}

export function isSlide13Sealed(
  state: Slide13State,
  snapshot: Slide13Snapshot
): boolean {
  return state.sealed && snapshot.completed && snapshot.rightSealCollapsed;
}

