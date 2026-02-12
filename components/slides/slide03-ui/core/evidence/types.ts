export type EvidenceStepId = "E1" | "E2" | "E3";

export type EvidenceAxis = "fit" | "defensibility" | "velocity" | "resilience";

export type SealLevel = "open" | "forming" | "sealed";

export type ConfidenceBand = "fragile" | "emerging" | "credible" | "dominant";

export interface RouteProfile {
  id: string;
  label: string;
  thesis: string;
  baselineConfidence: number;
  baselineUncertainty: number;
  axisWeights: Record<EvidenceAxis, number>;
  routeStrength: number;
}

export interface ConstraintProfile {
  id: string;
  label: string;
  axis: EvidenceAxis;
  severity: number;
  satisfied: boolean;
  penaltyIfUnsatisfied: number;
  rationale: string;
}

export interface EvidenceStepDefinition {
  id: EvidenceStepId;
  ordinal: number;
  title: string;
  purpose: string;
  unlockThreshold: number;
  baseConfidenceGain: number;
  baseUncertaintyDrop: number;
  axisInfluence: Partial<Record<EvidenceAxis, number>>;
  rationale: string[];
}

export interface EvidenceModelInput {
  route: RouteProfile;
  constraints: ConstraintProfile[];
  steps: EvidenceStepDefinition[];
}

export interface ConstraintPressure {
  totalSeverity: number;
  satisfiedSeverity: number;
  unsatisfiedSeverity: number;
  satisfiedRatioScaled: number;
  weightedPenalty: number;
  digest: string;
}

export interface StepContribution {
  id: EvidenceStepId;
  ordinal: number;
  title: string;
  confidenceGain: number;
  uncertaintyDrop: number;
  confidenceBefore: number;
  confidenceAfter: number;
  uncertaintyBefore: number;
  uncertaintyAfter: number;
  rationale: string[];
  axisDeltas: Partial<Record<EvidenceAxis, number>>;
}

export interface ConfidenceSeal {
  level: SealLevel;
  band: ConfidenceBand;
  grade: string;
  confidence: number;
  uncertainty: number;
  routeId: string;
  routeLabel: string;
  revealedCount: number;
}

export interface EvidenceEvaluation {
  route: RouteProfile;
  pressure: ConstraintPressure;
  revealedSteps: EvidenceStepId[];
  missingSteps: EvidenceStepId[];
  availableSteps: EvidenceStepId[];
  contributions: StepContribution[];
  confidence: number;
  uncertainty: number;
  confidenceDeltaFromBaseline: number;
  uncertaintyDeltaFromBaseline: number;
  seal: ConfidenceSeal;
  summaryLines: string[];
}

export interface EvidenceSnapshot {
  stageLabel: string;
  revealedSteps: EvidenceStepId[];
  confidence: number;
  uncertainty: number;
  sealLevel: SealLevel;
}

export interface EvidenceDeterminismProbe {
  inputHash: string;
  actionDigest: string;
  finalConfidence: number;
  finalUncertainty: number;
  finalSealLevel: SealLevel;
}

export type RevealedStepInput = EvidenceStepId[];
