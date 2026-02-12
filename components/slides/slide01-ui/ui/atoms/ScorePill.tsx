import React from "react";

type ScorePillProps = {
  label: string;
  score: number;
  testId: string;
  tone: "A" | "B";
};

export const ScorePill: React.FC<ScorePillProps> = ({ label, score, testId, tone }) => {
  const className =
    tone === "A"
      ? "border-orange-300/60 bg-orange-300/15 text-orange-100"
      : "border-cyan-300/60 bg-cyan-300/15 text-cyan-100";

  return (
    <div
      data-testid={testId}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-code text-[10px] uppercase tracking-[0.22em] ${className}`}
    >
      <span>{label}</span>
      <span>{score.toFixed(2)}</span>
    </div>
  );
};
