import React from 'react';
import { FirstActionTile } from './FirstActionTile';
import { FirstActionModel } from './types';

export function FirstActionsRail(props: {
  title: string;
  subtitle: string;
  actions: FirstActionModel[];
}) {
  return (
    <section className="slide00-first-actions-rail" data-testid="first-actions-rail">
      <header className="slide00-first-actions-head">
        <h3 className="slide00-first-actions-title">{props.title}</h3>
        <p className="slide00-first-actions-subtitle">{props.subtitle}</p>
      </header>

      <div className="slide00-first-actions-grid">
        {props.actions.map((action) => (
          <FirstActionTile key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}
