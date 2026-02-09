import React, { useEffect, useMemo, useState } from 'react';
import { TourStep } from './types';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

type Rect = { left: number; top: number; width: number; height: number };

function getRect(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function coachStyle(rect: Rect | null, placement: TourStep['placement']): React.CSSProperties {
  if (!rect || !placement || placement === 'center') {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  const gap = 18;
  if (placement === 'right') return { left: rect.left + rect.width + gap, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' };
  if (placement === 'left') return { left: rect.left - gap, top: rect.top + rect.height / 2, transform: 'translate(-100%, -50%)' };
  if (placement === 'top') return { left: rect.left + rect.width / 2, top: rect.top - gap, transform: 'translate(-50%, -100%)' };
  return { left: rect.left + rect.width / 2, top: rect.top + rect.height + gap, transform: 'translate(-50%, 0)' };
}

export function TourOverlay(props: {
  active: boolean;
  scriptTitle: string;
  stepIndex: number;
  totalSteps: number;
  step: TourStep | null;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onStart: () => void;
  onPasteQuestion: (text: string) => void;
}) {
  const { active, scriptTitle, stepIndex, totalSteps, step, canNext, onBack, onNext, onSkip, onStart, onPasteQuestion } = props;
  const [rect, setRect] = useState<Rect | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || !step?.targetSelector) {
      setRect(null);
      return;
    }

    const update = () => setRect(getRect(step.targetSelector));
    update();
    const id = window.setInterval(update, 120);
    window.addEventListener('resize', update);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('resize', update);
    };
  }, [active, step?.targetSelector]);

  const coach = useMemo(() => coachStyle(rect, step?.placement), [rect, step?.placement]);

  if (!active) {
    return (
      <div className="wow-tour-launch">
        <button type="button" className="wow-tour-launch__btn" onClick={onStart}>Start Tour</button>
      </div>
    );
  }

  return (
    <div className={`wow-tour ${reducedMotion ? 'wow-tour--reduced' : ''}`}>
      <div className="wow-tour__backdrop" />
      {rect && (
        <>
          <div
            className="wow-tour__spotlight"
            style={{ left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16 }}
          />
          <div
            className="wow-tour__ring"
            style={{ left: rect.left - 10, top: rect.top - 10, width: rect.width + 20, height: rect.height + 20 }}
          />
        </>
      )}

      <aside className="wow-tour__coach" style={coach}>
        <div className="wow-tour__hud">{scriptTitle} · Step {Math.min(stepIndex + 1, totalSteps)}/{totalSteps}</div>
        <h4 className="wow-tour__title">{step?.title ?? 'Tour complete'}</h4>
        <p className="wow-tour__instruction">{step?.instruction ?? 'Tour completed. You can stop or restart.'}</p>
        {step?.pasteQuestion && (
          <button type="button" className="wow-tour__paste" onClick={() => onPasteQuestion(step.pasteQuestion!)}>
            Paste question
          </button>
        )}
        <div className="wow-tour__controls">
          <button type="button" onClick={onBack} disabled={stepIndex <= 0}>Back</button>
          <button type="button" onClick={onNext} disabled={!canNext}>Next</button>
          <button type="button" onClick={onSkip}>Skip</button>
        </div>
      </aside>
    </div>
  );
}
