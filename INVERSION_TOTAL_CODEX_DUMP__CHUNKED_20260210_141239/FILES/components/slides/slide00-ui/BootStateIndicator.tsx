
import React from "react";
import { BootLifecycleState } from "../../../runtime/boot/types";
import { BootStatusChip } from "./types";

export function BootStateIndicator(props: {
  status: BootLifecycleState;
  chips: BootStatusChip[];
}) {
  return (
    <div className="slide00-boot-status-row">
      {props.chips.map((chip) => (
        <span
          key={chip.id}
          className="slide00-boot-status-chip"
          data-active={props.status === chip.id ? "true" : "false"}
          data-variant={chip.variant ?? "default"}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

