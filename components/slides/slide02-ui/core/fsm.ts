import {
  ConstraintValues,
  Slide02MachineAction,
  Slide02MachineState,
  Slide02SeedContext,
  Slide02TraceEntry,
} from "./types";
import {
  SLIDE02_DEFAULT_CONSTRAINTS,
  computeSystemResponse,
  createDefaultSeedContext,
  normalizeRoute,
  sanitizeConstraints,
} from "./model";
import { parseReplayPayload, applyReplayPayload } from "./replay";

function copyConstraints(values: ConstraintValues): ConstraintValues {
  return {
    strictness: values.strictness,
    budgetGuard: values.budgetGuard,
    latencyGuard: values.latencyGuard,
  };
}

function materializeSeed(input?: Partial<Slide02SeedContext> | null): Slide02SeedContext {
  const defaults = createDefaultSeedContext();

  if (!input) {
    return defaults;
  }

  const route = normalizeRoute(input.route ?? defaults.route);
  const constraints = sanitizeConstraints(input.constraints ?? defaults.constraints);

  return {
    route,
    routeSource: input.routeSource ?? defaults.routeSource,
    constraints,
    rawRouteInput: input.rawRouteInput ?? defaults.rawRouteInput,
  };
}

function createBootTraceEntry(
  seed: Slide02SeedContext,
  signature: string,
  seq: number
): Slide02TraceEntry {
  const constraints = copyConstraints(seed.constraints);

  return {
    seq,
    action: "boot",
    before: {
      route: seed.route,
      constraints,
      signature,
    },
    after: {
      route: seed.route,
      constraints,
      signature,
    },
  };
}

function createTraceEntry(
  state: Slide02MachineState,
  action: Slide02TraceEntry["action"],
  nextRoute: Slide02MachineState["route"],
  nextConstraints: Slide02MachineState["constraints"],
  nextSignature: string
): Slide02TraceEntry {
  return {
    seq: state.sequence + 1,
    action,
    before: {
      route: state.route,
      constraints: copyConstraints(state.constraints),
      signature: state.response.signature,
    },
    after: {
      route: nextRoute,
      constraints: copyConstraints(nextConstraints),
      signature: nextSignature,
    },
  };
}

function updateInteractiveState(
  state: Slide02MachineState,
  actionLabel: Slide02TraceEntry["action"],
  nextRoute: Slide02MachineState["route"],
  nextConstraints: Slide02MachineState["constraints"]
): Slide02MachineState {
  const response = computeSystemResponse(nextRoute, nextConstraints, state.seed.routeSource);

  const traceEntry = createTraceEntry(
    state,
    actionLabel,
    nextRoute,
    nextConstraints,
    response.signature
  );

  return {
    ...state,
    status: "INTERACTIVE",
    route: nextRoute,
    constraints: nextConstraints,
    response,
    trace: [...state.trace, traceEntry],
    sequence: traceEntry.seq,
    replay: {
      ...state.replay,
      stagedError: null,
      lastAppliedSignature:
        actionLabel === "replay-applied"
          ? response.signature
          : state.replay.lastAppliedSignature,
    },
  };
}

function hasInteractiveTrace(state: Slide02MachineState): boolean {
  return state.trace.some((entry) => entry.action !== "boot");
}

export function createInitialSlide02State(seed?: Partial<Slide02SeedContext> | null): Slide02MachineState {
  const materializedSeed = materializeSeed(seed);
  const response = computeSystemResponse(
    materializedSeed.route,
    materializedSeed.constraints,
    materializedSeed.routeSource
  );

  const bootTrace = createBootTraceEntry(materializedSeed, response.signature, 1);

  return {
    status: "BOOTSTRAPPED",
    seed: materializedSeed,
    route: materializedSeed.route,
    constraints: copyConstraints(materializedSeed.constraints),
    response,
    trace: [bootTrace],
    hudOpen: false,
    replay: {
      stagedJson: "",
      stagedPayload: null,
      stagedError: null,
      lastAppliedSignature: null,
    },
    sequence: 1,
  };
}

function reduceSetRoute(state: Slide02MachineState, routeInput: string): Slide02MachineState {
  const route = normalizeRoute(routeInput);

  if (route === state.route) {
    return state;
  }

  return updateInteractiveState(state, "set-route", route, copyConstraints(state.constraints));
}

function reduceSetStrictness(state: Slide02MachineState, value: number): Slide02MachineState {
  const constraints = sanitizeConstraints({
    ...state.constraints,
    strictness: value,
  });

  if (constraints.strictness === state.constraints.strictness) {
    return state;
  }

  return updateInteractiveState(state, "set-strictness", state.route, constraints);
}

function reduceSetBudget(state: Slide02MachineState, value: number): Slide02MachineState {
  const constraints = sanitizeConstraints({
    ...state.constraints,
    budgetGuard: value,
  });

  if (constraints.budgetGuard === state.constraints.budgetGuard) {
    return state;
  }

  return updateInteractiveState(state, "set-budget", state.route, constraints);
}

function reduceSetLatency(state: Slide02MachineState, value: number): Slide02MachineState {
  const constraints = sanitizeConstraints({
    ...state.constraints,
    latencyGuard: value,
  });

  if (constraints.latencyGuard === state.constraints.latencyGuard) {
    return state;
  }

  return updateInteractiveState(state, "set-latency", state.route, constraints);
}

function reduceResetConstraints(state: Slide02MachineState): Slide02MachineState {
  const defaults = copyConstraints(SLIDE02_DEFAULT_CONSTRAINTS);

  if (
    state.constraints.strictness === defaults.strictness &&
    state.constraints.budgetGuard === defaults.budgetGuard &&
    state.constraints.latencyGuard === defaults.latencyGuard
  ) {
    return state;
  }

  return updateInteractiveState(state, "reset-constraints", state.route, defaults);
}

function reduceReplayStageJson(state: Slide02MachineState, json: string): Slide02MachineState {
  const parsed = parseReplayPayload(json);

  if (!parsed.ok || !parsed.payload) {
    return {
      ...state,
      status: "REPLAY_ERROR",
      replay: {
        ...state.replay,
        stagedJson: json,
        stagedPayload: null,
        stagedError: parsed.error ?? "Replay payload is invalid.",
      },
    };
  }

  return {
    ...state,
    status: "REPLAY_READY",
    replay: {
      ...state.replay,
      stagedJson: json,
      stagedPayload: parsed.payload,
      stagedError: null,
    },
  };
}

function reduceReplayApply(state: Slide02MachineState): Slide02MachineState {
  const payload = state.replay.stagedPayload;

  if (!payload) {
    return state;
  }

  const applied = applyReplayPayload(payload);

  const traceEntry = createTraceEntry(
    state,
    "replay-applied",
    applied.route,
    applied.constraints,
    applied.response.signature
  );

  return {
    ...state,
    status: "REPLAY_APPLIED",
    seed: {
      route: payload.base.route,
      routeSource: "external-payload",
      constraints: copyConstraints(payload.base.constraints),
      rawRouteInput: payload.base.route,
    },
    route: applied.route,
    constraints: copyConstraints(applied.constraints),
    response: applied.response,
    trace: [...state.trace, traceEntry],
    sequence: traceEntry.seq,
    replay: {
      ...state.replay,
      stagedError: null,
      lastAppliedSignature: applied.response.signature,
    },
  };
}

function reduceReplayClear(state: Slide02MachineState): Slide02MachineState {
  return {
    ...state,
    status: hasInteractiveTrace(state) ? "INTERACTIVE" : "BOOTSTRAPPED",
    replay: {
      ...state.replay,
      stagedJson: "",
      stagedPayload: null,
      stagedError: null,
    },
  };
}

export function reduceSlide02State(
  state: Slide02MachineState,
  action: Slide02MachineAction
): Slide02MachineState {
  switch (action.type) {
    case "BOOT": {
      return createInitialSlide02State(action.seed ?? state.seed);
    }

    case "SET_ROUTE": {
      return reduceSetRoute(state, action.route);
    }

    case "SET_STRICTNESS": {
      return reduceSetStrictness(state, action.value);
    }

    case "SET_BUDGET_GUARD": {
      return reduceSetBudget(state, action.value);
    }

    case "SET_LATENCY_GUARD": {
      return reduceSetLatency(state, action.value);
    }

    case "RESET_CONSTRAINTS": {
      return reduceResetConstraints(state);
    }

    case "TOGGLE_HUD": {
      return {
        ...state,
        hudOpen: !state.hudOpen,
      };
    }

    case "REPLAY_STAGE_JSON": {
      return reduceReplayStageJson(state, action.json);
    }

    case "REPLAY_APPLY_STAGED": {
      return reduceReplayApply(state);
    }

    case "REPLAY_CLEAR": {
      return reduceReplayClear(state);
    }

    default: {
      return state;
    }
  }
}

export function createSlide02ReplayInputTemplate(state: Slide02MachineState): string {
  const payload = {
    version: "slide02.replay.v1",
    base: {
      route: state.route,
      constraints: state.constraints,
    },
    trace: [],
    meta: {
      createdBy: "slide02-ui",
      createdAt: "deterministic-local",
      signature: state.response.signature,
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function slide02MachineSnapshot(state: Slide02MachineState): string {
  return [
    `status:${state.status}`,
    `route:${state.route}`,
    `strictness:${state.constraints.strictness}`,
    `budget:${state.constraints.budgetGuard}`,
    `latency:${state.constraints.latencyGuard}`,
    `signature:${state.response.signature}`,
    `trace:${state.trace.length}`,
    `hud:${state.hudOpen ? "on" : "off"}`,
  ].join("|");
}
