
import React from "react";
import { resolveSlide07GlassTokens } from "./glass.tokens";

export function SpecularSheen(props: { strength: number; style?: React.CSSProperties }) {
  const tokens = resolveSlide07GlassTokens();
  const opacity = Math.max(0, Math.min(1, props.strength)) * tokens.sheenOpacity;

  return (
    <div
      aria-hidden="true"
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        borderRadius: tokens.radius,
        background: `radial-gradient(420px 180px at 24% 0%, rgba(255,255,255,${opacity.toFixed(
          3
        )}), rgba(255,255,255,0) 65%)`,
        ...props.style,
      }}
    />
  );
}

