import React from 'react';
import type { GuideEvidenceResolution } from '../types';

type Props = {
  blockedReasons: string[];
  missingEvidence: GuideEvidenceResolution[];
  satisfiedEvidence: GuideEvidenceResolution[];
};

function renderEvidence(item: GuideEvidenceResolution, tone: 'missing' | 'ok') {
  return (
    <li key={item.id} className={`wow-guide-evidence__item wow-guide-evidence__item--${tone}`} data-source={item.sourceType}>
      <div className="wow-guide-evidence__label">{item.label}</div>
      <div className="wow-guide-evidence__hint">{item.hint}</div>
      <div className="wow-guide-evidence__trace">Expected: {item.expected}</div>
      <div className="wow-guide-evidence__trace">Observed: {item.observed}</div>
    </li>
  );
}

export function GuideEvidenceList({ blockedReasons, missingEvidence, satisfiedEvidence }: Props) {
  const hasMissing = missingEvidence.length > 0;

  return (
    <section className="wow-guide-evidence" data-testid="guide-evidence-list">
      <div className="wow-guide-evidence__head">
        <span className="wow-guide-evidence__title">Evidence Checklist</span>
        <span className={`wow-guide-evidence__counter ${hasMissing ? 'wow-guide-evidence__counter--blocked' : 'wow-guide-evidence__counter--ok'}`}>
          {hasMissing ? `${missingEvidence.length} blocking` : 'all clear'}
        </span>
      </div>

      {blockedReasons.length > 0 ? (
        <ul className="wow-guide-evidence__reasons">
          {blockedReasons.map((reason, index) => (
            <li key={`${index}-${reason}`}>{reason}</li>
          ))}
        </ul>
      ) : (
        <div className="wow-guide-evidence__clear">Completion rule satisfied. Ready to advance.</div>
      )}

      {missingEvidence.length > 0 ? (
        <div className="wow-guide-evidence__group">
          <div className="wow-guide-evidence__group-title">Missing evidence</div>
          <ul className="wow-guide-evidence__list">{missingEvidence.map((item) => renderEvidence(item, 'missing'))}</ul>
        </div>
      ) : null}

      {satisfiedEvidence.length > 0 ? (
        <div className="wow-guide-evidence__group">
          <div className="wow-guide-evidence__group-title">Satisfied evidence</div>
          <ul className="wow-guide-evidence__list">{satisfiedEvidence.map((item) => renderEvidence(item, 'ok'))}</ul>
        </div>
      ) : null}
    </section>
  );
}
