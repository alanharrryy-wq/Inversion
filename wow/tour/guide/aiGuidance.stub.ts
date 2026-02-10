type GuidanceState = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  scriptId: string | null;
  stepIndex: number;
  completedStepIds: string[];
  eventLog: Array<{ name: string; payload?: Record<string, unknown>; ts: number }>;
  currentSlide: number;
};

type GuidanceStep = {
  id: string;
  title: string;
  body: string;
  completion: { type: string };
  nextTease?: string;
  prerequisites?: string[];
  notes?: string[];
};

export function createGuidanceSuggestions(args: {
  state: GuidanceState;
  step: GuidanceStep | null;
  scriptTitle: string;
}): string[] {
  const { state, step, scriptTitle } = args;
  if (state.status === 'completed') {
    return ['Demo complete. Summarize evidence collected.', 'Offer next-step onboarding question.'];
  }

  if (!step) {
    return [`${scriptTitle}: start when the target slide is visible.`];
  }

  const hints = [`Current step: ${step.title}`, `Required evidence: ${step.completion.type}`];
  if (step.nextTease) hints.push(`Next hint: ${step.nextTease}`);
  if ((step.prerequisites?.length ?? 0) > 0) {
    hints.push(`Dependencies: ${step.prerequisites?.join(', ')}`);
  }
  return hints;
}
