import React from "react";

export type Slide04HudProps = {
  visible: boolean;
  phase: string;
  traceLength: number;
  summaryHash: string | null;
  holdPercent: string;
};

export function Hud(props: Slide04HudProps) {
  if (!props.visible) {
    return null;
  }

  return (
    <aside className="s04-hud" data-testid="s04-hud" aria-label="Slide04 dev HUD">
      <p className="s04-hud-line" data-testid="s04-hud-phase">
        phase: {props.phase}
      </p>
      <p className="s04-hud-line" data-testid="s04-hud-trace-length">
        trace: {props.traceLength}
      </p>
      <p className="s04-hud-line" data-testid="s04-hud-summary-hash">
        hash: {props.summaryHash ?? "none"}
      </p>
      <p className="s04-hud-line">hold: {props.holdPercent}</p>
    </aside>
  );
}

export default Hud;
