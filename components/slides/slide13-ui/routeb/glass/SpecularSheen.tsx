import React from "react";
import { Slide13Snapshot } from "../slide13.types";
import { createSpecularStyle } from "./glass.helpers";

export function SpecularSheen(props: { snapshot: Slide13Snapshot }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 h-full rounded-[24px]"
      style={createSpecularStyle(props.snapshot)}
    >
      <div
        className="h-full w-full rounded-[24px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 14%, rgba(255,255,255,0.01) 54%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>
  );
}
