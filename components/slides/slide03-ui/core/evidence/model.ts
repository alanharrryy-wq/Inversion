import {
  ConfidenceBand,
  ConfidenceSeal,
  ConstraintPressure,
  ConstraintProfile,
  EvidenceEvaluation,
  EvidenceModelInput,
  EvidenceStepDefinition,
  EvidenceStepId,
  RevealedStepInput,
  RouteProfile,
  StepContribution,
} from "./types";
import { STEP_ORDER } from "./catalog";

const clampInt = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
};

const clampFloat = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const stableSortSteps = (steps: EvidenceStepDefinition[]): EvidenceStepDefinition[] => {
  return [...steps].sort((a, b) => {
    if (a.ordinal !== b.ordinal) return a.ordinal - b.ordinal;
    return a.id.localeCompare(b.id);
  });
};

const stableConstraintDigest = (constraints: ConstraintProfile[]): string => {
  const sorted = [...constraints].sort((a, b) => a.id.localeCompare(b.id));
  return sorted
    .map(
      (constraint) =>
        `${constraint.id}:${constraint.axis}:${constraint.severity}:${constraint.satisfied ? "1" : "0"}:${constraint.penaltyIfUnsatisfied}`
    )
    .join("|");
};

const findStepById = (
  steps: EvidenceStepDefinition[],
  id: EvidenceStepId
): EvidenceStepDefinition | undefined => {
  for (const step of steps) {
    if (step.id === id) return step;
  }
  return undefined;
};

const uniqueStepOrder = (steps: RevealedStepInput): EvidenceStepId[] => {
  const output: EvidenceStepId[] = [];
  for (const candidate of steps) {
    if (!STEP_ORDER.includes(candidate)) continue;
    if (output.includes(candidate)) continue;
    output.push(candidate);
  }
  return output;
};

const enforceLadderOrder = (revealed: EvidenceStepId[]): EvidenceStepId[] => {
  const accepted: EvidenceStepId[] = [];
  let expectedIndex = 0;

  for (const candidate of revealed) {
    const expectedId = STEP_ORDER[expectedIndex];
    if (!expectedId) break;
    if (candidate !== expectedId) {
      continue;
    }
    accepted.push(candidate);
    expectedIndex += 1;
  }

  return accepted;
};

export const normalizeRevealedSteps = (revealed: RevealedStepInput): EvidenceStepId[] => {
  const unique = uniqueStepOrder(revealed);
  return enforceLadderOrder(unique);
};

const computeSatisfactionRatioScaled = (constraints: ConstraintProfile[]): number => {
  const totalSeverity = constraints.reduce((acc, constraint) => acc + constraint.severity, 0);
  if (totalSeverity <= 0) return 0;
  const satisfiedSeverity = constraints
    .filter((constraint) => constraint.satisfied)
    .reduce((acc, constraint) => acc + constraint.severity, 0);
  return Math.round((satisfiedSeverity / totalSeverity) * 1000);
};

export const computeConstraintPressure = (constraints: ConstraintProfile[]): ConstraintPressure => {
  const totalSeverity = constraints.reduce((acc, constraint) => acc + constraint.severity, 0);
  const satisfiedSeverity = constraints
    .filter((constraint) => constraint.satisfied)
    .reduce((acc, constraint) => acc + constraint.severity, 0);
  const unsatisfiedSeverity = totalSeverity - satisfiedSeverity;

  const weightedPenalty = constraints.reduce((acc, constraint) => {
    if (constraint.satisfied) return acc;
    return acc + constraint.penaltyIfUnsatisfied;
  }, 0);

  return {
    totalSeverity,
    satisfiedSeverity,
    unsatisfiedSeverity,
    satisfiedRatioScaled: computeSatisfactionRatioScaled(constraints),
    weightedPenalty,
    digest: stableConstraintDigest(constraints),
  };
};

const computeRouteAxisScore = (route: RouteProfile): number => {
  const fit = route.axisWeights.fit * 100;
  const defensibility = route.axisWeights.defensibility * 100;
  const velocity = route.axisWeights.velocity * 100;
  const resilience = route.axisWeights.resilience * 100;

  const weightedScore = fit * 0.31 + defensibility * 0.34 + velocity * 0.17 + resilience * 0.18;
  const routeStrengthContribution = route.routeStrength * 0.26;

  return weightedScore + routeStrengthContribution;
};

const computeBaselineConfidence = (route: RouteProfile, pressure: ConstraintPressure): number => {
  const routeAxisScore = computeRouteAxisScore(route);
  const satisfactionBonus = (pressure.satisfiedRatioScaled / 1000) * 16;
  const pressurePenalty = pressure.weightedPenalty * 0.42;
  const routeFloor = route.baselineConfidence;
  const confidence = routeFloor + routeAxisScore * 0.18 + satisfactionBonus - pressurePenalty;
  return clampInt(confidence, 0, 100);
};

const computeBaselineUncertainty = (route: RouteProfile, pressure: ConstraintPressure): number => {
  const satisfactionDrop = (pressure.satisfiedRatioScaled / 1000) * 24;
  const pressureAdd = pressure.weightedPenalty * 0.37;
  const routeBase = route.baselineUncertainty;
  const uncertainty = routeBase + pressureAdd - satisfactionDrop;
  return clampInt(uncertainty, 0, 100);
};

const computeAxisMultiplier = (
  route: RouteProfile,
  step: EvidenceStepDefinition,
  pressure: ConstraintPressure
): number => {
  const fitWeight = step.axisInfluence.fit ?? 0;
  const defensibilityWeight = step.axisInfluence.defensibility ?? 0;
  const velocityWeight = step.axisInfluence.velocity ?? 0;
  const resilienceWeight = step.axisInfluence.resilience ?? 0;

  const routeAlignment =
    route.axisWeights.fit * fitWeight +
    route.axisWeights.defensibility * defensibilityWeight +
    route.axisWeights.velocity * velocityWeight +
    route.axisWeights.resilience * resilienceWeight;

  const pressureAlignment = 0.82 + pressure.satisfiedRatioScaled / 2000;
  return clampFloat(routeAlignment * pressureAlignment, 0.38, 1.32);
};

const computeConfidenceGain = (
  step: EvidenceStepDefinition,
  route: RouteProfile,
  pressure: ConstraintPressure
): number => {
  const axisMultiplier = computeAxisMultiplier(route, step, pressure);
  const routeStrengthFactor = clampFloat(route.routeStrength / 100, 0.4, 1);
  const gain = step.baseConfidenceGain * (0.58 + axisMultiplier * 0.42) * (0.86 + routeStrengthFactor * 0.22);
  return clampInt(gain, 3, 30);
};

const computeUncertaintyDrop = (
  step: EvidenceStepDefinition,
  route: RouteProfile,
  pressure: ConstraintPressure
): number => {
  const axisMultiplier = computeAxisMultiplier(route, step, pressure);
  const pressureFactor = clampFloat(pressure.satisfiedRatioScaled / 1000, 0.1, 1);
  const drop = step.baseUncertaintyDrop * (0.52 + axisMultiplier * 0.38) * (0.7 + pressureFactor * 0.3);
  return clampInt(drop, 4, 32);
};

const toBand = (confidence: number): ConfidenceBand => {
  if (confidence < 50) return "fragile";
  if (confidence < 67) return "emerging";
  if (confidence < 83) return "credible";
  return "dominant";
};

const toGrade = (confidence: number): string => {
  if (confidence >= 95) return "A+";
  if (confidence >= 90) return "A";
  if (confidence >= 85) return "A-";
  if (confidence >= 80) return "B+";
  if (confidence >= 73) return "B";
  if (confidence >= 67) return "B-";
  if (confidence >= 60) return "C+";
  if (confidence >= 53) return "C";
  if (confidence >= 46) return "C-";
  if (confidence >= 38) return "D";
  return "E";
};

const computeSealLevel = (confidence: number, revealedCount: number): "open" | "forming" | "sealed" => {
  if (revealedCount === 0) {
    return "open";
  }
  if (revealedCount >= 3 && confidence >= 85) {
    return "sealed";
  }
  if (confidence >= 60) {
    return "forming";
  }
  return "open";
};

const buildSeal = (
  route: RouteProfile,
  revealedCount: number,
  confidence: number,
  uncertainty: number
): ConfidenceSeal => {
  const band = toBand(confidence);
  const grade = toGrade(confidence);
  const level = computeSealLevel(confidence, revealedCount);
  return {
    level,
    band,
    grade,
    confidence,
    uncertainty,
    routeId: route.id,
    routeLabel: route.label,
    revealedCount,
  };
};

const buildAxisDeltas = (
  step: EvidenceStepDefinition,
  confidenceGain: number,
  uncertaintyDrop: number
): Partial<Record<"fit" | "defensibility" | "velocity" | "resilience", number>> => {
  const fitWeight = step.axisInfluence.fit ?? 0;
  const defensibilityWeight = step.axisInfluence.defensibility ?? 0;
  const velocityWeight = step.axisInfluence.velocity ?? 0;
  const resilienceWeight = step.axisInfluence.resilience ?? 0;

  return {
    fit: clampInt(confidenceGain * fitWeight - uncertaintyDrop * (1 - fitWeight) * 0.15, -100, 100),
    defensibility: clampInt(
      confidenceGain * defensibilityWeight - uncertaintyDrop * (1 - defensibilityWeight) * 0.15,
      -100,
      100
    ),
    velocity: clampInt(confidenceGain * velocityWeight - uncertaintyDrop * (1 - velocityWeight) * 0.15, -100, 100),
    resilience: clampInt(
      confidenceGain * resilienceWeight - uncertaintyDrop * (1 - resilienceWeight) * 0.15,
      -100,
      100
    ),
  };
};

const buildSummaryLines = (
  route: RouteProfile,
  pressure: ConstraintPressure,
  contributions: StepContribution[],
  confidence: number,
  uncertainty: number,
  seal: ConfidenceSeal
): string[] => {
  const firstLine = `Route ${route.label} confidence ${confidence} with uncertainty ${uncertainty}.`;
  const secondLine = `Constraint satisfaction ${pressure.satisfiedRatioScaled / 10}% with weighted penalty ${pressure.weightedPenalty}.`;
  const thirdLine = `Seal ${seal.level.toUpperCase()} (${seal.band}, grade ${seal.grade}) after ${contributions.length} revealed steps.`;

  const contributionLines = contributions.map((contribution) => {
    const gainSign = contribution.confidenceGain >= 0 ? "+" : "";
    const dropSign = contribution.uncertaintyDrop >= 0 ? "-" : "+";
    return `${contribution.id} -> confidence ${gainSign}${contribution.confidenceGain}, uncertainty ${dropSign}${contribution.uncertaintyDrop}.`;
  });

  return [firstLine, secondLine, thirdLine, ...contributionLines];
};

export const evaluateEvidenceLadder = (
  input: EvidenceModelInput,
  revealedStepsInput: RevealedStepInput
): EvidenceEvaluation => {
  const sortedSteps = stableSortSteps(input.steps);
  const pressure = computeConstraintPressure(input.constraints);

  const normalizedRevealed = normalizeRevealedSteps(revealedStepsInput);
  const availableSteps = sortedSteps.map((step) => step.id);

  let runningConfidence = computeBaselineConfidence(input.route, pressure);
  let runningUncertainty = computeBaselineUncertainty(input.route, pressure);

  const baselineConfidence = runningConfidence;
  const baselineUncertainty = runningUncertainty;

  const contributions: StepContribution[] = [];

  for (const stepId of normalizedRevealed) {
    const step = findStepById(sortedSteps, stepId);
    if (!step) continue;

    const confidenceGain = computeConfidenceGain(step, input.route, pressure);
    const uncertaintyDrop = computeUncertaintyDrop(step, input.route, pressure);

    const confidenceBefore = runningConfidence;
    const uncertaintyBefore = runningUncertainty;

    runningConfidence = clampInt(runningConfidence + confidenceGain, 0, 100);
    runningUncertainty = clampInt(runningUncertainty - uncertaintyDrop, 0, 100);

    contributions.push({
      id: step.id,
      ordinal: step.ordinal,
      title: step.title,
      confidenceGain,
      uncertaintyDrop,
      confidenceBefore,
      confidenceAfter: runningConfidence,
      uncertaintyBefore,
      uncertaintyAfter: runningUncertainty,
      rationale: [...step.rationale],
      axisDeltas: buildAxisDeltas(step, confidenceGain, uncertaintyDrop),
    });
  }

  const missingSteps = availableSteps.filter((stepId) => !normalizedRevealed.includes(stepId));
  const seal = buildSeal(input.route, normalizedRevealed.length, runningConfidence, runningUncertainty);
  const summaryLines = buildSummaryLines(
    input.route,
    pressure,
    contributions,
    runningConfidence,
    runningUncertainty,
    seal
  );

  return {
    route: {
      ...input.route,
      axisWeights: { ...input.route.axisWeights },
    },
    pressure,
    revealedSteps: [...normalizedRevealed],
    missingSteps,
    availableSteps,
    contributions,
    confidence: runningConfidence,
    uncertainty: runningUncertainty,
    confidenceDeltaFromBaseline: runningConfidence - baselineConfidence,
    uncertaintyDeltaFromBaseline: runningUncertainty - baselineUncertainty,
    seal,
    summaryLines,
  };
};

export const computeStepPreview = (
  input: EvidenceModelInput,
  currentRevealed: RevealedStepInput,
  candidate: EvidenceStepId
): StepContribution | null => {
  const normalizedCurrent = normalizeRevealedSteps(currentRevealed);
  const alreadyIncluded = normalizedCurrent.includes(candidate);
  if (alreadyIncluded) return null;

  const nextAttempt = normalizeRevealedSteps([...normalizedCurrent, candidate]);
  if (nextAttempt.length === normalizedCurrent.length) {
    return null;
  }

  const currentEval = evaluateEvidenceLadder(input, normalizedCurrent);
  const nextEval = evaluateEvidenceLadder(input, nextAttempt);
  const added = nextEval.contributions[nextEval.contributions.length - 1];
  if (!added) return null;

  return {
    ...added,
    confidenceBefore: currentEval.confidence,
    confidenceAfter: nextEval.confidence,
    uncertaintyBefore: currentEval.uncertainty,
    uncertaintyAfter: nextEval.uncertainty,
  };
};

export const nextExpectedStep = (
  revealedStepsInput: RevealedStepInput,
  steps: EvidenceStepDefinition[]
): EvidenceStepId | null => {
  const normalized = normalizeRevealedSteps(revealedStepsInput);
  const sorted = stableSortSteps(steps);
  for (const step of sorted) {
    if (!normalized.includes(step.id)) {
      return step.id;
    }
  }
  return null;
};

export const deriveConfidenceNarrative = (evaluation: EvidenceEvaluation): string[] => {
  const lines: string[] = [];
  lines.push(`Route: ${evaluation.route.label}`);
  lines.push(`Seal: ${evaluation.seal.level.toUpperCase()} (${evaluation.seal.band}, ${evaluation.seal.grade})`);
  lines.push(`Confidence: ${evaluation.confidence}`);
  lines.push(`Uncertainty: ${evaluation.uncertainty}`);

  if (evaluation.contributions.length === 0) {
    lines.push("No evidence revealed yet. Confidence remains baseline-limited.");
    return lines;
  }

  for (const contribution of evaluation.contributions) {
    lines.push(
      `${contribution.id} raised confidence from ${contribution.confidenceBefore} to ${contribution.confidenceAfter} and reduced uncertainty from ${contribution.uncertaintyBefore} to ${contribution.uncertaintyAfter}.`
    );
  }

  return lines;
};

export const evaluateWithSnapshot = (
  input: EvidenceModelInput,
  revealedSteps: RevealedStepInput,
  stageLabel: string
) => {
  const evaluation = evaluateEvidenceLadder(input, revealedSteps);
  return {
    evaluation,
    snapshot: {
      stageLabel,
      revealedSteps: [...evaluation.revealedSteps],
      confidence: evaluation.confidence,
      uncertainty: evaluation.uncertainty,
      sealLevel: evaluation.seal.level,
    },
  };
};

export const stableInputHash = (input: EvidenceModelInput): string => {
  const routeDigest = `${input.route.id}:${input.route.baselineConfidence}:${input.route.baselineUncertainty}:${input.route.routeStrength}`;
  const weightsDigest = `fit:${input.route.axisWeights.fit};def:${input.route.axisWeights.defensibility};vel:${input.route.axisWeights.velocity};res:${input.route.axisWeights.resilience}`;
  const stepDigest = stableSortSteps(input.steps)
    .map(
      (step) =>
        `${step.id}:${step.ordinal}:${step.unlockThreshold}:${step.baseConfidenceGain}:${step.baseUncertaintyDrop}`
    )
    .join("|");

  const constraintDigest = stableConstraintDigest(input.constraints);

  return `${routeDigest}|${weightsDigest}|${stepDigest}|${constraintDigest}`;
};

export const toDeterministicProbe = (
  input: EvidenceModelInput,
  revealedSteps: RevealedStepInput,
  actionDigest: string
) => {
  const evaluation = evaluateEvidenceLadder(input, revealedSteps);
  return {
    inputHash: stableInputHash(input),
    actionDigest,
    finalConfidence: evaluation.confidence,
    finalUncertainty: evaluation.uncertainty,
    finalSealLevel: evaluation.seal.level,
  };
};
