import React from "react";

type ReplayPanelProps = {
  replayJson: string;
  replayError: string | null;
  canApply: boolean;
  onReplayJsonChange: (value: string) => void;
  onExportReplay: () => void;
  onStageReplay: () => void;
  onApplyReplay: () => void;
  onClearReplay: () => void;
};

export const ReplayPanel: React.FC<ReplayPanelProps> = ({
  replayJson,
  replayError,
  canApply,
  onReplayJsonChange,
  onExportReplay,
  onStageReplay,
  onApplyReplay,
  onClearReplay,
}) => {
  return (
    <section data-testid="slide02-replay-panel" className="slide02-panel slide02-panel--replay">
      <div className="slide02-panel__header slide02-panel__header--stack">
        <div>
          <h3 className="slide02-panel__title">Replay Capture</h3>
          <p className="slide02-panel__subtitle">
            Capture deterministic route/constraint changes, stage JSON, and replay outputs.
          </p>
        </div>
      </div>

      <div className="slide02-replay-actions">
        <button
          type="button"
          className="slide02-btn slide02-btn--ghost"
          data-testid="slide02-replay-export"
          onClick={onExportReplay}
        >
          Export Replay JSON
        </button>

        <button
          type="button"
          className="slide02-btn slide02-btn--subtle"
          data-testid="slide02-replay-stage"
          onClick={onStageReplay}
        >
          Stage JSON
        </button>

        <button
          type="button"
          className="slide02-btn slide02-btn--primary"
          data-testid="slide02-replay-apply"
          onClick={onApplyReplay}
          disabled={!canApply}
        >
          Apply Replay
        </button>

        <button
          type="button"
          className="slide02-btn slide02-btn--subtle"
          data-testid="slide02-replay-clear"
          onClick={onClearReplay}
        >
          Clear Replay
        </button>
      </div>

      <label className="slide02-control-label" htmlFor="slide02-replay-textarea-input">
        Replay JSON
      </label>

      <textarea
        id="slide02-replay-textarea-input"
        data-testid="slide02-replay-textarea"
        className="slide02-replay-textarea"
        value={replayJson}
        onChange={(event) => onReplayJsonChange(event.currentTarget.value)}
        placeholder='{"version":"slide02.replay.v1", ...}'
      />

      {replayError ? (
        <div data-testid="slide02-replay-error" className="slide02-replay-error">
          {replayError}
        </div>
      ) : null}
    </section>
  );
};
