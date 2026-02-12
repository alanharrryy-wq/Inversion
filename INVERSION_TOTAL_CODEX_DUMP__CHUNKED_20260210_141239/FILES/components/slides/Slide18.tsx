
import React from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';

const RiskDefenseSystem = () => {
 const risks = [
  { title: "TÉCNICO", risk: "Falla compleja no resuelta en rectificadores industriales.", mitigation: "Metodología HITECH: diagnóstico estructurado, evidencia técnica, respaldo de ingeniería y escalamiento por nivel (campo → especialista → fabricante).", tone: "red", icon: "⚠️" },
  { title: "FINANCIERO", risk: "Retraso en pago de clientes industriales (30–60 días).", mitigation: "Pipeline activo (SRG, LEAR, integradores), ejecución por módulos y control de cierre técnico-documental para asegurar facturación y cobro.", tone: "red", icon: "⚠️" },
  { title: "OPERATIVO", risk: "Dependencia de conocimiento en personas clave.", mitigation: "Sistema HITECH v2.0: SOPs, checklists, bitácoras, planos y control de cambios. El conocimiento vive en el sistema, no en la memoria.", tone: "emerald", icon: "🛡️" },
  { title: "ESCALABILIDAD", risk: "Crecimiento limitado sin estandarización.", mitigation: "Ejecución por procesos repetibles, módulos técnicos definidos y documentación que permite replicar servicio sin perder calidad.", tone: "emerald", icon: "🛡️" },
];
  const cardBase = "group relative rounded-2xl border bg-black/35 p-8 min-h-[150px] transition-all duration-300 overflow-hidden hover:-translate-y-[2px]";
  const toneCls = (tone: "red" | "emerald") => { if (tone === "emerald") return "border-emerald-400/25 hover:border-emerald-300/60 hover:shadow-[0_0_38px_rgba(52,211,153,0.18)]"; return "border-red-500/25 hover:border-red-400/60 hover:shadow-[0_0_38px_rgba(255,80,80,0.18)]"; };
  const barCls = (tone: "red" | "emerald") => { if (tone === "emerald") return "bg-emerald-300/0 group-hover:bg-emerald-300/70"; return "bg-red-400/0 group-hover:bg-red-400/70"; };
  const labelCls = (tone: "red" | "emerald") => { if (tone === "emerald") return "text-emerald-300"; return "text-red-300"; };

  return (
    <div className="mt-10 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 gap-10">
        {risks.map((r) => (
          <div key={r.title} className={`${cardBase} ${toneCls(r.tone as any)}`}>
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
            <div className={`pointer-events-none absolute left-0 right-0 bottom-0 h-[2px] transition-colors duration-300 ${barCls(r.tone as any)}`} />
            <div className="relative z-10 flex items-start justify-between gap-6 transition-opacity duration-300 group-hover:opacity-0">
              <div><div className={`${labelCls(r.tone as any)} font-code text-xs tracking-[4px] mb-2`}>{r.title}</div><div className="text-offwhite text-xl font-semibold">{r.risk}</div><div className="mt-2 text-gray-200/70 text-sm leading-relaxed">Hover para ver mitigación.</div></div><div className={`${labelCls(r.tone as any)} text-2xl`}>{r.icon}</div>
            </div>
            <div className="absolute inset-0 z-20 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/75">
              <div className="flex items-start justify-between gap-6">
                <div><div className={`${labelCls(r.tone as any)} font-code text-xs tracking-[4px] mb-2`}>{r.title} — MITIGACIÓN</div><div className="text-offwhite text-xl font-semibold mb-2">{r.risk}</div><p className="text-gray-200 text-sm leading-relaxed">{r.mitigation}</p><div className="mt-4 text-xs font-code tracking-[4px] text-cyan/60">CONTROL / EVIDENCIA / TRAZABILIDAD</div></div><div className={`${labelCls(r.tone as any)} text-2xl`}>{r.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center text-xs text-gray-400">Los riesgos existen. Lo importante es que están <span className="text-cyan">controlados por sistema</span>.</div>
    </div>
  );
};

interface Slide18Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Slide18: React.FC<Slide18Props> = ({ nextSlide, prevSlide }) => {
  return (
    <SlideContainer>
       <Header title="RIESGOS" breadcrumb="REALIDAD" slideNum={19} />
       <RiskDefenseSystem />
       <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};
