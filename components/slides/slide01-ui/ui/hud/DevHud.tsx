import React from "react";
import { Slide01State, SLIDE01_TEST_IDS } from "../../core/fsm";

type DevHudProps = {
  state: Slide01State;
};

export const DevHud: React.FC<DevHudProps> = ({ state }) => {
  if (!state.hudVisible) return null;

  return (
    <aside
      data-testid={SLIDE01_TEST_IDS.hudPanel}
      className="rounded-xl border border-white/20 bg-black/65 p-3 font-code text-[11px] text-white/80"
    >
      <div data-testid={SLIDE01_TEST_IDS.hudPhase}>phase: {state.phase}</div>
      <div data-testid={SLIDE01_TEST_IDS.hudScoreA}>scoreA: {state.score.routeA.toFixed(4)}</div>
      <div data-testid={SLIDE01_TEST_IDS.hudScoreB}>scoreB: {state.score.routeB.toFixed(4)}</div>
      <div data-testid={SLIDE01_TEST_IDS.hudDelta}>delta(B-A): {state.score.difference.toFixed(4)}</div>
      <div data-testid={SLIDE01_TEST_IDS.hudTrace}>trace: {state.trace.length}</div>
      <div data-testid={SLIDE01_TEST_IDS.hudTransitionCount}>
        transitions: {state.transitionCount}
      </div>
    </aside>
  );
};
