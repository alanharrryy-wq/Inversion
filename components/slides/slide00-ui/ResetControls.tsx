import React from "react";

export function ResetControls(props: {
  onSoftReset: () => void;
  onHardReset: () => void;
}) {
  return (
    <section className="slide00-reset-controls" data-testid="boot-reset-controls">
      <p className="slide00-reset-controls-title">reset and disarm</p>
      <p className="slide00-reset-controls-copy">Soft reset disarms runtime and clears the active boot snapshot. Hard reset also clears all HITECH local storage keys.</p>
      <div className="slide00-reset-controls-actions">
        <button
          type="button"
          className="slide00-reset-controls-btn"
          onClick={props.onSoftReset}
          data-testid="boot-soft-reset"
        >
          soft reset / disarm
        </button>
        <button
          type="button"
          className="slide00-reset-controls-btn"
          data-variant="hard"
          onClick={props.onHardReset}
          data-testid="boot-hard-reset"
        >
          hard reset (clear keys)
        </button>
      </div>
    </section>
  );
}
