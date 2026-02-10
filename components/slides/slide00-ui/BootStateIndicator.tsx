import React from "react";
import { BootLifecycleState } from "../../../runtime/boot";
import { BootStatusChip } from "./types";

const CHIP_ORDER: BootStatusChip[] = [
  { id: "IDLE", label: "idle", variant: "danger" },
  { id: "ARMED_PENDING_CONFIRM", label: "pending", variant: "warning" },
  { id: "ARMED_CONFIRMED", label: "armed confirmed", variant: "default" },
  { id: "OPERATOR_ASSISTED", label: "operator assisted", variant: "warning" },
];

export function BootStateIndicator(props: {
  status: BootLifecycleState;
}) {
  return (
    <div className="slide00-boot-status-row">
      {CHIP_ORDER.map((chip) => (
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
