import { EvidenceStepId } from "../evidence";
import { Slide03CardState, Slide03State } from "./types";

export interface Slide03ProgressViewModel {
  stage: string;
  revealedCount: number;
  totalSteps: number;
  nextExpected: EvidenceStepId | null;
  routeId: string;
  routeLabel: string;
  confidence: number;
  uncertainty: number;
  sealLevel: string;
  sealBand: string;
  sealGrade: string;
}

export interface Slide03CardViewModel {
  stepId: EvidenceStepId;
  title: string;
  purpose: string;
  ordinal: number;
  progressRatio: number;
  progressPercent: number;
  unlockThreshold: number;
  thresholdPercent: number;
  armed: boolean;
  revealed: boolean;
  locked: boolean;
  enabled: boolean;
  visualState: Slide03CardState["visualState"];
  confidenceAfterReveal: number;
  uncertaintyAfterReveal: number;
  confidenceGain: number;
  uncertaintyDrop: number;
  rationale: string[];
}

const clampInt = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
};

export const selectProgressView = (state: Slide03State): Slide03ProgressViewModel => {
  return {
    stage: state.stage,
    revealedCount: state.revealedSteps.length,
    totalSteps: state.steps.length,
    nextExpected: state.nextExpectedStep,
    routeId: state.evaluation.route.id,
    routeLabel: state.evaluation.route.label,
    confidence: state.evaluation.confidence,
    uncertainty: state.evaluation.uncertainty,
    sealLevel: state.evaluation.seal.level,
    sealBand: state.evaluation.seal.band,
    sealGrade: state.evaluation.seal.grade,
  };
};

const findStepContribution = (state: Slide03State, stepId: EvidenceStepId) => {
  return state.evaluation.contributions.find((contribution) => contribution.id === stepId) ?? null;
};

const cardEnabled = (state: Slide03State, stepId: EvidenceStepId): boolean => {
  if (state.stage === "sealed") return false;
  return state.nextExpectedStep === stepId;
};

export const selectCardView = (
  state: Slide03State,
  stepId: EvidenceStepId
): Slide03CardViewModel | null => {
  const step = state.steps.find((candidate) => candidate.id === stepId);
  const card = state.cards[stepId];
  if (!step || !card) return null;

  const contribution = findStepContribution(state, stepId);
  const confidenceAfterReveal = contribution?.confidenceAfter ?? state.evaluation.confidence;
  const uncertaintyAfterReveal = contribution?.uncertaintyAfter ?? state.evaluation.uncertainty;

  return {
    stepId,
    title: step.title,
    purpose: step.purpose,
    ordinal: step.ordinal,
    progressRatio: card.progress,
    progressPercent: clampInt(card.progress * 100, 0, 100),
    unlockThreshold: step.unlockThreshold,
    thresholdPercent: clampInt(step.unlockThreshold * 100, 0, 100),
    armed: card.armed,
    revealed: card.revealed,
    locked: card.locked,
    enabled: cardEnabled(state, stepId),
    visualState: card.visualState,
    confidenceAfterReveal,
    uncertaintyAfterReveal,
    confidenceGain: contribution?.confidenceGain ?? 0,
    uncertaintyDrop: contribution?.uncertaintyDrop ?? 0,
    rationale: contribution ? [...contribution.rationale] : [...step.rationale],
  };
};

export const selectAllCardViews = (state: Slide03State): Slide03CardViewModel[] => {
  const result: Slide03CardViewModel[] = [];
  for (const step of state.steps) {
    const vm = selectCardView(state, step.id);
    if (!vm) continue;
    result.push(vm);
  }
  return result;
};

export const selectReplayReadout = (state: Slide03State) => {
  return {
    count: state.replayLog.length,
    accepted: state.replaySummary.acceptedActions,
    rejected: state.replaySummary.rejectedActions,
    status: state.replaySummary.lastReplayStatus,
    message: state.replaySummary.lastReplayMessage,
  };
};

export const isSealCommitReady = (state: Slide03State): boolean => {
  return (
    state.stage === "step3" &&
    state.revealedSteps.length === 3 &&
    state.evaluation.seal.level === "sealed"
  );
};

export const selectNextUnlockThreshold = (state: Slide03State): number | null => {
  if (!state.nextExpectedStep) return null;
  return state.cards[state.nextExpectedStep].unlockThreshold;
};
