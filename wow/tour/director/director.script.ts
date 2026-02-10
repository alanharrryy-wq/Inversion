import { DirectorStepScript } from './director.types';

export const DEFAULT_DIRECTOR_SCRIPT: DirectorStepScript = {
  stepId: 'default',
  callouts: [
    { id: 'pace', label: 'Pace', detail: 'Pause for one beat after each success cue.' },
    { id: 'evidence', label: 'Proof', detail: 'Anchor every claim to visible UI evidence.' },
  ],
  highlightLines: [
    { id: 'line-1', label: 'What you see here is deterministic and auditable.' },
    { id: 'line-2', label: 'Next, we move from validation to deployment confidence.' },
  ],
};
