import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CancelReason = "pointer-cancel" | "blur" | "unmount" | "lost-capture";

export type SealActionProps = {
  phase: "idle" | "arming" | "locking" | "sealed";
  canAttemptLock: boolean;
  holdProgress: number;
  holdPercentLabel: string;
  guardMessage: string | null;
  statusMessage: string;
  onPointerDown: (atMs: number) => void;
  onPointerTick: (atMs: number) => void;
  onPointerUp: (atMs: number) => void;
  onPointerCancel: (atMs: number, reason: CancelReason) => void;
  onReset: () => void;
};

function nowMs() {
  if (typeof performance !== "undefined") {
    return performance.now();
  }
  return Date.now();
}

export function SealAction(props: SealActionProps) {
  const [isHolding, setIsHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const hasPointerCaptureRef = useRef(false);
  const holdActiveRef = useRef(false);

  const stopLoop = useCallback(() => {
    holdActiveRef.current = false;
    hasPointerCaptureRef.current = false;
    setIsHolding(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const onFrame = useCallback(
    (timestamp: number) => {
      if (!holdActiveRef.current) {
        return;
      }
      props.onPointerTick(timestamp);
      rafRef.current = requestAnimationFrame(onFrame);
    },
    [props.onPointerTick]
  );

  const startLoop = useCallback(() => {
    if (holdActiveRef.current) {
      return;
    }
    holdActiveRef.current = true;
    setIsHolding(true);
    rafRef.current = requestAnimationFrame(onFrame);
  }, [onFrame]);

  const cancelHold = useCallback(
    (reason: CancelReason) => {
      if (!holdActiveRef.current && props.phase !== "locking") {
        return;
      }
      stopLoop();
      props.onPointerCancel(nowMs(), reason);
    },
    [props, stopLoop]
  );

  const handleWindowBlur = useCallback(() => {
    cancelHold("blur");
  }, [cancelHold]);

  useEffect(() => {
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      if (holdActiveRef.current) {
        cancelHold("unmount");
      }
      stopLoop();
    };
  }, [cancelHold, handleWindowBlur, stopLoop]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!props.canAttemptLock) {
        return;
      }
      if (props.phase !== "arming") {
        return;
      }

      pointerIdRef.current = event.pointerId;
      hasPointerCaptureRef.current = false;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
        hasPointerCaptureRef.current = true;
      } catch {
        // no-op: some browsers/testing contexts may not support pointer capture here
      }
      props.onPointerDown(nowMs());
      startLoop();
    },
    [props, startLoop]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }
      if (hasPointerCaptureRef.current) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // no-op: capture may already be released by platform
        }
      }
      pointerIdRef.current = null;
      hasPointerCaptureRef.current = false;
      stopLoop();
      props.onPointerUp(nowMs());
    },
    [props, stopLoop]
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }
      pointerIdRef.current = null;
      hasPointerCaptureRef.current = false;
      cancelHold("pointer-cancel");
    },
    [cancelHold]
  );

  const handleLostPointerCapture = useCallback(() => {
    if (!hasPointerCaptureRef.current) {
      return;
    }
    if (pointerIdRef.current == null) {
      return;
    }
    hasPointerCaptureRef.current = false;
    pointerIdRef.current = null;
    cancelHold("lost-capture");
  }, [cancelHold]);

  const buttonLabel = useMemo(() => {
    if (props.phase === "sealed") {
      return "SEALED";
    }
    if (isHolding || props.phase === "locking") {
      return "HOLDING";
    }
    return "HOLD TO SEAL";
  }, [props.phase, isHolding]);

  const isDisabled =
    props.phase === "sealed" || (!props.canAttemptLock && props.phase !== "locking");

  return (
    <section className="s04-seal-action">
      <div className="s04-seal-row">
        <div>
          <p className="s04-seal-title">Final Lock Action</p>
          <p className="s04-seal-status" data-testid="s04-seal-status">
            {props.statusMessage}
          </p>
        </div>
        <button
          type="button"
          className="s04-btn"
          data-variant="danger"
          data-testid="s04-seal-reset"
          onClick={props.onReset}
        >
          reset
        </button>
      </div>

      <button
        type="button"
        className="s04-seal-button"
        data-disabled={isDisabled ? "true" : "false"}
        data-testid="s04-seal-action"
        disabled={isDisabled}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        style={{ touchAction: "none" }}
      >
        <strong>{buttonLabel}</strong>
        <br />
        <span>Release after full progress to seal route + evidence handoff.</span>
      </button>

      <div className="s04-seal-progress" data-testid="s04-seal-progress" aria-valuenow={Math.round(props.holdProgress * 100)}>
        <span style={{ width: `${Math.round(props.holdProgress * 100)}%` }} />
      </div>

      {props.guardMessage ? (
        <p className="s04-seal-status" style={{ color: "#ffd1d5" }}>
          Guard: {props.guardMessage}
        </p>
      ) : (
        <p className="s04-seal-status">Progress: {props.holdPercentLabel}</p>
      )}
    </section>
  );
}

export default SealAction;
