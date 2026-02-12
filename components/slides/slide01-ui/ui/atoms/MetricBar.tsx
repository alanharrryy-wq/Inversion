import React from "react";

type MetricBarProps = {
  label: string;
  value: number;
  testId: string;
  accent?: "cyan" | "amber" | "green" | "blue";
};

const ACCENT: Record<NonNullable<MetricBarProps["accent"]>, string> = {
  cyan: "from-cyan-400/70 to-cyan-200/60",
  amber: "from-amber-400/70 to-amber-200/60",
  green: "from-emerald-400/70 to-emerald-200/60",
  blue: "from-blue-400/70 to-blue-200/60",
};

export const MetricBar: React.FC<MetricBarProps> = ({
  label,
  value,
  testId,
  accent = "cyan",
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div data-testid={testId} className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-code uppercase tracking-[0.18em] text-white/65">{label}</span>
        <span className="font-code text-white/85">{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${ACCENT[accent]} transition-all duration-150`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
