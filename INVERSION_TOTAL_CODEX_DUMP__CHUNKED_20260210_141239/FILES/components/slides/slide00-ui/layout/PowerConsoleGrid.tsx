
import React from 'react';

export function PowerConsoleGrid(props: {
  main: React.ReactNode;
  side: React.ReactNode;
  afterMain?: React.ReactNode;
}) {
  return (
    <div className="slide00-power-console-grid" data-testid="power-console-grid">
      <div className="slide00-power-console-main">{props.main}</div>
      <div className="slide00-power-console-side">{props.side}</div>
      {props.afterMain ? <div className="slide00-power-console-after-main">{props.afterMain}</div> : null}
    </div>
  );
}

