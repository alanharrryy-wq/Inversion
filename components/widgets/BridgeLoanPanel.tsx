import React from "react";

const BridgeLoanPanel: React.FC = () => {
  return (
    <div className="flex gap-4 animate-fade-up">
      <div className="flex-1 bg-black/40 border border-gold/50 p-6 rounded-xl relative overflow-hidden group hover:bg-gold/10 transition-colors">
        <h3 className="text-gold font-bold text-xl mb-2">PRÉSTAMO PUENTE</h3>
        <div className="text-4xl font-black text-white mb-2">$34,000 MXN</div>
        <p className="text-sm text-gray-300">
          Capital de trabajo inmediato para desbloquear el contrato SRG.
        </p>
        <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 text-gold group-hover:scale-110 transition-transform">
          💰
        </div>
      </div>

      <div className="flex-1 bg-black/40 border border-cyan/50 p-6 rounded-xl relative overflow-hidden group hover:bg-cyan/10 transition-colors">
        <h3 className="text-cyan font-bold text-xl mb-2">DESTINO</h3>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• Materiales Iniciales (30%)</li>
          <li>• Nómina Técnica (40%)</li>
          <li>• Logística (30%)</li>
        </ul>
        <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 text-cyan group-hover:scale-110 transition-transform">
          🏗️
        </div>
      </div>
    </div>
  );
};

export default BridgeLoanPanel;
