import React from 'react';
import { FirstActionModel } from './types';

export function FirstActionTile(props: {
  action: FirstActionModel;
}) {
  const action = props.action;

  return (
    <article
      className="slide00-first-action-tile"
      data-tone={action.badgeTone}
      data-enabled={action.enabled ? 'true' : 'false'}
      data-testid={`${action.testId}-tile`}
    >
      <header className="slide00-first-action-head">
        <h4 className="slide00-first-action-title">{action.title}</h4>
        <span className="slide00-first-action-badge" data-tone={action.badgeTone}>
          {action.badge}
        </span>
      </header>

      <p className="slide00-first-action-description">{action.description}</p>

      {action.feedback ? (
        <p className="slide00-first-action-feedback" data-testid={`${action.testId}-feedback`}>
          {action.feedback}
        </p>
      ) : (
        <p className="slide00-first-action-feedback slide00-first-action-feedback--idle" data-testid={`${action.testId}-feedback`}>
          -
        </p>
      )}

      <button
        type="button"
        className="slide00-first-action-button"
        onClick={action.onClick}
        disabled={!action.enabled}
        data-testid={action.testId}
      >
        {action.title}
      </button>
    </article>
  );
}
