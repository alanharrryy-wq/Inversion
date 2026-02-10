import {
  GuideCompletionRule,
  GuideEvidenceItem,
  GuideEvidenceSource,
  GuideScript,
  GuideScriptMeta,
  GuideStep,
} from './types';

export type StepFactoryInput = Omit<GuideStep, 'evidence' | 'completion'> & {
  evidence?: GuideEvidenceItem[];
  completion?: GuideCompletionRule;
};

export function eventEvidence(args: {
  id: string;
  label: string;
  hint: string;
  name: string;
  count?: number;
  where?: Record<string, string | number | boolean | null>;
  required?: boolean;
  description?: string;
}): GuideEvidenceItem {
  return {
    id: args.id,
    label: args.label,
    hint: args.hint,
    required: args.required,
    source: {
      type: 'event',
      name: args.name,
      count: args.count,
      where: args.where,
      description: args.description,
    },
  };
}

export function slideEvidence(args: {
  id: string;
  label: string;
  hint: string;
  slide: number | number[];
  required?: boolean;
  description?: string;
}): GuideEvidenceItem {
  return {
    id: args.id,
    label: args.label,
    hint: args.hint,
    required: args.required,
    source: {
      type: 'slide',
      slide: args.slide,
      description: args.description,
    },
  };
}

export function selectorEvidence(args: {
  id: string;
  label: string;
  hint: string;
  selector: string;
  mode?: 'exists' | 'missing';
  required?: boolean;
  description?: string;
}): GuideEvidenceItem {
  return {
    id: args.id,
    label: args.label,
    hint: args.hint,
    required: args.required,
    source: {
      type: 'selector',
      selector: args.selector,
      mode: args.mode,
      description: args.description,
    },
  };
}

export function evidenceRef(evidenceId: string): GuideCompletionRule {
  return { type: 'evidence', evidenceId };
}

export function slideRule(slide: number | number[]): GuideCompletionRule {
  return { type: 'slide', slide };
}

export function eventRule(args: {
  name: string;
  count?: number;
  where?: Record<string, string | number | boolean | null>;
}): GuideCompletionRule {
  return { type: 'event', name: args.name, count: args.count, where: args.where };
}

export function allRules(...rules: GuideCompletionRule[]): GuideCompletionRule {
  return {
    type: 'all',
    rules,
  };
}

export function anyRules(...rules: GuideCompletionRule[]): GuideCompletionRule {
  return {
    type: 'any',
    rules,
  };
}

export function inferDefaultCompletion(evidence: GuideEvidenceItem[]): GuideCompletionRule {
  const required = evidence.filter((item) => item.required !== false);
  if (required.length === 0) return { type: 'manual' };
  if (required.length === 1) return evidenceRef(required[0].id);
  return allRules(...required.map((item) => evidenceRef(item.id)));
}

export function createStep(input: StepFactoryInput): GuideStep {
  const evidence = input.evidence ?? [];
  const completion = input.completion ?? inferDefaultCompletion(evidence);

  return {
    ...input,
    evidence,
    completion,
  };
}

export function createScript(args: {
  id: string;
  title: string;
  description: string;
  meta?: Partial<GuideScriptMeta>;
  steps: GuideStep[];
}): GuideScript {
  return {
    id: args.id,
    title: args.title,
    description: args.description,
    meta: {
      version: args.meta?.version ?? '1.0.0',
      owner: args.meta?.owner ?? 'unassigned',
      audience: args.meta?.audience ?? 'unspecified',
      durationMin: args.meta?.durationMin,
      tags: args.meta?.tags,
    },
    steps: args.steps,
  };
}

export function cloneScript(script: GuideScript): GuideScript {
  return {
    ...script,
    meta: {
      ...script.meta,
      tags: script.meta.tags ? [...script.meta.tags] : undefined,
    },
    steps: script.steps.map((step) => ({
      ...step,
      directorNotes: step.directorNotes ? [...step.directorNotes] : undefined,
      evidence: step.evidence.map((item) => ({
        ...item,
        source: { ...item.source },
      })),
      completion: cloneRule(step.completion),
    })),
  };
}

function cloneRule(rule: GuideCompletionRule): GuideCompletionRule {
  if (rule.type === 'all' || rule.type === 'any') {
    return {
      type: rule.type,
      rules: rule.rules.map((child) => cloneRule(child)),
    };
  }

  if (rule.type === 'event') {
    return {
      type: 'event',
      name: rule.name,
      count: rule.count,
      where: rule.where ? { ...rule.where } : undefined,
    };
  }

  if (rule.type === 'slide') {
    return {
      type: 'slide',
      slide: Array.isArray(rule.slide) ? [...rule.slide] : rule.slide,
    };
  }

  if (rule.type === 'evidence') {
    return {
      type: 'evidence',
      evidenceId: rule.evidenceId,
    };
  }

  return { type: 'manual' };
}

export function renameScript(script: GuideScript, id: string, title: string): GuideScript {
  const clone = cloneScript(script);
  clone.id = id;
  clone.title = title;
  return clone;
}

export function appendStep(script: GuideScript, step: GuideStep): GuideScript {
  const clone = cloneScript(script);
  clone.steps.push(step);
  return clone;
}

export function prependStep(script: GuideScript, step: GuideStep): GuideScript {
  const clone = cloneScript(script);
  clone.steps.unshift(step);
  return clone;
}

export function insertStep(script: GuideScript, index: number, step: GuideStep): GuideScript {
  const clone = cloneScript(script);
  const target = Math.max(0, Math.min(clone.steps.length, index));
  clone.steps.splice(target, 0, step);
  return clone;
}

export function replaceStep(script: GuideScript, stepId: string, next: GuideStep): GuideScript {
  const clone = cloneScript(script);
  const index = clone.steps.findIndex((step) => step.id === stepId);
  if (index < 0) return clone;
  clone.steps[index] = next;
  return clone;
}

export function removeStep(script: GuideScript, stepId: string): GuideScript {
  const clone = cloneScript(script);
  clone.steps = clone.steps.filter((step) => step.id !== stepId);
  return clone;
}

export function mapEvidenceByStep(script: GuideScript): Record<string, GuideEvidenceItem[]> {
  const output: Record<string, GuideEvidenceItem[]> = {};
  for (const step of script.steps) {
    output[step.id] = step.evidence.map((item) => ({ ...item, source: { ...item.source } as GuideEvidenceSource }));
  }
  return output;
}

export function extractEventNames(script: GuideScript): string[] {
  const names = new Set<string>();

  for (const step of script.steps) {
    for (const evidence of step.evidence) {
      if (evidence.source.type === 'event') {
        names.add(evidence.source.name);
      }
    }
  }

  return Array.from(names).sort();
}

export function summarizeScript(script: GuideScript): {
  id: string;
  title: string;
  steps: number;
  evidenceItems: number;
  requiredEvidenceItems: number;
  eventEvidenceItems: number;
  selectorEvidenceItems: number;
  slideEvidenceItems: number;
} {
  let evidenceItems = 0;
  let requiredEvidenceItems = 0;
  let eventEvidenceItems = 0;
  let selectorEvidenceItems = 0;
  let slideEvidenceItems = 0;

  for (const step of script.steps) {
    evidenceItems += step.evidence.length;
    for (const evidence of step.evidence) {
      if (evidence.required !== false) requiredEvidenceItems += 1;
      if (evidence.source.type === 'event') eventEvidenceItems += 1;
      if (evidence.source.type === 'selector') selectorEvidenceItems += 1;
      if (evidence.source.type === 'slide') slideEvidenceItems += 1;
    }
  }

  return {
    id: script.id,
    title: script.title,
    steps: script.steps.length,
    evidenceItems,
    requiredEvidenceItems,
    eventEvidenceItems,
    selectorEvidenceItems,
    slideEvidenceItems,
  };
}

export function ensureUniqueStepIds(script: GuideScript): boolean {
  const seen = new Set<string>();
  for (const step of script.steps) {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
  }
  return true;
}

export function ensureUniqueEvidenceIds(script: GuideScript): boolean {
  for (const step of script.steps) {
    const seen = new Set<string>();
    for (const evidence of step.evidence) {
      if (seen.has(evidence.id)) return false;
      seen.add(evidence.id);
    }
  }
  return true;
}
