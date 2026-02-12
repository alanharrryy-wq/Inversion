import React from "react";
import { SLIDE13_COPY, getSlide13ProgressNarrative } from "./slide13.copy";
import { KpiRail } from "./KpiRail";
import { KpiSurface } from "./KpiSurface";
import { RightSeal } from "./RightSeal";
import { Slide13DebugOverlay } from "./slide13.debugOverlay";
import { Slide13EmittedEvent, Slide13Thresholds } from "./slide13.types";
import { useKpiRitual } from "./useKpiRitual";

export function KpiRitual(props: {
  thresholds?: Partial<Slide13Thresholds>;
  onEmitEvent?: (event: Slide13EmittedEvent) => void;
}) {
  const ritual = useKpiRitual({
    thresholds: props.thresholds,
    onEmitEvent: props.onEmitEvent,
  });

  return (
    <section data-testid="slide13-root" className="relative flex h-full w-full flex-col gap-4 px-10 pb-20">
      <header className="rounded-2xl border border-white/15 bg-black/35 px-5 py-4">
        <p className="font-code text-[11px] uppercase tracking-[0.24em] text-white/70">
          {SLIDE13_COPY.ritualTitle}
        </p>
        <p className="mt-1 text-sm text-white/75">{SLIDE13_COPY.ritualSubtitle}</p>
        <p className="mt-2 text-xs text-white/60">
          {getSlide13ProgressNarrative(ritual.snapshot.totalProgress)}
        </p>
      </header>

      <div className="grid min-h-[560px] grid-cols-[1.65fr_0.9fr] gap-4">
        <KpiSurface
          snapshot={ritual.snapshot}
          thresholds={ritual.thresholds}
          gestureHandlers={ritual.gestureHandlers}
        />

        <div className="flex h-full flex-col gap-4">
          <KpiRail snapshot={ritual.snapshot} />
          <RightSeal snapshot={ritual.snapshot} />
        </div>
      </div>

      <Slide13DebugOverlay
        state={ritual.state}
        snapshot={ritual.snapshot}
        lastEvent={ritual.lastEmittedEvent}
      />
    </section>
  );
}
