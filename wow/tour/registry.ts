import { enterpriseTourScript } from './scripts/enterprise';
import { TourScript } from './types';

export const TOUR_SCRIPTS: TourScript[] = [enterpriseTourScript];

export function findTourScript(scriptId?: string): TourScript {
  if (!scriptId) return enterpriseTourScript;
  return TOUR_SCRIPTS.find((script) => script.id === scriptId) ?? enterpriseTourScript;
}
