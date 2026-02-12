import React, { useEffect, useMemo, useRef } from "react";
import { EvidenceStepId } from "../core/evidence";
import { Slide03CardViewModel } from "../core/fsm/selectors";

interface EvidenceCardProps {
  card: Slide03CardViewModel;
  onPointerStart: (stepId: EvidenceStepId, pointerId: number) => void;
  onPointerFrame: (stepId: EvidenceStepId, pointerId: number, ratio: number) => void;
  onPointerEnd: (stepId: EvidenceStepId, pointerId: number) => void;
  onPointerCancel: (stepId: EvidenceStepId, pointerId: number, reason: string) => void;
  onConfirmStep: (stepId: EvidenceStepId) => void;
}

interface ActivePointer {
  active: boolean;
  pointerId: number;
  clientX: number;
}

const clampRatio = (ratio: number): number => {
  if (!Number.isFinite(ratio)) return 0;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
};

const statusLabel = (card: Slide03CardViewModel): string => {
  if (card.locked) return "locked";
  if (card.revealed) return "revealed";
  if (card.armed) return "armed";
  if (!card.enabled) return "waiting";
  if (card.visualState === "in_progress") return "arming";
  return "pending";
};

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  card,
  onPointerStart,
  onPointerFrame,
  onPointerEnd,
  onPointerCancel,
  onConfirmStep,
}) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<ActivePointer | null>(null);

  const canInteract = card.enabled && !card.revealed && !card.locked;
  const confirmEnabled = canInteract && card.armed;

  const status = useMemo(() => statusLabel(card), [card]);

  const stopFrame = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const emitFrame = () => {
    const pointer = pointerRef.current;
    const rail = railRef.current;

    if (!pointer || !pointer.active || !rail) {
      stopFrame();
      return;
    }

    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) {
      stopFrame();
      return;
    }

    const ratio = clampRatio((pointer.clientX - rect.left) / rect.width);
    onPointerFrame(card.stepId, pointer.pointerId, ratio);
    frameRef.current = requestAnimationFrame(emitFrame);
  };

  const startFrame = () => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(emitFrame);
  };

  const clearPointer = () => {
    pointerRef.current = null;
    stopFrame();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canInteract) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    pointerRef.current = {
      active: true,
      pointerId: event.pointerId,
      clientX: event.clientX,
    };

    onPointerStart(card.stepId, event.pointerId);
    startFrame();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = pointerRef.current;
    if (!active || !active.active) return;
    if (active.pointerId !== event.pointerId) return;
    active.clientX = event.clientX;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = pointerRef.current;
    if (!active || !active.active) return;
    if (active.pointerId !== event.pointerId) return;

    const rail = railRef.current;
    if (rail) {
      const rect = rail.getBoundingClientRect();
      if (rect.width > 0) {
        const ratio = clampRatio((event.clientX - rect.left) / rect.width);
        onPointerFrame(card.stepId, event.pointerId, ratio);
      }
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    onPointerEnd(card.stepId, event.pointerId);
    clearPointer();
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = pointerRef.current;
    if (!active || !active.active) return;
    if (active.pointerId !== event.pointerId) return;

    onPointerCancel(card.stepId, event.pointerId, "pointer-cancel");
    clearPointer();
  };

  const handleGestureClick = () => {
    if (!canInteract) return;
    if (card.armed) return;
    const syntheticPointerId = 9000 + card.ordinal;
    onPointerStart(card.stepId, syntheticPointerId);
    onPointerFrame(card.stepId, syntheticPointerId, 1);
    onPointerEnd(card.stepId, syntheticPointerId);
  };

  useEffect(() => {
    const onBlur = () => {
      const active = pointerRef.current;
      if (!active || !active.active) return;
      onPointerCancel(card.stepId, active.pointerId, "window-blur");
      clearPointer();
    };

    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      clearPointer();
    };
  }, [card.stepId, onPointerCancel]);

  const cardId = card.stepId.toLowerCase();
  const progressWidth = `${card.progressPercent}%`;
  const thresholdLeft = `${card.thresholdPercent}%`;

  return (
    <article className="slide03-card" data-visual={card.visualState} data-testid={`slide03-card-${cardId}`}>
      <header className="slide03-card-head">
        <div className="slide03-chip-row">
          <span className="slide03-chip-step">{card.stepId}</span>
          <span
            className="slide03-chip-status"
            data-state={card.visualState}
            data-testid={`slide03-card-${cardId}-status-chip`}
          >
            {status}
          </span>
        </div>
        <h3 className="slide03-title">{card.title}</h3>
        <p className="slide03-body">{card.purpose}</p>
      </header>

      <div className="slide03-card-metrics">
        <div className="slide03-metric-box">
          <span className="slide03-metric-label">Confidence After</span>
          <span className="slide03-metric-value" data-testid={`slide03-card-${cardId}-metric-main`}>
            {card.confidenceAfterReveal}
          </span>
        </div>
        <div className="slide03-metric-box">
          <span className="slide03-metric-label">Uncertainty After</span>
          <span className="slide03-metric-value" data-testid={`slide03-card-${cardId}-metric-support`}>
            {card.uncertaintyAfterReveal}
          </span>
        </div>
      </div>

      <div className="slide03-gesture-wrap">
        <div className="slide03-gesture-label-row">
          <span className="slide03-gesture-label" data-testid={`slide03-card-${cardId}-state`}>
            {card.visualState}
          </span>
          <span className="slide03-gesture-threshold">
            unlock at {card.thresholdPercent}%
          </span>
        </div>
        <div
          ref={railRef}
          className="slide03-gesture-track"
          data-enabled={canInteract ? "true" : "false"}
          data-armed={card.armed ? "true" : "false"}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerCancel}
          onClick={handleGestureClick}
          role="button"
          tabIndex={0}
          aria-label={`Evidence gesture ${card.stepId}`}
          data-testid={`slide03-card-${cardId}-gesture`}
        >
          <span className="slide03-gesture-fill" style={{ width: progressWidth }} />
          <span className="slide03-gesture-threshold-marker" style={{ left: thresholdLeft }} />
          <span className="slide03-gesture-knob" style={{ left: progressWidth }} />
        </div>
      </div>

      <footer className="slide03-confirm-row">
        <span className="slide03-progress-text" data-testid={`slide03-card-${cardId}-progress`}>
          progress {card.progressPercent}%
        </span>
        <button
          type="button"
          className="slide03-confirm-btn"
          onClick={() => onConfirmStep(card.stepId)}
          disabled={!confirmEnabled}
          data-testid={`slide03-card-${cardId}-confirm`}
        >
          confirm
        </button>
      </footer>
    </article>
  );
};
