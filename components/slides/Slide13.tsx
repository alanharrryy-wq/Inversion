import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import { KpiRitual } from "./slide13-ui/routeb";

export const Slide13: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="KPIs DEL SISTEMA" breadcrumb="RESULTADOS" slideNum={13} />
    <KpiRitual />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);
