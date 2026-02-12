
import { CSSProperties } from "react";
import { SLIDE01_GLASS_TOKENS } from "./glass.tokens";

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function withOpacity(rgb: string, opacity: number): string {
  const safeOpacity = clamp(opacity, 0, 1);
  return "rgba(" + rgb + "," + safeOpacity.toFixed(3) + ")";
}

export function buildGlassShadow(glowIntensity: number): string {
  const glow = clamp(glowIntensity, 0, 1);
  const outer =
    "0 0 " +
    Math.round(38 + glow * 22) +
    "px rgba(95,198,255," +
    (0.12 + glow * 0.2).toFixed(3) +
    ")";
  return [SLIDE01_GLASS_TOKENS.shadow, SLIDE01_GLASS_TOKENS.innerShadow, outer].join(", ");
}

export function buildGlassSurfaceStyle(
  glowIntensity: number,
  extra?: CSSProperties
): CSSProperties {
  return {
    borderRadius: SLIDE01_GLASS_TOKENS.radius,
    border: SLIDE01_GLASS_TOKENS.border,
    background: SLIDE01_GLASS_TOKENS.surfaceBg,
    boxShadow: buildGlassShadow(glowIntensity),
    overflow: "hidden",
    position: "relative",
    ...extra,
  };
}

