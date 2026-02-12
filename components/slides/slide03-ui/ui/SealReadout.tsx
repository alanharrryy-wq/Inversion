import React from "react";
import { Slide03ProgressViewModel } from "../core/fsm/selectors";

interface SealReadoutProps {
  progress: Slide03ProgressViewModel;
  canCommitSeal: boolean;
  onCommitSeal: () => void;
  onReset: () => void;
}

const toneFromLevel = (level: string): "good" | "warn" | "bad" => {
  if (level === "sealed") return "good";
  if (level === "forming") return "warn";
  return "bad";
};

export const SealReadout: React.FC<SealReadoutProps> = ({
  progress,
  canCommitSeal,
  onCommitSeal,
  onReset,
}) => {
  const tone = toneFromLevel(progress.sealLevel);
  return (
    <section className="slide03-panel" data-testid="slide03-seal-readout">
      <div className="slide03-seal">
        <header className="slide03-seal-header">
          <h3 className="slide03-seal-title">Confidence Seal</h3>
          <span
            className="slide03-seal-level"
            data-level={progress.sealLevel}
            data-testid="slide03-seal-level"
          >
            {progress.sealLevel}
          </span>
        </header>

        <div className="slide03-seal-grid">
          <div className="slide03-seal-kv">
            <span className="slide03-seal-k">Route</span>
            <span className="slide03-seal-v" data-testid="slide03-seal-route">
              {progress.routeLabel}
            </span>
          </div>
          <div className="slide03-seal-kv">
            <span className="slide03-seal-k">Confidence</span>
            <span className="slide03-seal-v" data-testid="slide03-confidence-score">
              {progress.confidence}
            </span>
          </div>
          <div className="slide03-seal-kv">
            <span className="slide03-seal-k">Uncertainty</span>
            <span className="slide03-seal-v" data-testid="slide03-uncertainty-score">
              {progress.uncertainty}
            </span>
          </div>
          <div className="slide03-seal-kv">
            <span className="slide03-seal-k">Band</span>
            <span className="slide03-seal-v" data-testid="slide03-seal-band">
              {progress.sealBand}
            </span>
          </div>
          <div className="slide03-seal-kv">
            <span className="slide03-seal-k">Grade</span>
            <span className="slide03-seal-v" data-testid="slide03-seal-grade">
              {progress.sealGrade}
            </span>
          </div>
        </div>

        <div className="slide03-seal-actions">
          <button
            type="button"
            className="slide03-btn"
            disabled={!canCommitSeal}
            onClick={onCommitSeal}
            data-testid="slide03-seal-commit"
          >
            commit seal
          </button>
          <button
            type="button"
            className="slide03-btn slide03-btn--warn"
            onClick={onReset}
            data-testid="slide03-reset"
          >
            reset session
          </button>
          <span className="slide03-mini-chip" data-tone={tone}>
            {progress.revealedCount}/3 revealed
          </span>
        </div>
      </div>
    </section>
  );
};
