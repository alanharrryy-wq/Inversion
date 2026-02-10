import React from 'react';

type Props = {
  active: boolean;
};

export function GuidePulse({ active }: Props) {
  if (!active) return null;
  return <div className="wow-guide-pulse" aria-hidden="true" />;
}
