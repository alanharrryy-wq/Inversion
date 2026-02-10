import React, { useEffect, useMemo, useState } from 'react';
import {
  WOW_DIAGNOSTICS,
  WOW_DIRECTOR_OVERLAY,
  WOW_DIRECTOR_MODE,
  WOW_FLAGS,
  WOW_GUIDE_DIAGNOSTICS,
  WOW_GUIDE_ENGINE,
  WOW_GUIDE_UI,
  WOW_OPERATOR_PANEL,
  WOW_SPOTLIGHT_V2,
  WOW_TARGET_MAGNET,
  WOW_TOUR_CHOREO,
  WOW_TOUR_POLISH,
} from '../../config/wow';
import { createGuidanceSuggestions } from '../guide/aiGuidance.stub';
import { hasTourTarget, setTargetPulse } from './events';
import { TourAutostartStatus, TourStep } from './types';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useChoreoPhases } from './choreo/useChoreoPhases';
import { SpotlightV2, SpotlightRect } from './ui/SpotlightV2';
import { TargetMagnet } from './ui/TargetMagnet';
import { CoachmarkCard } from './ui/CoachmarkCard';
import { DirectorOverlay } from './director/DirectorOverlay';
import { ArrowHint } from './ui/ArrowHint';
import { ProgressBadge } from './ui/ProgressBadge';
import { PulseRing } from './ui/PulseRing';
import { StepHeader } from './ui/StepHeader';
import { SuccessToast } from './ui/SuccessToast';
import { GuideHeader, GuideHints, GuideOperatorPanel, GuidePulse, GuideToast } from './ui';
import type { GuideOverlayModel } from './guide/types';
import { GuideOperatorDock, GuideScaffold } from './guide/ui';

type Rect = { left: number; top: number; width: number; height: number };

function getRect(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function getSpotlightRect(rect: Rect | null, step: TourStep | null): SpotlightRect | null {
  if (!rect) return null;
  const pad = Math.max(0, step?.spotlightPadding ?? 10);
  return {
    left: rect.left - pad,
    top: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    radius: Math.max(8, step?.spotlightRadius ?? 16),
  };
}

function coachStyle(rect: SpotlightRect | null, placement: TourStep['placement']): React.CSSProperties {
  if (!rect || !placement || placement === 'center') {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  }

  const gap = 18;
  if (placement === 'right') return { left: rect.left + rect.width + gap, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' };
  if (placement === 'left') return { left: rect.left - gap, top: rect.top + rect.height / 2, transform: 'translate(-100%, -50%)' };
  if (placement === 'top') return { left: rect.left + rect.width / 2, top: rect.top - gap, transform: 'translate(-50%, -100%)' };
  return { left: rect.left + rect.width / 2, top: rect.top + rect.height + gap, transform: 'translate(-50%, 0)' };
}

function connectorPath(source: SpotlightRect | null, coach: React.CSSProperties): string {
  if (!source || typeof coach.left !== 'number' || typeof coach.top !== 'number') return '';
  const startX = source.left + source.width / 2;
  const startY = source.top + source.height / 2;
  const endX = coach.left;
  const endY = coach.top;
  const cx = (startX + endX) / 2;
  const cy = startY - 18;
  return `M ${startX} ${startY} Q ${cx} ${cy}, ${endX} ${endY}`;
}

function successMessage(step: TourStep | null): string {
  const label = step?.successLabel ?? step?.successText ?? 'Step complete';
  return `✓ ${label}`;
}

export function TourOverlay(props: {
  active: boolean;
  scriptTitle: string;
  stepIndex: number;
  totalSteps: number;
  step: TourStep | null;
  status: 'idle' | 'running' | 'paused' | 'completed';
  canNext: boolean;
  targetExists: boolean;
  autostartStatus: TourAutostartStatus;
  stepComplete: boolean;
  completedStepIds: string[];
  guideOverlayModel?: GuideOverlayModel | null;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onStart: () => void;
  onPasteQuestion: (text: string) => void;
}) {
  const {
    active,
    scriptTitle,
    stepIndex,
    totalSteps,
    step,
    status,
    canNext,
    targetExists,
    autostartStatus,
    stepComplete,
    completedStepIds,
    guideOverlayModel,
    onBack,
    onNext,
    onSkip,
    onRestart,
    onStart,
    onPasteQuestion,
  } = props;

  const [rect, setRect] = useState<Rect | null>(null);
  const [overlayZ, setOverlayZ] = useState('unknown');
  const [directorOpen, setDirectorOpen] = useState(false);
  const [toast, setToast] = useState('');
  const reducedMotion = usePrefersReducedMotion();

  const choreo = useChoreoPhases({
    enabled: active && WOW_TOUR_CHOREO && !WOW_GUIDE_ENGINE,
    reducedMotion,
    stepId: step?.id,
    stepComplete,
  });

  useEffect(() => {
    if (!active || !step?.targetSelector) {
      setRect(null);
      return;
    }

    let raf = 0;
    let last = 0;

    const update = (ts = performance.now()) => {
      if (ts - last < 70) {
        raf = requestAnimationFrame(update);
        return;
      }
      last = ts;
      setRect(getRect(step.targetSelector));
      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    window.addEventListener('resize', update as unknown as EventListener);
    window.addEventListener('scroll', update as unknown as EventListener, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update as unknown as EventListener);
      window.removeEventListener('scroll', update as unknown as EventListener, true);
    };
  }, [active, step?.targetSelector]);

  useEffect(() => {
    if (!active || !step?.pulseTarget) return;
    return setTargetPulse(step.targetSelector);
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const root = document.querySelector('.wow-tour') as HTMLElement | null;
    if (!root) return;
    setOverlayZ(window.getComputedStyle(root).zIndex || 'none');
  }, [active, stepIndex]);

  useEffect(() => {
    if (!active) return;
    if (completedStepIds.length === 0) return;
    setToast(successMessage(step));
    const timer = window.setTimeout(() => setToast(''), reducedMotion ? 700 : 1350);
    return () => window.clearTimeout(timer);
  }, [active, completedStepIds.length, reducedMotion, step]);

  const spotlight = useMemo(() => getSpotlightRect(rect, step), [rect, step]);
  const coach = useMemo(() => coachStyle(spotlight, step?.placement), [spotlight, step?.placement]);
  const connector = useMemo(() => (step?.connector ? connectorPath(spotlight, coach) : ''), [coach, step?.connector, spotlight]);
  const canGoNext = canNext || (!targetExists && !!step?.fallbackAllowNext);
  const activePhaseClass = WOW_TOUR_CHOREO && !WOW_GUIDE_ENGINE ? choreo.phaseClassName : 'wow-tour--phase-guide';
  const showGuideScaffold = WOW_GUIDE_ENGINE && WOW_GUIDE_UI && Boolean(guideOverlayModel);
  const showGuideOperatorPanel = WOW_GUIDE_ENGINE && WOW_GUIDE_UI && WOW_OPERATOR_PANEL && Boolean(guideOverlayModel);
  const useLegacyGuideWidgets = WOW_GUIDE_ENGINE && WOW_TOUR_POLISH && !WOW_GUIDE_UI;
  const guidanceHints = createGuidanceSuggestions({
    state: {
      status,
      scriptId: null,
      stepIndex,
      completedStepIds,
      eventLog: [],
      currentSlide: 0,
    },
    step: step
      ? {
          id: step.id,
          title: step.title,
          body: step.body,
          completion: { type: 'manual' },
          tease: step.nextTease,
          notes: step.directorNotes,
        }
      : null,
    scriptTitle,
  });

  if (!active) {
    return (
      <div className="wow-tour-launch wow-tour-surface-glass" data-testid="tour-launch">
        <div className="wow-tour-launch__title">Guided Demo</div>
        <button type="button" className="wow-tour-launch__btn" onClick={onStart}>Start Tour</button>
        {!autostartStatus.started && autostartStatus.reason !== 'not-requested' && (
          <p className="wow-tour-launch__hint">Autostart failed: {autostartStatus.reason}</p>
        )}
      </div>
    );
  }

  const completionView = status === 'completed';

  return (
    <div className={`wow-tour ${reducedMotion ? 'wow-tour--reduced' : ''} ${activePhaseClass}`} data-testid="tour-overlay">
      {WOW_SPOTLIGHT_V2 ? (
        <SpotlightV2
          active={active}
          rect={spotlight}
          phaseClass={activePhaseClass}
          reducedMotion={reducedMotion}
          enableBlur={true}
        />
      ) : (
        <>
          <div className="wow-tour__backdrop" />
          {spotlight && (
            <>
              <div className="wow-tour__spotlight" style={{ left: spotlight.left, top: spotlight.top, width: spotlight.width, height: spotlight.height, borderRadius: spotlight.radius }} />
              <div className="wow-tour__ring" style={{ left: spotlight.left, top: spotlight.top, width: spotlight.width, height: spotlight.height, borderRadius: spotlight.radius }} />
            </>
          )}
        </>
      )}

      {spotlight && step?.connector && (
        <svg className="wow-tour__connector" aria-hidden="true">
          <path d={connector} />
        </svg>
      )}

      {WOW_TARGET_MAGNET && spotlight ? (
        <TargetMagnet active={active} rect={spotlight} placement={step?.placement} phaseClass={activePhaseClass} />
      ) : null}

      <div className="wow-tour__coach-shell" style={coach}>
        {WOW_TOUR_POLISH && (
          <div className="wow-tour-operator-shell wow-motion-enter">
            <StepHeader title={step?.title ?? 'Tour ready'} subtitle={scriptTitle} phaseLabel={choreo.phase} />
            <ProgressBadge current={stepIndex + 1} total={totalSteps} />
          </div>
        )}
        {useLegacyGuideWidgets ? (
          <GuideHeader title={step?.title ?? 'Guide ready'} subtitle={scriptTitle} stepIndex={stepIndex} totalSteps={totalSteps} />
        ) : null}

        {WOW_TOUR_POLISH && step?.nextTease ? <ArrowHint label={step.nextTease} direction="right" /> : null}
        {useLegacyGuideWidgets ? <GuideHints tease={step?.nextTease} hints={guidanceHints} /> : null}

        <CoachmarkCard
          scriptTitle={scriptTitle}
          step={
            completionView
              ? {
                  id: 'tour-complete',
                  title: 'Demo complete',
                  body: 'Evidence captured. Traceability demonstrated. Deployment commitment aligned.',
                  footnote: 'Next: launch deploy plan and stakeholder onboarding.',
                  action: { type: 'state', text: 'Use Restart to replay the guided loop.' },
                  successText: 'Tour finished successfully.',
                  successLabel: 'Demo complete',
                  completion: { type: 'manual' },
                  allowNextBeforeComplete: true,
                }
              : step
          }
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          canGoNext={canGoNext}
          targetExists={targetExists}
          onBack={onBack}
          onNext={onNext}
          onSkip={onSkip}
          onRestart={onRestart}
          onPasteQuestion={onPasteQuestion}
          stepSuccessToast={toast}
        />
        {showGuideScaffold && guideOverlayModel ? (
          <GuideScaffold
            scriptTitle={scriptTitle}
            status={status}
            model={guideOverlayModel}
            toast={toast}
          />
        ) : null}
        {WOW_TOUR_POLISH && (
          <>
            <PulseRing active={Boolean(spotlight)} className="wow-tour-coachmark__pulse-ring" intensity={choreo.successVisible ? 'strong' : 'soft'} />
            <SuccessToast visible={Boolean(toast)} text={toast} />
          </>
        )}
        {useLegacyGuideWidgets ? <GuidePulse active={Boolean(spotlight)} /> : null}
        {useLegacyGuideWidgets ? <GuideToast visible={Boolean(toast)} text={toast} /> : null}
      </div>

      {WOW_DIRECTOR_MODE && WOW_DIRECTOR_OVERLAY ? (
        <DirectorOverlay
          enabled={directorOpen}
          scriptTitle={scriptTitle}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          operatorScript={
            step
              ? {
                  stepId: step.id,
                  callouts: (step.directorNotes ?? ['Lead with evidence before claim.']).map((note, index) => ({
                    id: `note-${index}`,
                    label: `Cue ${index + 1}`,
                    detail: note,
                  })),
                  highlightLines: step.nextTease
                    ? [{ id: 'next', label: `Next cue: ${step.nextTease}` }]
                    : [{ id: 'default', label: 'Next cue: transition to deployment confidence.' }],
                }
              : undefined
          }
          onToggle={() => setDirectorOpen((prev) => !prev)}
        />
      ) : null}
      {WOW_GUIDE_ENGINE && WOW_DIRECTOR_OVERLAY && !showGuideOperatorPanel ? (
        <GuideOperatorPanel
          open={directorOpen}
          onToggle={() => setDirectorOpen((prev) => !prev)}
          notes={step?.directorNotes ?? ['State expected evidence before advancing.']}
        />
      ) : null}
      {showGuideOperatorPanel && guideOverlayModel ? (
        <GuideOperatorDock
          open={directorOpen}
          onToggle={() => setDirectorOpen((prev) => !prev)}
          notes={guideOverlayModel.directorNotes}
          nextTease={guideOverlayModel.nextTease}
          nextStepTitle={guideOverlayModel.nextStepTitle}
          blockedReasons={guideOverlayModel.blockedReasons}
          missingEvidence={guideOverlayModel.missingEvidence}
        />
      ) : null}

      {WOW_DIAGNOSTICS && (
        <aside className="wow-tour__diagnostics" data-testid="tour-diagnostics">
          <h5>WOW Diagnostics</h5>
          <div>flags: {Object.entries(WOW_FLAGS).filter(([, v]) => !!v).map(([k]) => k).join(', ') || 'none'}</div>
          <div>stepId: {step?.id ?? 'none'}</div>
          <div>status: {active ? 'running' : 'idle'}</div>
          <div>targetExists: {String(targetExists)}</div>
          <div>phase: {WOW_TOUR_CHOREO ? choreo.phase : 'disabled'}</div>
          <div>overlayZ: {overlayZ}</div>
          <div>autostart: {autostartStatus.reason} ({autostartStatus.attempts})</div>
          <div>selectorMounted: {String(hasTourTarget(step?.targetSelector))}</div>
          {WOW_GUIDE_DIAGNOSTICS && guideOverlayModel && (
            <>
              <div>guideStep: {guideOverlayModel.stepId ?? 'none'}</div>
              <div>guideBlockers: {guideOverlayModel.blockedReasons.length}</div>
              <div>guideMissingEvidence: {guideOverlayModel.missingEvidence.length}</div>
              <div>guideSatisfiedEvidence: {guideOverlayModel.satisfiedEvidence.length}</div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
