import { GuideScript } from './script.types';

export const sampleGuideScript: GuideScript = {
  id: 'interactive-sample',
  title: 'Interactive AI Guided Demo',
  description: 'Evidence-first walkthrough with explicit user actions and validations.',
  steps: [
    {
      id: 'enter-slide',
      title: 'Confirm slide context',
      body: 'Navigate to the target slide and verify the shell loaded.',
      completion: { type: 'event', name: 'slide:entered', where: { slide: 5 } },
      tease: 'Next we capture the first interaction evidence.',
    },
    {
      id: 'module-hover',
      title: 'Explore module card',
      body: 'Hover any module to reveal the protocol detail.',
      completion: { type: 'event', name: 'slide05:module-hover', count: 1 },
      prerequisites: ['enter-slide'],
      tease: 'Click a module to commit evidence.',
    },
    {
      id: 'module-click',
      title: 'Commit module evidence',
      body: 'Click one module card to register deterministic evidence.',
      completion: { type: 'event', name: 'slide05:module-click', count: 1 },
      prerequisites: ['module-hover'],
      tease: 'Use AI guidance prompt in-context.',
    },
    {
      id: 'guidance-open',
      title: 'Open AI guidance context',
      body: 'Trigger the local guidance hint panel from the overlay.',
      completion: { type: 'event', name: 'guide:hint-opened', count: 1 },
      prerequisites: ['module-click'],
    },
    {
      id: 'ask-question',
      title: 'Paste guided question',
      body: 'Use the deterministic question prompt and submit in chat.',
      completion: { type: 'event', name: 'guide:question-pasted', count: 1 },
      prerequisites: ['guidance-open'],
      tease: 'Now validate completion with explicit operator action.',
    },
    {
      id: 'operator-confirm',
      title: 'Operator confirmation',
      body: 'Presenter confirms outcome with explicit confirmation event.',
      completion: { type: 'event', name: 'guide:operator-confirm', count: 1 },
      prerequisites: ['ask-question'],
    },
  ],
};
