import React from "react";
import { SlideContainer, Header, NavArea, DataBox } from "../SlideRenderer";

export const Slide16_Investor: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  return (
    <SlideContainer>
      <Header title="MODELO DE INGRESOS" breadcrumb="RIESGO & ESCALA" slideNum={17} />

      <div className="grid grid-cols-3 gap-6 h-full animate-fade-up">
        {/* COL 1: INGRESOS */}
        <div className="flex flex-col gap-4 h-full">
          <DataBox className="hover:bg-white/5">
            <div className="font-code text-xs text-gold tracking-[3px] mb-2">REVENUE LAYERS</div>
            <div className="text-2xl font-display font-black text-white mb-1">3 capas de ingresos</div>
            <div className="text-sm text-gray-300">
              Entrada rápida → Recurrencia → Upsells por optimización.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-white">Diagnóstico & Baseline</div>
              <span className="font-code text-xs text-cyan border border-cyan/40 bg-cyan/10 px-2 py-1 rounded">
                ONE-TIME
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Entrada rápida para estandarizar el terreno técnico.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="gold">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-white">Mantenimiento Predictivo</div>
              <span className="font-code text-xs text-gold border border-gold/40 bg-gold/10 px-2 py-1 rounded">
                RECURRENTE
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Recurrencia con entregables: evidencia, KPIs y control de cambios.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold text-white">Optimización & Upgrades</div>
              <span className="font-code text-xs text-cyan border border-cyan/40 bg-cyan/10 px-2 py-1 rounded">
                PROYECTOS
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Eleva margen sin elevar headcount: mejoras sobre base documentada.
            </div>
          </DataBox>
        </div>

        {/* COL 2: RIESGO & MITIGACIÓN */}
        <div className="flex flex-col gap-4 h-full">
          <DataBox className="hover:bg-white/5">
            <div className="font-code text-xs text-cyan tracking-[3px] mb-2">RISK CONTROL</div>
            <div className="text-2xl font-display font-black text-white mb-1">Riesgo & Mitigación</div>
            <div className="text-sm text-gray-300">
              Mitigación por diseño: SOP + evidencia + control. No depende de “un héroe”.
            </div>
          </DataBox>

          {[
            ["Paros / urgencias", "SLA + repuestos críticos + checklist"],
            ["Dependencia del técnico", "Protocolos + docs + training"],
            ["Variabilidad del equipo", "Baseline + Condition Score™"],
            ["Cobranza", "Anticipo + hitos + factoring opcional"],
            ["Cumplimiento / auditoría", "Evidencias + control de cambios"],
          ].map(([risk, fix]) => (
            <DataBox key={risk} className="hover:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="text-cyan text-lg leading-none">►</div>
                <div>
                  <div className="text-white font-bold">{risk}</div>
                  <div className="text-sm text-gray-300">{fix}</div>
                </div>
              </div>
            </DataBox>
          ))}
        </div>

        {/* COL 3: ESCALABILIDAD */}
        <div className="flex flex-col gap-4 h-full">
          <DataBox className="hover:bg-white/5">
            <div className="font-code text-xs text-gold tracking-[3px] mb-2">SCALE</div>
            <div className="text-2xl font-display font-black text-white mb-1">Escalabilidad</div>
            <div className="text-sm text-gray-300">
              Escalamos por replicación del sistema, no por bomberazos.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="cyan">
            <div className="text-white font-bold mb-1">Escala por duplicación</div>
            <div className="text-sm text-gray-300">
              1 senior → 2 juniors con SOP. Operación entrenable y repetible.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="gold">
            <div className="text-white font-bold mb-1">1 planta → N plantas</div>
            <div className="text-sm text-gray-300">
              Mismo backbone: conocimiento, KPIs, evidencia y control de cambios.
            </div>
          </DataBox>

          <DataBox className="hover:bg-white/5" highlight="cyan">
            <div className="text-white font-bold mb-2">Flywheel</div>
            <div className="text-sm text-gray-300 leading-relaxed">
              Docs → Repetibilidad → Velocidad → Margen → Referencias → Más contratos
            </div>
          </DataBox>
        </div>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide16_Investor;
