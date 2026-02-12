import { CSSProperties } from "react";
import { GLASS_MOTION_TOKENS, GLASS_TOKENS, GlassTone } from "./glass.tokens";

export type GlassStyleOptions = {
  tone: GlassTone;
  offsetPx: number;
  scale: number;
  glowIntensity: number;
  compression: number;
  pointerActive: boolean;
  sealed: boolean;
  zIndex: number;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function opacityChannel(color: string, nextOpacity: number): string {
  const match = color.match(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/);
  if (!match) {
    return color;
  }
  return `rgba(${match[1].trim()}, ${match[2].trim()}, ${match[3].trim()}, ${nextOpacity.toFixed(3)})`;
}

function buildLayerShadow(options: GlassStyleOptions): string {
  const token = GLASS_TOKENS[options.tone];
  const outerOpacity = clamp(0.2 + options.glowIntensity * 0.42, 0.2, 0.86);
  const innerOpacity = clamp(0.18 + options.glowIntensity * 0.4, 0.18, 0.88);

  return [
    `0 18px 40px ${opacityChannel(token.outerShadow, outerOpacity)}`,
    `inset 0 0 0 1px ${opacityChannel(token.borderHighlight, clamp(0.2 + options.glowIntensity * 0.6, 0.2, 0.94))}`,
    `inset 0 0 ${Math.round(30 + options.glowIntensity * 64)}px ${opacityChannel(token.innerGlow, innerOpacity)}`,
  ].join(", ");
}

function resolveTransition(options: GlassStyleOptions): string {
  if (options.pointerActive) {
    return "none";
  }

  if (options.sealed) {
    return GLASS_MOTION_TOKENS.releaseTransition;
  }

  if (options.compression > 0.45) {
    return GLASS_MOTION_TOKENS.holdTransition;
  }

  return GLASS_MOTION_TOKENS.idleTransition;
}

export function resolveGlassLayerStyle(options: GlassStyleOptions): CSSProperties {
  const token = GLASS_TOKENS[options.tone];
  const blurAmount = token.blurPx + options.glowIntensity * 1.5;
  const scale = clamp(options.scale, 0.85, 1.1);

  return {
    zIndex: options.zIndex,
    transform: `translate3d(${options.offsetPx.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`,
    backdropFilter: `blur(${blurAmount.toFixed(2)}px)`,
    WebkitBackdropFilter: `blur(${blurAmount.toFixed(2)}px)`,
    borderColor: token.borderColor,
    background: `linear-gradient(142deg, ${token.gradientStart}, ${token.gradientEnd})`,
    boxShadow: buildLayerShadow(options),
    transition: resolveTransition(options),
    "--firstproof-glass-noise-opacity": `${clamp(
      token.noiseOpacity + options.glowIntensity * 0.08,
      0.06,
      0.44
    )}` as unknown as string,
    "--firstproof-glass-sheen-opacity": `${clamp(
      token.sheenOpacity + options.glowIntensity * 0.12,
      0.08,
      0.68
    )}` as unknown as string,
    "--firstproof-glass-edge-opacity": `${clamp(
      token.edgeOpacity + options.glowIntensity * 0.08,
      0.08,
      0.8
    )}` as unknown as string,
  } as CSSProperties;
}
