import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
};

export function GuideHeader({ title, subtitle, stepIndex, totalSteps }: Props) {
  return (
    <div className="wow-guide-header">
      {subtitle ? <div className="wow-guide-header__subtitle">{subtitle}</div> : null}
      <div className="wow-guide-header__title">{title}</div>
      <div className="wow-guide-header__progress">Step {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}</div>
    </div>
  );
}
