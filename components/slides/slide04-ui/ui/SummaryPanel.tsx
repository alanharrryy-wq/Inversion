import React from "react";
import { LockPhase, SummaryOutput } from "../core";

type SummaryPanelProps = {
  phase: LockPhase;
  routeLabel: string;
  summary: SummaryOutput | null;
  sourceMix: string;
  replayJson: string;
  replayStatus: string;
  replayLastError: string | null;
  replayLastHash: string | null;
  onReplayJsonChange: (value: string) => void;
  onReplayCopy: () => void;
  onReplayPlayback: () => void;
  onUnseal: () => void;
};

function formatPhaseLabel(phase: LockPhase): string {
  if (phase === "idle") {
    return "idle";
  }
  if (phase === "arming") {
    return "arming";
  }
  if (phase === "locking") {
    return "locking";
  }
  return "sealed";
}

export function SummaryPanel(props: SummaryPanelProps) {
  const summary = props.summary;

  return (
    <section className="s04-panel s04-summary" data-testid="s04-summary-panel">
      <header className="s04-panel-header">
        <h3 className="s04-panel-title">Lock Summary + Handoff</h3>
        <span className="s04-chip" data-tone={props.phase === "sealed" ? "good" : "warn"} data-testid="s04-summary-phase">
          {formatPhaseLabel(props.phase)}
        </span>
      </header>

      <div className="s04-panel-body s04-summary-scroll">
        <div className="s04-kv-row">
          <p className="s04-kv-key">route</p>
          <p className="s04-kv-value" data-testid="s04-summary-route">
            {props.routeLabel}
          </p>
        </div>

        <div className="s04-kv-row">
          <p className="s04-kv-key">constraint digest</p>
          <p className="s04-kv-value" data-testid="s04-summary-constraints">
            {summary
              ? `${summary.constraintDigest.satisfiedWeight} satisfied / ${summary.constraintDigest.atRiskWeight} at-risk / ${summary.constraintDigest.blockedWeight} blocked`
              : "No sealed digest yet."}
          </p>
        </div>

        <div className="s04-kv-row">
          <p className="s04-kv-key">evidence digest</p>
          <p className="s04-kv-value" data-testid="s04-summary-evidence">
            {summary
              ? `${summary.evidenceDigest.items.length} selected | avg confidence ${summary.evidenceDigest.averageConfidence}`
              : "No sealed digest yet."}
          </p>
        </div>

        <div className="s04-kv-row">
          <p className="s04-kv-key">source mix</p>
          <p className="s04-kv-value">{summary ? props.sourceMix : "none"}</p>
        </div>

        {summary ? (
          <>
            <div className="s04-metric-grid">
              <article className="s04-metric">
                <p className="s04-metric-label">route score</p>
                <p className="s04-metric-value">{summary.decision.routeScore}</p>
              </article>

              <article className="s04-metric">
                <p className="s04-metric-label">confidence</p>
                <p className="s04-metric-value">{summary.decision.confidenceScore}</p>
              </article>

              <article className="s04-metric">
                <p className="s04-metric-label">hold ms</p>
                <p className="s04-metric-value">{summary.seal.holdMs}</p>
              </article>
            </div>

            <div className="s04-seal-output" data-testid="s04-seal-output">
              <p className="s04-seal-code" data-testid="s04-seal-hash">
                hash: {summary.seal.hash}
              </p>
              <p className="s04-seal-code" data-testid="s04-seal-signature">
                signature: {summary.seal.signature}
              </p>
              <p className="s04-seal-code">decision: {summary.decision.narrative}</p>
            </div>
          </>
        ) : (
          <div className="s04-seal-output" data-testid="s04-seal-output">
            <p className="s04-seal-code">Seal output appears after deliberate hold + release.</p>
          </div>
        )}

        <div className="s04-replay-zone">
          <p className="s04-kv-key">replay trace json</p>
          <textarea
            className="s04-replay-textarea"
            data-testid="s04-replay-json"
            value={props.replayJson}
            onChange={(event) => props.onReplayJsonChange(event.target.value)}
            spellCheck={false}
            aria-label="Replay JSON"
          />

          <div className="s04-replay-actions">
            <button type="button" className="s04-btn" data-testid="s04-replay-copy" onClick={props.onReplayCopy}>
              copy json
            </button>
            <button
              type="button"
              className="s04-btn"
              data-variant="primary"
              data-testid="s04-replay-playback"
              onClick={props.onReplayPlayback}
            >
              playback
            </button>
            <button type="button" className="s04-btn" data-testid="s04-seal-unseal" onClick={props.onUnseal}>
              unseal for edit
            </button>
          </div>

          <p className="s04-seal-status" data-testid="s04-replay-status">
            replay: {props.replayStatus}
            {props.replayLastError ? ` | ${props.replayLastError}` : ""}
          </p>
          <p className="s04-seal-status" data-testid="s04-replay-last-hash">
            replay hash: {props.replayLastHash ?? "none"}
          </p>
        </div>
      </div>
    </section>
  );
}

export default SummaryPanel;
