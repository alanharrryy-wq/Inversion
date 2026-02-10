import React from "react";
import { BootLifecycleState } from "../../../runtime/boot";
import { ArmSystemButton } from "./ArmSystemButton";
import { BootStateIndicator } from "./BootStateIndicator";
import { ConfirmSlot } from "./ConfirmSlot";
import { EvidenceStatusStrip } from "./EvidenceStatusStrip";
import { ConfirmSlotState, EvidenceStatusCard } from "./types";

export function BootPanelBody(props: {
  status: BootLifecycleState;
  canArm: boolean;
  canConfirm: boolean;
  showConfirm: boolean;
  confirmLabel: string;
  onArm: () => void;
  onConfirm: () => void;
  confirmState: ConfirmSlotState;
  confirmText: string;
  confirmStrongText?: string;
  cards: EvidenceStatusCard[];
}) {
  return (
    <>
      <BootStateIndicator status={props.status} />

      <div className="slide00-boot-action-zone">
        <ArmSystemButton
          label="arm system"
          onClick={props.onArm}
          disabled={!props.canArm}
          testId="boot-arm-button"
          dominant
        />

        {props.showConfirm && (
          <ArmSystemButton
            label={props.confirmLabel}
            onClick={props.onConfirm}
            disabled={!props.canConfirm}
            variant="confirm"
            testId="boot-confirm-button"
          />
        )}
      </div>

      <ConfirmSlot
        state={props.confirmState}
        text={props.confirmText}
        strongText={props.confirmStrongText}
      />

      <EvidenceStatusStrip cards={props.cards} />
    </>
  );
}
