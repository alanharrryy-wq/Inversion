
import React from "react";

export function ViewControlsTogglePanel(props: {
  showTopHudRow: boolean;
  showTopRibbon: boolean;
  showDiagnostics: boolean;
  onTopHudRowChange: (value: boolean) => void;
  onTopRibbonChange: (value: boolean) => void;
  onDiagnosticsChange: (value: boolean) => void;
  title: string;
  copy: string;
  topHudLabel: string;
  topRibbonLabel: string;
  diagnosticsLabel: string;
}) {
  return (
    <section className="slide00-view-controls" data-testid="view-controls-toggle-panel">
      <p className="slide00-view-controls-title">{props.title}</p>
      <p className="slide00-view-controls-copy">{props.copy}</p>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showTopHudRow}
          onChange={(event) => props.onTopHudRowChange(event.target.checked)}
          data-testid="view-toggle-top-hud"
        />
        <span>{props.topHudLabel}</span>
      </label>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showTopRibbon}
          onChange={(event) => props.onTopRibbonChange(event.target.checked)}
          data-testid="view-toggle-top-ribbon"
        />
        <span>{props.topRibbonLabel}</span>
      </label>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showDiagnostics}
          onChange={(event) => props.onDiagnosticsChange(event.target.checked)}
          data-testid="view-toggle-diagnostics"
        />
        <span>{props.diagnosticsLabel}</span>
      </label>
    </section>
  );
}

