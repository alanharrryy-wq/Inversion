import React, { useState } from "react";

const MissionProgressBar: React.FC = () => {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    { title: "FASE 1: ORDEN", days: "0-30", tasks: ["Regularización fiscal", "Limpieza operativa", "Setup de sistema"] },
    { title: "FASE 2: EJECUCIÓN", days: "30-60", tasks: ["Despliegue SRG", "Capacitación equipo", "Primeros entregables"] },
    { title: "FASE 3: ESTABILIDAD", days: "60-90", tasks: ["Flujo repetible", "Optimización", "Expansión comercial"] },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center h-full animate-fade-up px-4">
      <div className="w-full h-3 bg-gray-800 rounded-full mb-8 flex relative overflow-hidden">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 transition-all duration-500 border-r border-black ${
              i <= activePhase ? "bg-cyan shadow-[0_0_20px_#00F0FF]" : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="w-full flex justify-between gap-6">
        {phases.map((phase, i) => (
          <div
            key={i}
            onClick={() => setActivePhase(i)}
            className={`flex-1 p-5 border rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 ${
              activePhase === i ? "bg-white/10 border-cyan" : "bg-black/40 border-white/10 opacity-60"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-white">{phase.title}</h4>
              <span className="font-code text-gold bg-gold/10 px-2 py-0.5 rounded text-sm">{phase.days}</span>
            </div>

            <ul className="space-y-2">
              {phase.tasks.map((task, t) => (
                <li key={t} className="flex items-center text-base text-gray-300">
                  <span className={`mr-2 ${activePhase >= i ? "text-green-400" : "text-gray-600"}`}>✓</span>
                  {task}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MissionProgressBar;
