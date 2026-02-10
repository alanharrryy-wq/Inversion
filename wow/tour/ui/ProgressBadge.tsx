import React from 'react';

type Props = {
  current: number;
  total: number;
  className?: string;
};

export function ProgressBadge({ current, total, className = '' }: Props) {
  return (
    <div className={`wow-tour-progress-badge ${className}`.trim()}>
      <span>{Math.min(current, total)}</span>
      <span aria-hidden="true">/</span>
      <span>{total}</span>
    </div>
  );
}
