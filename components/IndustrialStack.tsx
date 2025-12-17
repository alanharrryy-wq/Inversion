import React, { useState, useEffect, useRef } from 'react';

const AmbientParticles = () => {
  return (
   <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {[...Array(18)].map((_, i) => (
        <span
          key={i}
          className="absolute w-[2px] h-[2px] bg-cyan/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particleFloat ${6 + Math.random() * 6}s ease-in-out infinite`,
            opacity: 0.4 + Math.random() * 0.6,
          }}
        />
      ))}
      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: .2; }
          50% { opacity: .9; }
          100% { transform: translateY(-40px) translateX(20px); opacity: .2; }
        }
      `}</style>
    </div>
  );
};

const IndustrialIntelligenceStack = () => {
  const [hover, setHover] = useState<null | "edge" | "gateway" | "cloud" | "dash">(null);
  const [stage, setStage] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 120);
    const t2 = setTimeout(() => setStage(2), 320);
    const t3 = setTimeout(() => setStage(3), 520);
    const t4 = setTimeout(() => setStage(4), 720);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    setTilt({ rx: -(dy * 3), ry: dx * 4 });
  };

  const reset = () => setTilt({ rx: 0, ry: 0 });

  const boxBase =
    "relative rounded-2xl border bg-black/35 backdrop-blur-[1px] overflow-hidden transition-all duration-300 " +
    "hover:-translate-y-[2px] select-none";

  const gridBg =
    "pointer-events-none absolute inset-0 opacity-35 " +
    "bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] " +
    "bg-[size:52px_52px]";

  const scanline =
    "pointer-events-none absolute left-0 right-0 h-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300";

  const dim = (k: typeof hover) => hover !== null && hover !== k;

  const Card = ({
    k,
    title,
    topTag,
    icon,
    bullets,
    footer,
    accent,
  }: {
    k: "edge" | "gateway" | "cloud" | "dash";
    title: string;
    topTag: string;
    icon: string;
    bullets: string[];
    footer: string;
    accent: "cyan" | "gold" | "white";
  }) => {
    const accentMap = {
      cyan: {
        border: "border-cyan/25 hover:border-cyan/70",
        glow: "hover:shadow-[0_0_45px_rgba(0,240,255,0.20)]",
        bar: "bg-cyan/0 group-hover:bg-cyan/70",
        tag: "text-cyan border-cyan/35",
        pulse: "shadow-[0_0_18px_rgba(0,240,255,0.30)]",
      },
      gold: {
        border: "border-[#AB7B26]/25 hover:border-[#AB7B26]/80",
        glow: "hover:shadow-[0_0_55px_rgba(171,123,38,0.24)]",
        bar: "bg-[#AB7B26]/0 group-hover:bg-[#AB7B26]/70",
        tag: "text-[#AB7B26] border-[#AB7B26]/35",
        pulse: "shadow-[0_0_18px_rgba(171,123,38,0.35)]",
      },
      white: {
        border: "border-white/20 hover:border-white/45",
        glow: "hover:shadow-[0_0_40px_rgba(255,255,255,0.10)]",
        bar: "bg-white/0 group-hover:bg-white/35",
        tag: "text-white/80 border-white/20",
        pulse: "shadow-[0_0_16px_rgba(255,255,255,0.16)]",
      },
    } as const;

    const a = accentMap[accent];

    return (
      <div
        className={`group ${boxBase} ${a.border} ${a.glow} ${dim(k) ? "opacity-25 blur-[0.35px]" : "opacity-100"}`}
        onMouseEnter={() => setHover(k)}
        onMouseLeave={() => setHover(null)}
      >
        <div className={gridBg} />
        <div
          className={scanline}
          style={{
            top: "-30px",
            background:
              "linear-gradient(to bottom, rgba(0,240,255,0.00), rgba(0,240,255,0.10), rgba(0,240,255,0.00))",
            animation: "hitech-scan 1.25s linear infinite",
          }}
        />
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-code tracking-[4px] px-3 py-1 rounded-full border ${a.tag}`}>
              {topTag}
            </span>
            <span className="text-[10px] font-code tracking-[4px] text-cyan/40">STACK // 09</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-offwhite font-bold tracking-wide text-xl">{title}</div>
              <div className="text-gray-400 text-xs font-code tracking-[4px] mt-2">
                {k === "edge"
                  ? "REAL-TIME TELEMETRY"
                  : k === "gateway"
                  ? "EDGE INTELLIGENCE"
                  : k === "cloud"
                  ? "ANALYTICS + GOVERNANCE"
                  : "DECISION INTERFACE"}
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-xl border border-white/10 bg-black/50 flex items-center justify-center text-2xl ${a.pulse}`}
              style={{ animation: "hud-pulse 2.2s ease-in-out infinite" }}
            >
              {icon}
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-200">
            {bullets.map((b, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-[7px] w-2 h-2 rounded-full bg-cyan/70 flex-shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-code tracking-[4px] text-cyan/60">{footer}</span>
            <span className="text-xs font-code tracking-[4px] text-gray-500">
              {hover === k ? "DETAILS: ACTIVE" : "HOVER: SCAN"}
            </span>
          </div>
        </div>

        <div className={`pointer-events-none absolute left-0 right-0 bottom-0 h-[3px] transition-colors duration-300 ${a.bar}`} />
      </div>
    );
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="relative w-full h-full flex flex-col items-center justify-center animate-fade-up"
      style={{
        transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 120ms ease-out",
      }}
    >
      <style>{`
        @keyframes hitech-scan { from { transform: translateY(0); } to { transform: translateY(520px); } }
        @keyframes hud-pulse { 0%,100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.06); filter: brightness(1.2); } }
        @keyframes energy-flow { from { background-position: 0% 50%; } to { background-position: 200% 50%; } }
        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
      <AmbientParticles />

      {/* Back glow blobs */}
      <div className="absolute -left-24 -top-24 w-80 h-80 bg-cyan/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -right-28 -bottom-28 w-96 h-96 bg-[#AB7B26]/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Title bar (micro-HUD) */}
      <div className="w-full flex items-center justify-between mb-6 px-2">
        <div>
          <div className="text-gold font-code tracking-[4px] text-xs">ARQUITECTURA</div>
          <div className="text-white font-display font-black text-3xl mt-1">
            HITECH INDUSTRIAL INTELLIGENCE STACK
          </div>
          <div className="text-gray-400 text-xs font-code tracking-[4px] mt-2">
            EDGE · TELEMETRY · PREDICTIVE ANALYTICS · OPERATIONAL GOVERNANCE
          </div>
        </div>

        <div className="text-right">
          <div className="text-cyan font-code text-xs tracking-[4px]">SYSTEM STATUS</div>
          <div className="mt-1 flex items-center gap-2 justify-end">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-code text-xs tracking-[4px]">ONLINE</span>
          </div>
          <div className="text-gray-500 font-code text-[10px] tracking-[4px] mt-2">
            EDGE LATENCY: &lt; 120ms
          </div>
        </div>
      </div>

      {/* Main stack */}
      <div className="w-full grid grid-cols-3 gap-8 items-start">
        {/* EDGE */}
        <div className={`transition-all duration-500 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <Card
            k="edge"
            accent="cyan"
            topTag="EDGE POWER SYSTEMS"
            title="RECTIFICADORES · TELEMETRÍA"
            icon="⚡"
            bullets={[
              "Ripple / THD / corriente DC · eventos de protección",
              "Temperatura SCR/IGBT · ventilación · ciclos de carga",
              "Degradación térmica → tendencia, no “intuición”",
            ]}
            footer="SENSORS_ARRAY_V2"
          />
        </div>

        {/* GATEWAY */}
        <div className={`transition-all duration-500 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`} style={{ animation: "floaty 3.6s ease-in-out infinite" }}>
          <Card
            k="gateway"
            accent="gold"
            topTag="EDGE INTELLIGENCE NODE"
            title="IOT GATEWAY · CORRELATION"
            icon="📡"
            bullets={[
              "Normaliza señales + timestamping industrial",
              "Buffer local anti-caídas · fail-safe autonomy",
              "Reglas de borde → alertas antes del paro",
            ]}
            footer="FILTER · CORRELATE · DECIDE"
          />

          {/* Energy line down to Dashboard (animated) */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[6px] h-[120px] rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(0,240,255,0.0), rgba(0,240,255,0.55), rgba(0,240,255,0.0))",
              boxShadow: "0 0 24px rgba(0,240,255,0.25)",
              animation: "hud-pulse 1.8s ease-in-out infinite",
            }}
          />
        </div>

        {/* CLOUD */}
        <div className={`transition-all duration-500 ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <Card
            k="cloud"
            accent="white"
            topTag="CLOUD ANALYTICS CORE"
            title="CLOUD CORE · MODELOS + AUDITORÍA"
            icon="☁️"
            bullets={[
              "Tendencias multi-planta + benchmark por activo",
              "Modelos de degradación · predictivo con evidencia",
              "Gobernanza: trazabilidad, historiales, compliance",
            ]}
            footer="PREDICT · GOVERN · PROVE"
          />
        </div>
      </div>

      {/* Horizontal energy beams */}
      <div className="relative w-full mt-6 h-10">
        <div
          className="absolute left-[18%] right-[52%] top-1/2 -translate-y-1/2 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.7), transparent)",
            backgroundSize: "200% 100%",
            animation: "energy-flow 2.2s linear infinite",
          }}
        />
        <div
          className="absolute left-[52%] right-[18%] top-1/2 -translate-y-1/2 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(171,123,38,0.75), transparent)",
            backgroundSize: "200% 100%",
            animation: "energy-flow 2.6s linear infinite",
          }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_18px_rgba(0,255,0,0.35)] animate-pulse" />
      </div>

      {/* Dashboard */}
      <div className={`w-full transition-all duration-500 ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div
          onMouseEnter={() => setHover("dash")}
          onMouseLeave={() => setHover(null)}
          className={`group mt-2 w-full border border-cyan/30 bg-cyan/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-cyan hover:shadow-[0_0_55px_rgba(0,240,255,0.18)] ${dim("dash") ? "opacity-25 blur-[0.35px]" : ""}`}
        >
          <div className={gridBg} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-white font-display font-black text-2xl">DASHBOARD CLIENTE</div>
              <div className="text-gray-300 text-xs font-code tracking-[4px] mt-2">
                DECISION & OVERSIGHT INTERFACE
              </div>
            </div>
            <div className="text-right text-xs font-code tracking-[4px] text-cyan/60">
              ALERTS · REPORTS · ANALYTICS
            </div>
          </div>

          <div className="relative z-10 mt-5 grid grid-cols-3 gap-4">
            {[
              { t: "ALERTS", d: "Severidad real · causas probables · acción inmediata" },
              { t: "REPORTS", d: "Evidencia técnica · trazabilidad · auditoría" },
              { t: "ANALYTICS", d: "Tendencias · degradación · ROI operacional" },
            ].map((x) => (
              <div
                key={x.t}
                className="rounded-xl border border-white/10 bg-black/35 p-4 transition-all duration-300 hover:border-cyan/60 hover:shadow-[0_0_35px_rgba(0,240,255,0.12)]"
              >
                <div className="text-cyan font-code tracking-[4px] text-xs">{x.t}</div>
                <div className="text-gray-200 text-sm mt-2 leading-relaxed">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-5 flex items-center justify-between text-[10px] font-code tracking-[4px] text-gray-400">
            <span>DATA STREAM: ACTIVE</span>
            <span>RETENTION: 365D</span>
            <span>EVIDENCE: HASHED</span>
          </div>

          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-[3px] bg-cyan/0 group-hover:bg-cyan/70 transition-colors duration-300" />
        </div>
      </div>

      <div className="w-full mt-4 flex justify-end text-[10px] font-code tracking-[4px] text-cyan/40">
        HITECH_SYS // ARCH_STACK v32.1.0
      </div>
    </div>
  );
};

export default IndustrialIntelligenceStack;