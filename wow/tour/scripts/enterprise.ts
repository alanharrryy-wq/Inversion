import { toTourScript } from '../guide/adapter';
import { enterpriseGuideScript } from '../guide/scripts';
import { TourScript } from '../types';

// Compatibility wrapper: canonical script authoring now lives in wow/tour/guide/scripts/enterprise.ts
export const enterpriseTourScript: TourScript = toTourScript(enterpriseGuideScript);
