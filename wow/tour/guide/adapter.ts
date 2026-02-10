import { CompletionRule, TourScript, TourState, TourStep } from '../types';
import {
  GuideCompletionRule,
  GuideEvidenceItem,
  GuideRuntimeState,
  GuideScript,
  GuideStep,
} from './types';

type EvidenceLookup = Record<string, GuideEvidenceItem>;

function evidenceToCompletionRule(evidenceId: string, lookup: EvidenceLookup): CompletionRule {
  const evidence = lookup[evidenceId];
  if (!evidence) return { type: 'manual' };

  if (evidence.source.type === 'event') {
    return {
      type: 'event',
      name: evidence.source.name,
      count: evidence.source.count,
      where: evidence.source.where,
    };
  }

  if (evidence.source.type === 'slide') {
    const slide = Array.isArray(evidence.source.slide) ? evidence.source.slide[0] : evidence.source.slide;
    return { type: 'slide', slide };
  }

  return { type: 'manual' };
}

function toCompletionRule(rule: GuideCompletionRule, evidenceLookup: EvidenceLookup): CompletionRule {
  if (rule.type === 'manual') return { type: 'manual' };
  if (rule.type === 'event') return { type: 'event', name: rule.name, count: rule.count, where: rule.where };
  if (rule.type === 'slide') {
    const slide = Array.isArray(rule.slide) ? rule.slide[0] : rule.slide;
    return { type: 'slide', slide };
  }
  if (rule.type === 'evidence') {
    return evidenceToCompletionRule(rule.evidenceId, evidenceLookup);
  }
  if (rule.type === 'all') {
    return { type: 'all', rules: rule.rules.map((child) => toCompletionRule(child, evidenceLookup)) };
  }
  return { type: 'any', rules: rule.rules.map((child) => toCompletionRule(child, evidenceLookup)) };
}

export function toTourStep(step: GuideStep): TourStep {
  const evidenceLookup = step.evidence.reduce<EvidenceLookup>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return {
    id: step.id,
    title: step.title,
    body: step.body,
    footnote: step.footnote,
    nextTease: step.nextTease,
    directorNotes: step.directorNotes,
    readAloudText: step.readAloudText,
    successLabel: step.successLabel,
    successText: step.successText,
    action: step.action,
    targetSelector: step.targetSelector,
    missingTargetWarning: step.missingTargetWarning,
    fallbackAllowNext: step.fallbackAllowNext,
    spotlightPadding: step.spotlightPadding,
    spotlightRadius: step.spotlightRadius,
    pulseTarget: step.pulseTarget,
    connector: step.connector,
    placement: step.placement,
    completion: toCompletionRule(step.completion, evidenceLookup),
    pasteQuestion: step.pasteQuestion,
    allowNextBeforeComplete: step.allowNextBeforeComplete,
  };
}

export function toTourScript(script: GuideScript): TourScript {
  return {
    id: script.id,
    title: script.title,
    description: script.description,
    steps: script.steps.map((step) => toTourStep(step)),
  };
}

export function toTourState(script: GuideScript, state: GuideRuntimeState): TourState {
  return {
    status: state.status,
    scriptId: state.scriptId,
    scriptTitle: script.title,
    stepIndex: state.stepIndex,
    steps: script.steps.map((step) => toTourStep(step)),
    completedStepIds: state.completedStepIds,
    eventLog: state.eventLog,
  };
}
