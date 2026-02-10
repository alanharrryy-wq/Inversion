import { GuideEvidenceEvent } from './script.types';

const GUIDE_EVENT_CHANNEL = 'wow:guide-event';

export type GuideEventDetail = {
  name: string;
  payload?: Record<string, unknown>;
  ts: number;
};

export function emitGuideEvent(name: string, payload: Record<string, unknown> = {}): void {
  const detail: GuideEventDetail = { name, payload, ts: Date.now() };
  window.dispatchEvent(new CustomEvent(GUIDE_EVENT_CHANNEL, { detail }));
}

export function onGuideEvent(listener: (event: GuideEvidenceEvent) => void): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<GuideEventDetail>;
    if (!custom.detail?.name) return;
    listener({ name: custom.detail.name, payload: custom.detail.payload, ts: custom.detail.ts ?? Date.now() });
  };

  window.addEventListener(GUIDE_EVENT_CHANNEL, handler as EventListener);
  return () => window.removeEventListener(GUIDE_EVENT_CHANNEL, handler as EventListener);
}

export { GUIDE_EVENT_CHANNEL };
