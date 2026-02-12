import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import TractionVault from "../widgets/TractionVault";

export const Slide03: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <div data-testid="slide-03-root" className="w-full h-full">
    <SlideContainer>
      <Header title="TRACCIÓN" breadcrumb="EVIDENCIA" slideNum={4} />
      <TractionVault />
      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  </div>
);
