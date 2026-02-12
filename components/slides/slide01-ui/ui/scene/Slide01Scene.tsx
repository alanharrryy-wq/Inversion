import React, { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  createSlide01InitialState,
  pointerTraceEventToActions,
  slide01Reducer,
  SLIDE01_TEST_IDS,
} from "../../core/fsm";
import { buildTraceEvent } from "../../core/replay/capture";
import { parseTraceEnvelope, serializeTraceEnvelope } from "../../core/replay/trace";
import { replayResult } from "../../core/replay/runner";
import { SAMPLE_TRACE_ROUTE_B } from "../../core/replay/samples";
import { ActionButton } from "../atoms/ActionButton";
import { PhaseChip } from "../atoms/PhaseChip";
import { DevHud } from "../hud/DevHud";
import { CriteriaSignalsPanel } from "../panels/CriteriaSignalsPanel";
import { OutcomePanel } from "../panels/OutcomePanel";
import { ReplayPanel } from "../panels/ReplayPanel";
import { RoutesPanel } from "../panels/RoutesPanel";
import { WeighPanel } from "../panels/WeighPanel";
import "./slide01.scene.css";

function getActionableTargetId(element: EventTarget & HTMLDivElement): string {
  const testId = element.dataset.testid;
  if (typeof testId === "string" && testId.length > 0) return testId;
  return SLIDE01_TEST_IDS.weighArena;
}

export const Slide01Scene: React.FC = () => {
  const [state, dispatch] = useReducer(slide01Reducer, undefined, createSlide01InitialState);
  const [replayText, setReplayText] = useState("");
  const sequenceRef = useRef(0);

  const applyMappedActions = useCallback(
    (actions: ReturnType<typeof pointerTraceEventToActions>) => {
      for (const action of actions) {
        dispatch(action);
      }
    },
    [dispatch]
  );

  const emitPointerTraceEvent = useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      kind: "pointerdown" | "pointermove" | "pointerup"
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      sequenceRef.current += 1;
      const traceEvent = buildTraceEvent({
        kind,
        seq: sequenceRef.current,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
        button: event.button,
        targetId: getActionableTargetId(event.currentTarget),
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      });

      const mappedActions = pointerTraceEventToActions(traceEvent, "live");
      applyMappedActions(mappedActions);
    },
    [applyMappedActions]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_error) {
        // Ignore capture errors and continue deterministic reducer path.
      }
      emitPointerTraceEvent(event, "pointerdown");
    },
    [emitPointerTraceEvent]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!state.pointerDown) return;
      if (state.activePointerId !== null && state.activePointerId !== event.pointerId) return;
      emitPointerTraceEvent(event, "pointermove");
    },
    [emitPointerTraceEvent, state.activePointerId, state.pointerDown]
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!state.pointerDown) return;
      if (state.activePointerId !== null && state.activePointerId !== event.pointerId) return;
      emitPointerTraceEvent(event, "pointerup");
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_error) {
        // Ignore capture release errors and continue deterministic reducer path.
      }
    },
    [emitPointerTraceEvent, state.activePointerId, state.pointerDown]
  );

  const onReset = useCallback(() => {
    sequenceRef.current = 0;
    dispatch({ type: "RESET" });
  }, [dispatch]);

  const onExport = useCallback(() => {
    const text = serializeTraceEnvelope(state.trace);
    setReplayText(text);
  }, [state.trace]);

  const onCopy = useCallback(() => {
    const text = serializeTraceEnvelope(state.trace);
    setReplayText(text);
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      dispatch({ type: "REPLAY_ERROR", message: "Replay copy unavailable in this environment." });
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        dispatch({ type: "REPLAY_NOTE", message: "Trace copied to clipboard. Paste and replay anytime." });
      })
      .catch(() => {
        dispatch({ type: "REPLAY_ERROR", message: "Replay copy failed. Manual paste still available." });
      });
  }, [state.trace]);

  const onLoadSample = useCallback(() => {
    setReplayText(JSON.stringify(SAMPLE_TRACE_ROUTE_B, null, 2));
  }, []);

  const onReplay = useCallback(() => {
    const parsed = parseTraceEnvelope(replayText);
    if (parsed.ok === false) {
      dispatch({ type: "REPLAY_ERROR", message: parsed.message });
      return;
    }
    const replayed = replayResult(state, parsed.envelope, parsed.envelopeHash);
    sequenceRef.current =
      parsed.envelope.events[parsed.envelope.events.length - 1]?.seq ?? sequenceRef.current;
    dispatch({ type: "REPLAY_APPLY", replayedState: replayed.state, envelopeHash: parsed.envelopeHash });
  }, [replayText, state]);

  const subtitle = useMemo(() => {
    return "Deterministic route selector. Drag to weigh criteria and release to resolve evidence.";
  }, []);

  return (
    <div data-testid={SLIDE01_TEST_IDS.scene} className="slide01-scene-root">
      <div className="slide01-scene-content">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 data-testid={SLIDE01_TEST_IDS.title} className="font-display text-3xl text-white">
              ROUTE SELECTOR
            </h3>
            <p data-testid={SLIDE01_TEST_IDS.subtitle} className="text-sm text-white/75">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PhaseChip phase={state.phase} testId={SLIDE01_TEST_IDS.phaseChip} />
            <ActionButton
              label={state.hudVisible ? "Hide HUD" : "Show HUD"}
              testId={SLIDE01_TEST_IDS.hudToggle}
              onClick={() => dispatch({ type: "TOGGLE_HUD" })}
              tone="neutral"
            />
          </div>
        </div>

        <div data-testid={SLIDE01_TEST_IDS.mainGrid} className="slide01-scene-grid-top">
          <RoutesPanel state={state} />
          <WeighPanel
            state={state}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </div>

        <div className="slide01-scene-grid-bottom">
          <OutcomePanel state={state} onReset={onReset} />
          <ReplayPanel
            state={state}
            replayText={replayText}
            onReplayTextChange={setReplayText}
            onExport={onExport}
            onCopy={onCopy}
            onLoadSample={onLoadSample}
            onReplay={onReplay}
          />
          <div className="space-y-2">
            <CriteriaSignalsPanel state={state} />
            <DevHud state={state} />
          </div>
        </div>
      </div>
    </div>
  );
};
