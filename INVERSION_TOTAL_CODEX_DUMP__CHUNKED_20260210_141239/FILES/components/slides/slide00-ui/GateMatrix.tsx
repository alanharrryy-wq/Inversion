
import React from "react";
import { GateRow } from "./types";

export function GateMatrix(props: {
  rows: GateRow[];
  humanReason: (reason: string) => string;
  title: string;
  availableLabel: string;
  lockedLabel: string;
  disabledLabel: string;
}) {
  return (
    <section className="slide00-boot-matrix" data-testid="boot-gate-matrix">
      <h3 className="slide00-boot-matrix-title">{props.title}</h3>
      <ul className="slide00-boot-matrix-list">
        {props.rows.map((row) => (
          <li
            key={row.key}
            className="slide00-boot-matrix-row"
            data-ready={row.ready ? "true" : "false"}
            data-lock={row.lock ? "true" : "false"}
          >
            <p className="slide00-boot-matrix-key">{row.label}</p>
            <p className="slide00-boot-matrix-reason">
              {row.ready ? props.availableLabel : row.lock ? props.lockedLabel : props.disabledLabel} · {props.humanReason(row.reason)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

