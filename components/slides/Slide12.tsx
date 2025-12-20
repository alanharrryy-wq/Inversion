import React from 'react';
import { SlideContainer, Header, NavArea } from '../Slide/SlideShell';
import RotatingCore from '../RotatingCore'; // AJUSTA si está en otra ruta

interface Slide12Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Slide12: React.FC<Slide12Props> = ({ nextSlide, prevSlide }) => {
  return (
    <SlideContainer>
      <Header title="HITECH CORE" breadcrumb="CEREBRO" slideNum={12} />

      <div className="grid grid-cols-[30%_70%] gap-8 items-center h-full">
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-3xl text-offwhite mb-6">
            El núcleo centralizado donde vive tu conocimiento:
          </p>

          <ul className="space-y-4 text-xl text-gray-300">
            <li className="flex items-center">
              <span className="text-gold mr-2">●</span>
              Modelos 3D Reutilizables
            </li>
            <li className="flex items-center">
              <span className="text-gold mr-2">●</span>
              Protocolos Estandarizados
            </li>
            <li className="flex items-center">
              <span className="text-gold mr-2">●</span>
              Control de Cambios
            </li>
          </ul>
        </div>

        <RotatingCore />
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide12;
