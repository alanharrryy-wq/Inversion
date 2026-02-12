
import { isEvidenceSatisfied } from '../evidence';
import { BootRuntimeState, WowFeatureGates } from './types';

export type WowFlagSnapshot = {
  WOW_DEMO: boolean;
  WOW_TOUR: boolean;
  WOW_TOUR_AUTOSTART: boolean;
  WOW_DEMO_SCRIPT: boolean;
  WOW_OPENING_CINEMA: boolean;
  WOW_MIRROR: boolean;
};

function lockedDecision(reason: string) {
  return {
    locked: true,
    ready: false,
    operatorAssisted: false,
    reason,
  } as const;
}

function availableDecision(args: { operatorAssisted: boolean; reason: string }) {
  return {
    locked: false,
    ready: true,
    operatorAssisted: args.operatorAssisted,
    reason: args.reason,
  } as const;
}

export function resolveWowFeatureGates(state: BootRuntimeState, flags: WowFlagSnapshot): WowFeatureGates {
  const armedEvidenceSatisfied = isEvidenceSatisfied(state.evidence, 'evidence:system:armed');
  const operatorAssisted = state.boot.overrideEnabled && !armedEvidenceSatisfied;
  const gateLocked = !armedEvidenceSatisfied && !state.boot.overrideEnabled;

  if (!flags.WOW_DEMO) {
    const reason = 'wow-demo-disabled';
    return {
      tour: lockedDecision(reason),
      tourAutostart: lockedDecision(reason),
      demoScript: lockedDecision(reason),
      openingCinema: lockedDecision(reason),
      mirrorIntro: lockedDecision(reason),
    };
  }

  if (gateLocked) {
    return {
      tour: lockedDecision('boot-gate-locked:not-armed'),
      tourAutostart: lockedDecision('boot-gate-locked:not-armed'),
      demoScript: lockedDecision('boot-gate-locked:not-armed'),
      openingCinema: lockedDecision('boot-gate-locked:not-armed'),
      mirrorIntro: lockedDecision('boot-gate-locked:not-armed'),
    };
  }

  const suffix = operatorAssisted ? 'operator-assisted' : 'armed-confirmed';

  const tour = flags.WOW_TOUR
    ? availableDecision({ operatorAssisted, reason: `tour-available:${suffix}` })
    : lockedDecision('tour-flag-disabled');

  const demoScript = flags.WOW_DEMO_SCRIPT
    ? availableDecision({ operatorAssisted, reason: `demo-script-available:${suffix}` })
    : lockedDecision('demo-script-flag-disabled');

  const openingCinema = flags.WOW_OPENING_CINEMA
    ? availableDecision({ operatorAssisted, reason: `opening-cinema-available:${suffix}` })
    : lockedDecision('opening-cinema-flag-disabled');

  const mirrorIntro = flags.WOW_MIRROR
    ? availableDecision({ operatorAssisted, reason: `mirror-intro-available:${suffix}` })
    : lockedDecision('mirror-flag-disabled');

  // Contract: autostart never becomes authoritative. It can only be manual start after gate opens.
  const tourAutostart = flags.WOW_TOUR_AUTOSTART
    ? {
        locked: false,
        ready: false,
        operatorAssisted,
        reason: 'autostart-disabled-by-boot-contract',
      }
    : lockedDecision('autostart-flag-disabled');

  return {
    tour,
    tourAutostart,
    demoScript,
    openingCinema,
    mirrorIntro,
  };
}

export function canStartTourManually(gates: WowFeatureGates): boolean {
  return gates.tour.ready && !gates.tour.locked;
}

export function canShowDemoScript(gates: WowFeatureGates): boolean {
  return gates.demoScript.ready && !gates.demoScript.locked;
}

export function canPlayOpeningCinema(gates: WowFeatureGates): boolean {
  return gates.openingCinema.ready && !gates.openingCinema.locked;
}

export function canShowMirrorIntro(gates: WowFeatureGates): boolean {
  return gates.mirrorIntro.ready && !gates.mirrorIntro.locked;
}

export function isTourAutostartBlocked(gates: WowFeatureGates): boolean {
  return !gates.tourAutostart.ready || gates.tourAutostart.reason === 'autostart-disabled-by-boot-contract';
}

