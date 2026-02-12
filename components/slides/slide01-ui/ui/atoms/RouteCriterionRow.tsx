import React from "react";

type RouteCriterionRowProps = {
  criterionLabel: string;
  profileValue: number;
  testId: string;
  tone: "A" | "B";
};

export const RouteCriterionRow: React.FC<RouteCriterionRowProps> = ({
  criterionLabel,
  profileValue,
  testId,
  tone,
}) => {
  const width = Math.max(0, Math.min(100, profileValue * 100));
  const gradient = tone === "A" ? "from-orange-400/70 to-orange-200/70" : "from-cyan-400/70 to-cyan-200/70";
  return (
    <div data-testid={testId} className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/70">{criterionLabel}</span>
        <span className="font-code text-white/85">{width.toFixed(0)}%</span>
      </div>
      <div className="h-[5px] rounded-full bg-white/10">
        <div className={`h-[5px] rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};
