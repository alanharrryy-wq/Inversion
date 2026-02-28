import React from "react";
import { DataBox } from "../../SlideRenderer";

const LAYERS = [
  {
    id: "layer-entry",
    title: "ENTRY LAYER",
    tag: "ONE-TIME",
    detail: "Diagnóstico + baseline para controlar terreno técnico y riesgo inicial.",
  },
  {
    id: "layer-recurring",
    title: "RECURRING LAYER",
    tag: "MONTHLY",
    detail: "Mantenimiento predictivo con evidencia, control de cambios y KPIs trazables.",
  },
  {
    id: "layer-upside",
    title: "UPSIDE LAYER",
    tag: "PROJECTS",
    detail: "Optimización y upgrades sobre activos ya estandarizados por sistema.",
  },
];

const MITIGATIONS = [
  "Dependencia del técnico -> SOP + checklists + docs",
  "Variabilidad de ejecución -> baseline + score operacional",
  "Cobranza tardía -> hitos y pruebas de entrega verificables",
];

export function InvestorLayersPanel() {
  return (
    <DataBox
      title="INVESTOR VIEW"
      rightTag="FUSED FROM LEGACY 16_INVESTOR"
      className="h-full border-gold/35"
      highlight="gold"
    >
      <div data-stable-id="slide09-investor-layers" className="space-y-3">
        {LAYERS.map((layer) => (
          <article
            key={layer.id}
            className="rounded-xl border border-white/12 bg-black/35 p-3"
            data-stable-id={layer.id}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-code tracking-[0.22em] text-gold">{layer.title}</h4>
              <span className="rounded border border-gold/30 bg-gold/10 px-2 py-1 text-[10px] font-code tracking-[0.2em] text-gold">
                {layer.tag}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-300">{layer.detail}</p>
          </article>
        ))}

        <div className="rounded-xl border border-cyan/25 bg-cyan/10 p-3">
          <h5 className="text-xs font-code tracking-[0.24em] text-cyan">RISK MITIGATION STACK</h5>
          <ul className="mt-2 space-y-2 text-sm text-gray-200">
            {MITIGATIONS.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DataBox>
  );
}
