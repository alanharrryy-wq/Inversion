import { GuideState, GuideStep } from './script.types';

export function createGuidanceSuggestions(args: { state: GuideState; step: GuideStep | null; scriptTitle: string }): string[] {
  const { state, step, scriptTitle } = args;
  if (state.status === 'completed') {
    return ['Demo complete. Summarize evidence collected.', 'Offer next-step onboarding question.'];
  }

  if (!step) {
    return [`${scriptTitle}: start when the target slide is visible.`];
  }

  const base = [`Current step: ${step.title}`, `Required evidence: ${step.completion.type}`];
  if (step.tease) base.push(`Next hint: ${step.tease}`);
  if ((step.prerequisites?.length ?? 0) > 0) {
    base.push(`Dependencies: ${step.prerequisites?.join(', ')}`);
  }
  return base;
}
