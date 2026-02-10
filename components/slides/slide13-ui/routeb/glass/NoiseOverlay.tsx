import React from "react";
import { Slide13Snapshot } from "../slide13.types";
import { SLIDE13_GLASS_TOKENS } from "./glass.tokens";

function createNoiseTile(): string {
  return [
    "linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08) 100%)",
    "linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.01) 45%, rgba(255,255,255,0.05) 100%)",
  ].join(",");
}

export function NoiseOverlay(props: { snapshot: Slide13Snapshot }) {
  const opacity = Math.min(
    0.18,
    SLIDE13_GLASS_TOKENS.noiseOpacity + props.snapshot.compression * 0.08
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[24px]"
      style={{
        opacity,
        backgroundImage: createNoiseTile(),
        backgroundSize: "22px 22px, 26px 26px",
        mixBlendMode: "screen",
      }}
    />
  );
}
