import React from "react";

export function ArmSystemButton(props: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "arm" | "confirm" | "override";
  dominant?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className="slide00-boot-cta"
      data-variant={props.variant === "arm" ? undefined : props.variant}
      data-dominant={props.dominant ? "true" : "false"}
      onClick={props.onClick}
      disabled={props.disabled}
      data-testid={props.testId}
    >
      {props.label}
    </button>
  );
}
