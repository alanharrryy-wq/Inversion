import React, { useEffect, useMemo, useState } from "react";
import { DataBox } from "../Slide/SlideShell";

type KPI = {
  label: string;
  value: string;
  sub: string;
  tone: "green" | "gold" | "cyan" | "white";
  glow: string; // rgba()
  accent: string; // hex
};

const HITECH = {
  gold: "#AB7B26",   // Moodboard oficial :contentReference[oaicite:1]{index=1}
  blueDeep: "#026F86",
  cyan: "#02A7CA",
  bronze: "#553E13",
};

function useCountUp(targetText: string, durationMs = 850) {
  // Soporta "98.5%", "$45K", "24H", "4.5x"
  const [display, setDisplay] = useState(targetText);

  const parsed = useMemo(() => {
    const t = targetText.trim();

    // Detecta prefijo/sufijo
    const prefix = t.startsWith("$") ? "$" : "";
    const hasPct = t.endsWith("%");
    const hasK = /K$/i.test(t.replace("%", ""));
    const hasX = /x$/i.test(t);
    const hasH = /H$/i.test(t);

    // Limpia a número (si aplica)
    const cleaned = t
      .replace("$", "")
      .replace("%", "")
      .replace(/K$/i, "")
      .replace(/x$/i, "")
      .replace(/H$/i, "");

    const num = Number(cleaned);
    const isNumeric = !Number.isNaN(num);

    return { prefix, hasPct, hasK, hasX, hasH, num, isNumeric };
  }, [targetText]);

  useEffect(() => {
    if (!parsed.isNumeric) {
      setDisplay(targetText);
      return;
    }

    const start = 0;
    const end = parsed.num;
    const startTime = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const current = start + (end - start) * eased;

      // Formateo: si trae decimales en el target, respétalos
      const decimals = (targetText.match(/\.(\d+)/)?.[1]?.length ?? 0);
      const fixed = current.toFixed(decimals);

      let out = fixed;

      // K en $45K (redondea a entero si es K)
      if (parsed.hasK) out = Math.round(Number(fixed)).toString();

      // Arma salida
      out =
        (parsed.prefix ? parsed.prefix : "") +
        out +
        (parsed.hasK ? "K" : "") +
        (parsed.hasPct ? "%" : "") +
        (parsed.hasH ? "H" : "") +
        (parsed.hasX ? "x" : "");

      setDisplay(out);

      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parsed, targetText, durationMs]);

  return display;
}

const Card: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const display = useCountUp(kpi.value);

  const toneText =
    kpi.tone === "green"
      ? "text-green-400"
      : kpi.tone === "cyan"
      ? "text-cyan"
      : kpi.tone === "gold"
      ? "" // usamos estilo inline pa' no depender de tailwind custom
      : "text-white";

  const valueStyle: React.CSSProperties =
    kpi.tone === "gold"
      ? { color: HITECH.gold, textShadow: `0 0 14px ${kpi.glow}` }
      : { textShadow: `0 0 14px ${kpi.glow}` };

  return (
    <DataBox
      className="relative overflow-hidden flex flex-col justify-center items-center"
      style={{
        borderColor: "rgba(255,255,255,0.16)",
        background: "rgba(0,0,0,0.40)",
      }}
    >
      {/* Scanline sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.00) 35%, rgba(0,240,255,0.02) 60%, rgba(0,0,0,0.00))",
          opacity: 0.55,
        }}
      />

      {/* Micro-grid blueprint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.12,
          mixBlendMode: "screen",
        }}
      />

      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${kpi.accent}, transparent)`,
          opacity: 0.9,
        }}
      />

      <h3 className="text-gray-400 font-code tracking-[0.28em] mb-2 text-sm">
        {kpi.label}
      </h3>

      <div
        className={`text-7xl font-black drop-shadow-[0_0_10px_rgba(0,0,0,0.35)] ${toneText}`}
        style={valueStyle}
      >
        {display}
      </div>

      <p className="text-sm mt-3" style={{ color: kpi.accent, opacity: 0.95 }}>
        {kpi.sub}
      </p>

      {/* Corner notch CNC */}
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[2px] border-l-[2px]" style={{ borderColor: kpi.accent }} />
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[2px] border-r-[2px]" style={{ borderColor: kpi.accent, opacity: 0.75 }} />
    </DataBox>
  );
};

const LiveKPIDashboard: React.FC = () => {
  const kpis: KPI[] = [
    {
      label: "UPTIME PROMEDIO",
      value: "98.5%",
      sub: "↑ 15% vs Anterior",
      tone: "green",
      glow: "rgba(0,255,0,0.30)",
      accent: "rgba(34,197,94,0.95)", // tailwind green-500 vibe
    },
    {
      label: "COST SAVINGS",
      value: "$45K",
      sub: "En refacciones evitadas",
      tone: "gold",
      glow: "rgba(171,123,38,0.35)",
      accent: HITECH.gold,
    },
    {
      label: "TIEMPO RESPUESTA",
      value: "24H",
      sub: "vs 72H Promedio Industria",
      tone: "cyan",
      glow: "rgba(0,240,255,0.30)",
      accent: HITECH.cyan,
    },
    {
      label: "ROI PROYECTADO",
      value: "4.5x",
      sub: "En 12 meses",
      tone: "white",
      glow: "rgba(255,255,255,0.25)",
      accent: "rgba(255,255,255,0.55)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-8 w-full h-full animate-fade-up px-12 py-4">
      {kpis.map((k, i) => (
        <Card key={i} kpi={k} />
      ))}
    </div>
  );
};

export default LiveKPIDashboard;
