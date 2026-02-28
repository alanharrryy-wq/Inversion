export type DeterministicRng = {
  next: () => number;
  nextInt: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

function normalizeSeed(seed: number | string): number {
  const input = typeof seed === "number" ? String(seed) : seed;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDeterministicRng(seed: number | string): DeterministicRng {
  let state = normalizeSeed(seed);
  const next = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const nextInt = (min: number, max: number) => {
    const low = Math.ceil(Math.min(min, max));
    const high = Math.floor(Math.max(min, max));
    if (high <= low) return low;
    return Math.floor(next() * (high - low + 1)) + low;
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty array.");
    }
    return items[nextInt(0, items.length - 1)];
  };

  return { next, nextInt, pick };
}

export function createDeterministicSequence(
  seed: number | string,
  length: number,
  min = 0,
  max = 1
): number[] {
  const rng = createDeterministicRng(seed);
  if (length <= 0) return [];
  if (max <= min) {
    return Array.from({ length }, () => min);
  }
  const span = max - min;
  return Array.from({ length }, () => min + rng.next() * span);
}
