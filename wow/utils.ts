export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export const easing = {
  linear: (t: number): number => clamp(t, 0, 1),
  inSine: (t: number): number => 1 - Math.cos((clamp(t, 0, 1) * Math.PI) / 2),
  outSine: (t: number): number => Math.sin((clamp(t, 0, 1) * Math.PI) / 2),
  inOutSine: (t: number): number => -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2,
  inQuad: (t: number): number => clamp(t, 0, 1) * clamp(t, 0, 1),
  outQuad: (t: number): number => 1 - (1 - clamp(t, 0, 1)) * (1 - clamp(t, 0, 1)),
  inOutQuad: (t: number): number => {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  },
  inCubic: (t: number): number => Math.pow(clamp(t, 0, 1), 3),
  outCubic: (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3),
  inOutCubic: (t: number): number => {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  },
  outExpo: (t: number): number => {
    const x = clamp(t, 0, 1);
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
};

export function cssVar(name: string, fallback?: string): string {
  const normalized = name.startsWith('--') ? name : `--${name}`;
  if (typeof fallback === 'string' && fallback.length > 0) {
    return `var(${normalized}, ${fallback})`;
  }
  return `var(${normalized})`;
}

export function setCssVar(target: HTMLElement, name: string, value: string): void {
  const normalized = name.startsWith('--') ? name : `--${name}`;
  target.style.setProperty(normalized, value);
}
