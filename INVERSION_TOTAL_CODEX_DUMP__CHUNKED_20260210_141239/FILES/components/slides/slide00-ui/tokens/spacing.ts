
import { DensityPreset } from './colors';

export type SpacingScale = {
  px0: string;
  px2: string;
  px4: string;
  px6: string;
  px8: string;
  px10: string;
  px12: string;
  px14: string;
  px16: string;
  px18: string;
  px20: string;
  px24: string;
  px28: string;
  px30: string;
  px32: string;
  px34: string;
  px36: string;
  px40: string;
  px44: string;
  px48: string;
  px54: string;
  px62: string;
  px72: string;
  px82: string;
  px96: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusPill: string;
  panelPadding: string;
  panelGap: string;
  shellPaddingTop: string;
  shellPaddingX: string;
  shellPaddingBottom: string;
  shellGap: string;
  navPaddingY: string;
  navPaddingX: string;
  centerGap: string;
  centerMinMain: string;
  centerMinSide: string;
  centerMaxSide: string;
  sideGap: string;
  sideMaxHeight: string;
  evidenceGap: string;
  dockMaxHeight: string;
  dockWidth: string;
  dockInsetRight: string;
  dockInsetBottom: string;
  toastInsetTop: string;
  toastInsetRight: string;
  actionRailGap: string;
  actionRailColumns: string;
  statusStripColumns: string;
};

const BASE: SpacingScale = {
  px0: '0px',
  px2: '2px',
  px4: '4px',
  px6: '6px',
  px8: '8px',
  px10: '10px',
  px12: '12px',
  px14: '14px',
  px16: '16px',
  px18: '18px',
  px20: '20px',
  px24: '24px',
  px28: '28px',
  px30: '30px',
  px32: '32px',
  px34: '34px',
  px36: '36px',
  px40: '40px',
  px44: '44px',
  px48: '48px',
  px54: '54px',
  px62: '62px',
  px72: '72px',
  px82: '82px',
  px96: '96px',
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '18px',
  radiusXl: '24px',
  radiusPill: '999px',
  panelPadding: '32px',
  panelGap: '20px',
  shellPaddingTop: '30px',
  shellPaddingX: '34px',
  shellPaddingBottom: '96px',
  shellGap: '18px',
  navPaddingY: '28px',
  navPaddingX: '42px',
  centerGap: '20px',
  centerMinMain: '560px',
  centerMinSide: '280px',
  centerMaxSide: '360px',
  sideGap: '12px',
  sideMaxHeight: '468px',
  evidenceGap: '14px',
  dockMaxHeight: '640px',
  dockWidth: '460px',
  dockInsetRight: '16px',
  dockInsetBottom: '70px',
  toastInsetTop: '82px',
  toastInsetRight: '18px',
  actionRailGap: '10px',
  actionRailColumns: 'repeat(3, minmax(0, 1fr))',
  statusStripColumns: 'repeat(4, minmax(0, 1fr))',
};

function withOverrides(base: SpacingScale, overrides: Partial<SpacingScale>): SpacingScale {
  return { ...base, ...overrides };
}

export const SLIDE00_SPACING_SCALES: Record<DensityPreset, SpacingScale> = {
  'ultra-compact': withOverrides(BASE, {
    panelPadding: '20px',
    panelGap: '14px',
    shellPaddingTop: '18px',
    shellPaddingX: '20px',
    shellPaddingBottom: '84px',
    shellGap: '12px',
    navPaddingY: '14px',
    navPaddingX: '18px',
    centerGap: '12px',
    centerMinMain: '480px',
    centerMinSide: '220px',
    centerMaxSide: '280px',
    sideGap: '8px',
    sideMaxHeight: '390px',
    dockWidth: '410px',
    dockMaxHeight: '490px',
    dockInsetRight: '10px',
    dockInsetBottom: '58px',
    toastInsetTop: '66px',
    toastInsetRight: '10px',
    actionRailGap: '8px',
    actionRailColumns: 'repeat(2, minmax(0, 1fr))',
    statusStripColumns: 'repeat(2, minmax(0, 1fr))',
  }),
  compact: withOverrides(BASE, {
    panelPadding: '24px',
    panelGap: '16px',
    shellPaddingTop: '24px',
    shellPaddingX: '24px',
    shellPaddingBottom: '92px',
    shellGap: '14px',
    navPaddingY: '20px',
    navPaddingX: '24px',
    centerGap: '14px',
    centerMinMain: '500px',
    centerMinSide: '250px',
    centerMaxSide: '300px',
    sideGap: '10px',
    sideMaxHeight: '430px',
    dockWidth: '430px',
    dockMaxHeight: '540px',
    dockInsetRight: '12px',
    dockInsetBottom: '62px',
    toastInsetTop: '74px',
    toastInsetRight: '12px',
    actionRailGap: '8px',
    actionRailColumns: 'repeat(2, minmax(0, 1fr))',
    statusStripColumns: 'repeat(3, minmax(0, 1fr))',
  }),
  balanced: BASE,
  comfortable: withOverrides(BASE, {
    panelPadding: '34px',
    panelGap: '22px',
    shellPaddingTop: '34px',
    shellPaddingX: '38px',
    shellPaddingBottom: '100px',
    shellGap: '20px',
    navPaddingY: '30px',
    navPaddingX: '44px',
    centerGap: '24px',
    centerMinMain: '590px',
    centerMinSide: '300px',
    centerMaxSide: '380px',
    sideGap: '14px',
    sideMaxHeight: '500px',
    dockWidth: '480px',
    dockMaxHeight: '680px',
    dockInsetRight: '18px',
    dockInsetBottom: '74px',
    toastInsetTop: '88px',
    toastInsetRight: '20px',
    actionRailGap: '12px',
    actionRailColumns: 'repeat(3, minmax(0, 1fr))',
    statusStripColumns: 'repeat(4, minmax(0, 1fr))',
  }),
  cinematic: withOverrides(BASE, {
    panelPadding: '38px',
    panelGap: '24px',
    shellPaddingTop: '36px',
    shellPaddingX: '40px',
    shellPaddingBottom: '104px',
    shellGap: '22px',
    navPaddingY: '32px',
    navPaddingX: '46px',
    centerGap: '26px',
    centerMinMain: '620px',
    centerMinSide: '320px',
    centerMaxSide: '400px',
    sideGap: '16px',
    sideMaxHeight: '528px',
    dockWidth: '500px',
    dockMaxHeight: '700px',
    dockInsetRight: '20px',
    dockInsetBottom: '76px',
    toastInsetTop: '94px',
    toastInsetRight: '22px',
    actionRailGap: '14px',
    actionRailColumns: 'repeat(4, minmax(0, 1fr))',
    statusStripColumns: 'repeat(4, minmax(0, 1fr))',
  }),
};

export function resolveSpacingScale(preset: DensityPreset): SpacingScale {
  return SLIDE00_SPACING_SCALES[preset];
}

export function spacingVarEntries(scale: SpacingScale): Array<[string, string]> {
  return [
    ['--boot-space-0', scale.px0],
    ['--boot-space-2', scale.px2],
    ['--boot-space-4', scale.px4],
    ['--boot-space-6', scale.px6],
    ['--boot-space-8', scale.px8],
    ['--boot-space-10', scale.px10],
    ['--boot-space-12', scale.px12],
    ['--boot-space-14', scale.px14],
    ['--boot-space-16', scale.px16],
    ['--boot-space-18', scale.px18],
    ['--boot-space-20', scale.px20],
    ['--boot-space-24', scale.px24],
    ['--boot-space-28', scale.px28],
    ['--boot-space-30', scale.px30],
    ['--boot-space-32', scale.px32],
    ['--boot-space-34', scale.px34],
    ['--boot-space-36', scale.px36],
    ['--boot-space-40', scale.px40],
    ['--boot-space-44', scale.px44],
    ['--boot-space-48', scale.px48],
    ['--boot-space-54', scale.px54],
    ['--boot-space-62', scale.px62],
    ['--boot-space-72', scale.px72],
    ['--boot-space-82', scale.px82],
    ['--boot-space-96', scale.px96],
    ['--boot-radius-sm', scale.radiusSm],
    ['--boot-radius-md', scale.radiusMd],
    ['--boot-radius-lg', scale.radiusLg],
    ['--boot-radius-xl', scale.radiusXl],
    ['--boot-radius-pill', scale.radiusPill],
    ['--boot-panel-padding', scale.panelPadding],
    ['--boot-panel-gap', scale.panelGap],
    ['--boot-shell-padding-top', scale.shellPaddingTop],
    ['--boot-shell-padding-x', scale.shellPaddingX],
    ['--boot-shell-padding-bottom', scale.shellPaddingBottom],
    ['--boot-shell-gap', scale.shellGap],
    ['--boot-nav-padding-y', scale.navPaddingY],
    ['--boot-nav-padding-x', scale.navPaddingX],
    ['--boot-center-gap', scale.centerGap],
    ['--boot-center-main-min', scale.centerMinMain],
    ['--boot-center-side-min', scale.centerMinSide],
    ['--boot-center-side-max', scale.centerMaxSide],
    ['--boot-side-gap', scale.sideGap],
    ['--boot-side-max-height', scale.sideMaxHeight],
    ['--boot-evidence-gap', scale.evidenceGap],
    ['--boot-dock-max-height', scale.dockMaxHeight],
    ['--boot-dock-width', scale.dockWidth],
    ['--boot-dock-right', scale.dockInsetRight],
    ['--boot-dock-bottom', scale.dockInsetBottom],
    ['--boot-toast-top', scale.toastInsetTop],
    ['--boot-toast-right', scale.toastInsetRight],
    ['--boot-action-rail-gap', scale.actionRailGap],
    ['--boot-action-rail-columns', scale.actionRailColumns],
    ['--boot-status-strip-columns', scale.statusStripColumns],
  ];
}

