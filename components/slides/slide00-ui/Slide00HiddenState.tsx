import React from "react";

export function Slide00HiddenState(props: {
  bootStatus: string;
  armedEvidence: string;
}) {
  return (
    <>
      <div data-testid="boot-state-label" className="slide00-hidden-state">{props.bootStatus}</div>
      <div data-testid="boot-armed-evidence" className="slide00-hidden-state">{props.armedEvidence}</div>
    </>
  );
}
