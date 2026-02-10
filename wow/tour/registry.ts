import { enterpriseTourScript } from './scripts/enterprise';
import { toTourScript } from './guide/adapter';
import { guidedDemoScript } from './guide/scripts';
import { TourScript } from './types';

export const TOUR_SCRIPTS: TourScript[] = [
  enterpriseTourScript,
  toTourScript(guidedDemoScript),
];

export function findTourScript(scriptId?: string): TourScript {
  if (!scriptId) return enterpriseTourScript;
  return TOUR_SCRIPTS.find((script) => script.id === scriptId) ?? enterpriseTourScript;
}
