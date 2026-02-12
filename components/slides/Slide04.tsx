import React from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import { Slide04Root } from "./slide04-ui";

type Slide04Props = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export const Slide04: React.FC<Slide04Props> = ({ nextSlide, prevSlide }) => {
  return (
    <SlideContainer>
      <Header title="FINAL LOCK + HANDOFF" breadcrumb="LOCK-IN" slideNum={5} />
      <Slide04Root />
      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide04;
