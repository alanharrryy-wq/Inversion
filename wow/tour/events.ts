const EVENT_NAME = 'wow:tour-event';

export function emitTourEvent(name: string, payload: Record<string, unknown> = {}): void {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: {
        name,
        payload,
        ts: Date.now(),
      },
    })
  );
}

export function onTourEvent(listener: (name: string, payload?: Record<string, unknown>) => void): () => void {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ name?: string; payload?: Record<string, unknown> }>;
    const name = custom.detail?.name;
    if (!name) return;
    listener(name, custom.detail?.payload);
  };

  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}

export const TOUR_EVENT_CHANNEL = EVENT_NAME;
