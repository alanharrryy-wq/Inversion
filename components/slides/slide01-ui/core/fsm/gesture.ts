import { EMPTY_METRICS } from "./constants";
import { clamp01, distance, round } from "./math";
import { GestureMetrics, GestureSample, Slide01PointerTraceEvent } from "./types";

export function buildGestureSample(
  event: Slide01PointerTraceEvent,
  previous: GestureSample | null
): GestureSample {
  const prevX = previous?.x ?? event.x;
  const prevY = previous?.y ?? event.y;
  const dx = event.x - prevX;
  const dy = event.y - prevY;
  const stepDistance = distance(prevX, prevY, event.x, event.y);
  return {
    seq: event.seq,
    kind: event.kind,
    x: event.x,
    y: event.y,
    pointerId: event.pointerId,
    targetId: event.targetId,
    button: event.button,
    dx,
    dy,
    distance: stepDistance,
  };
}

export function computeGestureMetrics(samples: GestureSample[]): GestureMetrics {
  if (samples.length === 0) return EMPTY_METRICS;

  let totalDistance = 0;
  let horizontalTravel = 0;
  let verticalTravel = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  let jitter = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    totalDistance += sample.distance;
    horizontalTravel += Math.abs(sample.dx);
    verticalTravel += Math.abs(sample.dy);
    sumX += sample.x;
    sumY += sample.y;
    minX = Math.min(minX, sample.x);
    maxX = Math.max(maxX, sample.x);
    minY = Math.min(minY, sample.y);
    maxY = Math.max(maxY, sample.y);

    if (index >= 2) {
      const prev = samples[index - 1];
      jitter += Math.abs(sample.dx - prev.dx) + Math.abs(sample.dy - prev.dy);
    }
  }

  const sampleCount = samples.length;
  const meanX = sumX / sampleCount;
  const meanY = sumY / sampleCount;
  const spreadX = maxX - minX;
  const spreadY = maxY - minY;
  const momentum = clamp01(totalDistance / 2.4);
  const jitterNorm = clamp01(jitter / Math.max(0.25, totalDistance * 4));
  const stability = clamp01(1 - jitterNorm);
  const commitment = clamp01(sampleCount / 45 + totalDistance * 0.15);
  const urgency = clamp01(
    0.42 + (0.5 - meanY) * 0.8 + (1 - commitment) * 0.3 + momentum * 0.2 - stability * 0.12
  );
  const biasRight = clamp01((meanX - 0.5) * 1.8 + 0.5);
  const deliberation = clamp01(stability * 0.55 + commitment * 0.45);

  return {
    sampleCount,
    totalDistance: round(totalDistance),
    horizontalTravel: round(horizontalTravel),
    verticalTravel: round(verticalTravel),
    meanX: round(meanX),
    meanY: round(meanY),
    spreadX: round(spreadX),
    spreadY: round(spreadY),
    momentum: round(momentum),
    stability: round(stability),
    commitment: round(commitment),
    urgency: round(urgency),
    biasRight: round(biasRight),
    deliberation: round(deliberation),
  };
}

export function movementFromStart(
  start: { x: number; y: number } | null,
  current: { x: number; y: number } | null
): number {
  if (!start || !current) return 0;
  return Math.abs(current.x - start.x) + Math.abs(current.y - start.y);
}
