import React from 'react';

type Props = {
  label: string;
  className?: string;
  direction?: 'up' | 'right' | 'down' | 'left';
};

const glyphByDirection: Record<NonNullable<Props['direction']>, string> = {
  up: '↑',
  right: '→',
  down: '↓',
  left: '←',
};

export function ArrowHint({ label, className = '', direction = 'right' }: Props) {
  return (
    <div className={`wow-tour-arrow-hint ${className}`.trim()}>
      <span className="wow-tour-arrow-hint__glyph" aria-hidden="true">{glyphByDirection[direction]}</span>
      <span className="wow-tour-arrow-hint__label">{label}</span>
    </div>
  );
}
