
import React from "react";

export function PersistenceIndicator(props: {
  persisted: boolean;
  keyCount: number;
  keys: string[];
  title: string;
  detectedLabel: string;
  emptyLabel: string;
  keyCountLabel: string;
}) {
  return (
    <article className="slide00-persistence-indicator" data-persisted={props.persisted ? "true" : "false"} data-testid="boot-persistence-indicator">
      <p className="slide00-persistence-indicator-label">{props.title}</p>
      <p className="slide00-persistence-indicator-value">
        {props.persisted ? props.detectedLabel : props.emptyLabel}
      </p>
      <p className="slide00-persistence-indicator-note">{props.keyCountLabel}</p>
      {props.keys.length > 0 && (
        <ul className="slide00-persistence-indicator-list" data-testid="boot-persistence-keys">
          {props.keys.map((key) => (
            <li key={key} className="slide00-persistence-indicator-list-item">
              {key}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

