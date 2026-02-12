import {
  EMPTY_DECISION,
  EMPTY_METRICS,
  EMPTY_SCORE,
  SLIDE01_CRITERIA,
  SLIDE01_MOVEMENT_THRESHOLD,
  SLIDE01_ROUTES,
} from "./constants";
import { buildGestureSample, computeGestureMetrics, movementFromStart } from "./gesture";
import { decisionFromScore, scoreFromMetrics } from "./scoring";
import {
  PointSample,
  Slide01Action,
  Slide01Phase,
  Slide01State,
  Slide01PointerTraceEvent,
} from "./types";

function withPhase(state: Slide01State, phase: Slide01Phase): Slide01State {
  if (state.phase === phase) return state;
  return {
    ...state,
    phase,
    phaseHistory: [...state.phaseHistory, phase],
    transitionCount: state.transitionCount + 1,
  };
}

function pointFromEvent(event: Slide01PointerTraceEvent): PointSample {
  return {
    x: event.x,
    y: event.y,
  };
}

function appendTrace(state: Slide01State, event: Slide01PointerTraceEvent): Slide01State {
  return {
    ...state,
    trace: [...state.trace, event],
  };
}

function handlePointerDown(state: Slide01State, event: Slide01PointerTraceEvent): Slide01State {
  const firstSample = buildGestureSample(event, null);
  const samples = [firstSample];
  const metrics = computeGestureMetrics(samples);
  const score = scoreFromMetrics(metrics);

  const next: Slide01State = {
    ...state,
    activePointerId: event.pointerId,
    pointerDown: true,
    gestureStart: pointFromEvent(event),
    pointerCurrent: pointFromEvent(event),
    gestureSamples: samples,
    metrics,
    score,
    decision: EMPTY_DECISION,
    replay: {
      ...state.replay,
      status: "ready",
      message: "Live trace updated.",
    },
  };

  return withPhase(appendTrace(next, event), "aiming");
}

function handlePointerMove(state: Slide01State, event: Slide01PointerTraceEvent): Slide01State {
  if (!state.pointerDown) return state;
  if (state.activePointerId !== event.pointerId) return state;
  if (!(state.phase === "aiming" || state.phase === "weighing")) return state;

  const previous = state.gestureSamples[state.gestureSamples.length - 1] ?? null;
  const sample = buildGestureSample(event, previous);
  const gestureSamples = [...state.gestureSamples, sample];
  const metrics = computeGestureMetrics(gestureSamples);
  const score = scoreFromMetrics(metrics);
  const pointerCurrent = pointFromEvent(event);
  const moved = movementFromStart(state.gestureStart, pointerCurrent);

  const nextPhase: Slide01Phase =
    state.phase === "aiming" && moved >= SLIDE01_MOVEMENT_THRESHOLD ? "weighing" : state.phase;

  const nextState: Slide01State = {
    ...state,
    pointerCurrent,
    gestureSamples,
    metrics,
    score,
    replay: {
      ...state.replay,
      status: "ready",
      message: "Live trace updated.",
    },
  };

  return withPhase(appendTrace(nextState, event), nextPhase);
}

function handlePointerUp(state: Slide01State, event: Slide01PointerTraceEvent): Slide01State {
  if (!state.pointerDown) return state;
  if (state.activePointerId !== event.pointerId) return state;
  if (!(state.phase === "aiming" || state.phase === "weighing")) return state;

  const previous = state.gestureSamples[state.gestureSamples.length - 1] ?? null;
  const sample = buildGestureSample(event, previous);
  const gestureSamples = [...state.gestureSamples, sample];
  const metrics = computeGestureMetrics(gestureSamples);
  const score = scoreFromMetrics(metrics);
  const pointerCurrent = pointFromEvent(event);

  const nextState: Slide01State = {
    ...state,
    activePointerId: null,
    pointerDown: false,
    pointerCurrent,
    gestureSamples,
    metrics,
    score,
    replay: {
      ...state.replay,
      status: "ready",
      message: "Gesture committed. Resolve to finalize.",
    },
  };

  return withPhase(appendTrace(nextState, event), "committed");
}

export function createSlide01InitialState(): Slide01State {
  return {
    phase: "idle",
    phaseHistory: ["idle"],
    transitionCount: 0,
    activePointerId: null,
    pointerDown: false,
    gestureStart: null,
    pointerCurrent: null,
    gestureSamples: [],
    metrics: EMPTY_METRICS,
    score: EMPTY_SCORE,
    decision: EMPTY_DECISION,
    trace: [],
    hudVisible: false,
    replay: {
      status: "idle",
      message: "Replay idle.",
      lastEnvelopeHash: "",
    },
    routes: SLIDE01_ROUTES,
    criteria: SLIDE01_CRITERIA,
  };
}

export function slide01Reducer(state: Slide01State, action: Slide01Action): Slide01State {
  switch (action.type) {
    case "POINTER_EVENT": {
      const event = action.event;
      if (event.kind === "pointerdown") return handlePointerDown(state, event);
      if (event.kind === "pointermove") return handlePointerMove(state, event);
      if (event.kind === "pointerup") return handlePointerUp(state, event);
      return state;
    }
    case "RESOLVE_COMMITTED": {
      if (state.phase !== "committed") return state;
      const decision = decisionFromScore(state.score);
      const nextState: Slide01State = {
        ...state,
        decision,
        replay: {
          ...state.replay,
          status: action.source === "replay" ? "replayed" : "ready",
          message:
            action.source === "replay"
              ? "Replay completed through reducer path."
              : "Route resolved from live gesture.",
        },
      };
      return withPhase(nextState, "resolved");
    }
    case "RESET": {
      const reset = createSlide01InitialState();
      return {
        ...reset,
        hudVisible: state.hudVisible,
        replay: {
          ...reset.replay,
          status: "idle",
          message: "Session reset.",
        },
      };
    }
    case "TOGGLE_HUD": {
      return {
        ...state,
        hudVisible: !state.hudVisible,
      };
    }
    case "REPLAY_APPLY": {
      return {
        ...action.replayedState,
        hudVisible: state.hudVisible,
        replay: {
          ...action.replayedState.replay,
          status: "replayed",
          message: "Replay applied successfully.",
          lastEnvelopeHash: action.envelopeHash,
        },
      };
    }
    case "REPLAY_ERROR": {
      return {
        ...state,
        replay: {
          ...state.replay,
          status: "error",
          message: action.message,
        },
      };
    }
    case "REPLAY_NOTE": {
      return {
        ...state,
        replay: {
          ...state.replay,
          status: state.replay.status === "error" ? "ready" : state.replay.status,
          message: action.message,
        },
      };
    }
    default:
      return state;
  }
}

export function reduceActions(state: Slide01State, actions: Slide01Action[]): Slide01State {
  let current = state;
  for (const action of actions) {
    current = slide01Reducer(current, action);
  }
  return current;
}
