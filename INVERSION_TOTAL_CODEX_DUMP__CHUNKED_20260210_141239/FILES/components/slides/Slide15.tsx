
import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import FinancialEquation from "../widgets/FinancialEquation";

export const Slide15: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="RESUMEN NUMÉRICO" breadcrumb="CAPITAL" slideNum={15} />
    <FinancialEquation />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);

