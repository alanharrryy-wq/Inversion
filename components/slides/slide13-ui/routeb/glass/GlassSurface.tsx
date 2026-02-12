import React from "react";
import { Slide13Snapshot } from "../slide13.types";
import { createGlassSurfaceStyle } from "./glass.helpers";
import { GlowEdge } from "./GlowEdge";
import { NoiseOverlay } from "./NoiseOverlay";
import { SpecularSheen } from "./SpecularSheen";

export function GlassSurface(props: {
  snapshot: Slide13Snapshot;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${props.className ?? ""}`} style={createGlassSurfaceStyle(props.snapshot)}>
      <SpecularSheen snapshot={props.snapshot} />
      <NoiseOverlay snapshot={props.snapshot} />
      <GlowEdge snapshot={props.snapshot} />
      <div className="relative z-[2]">{props.children}</div>
    </div>
  );
}
