import React from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import { Slide03Experience } from "./slide03-ui";

export const Slide03: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  return (
    <SlideContainer>
      <div data-testid="slide03-root" className="w-full h-full">
        <Header title="EVIDENCE LADDER" breadcrumb="PROOF" slideNum={4} />
        <Slide03Experience />
        <NavArea prev={prevSlide} next={nextSlide} />
      </div>
    </SlideContainer>
  );
};
