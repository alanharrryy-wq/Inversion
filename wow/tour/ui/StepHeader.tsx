import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  phaseLabel?: string;
  className?: string;
};

export function StepHeader({ title, subtitle, phaseLabel, className = '' }: Props) {
  return (
    <div className={`wow-tour-step-header ${className}`.trim()}>
      {subtitle ? <div className="wow-tour-step-header__subtitle">{subtitle}</div> : null}
      <h4 className="wow-tour-step-header__title">{title}</h4>
      {phaseLabel ? <div className="wow-tour-step-header__phase">Phase: {phaseLabel}</div> : null}
    </div>
  );
}
