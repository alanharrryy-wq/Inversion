import React from "react";
import { SlideContainer, Header, NavArea, DataBox } from "../SlideRenderer";
import { WOW_CASE_REVEAL, WOW_DEMO } from "../../config/wow";
import { usePrefersReducedMotion } from "../../wow";

export const Slide17: React.FC<{
  nextSlide: () => void;
  prevSlide: () => void;
  openModal: (images: string[], title: string) => void;
}> = ({ nextSlide, prevSlide, openModal }) => {
  const reducedMotion = usePrefersReducedMotion();
  const wowCaseReveal = WOW_DEMO && WOW_CASE_REVEAL && !reducedMotion;

  return (
    <SlideContainer>
      <Header title="CASO SRG" breadcrumb="EVIDENCIA" slideNum={18} />

      <div className={`grid grid-cols-2 gap-6 h-full ${wowCaseReveal ? "wow-case-reveal-shell" : ""}`}>
        <DataBox
          className={`h-full flex flex-col justify-center items-center text-center hover:bg-white/5 ${
            wowCaseReveal ? "wow-case-reveal-card wow-fx-layer wow-fx-grain wow-fx-vignette wow-fx-glow-cyan" : ""
          }`}
          data-step={1}
          onClick={() => openModal([], "CASO SRG")}
        >
          <div className="text-4xl mb-3">🛰️</div>
          <div className="text-2xl font-bold text-white">Abrir evidencia</div>
          <div className="text-sm text-gray-300 mt-2">
            Click para ver imágenes / capturas (modal).
          </div>
        </DataBox>

        <DataBox
          className={`h-full flex flex-col justify-center hover:bg-white/5 ${
            wowCaseReveal ? "wow-case-reveal-card wow-fx-layer wow-fx-grain wow-fx-vignette" : ""
          }`}
          data-step={2}
        >
          <div className="text-white font-bold text-xl mb-2">Resumen</div>
          <div className="text-gray-300 text-sm leading-relaxed">
            Aquí va el resumen del caso (paros evitados, tiempo de respuesta, riesgo mitigado, etc.).
          </div>
          {wowCaseReveal && (
            <div data-step={3} className="mt-4 rounded-lg border border-cyan/25 bg-cyan/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-cyan/85 wow-case-reveal-card">
              Case reveal mode: evidence first, then summary.
            </div>
          )}
        </DataBox>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide17;
