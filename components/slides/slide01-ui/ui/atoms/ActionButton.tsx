import React from "react";

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  testId: string;
  tone?: "neutral" | "primary" | "warning";
  disabled?: boolean;
  className?: string;
};

const TONE_CLASS: Record<NonNullable<ActionButtonProps["tone"]>, string> = {
  neutral: "border-white/25 bg-black/35 text-white/85 hover:border-white/45",
  primary: "border-cyan/55 bg-cyan/20 text-cyan-100 hover:border-cyan/80",
  warning: "border-orange-300/60 bg-orange-500/15 text-orange-100 hover:border-orange-200",
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  testId,
  tone = "neutral",
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 font-code text-[11px] uppercase tracking-[0.2em] transition-colors duration-150 ${TONE_CLASS[tone]} ${
        disabled ? "cursor-not-allowed opacity-45" : ""
      } ${className ?? ""}`}
    >
      {label}
    </button>
  );
};
