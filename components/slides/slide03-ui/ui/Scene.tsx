import React from "react";
import { parseReplayJsonDraft, useSlide03Engine } from "../hooks/useSlide03Engine";
import { EvidenceCard } from "./EvidenceCard";
import { Hud } from "./Hud";
import { SealReadout } from "./SealReadout";
import "./slide03-ui.css";

const toneForSeal = (sealLevel: string): "good" | "warn" | "bad" => {
  if (sealLevel === "sealed") return "good";
  if (sealLevel === "forming") return "warn";
  return "bad";
};

export const Scene: React.FC = () => {
  const engine = useSlide03Engine();
  const parseMessage = parseReplayJsonDraft(engine.replayJson);
  const sealTone = toneForSeal(engine.progress.sealLevel);
  const devEnabledCardId = engine.cards.find((card) => card.enabled)?.stepId ?? "none";
  const devCanInteract = engine.cards
    .map((card) => `${card.stepId}:${card.enabled && !card.revealed && !card.locked ? "1" : "0"}`)
    .join(",");
  const devLastEvent = `${engine.state.lastActionType}:${engine.state.lastActionReason}:${engine.state.lastAccepted ? "accepted" : "rejected"}`;

  return (
    <section className="slide03-scene" data-testid="slide03-scene">
      <input type="hidden" data-testid="slide03-contract-version" value={engine.state.contractVersion} />

      <div className="slide03-topline">
        <div className="slide03-topline-left">
          <span className="slide03-mini-chip" data-testid="slide03-stage-chip">
            stage {engine.progress.stage}
          </span>
          <span className="slide03-mini-chip" data-testid="slide03-next-step-chip">
            next {engine.progress.nextExpected ?? "none"}
          </span>
          <span className="slide03-mini-chip" data-testid="slide03-revealed-count">
            revealed {engine.progress.revealedCount}/3
          </span>
          <span className="slide03-mini-chip" data-tone={sealTone}>
            seal {engine.progress.sealLevel}
          </span>
        </div>

        <div className="slide03-topline-right">
          <span className="slide03-mini-chip" data-testid="slide03-replay-count">
            replay actions {engine.replayReadout.count}
          </span>
          <button
            type="button"
            className="slide03-btn"
            onClick={engine.toggleHud}
            data-testid="slide03-hud-toggle"
          >
            {engine.hudVisible ? "hide hud" : "show hud"}
          </button>
        </div>
      </div>

      {import.meta.env.DEV && (
        <p className="slide03-dev-diagnostics" data-testid="slide03-dev-diagnostics">
          enabled {devEnabledCardId} | canInteract {devCanInteract} | last {devLastEvent}
        </p>
      )}

      <div className="slide03-grid">
        <div className="slide03-cards">
          {engine.cards.map((card) => (
            <EvidenceCard
              key={card.stepId}
              card={card}
              onPointerStart={engine.pointerStart}
              onPointerFrame={engine.pointerFrame}
              onPointerEnd={engine.pointerEnd}
              onPointerCancel={engine.pointerCancel}
              onConfirmStep={engine.confirmStep}
            />
          ))}
        </div>

        <div className="slide03-side">
          <SealReadout
            progress={engine.progress}
            canCommitSeal={engine.canCommitSeal}
            onCommitSeal={engine.commitSeal}
            onReset={() => engine.resetSession("manual-reset")}
          />

          <Hud
            visible={engine.hudVisible}
            progress={engine.progress}
            replayCount={engine.replayReadout.count}
          />

          <section className="slide03-panel">
            <div className="slide03-replay">
              <div className="slide03-row">
                <button
                  type="button"
                  className="slide03-btn"
                  onClick={engine.buildReplayJson}
                  data-testid="slide03-replay-build"
                >
                  build replay
                </button>
                <button
                  type="button"
                  className="slide03-btn"
                  onClick={engine.playReplayFromState}
                  data-testid="slide03-replay-play"
                >
                  play captured
                </button>
                <button
                  type="button"
                  className="slide03-btn"
                  onClick={engine.playReplayFromJson}
                  data-testid="slide03-replay-load"
                >
                  load json
                </button>
                <button
                  type="button"
                  className="slide03-btn"
                  onClick={() => {
                    if (!engine.replayJson.trim()) {
                      return;
                    }
                    navigator.clipboard?.writeText(engine.replayJson).catch(() => {});
                  }}
                  data-testid="slide03-replay-copy"
                >
                  copy json
                </button>
              </div>

              <textarea
                value={engine.replayJson}
                onChange={(event) => engine.setReplayJson(event.target.value)}
                data-testid="slide03-replay-textarea"
                aria-label="Slide03 replay json"
              />

              <p
                className="slide03-status"
                data-tone={engine.replayLoadError ? "error" : "ok"}
                data-testid="slide03-replay-last-result"
              >
                {engine.replayLoadError || engine.replayLastMessage}
              </p>

              <p className="slide03-status">{parseMessage}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};
