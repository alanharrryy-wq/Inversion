
import React from "react";

export function BootStatusBadge(props: {
  isArmed: boolean;
  isOperatorAssisted: boolean;
  narrative: string;
  lastEventLabel: string;
  label: string;
  armedLabel: string;
  assistedLabel: string;
  lockedLabel: string;
  lastEventPrefix: string;
}) {
  return (
    <article className="slide00-boot-badge" data-armed={props.isArmed ? "true" : "false"} data-testid="boot-status-badge">
      <p className="slide00-boot-badge-label">{props.label}</p>
      <p className="slide00-boot-badge-value">
        {props.isArmed
          ? props.armedLabel
          : props.isOperatorAssisted
            ? props.assistedLabel
            : props.lockedLabel}
      </p>
      <p className="slide00-boot-note">{props.narrative}</p>
      <p className="slide00-boot-note">
        {props.lastEventPrefix} <strong>{props.lastEventLabel}</strong>
      </p>
    </article>
  );
}

