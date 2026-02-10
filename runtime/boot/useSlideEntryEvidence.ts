import { useEffect, useRef } from 'react';
import { useBootRuntime } from './BootRuntimeContext';

export function useSlideEntryEvidence(slide: number) {
  const boot = useBootRuntime();
  const lastSlideRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastSlideRef.current === slide) return;
    lastSlideRef.current = slide;
    boot.recordSlideEntry(slide);
  }, [boot, slide]);
}
