import {
  buildSlide01FaultAnchorEventName,
  SLIDE01_EVENT_NAMES,
  SLIDE01_FAULT_COPY,
} from "./slide01.copy";
import {
  Slide01FaultCardModel,
  Slide01MachineEvent,
  Slide01OperationalEvent,
  Slide01OperationalEventName,
  Slide01RitualSnapshot,
  Slide01RitualState,
  Slide01SealStatus,
  Slide01Thresholds,
  Slide01TransitionResult,
} from "./slide01.types";

export const SLIDE01_DEFAULT_THRESHOLDS: Slide01Thresholds = {
  requiredFaults: 4,
  dragMinimumTravelPx: 420,
  holdRequiredMs: 900,
  holdTickClampMs: 120,
  scannerRadiusPx: 34,
};

const MIN_THRESHOLDS: Slide01Thresholds = {
  requiredFaults: 3,
  dragMinimumTravelPx: 220,
  holdRequiredMs: 320,
  holdTickClampMs: 8,
  scannerRadiusPx: 16,
};

const MAX_THRESHOLDS: Slide01Thresholds = {
  requiredFaults: 4,
  dragMinimumTravelPx: 780,
  holdRequiredMs: 2600,
  holdTickClampMs: 120,
  scannerRadiusPx: 84,
};

const FAULT_LAYOUT: Array<{ x: number; y: number; width: number; height: number }> = [
  { x: 48, y: 52, width: 192, height: 114 },
  { x: 286, y: 94, width: 198, height: 122 },
  { x: 520, y: 128, width: 196, height: 124 },
  { x: 206, y: 266, width: 232, height: 126 },
];

export const SLIDE01_FAULT_CARDS: Slide01FaultCardModel[] = SLIDE01_FAULT_COPY.map(
  (item, index) => ({
    id: item.id,
    label: item.label,
    detail: item.detail,
    severity: item.severity,
    rect: FAULT_LAYOUT[index],
  })
);

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function safeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function toTimestamp(value: number): number {
  return Math.max(0, Math.round(safeNumber(value, 0)));
}

function hasEvent(
  state: Slide01RitualState,
  pending: Slide01OperationalEvent[],
  eventName: Slide01OperationalEventName
): boolean {
  if (state.completedEvents.some((item) => item.name === eventName)) return true;
  return pending.some((item) => item.name === eventName);
}

function pointInsideCard(
  point: { x: number; y: number },
  card: Slide01FaultCardModel,
  scannerRadiusPx: number
): boolean {
  const minX = card.rect.x - scannerRadiusPx;
  const minY = card.rect.y - scannerRadiusPx;
  const maxX = card.rect.x + card.rect.width + scannerRadiusPx;
  const maxY = card.rect.y + card.rect.height + scannerRadiusPx;

  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

function appendEvent(
  state: Slide01RitualState,
  pending: Slide01OperationalEvent[],
  eventName: Slide01OperationalEventName,
  timestampMs: number,
  payload?: Record<string, string | number | boolean>
): void {
  if (hasEvent(state, pending, eventName)) return;
  const sequence = state.completedEvents.length + pending.length + 1;
  pending.push({
    id: "slide01-event-" + String(sequence).padStart(4, "0"),
    name: eventName,
    timestampMs: toTimestamp(timestampMs),
    payload,
  });
}

function mergeEvents(
  state: Slide01RitualState,
  pending: Slide01OperationalEvent[]
): Slide01RitualState {
  if (pending.length === 0) return state;
  return {
    ...state,
    completedEvents: [...state.completedEvents, ...pending],
  };
}

function normalizePoint(x: number, y: number): { x: number; y: number } {
  return {
    x: clamp(safeNumber(x), 0, 760),
    y: clamp(safeNumber(y), 0, 430),
  };
}

export function resolveSlide01Thresholds(
  overrides?: Partial<Slide01Thresholds>
): Slide01Thresholds {
  if (!overrides) return SLIDE01_DEFAULT_THRESHOLDS;

  return {
    requiredFaults: Math.round(
      clamp(
        overrides.requiredFaults ?? SLIDE01_DEFAULT_THRESHOLDS.requiredFaults,
        MIN_THRESHOLDS.requiredFaults,
        MAX_THRESHOLDS.requiredFaults
      )
    ),
    dragMinimumTravelPx: clamp(
      overrides.dragMinimumTravelPx ?? SLIDE01_DEFAULT_THRESHOLDS.dragMinimumTravelPx,
      MIN_THRESHOLDS.dragMinimumTravelPx,
      MAX_THRESHOLDS.dragMinimumTravelPx
    ),
    holdRequiredMs: clamp(
      overrides.holdRequiredMs ?? SLIDE01_DEFAULT_THRESHOLDS.holdRequiredMs,
      MIN_THRESHOLDS.holdRequiredMs,
      MAX_THRESHOLDS.holdRequiredMs
    ),
    holdTickClampMs: clamp(
      overrides.holdTickClampMs ?? SLIDE01_DEFAULT_THRESHOLDS.holdTickClampMs,
      MIN_THRESHOLDS.holdTickClampMs,
      MAX_THRESHOLDS.holdTickClampMs
    ),
    scannerRadiusPx: clamp(
      overrides.scannerRadiusPx ?? SLIDE01_DEFAULT_THRESHOLDS.scannerRadiusPx,
      MIN_THRESHOLDS.scannerRadiusPx,
      MAX_THRESHOLDS.scannerRadiusPx
    ),
  };
}

function defaultScannerPoint(): { x: number; y: number } {
  const first = SLIDE01_FAULT_CARDS[0];
  return {
    x: first.rect.x + first.rect.width * 0.5,
    y: first.rect.y + first.rect.height * 0.5,
  };
}

export function createInitialSlide01State(
  _thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): Slide01RitualState {
  return {
    stage: "Idle",
    entered: false,
    pointerActive: false,
    activePointerId: null,
    originPoint: null,
    pointerPoint: null,
    scannerPoint: defaultScannerPoint(),
    totalDragTravelPx: 0,
    holdElapsedMs: 0,
    engagedFaultIds: [],
    completedEvents: [],
    debug: {
      frameCount: 0,
      lastDeltaMs: 0,
    },
  };
}

export function isSlide01DragSatisfied(
  state: Slide01RitualState,
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): boolean {
  return (
    state.engagedFaultIds.length >= thresholds.requiredFaults &&
    state.totalDragTravelPx >= thresholds.dragMinimumTravelPx
  );
}

export function isSlide01HoldSatisfied(
  state: Slide01RitualState,
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): boolean {
  return state.holdElapsedMs >= thresholds.holdRequiredMs;
}

export function deriveSlide01SealStatus(
  state: Slide01RitualState,
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): Slide01SealStatus {
  if (state.stage === "Sealed") return "sealed";
  if (isSlide01HoldSatisfied(state, thresholds)) return "evidence-accepted";
  if (isSlide01DragSatisfied(state, thresholds)) return "responsibility-pending";

  const dragSignal = state.engagedFaultIds.length > 0 || state.totalDragTravelPx > 56;
  if (dragSignal) return "intent-registered";
  return "incomplete";
}

export function transitionSlide01State(
  state: Slide01RitualState,
  machineEvent: Slide01MachineEvent,
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS,
  faultCards: Slide01FaultCardModel[] = SLIDE01_FAULT_CARDS
): Slide01TransitionResult {
  const pendingEvents: Slide01OperationalEvent[] = [];

  if (machineEvent.type === "reset") {
    return {
      state: createInitialSlide01State(thresholds),
      events: [],
    };
  }

  if (machineEvent.type === "entered") {
    if (state.entered) {
      return { state, events: [] };
    }

    const nextState = {
      ...state,
      entered: true,
    };

    appendEvent(nextState, pendingEvents, SLIDE01_EVENT_NAMES.entered, machineEvent.timestampMs);

    return {
      state: mergeEvents(nextState, pendingEvents),
      events: pendingEvents,
    };
  }

  if (machineEvent.type === "pointer_down") {
    if (state.stage === "Sealed" || state.pointerActive) {
      return { state, events: [] };
    }

    const point = normalizePoint(machineEvent.x, machineEvent.y);

    const nextState = {
      ...state,
      pointerActive: true,
      activePointerId: machineEvent.pointerId,
      originPoint: point,
      pointerPoint: point,
      scannerPoint: point,
    };

    return { state: nextState, events: [] };
  }

  if (machineEvent.type === "pointer_move") {
    if (
      state.stage === "Sealed" ||
      !state.pointerActive ||
      state.activePointerId !== machineEvent.pointerId ||
      !state.pointerPoint
    ) {
      return { state, events: [] };
    }

    const nextPoint = normalizePoint(machineEvent.x, machineEvent.y);
    const movement = distance(state.pointerPoint, nextPoint);
    const totalDragTravelPx = state.totalDragTravelPx + movement;
    const engagedFaultIds = [...state.engagedFaultIds];

    for (const card of faultCards) {
      if (engagedFaultIds.includes(card.id)) continue;
      if (!pointInsideCard(nextPoint, card, thresholds.scannerRadiusPx)) continue;

      engagedFaultIds.push(card.id);
      appendEvent(
        state,
        pendingEvents,
        buildSlide01FaultAnchorEventName(card.id),
        machineEvent.timestampMs,
        { faultId: card.id }
      );
    }

    const candidateState = {
      ...state,
      pointerPoint: nextPoint,
      scannerPoint: nextPoint,
      totalDragTravelPx,
      engagedFaultIds,
    };

    const wasDragSatisfied = isSlide01DragSatisfied(state, thresholds);
    const dragSatisfied = isSlide01DragSatisfied(candidateState, thresholds);

    let nextStage = state.stage;

    if (dragSatisfied) {
      if (state.stage === "ReleaseReady") {
        nextStage = "ReleaseReady";
      } else if (state.holdElapsedMs > 0) {
        nextStage = "Holding";
      } else {
        nextStage = "DragReady";
      }

      if (!wasDragSatisfied) {
        appendEvent(
          state,
          pendingEvents,
          SLIDE01_EVENT_NAMES.gestureDragCompleted,
          machineEvent.timestampMs,
          {
            engagedFaults: engagedFaultIds.length,
            dragTravel: Math.round(totalDragTravelPx),
          }
        );
      }
    } else if (engagedFaultIds.length > 0 || totalDragTravelPx > 0) {
      nextStage = "Dragging";
    }

    const nextState = {
      ...candidateState,
      stage: nextStage,
    };

    return {
      state: mergeEvents(nextState, pendingEvents),
      events: pendingEvents,
    };
  }

  if (machineEvent.type === "hold_tick") {
    if (!state.pointerActive || state.stage === "Sealed") {
      return { state, events: [] };
    }

    if (!isSlide01DragSatisfied(state, thresholds)) {
      return {
        state: {
          ...state,
          debug: {
            frameCount: state.debug.frameCount + 1,
            lastDeltaMs: 0,
          },
        },
        events: [],
      };
    }

    const deltaMs = clamp(
      safeNumber(machineEvent.deltaMs, 0),
      0,
      thresholds.holdTickClampMs
    );

    const holdElapsedMs = clamp(
      state.holdElapsedMs + deltaMs,
      0,
      thresholds.holdRequiredMs
    );

    let nextStage = state.stage;
    if (state.stage !== "ReleaseReady") {
      nextStage = holdElapsedMs >= thresholds.holdRequiredMs ? "ReleaseReady" : "Holding";
    }

    const nextState = {
      ...state,
      stage: nextStage,
      holdElapsedMs,
      debug: {
        frameCount: state.debug.frameCount + 1,
        lastDeltaMs: deltaMs,
      },
    };

    const reachedHold =
      holdElapsedMs >= thresholds.holdRequiredMs && !isSlide01HoldSatisfied(state, thresholds);

    if (reachedHold) {
      appendEvent(
        state,
        pendingEvents,
        SLIDE01_EVENT_NAMES.gestureHoldCompleted,
        machineEvent.timestampMs,
        {
          holdElapsedMs: Math.round(holdElapsedMs),
        }
      );
    }

    return {
      state: mergeEvents(nextState, pendingEvents),
      events: pendingEvents,
    };
  }

  if (machineEvent.type === "pointer_up" || machineEvent.type === "pointer_cancel") {
    if (!state.pointerActive || state.activePointerId !== machineEvent.pointerId) {
      return { state, events: [] };
    }

    const point = normalizePoint(machineEvent.x, machineEvent.y);
    const baseState = {
      ...state,
      pointerActive: false,
      activePointerId: null,
      originPoint: null,
      pointerPoint: point,
      scannerPoint: point,
    };

    const dragSatisfied = isSlide01DragSatisfied(baseState, thresholds);
    const holdSatisfied = isSlide01HoldSatisfied(baseState, thresholds);

    let nextStage = baseState.stage;

    if (machineEvent.type === "pointer_up" && dragSatisfied && holdSatisfied) {
      nextStage = "Sealed";
      appendEvent(
        baseState,
        pendingEvents,
        SLIDE01_EVENT_NAMES.gestureReleaseCompleted,
        machineEvent.timestampMs
      );
      appendEvent(
        baseState,
        pendingEvents,
        SLIDE01_EVENT_NAMES.stateSealedSet,
        machineEvent.timestampMs
      );
      appendEvent(
        baseState,
        pendingEvents,
        SLIDE01_EVENT_NAMES.evidencePrimarySatisfied,
        machineEvent.timestampMs
      );
    } else if (dragSatisfied) {
      nextStage = "DragReady";
    } else if (baseState.engagedFaultIds.length > 0) {
      nextStage = "Dragging";
    } else {
      nextStage = "Idle";
    }

    return {
      state: mergeEvents(
        {
          ...baseState,
          stage: nextStage,
        },
        pendingEvents
      ),
      events: pendingEvents,
    };
  }

  return { state, events: [] };
}

export function deriveSlide01Snapshot(
  state: Slide01RitualState,
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): Slide01RitualSnapshot {
  const engagedRatio = clamp(
    state.engagedFaultIds.length / Math.max(1, thresholds.requiredFaults),
    0,
    1
  );
  const travelRatio = clamp(state.totalDragTravelPx / thresholds.dragMinimumTravelPx, 0, 1);
  const dragProgress = clamp(engagedRatio * 0.7 + travelRatio * 0.3, 0, 1);

  const dragSatisfied = isSlide01DragSatisfied(state, thresholds);
  const holdProgress = dragSatisfied
    ? clamp(state.holdElapsedMs / thresholds.holdRequiredMs, 0, 1)
    : 0;
  const releaseProgress = state.stage === "Sealed" ? 1 : 0;

  const totalProgress =
    state.stage === "Sealed"
      ? 1
      : clamp(dragProgress * 0.5 + holdProgress * 0.4 + releaseProgress * 0.1, 0, 0.98);

  const sealStatus = deriveSlide01SealStatus(state, thresholds);

  const activeStep =
    state.stage === "Sealed"
      ? "sealed"
      : dragProgress < 1
        ? "drag"
        : holdProgress < 1
          ? "hold"
          : "release";

  const steps: Slide01RitualSnapshot["steps"] = [
    {
      key: "drag",
      status: dragProgress >= 1 ? "complete" : "active",
      progress: dragProgress,
    },
    {
      key: "hold",
      status:
        dragProgress < 1 ? "locked" : holdProgress >= 1 ? "complete" : "active",
      progress: holdProgress,
    },
    {
      key: "release",
      status: holdProgress < 1 ? "locked" : releaseProgress >= 1 ? "complete" : "active",
      progress: releaseProgress,
    },
  ];

  return {
    stage: state.stage,
    activeStep,
    completed: state.stage === "Sealed",
    pointerActive: state.pointerActive,
    dragProgress,
    holdProgress,
    releaseProgress,
    totalProgress,
    sealStatus,
    engagedFaultIds: [...state.engagedFaultIds],
    steps,
    scannerPoint: state.scannerPoint,
    judgmentScore: Math.round(totalProgress * 100),
    eventNames: state.completedEvents.map((entry) => entry.name),
  };
}

export function createInitialSlide01Snapshot(
  thresholds: Slide01Thresholds = SLIDE01_DEFAULT_THRESHOLDS
): Slide01RitualSnapshot {
  return deriveSlide01Snapshot(createInitialSlide01State(thresholds), thresholds);
}

export function selectSlide01FaultById(
  faultId: string,
  faultCards: Slide01FaultCardModel[] = SLIDE01_FAULT_CARDS
): Slide01FaultCardModel | undefined {
  return faultCards.find((card) => card.id === faultId);
}
