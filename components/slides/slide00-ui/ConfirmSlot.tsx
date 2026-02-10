import React from "react";
import { ConfirmSlotState } from "./types";

export function ConfirmSlot(props: {
  state: ConfirmSlotState;
  text: string;
  strongText?: string;
}) {
  return (
    <div className="slide00-boot-confirm-slot" data-state={props.state}>
      {props.strongText ? (
        <p className="slide00-boot-confirm-copy" data-testid="boot-confirm-state">
          {props.text} <strong>{props.strongText}</strong>
        </p>
      ) : (
        <p className="slide00-boot-confirm-empty" data-testid="boot-confirm-state">
          {props.text}
        </p>
      )}
    </div>
  );
}
