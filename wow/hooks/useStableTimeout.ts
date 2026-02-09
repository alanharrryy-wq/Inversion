import { useCallback, useEffect, useRef } from 'react';

type TimeoutHandle = ReturnType<typeof window.setTimeout>;

export function useStableTimeout() {
  const timeoutRef = useRef<TimeoutHandle | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const schedule = useCallback((fn: () => void, delayMs: number) => {
    clear();
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      fn();
    }, Math.max(0, delayMs));
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { schedule, clear };
}
