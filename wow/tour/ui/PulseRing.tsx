import React from 'react';

type Props = {
  active?: boolean;
  className?: string;
  intensity?: 'soft' | 'strong';
};

export function PulseRing({ active = true, className = '', intensity = 'soft' }: Props) {
  if (!active) return null;
  return <span aria-hidden="true" className={`wow-tour-pulse-ring wow-tour-pulse-ring--${intensity} ${className}`.trim()} />;
}
