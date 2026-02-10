import React from 'react';

type Props = {
  open: boolean;
  onToggle: () => void;
  notes: string[];
};

export function GuideOperatorPanel({ open, onToggle, notes }: Props) {
  return (
    <aside className={`wow-guide-operator ${open ? 'wow-guide-operator--open' : ''}`}>
      <button type="button" className="wow-guide-operator__toggle" onClick={onToggle}>
        {open ? 'Operator Panel On' : 'Operator Panel Off'}
      </button>
      {open && (
        <div className="wow-guide-operator__panel">
          <div className="wow-guide-operator__label">Presenter Notes</div>
          <ul>
            {notes.map((note, index) => (
              <li key={`${index}-${note}`}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
