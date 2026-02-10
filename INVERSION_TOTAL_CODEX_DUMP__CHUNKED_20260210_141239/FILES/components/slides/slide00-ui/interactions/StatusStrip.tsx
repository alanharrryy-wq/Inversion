
import React from 'react';
import { StatusStripItem } from './types';

export function StatusStrip(props: {
  title: string;
  subtitle: string;
  items: StatusStripItem[];
}) {
  return (
    <section className="slide00-status-strip" data-testid="status-strip">
      <header className="slide00-status-strip-head">
        <h3 className="slide00-status-strip-title">{props.title}</h3>
        <p className="slide00-status-strip-subtitle">{props.subtitle}</p>
      </header>

      <div className="slide00-status-strip-grid">
        {props.items.map((item) => (
          <article key={item.key} className="slide00-status-strip-item" data-tone={item.tone}>
            <p className="slide00-status-strip-label">{item.label}</p>
            <p className="slide00-status-strip-value">{item.value}</p>
            {item.hint ? <p className="slide00-status-strip-hint">{item.hint}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

