import React from "react";

export function NoiseOverlay(props: {
  className?: string;
  intensity: number;
}) {
  const opacity = Math.min(0.44, 0.08 + props.intensity * 0.24);
  return (
    <span
      aria-hidden="true"
      className={props.className ?? "slide00-firstproof-glass-noise"}
      style={{ opacity }}
    />
  );
}
