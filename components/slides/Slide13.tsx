import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import { KpiDashboard } from "../widgets/kpi/KpiDashboard";

export const Slide13: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="KPIs DEL SISTEMA" breadcrumb="RESULTADOS" slideNum={13} />
    <KpiDashboard />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);
