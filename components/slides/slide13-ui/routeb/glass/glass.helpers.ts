import { CSSProperties } from "react";
import { Slide13Snapshot } from "../slide13.types";
import { SLIDE13_GLASS_MODE, SLIDE13_GLASS_TOKENS } from "./glass.tokens";

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function resolveMode(snapshot: Slide13Snapshot): keyof typeof SLIDE13_GLASS_MODE {
  if (snapshot.sealed) return "sealed";
  if (snapshot.dragProgress > 0.04 || snapshot.holdProgress > 0.04) return "active";
  return "idle";
}

export function createGlassSurfaceStyle(snapshot: Slide13Snapshot): CSSProperties {
  const mode = resolveMode(snapshot);
  const modeTokens = SLIDE13_GLASS_MODE[mode];
  const borderOpacityBoost = clamp(snapshot.glow * 0.36, 0.08, 0.36);
  const overlayIntensity = clamp(0.48 + snapshot.totalProgress * 0.24, 0.5, 0.82);
  const baseScale = clamp(1 - snapshot.compression * 0.025, 0.976, 1);

  return {
    borderRadius: `${SLIDE13_GLASS_TOKENS.radiusLg}px`,
    border: `1px solid ${modeTokens.border}`,
    background: SLIDE13_GLASS_TOKENS.bgOverlay,
    boxShadow: [
      SLIDE13_GLASS_TOKENS.shadowDepth,
      SLIDE13_GLASS_TOKENS.shadowInset,
      `0 0 0 1px rgba(255, 255, 255, ${borderOpacityBoost})`,
      `0 0 ${Math.round(24 + snapshot.glow * 28)}px ${modeTokens.glow}`,
    ].join(", "),
    transform: `scale(${baseScale})`,
    opacity: overlayIntensity,
    transition: "transform 200ms ease, opacity 160ms linear, box-shadow 160ms linear, border-color 160ms linear",
  };
}

export function createGlassEdgeStyle(snapshot: Slide13Snapshot): CSSProperties {
  const mode = resolveMode(snapshot);
  const modeTokens = SLIDE13_GLASS_MODE[mode];
  const glow = clamp(0.2 + snapshot.glow * 0.7, 0.2, 1);
  return {
    borderColor: modeTokens.border,
    boxShadow: `0 0 ${Math.round(22 + glow * 22)}px ${modeTokens.glow}`,
    opacity: clamp(0.28 + glow * 0.54, 0.32, 0.92),
  };
}

export function createSpecularStyle(snapshot: Slide13Snapshot): CSSProperties {
  const width = clamp(28 + snapshot.dragProgress * 46, 30, 84);
  const opacity = clamp(0.14 + snapshot.totalProgress * 0.4, 0.16, 0.6);
  const x = clamp(4 + snapshot.thresholdNormalized * 78, 4, 84);
  return {
    width: `${width}%`,
    opacity,
    transform: `translateX(${x}px)`,
    transition: "transform 120ms linear, opacity 120ms linear, width 180ms ease",
  };
}
