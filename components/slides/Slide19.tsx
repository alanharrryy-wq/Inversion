import React, { ReactNode } from 'react';
import { SlideContainer, NavArea } from '../SlideRenderer';

// Local copy of DataBox to avoid circular dependency with SlideRenderer
const DataBox: React.FC<{
  children?: ReactNode;
  className?: string;
  highlight?: "cyan" | "gold";
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ children, className = "", highlight = "cyan", onClick, style }) => {
  const hl =
    highlight === "gold"
      ? "hover:border-gold hover:shadow-[0_0_20px_rgba(255,215,0,0.12)]"
      : "hover:border-cyan hover:shadow-[0_0_20px_rgba(0,240,255,0.12)]";

  const cornerA = highlight === "gold" ? "border-gold" : "border-cyan";
  const cornerB = highlight === "gold" ? "border-cyan" : "border-gold";

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        border border-white/20 bg-black/40 p-6 relative w-full transition-all duration-300
        ${hl}
        ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}
        ${className}
      `}
    >
      <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[2px] border-l-[2px] ${cornerA}`} />
      <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[2px] border-r-[2px] ${cornerB}`} />
      {children}
    </div>
  );
};

interface Slide19Props {
  goToSlide: (idx: number) => void;
  prevSlide: () => void;
}

export const Slide19: React.FC<Slide19Props> = ({ goToSlide, prevSlide }) => {
  return (
    <SlideContainer>
       <div className="row-span-2 h-full flex flex-col justify-center items-center text-center animate-fade-up relative">
          <h2 className="font-elegant text-gold text-[4rem] font-bold mb-8 leading-tight drop-shadow-[4px_4px_0_#000]">
             "Estoy relanzando HITECH con orden, sistema y visión."
          </h2>
          <DataBox highlight="gold" className="max-w-4xl animate-pulse-border-gold mb-12">
             <p className="text-[2rem] text-white leading-relaxed m-0 animate-fade-up opacity-0" style={{ animationDelay: '0.5s' }}>
                "No invertir en esto no sería rechazarme a mí...<br />
                <strong>sería rechazar una oportunidad que ya está generando dinero.</strong>"
             </p>
             <p className="text-right text-gold font-code mt-4 text-xl opacity-0 animate-fade-up" style={{ animationDelay: '1s' }}>— MARIO, CEO</p>
          </DataBox>
          
          <div className="flex flex-col gap-2 opacity-0 animate-fade-up" style={{ animationDelay: '1.5s' }}>
            <p className="text-cyan font-code tracking-[6px] text-xl font-bold">CONTACTO@HITECH-RTS.COM</p>
            <p className="text-gray-500 font-code tracking-[4px] text-sm">HITECH RTS SYSTEM // 2025</p>
          </div>
       </div>
       <NavArea prev={prevSlide} next={() => goToSlide(0)} isHome={true} />
    </SlideContainer>
  );
};