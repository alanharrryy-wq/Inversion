import React from "react";

export function DiagnosticsBackButton(props: {
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className="slide00-boot-dock-close"
      onClick={props.onClick}
      data-testid={props.testId ?? "diagnostics-back-button"}
    >
      back
    </button>
  );
}
