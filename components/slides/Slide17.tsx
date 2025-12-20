import React from "react";
import { SlideContainer, Header, NavArea, DataBox } from "../SlideRenderer";

export const Slide17: React.FC<{
  nextSlide: () => void;
  prevSlide: () => void;
  openModal: (images: string[], title: string) => void;
}> = ({ nextSlide, prevSlide, openModal }) => {
  return (
    <SlideContainer>
      <Header title="CASO SRG" breadcrumb="EVIDENCIA" slideNum={18} />

      <div className="grid grid-cols-2 gap-6 h-full">
        <DataBox
          className="h-full flex flex-col justify-center items-center text-center hover:bg-white/5"
          onClick={() => openModal([], "CASO SRG")}
        >
          <div className="text-4xl mb-3">🛰️</div>
          <div className="text-2xl font-bold text-white">Abrir evidencia</div>
          <div className="text-sm text-gray-300 mt-2">
            Click para ver imágenes / capturas (modal).
          </div>
        </DataBox>

        <DataBox className="h-full flex flex-col justify-center hover:bg-white/5">
          <div className="text-white font-bold text-xl mb-2">Resumen</div>
          <div className="text-gray-300 text-sm leading-relaxed">
            Aquí va el resumen del caso (paros evitados, tiempo de respuesta, riesgo mitigado, etc.).
          </div>
        </DataBox>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide17;
