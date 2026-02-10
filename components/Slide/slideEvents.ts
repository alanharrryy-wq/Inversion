import { emitGuideEvent } from '../../wow/guide/events';
import { emitGuideEvidence } from '../../wow/tour/guide/events';
import { emitTourEvent } from '../../wow/tour';

export function emitSlideGuideEvent(name: string, payload: Record<string, unknown> = {}): void {
  emitGuideEvent(name, payload);
  emitGuideEvidence(name, payload as Record<string, string | number | boolean | null | (string | number | boolean | null)[]>);
  emitTourEvent(name, payload);
}
