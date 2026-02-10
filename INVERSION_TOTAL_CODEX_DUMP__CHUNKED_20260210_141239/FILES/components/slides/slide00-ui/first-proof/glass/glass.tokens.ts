
export type GlassTone = "front" | "mid" | "rear" | "seal";

export type GlassTokenSet = {
  borderColor: string;
  borderHighlight: string;
  gradientStart: string;
  gradientEnd: string;
  innerGlow: string;
  outerShadow: string;
  blurPx: number;
  noiseOpacity: number;
  sheenOpacity: number;
  edgeOpacity: number;
};

export const GLASS_TOKENS: Record<GlassTone, GlassTokenSet> = {
  rear: {
    borderColor: "rgba(107, 191, 219, 0.24)",
    borderHighlight: "rgba(154, 218, 242, 0.32)",
    gradientStart: "rgba(10, 34, 48, 0.76)",
    gradientEnd: "rgba(4, 18, 26, 0.88)",
    innerGlow: "rgba(60, 190, 223, 0.12)",
    outerShadow: "rgba(2, 8, 14, 0.42)",
    blurPx: 5,
    noiseOpacity: 0.17,
    sheenOpacity: 0.2,
    edgeOpacity: 0.3,
  },
  mid: {
    borderColor: "rgba(117, 211, 236, 0.34)",
    borderHighlight: "rgba(187, 238, 255, 0.44)",
    gradientStart: "rgba(10, 48, 64, 0.76)",
    gradientEnd: "rgba(6, 26, 37, 0.9)",
    innerGlow: "rgba(70, 220, 255, 0.16)",
    outerShadow: "rgba(2, 8, 14, 0.48)",
    blurPx: 8,
    noiseOpacity: 0.2,
    sheenOpacity: 0.26,
    edgeOpacity: 0.4,
  },
  front: {
    borderColor: "rgba(130, 225, 249, 0.52)",
    borderHighlight: "rgba(220, 249, 255, 0.64)",
    gradientStart: "rgba(20, 98, 130, 0.74)",
    gradientEnd: "rgba(8, 36, 50, 0.9)",
    innerGlow: "rgba(83, 236, 255, 0.28)",
    outerShadow: "rgba(1, 7, 13, 0.58)",
    blurPx: 11,
    noiseOpacity: 0.24,
    sheenOpacity: 0.35,
    edgeOpacity: 0.54,
  },
  seal: {
    borderColor: "rgba(95, 247, 200, 0.64)",
    borderHighlight: "rgba(204, 255, 233, 0.72)",
    gradientStart: "rgba(12, 78, 63, 0.7)",
    gradientEnd: "rgba(7, 38, 32, 0.92)",
    innerGlow: "rgba(91, 247, 198, 0.34)",
    outerShadow: "rgba(1, 13, 11, 0.66)",
    blurPx: 8,
    noiseOpacity: 0.16,
    sheenOpacity: 0.22,
    edgeOpacity: 0.6,
  },
};

export const GLASS_MOTION_TOKENS = {
  idleTransition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, box-shadow 220ms ease",
  holdTransition: "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease, box-shadow 180ms ease",
  releaseTransition: "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 210ms ease, box-shadow 260ms ease",
};

