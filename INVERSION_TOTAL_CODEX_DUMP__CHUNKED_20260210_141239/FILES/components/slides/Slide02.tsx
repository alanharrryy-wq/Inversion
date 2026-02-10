
import React, { useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";

export const Slide02: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  const [sliderVal, setSliderVal] = useState(95);

  return (
    <SlideContainer>
      <Header title="INSIGHT" breadcrumb="ORIGEN" slideNum={3} />

      <div className="flex flex-col h-full justify-center">
        <div className="w-full h-full max-h-[500px] relative select-none animate-fade-up border border-white/20 rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-[#050505] flex items-center justify-center z-0">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/20 to-transparent" />
            <div className="text-center z-10">
              <h3 className="text-6xl font-display font-black text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] mb-2">
                SISTEMA
              </h3>
              <p className="text-xl text-cyan font-code tracking-[8px]">HITECH RTS</p>
            </div>
          </div>

          <div
            className="absolute inset-0 bg-red-950 flex items-center justify-center overflow-hidden border-r-4 border-gold shadow-[10px_0_50px_rgba(0,0,0,0.8)] z-10"
            style={{ width: `${sliderVal}%` }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="w-screen max-w-[1600px] h-full flex items-center justify-center relative z-10">
              <div className="text-center">
                <h3 className="text-6xl font-display font-black text-red-500 line-through decoration-white/50 decoration-4 mb-2 drop-shadow-[0_4px_0_rgba(0,0,0,1)]">
                  CAOS
                </h3>
                <p className="text-xl text-white font-code tracking-[8px] font-bold drop-shadow-md">
                  MODO SUPERVIVENCIA
                </p>
              </div>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={sliderVal}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-50"
          />

          <div
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center pointer-events-none z-40 transition-transform duration-75"
            style={{ left: `calc(${sliderVal}% - 20px)` }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M14 6l6 6-6 6M10 6L4 12l6 6" fill="none" stroke="black" strokeWidth="2" />
            </svg>
          </div>

          <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none z-30">
            <span className="bg-black/50 px-3 py-1 rounded text-white font-code text-xs border border-white/20 tracking-widest">
              DESLIZA PARA EVOLUCIONAR
            </span>
          </div>
        </div>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

