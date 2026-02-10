import React from 'react';
import { DEFAULT_DIRECTOR_SCRIPT } from './director.script';
import { DirectorStepScript } from './director.types';

type Props = {
  enabled: boolean;
  scriptTitle: string;
  stepIndex: number;
  totalSteps: number;
  operatorScript?: DirectorStepScript;
  onToggle: () => void;
};

export function DirectorOverlay(props: Props) {
  const { enabled, scriptTitle, stepIndex, totalSteps, operatorScript, onToggle } = props;
  const script = operatorScript ?? DEFAULT_DIRECTOR_SCRIPT;

  return (
    <aside className={`wow-tour-director-ops ${enabled ? 'wow-tour-director-ops--open' : ''}`}>
      <button type="button" className="wow-tour-director-ops__toggle" onClick={onToggle}>
        {enabled ? 'Operator On' : 'Operator Off'}
      </button>
      {enabled && (
        <div className="wow-tour-director-ops__panel wow-tour-motion-enter">
          <div className="wow-tour-director-ops__title">{scriptTitle}</div>
          <div className="wow-tour-director-ops__step">Step {stepIndex + 1}/{totalSteps}</div>
          <div className="wow-tour-director-ops__section">Callouts</div>
          <ul className="wow-tour-director-ops__list">
            {script.callouts.map((item) => (
              <li key={item.id}><strong>{item.label}:</strong> {item.detail}</li>
            ))}
          </ul>
          <div className="wow-tour-director-ops__section">Highlight lines</div>
          <ul className="wow-tour-director-ops__list">
            {script.highlightLines.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
