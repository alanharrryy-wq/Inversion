import {
  SLIDE01_TRACE_SOURCE,
  SLIDE01_TRACE_VERSION,
} from "../fsm/constants";
import { clamp01, stableHash } from "../fsm/math";
import {
  Slide01PointerTraceEvent,
  Slide01TraceEnvelope,
} from "../fsm/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTraceKind(value: unknown): value is Slide01PointerTraceEvent["kind"] {
  return value === "pointerdown" || value === "pointermove" || value === "pointerup";
}

export function createTraceEnvelope(events: Slide01PointerTraceEvent[]): Slide01TraceEnvelope {
  return {
    version: SLIDE01_TRACE_VERSION,
    source: SLIDE01_TRACE_SOURCE,
    events,
  };
}

export function serializeTraceEnvelope(events: Slide01PointerTraceEvent[]): string {
  const envelope = createTraceEnvelope(events);
  return JSON.stringify(envelope, null, 2);
}

export function validateTraceEnvelope(payload: unknown): {
  ok: true;
  envelope: Slide01TraceEnvelope;
} | {
  ok: false;
  message: string;
} {
  if (!isObject(payload)) {
    return { ok: false, message: "Replay error: invalid trace envelope." };
  }
  if (payload.version !== SLIDE01_TRACE_VERSION) {
    return { ok: false, message: "Replay error: invalid trace version." };
  }
  if (payload.source !== SLIDE01_TRACE_SOURCE) {
    return { ok: false, message: "Replay error: invalid trace source." };
  }
  if (!Array.isArray(payload.events)) {
    return { ok: false, message: "Replay error: invalid trace events." };
  }

  const events: Slide01PointerTraceEvent[] = [];
  let previousSeq = 0;
  for (let index = 0; index < payload.events.length; index += 1) {
    const entry = payload.events[index];
    if (!isObject(entry)) {
      return { ok: false, message: "Replay error: invalid trace event object." };
    }
    if (!isTraceKind(entry.kind)) {
      return { ok: false, message: "Replay error: unsupported pointer kind." };
    }
    if (typeof entry.seq !== "number" || !Number.isFinite(entry.seq)) {
      return { ok: false, message: "Replay error: invalid sequence." };
    }
    if (entry.seq <= previousSeq) {
      return { ok: false, message: "Replay error: invalid sequence order." };
    }
    if (typeof entry.x !== "number" || typeof entry.y !== "number") {
      return { ok: false, message: "Replay error: invalid normalized coordinates." };
    }
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y)) {
      return { ok: false, message: "Replay error: invalid normalized coordinates." };
    }
    if (typeof entry.pointerId !== "number" || !Number.isFinite(entry.pointerId)) {
      return { ok: false, message: "Replay error: invalid pointer id." };
    }
    if (typeof entry.button !== "number" || !Number.isFinite(entry.button)) {
      return { ok: false, message: "Replay error: invalid button id." };
    }
    if (typeof entry.targetId !== "string" || entry.targetId.length === 0) {
      return { ok: false, message: "Replay error: invalid target id." };
    }

    events.push({
      kind: entry.kind,
      seq: entry.seq,
      x: clamp01(entry.x),
      y: clamp01(entry.y),
      pointerId: entry.pointerId,
      button: entry.button,
      targetId: entry.targetId,
    });
    previousSeq = entry.seq;
  }

  return {
    ok: true,
    envelope: createTraceEnvelope(events),
  };
}

export function parseTraceEnvelope(text: string):
  | { ok: true; envelope: Slide01TraceEnvelope; envelopeHash: string }
  | { ok: false; message: string } {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (_error) {
    return { ok: false, message: "Replay error: invalid JSON." };
  }

  const validated = validateTraceEnvelope(payload);
  if ("message" in validated) {
    return {
      ok: false,
      message: validated.message,
    };
  }

  const normalizedText = JSON.stringify(validated.envelope);
  return {
    ok: true,
    envelope: validated.envelope,
    envelopeHash: stableHash(normalizedText),
  };
}
