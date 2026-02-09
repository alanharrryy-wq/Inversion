import { DependencyList, useEffect, useRef } from 'react';

export function useOnceEffect(effect: () => void | (() => void), deps: DependencyList = []): void {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
