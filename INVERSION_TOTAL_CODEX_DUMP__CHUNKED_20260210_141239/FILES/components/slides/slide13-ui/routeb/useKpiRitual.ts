
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Slide13EmittedEvent,
  Slide13GestureHandlers,
  Slide13MachineEvent,
  Slide13Snapshot,
  Slide13State,
  Slide13Thresholds,
} from "./slide13.types";
import {
  createInitialSlide13State,
  deriveSlide13Snapshot,
  resolveSlide13Thresholds,
  transitionSlide13State,
} from "./slide13.helpers";

export type UseKpiRitualOptions = {
  thresholds?: Partial<Slide13Thresholds>;
  onEmitEvent?: (event: Slide13EmittedEvent) => void;
};

export type UseKpiRitualResult = {
  state: Slide13State;
  snapshot: Slide13Snapshot;
  thresholds: Slide13Thresholds;
  gestureHandlers: Slide13GestureHandlers;
  lastEmittedEvent: Slide13EmittedEvent | null;
  reset: () => void;
};

function asMachineEvent(
  type: Slide13MachineEvent["type"],
  event:
    | React.PointerEvent<HTMLDivElement>
    | {
        pointerId: number;
        x: number;
        y: number;
      }
): Slide13MachineEvent {
  if ("clientX" in event) {
    if (type === "reset") return { type: "reset" };
    return {
      type,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    } as Slide13MachineEvent;
  }

  if (type === "reset") return { type: "reset" };
  return {
    type,
    pointerId: event.pointerId,
    x: event.x,
    y: event.y,
  } as Slide13MachineEvent;
}

function dispatchBrowserEvent(event: Slide13EmittedEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(event.name, {
      detail: {
        ...event.detail,
        event: event.name,
      },
    })
  );
}

export function useKpiRitual(options: UseKpiRitualOptions = {}): UseKpiRitualResult {
  const thresholds = useMemo(
    () => resolveSlide13Thresholds(options.thresholds),
    [options.thresholds]
  );

  const [state, setState] = useState<Slide13State>(() => createInitialSlide13State(thresholds));
  const [lastEmittedEvent, setLastEmittedEvent] = useState<Slide13EmittedEvent | null>(null);
  const stateRef = useRef<Slide13State>(state);

  const emit = useCallback(
    (event: Slide13EmittedEvent) => {
      setLastEmittedEvent(event);
      dispatchBrowserEvent(event);
      options.onEmitEvent?.(event);
    },
    [options.onEmitEvent]
  );

  const commitTransition = useCallback(
    (machineEvent: Slide13MachineEvent) => {
      const transition = transitionSlide13State(stateRef.current, machineEvent, thresholds);
      stateRef.current = transition.state;
      setState(transition.state);
      for (const emittedEvent of transition.emitted) {
        emit(emittedEvent);
      }
    },
    [emit, thresholds]
  );

  useEffect(() => {
    const entered: Slide13EmittedEvent = {
      name: "slide:13:entered",
      detail: { slide: 13, enteredAt: Date.now() },
    };
    emit(entered);
  }, [emit]);

  const onPointerDown = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      commitTransition(asMachineEvent("pointer_down", event));
    },
    [commitTransition]
  );

  const onPointerMove = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      commitTransition(asMachineEvent("pointer_move", event));
    },
    [commitTransition]
  );

  const onPointerUp = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      commitTransition(asMachineEvent("pointer_up", event));
    },
    [commitTransition]
  );

  const onPointerCancel = useCallback<React.PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      commitTransition(asMachineEvent("pointer_cancel", event));
    },
    [commitTransition]
  );

  const reset = useCallback(() => {
    commitTransition({ type: "reset" });
  }, [commitTransition]);

  const snapshot = useMemo(
    () => deriveSlide13Snapshot(state, thresholds),
    [state, thresholds]
  );

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
    lastEmittedEvent,
    reset,
  };
}

