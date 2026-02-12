import React from "react";

type HudToggleProps = {
  hudOpen: boolean;
  onToggle: () => void;
  statusValue: string;
  traceLength: number;
};

export const HudToggle: React.FC<HudToggleProps> = ({
  hudOpen,
  onToggle,
  statusValue,
  traceLength,
}) => {
  return (
    <div className="slide02-hud-toggle-wrap">
      <button
        type="button"
        onClick={onToggle}
        data-testid="slide02-hud-toggle"
        className="slide02-btn slide02-btn--ghost"
        aria-expanded={hudOpen}
      >
        {hudOpen ? "Hide HUD" : "Show HUD"}
      </button>
      <div data-testid="slide02-status" className="slide02-status-pill">
        <span className="slide02-status-pill__label">status</span>
        <span data-testid="slide02-status-value" className="slide02-status-pill__value">
          {statusValue}
        </span>
      </div>
      <div className="slide02-status-pill">
        <span className="slide02-status-pill__label">trace</span>
        <span data-testid="slide02-trace-length" className="slide02-status-pill__value">
          {traceLength}
        </span>
      </div>
    </div>
  );
};
