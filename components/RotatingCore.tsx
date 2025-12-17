import React from "react";

const RotatingCore: React.FC = () => {
  return (
    <div className="w-full h-full max-h-[500px] flex items-center justify-center relative animate-fade-up">
      <div className="absolute w-[350px] h-[350px] rounded-full border border-white/10 animate-spin-slow"></div>
      <div
        className="absolute w-[250px] h-[250px] rounded-full border border-white/20 animate-spin-slow"
        style={{ animationDirection: "reverse" }}
      ></div>

      <div className="absolute w-[350px] h-[350px] animate-spin-slow pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black border border-gold rounded-full flex items-center justify-center text-[0.5rem] text-gold font-bold">
          CAD
        </div>
      </div>

      <div
        className="absolute w-[250px] h-[250px] animate-spin-slow pointer-events-none"
        style={{ animationDirection: "reverse" }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 bg-black border border-cyan rounded-full flex items-center justify-center text-[0.5rem] text-cyan font-bold">
          CONTROL
        </div>
      </div>

      <div className="relative z-10 w-40 h-40 bg-black/80 border-4 border-gold rounded-full flex flex-col items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.3)] group cursor-pointer hover:scale-110 transition-transform">
        <h3 className="text-3xl font-display font-black text-white">CORE</h3>
        <span className="text-gold font-code text-xs">KNOWLEDGE</span>
      </div>
    </div>
  );
};

export default RotatingCore;
