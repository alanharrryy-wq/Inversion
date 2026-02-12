
import React from "react";
import { BootLifecycleState } from "../../../runtime/boot/types";
import { ArmSystemButton } from "./ArmSystemButton";
import { BootStateIndicator } from "./BootStateIndicator";
import { ConfirmSlot } from "./ConfirmSlot";
import { EvidenceStatusStrip } from "./EvidenceStatusStrip";
import { BootStatusChip, ConfirmSlotState, EvidenceStatusCard } from "./types";

export function BootPanelBody(props: {
  status: BootLifecycleState;
  armLabel: string;
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
  stateChips: BootStatusChip[];
}) {
  return (
    <>
      <BootStateIndicator status={props.status} chips={props.stateChips} />

      <div className="slide00-boot-action-zone">
        <ArmSystemButton
          label={props.armLabel}
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

