
import {
  WOW_DEMO,
  WOW_DEMO_SCRIPT,
  WOW_MIRROR,
  WOW_OPENING_CINEMA,
  WOW_TOUR,
  WOW_TOUR_AUTOSTART,
} from '../../config/wow';
import { WowFlagSnapshot } from './wowGate';

export function createWowFlagSnapshot(): WowFlagSnapshot {
  return {
    WOW_DEMO,
    WOW_TOUR,
    WOW_TOUR_AUTOSTART,
    WOW_DEMO_SCRIPT,
    WOW_OPENING_CINEMA,
    WOW_MIRROR,
  };
}

