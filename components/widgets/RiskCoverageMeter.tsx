import React from "react";

const RiskCoverageMeter: React.FC = () => {
  return (
    <div className="w-full bg-black/40 border border-white/10 p-6 rounded-xl animate-fade-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-white">COBERTURA DE RIESGO</h3>
        <span className="font-code text-green-500 bg-green-900/20 px-3 py-1 rounded border border-green-500/50">
          170% COVERED
        </span>
      </div>

      <div className="relative w-full h-12 bg-gray-900 rounded-full overflow-hidden border border-white/20">
        <div className="absolute left-0 top-0 h-full bg-red-900/50 w-[30%] border-r border-white/20 flex items-center justify-center text-xs text-red-300 font-bold">
          DEUDA ($200K)
        </div>

        <div className="absolute left-[30%] top-0 h-full bg-yellow-900/50 w-[20%] border-r border-white/20 flex items-center justify-center text-xs text-yellow-300 font-bold">
          OPS ($130K)
        </div>

        <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500/80 to-green-400/80 w-[85%] shadow-[0_0_20px_#00ff00]">
          <div className="w-full h-full opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)]" />
        </div>

        <div className="absolute inset-0 flex items-center justify-end pr-4 text-white font-black drop-shadow-md z-10">
          CONTRATO SRG ($5M+)
        </div>
      </div>

      <p className="text-right text-gray-400 text-sm mt-2">
        El contrato actual cubre 1.7x la inversión solicitada.
      </p>
    </div>
  );
};

export default RiskCoverageMeter;
