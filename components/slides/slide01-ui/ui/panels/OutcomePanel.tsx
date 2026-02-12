import React from "react";
import { decisionEvidenceLine, hasResolvedDecision, Slide01State, SLIDE01_TEST_IDS } from "../../core/fsm";
import { ActionButton } from "../atoms/ActionButton";
import { PanelFrame } from "../atoms/PanelFrame";

type OutcomePanelProps = {
  state: Slide01State;
  onReset: () => void;
};

function phaseNarrative(phase: Slide01State["phase"]): string {
  if (phase === "idle") return "Waiting for deliberate pointer gesture.";
  if (phase === "aiming") return "Pointer down captured. Continue drag to weigh criteria.";
  if (phase === "weighing") return "Live weighting in progress.";
  if (phase === "committed") return "Gesture committed. Resolving final evidence.";
  return "Deterministic route resolved.";
}

export const OutcomePanel: React.FC<OutcomePanelProps> = ({ state, onReset }) => {
  const resolved = hasResolvedDecision(state);
  const headline = resolved ? state.decision.headline : "Pending deterministic selection";
  const scoreLine = decisionEvidenceLine(state);

  return (
    <PanelFrame
      testId={SLIDE01_TEST_IDS.outcomePanel}
      title="Decision Evidence"
      subtitle="Route selection is deterministic and trace-replayable."
      className="h-full"
      rightSlot={
        <ActionButton
          label="Reset"
          testId={SLIDE01_TEST_IDS.outcomeReset}
          onClick={onReset}
          tone="warning"
        />
      }
    >
      <div data-testid={SLIDE01_TEST_IDS.outcomeState} className="mb-2 font-code text-xs uppercase tracking-[0.2em] text-white/65">
        {phaseNarrative(state.phase)}
      </div>
      <h4 data-testid={SLIDE01_TEST_IDS.outcomeHeadline} className="text-2xl font-display text-white">
        {headline}
      </h4>
      <div data-testid={SLIDE01_TEST_IDS.outcomeWinner} className="mt-2 font-code text-sm uppercase tracking-[0.2em] text-cyan-200">
        {state.decision.winner ? `Winner: Route ${state.decision.winner}` : "Winner: --"}
      </div>
      <p data-testid={SLIDE01_TEST_IDS.outcomeScore} className="mt-2 rounded-lg border border-white/20 bg-black/35 px-3 py-2 font-code text-xs text-white/80">
        {scoreLine}
      </p>
      <ul data-testid={SLIDE01_TEST_IDS.outcomeBullets} className="mt-3 space-y-2 text-sm text-white/80">
        {state.decision.reasons.map((reason, index) => (
          <li key={`${reason}-${index}`} data-testid={`slide01-outcome-bullet-${index}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            {reason}
          </li>
        ))}
      </ul>
    </PanelFrame>
  );
};
