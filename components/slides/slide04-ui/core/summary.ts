import {
  createEmptySourceCounter,
  routeRiskFactor,
  SLIDE04_SUMMARY_VERSION,
} from "./constants";
import {
  ConstraintDigestItem,
  DecisionDigest,
  EvidenceDigestItem,
  EvidenceSource,
  SealDigest,
  SummaryInput,
  SummaryOutput,
} from "./types";

function roundToInt(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stableCompare(a: string, b: string): number {
  return a.localeCompare(b);
}

export function canonicalizeConstraintItems(items: ConstraintDigestItem[]): ConstraintDigestItem[] {
  return [...items]
    .map((item) => ({ ...item }))
    .sort((left, right) => stableCompare(left.id, right.id));
}

export function canonicalizeEvidenceItems(items: EvidenceDigestItem[]): EvidenceDigestItem[] {
  return [...items]
    .map((item) => ({ ...item }))
    .sort((left, right) => {
      const byId = stableCompare(left.id, right.id);
      if (byId !== 0) {
        return byId;
      }
      return stableCompare(left.source, right.source);
    });
}

function computeConstraintDigest(items: ConstraintDigestItem[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  const blockedWeight = items
    .filter((item) => item.state === "blocked")
    .reduce((sum, item) => sum + item.weight, 0);

  const atRiskWeight = items
    .filter((item) => item.state === "at-risk")
    .reduce((sum, item) => sum + item.weight, 0);

  const satisfiedWeight = items
    .filter((item) => item.state === "satisfied")
    .reduce((sum, item) => sum + item.weight, 0);

  return {
    totalWeight,
    blockedWeight,
    atRiskWeight,
    satisfiedWeight,
    items,
  };
}

function computeEvidenceDigest(items: EvidenceDigestItem[]) {
  const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0);
  const averageConfidence = items.length > 0 ? totalConfidence / items.length : 0;

  const bySource = createEmptySourceCounter();
  for (const item of items) {
    bySource[item.source] += 1;
  }

  return {
    totalConfidence,
    averageConfidence: roundToInt(averageConfidence),
    bySource,
    items,
  };
}

function buildDecisionNarrative(
  routeLabel: string,
  blockedCount: number,
  atRiskCount: number,
  evidenceCount: number,
  confidenceScore: number
): string {
  if (blockedCount > 0) {
    return `${routeLabel} is not lockable while blocked constraints remain.`;
  }

  if (evidenceCount < 2) {
    return `${routeLabel} requires additional evidence before handoff.`;
  }

  if (atRiskCount > 1) {
    return `${routeLabel} can proceed with controlled risk watch and evidence-first governance.`;
  }

  if (confidenceScore >= 80) {
    return `${routeLabel} is sealed with high-confidence evidence and stable constraints.`;
  }

  return `${routeLabel} is sealed with moderate confidence and explicit risk disclosure.`;
}

function computeDecisionDigest(input: SummaryInput): DecisionDigest {
  const blockedCount = input.constraints.filter((item) => item.state === "blocked").length;
  const atRiskCount = input.constraints.filter((item) => item.state === "at-risk").length;
  const satisfiedCount = input.constraints.filter((item) => item.state === "satisfied").length;

  const totalWeight = input.constraints.reduce((sum, item) => sum + item.weight, 0);
  const blockedWeight = input.constraints
    .filter((item) => item.state === "blocked")
    .reduce((sum, item) => sum + item.weight, 0);

  const atRiskWeight = input.constraints
    .filter((item) => item.state === "at-risk")
    .reduce((sum, item) => sum + item.weight, 0);

  const evidenceCount = input.evidence.length;
  const evidenceConfidenceTotal = input.evidence.reduce((sum, item) => sum + item.confidence, 0);
  const evidenceConfidenceAverage = evidenceCount > 0 ? evidenceConfidenceTotal / evidenceCount : 0;

  const routeFactor = routeRiskFactor(input.route.riskBand);
  const riskPenalty = blockedWeight * 1.4 + atRiskWeight * 0.55 + routeFactor;
  const baseRouteScore = totalWeight === 0 ? 0 : (1 - blockedWeight / totalWeight) * 100;
  const routeScore = clamp(roundToInt(baseRouteScore - atRiskWeight * 0.25), 0, 100);

  const confidenceScore = clamp(
    roundToInt(evidenceConfidenceAverage - riskPenalty * 0.35 + evidenceCount * 1.5),
    0,
    100
  );

  const lockReady = blockedCount === 0 && evidenceCount >= 2;

  return {
    routeScore,
    confidenceScore,
    blockedCount,
    atRiskCount,
    satisfiedCount,
    evidenceCount,
    lockReady,
    narrative: buildDecisionNarrative(
      input.route.label,
      blockedCount,
      atRiskCount,
      evidenceCount,
      confidenceScore
    ),
  };
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue).sort(stableCompare);
  const members = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`);
  return `{${members.join(",")}}`;
}

/**
 * FNV-1a 32-bit hash for deterministic, lightweight summary signatures.
 */
export function fnv1aHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createSealDigest(input: SummaryInput, decision: DecisionDigest): SealDigest {
  const canonicalPayload = {
    schemaVersion: SLIDE04_SUMMARY_VERSION,
    route: {
      id: input.route.id,
      label: input.route.label,
      owner: input.route.owner,
      handoffTag: input.route.handoffTag,
      horizonDays: input.route.horizonDays,
      riskBand: input.route.riskBand,
      thesis: input.route.thesis,
    },
    constraints: input.constraints,
    evidence: input.evidence,
    decision,
    holdMs: input.holdMs,
    sealedAtMs: input.sealedAtMs,
  };

  const canonicalJson = stableStringify(canonicalPayload);
  const hash = fnv1aHash(canonicalJson);

  return {
    hash,
    signature: `S04-${hash.toUpperCase()}`,
    holdMs: roundToInt(input.holdMs),
    sealedAtMs: roundToInt(input.sealedAtMs),
  };
}

export function createSummaryModel(input: SummaryInput): SummaryOutput {
  const canonicalConstraints = canonicalizeConstraintItems(input.constraints);
  const canonicalEvidence = canonicalizeEvidenceItems(input.evidence);

  const constraintDigest = computeConstraintDigest(canonicalConstraints);
  const evidenceDigest = computeEvidenceDigest(canonicalEvidence);
  const decision = computeDecisionDigest({
    ...input,
    constraints: canonicalConstraints,
    evidence: canonicalEvidence,
  });

  const seal = createSealDigest(
    {
      ...input,
      constraints: canonicalConstraints,
      evidence: canonicalEvidence,
    },
    decision
  );

  return {
    schemaVersion: SLIDE04_SUMMARY_VERSION,
    route: {
      ...input.route,
    },
    constraintDigest,
    evidenceDigest,
    decision,
    seal,
  };
}

export function createSummaryCanonicalJson(summary: SummaryOutput): string {
  return stableStringify(summary);
}

export function summarizeSourceMix(summary: SummaryOutput): string {
  const sourceEntries = Object.entries(summary.evidenceDigest.bySource)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => stableCompare(left, right))
    .map(([source, count]) => `${source}:${count}`);

  if (sourceEntries.length === 0) {
    return "none";
  }

  return sourceEntries.join(" | ");
}

export function createSummaryPreviewLine(summary: SummaryOutput): string {
  return `${summary.route.label} | score:${summary.decision.routeScore} | conf:${summary.decision.confidenceScore} | hash:${summary.seal.hash}`;
}

export function pickHighestConfidenceSource(summary: SummaryOutput): EvidenceSource | null {
  if (summary.evidenceDigest.items.length === 0) {
    return null;
  }

  const sorted = [...summary.evidenceDigest.items].sort((left, right) => {
    if (right.confidence !== left.confidence) {
      return right.confidence - left.confidence;
    }
    return stableCompare(left.id, right.id);
  });

  return sorted[0].source;
}
