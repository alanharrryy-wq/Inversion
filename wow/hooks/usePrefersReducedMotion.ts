import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(defaultValue = false): boolean {
  const [reduced, setReduced] = useState(defaultValue);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;

    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return reduced;
}
