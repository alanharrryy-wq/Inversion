import React from 'react';

type Props = {
  tease?: string;
  hints: string[];
};

export function GuideHints({ tease, hints }: Props) {
  if (!tease && hints.length === 0) return null;
  return (
    <div className="wow-guide-hints">
      {tease ? <div className="wow-guide-hints__tease">Next: {tease}</div> : null}
      {hints.length > 0 ? (
        <ul className="wow-guide-hints__list">
          {hints.map((hint, index) => (
            <li key={`${index}-${hint}`}>→ {hint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
