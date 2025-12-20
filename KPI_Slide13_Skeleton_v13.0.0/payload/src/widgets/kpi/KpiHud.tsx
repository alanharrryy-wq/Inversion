import React from "react";
import type { KpiItem } from "./kpi.data";

export const KpiHud: React.FC<{ item: KpiItem | null; locked?: boolean }> = ({
  item,
  locked,
}) => {
  return (
    <div className="w-full px-12 pb-6 relative z-10">
      <div className="border border-white/10 bg-black/35 rounded-lg p-5">
        {!item ? (
          <div className="text-gray-500 font-code text-sm tracking-[0.2em]">
            HOVER / CLICK PARA VER DETALLE…
          </div>
        ) : (
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="text-white font-bold text-xl">{item.label}</div>
              {item.calc && (
                <div className="text-gray-300 text-sm mt-2">
                  <span className="text-cyan/80 font-code">CALC:</span>{" "}
                  <span className="text-gray-300">{item.calc}</span>
                </div>
              )}
              {item.actions?.length ? (
                <ul className="mt-3 space-y-1 text-sm text-gray-300">
                  {item.actions.slice(0, 3).map((a, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-cyan">►</span>
                      <span className="truncate">{a}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="shrink-0 text-right">
              <div className="text-4xl font-black text-white">{item.value}</div>
              <div className="text-xs font-code tracking-[0.22em] text-gray-500 mt-1">
                {locked ? "LOCKED" : "TRACKING"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
