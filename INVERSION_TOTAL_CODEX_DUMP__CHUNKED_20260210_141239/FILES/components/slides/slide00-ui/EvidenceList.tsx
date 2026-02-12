
import React from "react";
import { EvidenceRow } from "./types";

export function EvidenceList(props: {
  title: string;
  rows: EvidenceRow[];
  formatTimestamp: (ts: number | null) => string;
  metaLabel: string;
  confirmedLabel: (time: string) => string;
  awaitingLabel: string;
  satisfiedLabel: string;
  missingLabel: string;
  idleLabel: string;
}) {
  return (
    <section className="slide00-boot-evidence slide00-boot-scrollbar" data-testid="boot-evidence-panel">
      <div className="slide00-boot-evidence-header">
        <h3 className="slide00-boot-evidence-title">{props.title}</h3>
        <p className="slide00-boot-evidence-meta">{props.metaLabel}</p>
      </div>
      <ul className="slide00-boot-evidence-list">
        {props.rows.map((row) => (
          <li key={row.key} className="slide00-boot-evidence-row" data-satisfied={row.satisfied ? "true" : "false"}>
            <div className="slide00-boot-evidence-copy">
              <p className="slide00-boot-evidence-name">{row.title}</p>
              <p className="slide00-boot-evidence-desc">{row.description}</p>
              <p className="slide00-boot-evidence-desc">
                {row.satisfied
                  ? props.confirmedLabel(props.formatTimestamp(row.satisfiedAtTs))
                  : props.awaitingLabel}
              </p>
            </div>
            <span className="slide00-boot-evidence-state" data-satisfied={row.satisfied ? "true" : "false"}>
              {row.satisfied ? props.satisfiedLabel : row.blocker ? props.missingLabel : props.idleLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

