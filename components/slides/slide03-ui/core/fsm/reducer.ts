import {
  evaluateEvidenceLadder,
  EvidenceStepId,
  nextExpectedStep,
  normalizeRevealedSteps,
} from "../evidence";
import { createInitialSlide03State, rebuildCardsForState } from "./initial";
import {
  Slide03Action,
  Slide03ActionEnvelope,
  Slide03ActionSource,
  Slide03CardState,
  Slide03ReducerResult,
  Slide03Stage,
  Slide03State,
} from "./types";

const clampRatio = (ratio: number): number => {
  if (!Number.isFinite(ratio)) return 0;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
};

const stageForRevealCount = (count: number): Slide03Stage => {
  if (count <= 0) return "idle";
  if (count === 1) return "step1";
  if (count === 2) return "step2";
  if (count >= 3) return "step3";
  return "idle";
};

const pointerReset = () => ({
  active: false,
  stepId: null,
  pointerId: null,
  progress: 0,
  lastFrameRatio: 0,
});

const copyCards = (cards: Slide03State["cards"]): Slide03State["cards"] => {
  return {
    E1: { ...cards.E1 },
    E2: { ...cards.E2 },
    E3: { ...cards.E3 },
  };
};

const updateSingleCard = (
  cards: Slide03State["cards"],
  stepId: EvidenceStepId,
  updater: (current: Slide03CardState) => Slide03CardState
): Slide03State["cards"] => {
  const next = copyCards(cards);
  next[stepId] = updater(next[stepId]);
  return next;
};

const actionSourceOf = (action: Slide03Action): Slide03ActionSource => action.source ?? "user";

const shouldCaptureAction = (action: Slide03Action): boolean => {
  if (typeof action.capture === "boolean") return action.capture;
  if (action.type === "REPLACE_STATE") return false;
  return true;
};

const envelope = (
  prev: Slide03State,
  next: Slide03State,
  actionType: Slide03Action["type"],
  accepted: boolean,
  reason: string
): Slide03ActionEnvelope => ({
  actionType,
  accepted,
  reason,
  stageBefore: prev.stage,
  stageAfter: next.stage,
  confidenceBefore: prev.evaluation.confidence,
  confidenceAfter: next.evaluation.confidence,
  uncertaintyBefore: prev.evaluation.uncertainty,
  uncertaintyAfter: next.evaluation.uncertainty,
  revealedAfter: [...next.revealedSteps],
});

const replaySummaryFromLog = (
  log: Slide03State["replayLog"],
  prior: Slide03State["replaySummary"],
  overrides?: Partial<Slide03State["replaySummary"]>
): Slide03State["replaySummary"] => {
  const acceptedActions = log.filter((record) => record.envelope.accepted).length;
  const rejectedActions = log.length - acceptedActions;

  return {
    totalActions: log.length,
    acceptedActions,
    rejectedActions,
    lastReplayStatus: overrides?.lastReplayStatus ?? prior.lastReplayStatus,
    lastReplayMessage: overrides?.lastReplayMessage ?? prior.lastReplayMessage,
  };
};

const syncCards = (
  state: Slide03State,
  stage: Slide03Stage,
  revealedSteps: EvidenceStepId[],
  nextExpected: EvidenceStepId | null,
  cards: Slide03State["cards"]
): Slide03State["cards"] => {
  const foundation: Slide03State = {
    ...state,
    cards,
  };

  const rebuilt = rebuildCardsForState(foundation, stage, revealedSteps, nextExpected);

  if (stage === "sealed") {
    for (const step of foundation.steps) {
      rebuilt[step.id] = {
        ...rebuilt[step.id],
        visualState: "locked",
        locked: true,
        revealed: true,
        progress: 1,
        armed: false,
        pointerActive: false,
        lastReason: "seal-committed",
      };
    }
  }

  return rebuilt;
};

const reject = (
  state: Slide03State,
  action: Slide03Action,
  reason: string
): Slide03ReducerResult => {
  const nextState: Slide03State = {
    ...state,
    lastActionType: action.type,
    lastActionReason: reason,
    lastAccepted: false,
  };

  return {
    state: nextState,
    envelope: envelope(state, nextState, action.type, false, reason),
  };
};

const accept = (
  prev: Slide03State,
  next: Slide03State,
  action: Slide03Action,
  reason: string
): Slide03ReducerResult => {
  const acceptedState: Slide03State = {
    ...next,
    lastActionType: action.type,
    lastActionReason: reason,
    lastAccepted: true,
    transitionCount: prev.transitionCount + 1,
  };

  return {
    state: acceptedState,
    envelope: envelope(prev, acceptedState, action.type, true, reason),
  };
};

const applyPointerStart = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "POINTER_START") {
    return reject(state, action, "invalid-pointer-start-action");
  }

  if (state.stage === "sealed") {
    return reject(state, action, "sealed-state-no-pointer-start");
  }

  if (state.nextExpectedStep !== action.stepId) {
    return reject(state, action, "pointer-start-not-next-expected");
  }

  if (state.pointer.active) {
    return reject(state, action, "pointer-start-while-another-pointer-active");
  }

  const currentCard = state.cards[action.stepId];
  if (currentCard.revealed || currentCard.locked) {
    return reject(state, action, "pointer-start-on-revealed-card");
  }

  const cards = updateSingleCard(state.cards, action.stepId, (card) => ({
    ...card,
    pointerActive: true,
    visualState: "in_progress",
    progress: 0,
    armed: false,
    attempts: card.attempts + 1,
    lastReason: "pointer-started",
  }));

  return accept(
    state,
    {
      ...state,
      cards,
      pointer: {
        active: true,
        stepId: action.stepId,
        pointerId: action.pointerId,
        progress: 0,
        lastFrameRatio: 0,
      },
    },
    action,
    "pointer-start-accepted"
  );
};

const applyPointerFrame = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "POINTER_FRAME") {
    return reject(state, action, "invalid-pointer-frame-action");
  }

  if (!state.pointer.active) {
    return reject(state, action, "pointer-frame-without-active-pointer");
  }

  if (state.pointer.stepId !== action.stepId) {
    return reject(state, action, "pointer-frame-step-mismatch");
  }

  if (state.pointer.pointerId !== action.pointerId) {
    return reject(state, action, "pointer-frame-pointer-id-mismatch");
  }

  const card = state.cards[action.stepId];
  const nextRatio = clampRatio(action.ratio);
  const progress = Math.max(card.progress, nextRatio);
  const armed = progress >= card.unlockThreshold;

  const cards = updateSingleCard(state.cards, action.stepId, (current) => ({
    ...current,
    pointerActive: true,
    progress,
    armed,
    visualState: armed ? "armed" : "in_progress",
    lastReason: armed ? "threshold-reached" : "gesture-progress",
  }));

  return accept(
    state,
    {
      ...state,
      cards,
      pointer: {
        ...state.pointer,
        progress,
        lastFrameRatio: nextRatio,
      },
    },
    action,
    armed ? "pointer-frame-armed" : "pointer-frame-progressed"
  );
};

const applyPointerEnd = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "POINTER_END") {
    return reject(state, action, "invalid-pointer-end-action");
  }

  if (!state.pointer.active) {
    return reject(state, action, "pointer-end-without-active-pointer");
  }

  if (state.pointer.stepId !== action.stepId) {
    return reject(state, action, "pointer-end-step-mismatch");
  }

  if (state.pointer.pointerId !== action.pointerId) {
    return reject(state, action, "pointer-end-pointer-id-mismatch");
  }

  const card = state.cards[action.stepId];
  const armed = card.progress >= card.unlockThreshold;

  const cards = updateSingleCard(state.cards, action.stepId, (current) => ({
    ...current,
    pointerActive: false,
    progress: armed ? current.progress : 0,
    armed,
    visualState: armed ? "armed" : "pending",
    lastReason: armed ? "gesture-complete-awaiting-confirm" : "gesture-released-before-threshold",
  }));

  return accept(
    state,
    {
      ...state,
      cards,
      pointer: pointerReset(),
    },
    action,
    armed ? "pointer-end-armed" : "pointer-end-reset"
  );
};

const applyPointerCancel = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "POINTER_CANCEL") {
    return reject(state, action, "invalid-pointer-cancel-action");
  }

  if (!state.pointer.active) {
    return reject(state, action, "pointer-cancel-without-active-pointer");
  }

  if (state.pointer.stepId !== action.stepId) {
    return reject(state, action, "pointer-cancel-step-mismatch");
  }

  if (state.pointer.pointerId !== action.pointerId) {
    return reject(state, action, "pointer-cancel-pointer-id-mismatch");
  }

  const cards = updateSingleCard(state.cards, action.stepId, (current) => ({
    ...current,
    pointerActive: false,
    progress: 0,
    armed: false,
    visualState: "pending",
    lastReason: action.reason || "pointer-cancelled",
  }));

  return accept(
    state,
    {
      ...state,
      cards,
      pointer: pointerReset(),
    },
    action,
    "pointer-cancelled"
  );
};

const applyConfirmStep = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "CONFIRM_STEP") {
    return reject(state, action, "invalid-confirm-step-action");
  }

  if (state.stage === "sealed") {
    return reject(state, action, "confirm-step-on-sealed");
  }

  if (state.nextExpectedStep !== action.stepId) {
    return reject(state, action, "confirm-step-not-next-expected");
  }

  const card = state.cards[action.stepId];
  if (!card.armed) {
    return reject(state, action, "confirm-step-before-armed");
  }

  if (card.revealed) {
    return reject(state, action, "confirm-step-already-revealed");
  }

  const revealedSteps = normalizeRevealedSteps([...state.revealedSteps, action.stepId]);
  const evaluation = evaluateEvidenceLadder(state.modelInput, revealedSteps);
  const expected = nextExpectedStep(revealedSteps, state.steps);
  const stage = stageForRevealCount(revealedSteps.length);

  const withConfirmedCard = updateSingleCard(state.cards, action.stepId, (current) => ({
    ...current,
    progress: 1,
    armed: false,
    pointerActive: false,
    revealed: true,
    locked: true,
    visualState: "revealed",
    confirmations: current.confirmations + 1,
    lastReason: "step-confirmed",
  }));

  const cards = syncCards(state, stage, revealedSteps, expected, withConfirmedCard);

  return accept(
    state,
    {
      ...state,
      stage,
      cards,
      pointer: pointerReset(),
      revealedSteps,
      nextExpectedStep: expected,
      evaluation,
    },
    action,
    "step-confirmed"
  );
};

const applyCommitSeal = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "COMMIT_SEAL") {
    return reject(state, action, "invalid-commit-seal-action");
  }

  if (state.stage !== "step3") {
    return reject(state, action, "commit-seal-not-in-step3");
  }

  if (state.revealedSteps.length < 3) {
    return reject(state, action, "commit-seal-with-incomplete-reveals");
  }

  if (state.evaluation.seal.level !== "sealed") {
    return reject(state, action, "commit-seal-confidence-threshold-not-met");
  }

  const cards = syncCards(state, "sealed", state.revealedSteps, null, state.cards);

  return accept(
    state,
    {
      ...state,
      stage: "sealed",
      cards,
      pointer: pointerReset(),
      nextExpectedStep: null,
      evaluation: {
        ...state.evaluation,
        seal: {
          ...state.evaluation.seal,
          level: "sealed",
        },
      },
    },
    action,
    "seal-committed"
  );
};

const applyResetSession = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "RESET_SESSION") {
    return reject(state, action, "invalid-reset-session-action");
  }

  const reset = createInitialSlide03State(state.modelInput);
  const nextState: Slide03State = {
    ...reset,
    sessionId: `${reset.sessionId}-r${String(state.transitionCount + 1).padStart(3, "0")}`,
    replaySummary: {
      ...reset.replaySummary,
      lastReplayStatus: "ready",
      lastReplayMessage: `Session reset: ${action.reason}`,
    },
  };

  return accept(state, nextState, action, `session-reset-${action.reason}`);
};

const applyReplaceState = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  if (action.type !== "REPLACE_STATE") {
    return reject(state, action, "invalid-replace-state-action");
  }

  const next = {
    ...action.nextState,
    lastActionType: action.type,
    lastActionReason: action.reason,
    lastAccepted: true,
    transitionCount: state.transitionCount + 1,
  };

  return {
    state: next,
    envelope: envelope(state, next, action.type, true, action.reason),
  };
};

const reduceInternal = (state: Slide03State, action: Slide03Action): Slide03ReducerResult => {
  switch (action.type) {
    case "POINTER_START":
      return applyPointerStart(state, action);
    case "POINTER_FRAME":
      return applyPointerFrame(state, action);
    case "POINTER_END":
      return applyPointerEnd(state, action);
    case "POINTER_CANCEL":
      return applyPointerCancel(state, action);
    case "CONFIRM_STEP":
      return applyConfirmStep(state, action);
    case "COMMIT_SEAL":
      return applyCommitSeal(state, action);
    case "RESET_SESSION":
      return applyResetSession(state, action);
    case "REPLACE_STATE":
      return applyReplaceState(state, action);
    default:
      return reject(state, action, "unknown-action");
  }
};

export const reduceSlide03StateWithEnvelope = (
  state: Slide03State,
  action: Slide03Action
): Slide03ReducerResult => {
  const result = reduceInternal(state, action);
  const source = actionSourceOf(action);
  const capture = shouldCaptureAction(action);

  if (!capture) {
    return result;
  }

  const seq = result.state.replayLog.length + 1;
  const record = {
    seq,
    source,
    capture,
    at: `t${String(seq).padStart(4, "0")}`,
    action,
    envelope: result.envelope,
  };

  const replayLog = [...result.state.replayLog, record];
  const replaySummary = replaySummaryFromLog(replayLog, result.state.replaySummary);

  return {
    state: {
      ...result.state,
      replayLog,
      replaySummary,
    },
    envelope: result.envelope,
  };
};

export const reduceSlide03State = (state: Slide03State, action: Slide03Action): Slide03State => {
  return reduceSlide03StateWithEnvelope(state, action).state;
};

export const replaySafeAction = (action: Slide03Action): Slide03Action => {
  if (action.type === "REPLACE_STATE") {
    throw new Error("REPLACE_STATE cannot be used as replay-safe action");
  }

  return {
    ...action,
    source: action.source ?? "replay",
    capture: false,
  };
};

export const markReplayStatus = (
  state: Slide03State,
  status: Slide03State["replaySummary"]["lastReplayStatus"],
  message: string
): Slide03State => {
  return {
    ...state,
    replaySummary: replaySummaryFromLog(state.replayLog, state.replaySummary, {
      lastReplayStatus: status,
      lastReplayMessage: message,
    }),
  };
};

export const summarizeActionDigest = (state: Slide03State): string => {
  return state.replayLog
    .map((record) => `${record.seq}:${record.action.type}:${record.envelope.accepted ? "A" : "I"}`)
    .join("|");
};
