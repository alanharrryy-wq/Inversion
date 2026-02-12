import React from "react";
import { Slide01State, SLIDE01_TEST_IDS } from "../../core/fsm";
import { MetricBar } from "../atoms/MetricBar";
import { PanelFrame } from "../atoms/PanelFrame";

type WeighPanelProps = {
  state: Slide01State;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export const WeighPanel: React.FC<WeighPanelProps> = ({
  state,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) => {
  const current = state.pointerCurrent;
  const start = state.gestureStart;
  const hasPointer = !!current;
  const pointerStyle = hasPointer
    ? {
        left: `${(current?.x ?? 0.5) * 100}%`,
        top: `${(current?.y ?? 0.5) * 100}%`,
      }
    : undefined;
  const startStyle = start
    ? {
        left: `${start.x * 100}%`,
        top: `${start.y * 100}%`,
      }
    : undefined;

  return (
    <PanelFrame
      testId={SLIDE01_TEST_IDS.weighPanel}
      title="Gesture Weighing"
      subtitle="Click and drag to weigh criteria. Release pointer to commit deterministic route selection."
      className="h-full"
    >
      <p
        data-testid={SLIDE01_TEST_IDS.weighInstruction}
        className="mb-3 text-sm leading-relaxed text-white/75"
      >
        Horizontal movement influences route direction. Stable and deeper gestures bias long-term governance criteria.
      </p>

      <div
        data-testid={SLIDE01_TEST_IDS.weighArena}
        className="relative h-56 select-none overflow-hidden rounded-xl border border-white/20 bg-black/45 md:h-64"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          data-testid={SLIDE01_TEST_IDS.weighArenaGrid}
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px]"
        />
        <div
          data-testid={SLIDE01_TEST_IDS.weighAxisX}
          className="absolute left-2 right-2 top-1/2 h-[1px] bg-white/25"
        />
        <div
          data-testid={SLIDE01_TEST_IDS.weighAxisY}
          className="absolute bottom-2 top-2 left-1/2 w-[1px] bg-white/25"
        />
        {start ? (
          <div
            data-testid={SLIDE01_TEST_IDS.pointerStartDot}
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-transparent"
            style={startStyle}
          />
        ) : null}
        {hasPointer ? (
          <div
            data-testid={SLIDE01_TEST_IDS.pointerDot}
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300 bg-cyan-300/40 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
            style={pointerStyle}
          />
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        <MetricBar
          testId={SLIDE01_TEST_IDS.liveBias}
          label="Bias Right"
          value={state.metrics.biasRight * 100}
          accent="blue"
        />
        <MetricBar
          testId={SLIDE01_TEST_IDS.liveDeliberation}
          label="Deliberation"
          value={state.metrics.deliberation * 100}
          accent="green"
        />
        <MetricBar
          testId={SLIDE01_TEST_IDS.liveUrgency}
          label="Urgency"
          value={state.metrics.urgency * 100}
          accent="amber"
        />
        <MetricBar
          testId={SLIDE01_TEST_IDS.liveSamples}
          label="Sample Density"
          value={Math.min(100, state.metrics.sampleCount * 5)}
          accent="cyan"
        />
      </div>
    </PanelFrame>
  );
};
