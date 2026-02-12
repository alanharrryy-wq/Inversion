import { EvidenceStepDefinition, EvidenceStepId } from "../evidence";
import { Slide03Stage } from "./types";

export const clampRatio = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

export const stageFromRevealedCount = (count: number): Slide03Stage => {
  if (count <= 0) return "idle";
  if (count === 1) return "step1";
  if (count === 2) return "step2";
  if (count === 3) return "sealed";
  return "sealed";
};

export const stageLabelFromRevealed = (revealed: EvidenceStepId[]): Slide03Stage => {
  return stageFromRevealedCount(revealed.length);
};

export const nextExpectedFromSteps = (
  revealed: EvidenceStepId[],
  steps: EvidenceStepDefinition[]
): EvidenceStepId | null => {
  for (const step of steps) {
    if (!revealed.includes(step.id)) return step.id;
  }
  return null;
};

export const stepStageLabel = (revealedCount: number): Slide03Stage => {
  if (revealedCount === 0) return "idle";
  if (revealedCount === 1) return "step1";
  if (revealedCount === 2) return "step2";
  if (revealedCount === 3) return "step3";
  return "sealed";
};

export const coerceStage = (revealedCount: number, base: Slide03Stage): Slide03Stage => {
  if (revealedCount >= 3) {
    return base === "step3" ? "step3" : "sealed";
  }
  if (revealedCount === 2) return "step2";
  if (revealedCount === 1) return "step1";
  return "idle";
};

export const isFinalCommitStage = (stage: Slide03Stage, revealedCount: number): boolean => {
  return stage === "step3" || revealedCount >= 3;
};
