import React from "react";
import { Slide01Phase } from "../../core/fsm";

const PHASE_COLOR: Record<Slide01Phase, string> = {
  idle: "border-white/35 text-white/75",
  aiming: "border-cyan/55 text-cyan-200",
  weighing: "border-blue-300/65 text-blue-100",
  committed: "border-orange-300/70 text-orange-100",
  resolved: "border-emerald-300/70 text-emerald-100",
};

export const PhaseChip: React.FC<{ phase: Slide01Phase; testId: string }> = ({ phase, testId }) => {
  return (
    <div
      data-testid={testId}
      className={`inline-flex rounded-full border px-3 py-1 font-code text-[10px] uppercase tracking-[0.24em] ${PHASE_COLOR[phase]}`}
    >
      {phase}
    </div>
  );
};
