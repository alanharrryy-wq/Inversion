import React, { useMemo } from 'react';

type Props = {
  enabled: boolean;
  scriptTitle: string;
  stepIndex: number;
  totalSteps: number;
  notes?: string[];
  nextTease?: string;
  onToggle: () => void;
};

export function DirectorOverlay(props: Props) {
  const { enabled, scriptTitle, stepIndex, totalSteps, notes, nextTease, onToggle } = props;

  const safeNotes = useMemo(() => (notes && notes.length > 0 ? notes : ['Say this now: Lead with evidence before claims.']), [notes]);

  return (
    <aside className={`wow-tour-director ${enabled ? 'wow-tour-director--open' : ''}`}>
      <button type="button" className="wow-tour-director__toggle" onClick={onToggle}>
        {enabled ? 'Director On' : 'Director Off'}
      </button>

      {enabled && (
        <div className="wow-tour-director__panel">
          <div className="wow-tour-director__label">Director Mode</div>
          <div className="wow-tour-director__script">{scriptTitle}</div>
          <div className="wow-tour-director__step">Step {stepIndex + 1}/{totalSteps}</div>
          <ul className="wow-tour-director__list">
            {safeNotes.map((note, idx) => (
              <li key={`${idx}-${note}`}>{note}</li>
            ))}
          </ul>
          {nextTease ? <p className="wow-tour-director__tease">Next cue: {nextTease}</p> : null}
        </div>
      )}
    </aside>
  );
}
