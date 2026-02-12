
import { Slide07GlassTokens } from "./glass.tokens";

export function clampGlassValue(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function withGlassAlpha(rgb: string, alpha: number): string {
  if (!rgb.startsWith("rgb(") || !rgb.endsWith(")")) {
    return rgb;
  }

  const channels = rgb
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((channel) => Number(channel.trim()));

  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return rgb;
  }

  return `rgba(${channels.join(", ")}, ${clampGlassValue(alpha, 0, 1)})`;
}

export function buildGlowShadow(tokens: Slide07GlassTokens, intensity: number): string {
  const normalized = clampGlassValue(intensity, 0, 1);
  const strength = 14 + normalized * 38;
  return `0 0 ${Math.round(strength)}px ${tokens.glowColor}`;
}

export function buildNoiseGradient(opacity: number): string {
  const alpha = clampGlassValue(opacity, 0, 0.2);
  return `repeating-linear-gradient(0deg, rgba(255,255,255,${alpha.toFixed(
    3
  )}) 0 1px, rgba(0,0,0,0) 1px 3px)`;
}

