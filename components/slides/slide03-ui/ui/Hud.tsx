import React from "react";
import { Slide03ProgressViewModel } from "../core/fsm/selectors";

interface HudProps {
  visible: boolean;
  progress: Slide03ProgressViewModel;
  replayCount: number;
}

export const Hud: React.FC<HudProps> = ({ visible, progress, replayCount }) => {
  if (!visible) return null;

  return (
    <section className="slide03-panel" data-testid="slide03-hud">
      <div className="slide03-hud">
        <div className="slide03-hud-grid">
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">FSM Stage</span>
            <span className="slide03-hud-value" data-testid="slide03-hud-stage">
              {progress.stage}
            </span>
          </div>
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">Next Expected</span>
            <span className="slide03-hud-value">{progress.nextExpected ?? "none"}</span>
          </div>
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">Confidence</span>
            <span className="slide03-hud-value" data-testid="slide03-hud-score">
              {progress.confidence}
            </span>
          </div>
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">Uncertainty</span>
            <span className="slide03-hud-value" data-testid="slide03-hud-uncertainty">
              {progress.uncertainty}
            </span>
          </div>
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">Seal</span>
            <span className="slide03-hud-value">{progress.sealLevel}</span>
          </div>
          <div className="slide03-hud-cell">
            <span className="slide03-hud-label">Replay Log</span>
            <span className="slide03-hud-value" data-testid="slide03-hud-replay">
              {replayCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
