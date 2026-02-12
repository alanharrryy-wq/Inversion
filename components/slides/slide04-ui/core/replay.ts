import {
  isConstraintState,
  isKnownConstraintId,
  isKnownEvidenceId,
  isKnownRouteId,
  SLIDE04_REPLAY_VERSION,
} from "./constants";
import {
  LockAction,
  LockMachineState,
  LockReducerDependencies,
  ReplayDecodeResult,
  ReplayEvent,
  ReplayEventKind,
  ReplayPlaybackResult,
  ReplayTraceV1,
  TraceCapture,
} from "./types";
import {
  DEFAULT_LOCK_REDUCER_DEPENDENCIES,
  createInitialLockState,
  reduceLockMachine,
} from "./fsm";

type ReplayActionEnvelope = {
  action: LockAction;
  shouldPersist: boolean;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isReplayPayloadRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createReplayTraceCapture(seed: string, scenario: string): TraceCapture {
  return {
    seed,
    scenario,
    startedAt: new Date(0).toISOString(),
    events: [],
  };
}

export function createReplayEvent(
  seq: number,
  atMs: number,
  kind: ReplayEventKind,
  payload: ReplayEvent["payload"]
): ReplayEvent {
  return {
    seq,
    atMs,
    kind,
    payload,
  };
}

export function actionToReplayEvent(
  action: LockAction,
  seq: number
): ReplayEvent | null {
  if (action.type === "route.select") {
    return createReplayEvent(seq, action.atMs, "route.select", {
      routeId: action.routeId,
    });
  }

  if (action.type === "route.clear") {
    return createReplayEvent(seq, action.atMs, "route.clear", {});
  }

  if (action.type === "constraint.set") {
    return createReplayEvent(seq, action.atMs, "constraint.set", {
      constraintId: action.constraintId,
      state: action.state,
    });
  }

  if (action.type === "evidence.toggle") {
    return createReplayEvent(seq, action.atMs, "evidence.toggle", {
      evidenceId: action.evidenceId,
    });
  }

  if (action.type === "seal.pointer.down") {
    return createReplayEvent(seq, action.atMs, "seal.pointer.down", {
      atMs: action.atMs,
    });
  }

  if (action.type === "seal.pointer.up") {
    return createReplayEvent(seq, action.atMs, "seal.pointer.up", {
      atMs: action.atMs,
    });
  }

  if (action.type === "seal.pointer.cancel") {
    return createReplayEvent(seq, action.atMs, "seal.pointer.cancel", {
      atMs: action.atMs,
    });
  }

  if (action.type === "seal.unseal") {
    return createReplayEvent(seq, action.atMs, "seal.unseal", {});
  }

  if (action.type === "seal.reset") {
    return createReplayEvent(seq, action.atMs, "seal.reset", {});
  }

  return null;
}

export function appendReplayEvent(capture: TraceCapture, event: ReplayEvent): TraceCapture {
  return {
    ...capture,
    events: [...capture.events, event],
  };
}

export function resetReplayTraceCapture(capture: TraceCapture): TraceCapture {
  return {
    ...capture,
    events: [],
  };
}

export function buildReplayTrace(capture: TraceCapture): ReplayTraceV1 {
  return {
    version: SLIDE04_REPLAY_VERSION,
    seed: capture.seed,
    meta: {
      scenario: capture.scenario,
      capturedAt: capture.startedAt,
    },
    events: [...capture.events],
  };
}

export function encodeReplayTrace(trace: ReplayTraceV1): string {
  return JSON.stringify(trace, null, 2);
}

function validateReplayEventShape(
  rawEvent: unknown,
  index: number
): { ok: true; event: ReplayEvent } | { ok: false; error: string } {
  if (!isReplayPayloadRecord(rawEvent)) {
    return {
      ok: false,
      error: `Event at index ${index} must be an object.`,
    };
  }

  const seq = rawEvent.seq;
  const atMs = rawEvent.atMs;
  const kind = rawEvent.kind;
  const payload = rawEvent.payload;

  if (!Number.isInteger(seq) || seq <= 0) {
    return {
      ok: false,
      error: `Event at index ${index} has invalid seq.`,
    };
  }

  if (!isFiniteNumber(atMs) || atMs < 0) {
    return {
      ok: false,
      error: `Event at index ${index} has invalid atMs.`,
    };
  }

  if (typeof kind !== "string") {
    return {
      ok: false,
      error: `Event at index ${index} has invalid kind type.`,
    };
  }

  if (!isReplayPayloadRecord(payload)) {
    return {
      ok: false,
      error: `Event at index ${index} payload must be an object.`,
    };
  }

  const allowedKinds: ReplayEventKind[] = [
    "route.select",
    "route.clear",
    "constraint.set",
    "evidence.toggle",
    "seal.pointer.down",
    "seal.pointer.up",
    "seal.pointer.cancel",
    "seal.unseal",
    "seal.reset",
  ];

  if (!allowedKinds.includes(kind as ReplayEventKind)) {
    return {
      ok: false,
      error: `Event at index ${index} has unknown kind '${kind}'.`,
    };
  }

  return {
    ok: true,
    event: {
      seq,
      atMs,
      kind: kind as ReplayEventKind,
      payload,
    },
  };
}

export function decodeReplayTrace(jsonText: string): ReplayDecodeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      error: "Replay JSON parse failed.",
    };
  }

  if (!isReplayPayloadRecord(parsed)) {
    return {
      ok: false,
      error: "Replay payload must be an object.",
    };
  }

  if (parsed.version !== SLIDE04_REPLAY_VERSION) {
    return {
      ok: false,
      error: `Replay version mismatch. Expected '${SLIDE04_REPLAY_VERSION}'.`,
    };
  }

  if (typeof parsed.seed !== "string" || parsed.seed.trim().length === 0) {
    return {
      ok: false,
      error: "Replay seed is required.",
    };
  }

  if (!isReplayPayloadRecord(parsed.meta)) {
    return {
      ok: false,
      error: "Replay meta must be an object.",
    };
  }

  if (typeof parsed.meta.scenario !== "string") {
    return {
      ok: false,
      error: "Replay meta.scenario must be string.",
    };
  }

  if (typeof parsed.meta.capturedAt !== "string") {
    return {
      ok: false,
      error: "Replay meta.capturedAt must be string.",
    };
  }

  if (!Array.isArray(parsed.events)) {
    return {
      ok: false,
      error: "Replay events must be an array.",
    };
  }

  const warnings: string[] = [];
  const events: ReplayEvent[] = [];

  for (let index = 0; index < parsed.events.length; index += 1) {
    const validated = validateReplayEventShape(parsed.events[index], index);
    if (!validated.ok) {
      return {
        ok: false,
        error: validated.error,
      };
    }

    events.push(validated.event);
  }

  const seqList = events.map((event) => event.seq);
  const isMonotonic = seqList.every((seq, index) => index === 0 || seq > seqList[index - 1]);
  if (!isMonotonic) {
    warnings.push("Replay sequence is not strictly monotonic.");
  }

  return {
    ok: true,
    trace: {
      version: SLIDE04_REPLAY_VERSION,
      seed: parsed.seed,
      meta: {
        scenario: parsed.meta.scenario,
        capturedAt: parsed.meta.capturedAt,
      },
      events,
    },
    warnings,
  };
}

export function replayEventToAction(event: ReplayEvent): ReplayActionEnvelope {
  if (event.kind === "route.select") {
    if (!isKnownRouteId(String(event.payload.routeId ?? ""))) {
      return {
        action: {
          type: "replay.failed",
          atMs: event.atMs,
          error: `Unknown route id '${String(event.payload.routeId ?? "")}'.`,
        },
        shouldPersist: false,
      };
    }

    return {
      action: {
        type: "route.select",
        routeId: event.payload.routeId,
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "route.clear") {
    return {
      action: {
        type: "route.clear",
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "constraint.set") {
    const rawConstraintId = String(event.payload.constraintId ?? "");
    const rawState = String(event.payload.state ?? "");

    if (!isKnownConstraintId(rawConstraintId) || !isConstraintState(rawState)) {
      return {
        action: {
          type: "replay.failed",
          atMs: event.atMs,
          error: `Invalid constraint payload at seq ${event.seq}.`,
        },
        shouldPersist: false,
      };
    }

    return {
      action: {
        type: "constraint.set",
        constraintId: rawConstraintId,
        state: rawState,
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "evidence.toggle") {
    const rawEvidenceId = String(event.payload.evidenceId ?? "");

    if (!isKnownEvidenceId(rawEvidenceId)) {
      return {
        action: {
          type: "replay.failed",
          atMs: event.atMs,
          error: `Invalid evidence payload at seq ${event.seq}.`,
        },
        shouldPersist: false,
      };
    }

    return {
      action: {
        type: "evidence.toggle",
        evidenceId: rawEvidenceId,
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "seal.pointer.down") {
    return {
      action: {
        type: "seal.pointer.down",
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "seal.pointer.up") {
    return {
      action: {
        type: "seal.pointer.up",
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "seal.pointer.cancel") {
    return {
      action: {
        type: "seal.pointer.cancel",
        atMs: event.atMs,
        reason: "pointer-cancel",
      },
      shouldPersist: true,
    };
  }

  if (event.kind === "seal.unseal") {
    return {
      action: {
        type: "seal.unseal",
        atMs: event.atMs,
      },
      shouldPersist: true,
    };
  }

  return {
    action: {
      type: "seal.reset",
      atMs: event.atMs,
    },
    shouldPersist: true,
  };
}

export function playbackReplayTrace(
  trace: ReplayTraceV1,
  inputState: LockMachineState = createInitialLockState(),
  deps: LockReducerDependencies = DEFAULT_LOCK_REDUCER_DEPENDENCIES
): ReplayPlaybackResult {
  let state = inputState;
  const errors: string[] = [];

  for (const event of trace.events) {
    const mapped = replayEventToAction(event);

    if (mapped.action.type === "replay.failed") {
      errors.push(mapped.action.error);
      state = reduceLockMachine(state, mapped.action, deps);
      continue;
    }

    if (mapped.action.type === "seal.pointer.up") {
      state = reduceLockMachine(
        state,
        {
          type: "seal.pointer.tick",
          atMs: mapped.action.atMs,
        },
        deps
      );
      state = reduceLockMachine(state, mapped.action, deps);
      continue;
    }

    state = reduceLockMachine(state, mapped.action, deps);
  }

  return {
    ok: errors.length === 0,
    state,
    errors,
  };
}

export function applyReplayJson(
  jsonText: string,
  state: LockMachineState,
  deps: LockReducerDependencies = DEFAULT_LOCK_REDUCER_DEPENDENCIES
): ReplayPlaybackResult {
  const decoded = decodeReplayTrace(jsonText);

  if (!decoded.ok) {
    const next = reduceLockMachine(
      state,
      {
        type: "replay.failed",
        error: decoded.error,
        atMs: 0,
      },
      deps
    );

    return {
      ok: false,
      state: next,
      errors: [decoded.error],
    };
  }

  const playback = playbackReplayTrace(decoded.trace, createInitialLockState(), deps);

  if (!playback.ok) {
    const failureState = reduceLockMachine(
      playback.state,
      {
        type: "replay.failed",
        error: playback.errors.join(" | "),
        atMs: 0,
      },
      deps
    );

    return {
      ok: false,
      state: failureState,
      errors: playback.errors,
    };
  }

  const hash = playback.state.sealedSummary?.seal.hash ?? null;
  const withReplayFlag = reduceLockMachine(
    playback.state,
    {
      type: "replay.applied",
      hash,
      atMs: 0,
    },
    deps
  );

  return {
    ok: true,
    state: withReplayFlag,
    errors: decoded.warnings,
  };
}
