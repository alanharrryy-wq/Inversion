import React from "react";

export function OpeningFlagsBadge(props: {
  summary: string;
  autostartReason: string;
  warning: boolean;
}) {
  return (
    <article className="slide00-boot-badge">
      <p className="slide00-boot-badge-label">opening flags</p>
      <p className="slide00-boot-badge-value">{props.summary}</p>
      <p className="slide00-boot-note" data-warning={props.warning ? "true" : "false"}>
        autostart: <strong>{props.autostartReason}</strong>
      </p>
    </article>
  );
}
