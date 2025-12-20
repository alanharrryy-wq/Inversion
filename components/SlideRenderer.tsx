import React, { ReactNode, useRef, useState } from "react";

import { Slide5 } from "./slides/Slide5";
import { Slide06 } from "./slides/Slide06";
import { Slide7 } from "./slides/Slide7";
import { Slide12 } from "./slides/Slide12";
import { Slide17 } from "./slides/Slide17";
import { Slide18 } from "./slides/Slide18";
import { Slide19 } from "./slides/Slide19";

// NEW extracted slides
import { Slide00 } from "./slides/Slide00";
import { Slide01 } from "./slides/Slide01";
import { Slide02 } from "./slides/Slide02";
import { Slide03 } from "./slides/Slide03";
import { Slide04 } from "./slides/Slide04";
import { Slide08 } from "./slides/Slide08";
import { Slide10 } from "./slides/Slide10";
import { Slide13 } from "./slides/Slide13";
import { Slide14 } from "./slides/Slide14";
import { Slide15 } from "./slides/Slide15";
import { Slide16 } from "./slides/Slide16";
import { Slide09 } from "./slides/Slide09";
import { Slide16_Investor } from "./slides/Slide16_Investor";


interface SlideProps {
  index: number;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (idx: number) => void;
  openModal: (images: string[], title: string) => void;
}

// --- UTILITY COMPONENTS ---

export function SlideContainer({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full bg-panel border border-cyan/30 rounded-lg shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] p-8 grid grid-rows-[12%_78%_10%] gap-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function Header({
  title,
  breadcrumb,
  slideNum,
}: {
  title: string;
  breadcrumb: string;
  slideNum: number;
}) {
  return (
    <div className="flex justify-between items-end border-b-2 border-white/10 pb-2 h-full">
      <div className="animate-fade-up">
        <div className="font-code text-gold text-lg tracking-[2px] font-bold mb-0 leading-none">
          {breadcrumb}
        </div>
        <h2 className="font-display font-black text-5xl text-white uppercase leading-none shadow-black drop-shadow-md mt-1">
          {title}
        </h2>
      </div>
      <div className="font-display text-5xl text-white/15 font-black leading-none">
        {slideNum.toString().padStart(2, "0")}
      </div>
    </div>
  );
}

export function NavArea({
  prev,
  next,
  isHome,
}: {
  prev: () => void;
  next?: () => void;
  isHome?: boolean;
}) {
  return (
    <div className="flex justify-center gap-6 items-center pt-1 h-full">
      <button
        onClick={prev}
        className="bg-black/80 border border-cyan text-cyan px-6 py-2 font-display text-lg tracking-widest font-bold uppercase hover:bg-cyan hover:text-black hover:shadow-[0_0_20px_#00F0FF] transition-all"
      >
        ANTERIOR
      </button>
      {next && (
        <button
          onClick={next}
          className="bg-black/80 border border-cyan text-cyan px-6 py-2 font-display text-lg tracking-widest font-bold uppercase hover:bg-cyan hover:text-black hover:shadow-[0_0_20px_#00F0FF] transition-all"
        >
          {isHome ? "INICIO" : "SIGUIENTE"}
        </button>
      )}
    </div>
  );
}

export const DataBox: React.FC<{
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
      <div
        className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[2px] border-l-[2px] ${cornerA}`}
      />
      <div
        className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[2px] border-r-[2px] ${cornerB}`}
      />
      {children}
    </div>
  );
};

export const TextList = ({
  items,
}: {
  items: { title: string; desc: string }[] | string[];
}) => (
  <ul className="space-y-4">
    {items.map((item, idx) => (
      <li
        key={idx}
        className="pl-6 relative text-2xl text-offwhite font-medium leading-normal"
      >
        <span className="absolute left-0 text-cyan top-1 text-lg">►</span>
        {typeof item === "string" ? (
          <span dangerouslySetInnerHTML={{ __html: item }} />
        ) : (
          <>
            <strong className="text-white">{item.title}:</strong>{" "}
            <span className="text-gray-300">{item.desc}</span>
          </>
        )}
      </li>
    ))}
  </ul>
);

export const LensWrapper = ({ children }: { children?: ReactNode }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
    setActive(true);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setActive(false)}
      className="relative overflow-hidden cursor-crosshair group w-full h-full"
    >
      <div
        className="transition-transform duration-100 ease-out w-full h-full origin-center"
        style={{
          transformOrigin: `${pos.x}% ${pos.y}%`,
          transform: active ? "scale(2)" : "scale(1)",
        }}
      >
        {children}
      </div>
      {!active && (
        <div className="absolute top-2 right-2 text-cyan/50 text-xs border border-cyan/30 px-2 rounded bg-black/50 pointer-events-none">
          HOVER TO ZOOM
        </div>
      )}
    </div>
  );
};

// --- SLIDE RENDERER ---

const SlideRenderer: React.FC<SlideProps> = ({
  index,
  nextSlide,
  prevSlide,
  goToSlide,
  openModal,
}) => {
  switch (index) {
    case 0:
      return <Slide00 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 1:
      return <Slide01 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 2:
      return <Slide02 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 3:
      return <Slide03 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 4:
      return <Slide04 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 5:
      return <Slide5 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 6:
      return (
        <Slide06
          nextSlide={nextSlide}
          prevSlide={prevSlide}
          goToSlide={goToSlide}
          openModal={openModal}
        />
      );

    case 7:
      return <Slide7 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 8:
      return <Slide08 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 9:
      return <Slide09 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 10:
      return <Slide10 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 11:
      return <Slide12 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 12:
      return <Slide13 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 13:
      return <Slide14 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 14:
      return <Slide15 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 15:
      return <Slide16 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 16:
      return <Slide16_Investor nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 17:
      return (
        <Slide17 nextSlide={nextSlide} prevSlide={prevSlide} openModal={openModal} />
      );

    case 18:
      return <Slide18 nextSlide={nextSlide} prevSlide={prevSlide} />;

    case 19:
      return <Slide19 goToSlide={goToSlide} prevSlide={prevSlide} />;

    default:
      return (
        <SlideContainer>
          <Header
            title="SLIDE NO CONFIGURADA"
            breadcrumb="DEBUG"
            slideNum={index + 1}
          />

          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="text-6xl">⚠️</div>
            <div className="text-2xl font-bold text-white">
              No existe un <span className="text-cyan font-code">case</span> para este índice
            </div>
            <div className="text-lg text-gray-300">
              index actual:
              <span className="ml-2 px-3 py-1 bg-black/60 border border-cyan/40 rounded font-code text-cyan">
                {index}
              </span>
            </div>
            <div className="text-sm text-gray-400 max-w-xl">
              Esto es un fallback de seguridad.
              Si ves esta slide, significa que el índice no está mapeado en el switch.
            </div>
          </div>

          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
  }
};

export default SlideRenderer;
