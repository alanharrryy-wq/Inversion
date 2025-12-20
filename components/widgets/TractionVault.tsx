import React, { useState } from "react";

type VaultItem = {
  id: string;
  title: string;
  metric: string;
  note: string;
  tone: "emerald" | "gold" | "red" | "cyan";
};

const TractionVault: React.FC = () => {
  const [active, setActive] = useState<string>("srg");

  const items: VaultItem[] = [
    {
      id: "srg",
      title: "SRG GLOBAL",
      metric: "$5M+ Potencial",
      note: "Contrato ancla. Justifica inversión y estructura el sistema.",
      tone: "emerald",
    },
    {
      id: "guardian",
      title: "GUARDIAN",
      metric: "Retención",
      note: "Cuenta estratégica: continuidad + referencias + reputación.",
      tone: "cyan",
    },
    {
      id: "compliance",
      title: "COMPLIANCE / ISN",
      metric: "Desbloqueo",
      note: "Cumplimiento = acceso a plantas y compras sin fricción.",
      tone: "gold",
    },
    {
      id: "risk",
      title: "RIESGO ACTUAL",
      metric: "Urgencia",
      note: "Sin sistema: paros, reprocesos, pérdidas y desgaste operativo.",
      tone: "red",
    },
  ];

  const toneCls = (tone: VaultItem["tone"]) => {
    switch (tone) {
      case "emerald":
        return "border-emerald-400/25 hover:border-emerald-300/60 hover:shadow-[0_0_38px_rgba(52,211,153,0.18)]";
      case "gold":
        return "border-yellow-400/25 hover:border-yellow-300/60 hover:shadow-[0_0_38px_rgba(250,204,21,0.16)]";
      case "cyan":
        return "border-cyan/25 hover:border-cyan/60 hover:shadow-[0_0_38px_rgba(0,240,255,0.16)]";
      case "red":
      default:
        return "border-red-400/25 hover:border-red-300/60 hover:shadow-[0_0_38px_rgba(248,113,113,0.16)]";
    }
  };

  const activeItem = items.find((x) => x.id === active) ?? items[0];

  return (
    <div className="w-full h-full animate-fade-up px-10 py-6 flex gap-8">
      {/* LISTA */}
      <div className="w-[44%] flex flex-col gap-4 justify-center">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              onClick={() => setActive(it.id)}
              className={
                "text-left group relative rounded-2xl border bg-black/35 p-6 min-h-[110px] " +
                "transition-all duration-300 overflow-hidden hover:-translate-y-[2px] " +
                toneCls(it.tone) +
                (isActive ? " ring-1 ring-white/15 bg-white/5" : "")
              }
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-white font-display font-black text-xl tracking-wide">
                    {it.title}
                  </div>
                  <div className="text-xs font-code text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded">
                    {it.metric}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-300 leading-relaxed">
                  {it.note}
                </div>

                {isActive && (
                  <div className="mt-3 text-xs font-code tracking-[0.2em] text-white/70">
                    SELECTED
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* DETALLE */}
      <div className="w-[56%] flex items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-black/45 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.14),transparent_65%)]" />
          <div className="relative">
            <div className="text-gray-400 font-code tracking-[0.18em] text-sm mb-3">
              TRACTION VAULT
            </div>

            <div className="text-4xl font-black text-white mb-2">
              {activeItem.title}
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm font-code px-3 py-1 rounded border border-white/10 bg-white/5 text-gray-200">
                {activeItem.metric}
              </span>
              <span className="text-sm font-code px-3 py-1 rounded border border-white/10 bg-white/5 text-gray-200">
                Evidencia + Sistema
              </span>
            </div>

            <p className="text-lg text-gray-200 leading-relaxed">
              {activeItem.note}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-code text-gray-400">Estado</div>
                <div className="text-xl font-black text-white">Activo</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-code text-gray-400">Impacto</div>
                <div className="text-xl font-black text-gold">Alto</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-code text-gray-400">Riesgo</div>
                <div className="text-xl font-black text-red-300">Controlable</div>
              </div>
            </div>

            <div className="mt-6 text-xs font-code text-gray-400">
              Tip: si cambias copy aquí, NO rompes el renderer. Eso es justamente el punto 😏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TractionVault;
