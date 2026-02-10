import React from "react";
import { EvidenceStatusCard } from "./types";

export function EvidenceStatusStrip(props: {
  cards: EvidenceStatusCard[];
}) {
  return (
    <div className="slide00-boot-kpi-row">
      {props.cards.map((card) => (
        <article
          key={card.key}
          className="slide00-boot-kpi-card"
          data-good={card.good ? "true" : "false"}
          data-warn={card.warn ? "true" : "false"}
          data-danger={card.danger ? "true" : "false"}
        >
          <p className="slide00-boot-kpi-key">{card.key}</p>
          <p className="slide00-boot-kpi-value">{card.value}</p>
        </article>
      ))}
    </div>
  );
}
