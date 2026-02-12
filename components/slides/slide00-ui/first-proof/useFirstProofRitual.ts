import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialFirstProofState,
  deriveFirstProofSnapshot,
  resolveFirstProofThresholds,
  transitionFirstProofState,
} from "./firstProof.helpers";
import { resolveFirstProofProfileSetting } from "./firstProof.copy";
import {
  FirstProofCanonicalProfile,
  FirstProofMachineEvent,
  FirstProofRuntimeSignal,
  FirstProofSnapshot,
  FirstProofState,
  FirstProofThresholds,
  FirstProofTransitionResult,
} from "./firstProof.types";

export type FirstProofOperatorLogWriter = (entry: {
  level: "info" | "success" | "warning";
  title: string;
  detail: string;
  action: string;
  ts?: number;
}) => void;

export type UseFirstProofRitualOptions = {
  profile?: FirstProofCanonicalProfile;
  thresholds?: Partial<FirstProofThresholds>;
  recordAnchorInteraction?: (anchorId: string, note?: string, ts?: number) => void;
  appendOperatorLog?: FirstProofOperatorLogWriter;
  onSignal?: (signal: FirstProofRuntimeSignal, nextState: FirstProofState) => void;
};

type FirstProofGestureHandlers = {
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
};

export type UseFirstProofRitualResult = {
  profile: FirstProofCanonicalProfile;
  state: FirstProofState;
  snapshot: FirstProofSnapshot;
  thresholds: FirstProofThresholds;
  gestureHandlers: FirstProofGestureHandlers;
  dispatchMachineEvent: (event: FirstProofMachineEvent) => void;
  reset: () => void;
};

function nowTs(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function toMachineEvent(
  event: React.PointerEvent<HTMLDivElement>,
  type: "pointer_down" | "pointer_move" | "pointer_up" | "pointer_cancel"
): FirstProofMachineEvent {
  return {
    type,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    ts: event.timeStamp || nowTs(),
  };
}

type FirstProofSignalHandlers = {
  recordAnchorInteraction?: (anchorId: string, note?: string, ts?: number) => void;
  appendOperatorLog?: FirstProofOperatorLogWriter;
  onSignal?: (signal: FirstProofRuntimeSignal, nextState: FirstProofState) => void;
};

function applySignals(
  handlers: FirstProofSignalHandlers,
  result: FirstProofTransitionResult
): void {
  if (result.signals.length === 0) {
    return;
  }

  for (const signal of result.signals) {
    if (signal.kind === "anchor") {
      handlers.recordAnchorInteraction?.(signal.anchorId, signal.note, Date.now());
    }

    if (signal.kind === "evidence") {
      handlers.appendOperatorLog?.({
        level: signal.level,
        title: signal.title,
        detail: signal.detail,
        action: signal.action,
        ts: Date.now(),
      });
    }

    handlers.onSignal?.(signal, result.state);
  }
}

export function useFirstProofRitual(
  options: UseFirstProofRitualOptions = {}
): UseFirstProofRitualResult {
  const {
    profile: profileOption,
    thresholds: thresholdOverrides,
    recordAnchorInteraction,
    appendOperatorLog,
    onSignal,
  } = options;

  const profile = useMemo(
    () => resolveFirstProofProfileSetting(profileOption),
    [profileOption]
  );

  const thresholds = useMemo(
    () => resolveFirstProofThresholds(thresholdOverrides),
    [thresholdOverrides]
  );

  const [state, setState] = useState<FirstProofState>(() =>
    createInitialFirstProofState()
  );

  const stateRef = useRef<FirstProofState>(state);
  const rafIdRef = useRef<number | null>(null);
  const rafPrevTsRef = useRef<number | null>(null);
  const signalHandlersRef = useRef<FirstProofSignalHandlers>({
    recordAnchorInteraction,
    appendOperatorLog,
    onSignal,
  });

  useEffect(() => {
    signalHandlersRef.current = {
      recordAnchorInteraction,
      appendOperatorLog,
      onSignal,
    };
  }, [appendOperatorLog, onSignal, recordAnchorInteraction]);

  const commitTransition = useCallback(
    (result: FirstProofTransitionResult) => {
      stateRef.current = result.state;
      setState(result.state);
      applySignals(signalHandlersRef.current, result);
    },
    []
  );

  const dispatchMachineEvent = useCallback(
    (machineEvent: FirstProofMachineEvent) => {
      const transition = transitionFirstProofState(
        stateRef.current,
        machineEvent,
        thresholds
      );
      commitTransition(transition);
    },
    [commitTransition, thresholds]
  );

  useEffect(() => {
    if (!state.pointerActive || state.activePointerId == null || state.releaseCommitted) {
      return;
    }

    const pointerId = state.activePointerId;
    let cancelled = false;

    const loop = (tickTs: number) => {
      if (cancelled) {
        return;
      }

      const prev = rafPrevTsRef.current ?? tickTs;
      rafPrevTsRef.current = tickTs;
      const deltaMs = Math.max(0, tickTs - prev);

      dispatchMachineEvent({
        type: "hold_tick",
        pointerId,
        deltaMs,
        ts: tickTs,
      });

      const next = stateRef.current;
      if (next.pointerActive && next.activePointerId === pointerId && !next.releaseCommitted) {
        rafIdRef.current = requestAnimationFrame(loop);
      }
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      rafPrevTsRef.current = null;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = null;
    };
  }, [dispatchMachineEvent, state.activePointerId, state.pointerActive, state.releaseCommitted]);

  const onPointerDown = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      dispatchMachineEvent(toMachineEvent(event, "pointer_down"));
    },
    [dispatchMachineEvent]
  );

  const onPointerMove = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      dispatchMachineEvent(toMachineEvent(event, "pointer_move"));
    },
    [dispatchMachineEvent]
  );

  const onPointerUp = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dispatchMachineEvent(toMachineEvent(event, "pointer_up"));
    },
    [dispatchMachineEvent]
  );

  const onPointerCancel = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dispatchMachineEvent(toMachineEvent(event, "pointer_cancel"));
    },
    [dispatchMachineEvent]
  );

  const reset = useCallback(() => {
    dispatchMachineEvent({
      type: "reset",
      ts: nowTs(),
    });
  }, [dispatchMachineEvent]);

  const snapshot = useMemo(
    () => deriveFirstProofSnapshot(state, thresholds),
    [state, thresholds]
  );

  return {
    profile,
    state,
    snapshot,
    thresholds,
    gestureHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    dispatchMachineEvent,
    reset,
  };
}
