import React from "react";

export type Slide07GlassTokens = {
  radius: number;
  borderColor: string;
  backgroundTop: string;
  backgroundBottom: string;
  shadowOuter: string;
  shadowInner: string;
  glowColor: string;
  noiseOpacity: number;
  sheenOpacity: number;
};

export const SLIDE07_GLASS_TOKENS: Slide07GlassTokens = {
  radius: 18,
  borderColor: "rgba(109, 198, 232, 0.34)",
  backgroundTop: "rgba(12, 30, 44, 0.82)",
  backgroundBottom: "rgba(6, 15, 24, 0.9)",
  shadowOuter: "0 18px 42px rgba(2, 8, 12, 0.54)",
  shadowInner: "inset 0 0 0 1px rgba(149, 228, 255, 0.14)",
  glowColor: "rgba(90, 222, 255, 0.56)",
  noiseOpacity: 0.08,
  sheenOpacity: 0.36,
};

export function resolveSlide07GlassTokens(
  overrides?: Partial<Slide07GlassTokens>
): Slide07GlassTokens {
  if (!overrides) {
    return SLIDE07_GLASS_TOKENS;
  }

  return {
    ...SLIDE07_GLASS_TOKENS,
    ...overrides,
  };
}

export function toSlide07GlassStyle(tokens: Slide07GlassTokens): React.CSSProperties {
  return {
    borderRadius: tokens.radius,
    border: `1px solid ${tokens.borderColor}`,
    background: `linear-gradient(180deg, ${tokens.backgroundTop}, ${tokens.backgroundBottom})`,
    boxShadow: `${tokens.shadowOuter}, ${tokens.shadowInner}`,
  };
}
