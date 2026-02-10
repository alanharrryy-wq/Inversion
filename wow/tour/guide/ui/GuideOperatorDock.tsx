import React from 'react';
import type { GuideEvidenceResolution } from '../types';

type Props = {
  open: boolean;
  onToggle: () => void;
  notes: string[];
  nextTease?: string;
  nextStepTitle?: string;
  blockedReasons: string[];
  missingEvidence: GuideEvidenceResolution[];
};

export function GuideOperatorDock({
  open,
  onToggle,
  notes,
  nextTease,
  nextStepTitle,
  blockedReasons,
  missingEvidence,
}: Props) {
  return (
    <aside className={`wow-guide-ops ${open ? 'wow-guide-ops--open' : ''}`} data-testid="guide-operator-panel">
      <button type="button" className="wow-guide-ops__toggle" onClick={onToggle}>
        {open ? 'Operator Panel On' : 'Operator Panel Off'}
      </button>

      {open ? (
        <div className="wow-guide-ops__panel">
          <div className="wow-guide-ops__section">
            <div className="wow-guide-ops__label">Presenter Notes</div>
            <ul className="wow-guide-ops__list">
              {(notes.length > 0 ? notes : ['State evidence before claim.']).map((note, index) => (
                <li key={`${index}-${note}`}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="wow-guide-ops__section">
            <div className="wow-guide-ops__label">Next Tease</div>
            <div className="wow-guide-ops__block">{nextTease ?? 'No tease configured.'}</div>
          </div>

          <div className="wow-guide-ops__section">
            <div className="wow-guide-ops__label">Next Step</div>
            <div className="wow-guide-ops__block">{nextStepTitle ?? 'Final step reached.'}</div>
          </div>

          <div className="wow-guide-ops__section">
            <div className="wow-guide-ops__label">Blocked Reasons</div>
            {blockedReasons.length > 0 ? (
              <ul className="wow-guide-ops__list">
                {blockedReasons.map((reason, index) => (
                  <li key={`${index}-${reason}`}>{reason}</li>
                ))}
              </ul>
            ) : (
              <div className="wow-guide-ops__block wow-guide-ops__block--ok">No blockers. Ready for next.</div>
            )}
          </div>

          <div className="wow-guide-ops__section">
            <div className="wow-guide-ops__label">Missing Evidence</div>
            {missingEvidence.length > 0 ? (
              <ul className="wow-guide-ops__list">
                {missingEvidence.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            ) : (
              <div className="wow-guide-ops__block wow-guide-ops__block--ok">Evidence complete.</div>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
