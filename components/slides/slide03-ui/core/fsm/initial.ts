import { evaluateEvidenceLadder, EvidenceModelInput, EvidenceStepDefinition } from "../evidence";
import { createDefaultEvidenceModelInput } from "../evidence/catalog";
import {
  Slide03CardState,
  Slide03ReplaySummary,
  Slide03Stage,
  Slide03State,
} from "./types";

const byOrdinal = (left: EvidenceStepDefinition, right: EvidenceStepDefinition): number => {
  if (left.ordinal !== right.ordinal) return left.ordinal - right.ordinal;
  return left.id.localeCompare(right.id);
};

const createInitialCardState = (
  step: EvidenceStepDefinition,
  stage: Slide03Stage,
  expectedStepId: string | null
): Slide03CardState => {
  const enabled = expectedStepId === step.id && stage !== "sealed";

  return {
    stepId: step.id,
    ordinal: step.ordinal,
    unlockThreshold: step.unlockThreshold,
    visualState: enabled ? "pending" : "disabled",
    progress: 0,
    armed: false,
    revealed: false,
    locked: false,
    pointerActive: false,
    attempts: 0,
    confirmations: 0,
    lastReason: enabled ? "ready" : "waiting-for-prior-step",
  };
};

const initialReplaySummary = (): Slide03ReplaySummary => ({
  totalActions: 0,
  acceptedActions: 0,
  rejectedActions: 0,
  lastReplayStatus: "none",
  lastReplayMessage: "No replay executed yet.",
});

export const createSessionId = (input: EvidenceModelInput): string => {
  const route = input.route.id;
  const constraintCount = input.constraints.length;
  return `slide03-${route}-${String(constraintCount).padStart(2, "0")}`;
};

export const createInitialSlide03State = (
  incomingInput?: EvidenceModelInput
): Slide03State => {
  const modelInput = incomingInput ?? createDefaultEvidenceModelInput();
  const steps = [...modelInput.steps].sort(byOrdinal);
  const evaluation = evaluateEvidenceLadder(modelInput, []);
  const expectedStep = steps[0]?.id ?? null;

  const cards = steps.reduce((acc, step) => {
    acc[step.id] = createInitialCardState(step, "idle", expectedStep);
    return acc;
  }, {} as Slide03State["cards"]);

  return {
    contractVersion: "slide03-contract-v1",
    sessionId: createSessionId(modelInput),
    stage: "idle",
    steps,
    cards,
    pointer: {
      active: false,
      stepId: null,
      pointerId: null,
      progress: 0,
      lastFrameRatio: 0,
    },
    revealedSteps: [],
    nextExpectedStep: expectedStep,
    evaluation,
    modelInput,
    replayLog: [],
    replaySummary: initialReplaySummary(),
    transitionCount: 0,
    lastActionType: "RESET_SESSION",
    lastActionReason: "initial-state",
    lastAccepted: true,
  };
};

export const rebuildCardsForState = (
  state: Slide03State,
  stage: Slide03Stage,
  revealedSteps: string[],
  nextExpectedStep: string | null
): Slide03State["cards"] => {
  const cards: Slide03State["cards"] = { ...state.cards };

  for (const step of state.steps) {
    const base = cards[step.id] ?? {
      stepId: step.id,
      ordinal: step.ordinal,
      unlockThreshold: step.unlockThreshold,
      visualState: "pending" as const,
      progress: 0,
      armed: false,
      revealed: false,
      locked: false,
      pointerActive: false,
      attempts: 0,
      confirmations: 0,
      lastReason: "rebuilt",
    };

    const revealed = revealedSteps.includes(step.id);
    const locked = revealed;
    const expected = nextExpectedStep === step.id;

    let visualState = base.visualState;
    if (revealed && stage === "sealed") {
      visualState = "locked";
    } else if (revealed) {
      visualState = "revealed";
    } else if (expected) {
      visualState = base.armed ? "armed" : "pending";
    } else {
      visualState = "disabled";
    }

    cards[step.id] = {
      ...base,
      revealed,
      locked,
      visualState,
      pointerActive: expected ? base.pointerActive : false,
      progress: revealed ? 1 : expected ? base.progress : 0,
      lastReason: revealed ? "revealed" : expected ? base.lastReason : "waiting-for-prior-step",
    };
  }

  return cards;
};
