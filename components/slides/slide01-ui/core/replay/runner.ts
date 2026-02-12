import { pointerTraceEventToActions } from "../fsm/actions";
import { createSlide01InitialState, reduceActions, slide01Reducer } from "../fsm/reducer";
import { Slide01ReplayResult, Slide01State, Slide01TraceEnvelope } from "../fsm/types";

export function replayTraceFromInitial(envelope: Slide01TraceEnvelope): Slide01State {
  let state = createSlide01InitialState();
  for (const event of envelope.events) {
    const mappedActions = pointerTraceEventToActions(event, "replay");
    state = reduceActions(state, mappedActions);
  }
  return state;
}

export function replayTraceFromState(
  _state: Slide01State,
  envelope: Slide01TraceEnvelope
): Slide01State {
  // Replay always starts from deterministic initial state.
  return replayTraceFromInitial(envelope);
}

export function applyReplayResult(
  currentState: Slide01State,
  replayedState: Slide01State,
  envelopeHash: string
): Slide01State {
  return slide01Reducer(currentState, {
    type: "REPLAY_APPLY",
    replayedState,
    envelopeHash,
  });
}

export function replayResult(
  currentState: Slide01State,
  envelope: Slide01TraceEnvelope,
  envelopeHash: string
): Slide01ReplayResult {
  const replayed = replayTraceFromState(currentState, envelope);
  return {
    ok: true,
    message: "Replay completed.",
    envelopeHash,
    state: replayed,
  };
}
