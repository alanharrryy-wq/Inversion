
import {
  FirstProofMachineEvent,
  FirstProofRuntimeSignal,
  FirstProofSnapshot,
  FirstProofState,
  FirstProofThresholds,
  FirstProofTransitionResult,
} from "./firstProof.types";

export const FIRST_PROOF_DEFAULT_THRESHOLDS: FirstProofThresholds = {
  dragThresholdPx: 180,
  dragMaxTravelPx: 420,
  dragDirectionRatio: 0.78,
  holdDurationMs: 1100,
  holdTickClampMs: 48,
  releaseSnapPx: 212,
};

type StageOrder = Record<FirstProofState["stage"], number>;

const STAGE_ORDER: StageOrder = {
  "idle": 0,
  "dragging": 1,
  "drag-satisfied": 2,
  "holding": 3,
  "hold-satisfied": 4,
  "sealed": 5,
};

const DRAG_THRESHOLD_ANCHOR = "slide00:firstproof:drag-threshold";
const HOLD_THRESHOLD_ANCHOR = "slide00:firstproof:hold-threshold";
const RELEASE_BLOCKED_ANCHOR = "slide00:firstproof:release-blocked";
const SEALED_ANCHOR = "slide00:firstproof:sealed";

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function round(value: number, digits = 4): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function normalizeStage(currentStage: FirstProofState["stage"], nextStage: FirstProofState["stage"]): FirstProofState["stage"] {
  return STAGE_ORDER[nextStage] >= STAGE_ORDER[currentStage] ? nextStage : currentStage;
}

function anchor(anchorId: string, note: string): FirstProofRuntimeSignal {
  return {
    kind: "anchor",
    anchorId,
    note,
  };
}

function evidence(
  level: "info" | "success" | "warning",
  title: string,
  detail: string,
  action: string
): FirstProofRuntimeSignal {
  return {
    kind: "evidence",
    level,
    title,
    detail,
    action,
  };
}

function emitDragSatisfiedSignals(state: FirstProofState): FirstProofRuntimeSignal[] {
  return [
    anchor(
      DRAG_THRESHOLD_ANCHOR,
      `Drag threshold reached at ${Math.round(state.dragDistancePx)}px with ratio ${state.dragDirectionRatio.toFixed(2)}`
    ),
    evidence(
      "info",
      "First Proof drag accepted",
      `Distance ${Math.round(state.dragDistancePx)}px and direction ratio ${state.dragDirectionRatio.toFixed(2)} passed deterministic guard.`,
      "slide00:firstproof:drag:accepted"
    ),
  ];
}

function emitHoldSatisfiedSignals(state: FirstProofState): FirstProofRuntimeSignal[] {
  return [
    anchor(
      HOLD_THRESHOLD_ANCHOR,
      `Hold threshold reached at ${Math.round(state.holdElapsedMs)}ms`
    ),
    evidence(
      "info",
      "First Proof pressure validated",
      `Hold duration ${Math.round(state.holdElapsedMs)}ms reached operator persistence threshold.`,
      "slide00:firstproof:hold:accepted"
    ),
  ];
}

function emitReleaseBlockedSignals(state: FirstProofState): FirstProofRuntimeSignal[] {
  return [
    anchor(
      RELEASE_BLOCKED_ANCHOR,
      `Release blocked: drag=${state.dragThresholdReached ? "ok" : "missing"}, hold=${state.holdThresholdReached ? "ok" : "missing"}`
    ),
    evidence(
      "warning",
      "First Proof release rejected",
      "Release was attempted without satisfying deterministic drag and hold thresholds.",
      "slide00:firstproof:release:blocked"
    ),
  ];
}

function emitSealedSignals(): FirstProofRuntimeSignal[] {
  return [
    anchor(SEALED_ANCHOR, "First Proof ritual sealed"),
    evidence(
      "success",
      "First Proof sealed",
      "Drag threshold, hold persistence, and release were satisfied in deterministic order.",
      "slide00:firstproof:sealed"
    ),
  ];
}

export function resolveFirstProofThresholds(overrides?: Partial<FirstProofThresholds>): FirstProofThresholds {
  if (!overrides) {
    return FIRST_PROOF_DEFAULT_THRESHOLDS;
  }

  const dragThresholdPx = clamp(
    overrides.dragThresholdPx ?? FIRST_PROOF_DEFAULT_THRESHOLDS.dragThresholdPx,
    72,
    560
  );

  const dragMaxTravelPx = clamp(
    overrides.dragMaxTravelPx ?? FIRST_PROOF_DEFAULT_THRESHOLDS.dragMaxTravelPx,
    dragThresholdPx,
    920
  );

  return {
    dragThresholdPx,
    dragMaxTravelPx,
    dragDirectionRatio: clamp(
      overrides.dragDirectionRatio ?? FIRST_PROOF_DEFAULT_THRESHOLDS.dragDirectionRatio,
      0.4,
      0.98
    ),
    holdDurationMs: clamp(
      overrides.holdDurationMs ?? FIRST_PROOF_DEFAULT_THRESHOLDS.holdDurationMs,
      240,
      6000
    ),
    holdTickClampMs: clamp(
      overrides.holdTickClampMs ?? FIRST_PROOF_DEFAULT_THRESHOLDS.holdTickClampMs,
      8,
      80
    ),
    releaseSnapPx: clamp(
      overrides.releaseSnapPx ?? FIRST_PROOF_DEFAULT_THRESHOLDS.releaseSnapPx,
      88,
      460
    ),
  };
}

export function createInitialFirstProofState(): FirstProofState {
  return {
    stage: "idle",
    pointerActive: false,
    activePointerId: null,
    originPoint: null,
    pointerPoint: null,

    dragDistancePx: 0,
    dragDxPx: 0,
    dragDyPx: 0,
    dragDirectionRatio: 0,
    dragDirectionValid: false,
    dragThresholdReached: false,

    holdElapsedMs: 0,
    holdTickCount: 0,
    holdThresholdReached: false,

    releaseAttempted: false,
    releaseBlocked: false,
    releaseCommitted: false,
  };
}

function withPointerReleased(state: FirstProofState, x: number, y: number): FirstProofState {
  return {
    ...state,
    pointerActive: false,
    activePointerId: null,
    pointerPoint: { x, y },
    originPoint: null,
  };
}

function updateDragMetrics(
  state: FirstProofState,
  x: number,
  y: number,
  thresholds: FirstProofThresholds
): FirstProofState {
  if (!state.originPoint) {
    return state;
  }

  const rawDx = x - state.originPoint.x;
  const rawDy = y - state.originPoint.y;
  const dx = clamp(rawDx, 0, thresholds.dragMaxTravelPx);
  const dy = rawDy;
  const denominator = Math.abs(dx) + Math.abs(dy);
  const directionRatio = denominator === 0 ? 0 : clamp(dx / denominator, 0, 1);
  const directionValid = state.dragDirectionValid || directionRatio >= thresholds.dragDirectionRatio;
  const dragDistancePx = Math.max(state.dragDistancePx, dx);
  const dragThresholdReached =
    state.dragThresholdReached ||
    (dragDistancePx >= thresholds.dragThresholdPx && directionValid);

  return {
    ...state,
    dragDxPx: round(dx),
    dragDyPx: round(dy),
    dragDistancePx: round(dragDistancePx),
    dragDirectionRatio: round(Math.max(state.dragDirectionRatio, directionRatio)),
    dragDirectionValid: directionValid,
    dragThresholdReached,
    pointerPoint: { x, y },
  };
}

function resolveStage(state: FirstProofState): FirstProofState["stage"] {
  if (state.releaseCommitted) {
    return "sealed";
  }

  if (state.holdThresholdReached) {
    return "hold-satisfied";
  }

  if (state.dragThresholdReached && state.pointerActive) {
    return "holding";
  }

  if (state.dragThresholdReached) {
    return "drag-satisfied";
  }

  if (state.dragDistancePx > 0 && state.pointerActive) {
    return "dragging";
  }

  return "idle";
}

function handlePointerDown(
  state: FirstProofState,
  machineEvent: Extract<FirstProofMachineEvent, { type: "pointer_down" }>
): FirstProofTransitionResult {
  if (state.stage === "sealed") {
    return { state, signals: [] };
  }

  if (state.pointerActive) {
    return { state, signals: [] };
  }

  const nextState: FirstProofState = {
    ...state,
    pointerActive: true,
    activePointerId: machineEvent.pointerId,
    originPoint: { x: machineEvent.x, y: machineEvent.y },
    pointerPoint: { x: machineEvent.x, y: machineEvent.y },
    releaseBlocked: false,
  };

  return {
    state: {
      ...nextState,
      stage: resolveStage(nextState),
    },
    signals: [],
  };
}

function handlePointerMove(
  state: FirstProofState,
  machineEvent: Extract<FirstProofMachineEvent, { type: "pointer_move" }>,
  thresholds: FirstProofThresholds
): FirstProofTransitionResult {
  if (state.stage === "sealed") {
    return { state, signals: [] };
  }

  if (!state.pointerActive || state.activePointerId !== machineEvent.pointerId) {
    return { state, signals: [] };
  }

  const previousDragSatisfied = state.dragThresholdReached;
  const nextWithMetrics = updateDragMetrics(state, machineEvent.x, machineEvent.y, thresholds);
  const nextState = {
    ...nextWithMetrics,
    stage: normalizeStage(state.stage, resolveStage(nextWithMetrics)),
  };

  const signals =
    !previousDragSatisfied && nextState.dragThresholdReached
      ? emitDragSatisfiedSignals(nextState)
      : [];

  return { state: nextState, signals };
}

function handleHoldTick(
  state: FirstProofState,
  machineEvent: Extract<FirstProofMachineEvent, { type: "hold_tick" }>,
  thresholds: FirstProofThresholds
): FirstProofTransitionResult {
  if (state.stage === "sealed") {
    return { state, signals: [] };
  }

  if (!state.pointerActive || state.activePointerId !== machineEvent.pointerId) {
    return { state, signals: [] };
  }

  if (!state.dragThresholdReached) {
    return { state, signals: [] };
  }

  const boundedDelta = clamp(machineEvent.deltaMs, 0, thresholds.holdTickClampMs);
  if (boundedDelta <= 0) {
    return { state, signals: [] };
  }

  const previousHoldSatisfied = state.holdThresholdReached;
  const holdElapsedMs = clamp(
    state.holdElapsedMs + boundedDelta,
    0,
    thresholds.holdDurationMs
  );

  const holdThresholdReached = previousHoldSatisfied || holdElapsedMs >= thresholds.holdDurationMs;

  const nextState: FirstProofState = {
    ...state,
    holdElapsedMs: round(holdElapsedMs, 3),
    holdTickCount: state.holdTickCount + 1,
    holdThresholdReached,
  };

  const stageResolved = {
    ...nextState,
    stage: normalizeStage(state.stage, resolveStage(nextState)),
  };

  return {
    state: stageResolved,
    signals: !previousHoldSatisfied && stageResolved.holdThresholdReached
      ? emitHoldSatisfiedSignals(stageResolved)
      : [],
  };
}

function handlePointerRelease(
  state: FirstProofState,
  machineEvent: Extract<FirstProofMachineEvent, { type: "pointer_up" | "pointer_cancel" }>
): FirstProofTransitionResult {
  if (!state.pointerActive || state.activePointerId !== machineEvent.pointerId) {
    return { state, signals: [] };
  }

  const releaseAttemptState: FirstProofState = {
    ...state,
    releaseAttempted: true,
  };

  const canSeal = releaseAttemptState.dragThresholdReached && releaseAttemptState.holdThresholdReached;

  if (!canSeal) {
    const blockedState: FirstProofState = {
      ...withPointerReleased(releaseAttemptState, machineEvent.x, machineEvent.y),
      releaseBlocked: true,
      releaseCommitted: false,
      stage: resolveStage({
        ...releaseAttemptState,
        pointerActive: false,
      }),
    };

    return {
      state: blockedState,
      signals: emitReleaseBlockedSignals(blockedState),
    };
  }

  const sealedState: FirstProofState = {
    ...withPointerReleased(releaseAttemptState, machineEvent.x, machineEvent.y),
    releaseBlocked: false,
    releaseCommitted: true,
    stage: "sealed",
  };

  return {
    state: sealedState,
    signals: emitSealedSignals(),
  };
}

export function transitionFirstProofState(
  state: FirstProofState,
  machineEvent: FirstProofMachineEvent,
  thresholds: FirstProofThresholds = FIRST_PROOF_DEFAULT_THRESHOLDS
): FirstProofTransitionResult {
  if (machineEvent.type === "reset") {
    return {
      state: createInitialFirstProofState(),
      signals: [
        evidence(
          "info",
          "First Proof reset",
          "Local gesture state was reset by operator request.",
          "slide00:firstproof:reset"
        ),
      ],
    };
  }

  if (machineEvent.type === "pointer_down") {
    return handlePointerDown(state, machineEvent);
  }

  if (machineEvent.type === "pointer_move") {
    return handlePointerMove(state, machineEvent, thresholds);
  }

  if (machineEvent.type === "hold_tick") {
    return handleHoldTick(state, machineEvent, thresholds);
  }

  return handlePointerRelease(state, machineEvent);
}

function deriveSealStatus(state: FirstProofState): FirstProofSnapshot["sealStatus"] {
  if (state.releaseCommitted) {
    return "sealed";
  }
  if (state.holdThresholdReached) {
    return "system-armed";
  }
  if (state.dragThresholdReached && state.holdElapsedMs > 260) {
    return "responsibility-pending";
  }
  if (state.dragThresholdReached) {
    return "intent-registered";
  }
  return "incomplete";
}

export function deriveFirstProofSnapshot(
  state: FirstProofState,
  thresholds: FirstProofThresholds = FIRST_PROOF_DEFAULT_THRESHOLDS
): FirstProofSnapshot {
  const dragProgress = clamp(state.dragDistancePx / thresholds.dragThresholdPx, 0, 1);
  const holdProgress = clamp(state.holdElapsedMs / thresholds.holdDurationMs, 0, 1);
  const releaseProgress = state.releaseCommitted
    ? 1
    : state.holdThresholdReached
      ? 0.82
      : state.releaseAttempted
        ? 0.14
        : 0;

  const totalProgress = state.releaseCommitted
    ? 1
    : clamp(
        dragProgress * 0.42 + holdProgress * 0.44 + releaseProgress * 0.14,
        0,
        0.98
      );

  const layerOffsetPx = state.releaseCommitted
    ? thresholds.releaseSnapPx
    : clamp(state.dragDistancePx * 0.82 + holdProgress * 36, 0, thresholds.releaseSnapPx * 0.94);

  const layerReveal = clamp(dragProgress * 0.68 + holdProgress * 0.32, 0, 1);
  const compression = state.releaseCommitted ? 1 : holdProgress;
  const glowIntensity = state.releaseCommitted
    ? 1
    : clamp(0.2 + dragProgress * 0.22 + holdProgress * 0.58, 0.2, 0.95);

  const activeStep = state.releaseCommitted
    ? "sealed"
    : !state.dragThresholdReached
      ? "drag"
      : !state.holdThresholdReached
        ? "hold"
        : "release";

  const dragStatus = state.dragThresholdReached ? "complete" : "active";
  const holdStatus = !state.dragThresholdReached
    ? "locked"
    : state.holdThresholdReached
      ? "complete"
      : "active";
  const releaseStatus = !state.holdThresholdReached
    ? "locked"
    : state.releaseCommitted
      ? "complete"
      : "active";

  return {
    stage: state.stage,
    activeStep,
    completed: state.releaseCommitted,
    pointerActive: state.pointerActive,

    dragProgress: round(dragProgress),
    holdProgress: round(holdProgress),
    releaseProgress: round(releaseProgress),
    totalProgress: round(totalProgress),

    layerOffsetPx: round(layerOffsetPx),
    layerReveal: round(layerReveal),
    compression: round(compression),
    glowIntensity: round(glowIntensity),

    dragDistancePx: round(state.dragDistancePx),
    dragDirectionRatio: round(state.dragDirectionRatio),
    holdElapsedMs: round(state.holdElapsedMs, 2),

    sealStatus: deriveSealStatus(state),
    releaseReady: state.dragThresholdReached && state.holdThresholdReached,
    releaseBlocked: state.releaseBlocked,
    steps: [
      {
        key: "drag",
        status: dragStatus,
        progress: round(dragProgress),
        label: "ARRASTRA",
      },
      {
        key: "hold",
        status: holdStatus,
        progress: round(holdProgress),
        label: "MANTEN PRESIONADO",
      },
      {
        key: "release",
        status: releaseStatus,
        progress: round(releaseProgress),
        label: "SUELTA PARA SELLAR",
      },
    ],
  };
}

export function isFirstProofSealed(state: FirstProofState): boolean {
  return state.releaseCommitted;
}

export function canFirstProofReleaseSeal(state: FirstProofState): boolean {
  return state.dragThresholdReached && state.holdThresholdReached;
}

export function isFirstProofDragDirectionValid(
  state: FirstProofState,
  thresholds: FirstProofThresholds = FIRST_PROOF_DEFAULT_THRESHOLDS
): boolean {
  return state.dragDirectionRatio >= thresholds.dragDirectionRatio;
}

export function summarizeFirstProofState(state: FirstProofState): string {
  return [
    `stage=${state.stage}`,
    `drag=${Math.round(state.dragDistancePx)}px`,
    `ratio=${state.dragDirectionRatio.toFixed(2)}`,
    `hold=${Math.round(state.holdElapsedMs)}ms`,
    `releaseReady=${state.dragThresholdReached && state.holdThresholdReached}`,
    `sealed=${state.releaseCommitted}`,
  ].join(" | ");
}

