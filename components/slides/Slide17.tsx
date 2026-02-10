import React from "react";
import { SlideContainer, Header, NavArea, DataBox } from "../SlideRenderer";
import { WOW_CASE_REVEAL, WOW_DEMO } from "../../config/wow";
import { usePrefersReducedMotion } from "../../wow";
import { emitTourEvent } from "../../wow/tour";

export const Slide17: React.FC<{
  nextSlide: () => void;
  prevSlide: () => void;
  openModal: (images: string[], title: string) => void;
}> = ({ nextSlide, prevSlide, openModal }) => {
  const reducedMotion = usePrefersReducedMotion();
  const wowCaseReveal = WOW_DEMO && WOW_CASE_REVEAL && !reducedMotion;
  const finaleClass = wowCaseReveal ? "wow-s17-finale" : "";

  return (
    <SlideContainer>
      <Header title="CASO SRG" breadcrumb="EVIDENCIA" slideNum={18} />

      <style>{`
        .wow-s17-finale .wow-s17-evidence {
          box-shadow: 0 26px 90px rgba(0,0,0,0.55), 0 0 38px rgba(2,167,202,0.22);
          border-color: rgba(2,167,202,0.46);
        }
        .wow-s17-finale .wow-s17-kpi {
          border-color: rgba(171,123,38,0.48);
          box-shadow: 0 0 24px rgba(171,123,38,0.22);
        }
        .wow-s17-finale .wow-s17-cta {
          border: 1px solid rgba(255,255,255,0.25);
          background: linear-gradient(180deg, rgba(2,167,202,0.16), rgba(2,167,202,0.08));
          box-shadow: 0 0 22px rgba(2,167,202,0.18);
        }
      `}</style>

      <div className={`grid grid-cols-2 gap-6 h-full ${wowCaseReveal ? "wow-case-reveal-shell" : ""} ${finaleClass}`}>
        <DataBox
          className={`h-full flex flex-col justify-center items-center text-center hover:bg-white/5 ${
            wowCaseReveal ? "wow-case-reveal-card wow-fx-layer wow-fx-grain wow-fx-vignette wow-fx-glow-cyan wow-s17-evidence" : ""
          }`}
          data-step={1}
          data-testid="s17-open-evidence"
          onClick={() => {
            openModal([], "CASO SRG");
            emitTourEvent("case:evidence-opened");
          }}
        >
          <div className="text-4xl mb-3">🛰️</div>
          <div className="text-2xl font-bold text-white">Abrir evidencia</div>
          <div className="text-sm text-gray-300 mt-2">
            Click para ver imágenes / capturas (modal).
          </div>
        </DataBox>

        <DataBox
          className={`h-full flex flex-col justify-center hover:bg-white/5 ${
            wowCaseReveal ? "wow-case-reveal-card wow-fx-layer wow-fx-grain wow-fx-vignette wow-s17-kpi" : ""
          }`}
          data-step={2}
        >
          <div className="text-white font-bold text-xl mb-2">Resumen</div>
          <div className="text-gray-300 text-sm leading-relaxed">
            Aquí va el resumen del caso (paros evitados, tiempo de respuesta, riesgo mitigado, etc.).
          </div>
          {wowCaseReveal && (
            <div data-step={3} className="mt-4 rounded-lg border border-cyan/25 bg-cyan/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-cyan/85 wow-case-reveal-card">
              Evidence first. KPI commitment second.
            </div>
          )}
          {wowCaseReveal && (
            <button
              type="button"
              data-testid="s17-kpi-cta"
              onClick={() => emitTourEvent("case:kpi-committed")}
              className="wow-s17-cta mt-4 rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100"
            >
              Deployable in 30 days
            </button>
          )}
        </DataBox>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide17;
