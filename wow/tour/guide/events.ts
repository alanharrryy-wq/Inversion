import { GuideEvidenceEvent, GuideEvidencePayload } from './types';

export const GUIDE_EVIDENCE_CHANNEL = 'wow:guide:evidence';

export type GuideEvidenceDetail = {
  name: string;
  payload?: GuideEvidencePayload;
  ts: number;
};

function normalizeDetail(detail: Partial<GuideEvidenceDetail> | null | undefined): GuideEvidenceEvent | null {
  if (!detail || typeof detail.name !== 'string' || detail.name.trim().length === 0) return null;
  return {
    name: detail.name,
    payload: detail.payload,
    ts: typeof detail.ts === 'number' ? detail.ts : Date.now(),
  };
}

export function emitGuideEvidence(name: string, payload: GuideEvidencePayload = {}): void {
  const detail: GuideEvidenceDetail = {
    name,
    payload,
    ts: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(GUIDE_EVIDENCE_CHANNEL, { detail }));
}

export function onGuideEvidence(listener: (event: GuideEvidenceEvent) => void): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<GuideEvidenceDetail>;
    const normalized = normalizeDetail(custom.detail);
    if (!normalized) return;
    listener(normalized);
  };

  window.addEventListener(GUIDE_EVIDENCE_CHANNEL, handler as EventListener);
  return () => window.removeEventListener(GUIDE_EVIDENCE_CHANNEL, handler as EventListener);
}

export function eventToGuideAction(event: GuideEvidenceEvent) {
  return { type: 'EVIDENCE_CAPTURED' as const, event };
}
