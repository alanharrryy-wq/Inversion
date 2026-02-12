import React from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import { Slide01Scene } from "./slide01-ui";

type Slide01Props = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export const Slide01: React.FC<Slide01Props> = ({ nextSlide, prevSlide }) => {
  return (
    <div data-testid="slide-01-root" className="w-full h-full">
      <SlideContainer>
        <Header title="ROUTE SELECTOR" breadcrumb="DIAGNOSTIC DECISION" slideNum={2} />
        <Slide01Scene />
        <NavArea prev={prevSlide} next={nextSlide} />
      </SlideContainer>
    </div>
  );
};
