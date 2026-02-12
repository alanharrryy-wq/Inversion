import type { CSSProperties } from 'react';
import { colorVarEntries, DensityPreset, resolveColorScale } from './colors';
import { resolveShadowScale, shadowVarEntries } from './shadows';
import { resolveSpacingScale, spacingVarEntries } from './spacing';
import { resolveTypographyScale, typographyVarEntries } from './typography';

export type TokenVarRecord = Record<`--${string}`, string>;

export type TokenBuildInput = {
  preset: DensityPreset;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  compactViewport: boolean;
};

function safeNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  if (value <= 0) return fallback;
  return value;
}

function mergeEntries(entries: Array<Array<[string, string]>>): TokenVarRecord {
  const vars: Record<string, string> = {};

  for (const group of entries) {
    for (const [key, value] of group) {
      vars[key] = value;
    }
  }

  return vars as TokenVarRecord;
}

function densityToGlowIntensity(preset: DensityPreset): string {
  if (preset === 'ultra-compact') return '0.55';
  if (preset === 'compact') return '0.68';
  if (preset === 'balanced') return '0.78';
  if (preset === 'comfortable') return '0.88';
  return '0.96';
}

function densityToOpacity(preset: DensityPreset): string {
  if (preset === 'ultra-compact') return '0.8';
  if (preset === 'compact') return '0.84';
  if (preset === 'balanced') return '0.86';
  if (preset === 'comfortable') return '0.88';
  return '0.9';
}

function densityToBlur(preset: DensityPreset): string {
  if (preset === 'ultra-compact') return '10px';
  if (preset === 'compact') return '14px';
  if (preset === 'balanced') return '18px';
  if (preset === 'comfortable') return '20px';
  return '22px';
}

function viewportToRadius(width: number, height: number): string {
  const shortest = Math.min(width, height);
  if (shortest < 620) return '14px';
  if (shortest < 760) return '16px';
  if (shortest < 980) return '20px';
  return '26px';
}

function viewportToGridSize(width: number): string {
  if (width < 960) return '44px 44px';
  if (width < 1200) return '54px 54px';
  if (width < 1440) return '62px 62px';
  return '72px 72px';
}

function viewportToDockWidth(width: number, compactViewport: boolean): string {
  if (compactViewport) return 'min(420px, calc(100vw - 24px))';
  if (width < 1280) return 'min(440px, calc(100vw - 30px))';
  return 'var(--boot-dock-width)';
}

function viewportToSideMaxHeight(height: number): string {
  if (height < 700) return '352px';
  if (height < 800) return '398px';
  if (height < 900) return '430px';
  return 'var(--boot-side-max-height)';
}

export function buildSlide00TokenVars(input: TokenBuildInput): TokenVarRecord {
  const preset = input.preset;
  const width = safeNumber(input.width, 1600);
  const height = safeNumber(input.height, 900);
  const scaleX = safeNumber(input.scaleX, 1);
  const scaleY = safeNumber(input.scaleY, 1);

  const colors = resolveColorScale(preset);
  const spacing = resolveSpacingScale(preset);
  const typography = resolveTypographyScale(preset);
  const shadows = resolveShadowScale(preset);

  const derived: Array<[string, string]> = [
    ['--boot-token-glow-intensity', densityToGlowIntensity(preset)],
    ['--boot-token-surface-opacity', densityToOpacity(preset)],
    ['--boot-token-blur-amount', densityToBlur(preset)],
    ['--boot-shell-radius', viewportToRadius(width, height)],
    ['--boot-grid-size', viewportToGridSize(width)],
    ['--boot-side-scroll-max-height', viewportToSideMaxHeight(height)],
    ['--boot-fit-width', `${Math.round(width)}px`],
    ['--boot-fit-height', `${Math.round(height)}px`],
    ['--boot-fit-scale-x', scaleX.toFixed(4)],
    ['--boot-fit-scale-y', scaleY.toFixed(4)],
    ['--boot-fit-shortest-side', `${Math.round(Math.min(width, height))}px`],
    ['--boot-fit-longest-side', `${Math.round(Math.max(width, height))}px`],
    ['--boot-fit-aspect', (width / height).toFixed(4)],
    ['--boot-fit-dock-width', viewportToDockWidth(width, input.compactViewport)],
    ['--boot-fit-panel-min-height', input.compactViewport ? '0px' : '420px'],
    ['--boot-fit-main-scroll', input.compactViewport ? 'visible' : 'hidden'],
    ['--boot-fit-side-scroll', input.compactViewport ? 'auto' : 'auto'],
    ['--boot-fit-transition', '180ms ease'],
  ];

  return mergeEntries([
    colorVarEntries(colors),
    spacingVarEntries(spacing),
    typographyVarEntries(typography),
    shadowVarEntries(shadows),
    derived,
  ]);
}

export function varsToCssProperties(vars: TokenVarRecord): CSSProperties {
  return vars as CSSProperties;
}

export { resolveColorScale } from './colors';
export type { ColorScale, DensityPreset } from './colors';
export { resolveSpacingScale } from './spacing';
export type { SpacingScale } from './spacing';
export { resolveTypographyScale } from './typography';
export type { TypographyScale } from './typography';
export { resolveShadowScale } from './shadows';
export type { ShadowScale } from './shadows';
