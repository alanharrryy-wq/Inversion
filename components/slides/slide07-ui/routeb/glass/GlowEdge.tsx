import React from "react";
import { buildGlowShadow } from "./glass.helpers";
import { resolveSlide07GlassTokens } from "./glass.tokens";

export function GlowEdge(props: {
  intensity: number;
  style?: React.CSSProperties;
}) {
  const tokens = resolveSlide07GlassTokens();

  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        borderRadius: tokens.radius,
        boxShadow: buildGlowShadow(tokens, props.intensity),
        ...props.style,
      }}
    />
  );
}
