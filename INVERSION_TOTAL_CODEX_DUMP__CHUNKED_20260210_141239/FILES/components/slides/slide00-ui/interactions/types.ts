
export type FirstActionTone = 'neutral' | 'good' | 'warn' | 'danger';

export type FirstActionModel = {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeTone: FirstActionTone;
  enabled: boolean;
  feedback?: string;
  onClick: () => void;
  testId: string;
};

export type StatusStripTone = 'neutral' | 'good' | 'warn' | 'danger';

export type StatusStripItem = {
  key: string;
  label: string;
  value: string;
  tone: StatusStripTone;
  hint?: string;
};

