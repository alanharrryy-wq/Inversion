import React from "react";

export function BootStatusBadge(props: {
  isArmed: boolean;
  isOperatorAssisted: boolean;
  narrative: string;
  lastEventLabel: string;
}) {
  return (
    <article className="slide00-boot-badge" data-armed={props.isArmed ? "true" : "false"} data-testid="boot-status-badge">
      <p className="slide00-boot-badge-label">system status</p>
      <p className="slide00-boot-badge-value">
        {props.isArmed ? "SYSTEM: ARMED" : props.isOperatorAssisted ? "SYSTEM: OPERATOR_ASSISTED" : "SYSTEM: LOCKED"}
      </p>
      <p className="slide00-boot-note">{props.narrative}</p>
      <p className="slide00-boot-note">
        last evidence event: <strong>{props.lastEventLabel}</strong>
      </p>
    </article>
  );
}
