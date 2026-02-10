import React from 'react';

type Props = {
  scriptTitle: string;
  stepTitle: string;
  progressLabel: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
};

function statusLabel(status: Props['status']): string {
  if (status === 'completed') return 'Complete';
  if (status === 'running') return 'Running';
  if (status === 'paused') return 'Paused';
  return 'Idle';
}

export function GuideProgressHeader({ scriptTitle, stepTitle, progressLabel, status }: Props) {
  return (
    <header className="wow-guide-shell__header" data-testid="guide-progress-header">
      <div className="wow-guide-shell__meta">
        <span className="wow-guide-shell__script">{scriptTitle}</span>
        <span className={`wow-guide-shell__status wow-guide-shell__status--${status}`}>{statusLabel(status)}</span>
      </div>
      <h4 className="wow-guide-shell__title">{stepTitle}</h4>
      <div className="wow-guide-shell__progress">{progressLabel}</div>
    </header>
  );
}
