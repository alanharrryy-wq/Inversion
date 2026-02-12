
import React from "react";

export function DiagnosticsDockToggle(props: {
  open: boolean;
  onClick: () => void;
  openLabel: string;
  closedLabel: string;
}) {
  return (
    <button
      type="button"
      className="slide00-boot-dock-toggle"
      onClick={props.onClick}
      data-testid="boot-operator-dock-toggle"
    >
      {props.open ? props.openLabel : props.closedLabel}
    </button>
  );
}

