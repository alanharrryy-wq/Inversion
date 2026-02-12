
import React from "react";
import { Slide13Snapshot } from "../slide13.types";
import { createGlassEdgeStyle } from "./glass.helpers";

export function GlowEdge(props: { snapshot: Slide13Snapshot }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[24px] border"
      style={createGlassEdgeStyle(props.snapshot)}
    />
  );
}

