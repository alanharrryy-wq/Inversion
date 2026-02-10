import React from "react";
import {
  FIRST_PROOF_COPY,
  getFirstProofCanonicalLine,
  getFirstProofStatusCopy,
  getFirstProofStatusDetailCopy,
} from "./firstProof.copy";
import { FirstProofCanonicalProfile, FirstProofSnapshot } from "./firstProof.types";

export function RightSeal(props: {
  snapshot: FirstProofSnapshot;
  profile?: FirstProofCanonicalProfile;
}) {
  const profile = props.profile ?? "legacy";
  const canonicalLine = getFirstProofCanonicalLine(profile);
  const stateCopy = getFirstProofStatusCopy(props.snapshot.sealStatus);
  const detailCopy = getFirstProofStatusDetailCopy(props.snapshot.sealStatus);
  const collapsed = props.snapshot.completed;

  return (
    <section
      className="slide00-rightseal"
      data-collapsed={collapsed}
      data-sealed={props.snapshot.completed}
      data-testid="slide00-rightseal"
      aria-live="polite"
    >
      <header className="slide00-rightseal-head">
        <p className="slide00-rightseal-badge-label">{FIRST_PROOF_COPY.seal.title}</p>
        <p className="slide00-rightseal-progress-label">
          {FIRST_PROOF_COPY.seal.tinyProgressLabel} {Math.round(props.snapshot.totalProgress * 100)}%
        </p>
      </header>

      <div className="slide00-rightseal-main">
        <p className="slide00-rightseal-judge-label">{FIRST_PROOF_COPY.seal.stateLabel}</p>
        <p className="slide00-rightseal-state" data-testid="slide00-rightseal-state">
          {stateCopy}
        </p>
        <p className="slide00-rightseal-detail">{detailCopy}</p>
      </div>

      <div className="slide00-rightseal-progress" role="presentation" aria-hidden="true">
        <span
          className="slide00-rightseal-progress-fill"
          style={{ transform: `scaleX(${props.snapshot.totalProgress})` }}
        />
      </div>

      {collapsed ? (
        <div className="slide00-rightseal-collapsed-body">
          <p className="slide00-rightseal-canonical">{canonicalLine}</p>
          <p className="slide00-rightseal-compact-copy">{FIRST_PROOF_COPY.canonical.opening}</p>
        </div>
      ) : (
        <p className="slide00-rightseal-preseal-copy">{FIRST_PROOF_COPY.seal.preSealCopy}</p>
      )}
    </section>
  );
}
