import { DensityPreset } from './colors';

export type ShadowScale = {
  panelShadow: string;
  panelGlow: string;
  panelInset: string;
  cardShadow: string;
  actionShadow: string;
  actionShadowHover: string;
  toastShadow: string;
  dockShadow: string;
  ringFocus: string;
  ringPrimary: string;
  ringSuccess: string;
  ringWarning: string;
  ringDanger: string;
};

const BASE: ShadowScale = {
  panelShadow: '0 24px 72px rgba(1, 8, 12, 0.68)',
  panelGlow: '0 0 64px rgba(70, 220, 255, 0.22)',
  panelInset: 'inset 0 0 0 1px rgba(163, 210, 230, 0.08)',
  cardShadow: '0 10px 24px rgba(0, 0, 0, 0.32)',
  actionShadow: '0 12px 28px rgba(8, 52, 69, 0.42)',
  actionShadowHover: '0 14px 30px rgba(9, 55, 74, 0.48)',
  toastShadow: '0 18px 34px rgba(2, 24, 16, 0.55)',
  dockShadow: '0 28px 48px rgba(14, 10, 2, 0.66)',
  ringFocus: '0 0 0 2px rgba(147, 235, 255, 0.96)',
  ringPrimary: '0 0 0 1px rgba(123, 218, 248, 0.44)',
  ringSuccess: '0 0 0 1px rgba(101, 255, 207, 0.44)',
  ringWarning: '0 0 0 1px rgba(255, 206, 110, 0.44)',
  ringDanger: '0 0 0 1px rgba(255, 150, 136, 0.44)',
};

function withOverrides(base: ShadowScale, overrides: Partial<ShadowScale>): ShadowScale {
  return { ...base, ...overrides };
}

export const SLIDE00_SHADOW_SCALES: Record<DensityPreset, ShadowScale> = {
  'ultra-compact': withOverrides(BASE, {
    panelShadow: '0 16px 42px rgba(1, 8, 12, 0.64)',
    panelGlow: '0 0 42px rgba(70, 220, 255, 0.16)',
    cardShadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
    actionShadow: '0 9px 18px rgba(8, 52, 69, 0.34)',
    actionShadowHover: '0 10px 20px rgba(9, 55, 74, 0.38)',
    toastShadow: '0 12px 24px rgba(2, 24, 16, 0.42)',
    dockShadow: '0 18px 28px rgba(14, 10, 2, 0.5)',
  }),
  compact: withOverrides(BASE, {
    panelShadow: '0 20px 52px rgba(1, 8, 12, 0.66)',
    panelGlow: '0 0 52px rgba(70, 220, 255, 0.18)',
    cardShadow: '0 9px 20px rgba(0, 0, 0, 0.3)',
    actionShadow: '0 10px 22px rgba(8, 52, 69, 0.36)',
    actionShadowHover: '0 12px 24px rgba(9, 55, 74, 0.4)',
    toastShadow: '0 14px 28px rgba(2, 24, 16, 0.46)',
    dockShadow: '0 22px 36px rgba(14, 10, 2, 0.56)',
  }),
  balanced: BASE,
  comfortable: withOverrides(BASE, {
    panelShadow: '0 28px 82px rgba(1, 8, 12, 0.7)',
    panelGlow: '0 0 78px rgba(93, 226, 255, 0.26)',
    cardShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
    actionShadow: '0 14px 30px rgba(8, 52, 69, 0.45)',
    actionShadowHover: '0 18px 34px rgba(9, 55, 74, 0.52)',
    toastShadow: '0 22px 40px rgba(2, 24, 16, 0.58)',
    dockShadow: '0 32px 56px rgba(14, 10, 2, 0.68)',
  }),
  cinematic: withOverrides(BASE, {
    panelShadow: '0 30px 92px rgba(1, 8, 12, 0.74)',
    panelGlow: '0 0 92px rgba(140, 236, 255, 0.3)',
    cardShadow: '0 14px 32px rgba(0, 0, 0, 0.38)',
    actionShadow: '0 16px 34px rgba(8, 52, 69, 0.48)',
    actionShadowHover: '0 20px 40px rgba(9, 55, 74, 0.56)',
    toastShadow: '0 24px 44px rgba(2, 24, 16, 0.62)',
    dockShadow: '0 36px 62px rgba(14, 10, 2, 0.72)',
  }),
};

export function resolveShadowScale(preset: DensityPreset): ShadowScale {
  return SLIDE00_SHADOW_SCALES[preset];
}

export function shadowVarEntries(scale: ShadowScale): Array<[string, string]> {
  return [
    ['--boot-shadow-panel', scale.panelShadow],
    ['--boot-shadow-panel-glow', scale.panelGlow],
    ['--boot-shadow-panel-inset', scale.panelInset],
    ['--boot-shadow-card', scale.cardShadow],
    ['--boot-shadow-action', scale.actionShadow],
    ['--boot-shadow-action-hover', scale.actionShadowHover],
    ['--boot-shadow-toast', scale.toastShadow],
    ['--boot-shadow-dock', scale.dockShadow],
    ['--boot-shadow-focus-ring', scale.ringFocus],
    ['--boot-shadow-ring-primary', scale.ringPrimary],
    ['--boot-shadow-ring-success', scale.ringSuccess],
    ['--boot-shadow-ring-warning', scale.ringWarning],
    ['--boot-shadow-ring-danger', scale.ringDanger],
  ];
}
