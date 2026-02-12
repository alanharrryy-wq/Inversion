
export type Slide13GlassTokens = {
  radiusLg: number;
  radiusMd: number;
  borderStrong: string;
  borderSoft: string;
  bgBase: string;
  bgOverlay: string;
  glowColor: string;
  glowColorWarm: string;
  textStrong: string;
  textSoft: string;
  shadowDepth: string;
  shadowInset: string;
  noiseOpacity: number;
};

export const SLIDE13_GLASS_TOKENS: Slide13GlassTokens = {
  radiusLg: 24,
  radiusMd: 16,
  borderStrong: "rgba(109, 226, 245, 0.42)",
  borderSoft: "rgba(153, 192, 214, 0.18)",
  bgBase: "rgba(3, 12, 18, 0.72)",
  bgOverlay: "linear-gradient(140deg, rgba(117, 207, 238, 0.09) 0%, rgba(18, 32, 48, 0.24) 42%, rgba(2, 6, 10, 0.78) 100%)",
  glowColor: "rgba(46, 207, 238, 0.38)",
  glowColorWarm: "rgba(245, 189, 96, 0.34)",
  textStrong: "rgba(241, 250, 255, 0.94)",
  textSoft: "rgba(186, 214, 226, 0.84)",
  shadowDepth: "0 18px 48px rgba(0, 0, 0, 0.42)",
  shadowInset: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
  noiseOpacity: 0.08,
};

export const SLIDE13_GLASS_MODE = {
  idle: {
    border: "rgba(143, 178, 196, 0.22)",
    glow: "rgba(59, 154, 186, 0.22)",
  },
  active: {
    border: "rgba(131, 227, 246, 0.42)",
    glow: "rgba(42, 210, 248, 0.35)",
  },
  sealed: {
    border: "rgba(245, 194, 110, 0.46)",
    glow: "rgba(245, 177, 85, 0.4)",
  },
} as const;

