import { GuideScript } from './types';

export type GuideChecklistItem = {
  id: string;
  title: string;
  action: string;
  success: string;
  evidence: string[];
  notes: string[];
  tease?: string;
};

export type GuideChecklist = {
  scriptId: string;
  scriptTitle: string;
  items: GuideChecklistItem[];
};

function actionText(step: GuideScript['steps'][number]): string {
  if (step.action.type === 'click') return `Click ${step.action.selector}`;
  if (step.action.type === 'navigate') return step.action.text;
  if (step.action.type === 'state') return step.action.text;
  if (step.action.type === 'chat') return step.action.text;
  return step.action.text;
}

function evidenceSummary(step: GuideScript['steps'][number]): string[] {
  return step.evidence.map((item) => {
    if (item.source.type === 'event') {
      const count = item.source.count ?? 1;
      return `${item.id}: event ${item.source.name} x${count}`;
    }
    if (item.source.type === 'slide') {
      const slide = Array.isArray(item.source.slide) ? item.source.slide.join(' or ') : item.source.slide;
      return `${item.id}: slide ${slide}`;
    }
    const mode = item.source.mode ?? 'exists';
    return `${item.id}: selector ${mode} ${item.source.selector}`;
  });
}

export function buildGuideChecklist(script: GuideScript): GuideChecklist {
  return {
    scriptId: script.id,
    scriptTitle: script.title,
    items: script.steps.map((step) => ({
      id: step.id,
      title: step.title,
      action: actionText(step),
      success: step.successText,
      evidence: evidenceSummary(step),
      notes: step.directorNotes ?? [],
      tease: step.nextTease,
    })),
  };
}

export function checklistToMarkdown(checklist: GuideChecklist): string {
  const lines: string[] = [];
  lines.push(`# ${checklist.scriptTitle}`);
  lines.push('');
  lines.push(`Script id: ${checklist.scriptId}`);
  lines.push('');

  for (const item of checklist.items) {
    lines.push(`## ${item.id} - ${item.title}`);
    lines.push('');
    lines.push(`Action: ${item.action}`);
    lines.push(`Success: ${item.success}`);
    if (item.tease) {
      lines.push(`Next tease: ${item.tease}`);
    }
    lines.push('');
    lines.push('Evidence:');
    for (const evidence of item.evidence) {
      lines.push(`- ${evidence}`);
    }
    lines.push('');
    lines.push('Notes:');
    if (item.notes.length === 0) {
      lines.push('- none');
    } else {
      for (const note of item.notes) {
        lines.push(`- ${note}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function checklistById(checklist: GuideChecklist): Record<string, GuideChecklistItem> {
  const output: Record<string, GuideChecklistItem> = {};
  for (const item of checklist.items) {
    output[item.id] = item;
  }
  return output;
}

export function flattenChecklistEvidence(checklist: GuideChecklist): string[] {
  const output: string[] = [];
  for (const item of checklist.items) {
    for (const evidence of item.evidence) {
      output.push(`${item.id} :: ${evidence}`);
    }
  }
  return output;
}

export function filterChecklistByStepPrefix(checklist: GuideChecklist, prefix: string): GuideChecklist {
  return {
    ...checklist,
    items: checklist.items.filter((item) => item.id.startsWith(prefix)),
  };
}

export function summarizeChecklist(checklist: GuideChecklist): {
  steps: number;
  evidenceLines: number;
  notes: number;
} {
  let evidenceLines = 0;
  let notes = 0;

  for (const item of checklist.items) {
    evidenceLines += item.evidence.length;
    notes += item.notes.length;
  }

  return {
    steps: checklist.items.length,
    evidenceLines,
    notes,
  };
}
