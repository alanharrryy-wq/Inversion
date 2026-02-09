import { useEffect, useMemo, useRef, useState } from 'react';
import { TourOverlayPhase } from '../types';
import { DEFAULT_CHOREO_DURATIONS, REDUCED_CHOREO_DURATIONS, StepChoreoDurations, StepChoreoState } from './types';

type Params = {
  enabled: boolean;
  reducedMotion: boolean;
  stepId?: string;
  stepComplete: boolean;
};

function durationsFor(reducedMotion: boolean): StepChoreoDurations {
  return reducedMotion ? REDUCED_CHOREO_DURATIONS : DEFAULT_CHOREO_DURATIONS;
}

function phaseOrder(): TourOverlayPhase[] {
  return ['intro', 'guide', 'success', 'tease'];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function useStepChoreo(params: Params): StepChoreoState {
  const { enabled, reducedMotion, stepId, stepComplete } = params;
  const [phase, setPhase] = useState<TourOverlayPhase>('intro');
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const prevStepRef = useRef<string>('');
  const prevCompleteRef = useRef<boolean>(false);

  const durations = useMemo(() => durationsFor(reducedMotion), [reducedMotion]);

  useEffect(() => {
    if (!enabled || !stepId) {
      setPhase('intro');
      setProgress(0);
      return;
    }

    if (prevStepRef.current !== stepId) {
      prevStepRef.current = stepId;
      prevCompleteRef.current = false;
      setPhase('intro');
      setProgress(0);
      setCycle((prev) => prev + 1);
    }
  }, [enabled, stepId]);

  useEffect(() => {
    if (!enabled || !stepId) return;

    if (stepComplete && !prevCompleteRef.current) {
      prevCompleteRef.current = true;
      setPhase('success');
      setProgress(0);
      setCycle((prev) => prev + 1);
      return;
    }

    if (!stepComplete) {
      prevCompleteRef.current = false;
    }
  }, [enabled, stepId, stepComplete]);

  useEffect(() => {
    if (!enabled) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const order = phaseOrder();
    const duration =
      phase === 'intro'
        ? durations.introMs
        : phase === 'guide'
        ? durations.guideMs
        : phase === 'success'
        ? durations.successMs
        : durations.teaseMs;

    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const nextProgress = clamp01(elapsed / duration);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        const idx = order.indexOf(phase);
        const next = order[Math.min(order.length - 1, idx + 1)];

        if (phase === 'guide') {
          startRef.current = now;
          setProgress(0);
          frameRef.current = requestAnimationFrame(tick);
          return;
        }

        if (phase === 'tease') {
          setPhase('guide');
          setCycle((prev) => prev + 1);
          startRef.current = now;
          setProgress(0);
          frameRef.current = requestAnimationFrame(tick);
          return;
        }

        if (next !== phase) {
          setPhase(next);
          setCycle((prev) => prev + 1);
          startRef.current = now;
          setProgress(0);
          frameRef.current = requestAnimationFrame(tick);
          return;
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    startRef.current = 0;
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      startRef.current = 0;
    };
  }, [cycle, durations.guideMs, durations.introMs, durations.successMs, durations.teaseMs, enabled, phase]);

  return {
    phase,
    cycle,
    progress,
    successVisible: phase === 'success',
  };
}
