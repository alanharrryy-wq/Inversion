import React from 'react';
import { TourStep } from '../types';

type Props = {
  scriptTitle: string;
  step: TourStep | null;
  stepIndex: number;
  totalSteps: number;
  canGoNext: boolean;
  targetExists: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onPasteQuestion: (text: string) => void;
  stepSuccessToast?: string;
};

function actionText(step: TourStep | null): string {
  if (!step) return '';
  if (step.action.type === 'click') return 'Click the highlighted control now.';
  return step.action.text;
}

export function CoachmarkCard(props: Props) {
  const {
    scriptTitle,
    step,
    stepIndex,
    totalSteps,
    canGoNext,
    targetExists,
    onBack,
    onNext,
    onSkip,
    onRestart,
    onPasteQuestion,
    stepSuccessToast,
  } = props;

  return (
    <aside className="wow-tour-coachmark">
      <div className="wow-tour-coachmark__eyebrow">{scriptTitle}</div>
      <div className="wow-tour-coachmark__progress">Step {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}</div>
      <h4 className="wow-tour-coachmark__title">{step?.title ?? 'Demo complete'}</h4>
      <p className="wow-tour-coachmark__body">{step?.body ?? 'Tour completed.'}</p>
      {step?.footnote ? <p className="wow-tour-coachmark__footnote">{step.footnote}</p> : null}
      <p className="wow-tour-coachmark__action">Do this now: {actionText(step)}</p>
      <p className="wow-tour-coachmark__success">Success criteria: {step?.successText ?? 'Done'}</p>
      {step?.nextTease ? <p className="wow-tour-coachmark__tease">What happens next: {step.nextTease}</p> : null}
      {!targetExists && step?.missingTargetWarning ? (
        <p className="wow-tour-coachmark__warning">Target fallback: {step.missingTargetWarning}</p>
      ) : null}

      {step?.readAloudText ? (
        <div className="wow-tour-coachmark__readaloud">
          <div className="wow-tour-coachmark__readaloud-label">Read Aloud</div>
          <p>{step.readAloudText}</p>
        </div>
      ) : null}

      {step?.pasteQuestion && (
        <button type="button" className="wow-tour-coachmark__ask" onClick={() => onPasteQuestion(step.pasteQuestion!)}>
          Ask this now
        </button>
      )}

      <div className="wow-tour-coachmark__controls">
        <button type="button" onClick={onBack} disabled={stepIndex <= 0}>Prev</button>
        <button type="button" onClick={onNext} disabled={!canGoNext}>Next</button>
        <button type="button" onClick={onSkip}>Skip</button>
        <button type="button" onClick={onRestart}>Restart</button>
      </div>

      {stepSuccessToast ? <div className="wow-tour-coachmark__toast">{stepSuccessToast}</div> : null}
    </aside>
  );
}
