import { useCallback, useMemo, useReducer } from "react";
import { createInitialSlide02State, reduceSlide02State } from "./fsm";
import {
  createReplayPayloadFromMachine,
  serializeReplayPayload,
} from "./replay";
import { resolveSlide02SeedContext, Slide02ContextInput } from "./context";
import { Slide02MachineState } from "./types";

function initState(seed: ReturnType<typeof resolveSlide02SeedContext>): Slide02MachineState {
  return createInitialSlide02State(seed);
}

export interface UseSlide02MachineApi {
  state: Slide02MachineState;
  setRoute: (route: string) => void;
  setStrictness: (value: number) => void;
  setBudgetGuard: (value: number) => void;
  setLatencyGuard: (value: number) => void;
  resetConstraints: () => void;
  toggleHud: () => void;
  stageReplay: (json: string) => void;
  applyReplay: () => void;
  clearReplay: () => void;
  exportReplayJson: () => string;
}

export function useSlide02Machine(seedInput?: Partial<Slide02ContextInput> | null): UseSlide02MachineApi {
  const seed = useMemo(() => resolveSlide02SeedContext(seedInput), [seedInput]);
  const [state, dispatch] = useReducer(reduceSlide02State, seed, initState);

  const setRoute = useCallback(
    (route: string) => {
      dispatch({ type: "SET_ROUTE", route });
    },
    [dispatch]
  );

  const setStrictness = useCallback(
    (value: number) => {
      dispatch({ type: "SET_STRICTNESS", value });
    },
    [dispatch]
  );

  const setBudgetGuard = useCallback(
    (value: number) => {
      dispatch({ type: "SET_BUDGET_GUARD", value });
    },
    [dispatch]
  );

  const setLatencyGuard = useCallback(
    (value: number) => {
      dispatch({ type: "SET_LATENCY_GUARD", value });
    },
    [dispatch]
  );

  const resetConstraints = useCallback(() => {
    dispatch({ type: "RESET_CONSTRAINTS" });
  }, [dispatch]);

  const toggleHud = useCallback(() => {
    dispatch({ type: "TOGGLE_HUD" });
  }, [dispatch]);

  const stageReplay = useCallback(
    (json: string) => {
      dispatch({ type: "REPLAY_STAGE_JSON", json });
    },
    [dispatch]
  );

  const applyReplay = useCallback(() => {
    dispatch({ type: "REPLAY_APPLY_STAGED" });
  }, [dispatch]);

  const clearReplay = useCallback(() => {
    dispatch({ type: "REPLAY_CLEAR" });
  }, [dispatch]);

  const exportReplayJson = useCallback(() => {
    const payload = createReplayPayloadFromMachine(
      state.route,
      state.constraints,
      state.trace,
      state.response.signature
    );

    return serializeReplayPayload(payload);
  }, [state.route, state.constraints, state.trace, state.response.signature]);

  return {
    state,
    setRoute,
    setStrictness,
    setBudgetGuard,
    setLatencyGuard,
    resetConstraints,
    toggleHud,
    stageReplay,
    applyReplay,
    clearReplay,
    exportReplayJson,
  };
}
