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
            onPointerEnter={() => {
              // ✅ Sticky hover: solo cambia cuando entras a otra tarjeta
              if (!selectedId && hoveredId !== k.id) onHover(k.id);
            }}
            // ❌ NO onPointerLeave: no limpiamos hover nunca
            onClick={() => onSelect(k.id)}
            className={[
              "relative text-left w-full rounded-lg",
              "border border-white/15 bg-black/40 p-6",
              "transition-[border-color,box-shadow,background-color] duration-300",
              "hover:border-white/30",
              isSelected ? "ring-1 ring-white/15" : "",
              isActive ? "shadow-[0_0_28px_rgba(0,240,255,0.10)]" : "",
            ].join(" ")}
          >
            {/* Glow overlay (sin mover hitbox) */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                opacity: isActive ? 1 : 0,
                transition: "opacity 220ms ease",
                background:
                  "linear-gradient(135deg, rgba(0,240,255,0.07), rgba(0,0,0,0) 55%)",
              }}
            />

            <div className="relative">
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
            </div>

            {/* Notches pro */}
            <div
              className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[2px] border-l-[2px] pointer-events-none"
              style={{
                borderColor: "rgba(0,240,255,0.35)",
                opacity: isActive ? 0.9 : 0.35,
              }}
            />
            <div
              className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[2px] border-r-[2px] pointer-events-none"
              style={{
                borderColor: "rgba(0,240,255,0.25)",
                opacity: isActive ? 0.75 : 0.25,
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
 