import React from "react";
import { KpiDashboard } from "../../../widgets/kpi/KpiDashboard";
import { SLIDE13_COPY } from "./slide13.copy";
import { Slide13GestureHandlers, Slide13Snapshot, Slide13Thresholds } from "./slide13.types";
import { GlassSurface } from "./glass/GlassSurface";

function thresholdMarkerLeft(snapshot: Slide13Snapshot): string {
  return `${Math.round(snapshot.thresholdNormalized * 100)}%`;
}

export function KpiSurface(props: {
  snapshot: Slide13Snapshot;
  thresholds: Slide13Thresholds;
  gestureHandlers: Slide13GestureHandlers;
}) {
  return (
    <GlassSurface snapshot={props.snapshot} className="h-[560px] min-h-[560px] w-full">
      <div className="relative h-[560px] min-h-[560px] w-full">
        <div className="absolute inset-0 z-[1]">
          <KpiDashboard />
        </div>

        <div
          className="absolute inset-0 z-[2] rounded-[24px]"
          data-testid="slide13-gesture-drag"
          onPointerDown={props.gestureHandlers.onPointerDown}
          onPointerMove={props.gestureHandlers.onPointerMove}
          onPointerUp={props.gestureHandlers.onPointerUp}
          onPointerCancel={props.gestureHandlers.onPointerCancel}
          style={{
            cursor: props.snapshot.pointerActive ? "grabbing" : "grab",
            background:
              "radial-gradient(circle at 68% 14%, rgba(96, 203, 233, 0.08), rgba(0,0,0,0) 42%)",
            touchAction: "none",
          }}
          aria-label={SLIDE13_COPY.thresholdHint}
        />

        <div className="pointer-events-none absolute left-6 right-6 top-6 z-[3]">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-black/45 px-4 py-2">
            <div>
              <p className="font-code text-[10px] uppercase tracking-[0.24em] text-white/70">
                {SLIDE13_COPY.thresholdLabel}
              </p>
              <p className="text-xs text-white/65">{SLIDE13_COPY.thresholdHint}</p>
            </div>
            <div className="text-right">
              <p className="font-code text-[10px] uppercase tracking-[0.2em] text-cyan-100/75">
                drag {Math.round(props.snapshot.dragProgress * 100)}%
              </p>
              <p className="font-code text-[10px] uppercase tracking-[0.2em] text-cyan-100/75">
                hold {Math.round(props.snapshot.holdProgress * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5 left-6 right-6 z-[3]">
          <div className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-code text-[10px] uppercase tracking-[0.2em] text-white/70">
                threshold rail
              </p>
              <p className="font-code text-[10px] uppercase tracking-[0.2em] text-white/70">
                {Math.round(props.snapshot.thresholdNormalized * 100)}%
              </p>
            </div>
            <div className="relative h-4 rounded-full border border-white/10 bg-black/60">
              <div
                className="absolute bottom-0 left-0 top-0 rounded-full"
                style={{
                  width: thresholdMarkerLeft(props.snapshot),
                  background:
                    "linear-gradient(90deg, rgba(109,226,245,0.65), rgba(109,226,245,0.18))",
                }}
              />
              <div
                className="absolute -top-[7px] h-7 w-[14px] -translate-x-1/2 rounded-md border border-cyan-100/60 bg-cyan-100/20 shadow-[0_0_18px_rgba(109,226,245,0.45)]"
                style={{
                  left: thresholdMarkerLeft(props.snapshot),
                }}
              />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-code uppercase tracking-[0.2em] text-white/65">
              <div data-testid="slide13-gesture-hold" className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                freeze {props.snapshot.frozen ? "on" : "off"}
              </div>
              <div
                data-testid="slide13-gesture-release"
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1"
              >
                release {Math.round(props.snapshot.releaseProgress * 100)}%
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                rail {props.snapshot.railIndex + 1}/{props.thresholds.railStepCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassSurface>
  );
}
