import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialSlide07State,
  deriveSlide07Snapshot,
  resolveSlide07Thresholds,
  transitionSlide07State,
} from "./slide07.helpers";
import {
  Slide07DomainEvent,
  Slide07GestureInputEvent,
  Slide07Snapshot,
  Slide07State,
  Slide07Thresholds,
  Slide07TransitionResult,
} from "./slide07.types";

export type Slide07GestureHandlers = {
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
};

export type UseSystemRitualOptions = {
  thresholds?: Partial<Slide07Thresholds>;
  onDomainEvent?: (domainEvent: Slide07DomainEvent) => void;
  onSnapshotChange?: (snapshot: Slide07Snapshot) => void;
};

export type UseSystemRitualResult = {
  state: Slide07State;
  snapshot: Slide07Snapshot;
  thresholds: Slide07Thresholds;
  gestureHandlers: Slide07GestureHandlers;
  dispatchInput: (machineEvent: Slide07GestureInputEvent) => void;
  reset: () => void;
};

function emitBrowserDomainEvent(domainEvent: Slide07DomainEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(domainEvent.name, {
      detail: domainEvent,
    })
  );
}

function pointerEventToInput(
  event: React.PointerEvent<HTMLDivElement>,
  type: "pointer_down" | "pointer_move" | "pointer_up" | "pointer_cancel"
): Slide07GestureInputEvent {
  return {
    type,
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    nowMs: performance.now(),
  };
}

export function useSystemRitual(options: UseSystemRitualOptions = {}): UseSystemRitualResult {
  const thresholds = useMemo(() => resolveSlide07Thresholds(options.thresholds), [options.thresholds]);

  const [state, setState] = useState<Slide07State>(() => createInitialSlide07State(thresholds));
  const stateRef = useRef<Slide07State>(state);

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const commitTransition = useCallback(
    (transition: Slide07TransitionResult) => {
      stateRef.current = transition.state;
      setState(transition.state);

      if (transition.domainEvents.length === 0) {
        return;
      }

      for (const domainEvent of transition.domainEvents) {
        emitBrowserDomainEvent(domainEvent);
        if (options.onDomainEvent) {
          options.onDomainEvent(domainEvent);
        }
      }
    },
    [options]
  );

  const dispatchInput = useCallback(
    (machineEvent: Slide07GestureInputEvent) => {
      const transition = transitionSlide07State(stateRef.current, machineEvent, thresholds);
      commitTransition(transition);
    },
    [commitTransition, thresholds]
  );

  const reset = useCallback(() => {
    dispatchInput({
      type: "reset",
      nowMs: performance.now(),
    });
  }, [dispatchInput]);

  const onPointerDown = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      dispatchInput(pointerEventToInput(event, "pointer_down"));
    },
    [dispatchInput]
  );

  const onPointerMove = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      dispatchInput(pointerEventToInput(event, "pointer_move"));
    },
    [dispatchInput]
  );

  const onPointerUp = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dispatchInput(pointerEventToInput(event, "pointer_up"));
    },
    [dispatchInput]
  );

  const onPointerCancel = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dispatchInput(pointerEventToInput(event, "pointer_cancel"));
    },
    [dispatchInput]
  );

  useEffect(() => {
    const shouldTick =
      state.pointerActive &&
      (state.stage === "drag-complete" || state.stage === "holding") &&
      state.holdProgress < 1;

    if (!shouldTick) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const previous = lastFrameRef.current ?? now;
      const deltaMs = now - previous;
      lastFrameRef.current = now;

      dispatchInput({
        type: "hold_tick",
        deltaMs,
        nowMs: now,
      });

      const runtimeState = stateRef.current;
      const keepTicking =
        runtimeState.pointerActive &&
        (runtimeState.stage === "drag-complete" || runtimeState.stage === "holding") &&
        runtimeState.holdProgress < 1;

      if (keepTicking) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastFrameRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [dispatchInput, state.holdProgress, state.pointerActive, state.stage]);

  const snapshot = useMemo(() => deriveSlide07Snapshot(state, thresholds), [state, thresholds]);

  useEffect(() => {
    if (!options.onSnapshotChange) {
      return;
    }
    options.onSnapshotChange(snapshot);
  }, [options, snapshot]);

  return {
    state,
    snapshot,
    thresholds,
    gestureHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    dispatchInput,
    reset,
  };
}
