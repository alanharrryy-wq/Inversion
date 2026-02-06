// components/SlideRuntime.ts
// Sliderenderer v2.3.0
// ESM-safe: exports explícitos + meta por slide

// =========================================================
// [B1] Tipos
// =========================================================
export type SlideRuntimeMeta = {
  // SCALER
  scalerLock?: boolean;        // congela scale después del primer cálculo útil
  scalerOverride?: number;     // fuerza scale fijo (ej 0.92)
  scalerMin?: number;          // clamp mínimo
  scalerMax?: number;          // clamp máximo

  // FX CONTROL
  heavyFxWhitelist?: boolean;  // permite heavyFx aunque Track esté ON
};

// =========================================================
// [B2] Defaults
// =========================================================
export const DEFAULT_SLIDE_META: SlideRuntimeMeta = {
  scalerLock: false,
  scalerOverride: undefined,
  scalerMin: 0.5,
  scalerMax: 1.0,
  heavyFxWhitelist: false,
};

// =========================================================
// [B3] Overrides por slide (0–19)
// Ajusta aquí sin tocar el resto del sistema
// =========================================================
export const SLIDE_META: Record<number, SlideRuntimeMeta> = {
  // Slides pesadas: congela scale
  4:  { scalerLock: true, heavyFxWhitelist: false },
  13: { scalerLock: true, heavyFxWhitelist: true },

  // Ejemplo: demo phone con scale fijo
  // 12: { scalerOverride: 0.92, scalerLock: true, heavyFxWhitelist: false },
};

// =========================================================
// [B4] Utilidades
// =========================================================
function isBrowser() {
  return typeof window !== "undefined" && typeof window.innerWidth === "number";
}

// =========================================================
// [B5] Mobile clamp (pantallas chicas)
// =========================================================
function applyMobileClamp(meta: SlideRuntimeMeta): SlideRuntimeMeta {
  if (!isBrowser()) return meta;

  const vw = window.innerWidth;

  // Umbral chido para tablet/cel
  if (vw < 900) {
    // evita que se vea gigante en móvil y que se vuelva microscópico
    meta.scalerMax = Math.min(meta.scalerMax ?? 1.0, 0.92);
    meta.scalerMin = Math.max(meta.scalerMin ?? 0.5, 0.62);
  }

  return meta;
}

// =========================================================
// [B6] Getter principal
// =========================================================
export function getSlideMeta(index: number): SlideRuntimeMeta {
  const meta: SlideRuntimeMeta = {
    ...DEFAULT_SLIDE_META,
    ...(SLIDE_META[index] || {}),
  };

  return applyMobileClamp(meta);
}

// =========================================================
// [B7] HeavyFX rule helper (Track whitelist)
// =========================================================
export function isHeavyFxAllowedForSlide(args: {
  heavyFxGlobal: boolean;
  track: boolean;
  slideIndex: number;
}): boolean {
  const meta = getSlideMeta(args.slideIndex);

  // Si global está apagado, no hay magia.
  if (!args.heavyFxGlobal) return false;

  // Si Track está OFF -> permitido
  if (!args.track) return true;

  // Track ON -> solo si whitelist
  return meta.heavyFxWhitelist === true;
}
