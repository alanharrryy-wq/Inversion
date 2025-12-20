import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import MissionProgressBarWidget from "../widgets/MissionProgressBar";

export const Slide14: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <Header title="PLAN 90 DÍAS" breadcrumb="EJECUCIÓN" slideNum={14} />
    <MissionProgressBarWidget />
    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);
