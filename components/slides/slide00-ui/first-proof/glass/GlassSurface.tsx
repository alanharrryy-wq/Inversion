import React from "react";
import { resolveGlassLayerStyle } from "./glass.helpers";
import { GlassTone } from "./glass.tokens";
import { GlowEdge } from "./GlowEdge";
import { NoiseOverlay } from "./NoiseOverlay";
import { SpecularSheen } from "./SpecularSheen";

export function GlassSurface(props: {
  tone: GlassTone;
  offsetPx: number;
  scale: number;
  glowIntensity: number;
  compression: number;
  pointerActive: boolean;
  sealed: boolean;
  zIndex: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const style = resolveGlassLayerStyle({
    tone: props.tone,
    offsetPx: props.offsetPx,
    scale: props.scale,
    glowIntensity: props.glowIntensity,
    compression: props.compression,
    pointerActive: props.pointerActive,
    sealed: props.sealed,
    zIndex: props.zIndex,
  });

  return (
    <div className={props.className ?? "slide00-firstproof-glass-layer"} style={style}>
      <SpecularSheen intensity={props.glowIntensity} />
      <NoiseOverlay intensity={props.glowIntensity} />
      <GlowEdge intensity={props.glowIntensity} />
      {props.children}
    </div>
  );
}
