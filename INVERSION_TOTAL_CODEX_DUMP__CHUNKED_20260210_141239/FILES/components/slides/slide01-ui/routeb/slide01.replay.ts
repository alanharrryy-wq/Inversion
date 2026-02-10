
import {
  createInitialSlide01State,
  deriveSlide01Snapshot,
  resolveSlide01Thresholds,
  SLIDE01_FAULT_CARDS,
  transitionSlide01State,
} from "./slide01.helpers";
import {
  Slide01FaultCardModel,
  Slide01ReplayFixture,
  Slide01ReplayResult,
  Slide01ReplayTraceEvent,
  Slide01Thresholds,
} from "./slide01.types";

const EVENT_PRIORITY: Record<Slide01ReplayTraceEvent["type"], number> = {
  entered: 0,
  pointer_down: 1,
  pointer_move: 2,
  hold_tick: 3,
  pointer_up: 4,
  pointer_cancel: 5,
  reset: 6,
};

function toTimestamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeNumber(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return value;
}

export function normalizeSlide01TraceEvent(
  traceEvent: Slide01ReplayTraceEvent
): Slide01ReplayTraceEvent {
  if (traceEvent.type === "entered" || traceEvent.type === "reset") {
    return {
      ...traceEvent,
      timestampMs: toTimestamp(traceEvent.timestampMs),
    };
  }

  if (traceEvent.type === "hold_tick") {
    return {
      ...traceEvent,
      deltaMs: Math.max(0, normalizeNumber(traceEvent.deltaMs, 0)),
      timestampMs: toTimestamp(traceEvent.timestampMs),
    };
  }

  return {
    ...traceEvent,
    pointerId: Math.max(1, Math.round(normalizeNumber(traceEvent.pointerId, 1))),
    x: normalizeNumber(traceEvent.x, 0),
    y: normalizeNumber(traceEvent.y, 0),
    timestampMs: toTimestamp(traceEvent.timestampMs),
  };
}

export function normalizeSlide01Trace(
  trace: Slide01ReplayTraceEvent[]
): Slide01ReplayTraceEvent[] {
  return [...trace]
    .map(normalizeSlide01TraceEvent)
    .sort((a, b) => {
      if (a.timestampMs !== b.timestampMs) return a.timestampMs - b.timestampMs;
      return EVENT_PRIORITY[a.type] - EVENT_PRIORITY[b.type];
    });
}

export type ReplaySlide01TraceOptions = {
  thresholds?: Partial<Slide01Thresholds>;
  faultCards?: Slide01FaultCardModel[];
};

export function replaySlide01Trace(
  trace: Slide01ReplayTraceEvent[],
  options: ReplaySlide01TraceOptions = {}
): Slide01ReplayResult {
  const thresholds = resolveSlide01Thresholds(options.thresholds);
  const faultCards = options.faultCards ?? SLIDE01_FAULT_CARDS;
  const normalizedTrace = normalizeSlide01Trace(trace);

  let state = createInitialSlide01State(thresholds);
  const emittedEvents: Slide01ReplayResult["emittedEvents"] = [];

  for (const event of normalizedTrace) {
    const transition = transitionSlide01State(state, event, thresholds, faultCards);
    state = transition.state;
    emittedEvents.push(...transition.events);
  }

  const snapshot = deriveSlide01Snapshot(state, thresholds);

  return {
    finalState: state,
    snapshot,
    emittedEvents,
    normalizedTrace,
  };
}

export function recordSlide01TraceEvent(
  trace: Slide01ReplayTraceEvent[],
  event: Slide01ReplayTraceEvent
): Slide01ReplayTraceEvent[] {
  return [...trace, normalizeSlide01TraceEvent(event)];
}

export function replaySlide01Fixture(
  fixture: Slide01ReplayFixture,
  options: ReplaySlide01TraceOptions = {}
): Slide01ReplayResult {
  return replaySlide01Trace(fixture.trace, options);
}

export function digestSlide01ReplayResult(result: Slide01ReplayResult): string {
  const events = result.emittedEvents.map((entry) => entry.name).join(" | ");
  return [
    "stage=" + result.snapshot.stage,
    "status=" + result.snapshot.sealStatus,
    "progress=" + Math.round(result.snapshot.totalProgress * 100) + "%",
    "events=" + events,
  ].join(" ; ");
}

