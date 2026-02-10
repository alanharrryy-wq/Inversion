import { emitGuideEvidence, GUIDE_EVIDENCE_CHANNEL, onGuideEvidence } from '../tour/guide/events';
import { GuideEvidenceEvent } from '../tour/guide/types';

export type GuideEventDetail = {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
};

/**
 * @deprecated Use `emitGuideEvidence` from `wow/tour/guide/events`.
 */
export function emitGuideEvent(name: string, payload: Record<string, unknown> = {}): void {
  emitGuideEvidence(name, payload);
}

/**
 * @deprecated Use `onGuideEvidence` from `wow/tour/guide/events`.
 */
export function onGuideEvent(listener: (event: GuideEvidenceEvent) => void): () => void {
  return onGuideEvidence(listener);
}

export const GUIDE_EVENT_CHANNEL = GUIDE_EVIDENCE_CHANNEL;
