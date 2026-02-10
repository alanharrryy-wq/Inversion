import React from "react";

export function DiagnosticsDockToggle(props: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="slide00-boot-dock-toggle"
      onClick={props.onClick}
      data-testid="boot-operator-dock-toggle"
    >
      {props.open ? "hide diagnostics" : "operator diagnostics"}
    </button>
  );
}
