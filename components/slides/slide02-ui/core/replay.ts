import {
  ConstraintValues,
  ReplayApplicationResult,
  ReplayEvent,
  ReplayEventKind,
  ReplayMeta,
  ReplayParseResult,
  ReplayPayload,
  Slide02RouteId,
  Slide02TraceEntry,
} from "./types";
import {
  SLIDE02_DEFAULT_CONSTRAINTS,
  SLIDE02_DEFAULT_ROUTE,
  SLIDE02_REPLAY_VERSION,
  computeSystemResponse,
  normalizeRoute,
  sanitizeConstraints,
} from "./model";

const ALLOWED_REPLAY_KINDS: ReplayEventKind[] = [
  "set-route",
  "set-strictness",
  "set-budget",
  "set-latency",
  "reset-constraints",
];

function isAllowedReplayKind(kind: string): kind is ReplayEventKind {
  return ALLOWED_REPLAY_KINDS.includes(kind as ReplayEventKind);
}

function parseSeq(input: unknown, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) {
    return Math.max(1, Math.round(input));
  }

  if (typeof input === "string") {
    const parsed = Number(input.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.round(parsed));
    }
  }

  return fallback;
}

function parseReplayValue(kind: ReplayEventKind, raw: unknown): Slide02RouteId | number | null {
  if (kind === "set-route") {
    return normalizeRoute(raw);
  }

  if (kind === "reset-constraints") {
    return null;
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.round(raw);
  }

  if (typeof raw === "string") {
    const parsed = Number(raw.trim());
    if (Number.isFinite(parsed)) {
      return Math.round(parsed);
    }
  }

  return 0;
}

function sanitizeReplayEvent(raw: unknown, fallbackSeq: number): ReplayEvent | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const kindRaw = value.kind;

  if (typeof kindRaw !== "string" || !isAllowedReplayKind(kindRaw)) {
    return null;
  }

  const seq = parseSeq(value.seq, fallbackSeq);

  return {
    seq,
    kind: kindRaw,
    value: parseReplayValue(kindRaw, value.value),
  };
}

function sanitizeReplayTrace(input: unknown): ReplayEvent[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const withIndex = input
    .map((entry, index) => sanitizeReplayEvent(entry, index + 1))
    .filter((entry): entry is ReplayEvent => entry !== null);

  const sorted = [...withIndex].sort((left, right) => left.seq - right.seq);

  return sorted.map((entry, index) => ({ ...entry, seq: index + 1 }));
}

function sanitizeReplayMeta(input: unknown, signature: string): ReplayMeta {
  if (!input || typeof input !== "object") {
    return {
      createdBy: "slide02-ui",
      createdAt: "deterministic-local",
      signature,
    };
  }

  const raw = input as Record<string, unknown>;
  const createdBy = typeof raw.createdBy === "string" && raw.createdBy.trim() ? raw.createdBy : "slide02-ui";
  const createdAt = typeof raw.createdAt === "string" && raw.createdAt.trim() ? raw.createdAt : "deterministic-local";
  const signatureValue = typeof raw.signature === "string" && raw.signature.trim() ? raw.signature : signature;

  return {
    createdBy,
    createdAt,
    signature: signatureValue,
  };
}

function sanitizeReplayBase(input: unknown): { route: Slide02RouteId; constraints: ConstraintValues } | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const route = normalizeRoute(raw.route);

  const rawConstraints =
    raw.constraints && typeof raw.constraints === "object"
      ? (raw.constraints as Record<string, unknown>)
      : null;

  if (!rawConstraints) {
    return {
      route,
      constraints: { ...SLIDE02_DEFAULT_CONSTRAINTS },
    };
  }

  const constraints = sanitizeConstraints({
    strictness:
      typeof rawConstraints.strictness === "number"
        ? rawConstraints.strictness
        : Number(rawConstraints.strictness),
    budgetGuard:
      typeof rawConstraints.budgetGuard === "number"
        ? rawConstraints.budgetGuard
        : Number(rawConstraints.budgetGuard),
    latencyGuard:
      typeof rawConstraints.latencyGuard === "number"
        ? rawConstraints.latencyGuard
        : Number(rawConstraints.latencyGuard),
  });

  return {
    route,
    constraints,
  };
}

export function createReplayPayload(
  route: Slide02RouteId,
  constraints: ConstraintValues,
  trace: ReplayEvent[],
  signature: string
): ReplayPayload {
  const baseConstraints = sanitizeConstraints(constraints);
  const normalizedTrace = sanitizeReplayTrace(trace);

  return {
    version: SLIDE02_REPLAY_VERSION,
    base: {
      route: normalizeRoute(route),
      constraints: baseConstraints,
    },
    trace: normalizedTrace,
    meta: {
      createdBy: "slide02-ui",
      createdAt: "deterministic-local",
      signature,
    },
  };
}

export function replayEventsFromTrace(trace: Slide02TraceEntry[]): ReplayEvent[] {
  return trace
    .map((entry, index): ReplayEvent | null => {
      if (entry.action === "set-route") {
        return {
          seq: index + 1,
          kind: "set-route",
          value: entry.after.route,
        };
      }

      if (entry.action === "set-strictness") {
        return {
          seq: index + 1,
          kind: "set-strictness",
          value: entry.after.constraints.strictness,
        };
      }

      if (entry.action === "set-budget") {
        return {
          seq: index + 1,
          kind: "set-budget",
          value: entry.after.constraints.budgetGuard,
        };
      }

      if (entry.action === "set-latency") {
        return {
          seq: index + 1,
          kind: "set-latency",
          value: entry.after.constraints.latencyGuard,
        };
      }

      if (entry.action === "reset-constraints") {
        return {
          seq: index + 1,
          kind: "reset-constraints",
          value: null,
        };
      }

      return null;
    })
    .filter((entry): entry is ReplayEvent => entry !== null)
    .map((entry, index) => ({ ...entry, seq: index + 1 }));
}

export function serializeReplayPayload(payload: ReplayPayload): string {
  const normalized = {
    version: payload.version,
    base: {
      route: normalizeRoute(payload.base.route),
      constraints: sanitizeConstraints(payload.base.constraints),
    },
    trace: sanitizeReplayTrace(payload.trace),
    meta: sanitizeReplayMeta(payload.meta, payload.meta.signature),
  };

  return JSON.stringify(normalized, null, 2);
}

export function parseReplayPayload(json: string): ReplayParseResult {
  if (!json || !json.trim()) {
    return {
      ok: false,
      payload: null,
      error: "Replay JSON is empty.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      payload: null,
      error: "Replay JSON could not be parsed.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      payload: null,
      error: "Replay payload must be an object.",
    };
  }

  const raw = parsed as Record<string, unknown>;

  if (raw.version !== SLIDE02_REPLAY_VERSION) {
    return {
      ok: false,
      payload: null,
      error: `Replay version must be ${SLIDE02_REPLAY_VERSION}.`,
    };
  }

  const base = sanitizeReplayBase(raw.base);

  if (!base) {
    return {
      ok: false,
      payload: null,
      error: "Replay base is missing or invalid.",
    };
  }

  const trace = sanitizeReplayTrace(raw.trace);
  const baseResponse = computeSystemResponse(base.route, base.constraints, "external-payload");
  const meta = sanitizeReplayMeta(raw.meta, baseResponse.signature);

  const payload: ReplayPayload = {
    version: SLIDE02_REPLAY_VERSION,
    base,
    trace,
    meta,
  };

  return {
    ok: true,
    payload,
    error: null,
  };
}

export function applyReplayPayload(payload: ReplayPayload): ReplayApplicationResult {
  const route = normalizeRoute(payload.base.route);
  const constraints = sanitizeConstraints(payload.base.constraints);

  const finalState = sanitizeReplayTrace(payload.trace).reduce(
    (acc, event) => {
      if (event.kind === "set-route") {
        return {
          route: normalizeRoute(event.value),
          constraints: acc.constraints,
        };
      }

      if (event.kind === "set-strictness") {
        return {
          route: acc.route,
          constraints: sanitizeConstraints({
            ...acc.constraints,
            strictness: Number(event.value),
          }),
        };
      }

      if (event.kind === "set-budget") {
        return {
          route: acc.route,
          constraints: sanitizeConstraints({
            ...acc.constraints,
            budgetGuard: Number(event.value),
          }),
        };
      }

      if (event.kind === "set-latency") {
        return {
          route: acc.route,
          constraints: sanitizeConstraints({
            ...acc.constraints,
            latencyGuard: Number(event.value),
          }),
        };
      }

      return {
        route: acc.route,
        constraints: { ...SLIDE02_DEFAULT_CONSTRAINTS },
      };
    },
    {
      route,
      constraints,
    }
  );

  const response = computeSystemResponse(
    finalState.route,
    finalState.constraints,
    "external-payload"
  );

  return {
    route: finalState.route,
    constraints: finalState.constraints,
    response,
    trace: sanitizeReplayTrace(payload.trace),
  };
}

export function createReplayPayloadFromMachine(
  route: Slide02RouteId,
  constraints: ConstraintValues,
  machineTrace: Slide02TraceEntry[],
  signature: string
): ReplayPayload {
  const replayTrace = replayEventsFromTrace(machineTrace);
  return createReplayPayload(route, constraints, replayTrace, signature);
}

export function isReplayEventKind(input: unknown): input is ReplayEventKind {
  return typeof input === "string" && isAllowedReplayKind(input);
}

export function createEmptyReplayPayload(): ReplayPayload {
  const response = computeSystemResponse(
    SLIDE02_DEFAULT_ROUTE,
    SLIDE02_DEFAULT_CONSTRAINTS,
    "default"
  );

  return {
    version: SLIDE02_REPLAY_VERSION,
    base: {
      route: SLIDE02_DEFAULT_ROUTE,
      constraints: { ...SLIDE02_DEFAULT_CONSTRAINTS },
    },
    trace: [],
    meta: {
      createdBy: "slide02-ui",
      createdAt: "deterministic-local",
      signature: response.signature,
    },
  };
}

export function repairReplayJson(json: string): string {
  const parsed = parseReplayPayload(json);

  if (!parsed.ok || !parsed.payload) {
    return serializeReplayPayload(createEmptyReplayPayload());
  }

  return serializeReplayPayload(parsed.payload);
}

export function ensureReplayVersion(value: string | null | undefined): string {
  return value === SLIDE02_REPLAY_VERSION ? value : SLIDE02_REPLAY_VERSION;
}

export function createReplaySummary(payload: ReplayPayload): string {
  return [
    `version:${payload.version}`,
    `base:${payload.base.route}`,
    `strictness:${payload.base.constraints.strictness}`,
    `budget:${payload.base.constraints.budgetGuard}`,
    `latency:${payload.base.constraints.latencyGuard}`,
    `trace:${payload.trace.length}`,
    `signature:${payload.meta.signature}`,
  ].join("|");
}
