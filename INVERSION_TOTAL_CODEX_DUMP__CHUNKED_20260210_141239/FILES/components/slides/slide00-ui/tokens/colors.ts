
export type DensityPreset = 'ultra-compact' | 'compact' | 'balanced' | 'comfortable' | 'cinematic';

export type SemanticTone = 'neutral' | 'good' | 'warn' | 'danger' | 'info';

export type ColorScale = {
  surfaceRootStart: string;
  surfaceRootMid: string;
  surfaceRootEnd: string;
  surfaceGridLine: string;
  surfaceGridGlow: string;
  surfaceVignetteInner: string;
  surfaceVignetteOuter: string;
  surfacePanelTop: string;
  surfacePanelBottom: string;
  surfacePanelHighlight: string;
  surfacePanelBorderSoft: string;
  surfacePanelBorderHard: string;
  surfacePanelInset: string;
  surfaceDockTop: string;
  surfaceDockBottom: string;
  surfaceDockBorder: string;
  surfaceDockDivider: string;
  surfaceDockButton: string;
  surfaceDockButtonActive: string;
  surfaceBadgeTop: string;
  surfaceBadgeBottom: string;
  surfaceBadgeBorder: string;
  surfaceMatrix: string;
  surfaceMatrixRow: string;
  surfaceMatrixRowReady: string;
  surfaceMatrixRowLocked: string;
  surfaceEvidenceTop: string;
  surfaceEvidenceBottom: string;
  surfaceEvidenceRow: string;
  surfaceEvidenceRowReady: string;
  surfaceControlTop: string;
  surfaceControlBottom: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnGood: string;
  textOnWarn: string;
  textOnDanger: string;
  accentPrimary: string;
  accentPrimarySoft: string;
  accentPrimaryFaint: string;
  accentGood: string;
  accentWarn: string;
  accentDanger: string;
  accentInfo: string;
  focusRing: string;
  railNeutral: string;
  railSuccess: string;
  railWarning: string;
  railDanger: string;
  statusGoodBg: string;
  statusWarnBg: string;
  statusDangerBg: string;
  statusNeutralBg: string;
  toastBorder: string;
  toastTop: string;
  toastBottom: string;
};

const COMMON_COLOR_NAMES = {
  cyan500: '#46dcff',
  cyan400: '#5de2ff',
  cyan300: '#8cecff',
  cyan200: '#b3f4ff',
  mint500: '#44ffb8',
  mint300: '#96ffd7',
  amber500: '#ffc84f',
  amber300: '#ffe2a0',
  red500: '#ff6f5f',
  red300: '#ffb6ac',
  slate950: '#03070a',
  slate900: '#07131c',
  slate850: '#0a2230',
  slate800: '#0d2d3c',
  bronze950: '#1f1504',
  bronze900: '#2b1f09',
  bronze850: '#36270d',
  sand200: '#ffe7b7',
  sand300: '#ffe1a6',
} as const;

export const SLIDE00_COLOR_SCALES: Record<DensityPreset, ColorScale> = {
  'ultra-compact': {
    surfaceRootStart: COMMON_COLOR_NAMES.slate950,
    surfaceRootMid: '#06111a',
    surfaceRootEnd: '#092736',
    surfaceGridLine: 'rgba(190, 220, 235, 0.072)',
    surfaceGridGlow: 'rgba(70, 220, 255, 0.16)',
    surfaceVignetteInner: 'rgba(0, 0, 0, 0)',
    surfaceVignetteOuter: 'rgba(0, 0, 0, 0.72)',
    surfacePanelTop: 'rgba(7, 22, 32, 0.88)',
    surfacePanelBottom: 'rgba(6, 15, 23, 0.9)',
    surfacePanelHighlight: 'rgba(255, 255, 255, 0.07)',
    surfacePanelBorderSoft: 'rgba(132, 206, 232, 0.22)',
    surfacePanelBorderHard: 'rgba(132, 206, 232, 0.36)',
    surfacePanelInset: 'rgba(163, 210, 230, 0.08)',
    surfaceDockTop: 'rgba(36, 25, 6, 0.95)',
    surfaceDockBottom: 'rgba(20, 13, 3, 0.95)',
    surfaceDockBorder: 'rgba(255, 194, 90, 0.38)',
    surfaceDockDivider: 'rgba(255, 219, 145, 0.16)',
    surfaceDockButton: 'rgba(63, 46, 12, 0.74)',
    surfaceDockButtonActive: 'rgba(111, 76, 13, 0.8)',
    surfaceBadgeTop: 'rgba(7, 20, 30, 0.84)',
    surfaceBadgeBottom: 'rgba(5, 16, 23, 0.84)',
    surfaceBadgeBorder: 'rgba(130, 204, 233, 0.24)',
    surfaceMatrix: 'rgba(6, 19, 27, 0.8)',
    surfaceMatrixRow: 'rgba(4, 13, 20, 0.72)',
    surfaceMatrixRowReady: 'rgba(4, 37, 28, 0.62)',
    surfaceMatrixRowLocked: 'rgba(53, 13, 9, 0.58)',
    surfaceEvidenceTop: 'rgba(7, 23, 34, 0.84)',
    surfaceEvidenceBottom: 'rgba(7, 15, 24, 0.82)',
    surfaceEvidenceRow: 'rgba(5, 15, 24, 0.72)',
    surfaceEvidenceRowReady: 'rgba(4, 39, 30, 0.66)',
    surfaceControlTop: 'rgba(7, 20, 30, 0.8)',
    surfaceControlBottom: 'rgba(6, 16, 23, 0.8)',
    textPrimary: 'rgba(229, 242, 250, 0.9)',
    textSecondary: 'rgba(185, 211, 226, 0.72)',
    textMuted: 'rgba(173, 199, 213, 0.62)',
    textOnGood: 'rgba(181, 255, 227, 0.96)',
    textOnWarn: 'rgba(255, 228, 158, 0.96)',
    textOnDanger: 'rgba(255, 191, 179, 0.96)',
    accentPrimary: COMMON_COLOR_NAMES.cyan500,
    accentPrimarySoft: 'rgba(70, 220, 255, 0.28)',
    accentPrimaryFaint: 'rgba(70, 220, 255, 0.14)',
    accentGood: COMMON_COLOR_NAMES.mint500,
    accentWarn: COMMON_COLOR_NAMES.amber500,
    accentDanger: COMMON_COLOR_NAMES.red500,
    accentInfo: '#7fc6e8',
    focusRing: 'rgba(147, 235, 255, 0.94)',
    railNeutral: 'rgba(131, 194, 221, 0.36)',
    railSuccess: 'rgba(91, 247, 198, 0.56)',
    railWarning: 'rgba(255, 194, 90, 0.58)',
    railDanger: 'rgba(255, 136, 120, 0.62)',
    statusGoodBg: 'rgba(6, 52, 40, 0.72)',
    statusWarnBg: 'rgba(64, 42, 4, 0.54)',
    statusDangerBg: 'rgba(66, 17, 11, 0.56)',
    statusNeutralBg: 'rgba(8, 20, 27, 0.74)',
    toastBorder: 'rgba(91, 247, 198, 0.5)',
    toastTop: 'rgba(7, 57, 41, 0.92)',
    toastBottom: 'rgba(6, 38, 28, 0.92)',
  },
  compact: {
    surfaceRootStart: COMMON_COLOR_NAMES.slate950,
    surfaceRootMid: COMMON_COLOR_NAMES.slate900,
    surfaceRootEnd: COMMON_COLOR_NAMES.slate850,
    surfaceGridLine: 'rgba(188, 217, 232, 0.08)',
    surfaceGridGlow: 'rgba(70, 220, 255, 0.18)',
    surfaceVignetteInner: 'rgba(0, 0, 0, 0)',
    surfaceVignetteOuter: 'rgba(0, 0, 0, 0.66)',
    surfacePanelTop: 'rgba(7, 24, 35, 0.88)',
    surfacePanelBottom: 'rgba(6, 17, 24, 0.88)',
    surfacePanelHighlight: 'rgba(255, 255, 255, 0.08)',
    surfacePanelBorderSoft: 'rgba(130, 204, 233, 0.24)',
    surfacePanelBorderHard: 'rgba(130, 204, 233, 0.42)',
    surfacePanelInset: 'rgba(163, 210, 230, 0.08)',
    surfaceDockTop: 'rgba(38, 27, 6, 0.95)',
    surfaceDockBottom: 'rgba(21, 14, 3, 0.95)',
    surfaceDockBorder: 'rgba(255, 194, 90, 0.42)',
    surfaceDockDivider: 'rgba(255, 219, 145, 0.18)',
    surfaceDockButton: 'rgba(63, 46, 12, 0.75)',
    surfaceDockButtonActive: 'rgba(111, 76, 13, 0.82)',
    surfaceBadgeTop: 'rgba(7, 20, 30, 0.88)',
    surfaceBadgeBottom: 'rgba(6, 16, 23, 0.88)',
    surfaceBadgeBorder: 'rgba(130, 204, 233, 0.24)',
    surfaceMatrix: 'rgba(6, 19, 27, 0.84)',
    surfaceMatrixRow: 'rgba(4, 13, 20, 0.72)',
    surfaceMatrixRowReady: 'rgba(4, 37, 28, 0.64)',
    surfaceMatrixRowLocked: 'rgba(53, 13, 9, 0.62)',
    surfaceEvidenceTop: 'rgba(7, 23, 34, 0.86)',
    surfaceEvidenceBottom: 'rgba(7, 15, 24, 0.82)',
    surfaceEvidenceRow: 'rgba(5, 15, 24, 0.75)',
    surfaceEvidenceRowReady: 'rgba(4, 39, 30, 0.68)',
    surfaceControlTop: 'rgba(7, 20, 30, 0.84)',
    surfaceControlBottom: 'rgba(6, 16, 23, 0.84)',
    textPrimary: 'rgba(229, 242, 250, 0.92)',
    textSecondary: 'rgba(185, 211, 226, 0.72)',
    textMuted: 'rgba(176, 206, 218, 0.72)',
    textOnGood: 'rgba(181, 255, 227, 0.95)',
    textOnWarn: 'rgba(255, 229, 161, 0.95)',
    textOnDanger: 'rgba(255, 191, 179, 0.95)',
    accentPrimary: COMMON_COLOR_NAMES.cyan500,
    accentPrimarySoft: 'rgba(70, 220, 255, 0.3)',
    accentPrimaryFaint: 'rgba(70, 220, 255, 0.14)',
    accentGood: COMMON_COLOR_NAMES.mint500,
    accentWarn: COMMON_COLOR_NAMES.amber500,
    accentDanger: COMMON_COLOR_NAMES.red500,
    accentInfo: '#7fc6e8',
    focusRing: 'rgba(147, 235, 255, 0.96)',
    railNeutral: 'rgba(131, 194, 221, 0.38)',
    railSuccess: 'rgba(91, 247, 198, 0.56)',
    railWarning: 'rgba(255, 194, 90, 0.62)',
    railDanger: 'rgba(255, 136, 120, 0.62)',
    statusGoodBg: 'rgba(6, 52, 40, 0.7)',
    statusWarnBg: 'rgba(64, 42, 4, 0.52)',
    statusDangerBg: 'rgba(66, 17, 11, 0.54)',
    statusNeutralBg: 'rgba(8, 20, 27, 0.72)',
    toastBorder: 'rgba(91, 247, 198, 0.52)',
    toastTop: 'rgba(7, 57, 41, 0.94)',
    toastBottom: 'rgba(6, 38, 28, 0.94)',
  },
  balanced: {
    surfaceRootStart: COMMON_COLOR_NAMES.slate950,
    surfaceRootMid: COMMON_COLOR_NAMES.slate900,
    surfaceRootEnd: COMMON_COLOR_NAMES.slate850,
    surfaceGridLine: 'rgba(188, 217, 232, 0.08)',
    surfaceGridGlow: 'rgba(70, 220, 255, 0.19)',
    surfaceVignetteInner: 'rgba(0, 0, 0, 0)',
    surfaceVignetteOuter: 'rgba(0, 0, 0, 0.66)',
    surfacePanelTop: 'rgba(7, 24, 35, 0.86)',
    surfacePanelBottom: 'rgba(6, 17, 24, 0.7)',
    surfacePanelHighlight: 'rgba(255, 255, 255, 0.08)',
    surfacePanelBorderSoft: 'rgba(130, 204, 233, 0.24)',
    surfacePanelBorderHard: 'rgba(130, 204, 233, 0.42)',
    surfacePanelInset: 'rgba(163, 210, 230, 0.08)',
    surfaceDockTop: 'rgba(38, 27, 6, 0.96)',
    surfaceDockBottom: 'rgba(21, 14, 3, 0.96)',
    surfaceDockBorder: 'rgba(255, 194, 90, 0.44)',
    surfaceDockDivider: 'rgba(255, 219, 145, 0.16)',
    surfaceDockButton: 'rgba(63, 46, 12, 0.75)',
    surfaceDockButtonActive: 'rgba(111, 76, 13, 0.82)',
    surfaceBadgeTop: 'rgba(7, 20, 30, 0.88)',
    surfaceBadgeBottom: 'rgba(6, 16, 23, 0.88)',
    surfaceBadgeBorder: 'rgba(130, 204, 233, 0.24)',
    surfaceMatrix: 'rgba(6, 19, 27, 0.84)',
    surfaceMatrixRow: 'rgba(4, 13, 20, 0.72)',
    surfaceMatrixRowReady: 'rgba(4, 37, 28, 0.64)',
    surfaceMatrixRowLocked: 'rgba(53, 13, 9, 0.62)',
    surfaceEvidenceTop: 'rgba(7, 23, 34, 0.86)',
    surfaceEvidenceBottom: 'rgba(7, 15, 24, 0.82)',
    surfaceEvidenceRow: 'rgba(5, 15, 24, 0.75)',
    surfaceEvidenceRowReady: 'rgba(4, 39, 30, 0.68)',
    surfaceControlTop: 'rgba(7, 20, 30, 0.84)',
    surfaceControlBottom: 'rgba(6, 16, 23, 0.84)',
    textPrimary: 'rgba(229, 242, 250, 0.92)',
    textSecondary: 'rgba(185, 211, 226, 0.72)',
    textMuted: 'rgba(176, 206, 218, 0.74)',
    textOnGood: 'rgba(181, 255, 227, 0.95)',
    textOnWarn: 'rgba(255, 229, 161, 0.95)',
    textOnDanger: 'rgba(255, 191, 179, 0.95)',
    accentPrimary: COMMON_COLOR_NAMES.cyan500,
    accentPrimarySoft: 'rgba(70, 220, 255, 0.3)',
    accentPrimaryFaint: 'rgba(70, 220, 255, 0.14)',
    accentGood: COMMON_COLOR_NAMES.mint500,
    accentWarn: COMMON_COLOR_NAMES.amber500,
    accentDanger: COMMON_COLOR_NAMES.red500,
    accentInfo: '#7fc6e8',
    focusRing: 'rgba(147, 235, 255, 0.96)',
    railNeutral: 'rgba(131, 194, 221, 0.4)',
    railSuccess: 'rgba(91, 247, 198, 0.56)',
    railWarning: 'rgba(255, 194, 90, 0.62)',
    railDanger: 'rgba(255, 136, 120, 0.62)',
    statusGoodBg: 'rgba(6, 52, 40, 0.7)',
    statusWarnBg: 'rgba(64, 42, 4, 0.52)',
    statusDangerBg: 'rgba(66, 17, 11, 0.54)',
    statusNeutralBg: 'rgba(8, 20, 27, 0.72)',
    toastBorder: 'rgba(91, 247, 198, 0.52)',
    toastTop: 'rgba(7, 57, 41, 0.94)',
    toastBottom: 'rgba(6, 38, 28, 0.94)',
  },
  comfortable: {
    surfaceRootStart: '#02060a',
    surfaceRootMid: '#081622',
    surfaceRootEnd: '#0b2b3d',
    surfaceGridLine: 'rgba(188, 217, 232, 0.085)',
    surfaceGridGlow: 'rgba(70, 220, 255, 0.22)',
    surfaceVignetteInner: 'rgba(0, 0, 0, 0)',
    surfaceVignetteOuter: 'rgba(0, 0, 0, 0.62)',
    surfacePanelTop: 'rgba(8, 27, 39, 0.88)',
    surfacePanelBottom: 'rgba(7, 18, 27, 0.72)',
    surfacePanelHighlight: 'rgba(255, 255, 255, 0.1)',
    surfacePanelBorderSoft: 'rgba(142, 214, 237, 0.3)',
    surfacePanelBorderHard: 'rgba(142, 214, 237, 0.5)',
    surfacePanelInset: 'rgba(180, 220, 238, 0.1)',
    surfaceDockTop: 'rgba(43, 31, 8, 0.96)',
    surfaceDockBottom: 'rgba(24, 16, 4, 0.96)',
    surfaceDockBorder: 'rgba(255, 205, 120, 0.46)',
    surfaceDockDivider: 'rgba(255, 226, 158, 0.2)',
    surfaceDockButton: 'rgba(70, 50, 14, 0.78)',
    surfaceDockButtonActive: 'rgba(122, 84, 16, 0.82)',
    surfaceBadgeTop: 'rgba(8, 23, 35, 0.9)',
    surfaceBadgeBottom: 'rgba(7, 18, 26, 0.9)',
    surfaceBadgeBorder: 'rgba(136, 210, 236, 0.3)',
    surfaceMatrix: 'rgba(8, 23, 32, 0.86)',
    surfaceMatrixRow: 'rgba(6, 16, 24, 0.76)',
    surfaceMatrixRowReady: 'rgba(6, 42, 32, 0.68)',
    surfaceMatrixRowLocked: 'rgba(58, 17, 12, 0.62)',
    surfaceEvidenceTop: 'rgba(8, 25, 36, 0.88)',
    surfaceEvidenceBottom: 'rgba(8, 18, 27, 0.84)',
    surfaceEvidenceRow: 'rgba(6, 18, 27, 0.76)',
    surfaceEvidenceRowReady: 'rgba(6, 45, 35, 0.7)',
    surfaceControlTop: 'rgba(8, 23, 35, 0.86)',
    surfaceControlBottom: 'rgba(7, 18, 26, 0.86)',
    textPrimary: 'rgba(234, 245, 252, 0.94)',
    textSecondary: 'rgba(194, 218, 231, 0.78)',
    textMuted: 'rgba(184, 209, 221, 0.74)',
    textOnGood: 'rgba(190, 255, 231, 0.98)',
    textOnWarn: 'rgba(255, 235, 176, 0.98)',
    textOnDanger: 'rgba(255, 201, 191, 0.98)',
    accentPrimary: COMMON_COLOR_NAMES.cyan400,
    accentPrimarySoft: 'rgba(93, 226, 255, 0.34)',
    accentPrimaryFaint: 'rgba(93, 226, 255, 0.16)',
    accentGood: COMMON_COLOR_NAMES.mint500,
    accentWarn: COMMON_COLOR_NAMES.amber500,
    accentDanger: COMMON_COLOR_NAMES.red500,
    accentInfo: '#8bd2ee',
    focusRing: 'rgba(171, 242, 255, 0.98)',
    railNeutral: 'rgba(143, 207, 232, 0.42)',
    railSuccess: 'rgba(101, 255, 207, 0.6)',
    railWarning: 'rgba(255, 206, 110, 0.66)',
    railDanger: 'rgba(255, 150, 136, 0.64)',
    statusGoodBg: 'rgba(8, 57, 44, 0.72)',
    statusWarnBg: 'rgba(72, 48, 8, 0.58)',
    statusDangerBg: 'rgba(74, 20, 14, 0.58)',
    statusNeutralBg: 'rgba(10, 23, 30, 0.74)',
    toastBorder: 'rgba(101, 255, 207, 0.54)',
    toastTop: 'rgba(9, 62, 46, 0.95)',
    toastBottom: 'rgba(7, 42, 31, 0.95)',
  },
  cinematic: {
    surfaceRootStart: '#010407',
    surfaceRootMid: '#071521',
    surfaceRootEnd: '#0c2d40',
    surfaceGridLine: 'rgba(188, 217, 232, 0.09)',
    surfaceGridGlow: 'rgba(93, 226, 255, 0.24)',
    surfaceVignetteInner: 'rgba(0, 0, 0, 0)',
    surfaceVignetteOuter: 'rgba(0, 0, 0, 0.58)',
    surfacePanelTop: 'rgba(10, 30, 44, 0.9)',
    surfacePanelBottom: 'rgba(9, 21, 31, 0.76)',
    surfacePanelHighlight: 'rgba(255, 255, 255, 0.12)',
    surfacePanelBorderSoft: 'rgba(156, 223, 244, 0.34)',
    surfacePanelBorderHard: 'rgba(156, 223, 244, 0.58)',
    surfacePanelInset: 'rgba(186, 227, 244, 0.11)',
    surfaceDockTop: 'rgba(47, 33, 9, 0.96)',
    surfaceDockBottom: 'rgba(26, 18, 5, 0.96)',
    surfaceDockBorder: 'rgba(255, 213, 136, 0.52)',
    surfaceDockDivider: 'rgba(255, 234, 185, 0.22)',
    surfaceDockButton: 'rgba(76, 56, 16, 0.8)',
    surfaceDockButtonActive: 'rgba(130, 90, 20, 0.84)',
    surfaceBadgeTop: 'rgba(10, 25, 39, 0.92)',
    surfaceBadgeBottom: 'rgba(8, 20, 30, 0.92)',
    surfaceBadgeBorder: 'rgba(147, 218, 241, 0.36)',
    surfaceMatrix: 'rgba(10, 25, 36, 0.9)',
    surfaceMatrixRow: 'rgba(7, 19, 29, 0.8)',
    surfaceMatrixRowReady: 'rgba(7, 47, 36, 0.72)',
    surfaceMatrixRowLocked: 'rgba(62, 19, 14, 0.66)',
    surfaceEvidenceTop: 'rgba(10, 28, 41, 0.9)',
    surfaceEvidenceBottom: 'rgba(9, 21, 31, 0.86)',
    surfaceEvidenceRow: 'rgba(7, 20, 30, 0.8)',
    surfaceEvidenceRowReady: 'rgba(7, 50, 39, 0.74)',
    surfaceControlTop: 'rgba(10, 25, 39, 0.88)',
    surfaceControlBottom: 'rgba(8, 20, 30, 0.88)',
    textPrimary: 'rgba(238, 248, 255, 0.96)',
    textSecondary: 'rgba(203, 226, 238, 0.8)',
    textMuted: 'rgba(194, 218, 230, 0.76)',
    textOnGood: 'rgba(198, 255, 236, 0.99)',
    textOnWarn: 'rgba(255, 239, 188, 0.99)',
    textOnDanger: 'rgba(255, 207, 198, 0.99)',
    accentPrimary: COMMON_COLOR_NAMES.cyan300,
    accentPrimarySoft: 'rgba(140, 236, 255, 0.38)',
    accentPrimaryFaint: 'rgba(140, 236, 255, 0.2)',
    accentGood: COMMON_COLOR_NAMES.mint300,
    accentWarn: COMMON_COLOR_NAMES.amber300,
    accentDanger: COMMON_COLOR_NAMES.red300,
    accentInfo: '#9ad8ef',
    focusRing: 'rgba(187, 247, 255, 1)',
    railNeutral: 'rgba(156, 216, 238, 0.46)',
    railSuccess: 'rgba(116, 255, 214, 0.64)',
    railWarning: 'rgba(255, 220, 140, 0.7)',
    railDanger: 'rgba(255, 166, 152, 0.68)',
    statusGoodBg: 'rgba(10, 61, 48, 0.74)',
    statusWarnBg: 'rgba(80, 54, 10, 0.62)',
    statusDangerBg: 'rgba(82, 22, 16, 0.62)',
    statusNeutralBg: 'rgba(12, 26, 35, 0.76)',
    toastBorder: 'rgba(116, 255, 214, 0.58)',
    toastTop: 'rgba(10, 68, 50, 0.96)',
    toastBottom: 'rgba(8, 47, 34, 0.96)',
  },
};

export function resolveColorScale(preset: DensityPreset): ColorScale {
  return SLIDE00_COLOR_SCALES[preset];
}

export function colorByTone(scale: ColorScale, tone: SemanticTone): string {
  if (tone === 'good') return scale.accentGood;
  if (tone === 'warn') return scale.accentWarn;
  if (tone === 'danger') return scale.accentDanger;
  if (tone === 'info') return scale.accentInfo;
  return scale.accentPrimary;
}

export function colorVarEntries(scale: ColorScale): Array<[string, string]> {
  return [
    ['--boot-bg-0', scale.surfaceRootStart],
    ['--boot-bg-1', scale.surfaceRootMid],
    ['--boot-bg-2', scale.surfaceRootEnd],
    ['--boot-grid-line', scale.surfaceGridLine],
    ['--boot-grid-glow', scale.surfaceGridGlow],
    ['--boot-vignette-inner', scale.surfaceVignetteInner],
    ['--boot-vignette-outer', scale.surfaceVignetteOuter],
    ['--boot-surface-panel-top', scale.surfacePanelTop],
    ['--boot-surface-panel-bottom', scale.surfacePanelBottom],
    ['--boot-surface-panel-highlight', scale.surfacePanelHighlight],
    ['--boot-border-soft', scale.surfacePanelBorderSoft],
    ['--boot-border-hard', scale.surfacePanelBorderHard],
    ['--boot-surface-panel-inset', scale.surfacePanelInset],
    ['--boot-surface-dock-top', scale.surfaceDockTop],
    ['--boot-surface-dock-bottom', scale.surfaceDockBottom],
    ['--boot-surface-dock-border', scale.surfaceDockBorder],
    ['--boot-surface-dock-divider', scale.surfaceDockDivider],
    ['--boot-surface-dock-button', scale.surfaceDockButton],
    ['--boot-surface-dock-button-active', scale.surfaceDockButtonActive],
    ['--boot-surface-badge-top', scale.surfaceBadgeTop],
    ['--boot-surface-badge-bottom', scale.surfaceBadgeBottom],
    ['--boot-surface-badge-border', scale.surfaceBadgeBorder],
    ['--boot-surface-matrix', scale.surfaceMatrix],
    ['--boot-surface-matrix-row', scale.surfaceMatrixRow],
    ['--boot-surface-matrix-row-ready', scale.surfaceMatrixRowReady],
    ['--boot-surface-matrix-row-locked', scale.surfaceMatrixRowLocked],
    ['--boot-surface-evidence-top', scale.surfaceEvidenceTop],
    ['--boot-surface-evidence-bottom', scale.surfaceEvidenceBottom],
    ['--boot-surface-evidence-row', scale.surfaceEvidenceRow],
    ['--boot-surface-evidence-row-ready', scale.surfaceEvidenceRowReady],
    ['--boot-surface-control-top', scale.surfaceControlTop],
    ['--boot-surface-control-bottom', scale.surfaceControlBottom],
    ['--boot-text', scale.textPrimary],
    ['--boot-text-dim', scale.textSecondary],
    ['--boot-text-muted', scale.textMuted],
    ['--boot-text-on-good', scale.textOnGood],
    ['--boot-text-on-warn', scale.textOnWarn],
    ['--boot-text-on-danger', scale.textOnDanger],
    ['--boot-cyan', scale.accentPrimary],
    ['--boot-cyan-soft', scale.accentPrimarySoft],
    ['--boot-cyan-faint', scale.accentPrimaryFaint],
    ['--boot-success', scale.accentGood],
    ['--boot-warning', scale.accentWarn],
    ['--boot-danger', scale.accentDanger],
    ['--boot-info', scale.accentInfo],
    ['--boot-focus-ring', scale.focusRing],
    ['--boot-rail-neutral', scale.railNeutral],
    ['--boot-rail-success', scale.railSuccess],
    ['--boot-rail-warning', scale.railWarning],
    ['--boot-rail-danger', scale.railDanger],
    ['--boot-status-good-bg', scale.statusGoodBg],
    ['--boot-status-warn-bg', scale.statusWarnBg],
    ['--boot-status-danger-bg', scale.statusDangerBg],
    ['--boot-status-neutral-bg', scale.statusNeutralBg],
    ['--boot-toast-border', scale.toastBorder],
    ['--boot-toast-top', scale.toastTop],
    ['--boot-toast-bottom', scale.toastBottom],
  ];
}

