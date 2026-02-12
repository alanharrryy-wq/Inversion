import React, { useMemo, useState } from "react";
import { describeConstraints, getRouteOption, SLIDE02_ROUTE_OPTIONS } from "../core/model";
import { statusLabel, buildEvidenceViewModel, buildHudSummary } from "../core/selectors";
import { useSlide02Machine } from "../core/useSlide02Machine";
import { Slide02SceneProps } from "../core/types";
import { routeSourceLabel } from "../core/context";
import { ControlsPanel } from "./ControlsPanel";
import { EvidencePanel } from "./EvidencePanel";
import { HudToggle } from "./HudToggle";
import { ReplayPanel } from "./ReplayPanel";
import "../styles.css";

const DEFAULT_UI_STRINGS = {
  heading: "Bridge: Constraint Tightening",
  subheading:
    "Slide02 closes the gap between route selection and execution confidence.",
  hint:
    "Adjust 2-3 controls to tighten the operating window. Evidence updates deterministically.",
  replayHint:
    "Replay is deterministic: same payload always yields the same signature.",
};

export const Scene: React.FC<Slide02SceneProps> = ({ uiStrings }) => {
  const mergedStrings = {
    ...DEFAULT_UI_STRINGS,
    ...(uiStrings ?? {}),
  };

  const machine = useSlide02Machine();
  const { state } = machine;

  const [replayDraft, setReplayDraft] = useState("");

  const narrative = useMemo(() => describeConstraints(state.constraints), [state.constraints]);
  const evidence = useMemo(() => buildEvidenceViewModel(state), [state]);
  const hudSummary = useMemo(() => buildHudSummary(state), [state]);
  const routeOption = useMemo(() => getRouteOption(state.route), [state.route]);

  const onExportReplay = () => {
    const nextJson = machine.exportReplayJson();
    setReplayDraft(nextJson);
  };

  const onStageReplay = () => {
    machine.stageReplay(replayDraft);
  };

  const onApplyReplay = () => {
    machine.applyReplay();
  };

  const onClearReplay = () => {
    setReplayDraft("");
    machine.clearReplay();
  };

  return (
    <section data-testid="slide02-root" className="slide02-root">
      <div data-testid="slide02-scene" className="slide02-scene">
        <header className="slide02-top">
          <div className="slide02-top__heading-block">
            <h3 className="slide02-top__title">{mergedStrings.heading}</h3>
            <p className="slide02-top__subtitle">{mergedStrings.subheading}</p>
            <p className="slide02-top__hint">{mergedStrings.hint}</p>
          </div>

          <div className="slide02-top__meta">
            <div className="slide02-meta-pill">
              <span className="slide02-meta-pill__k">route source</span>
              <span data-testid="slide02-route-source" className="slide02-meta-pill__v">
                {routeSourceLabel(state.seed.routeSource)}
              </span>
            </div>
            <div className="slide02-meta-pill">
              <span className="slide02-meta-pill__k">seed route</span>
              <span data-testid="slide02-seed-route" className="slide02-meta-pill__v">
                {state.seed.route}
              </span>
            </div>
            <div className="slide02-meta-pill">
              <span className="slide02-meta-pill__k">active route</span>
              <span className="slide02-meta-pill__v">{routeOption.label}</span>
            </div>
          </div>
        </header>

        <HudToggle
          hudOpen={state.hudOpen}
          onToggle={machine.toggleHud}
          statusValue={statusLabel(state.status)}
          traceLength={state.trace.length}
        />

        {state.hudOpen ? (
          <aside data-testid="slide02-hud" className="slide02-hud">
            <div className="slide02-hud__row">
              <span className="slide02-hud__k">Route</span>
              <span data-testid="slide02-hud-route" className="slide02-hud__v">
                {hudSummary.route}
              </span>
            </div>
            <div className="slide02-hud__row">
              <span className="slide02-hud__k">Constraints</span>
              <span data-testid="slide02-hud-constraints" className="slide02-hud__v">
                {hudSummary.constraints}
              </span>
            </div>
            <div className="slide02-hud__row">
              <span className="slide02-hud__k">Status</span>
              <span data-testid="slide02-hud-status" className="slide02-hud__v">
                {hudSummary.status}
              </span>
            </div>
            <div className="slide02-hud__row">
              <span className="slide02-hud__k">Signature</span>
              <span data-testid="slide02-hud-signature" className="slide02-hud__v">
                {hudSummary.signature}
              </span>
            </div>
          </aside>
        ) : null}

        <div className="slide02-grid">
          <ControlsPanel
            route={state.route}
            routeOptions={SLIDE02_ROUTE_OPTIONS}
            constraints={state.constraints}
            narrative={narrative}
            onRouteChange={machine.setRoute}
            onStrictnessChange={machine.setStrictness}
            onBudgetChange={machine.setBudgetGuard}
            onLatencyChange={machine.setLatencyGuard}
            onReset={machine.resetConstraints}
          />

          <EvidencePanel
            evidence={evidence}
            signature={state.response.signature}
            status={state.status}
          />
        </div>

        <div className="slide02-replay-wrap">
          <ReplayPanel
            replayJson={replayDraft}
            replayError={state.replay.stagedError}
            canApply={Boolean(state.replay.stagedPayload)}
            onReplayJsonChange={setReplayDraft}
            onExportReplay={onExportReplay}
            onStageReplay={onStageReplay}
            onApplyReplay={onApplyReplay}
            onClearReplay={onClearReplay}
          />

          <div className="slide02-replay-note">{mergedStrings.replayHint}</div>
        </div>
      </div>
    </section>
  );
};
