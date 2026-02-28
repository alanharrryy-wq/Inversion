import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildReplayPayload,
  parseReplayPayload,
  playReplayPayload,
  replayPayloadToJson,
  runReplayFromJson,
} from "../core/replay";
import {
  createInitialSlide03State,
  isSealCommitReady,
  reduceSlide03State,
  selectAllCardViews,
  selectProgressView,
  selectReplayReadout,
  Slide03State,
} from "../core/fsm";
import { createDefaultEvidenceModelInput, EvidenceStepId } from "../core/evidence";

export interface Slide03Engine {
  state: Slide03State;
  cards: ReturnType<typeof selectAllCardViews>;
  progress: ReturnType<typeof selectProgressView>;
  replayReadout: ReturnType<typeof selectReplayReadout>;
  canCommitSeal: boolean;
  hudVisible: boolean;
  replayJson: string;
  replayLoadError: string;
  replayLastMessage: string;
  setReplayJson: (value: string) => void;
  toggleHud: () => void;
  pointerStart: (stepId: EvidenceStepId, pointerId: number) => void;
  pointerFrame: (stepId: EvidenceStepId, pointerId: number, ratio: number) => void;
  pointerEnd: (stepId: EvidenceStepId, pointerId: number) => void;
  pointerCancel: (stepId: EvidenceStepId, pointerId: number, reason: string) => void;
  confirmStep: (stepId: EvidenceStepId) => void;
  commitSeal: () => void;
  resetSession: (reason: string) => void;
  buildReplayJson: () => void;
  playReplayFromJson: () => void;
  playReplayFromState: () => void;
}

export const useSlide03Engine = (): Slide03Engine => {
  const [state, setState] = useState<Slide03State>(() =>
    createInitialSlide03State(createDefaultEvidenceModelInput())
  );
  const stateRef = useRef<Slide03State>(state);
  const [hudVisible, setHudVisible] = useState(false);
  const [replayJson, setReplayJson] = useState("");
  const [replayLoadError, setReplayLoadError] = useState("");
  const [replayLastMessage, setReplayLastMessage] = useState("Replay idle.");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cards = useMemo(() => selectAllCardViews(state), [state]);
  const progress = useMemo(() => selectProgressView(state), [state]);
  const replayReadout = useMemo(() => selectReplayReadout(state), [state]);
  const canCommitSeal = useMemo(() => isSealCommitReady(state), [state]);

  const applyAction = (action: Parameters<typeof reduceSlide03State>[1]) => {
    setState((prev) => {
      const next = reduceSlide03State(prev, action);
      stateRef.current = next;
      return next;
    });
  };

  const pointerStart = (stepId: EvidenceStepId, pointerId: number) => {
    applyAction({
      type: "POINTER_START",
      stepId,
      pointerId,
      source: "user",
      capture: true,
    });
  };

  const pointerFrame = (stepId: EvidenceStepId, pointerId: number, ratio: number) => {
    applyAction({
      type: "POINTER_FRAME",
      stepId,
      pointerId,
      ratio,
      source: "user",
      capture: true,
    });
  };

  const pointerEnd = (stepId: EvidenceStepId, pointerId: number) => {
    applyAction({
      type: "POINTER_END",
      stepId,
      pointerId,
      source: "user",
      capture: true,
    });
  };

  const pointerCancel = (stepId: EvidenceStepId, pointerId: number, reason: string) => {
    applyAction({
      type: "POINTER_CANCEL",
      stepId,
      pointerId,
      reason,
      source: "user",
      capture: true,
    });
  };

  const confirmStep = (stepId: EvidenceStepId) => {
    applyAction({
      type: "CONFIRM_STEP",
      stepId,
      source: "user",
      capture: true,
    });
  };

  const commitSeal = () => {
    applyAction({
      type: "COMMIT_SEAL",
      source: "user",
      capture: true,
    });
  };

  const resetSession = (reason: string) => {
    applyAction({
      type: "RESET_SESSION",
      reason,
      source: "user",
      capture: true,
    });
    setReplayLoadError("");
    setReplayLastMessage(`Session reset (${reason}).`);
  };

  const buildReplayJson = () => {
    const snapshot = stateRef.current;
    const payload = buildReplayPayload(snapshot, { onlyAccepted: true });
    const json = replayPayloadToJson(payload);
    setReplayJson(json);
    setReplayLoadError("");
    setReplayLastMessage(`Replay prepared with ${payload.actions.length} accepted actions.`);

    setState((prev) => {
      const next = {
        ...prev,
        replaySummary: {
          ...prev.replaySummary,
          lastReplayStatus: "ready",
          lastReplayMessage: `Replay prepared (${payload.actions.length} actions).`,
        },
      };
      stateRef.current = next;
      return next;
    });
  };

  const playReplayFromJson = () => {
    const trimmed = replayJson.trim();
    if (!trimmed) {
      setReplayLoadError("Replay JSON is empty.");
      setReplayLastMessage("Replay failed: empty payload.");
      return;
    }

    const snapshot = stateRef.current;
    const result = runReplayFromJson(snapshot, trimmed);
    setState(result.finalState);
    stateRef.current = result.finalState;
    setReplayLoadError(result.success ? "" : result.message);
    setReplayLastMessage(result.message);
  };

  const playReplayFromState = () => {
    const snapshot = stateRef.current;
    const payload = buildReplayPayload(snapshot, { onlyAccepted: true });
    const result = playReplayPayload(snapshot, payload);
    setReplayJson(replayPayloadToJson(payload));
    setState(result.finalState);
    stateRef.current = result.finalState;
    setReplayLoadError(result.success ? "" : result.message);
    setReplayLastMessage(result.message);
  };

  const toggleHud = () => {
    setHudVisible((prev) => !prev);
  };

  return {
    state,
    cards,
    progress,
    replayReadout,
    canCommitSeal,
    hudVisible,
    replayJson,
    replayLoadError,
    replayLastMessage,
    setReplayJson,
    toggleHud,
    pointerStart,
    pointerFrame,
    pointerEnd,
    pointerCancel,
    confirmStep,
    commitSeal,
    resetSession,
    buildReplayJson,
    playReplayFromJson,
    playReplayFromState,
  };
};

export const parseReplayJsonDraft = (draft: string): string => {
  if (!draft.trim()) {
    return "Replay JSON empty.";
  }

  const payload = parseReplayPayload(draft);
  if (!payload) {
    return "Replay JSON invalid.";
  }

  return `Replay JSON valid (${payload.actions.length} actions).`;
};
