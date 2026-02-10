const EVENT_NAME = 'wow:tour-event';
const TARGET_PULSE_CLASS = 'wow-tour-target-pulse';

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

function matches(root: ParentNode, selector?: string): Element[] {
  if (!selector) return [];
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

export function hasTourTarget(selector?: string): boolean {
  if (!selector) return true;
  return matches(document, selector).length > 0;
}

export function setTargetPulse(selector?: string): () => void {
  const els = matches(document, selector);
  els.forEach((el) => el.classList.add(TARGET_PULSE_CLASS));
  return () => {
    els.forEach((el) => el.classList.remove(TARGET_PULSE_CLASS));
  };
}

export function bindStepDomEvents(args: {
  active: boolean;
  targetSelector?: string;
  completionEventName: string;
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}): () => void {
  if (!args.active || !args.targetSelector) return () => {};

  const onClick = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target) return;
    if (!target.closest(args.targetSelector!)) return;
    args.emit(args.completionEventName, { selector: args.targetSelector });
  };

  document.addEventListener('click', onClick, true);
  return () => {
    document.removeEventListener('click', onClick, true);
  };
}

export { TARGET_PULSE_CLASS };
