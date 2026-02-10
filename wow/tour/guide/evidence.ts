import {
  GuideCompletionRule,
  GuideEvidenceEvent,
  GuideEvidenceItem,
  GuideEvidenceResolution,
  GuideRuleResolution,
  GuideRuntimeContext,
  GuideRuntimeState,
  GuideStep,
} from './types';

function formatExpected(rule: GuideEvidenceItem['source']): string {
  if (rule.type === 'event') {
    const expectedCount = rule.count ?? 1;
    return `${rule.name} x${expectedCount}`;
  }
  if (rule.type === 'slide') {
    const slides = Array.isArray(rule.slide) ? rule.slide : [rule.slide];
    return `slide ${slides.join(' or ')}`;
  }
  const mode = rule.mode ?? 'exists';
  return `${mode}(${rule.selector})`;
}

function primitiveEquals(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return actual.some((item) => primitiveEquals(item, expected));
  }
  return actual === expected;
}

function matchesWhere(payload: GuideEvidenceEvent['payload'], where: Record<string, unknown>): boolean {
  if (!payload) return false;
  for (const [key, expected] of Object.entries(where)) {
    if (!primitiveEquals(payload[key], expected)) {
      return false;
    }
  }
  return true;
}

function countEventMatches(events: GuideEvidenceEvent[], name: string, where?: Record<string, unknown>): number {
  let count = 0;
  for (const event of events) {
    if (event.name !== name) continue;
    if (!where || matchesWhere(event.payload, where)) {
      count += 1;
    }
  }
  return count;
}

function evaluateEventEvidence(item: GuideEvidenceItem, state: GuideRuntimeState): GuideEvidenceResolution {
  const source = item.source;
  if (source.type !== 'event') {
    return {
      id: item.id,
      label: item.label,
      hint: item.hint,
      required: item.required !== false,
      matched: false,
      expected: formatExpected(item.source),
      observed: 'invalid-source',
      sourceType: item.source.type,
    };
  }

  const count = countEventMatches(state.eventLog, source.name, source.where);
  const expectedCount = source.count ?? 1;
  return {
    id: item.id,
    label: item.label,
    hint: item.hint,
    required: item.required !== false,
    matched: count >= expectedCount,
    expected: formatExpected(item.source),
    observed: `${source.name} x${count}`,
    sourceType: item.source.type,
  };
}

function evaluateSlideEvidence(item: GuideEvidenceItem, state: GuideRuntimeState): GuideEvidenceResolution {
  const source = item.source;
  if (source.type !== 'slide') {
    return {
      id: item.id,
      label: item.label,
      hint: item.hint,
      required: item.required !== false,
      matched: false,
      expected: formatExpected(item.source),
      observed: 'invalid-source',
      sourceType: item.source.type,
    };
  }

  const slides = Array.isArray(source.slide) ? source.slide : [source.slide];
  const matched = slides.includes(state.currentSlide);
  return {
    id: item.id,
    label: item.label,
    hint: item.hint,
    required: item.required !== false,
    matched,
    expected: formatExpected(item.source),
    observed: `slide ${state.currentSlide}`,
    sourceType: item.source.type,
  };
}

function evaluateSelectorEvidence(item: GuideEvidenceItem, ctx: GuideRuntimeContext): GuideEvidenceResolution {
  const source = item.source;
  if (source.type !== 'selector') {
    return {
      id: item.id,
      label: item.label,
      hint: item.hint,
      required: item.required !== false,
      matched: false,
      expected: formatExpected(item.source),
      observed: 'invalid-source',
      sourceType: item.source.type,
    };
  }

  const mode = source.mode ?? 'exists';
  const exists = ctx.targetExists(source.selector);
  const matched = mode === 'exists' ? exists : !exists;
  return {
    id: item.id,
    label: item.label,
    hint: item.hint,
    required: item.required !== false,
    matched,
    expected: formatExpected(item.source),
    observed: `${mode === 'exists' ? 'exists' : 'missing'}=${exists}`,
    sourceType: item.source.type,
  };
}

export function evaluateEvidenceItem(item: GuideEvidenceItem, state: GuideRuntimeState, ctx: GuideRuntimeContext): GuideEvidenceResolution {
  if (item.source.type === 'event') return evaluateEventEvidence(item, state);
  if (item.source.type === 'slide') return evaluateSlideEvidence(item, state);
  return evaluateSelectorEvidence(item, ctx);
}

function evaluateRuleEvent(rule: Extract<GuideCompletionRule, { type: 'event' }>, state: GuideRuntimeState): GuideRuleResolution {
  const count = countEventMatches(state.eventLog, rule.name, rule.where);
  const expectedCount = rule.count ?? 1;
  const matched = count >= expectedCount;
  return {
    matched,
    missingEvidenceIds: [],
    unmetRuleSummaries: matched ? [] : [`Need event ${rule.name} x${expectedCount} (have ${count}).`],
  };
}

function evaluateRuleSlide(rule: Extract<GuideCompletionRule, { type: 'slide' }>, state: GuideRuntimeState): GuideRuleResolution {
  const slides = Array.isArray(rule.slide) ? rule.slide : [rule.slide];
  const matched = slides.includes(state.currentSlide);
  return {
    matched,
    missingEvidenceIds: [],
    unmetRuleSummaries: matched ? [] : [`Need slide ${slides.join(' or ')} (current ${state.currentSlide}).`],
  };
}

function mergeRuleSummaries(items: GuideRuleResolution[]): string[] {
  const summaries: string[] = [];
  for (const item of items) {
    summaries.push(...item.unmetRuleSummaries);
  }
  return Array.from(new Set(summaries));
}

function mergeMissingEvidenceIds(items: GuideRuleResolution[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    ids.push(...item.missingEvidenceIds);
  }
  return Array.from(new Set(ids));
}

export function evaluateCompletionRule(
  rule: GuideCompletionRule,
  evidenceById: Record<string, GuideEvidenceResolution>,
  state: GuideRuntimeState,
): GuideRuleResolution {
  if (rule.type === 'manual') {
    return {
      matched: false,
      missingEvidenceIds: [],
      unmetRuleSummaries: ['Manual completion required.'],
    };
  }

  if (rule.type === 'evidence') {
    const evidence = evidenceById[rule.evidenceId];
    if (!evidence) {
      return {
        matched: false,
        missingEvidenceIds: [rule.evidenceId],
        unmetRuleSummaries: [`Missing evidence declaration ${rule.evidenceId}.`],
      };
    }

    return {
      matched: evidence.matched,
      missingEvidenceIds: evidence.matched ? [] : [rule.evidenceId],
      unmetRuleSummaries: evidence.matched ? [] : [`Evidence not met: ${evidence.label}.`],
    };
  }

  if (rule.type === 'event') {
    return evaluateRuleEvent(rule, state);
  }

  if (rule.type === 'slide') {
    return evaluateRuleSlide(rule, state);
  }

  const parts = rule.rules.map((child) => evaluateCompletionRule(child, evidenceById, state));
  if (rule.type === 'all') {
    const matched = parts.every((item) => item.matched);
    return {
      matched,
      missingEvidenceIds: mergeMissingEvidenceIds(parts),
      unmetRuleSummaries: matched ? [] : mergeRuleSummaries(parts),
    };
  }

  const anyMatched = parts.some((item) => item.matched);
  if (anyMatched) {
    return {
      matched: true,
      missingEvidenceIds: [],
      unmetRuleSummaries: [],
    };
  }

  return {
    matched: false,
    missingEvidenceIds: mergeMissingEvidenceIds(parts),
    unmetRuleSummaries: mergeRuleSummaries(parts),
  };
}

export function evaluateStepEvidence(step: GuideStep, state: GuideRuntimeState, ctx: GuideRuntimeContext): GuideEvidenceResolution[] {
  return step.evidence.map((item) => evaluateEvidenceItem(item, state, ctx));
}

export function buildEvidenceMap(items: GuideEvidenceResolution[]): Record<string, GuideEvidenceResolution> {
  const map: Record<string, GuideEvidenceResolution> = {};
  for (const item of items) {
    map[item.id] = item;
  }
  return map;
}

export function splitEvidence(items: GuideEvidenceResolution[]): {
  missing: GuideEvidenceResolution[];
  satisfied: GuideEvidenceResolution[];
} {
  const missing: GuideEvidenceResolution[] = [];
  const satisfied: GuideEvidenceResolution[] = [];

  for (const item of items) {
    if (item.matched || !item.required) {
      satisfied.push(item);
      continue;
    }
    missing.push(item);
  }

  return { missing, satisfied };
}

export function summarizeRuleResolution(resolution: GuideRuleResolution): string[] {
  if (resolution.matched) return [];
  if (resolution.unmetRuleSummaries.length > 0) return resolution.unmetRuleSummaries;
  return ['Completion rule not satisfied yet.'];
}

export function findLastEvent(events: GuideEvidenceEvent[], name: string): GuideEvidenceEvent | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    if (events[i].name === name) {
      return events[i];
    }
  }
  return null;
}
