import React, { ReactNode, useRef, useState } from "react";

export function SlideContainer({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full bg-panel border border-cyan/30 rounded-lg shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] p-8 grid grid-rows-[12%_78%_10%] gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function Header({ title, breadcrumb, slideNum }: { title: string; breadcrumb: string; slideNum: number }) {
  return (
    <div className="flex justify-between items-end border-b-2 border-white/10 pb-2 h-full">
      <div className="animate-fade-up">
        <div className="font-code text-gold text-lg tracking-[2px] font-bold mb-0 leading-none">{breadcrumb}</div>
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

export function NavArea({ prev, next, isHome }: { prev: () => void; next?: () => void; isHome?: boolean }) {
  return (
    <div className="flex justify-center gap-6 items-center pt-1 h-full">
      <button onClick={prev} className="bg-black/80 border border-cyan text-cyan px-6 py-2 font-display text-lg tracking-widest font-bold uppercase hover:bg-cyan hover:text-black hover:shadow-[0_0_20px_#00F0FF] transition-all">
        ANTERIOR
      </button>
      {next && (
        <button onClick={next} className="bg-black/80 border border-cyan text-cyan px-6 py-2 font-display text-lg tracking-widest font-bold uppercase hover:bg-cyan hover:text-black hover:shadow-[0_0_20px_#00F0FF] transition-all">
          {isHome ? "INICIO" : "SIGUIENTE"}
        </button>
      )}
    </div>
  );
}

// Si lo ocupas luego para varias slides:
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
      <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t-[2px] border-l-[2px] ${cornerA}`} />
      <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-[2px] border-r-[2px] ${cornerB}`} />
      {children}
    </div>
  );
};

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
