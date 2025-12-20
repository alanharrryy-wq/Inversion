import React from "react";
import { SlideContainer, NavArea } from "../SlideRenderer";

export const Slide00: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => (
  <SlideContainer>
    <div className="border-b-2 border-white/10"></div>

    <div className="grid grid-cols-1 place-items-center text-center content-center h-full">
      <div className="animate-fade-up">
        <div className="font-code text-gold text-2xl tracking-[2px] font-bold mb-2">
          SYSTEM_BOOT // V2.2
        </div>
        <h1 className="font-display text-[7rem] tracking-[10px] text-white font-black drop-shadow-[4px_4px_0_#000] mb-2 leading-none">
          HITECH RTS
        </h1>
        <div className="text-4xl tracking-[5px] text-gold font-bold drop-shadow-[2px_2px_4px_#000] mb-10">
          SISTEMA DE GESTIÓN INTEGRAL
        </div>
        <div className="animate-fade-up inline-block px-12 py-4 border-2 border-cyan bg-cyan/5" style={{ animationDelay: "0.2s" }}>
          <p className="font-code text-2xl text-white tracking-[4px] font-bold m-0">
            ESTATUS: OPERATIVO 🟢
          </p>
        </div>
      </div>
    </div>

    <NavArea prev={prevSlide} next={nextSlide} />
  </SlideContainer>
);
