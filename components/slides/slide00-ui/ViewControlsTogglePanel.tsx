import React from "react";

export function ViewControlsTogglePanel(props: {
  showTopHudRow: boolean;
  showTopRibbon: boolean;
  showDiagnostics: boolean;
  onTopHudRowChange: (value: boolean) => void;
  onTopRibbonChange: (value: boolean) => void;
  onDiagnosticsChange: (value: boolean) => void;
}) {
  return (
    <section className="slide00-view-controls" data-testid="view-controls-toggle-panel">
      <p className="slide00-view-controls-title">overlay visibility</p>
      <p className="slide00-view-controls-copy">Explicit operator toggles. Default is OFF unless operator default flag is enabled.</p>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showTopHudRow}
          onChange={(event) => props.onTopHudRowChange(event.target.checked)}
          data-testid="view-toggle-top-hud"
        />
        <span>Show Top HUD Row</span>
      </label>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showTopRibbon}
          onChange={(event) => props.onTopRibbonChange(event.target.checked)}
          data-testid="view-toggle-top-ribbon"
        />
        <span>Show Top Ribbon</span>
      </label>

      <label className="slide00-view-controls-row">
        <input
          type="checkbox"
          checked={props.showDiagnostics}
          onChange={(event) => props.onDiagnosticsChange(event.target.checked)}
          data-testid="view-toggle-diagnostics"
        />
        <span>Show Diagnostics</span>
      </label>
    </section>
  );
}
