import { DensityPreset } from './colors';

export type TypographyScale = {
  fontFamilyBody: string;
  fontFamilyCode: string;
  fontFamilyDisplay: string;
  weightRegular: string;
  weightMedium: string;
  weightBold: string;
  titleSize: string;
  titleLineHeight: string;
  bodySize: string;
  bodyLineHeight: string;
  bodySmallSize: string;
  bodySmallLineHeight: string;
  microSize: string;
  microLineHeight: string;
  codeSize: string;
  codeLineHeight: string;
  letterBody: string;
  letterCode: string;
  letterCaps: string;
  letterDisplay: string;
  transformCaps: string;
};

const BASE: TypographyScale = {
  fontFamilyBody: '"Segoe UI", "Inter", "Trebuchet MS", sans-serif',
  fontFamilyCode: '"Consolas", "Courier New", monospace',
  fontFamilyDisplay: '"Segoe UI", "Trebuchet MS", sans-serif',
  weightRegular: '450',
  weightMedium: '580',
  weightBold: '760',
  titleSize: 'clamp(28px, 3.6vw, 44px)',
  titleLineHeight: '1.06',
  bodySize: '14px',
  bodyLineHeight: '1.5',
  bodySmallSize: '12px',
  bodySmallLineHeight: '1.45',
  microSize: '10px',
  microLineHeight: '1.4',
  codeSize: '11px',
  codeLineHeight: '1.4',
  letterBody: '0.02em',
  letterCode: '0.16em',
  letterCaps: '0.2em',
  letterDisplay: '-0.01em',
  transformCaps: 'uppercase',
};

function withOverrides(base: TypographyScale, overrides: Partial<TypographyScale>): TypographyScale {
  return { ...base, ...overrides };
}

export const SLIDE00_TYPOGRAPHY_SCALES: Record<DensityPreset, TypographyScale> = {
  'ultra-compact': withOverrides(BASE, {
    titleSize: 'clamp(24px, 3vw, 34px)',
    bodySize: '12px',
    bodyLineHeight: '1.4',
    bodySmallSize: '11px',
    bodySmallLineHeight: '1.35',
    microSize: '9px',
    microLineHeight: '1.3',
    codeSize: '10px',
    codeLineHeight: '1.3',
    letterCode: '0.13em',
    letterCaps: '0.14em',
  }),
  compact: withOverrides(BASE, {
    titleSize: 'clamp(26px, 3.2vw, 38px)',
    bodySize: '13px',
    bodyLineHeight: '1.42',
    bodySmallSize: '11px',
    bodySmallLineHeight: '1.38',
    microSize: '9.5px',
    microLineHeight: '1.32',
    codeSize: '10px',
    codeLineHeight: '1.34',
    letterCode: '0.14em',
    letterCaps: '0.16em',
  }),
  balanced: BASE,
  comfortable: withOverrides(BASE, {
    titleSize: 'clamp(30px, 3.8vw, 46px)',
    bodySize: '15px',
    bodyLineHeight: '1.56',
    bodySmallSize: '13px',
    bodySmallLineHeight: '1.5',
    microSize: '10.5px',
    microLineHeight: '1.45',
    codeSize: '11.5px',
    codeLineHeight: '1.45',
    letterCode: '0.18em',
    letterCaps: '0.22em',
  }),
  cinematic: withOverrides(BASE, {
    titleSize: 'clamp(32px, 4vw, 50px)',
    bodySize: '16px',
    bodyLineHeight: '1.58',
    bodySmallSize: '13.5px',
    bodySmallLineHeight: '1.52',
    microSize: '11px',
    microLineHeight: '1.48',
    codeSize: '12px',
    codeLineHeight: '1.48',
    letterCode: '0.2em',
    letterCaps: '0.24em',
  }),
};

export function resolveTypographyScale(preset: DensityPreset): TypographyScale {
  return SLIDE00_TYPOGRAPHY_SCALES[preset];
}

export function typographyVarEntries(scale: TypographyScale): Array<[string, string]> {
  return [
    ['--boot-font-body', scale.fontFamilyBody],
    ['--boot-font-code', scale.fontFamilyCode],
    ['--boot-font-display', scale.fontFamilyDisplay],
    ['--boot-weight-regular', scale.weightRegular],
    ['--boot-weight-medium', scale.weightMedium],
    ['--boot-weight-bold', scale.weightBold],
    ['--boot-font-title-size', scale.titleSize],
    ['--boot-font-title-line-height', scale.titleLineHeight],
    ['--boot-font-body-size', scale.bodySize],
    ['--boot-font-body-line-height', scale.bodyLineHeight],
    ['--boot-font-body-small-size', scale.bodySmallSize],
    ['--boot-font-body-small-line-height', scale.bodySmallLineHeight],
    ['--boot-font-micro-size', scale.microSize],
    ['--boot-font-micro-line-height', scale.microLineHeight],
    ['--boot-font-code-size', scale.codeSize],
    ['--boot-font-code-line-height', scale.codeLineHeight],
    ['--boot-letter-body', scale.letterBody],
    ['--boot-letter-code', scale.letterCode],
    ['--boot-letter-caps', scale.letterCaps],
    ['--boot-letter-display', scale.letterDisplay],
    ['--boot-text-transform-caps', scale.transformCaps],
  ];
}
