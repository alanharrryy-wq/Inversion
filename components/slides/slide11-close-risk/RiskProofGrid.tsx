import React from "react";

type RiskItem = {
  id: string;
  title: string;
  risk: string;
  mitigation: string;
};

const RISK_ITEMS: RiskItem[] = [
  {
    id: "risk-technical",
    title: "TÉCNICO",
    risk: "Falla compleja no resuelta en rectificadores industriales.",
    mitigation:
      "Diagnóstico estructurado + evidencia técnica + escalamiento de ingeniería por nivel.",
  },
  {
    id: "risk-financial",
    title: "FINANCIERO",
    risk: "Demoras de cobro en ventanas 30-60 días.",
    mitigation:
      "Operación por hitos técnicos con evidencia verificable para cierre y facturación.",
  },
  {
    id: "risk-operations",
    title: "OPERATIVO",
    risk: "Dependencia de conocimiento en personas clave.",
    mitigation:
      "SOP + checklists + bitácoras versionadas para transferibilidad real del sistema.",
  },
  {
    id: "risk-scale",
    title: "ESCALABILIDAD",
    risk: "Crecimiento sin estandarización degrada calidad.",
    mitigation:
      "Módulos replicables y trazabilidad de ejecución para expansión controlada.",
  },
];

export function RiskProofGrid() {
  return (
    <div data-stable-id="slide11-risk-grid" className="grid grid-cols-2 gap-4">
      {RISK_ITEMS.map((item) => (
        <article
          key={item.id}
          className="group rounded-xl border border-white/12 bg-black/35 p-4 transition-all duration-300 hover:border-cyan/45"
          data-stable-id={item.id}
        >
          <p className="text-xs font-code tracking-[0.24em] text-cyan/80">{item.title}</p>
          <h4 className="mt-1 text-lg font-semibold text-white">{item.risk}</h4>
          <p className="mt-2 text-sm text-gray-300">{item.mitigation}</p>
        </article>
      ))}
    </div>
  );
}
