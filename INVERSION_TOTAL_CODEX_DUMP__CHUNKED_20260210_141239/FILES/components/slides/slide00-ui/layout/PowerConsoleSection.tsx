
import React from 'react';

type PowerConsoleSectionTone = 'neutral' | 'good' | 'warn' | 'danger' | 'info';

export function PowerConsoleSection(props: {
  title?: string;
  subtitle?: string;
  tone?: PowerConsoleSectionTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`slide00-power-console-section ${props.className ?? ''}`.trim()}
      data-tone={props.tone ?? 'neutral'}
    >
      {(props.title || props.subtitle) && (
        <header className="slide00-power-console-section-head">
          {props.title ? <h3 className="slide00-power-console-section-title">{props.title}</h3> : null}
          {props.subtitle ? <p className="slide00-power-console-section-subtitle">{props.subtitle}</p> : null}
        </header>
      )}
      <div className="slide00-power-console-section-body">{props.children}</div>
    </section>
  );
}

