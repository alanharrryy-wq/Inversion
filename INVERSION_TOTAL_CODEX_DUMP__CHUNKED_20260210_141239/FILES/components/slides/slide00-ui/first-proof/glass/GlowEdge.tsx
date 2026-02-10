
import React from "react";

export function GlowEdge(props: {
  className?: string;
  intensity: number;
}) {
  const opacity = Math.min(0.86, 0.22 + props.intensity * 0.56);
  return (
    <span
      aria-hidden="true"
      className={props.className ?? "slide00-firstproof-glass-edge"}
      style={{ opacity }}
    />
  );
}

