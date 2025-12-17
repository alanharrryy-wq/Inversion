
import React from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';
import InteractiveDealSelector from '../DealSelector';

interface Slide17Props {
  nextSlide: () => void;
  prevSlide: () => void;
  openModal: (images: string[], title: string) => void;
}

export const Slide17: React.FC<Slide17Props> = ({ nextSlide, prevSlide, openModal }) => {
  return (
    <SlideContainer>
      <Header title="ESTRUCTURA" breadcrumb="SOCIEDAD" slideNum={18} />
      <InteractiveDealSelector openModal={openModal} />
      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};
