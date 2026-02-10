
import React from "react";

export function ResetControls(props: {
  onSoftReset: () => void;
  onHardReset: () => void;
  title: string;
  copy: string;
  softLabel: string;
  hardLabel: string;
}) {
  return (
    <section className="slide00-reset-controls" data-testid="boot-reset-controls">
      <p className="slide00-reset-controls-title">{props.title}</p>
      <p className="slide00-reset-controls-copy">{props.copy}</p>
      <div className="slide00-reset-controls-actions">
        <button
          type="button"
          className="slide00-reset-controls-btn"
          onClick={props.onSoftReset}
          data-testid="boot-soft-reset"
        >
          {props.softLabel}
        </button>
        <button
          type="button"
          className="slide00-reset-controls-btn"
          data-variant="hard"
          onClick={props.onHardReset}
          data-testid="boot-hard-reset"
        >
          {props.hardLabel}
        </button>
      </div>
    </section>
  );
}

