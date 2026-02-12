import React, { useMemo, useState } from "react";
import {
  CONSTRAINT_REGISTRY,
  EVIDENCE_REGISTRY,
  ROUTE_REGISTRY,
  createConstraintStateLabel,
  createReplayScenario,
  createReplaySeed,
} from "../core/constants";
import {
  actionToReplayEvent,
  applyReplayJson,
  buildReplayTrace,
  createReplayTraceCapture,
  decodeReplayTrace,
  encodeReplayTrace,
} from "../core/replay";
import {
  createInitialLockState,
  createLockSelectors,
  reduceLockMachine,
  selectHoldPercent,
} from "../core/fsm";
import { createSummaryPreviewLine, summarizeSourceMix } from "../core/summary";
import {
  ConstraintId,
  ConstraintState,
  EvidenceId,
  LockAction,
  LockMachineState,
  TraceCapture,
} from "../core/types";
import { Hud } from "./Hud";
import { SealAction } from "./SealAction";
import { SummaryPanel } from "./SummaryPanel";
import "../slide04-ui.css";

function isHudEnabledByQuery(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("slide04Hud") === "1";
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") {
    return false;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function buildStatusMessage(state: LockMachineState): string {
  if (state.phase === "idle") {
    return "Select a route to enter arming phase.";
  }

  if (state.phase === "arming") {
    if (state.lastGuardFailure) {
      return state.lastGuardFailure.message;
    }
    return "Hold and release the lock action to seal the handoff.";
  }

  if (state.phase === "locking") {
    return "Hold steady until progress reaches 100%.";
  }

  if (state.sealedSummary) {
    return `Sealed ${state.sealedSummary.seal.signature}.`;
  }

  return "Sealed.";
}

function renderConstraintTone(state: ConstraintState): "good" | "warn" | "bad" {
  if (state === "satisfied") {
    return "good";
  }
  if (state === "at-risk") {
    return "warn";
  }
  return "bad";
}

function toNowMs() {
  if (typeof performance !== "undefined") {
    return performance.now();
  }
  return Date.now();
}

export type SceneProps = {
  showHud?: boolean;
};

export function Scene(props: SceneProps) {
  const [state, setState] = useState<LockMachineState>(() => createInitialLockState());
  const [traceCapture, setTraceCapture] = useState(() =>
    createReplayTraceCapture(createReplaySeed(null), createReplayScenario(null))
  );
  const [replayJson, setReplayJson] = useState<string>(() =>
    encodeReplayTrace(
      buildReplayTrace(createReplayTraceCapture(createReplaySeed(null), createReplayScenario(null)))
    )
  );

  const selectors = useMemo(() => createLockSelectors(state), [state]);
  const holdProgress = state.hold.progress;
  const holdPercent = selectHoldPercent(state);
  const statusMessage = buildStatusMessage(state);
  const summary = state.sealedSummary;
  const sourceMix = summary ? summarizeSourceMix(summary) : "none";

  const hudVisible = props.showHud ?? isHudEnabledByQuery();

  const dispatchTrackedAction = (action: LockAction) => {
    setState((previous) => reduceLockMachine(previous, action));

    setTraceCapture((previous) => {
      const replayEvent = actionToReplayEvent(action, previous.events.length + 1);
      if (!replayEvent) {
        return previous;
      }

      const nextCapture: TraceCapture = {
        ...previous,
        seed:
          action.type === "route.select"
            ? createReplaySeed(action.routeId)
            : action.type === "route.clear"
            ? createReplaySeed(null)
            : previous.seed,
        scenario:
          action.type === "route.select"
            ? createReplayScenario(action.routeId)
            : action.type === "route.clear"
            ? createReplayScenario(null)
            : previous.scenario,
        events: [...previous.events, replayEvent],
      };

      setReplayJson(encodeReplayTrace(buildReplayTrace(nextCapture)));
      return nextCapture;
    });
  };

  const setConstraintState = (constraintId: ConstraintId, nextState: ConstraintState) => {
    dispatchTrackedAction({
      type: "constraint.set",
      constraintId,
      state: nextState,
      atMs: toNowMs(),
    });
  };

  const toggleEvidence = (evidenceId: EvidenceId) => {
    dispatchTrackedAction({
      type: "evidence.toggle",
      evidenceId,
      atMs: toNowMs(),
    });
  };

  const onReplayCopy = async () => {
    const copied = await copyText(replayJson);
    setState((previous) =>
      reduceLockMachine(
        previous,
        copied
          ? {
              type: "replay.applied",
              hash: previous.sealedSummary?.seal.hash ?? null,
              atMs: 0,
            }
          : {
              type: "replay.failed",
              error: "Clipboard unavailable for replay copy.",
              atMs: 0,
            }
      )
    );
  };

  const onReplayPlayback = () => {
    const decoded = decodeReplayTrace(replayJson);
    if (!decoded.ok) {
      setState((previous) =>
        reduceLockMachine(previous, {
          type: "replay.failed",
          error: decoded.error,
          atMs: 0,
        })
      );
      return;
    }

    const playback = applyReplayJson(replayJson, state);
    setState(playback.state);

    if (!playback.ok) {
      return;
    }

    const nextCapture = {
      seed: decoded.trace.seed,
      scenario: decoded.trace.meta.scenario,
      startedAt: decoded.trace.meta.capturedAt,
      events: decoded.trace.events,
    };

    setTraceCapture(nextCapture);
    setReplayJson(encodeReplayTrace(buildReplayTrace(nextCapture)));
  };

  return (
    <div className="s04-root" data-testid="s04-root">
      <Hud
        visible={hudVisible}
        phase={state.phase}
        traceLength={traceCapture.events.length}
        summaryHash={state.sealedSummary?.seal.hash ?? null}
        holdPercent={`${holdPercent}%`}
      />

      <main className="s04-scene" data-testid="s04-scene">
        <div className="s04-topline">
          <span className="s04-chip">lock-in / handoff surface</span>
          <span
            className="s04-chip"
            data-tone={state.phase === "sealed" ? "good" : state.lastGuardFailure ? "bad" : "warn"}
          >
            {state.phase === "sealed" ? "sealed" : state.phase}
          </span>
        </div>

        <div className="s04-layout">
          <section className="s04-column">
            <div className="s04-stack">
              <section className="s04-panel">
                <header className="s04-panel-header">
                  <h3 className="s04-panel-title">Route Selection</h3>
                  <span className="s04-chip" data-testid="s04-route-current">
                    {selectors.selectedRouteLabel}
                  </span>
                </header>
                <div className="s04-panel-body">
                  <div className="s04-route-grid" data-testid="s04-route-grid">
                    {ROUTE_REGISTRY.map((route) => (
                      <button
                        key={route.id}
                        type="button"
                        className="s04-route-card"
                        data-active={state.selectedRouteId === route.id ? "true" : "false"}
                        data-testid={`s04-route-card-${route.id}`}
                        onClick={() =>
                          dispatchTrackedAction({
                            type: "route.select",
                            routeId: route.id,
                            atMs: toNowMs(),
                          })
                        }
                      >
                        <p className="s04-route-label">{route.label}</p>
                        <p className="s04-route-copy">{route.thesis}</p>
                        <p className="s04-route-meta">owner {route.owner}</p>
                        <p className="s04-route-meta">horizon {route.horizonDays}d</p>
                        <p className="s04-route-meta">handoff {route.handoffTag}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="s04-panel">
                <header className="s04-panel-header">
                  <h3 className="s04-panel-title">Constraint Matrix</h3>
                  <span className="s04-chip">blocked must be zero</span>
                </header>
                <div className="s04-panel-body">
                  <div className="s04-constraint-grid" data-testid="s04-constraint-grid">
                    {CONSTRAINT_REGISTRY.map((constraint) => {
                      const current = state.constraints[constraint.id];

                      return (
                        <article className="s04-constraint-item" key={constraint.id}>
                          <div className="s04-constraint-head">
                            <div>
                              <p className="s04-constraint-title">{constraint.label}</p>
                              <p className="s04-constraint-weight">weight {constraint.weight}</p>
                            </div>
                            <span
                              className="s04-state-pill"
                              data-state={current}
                              data-tone={renderConstraintTone(current)}
                              data-testid={`s04-constraint-${constraint.id}`}
                            >
                              {createConstraintStateLabel(current)}
                            </span>
                          </div>

                          <p className="s04-constraint-note">{constraint.rationale}</p>

                          <div className="s04-constraint-actions">
                            {(["satisfied", "at-risk", "blocked"] as ConstraintState[]).map((value) => (
                              <button
                                key={value}
                                type="button"
                                className="s04-constraint-btn"
                                data-active={current === value ? "true" : "false"}
                                onClick={() => setConstraintState(constraint.id, value)}
                                disabled={state.phase === "sealed"}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="s04-panel">
                <header className="s04-panel-header">
                  <h3 className="s04-panel-title">Evidence Selection</h3>
                  <span className="s04-chip">min two required</span>
                </header>
                <div className="s04-panel-body">
                  <div className="s04-evidence-grid" data-testid="s04-evidence-grid">
                    {EVIDENCE_REGISTRY.map((evidence) => {
                      const active = state.selectedEvidenceIds.includes(evidence.id);
                      return (
                        <button
                          key={evidence.id}
                          type="button"
                          className="s04-evidence-btn"
                          data-active={active ? "true" : "false"}
                          data-testid={`s04-evidence-${evidence.id}`}
                          onClick={() => toggleEvidence(evidence.id)}
                          disabled={state.phase === "sealed"}
                        >
                          <p className="s04-evidence-label">{evidence.label}</p>
                          <p className="s04-evidence-meta">{evidence.source}</p>
                          <p className="s04-evidence-meta">conf {evidence.confidence}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            <SealAction
              phase={state.phase}
              canAttemptLock={selectors.canAttemptLock}
              holdProgress={holdProgress}
              holdPercentLabel={selectors.holdPercentLabel}
              guardMessage={state.lastGuardFailure?.message ?? null}
              statusMessage={statusMessage}
              onPointerDown={(atMs) => dispatchTrackedAction({ type: "seal.pointer.down", atMs })}
              onPointerTick={(atMs) => setState((previous) => reduceLockMachine(previous, { type: "seal.pointer.tick", atMs }))}
              onPointerUp={(atMs) => dispatchTrackedAction({ type: "seal.pointer.up", atMs })}
              onPointerCancel={(atMs, reason) =>
                dispatchTrackedAction({
                  type: "seal.pointer.cancel",
                  atMs,
                  reason,
                })
              }
              onReset={() =>
                dispatchTrackedAction({
                  type: "seal.reset",
                  atMs: toNowMs(),
                })
              }
            />
          </section>

          <SummaryPanel
            phase={state.phase}
            routeLabel={selectors.selectedRouteLabel}
            summary={summary}
            sourceMix={sourceMix}
            replayJson={replayJson}
            replayStatus={state.replayStatus}
            replayLastError={state.replayLastError}
            replayLastHash={state.replayLastHash}
            onReplayJsonChange={setReplayJson}
            onReplayCopy={onReplayCopy}
            onReplayPlayback={onReplayPlayback}
            onUnseal={() =>
              dispatchTrackedAction({
                type: "seal.unseal",
                atMs: toNowMs(),
              })
            }
          />
        </div>
      </main>

      <div style={{ display: "none" }} data-testid="s04-summary-preview">
        {summary ? createSummaryPreviewLine(summary) : "not-sealed"}
      </div>
    </div>
  );
}

export default Scene;
