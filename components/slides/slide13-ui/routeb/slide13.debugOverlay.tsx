import React from "react";
import { SLIDE13_COPY } from "./slide13.copy";
import { Slide13EmittedEvent, Slide13Snapshot, Slide13State } from "./slide13.types";

type Props = {
  snapshot: Slide13Snapshot;
  state: Slide13State;
  lastEvent: Slide13EmittedEvent | null;
};

export function Slide13DebugOverlay(props: Props) {
  if (!import.meta.env.DEV) return null;

  return (
    <aside className="absolute right-4 top-4 z-[20] max-w-[340px] rounded-xl border border-white/20 bg-black/70 px-3 py-3 text-[11px] text-white/85 backdrop-blur-sm">
      <p className="font-code text-[10px] uppercase tracking-[0.24em] text-cyan-100/70">
        {SLIDE13_COPY.debugTitle}
      </p>
      <p className="mt-1 text-[11px] text-white/70">{SLIDE13_COPY.debugHint}</p>

      <div className="mt-2 space-y-1 font-code text-[10px] tracking-[0.18em] text-white/75">
        <div>stage: {props.state.stage}</div>
        <div>pointer: {props.state.pointerActive ? "active" : "idle"}</div>
        <div>drag: {props.snapshot.dragProgress.toFixed(3)}</div>
        <div>hold: {props.snapshot.holdProgress.toFixed(3)}</div>
        <div>release: {props.snapshot.releaseProgress.toFixed(3)}</div>
        <div>rail: {props.snapshot.railIndex}</div>
        <div>seal: {props.snapshot.sealState}</div>
      </div>

      <div className="mt-2 rounded-md border border-white/15 bg-black/35 px-2 py-2">
        <p className="font-code text-[9px] uppercase tracking-[0.2em] text-white/65">last event</p>
        <p className="mt-1 break-all text-[10px] text-white/85">
          {props.lastEvent ? props.lastEvent.name : "none"}
        </p>
      </div>
    </aside>
  );
}
