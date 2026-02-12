import React from "react";

export function SpecularSheen(props: {
  className?: string;
  intensity: number;
}) {
  const opacity = Math.min(0.78, 0.18 + props.intensity * 0.42);
  return (
    <span
      aria-hidden="true"
      className={props.className ?? "slide00-firstproof-glass-sheen"}
      style={{ opacity }}
    />
  );
}
