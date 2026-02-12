
import React from "react";
import { SLIDE13_COPY } from "./slide13.copy";
import { Slide13Snapshot } from "./slide13.types";

function toneForStatus(status: "locked" | "active" | "complete"): string {
  if (status === "complete") return "rgba(109, 226, 245, 0.9)";
  if (status === "active") return "rgba(169, 222, 240, 0.68)";
  return "rgba(126, 151, 164, 0.36)";
}

export function KpiRail(props: { snapshot: Slide13Snapshot }) {
  return (
    <section
      className="rounded-2xl border border-white/15 bg-black/35 p-5"
      data-testid="slide13-rail"
      aria-label={SLIDE13_COPY.railTitle}
    >
      <header className="mb-4">
        <p className="font-code text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
          {SLIDE13_COPY.railTitle}
        </p>
        <p className="mt-1 text-sm text-white/70">{SLIDE13_COPY.railSubtitle}</p>
      </header>

      <ol className="space-y-3">
        {props.snapshot.steps.map((step) => (
          <li
            key={step.key}
            data-testid={`slide13-rail-step-${step.key}`}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-3"
            data-status={step.status}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-code text-[11px] uppercase tracking-[0.24em] text-white/80">
                  {SLIDE13_COPY.steps[step.key].label}
                </p>
                <p className="text-xs text-white/60">{SLIDE13_COPY.steps[step.key].detail}</p>
              </div>
              <span
                className="font-code text-[10px] uppercase tracking-[0.22em]"
                style={{ color: toneForStatus(step.status) }}
              >
                {step.status}
              </span>
            </div>
            <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full origin-left rounded-full"
                style={{
                  transform: `scaleX(${step.progress})`,
                  background: `linear-gradient(90deg, rgba(109,226,245,0.72), ${toneForStatus(step.status)})`,
                }}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-code uppercase tracking-[0.2em] text-white/65">
        <div
          data-testid="slide13-rail-gesture-drag"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          Drag {Math.round(props.snapshot.dragProgress * 100)}%
        </div>
        <div
          data-testid="slide13-rail-gesture-hold"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          Hold {Math.round(props.snapshot.holdProgress * 100)}%
        </div>
        <div
          data-testid="slide13-rail-gesture-release"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          Release {Math.round(props.snapshot.releaseProgress * 100)}%
        </div>
      </div>
    </section>
  );
}

