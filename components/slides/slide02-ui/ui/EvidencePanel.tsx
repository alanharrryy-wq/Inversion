import React from "react";
import {
  Slide02EvidenceViewModel,
  statusLabel,
  toneClass,
} from "../core/selectors";
import { Slide02MachineState } from "../core/types";

type EvidencePanelProps = {
  evidence: Slide02EvidenceViewModel;
  signature: string;
  status: Slide02MachineState["status"];
};

const rowTestIdMap: Record<string, string> = {
  route: "slide02-evidence-row-route",
  fit: "slide02-evidence-row-fit",
  capacity: "slide02-evidence-row-capacity",
  latency: "slide02-evidence-row-latency",
  verdict: "slide02-evidence-row-verdict",
};

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence, signature, status }) => {
  return (
    <section data-testid="slide02-evidence-panel" className="slide02-panel slide02-panel--evidence">
      <div className="slide02-panel__header slide02-panel__header--stack">
        <div>
          <h3 className="slide02-panel__title">System Response</h3>
          <p className="slide02-panel__subtitle">
            Deterministic outputs computed directly from route + constraints.
          </p>
        </div>

        <div className="slide02-chip-row">
          <span
            data-testid="slide02-decision-chip"
            className={`slide02-chip ${toneClass(evidence.decisionBadge.tone)}`}
          >
            {evidence.decisionBadge.label}
          </span>
          <span
            data-testid="slide02-operability-band"
            className={`slide02-chip ${toneClass(evidence.bandBadge.tone)}`}
          >
            {evidence.bandBadge.label}
          </span>
          <span className="slide02-chip slide02-tone-neutral">{statusLabel(status)}</span>
        </div>
      </div>

      <div className="slide02-score-grid">
        {evidence.cards.map((card) => {
          const valueTestId =
            card.key === "readiness"
              ? "slide02-readiness-value"
              : card.key === "continuity"
              ? "slide02-continuity-value"
              : "slide02-risk-value";

          return (
            <article key={card.key} className={`slide02-score-card ${toneClass(card.tone)}`}>
              <div className="slide02-score-card__label">{card.label}</div>
              <div data-testid={valueTestId} className="slide02-score-card__value">
                {card.value}
              </div>
              <div className="slide02-score-card__detail">{card.detail}</div>
            </article>
          );
        })}
      </div>

      <div className="slide02-evidence-table">
        {evidence.rows.map((row) => (
          <article
            key={row.key}
            data-testid={rowTestIdMap[row.key]}
            className={`slide02-evidence-row ${toneClass(row.status)}`}
          >
            <div className="slide02-evidence-row__top">
              <div className="slide02-evidence-row__label">{row.label}</div>
              <div className="slide02-evidence-row__value">{row.value}</div>
            </div>
            <p className="slide02-evidence-row__rationale">{row.rationale}</p>
          </article>
        ))}
      </div>

      <div className="slide02-signature-line">
        <span className="slide02-signature-line__label">signature</span>
        <span data-testid="slide02-response-signature" className="slide02-signature-line__value">
          {signature}
        </span>
      </div>
    </section>
  );
};
