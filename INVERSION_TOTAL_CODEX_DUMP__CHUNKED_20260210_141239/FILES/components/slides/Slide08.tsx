
import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import IndustrialIntelligenceStack from "../IndustrialStack";

export const Slide08: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="SISTEMA HITECH" breadcrumb="ARQUITECTURA" slideNum={9} />
    <IndustrialIntelligenceStack />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);

