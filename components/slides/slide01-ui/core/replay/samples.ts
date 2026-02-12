import { createTraceEnvelope } from "./trace";

export const SAMPLE_TRACE_ROUTE_B = createTraceEnvelope([
  { kind: "pointerdown", seq: 1, x: 0.22, y: 0.44, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 2, x: 0.32, y: 0.51, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 3, x: 0.46, y: 0.61, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 4, x: 0.62, y: 0.72, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointerup", seq: 5, x: 0.82, y: 0.78, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
]);

export const SAMPLE_TRACE_ROUTE_A = createTraceEnvelope([
  { kind: "pointerdown", seq: 1, x: 0.74, y: 0.62, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 2, x: 0.58, y: 0.53, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 3, x: 0.39, y: 0.41, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointermove", seq: 4, x: 0.26, y: 0.30, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
  { kind: "pointerup", seq: 5, x: 0.12, y: 0.20, pointerId: 1, button: 0, targetId: "slide01-weigh-arena" },
]);
