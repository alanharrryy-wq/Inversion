
import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import TractionVault from "../widgets/TractionVault";

export const Slide03: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="TRACCIÓN" breadcrumb="EVIDENCIA" slideNum={4} />
    <TractionVault />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);

