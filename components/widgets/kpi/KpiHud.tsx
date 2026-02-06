import React, { useEffect, useMemo, useRef, useState } from "react";
import type { KpiItem } from "./kpi.data";

function parseValue(raw: string) {
  // Soporta: "98.5%", "$45K", "24H", "4.5x"
  const s = raw.trim();

  // Prefijos/sufijos detectables
  const prefix = s.startsWith("$") ? "$" : "";
  const suffix =
    s.endsWith("%") ? "%" :
    s.toLowerCase().endsWith("k") ? "K" :
    s.toLowerCase().endsWith("h") ? "H" :
    s.toLowerCase().endsWith("x") ? "x" : "";

  // Extraer número (con decimal)
  const numStr = s
    .replace("$", "")
    .replace("%", "")
    .replace(/k$/i, "")
    .replace(/h$/i, "")
    .replace(/x$/i, "")
    .trim();

  const num = Number(numStr);
  const isValid = Number.isFinite(num);

  return { prefix, suffix, num: isValid ? num : 0, isValid, raw: s };
}

function formatValue(prefix: string, n: number, suffix: string, decimals: number) {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  return `${prefix}${fixed}${suffix}`;
}

function useCountUp(targetRaw: string, run: boolean) {
  const { prefix, suffix, num, isValid } = useMemo(() => parseValue(targetRaw), [targetRaw]);

  const [display, setDisplay] = useState<string>(targetRaw);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // si no corre o no es número, muestra raw normal
    if (!run || !isValid) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setDisplay(targetRaw);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const start = performance.now();
    const duration = 1100; // 1.1s premium
    const from = 0;

    // Decimales: si target trae '.', mantenlo
    const decimals = String(targetRaw).includes(".") ? 1 : 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easing suave
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (num - from) * eased;

      setDisplay(formatValue(prefix, cur, suffix, decimals));

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setDisplay(targetRaw); // al final deja exacto
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [run, isValid, num, prefix, suffix, targetRaw]);

  return display;
}

export const KpiHud: React.FC<{ item: KpiItem | null; locked?: boolean }> = ({
  item,
  locked,
}) => {
  const valueRaw = item?.value ?? "";
  const displayValue = useCountUp(valueRaw, !!item && !!locked);

  return (
    <div className="w-full px-12 pb-6 relative z-10">
      <div className="border border-white/10 bg-black/35 rounded-lg p-5">
        {!item ? (
          <div className="text-gray-500 font-code text-sm tracking-[0.2em]">
            HOVER PARA PREVISUALIZAR — CLICK PARA LOCK
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

              <div className="mt-3 text-[11px] font-code tracking-[0.2em] text-gray-500">
                {locked ? "LOCKED — ESC / CLICK AFUERA" : "TRACKING"}
              </div>
            </div>

            <div className="shrink-0 text-right">
              {/* ✅ Count-up SOLO cuando locked */}
              <div className="text-4xl font-black text-white">{displayValue}</div>
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
