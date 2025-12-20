import React from "react";
import type { KpiItem } from "./kpi.data";

type Props = {
  items: KpiItem[];
  hoveredId: string | null;
  selectedId: string | null;

  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export const KpiGrid: React.FC<Props> = ({
  items,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-2 gap-8 w-full h-full px-12 py-4 relative z-10">
      {items.map((k) => {
        const isSelected = selectedId === k.id;
        const isHovered = hoveredId === k.id;
        const isActive = isSelected || (!selectedId && isHovered);

        return (
          <button
            key={k.id}
            type="button"
            onMouseEnter={() => onHover(k.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(k.id)}
            className={[
              "text-left border bg-black/40 p-6 relative w-full transition-all duration-300",
              "border-white/15 hover:border-white/30 rounded-lg",
              isActive ? "translate-y-[-2px] shadow-[0_0_24px_rgba(0,240,255,0.12)]" : "",
              isSelected ? "ring-1 ring-white/15" : "",
            ].join(" ")}
          >
            <div className="text-gray-400 font-code tracking-[0.28em] mb-2 text-sm">
              {k.label}
            </div>
            <div className="text-6xl font-black text-white">{k.value}</div>
            <div className="text-sm text-gray-400 mt-2">{k.sub}</div>

            {k.sourceTag && (
              <div className="mt-4 inline-block text-[10px] font-code tracking-[0.22em] text-cyan/70 border border-cyan/20 px-2 py-1 rounded bg-black/30">
                {k.sourceTag}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
