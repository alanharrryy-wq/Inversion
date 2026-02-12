import { clamp01, round } from "../fsm/math";
import { Slide01PointerTraceEvent } from "../fsm/types";

export interface NormalizedPointerInput {
  kind: Slide01PointerTraceEvent["kind"];
  clientX: number;
  clientY: number;
  pointerId: number;
  button: number;
  seq: number;
  targetId: string;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export function toNormalizedPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0.5, y: 0.5 };
  }
  const x = clamp01((clientX - rect.left) / rect.width);
  const y = clamp01((clientY - rect.top) / rect.height);
  return {
    x: round(x, 6),
    y: round(y, 6),
  };
}

export function buildTraceEvent(input: NormalizedPointerInput): Slide01PointerTraceEvent {
  const point = toNormalizedPoint(input.clientX, input.clientY, input.rect);
  return {
    kind: input.kind,
    seq: input.seq,
    x: point.x,
    y: point.y,
    pointerId: input.pointerId,
    button: input.button,
    targetId: input.targetId,
  };
}
