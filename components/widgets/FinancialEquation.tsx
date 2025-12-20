import React from "react";

const FinancialEquation: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center animate-fade-up px-12">
      <div className="w-full max-w-6xl grid grid-cols-3 gap-6">
        {/* COSTO ACTUAL */}
        <div className="relative rounded-2xl border border-red-500/30 bg-black/40 p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.20),transparent_60%)]" />
          <div className="relative">
            <div className="text-red-400 font-code tracking-[0.18em] text-sm mb-2">COSTO ACTUAL</div>
            <div className="text-5xl font-black text-white drop-shadow-[0_0_14px_rgba(239,68,68,0.25)]">
              $200K
            </div>
            <div className="mt-3 text-sm text-gray-300 leading-relaxed">
              Paros no planeados, urgencias, refacciones “a la carrera”, y tiempo muerto.
            </div>

            <div className="mt-5 flex gap-2 flex-wrap">
              <span className="text-xs font-code px-2 py-1 rounded border border-red-500/30 text-red-300 bg-red-950/30">
                URGENCIA
              </span>
              <span className="text-xs font-code px-2 py-1 rounded border border-red-500/30 text-red-300 bg-red-950/30">
                BOMBERAZO
              </span>
              <span className="text-xs font-code px-2 py-1 rounded border border-red-500/30 text-red-300 bg-red-950/30">
                RIESGO
              </span>
            </div>
          </div>
        </div>

        {/* FLECHA / TRANSFORM */}
        <div className="relative rounded-2xl border border-cyan/25 bg-black/35 p-6 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.18),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="text-cyan font-code tracking-[0.18em] text-sm">TRANSFORMACIÓN</div>
            <div className="text-6xl">⚡</div>
            <div className="text-white font-display font-black text-2xl tracking-wide">Hitech System</div>
            <div className="text-gray-300 text-sm text-center max-w-xs">
              Estandariza, documenta y automatiza para convertir caos en control.
            </div>

            <div className="mt-3 w-full">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div className="h-full w-[72%] bg-gradient-to-r from-cyan/80 to-gold/70 shadow-[0_0_18px_rgba(0,240,255,0.25)]" />
              </div>
              <div className="mt-2 text-xs font-code text-gray-400 text-center">
                impacto estimado (primeros 90 días)
              </div>
            </div>
          </div>
        </div>

        {/* VALOR / ROI */}
        <div className="relative rounded-2xl border border-gold/35 bg-black/40 p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(171,123,38,0.20),transparent_60%)]" />
          <div className="relative">
            <div className="text-gold font-code tracking-[0.18em] text-sm mb-2">VALOR GENERADO</div>
            <div className="text-5xl font-black text-white drop-shadow-[0_0_14px_rgba(171,123,38,0.25)]">
              4.5x ROI
            </div>
            <div className="mt-3 text-sm text-gray-300 leading-relaxed">
              Menos fallas, mejor respuesta, control de cambios y evidencia lista para auditoría.
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-code text-gray-400">Uptime</div>
                <div className="text-xl font-black text-green-400">98.5%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-code text-gray-400">Respuesta</div>
                <div className="text-xl font-black text-cyan">24H</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-code text-gray-400">Refacciones</div>
                <div className="text-xl font-black text-gold">$45K</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-code text-gray-400">Riesgo</div>
                <div className="text-xl font-black text-white">↓</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialEquation;
