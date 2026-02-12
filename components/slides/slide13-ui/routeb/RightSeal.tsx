import React from "react";
import { getSlide13SealLine, SLIDE13_COPY } from "./slide13.copy";
import { Slide13Snapshot } from "./slide13.types";

function tone(snapshot: Slide13Snapshot): string {
  if (snapshot.rightSealCollapsed) return "rgba(245, 193, 108, 0.92)";
  if (snapshot.frozen) return "rgba(109, 226, 245, 0.88)";
  return "rgba(196, 212, 220, 0.76)";
}

export function RightSeal(props: { snapshot: Slide13Snapshot }) {
  const textTone = tone(props.snapshot);
  return (
    <section
      data-testid="slide13-seal"
      data-sealed={props.snapshot.sealed ? "true" : "false"}
      className="rounded-2xl border border-white/15 bg-black/45 px-4 py-4"
      style={{
        opacity: props.snapshot.rightSealCollapsed ? 0.84 : 1,
        transform: props.snapshot.rightSealCollapsed ? "scale(0.96)" : "scale(1)",
        transition: "opacity 180ms linear, transform 180ms ease",
      }}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="font-code text-[11px] uppercase tracking-[0.24em] text-white/70">
          {SLIDE13_COPY.sealTitle}
        </p>
        <span
          className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-code uppercase tracking-[0.2em]"
          style={{ color: textTone }}
        >
          {props.snapshot.sealState}
        </span>
      </header>
      <p data-testid="slide13-seal-state" className="text-sm" style={{ color: textTone }}>
        {getSlide13SealLine(props.snapshot.sealState)}
      </p>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
        Rail index {props.snapshot.railIndex} / progress {Math.round(props.snapshot.totalProgress * 100)}%
      </div>
    </section>
  );
}
