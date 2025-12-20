import React, { useState } from "react";

const SystemAlertLog: React.FC = () => {
  const alerts = [
    { id: 1, label: "CRITICAL_ERROR", desc: "Paros no planeados = Pérdida directa de utilidad.", color: "red" },
    { id: 2, label: "WARNING_OPS", desc: "Bomberazos constantes. Equipo estresado sin rumbo.", color: "orange" },
    { id: 3, label: "MISSING_DOCS", desc: "Cajas negras. Nadie sabe cómo funciona el equipo.", color: "red" },
    { id: 4, label: "DEPENDENCY", desc: "Si el técnico se va, la planta se detiene.", color: "red" },
  ];

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="w-full h-full flex gap-8 items-center animate-fade-up">
      <div className="w-1/2 flex flex-col gap-3 justify-center h-full">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onMouseEnter={() => setHovered(alert.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              p-5 border-l-4 cursor-pointer transition-all duration-300 relative overflow-hidden group rounded-r-lg
              ${alert.color === "red" ? "border-red-600 bg-red-900/10" : "border-orange-500 bg-orange-900/10"}
              ${hovered === alert.id ? "translate-x-4 bg-white/10" : ""}
            `}
          >
            <div
              className={`font-code text-xl font-bold tracking-widest ${
                alert.color === "red" ? "text-red-500" : "text-orange-500"
              }`}
            >
              [{alert.label}]
            </div>
          </div>
        ))}
      </div>

      <div className="w-1/2 h-full relative flex items-center">
        <div className="w-full aspect-video border border-white/20 bg-black/60 p-6 flex items-center justify-center text-center rounded-xl">
          {hovered ? (
            <div className="animate-fade-up">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl text-white font-bold mb-2">{alerts.find((a) => a.id === hovered)?.label}</h3>
              <p className="text-xl text-gray-300 leading-relaxed">{alerts.find((a) => a.id === hovered)?.desc}</p>
            </div>
          ) : (
            <div className="text-gray-600 font-code text-lg animate-pulse">HOVER TO SCAN ERROR...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemAlertLog;
