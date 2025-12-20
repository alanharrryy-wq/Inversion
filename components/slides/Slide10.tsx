import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import HolographicFilesWidget from "../widgets/HolographicFiles";

export const Slide10: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="DOCUMENTACIÓN" breadcrumb="SOPORTE" slideNum={11} />
    <div className="flex flex-col justify-center h-full">
      <p className="mb-10 text-center text-xl text-gray-200">
        Si no está escrito, no existe. El rastro documental nos protege.
      </p>
      <HolographicFilesWidget />
    </div>
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);
