import React from "react";
import { FIRST_PROOF_COPY } from "./firstProof.copy";
import { FirstProofSnapshot } from "./firstProof.types";

export function FirstProofRail(props: {
  snapshot: FirstProofSnapshot;
}) {
  return (
    <section className="slide00-firstproof-rail" aria-label={FIRST_PROOF_COPY.railTitle}>
      <header className="slide00-firstproof-rail-head">
        <p className="slide00-firstproof-kicker">{FIRST_PROOF_COPY.railTitle}</p>
        <p className="slide00-firstproof-rail-subtitle">{FIRST_PROOF_COPY.railSubtitle}</p>
        <p className="slide00-firstproof-hardline">{FIRST_PROOF_COPY.hardLine}</p>
      </header>

      <ol className="slide00-firstproof-step-list">
        {props.snapshot.steps.map((step) => (
          <li
            key={step.key}
            className="slide00-firstproof-step"
            data-status={step.status}
            data-testid={`slide00-firstproof-step-${step.key}`}
          >
            <div className="slide00-firstproof-step-head">
              <p className="slide00-firstproof-step-label">
                {FIRST_PROOF_COPY.steps[step.key].label}
              </p>
              <p className="slide00-firstproof-step-progress">{Math.round(step.progress * 100)}%</p>
            </div>
            <p className="slide00-firstproof-step-detail">{FIRST_PROOF_COPY.steps[step.key].detail}</p>
            <div className="slide00-firstproof-step-track" aria-hidden="true">
              <span
                className="slide00-firstproof-step-fill"
                style={{ transform: `scaleX(${step.progress})` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
