
import React from "react";
import { buildNoiseGradient } from "./glass.helpers";
import { resolveSlide07GlassTokens } from "./glass.tokens";

export function NoiseOverlay(props: { opacity?: number; style?: React.CSSProperties }) {
  const tokens = resolveSlide07GlassTokens();
  const opacity = props.opacity ?? tokens.noiseOpacity;

  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        borderRadius: tokens.radius,
        opacity,
        backgroundImage: buildNoiseGradient(opacity),
        mixBlendMode: "overlay",
        ...props.style,
      }}
    />
  );
}

