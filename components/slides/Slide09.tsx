import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import ProcessFlow from "../widgets/ProcessFlow";

export const Slide09: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  return (
    <SlideContainer>
      <Header title="MAPA DE PROCESOS" breadcrumb="FLUJO" slideNum={10} />
      <ProcessFlow />
      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide09;
