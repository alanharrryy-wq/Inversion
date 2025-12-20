import React, { useState } from "react";

const ProcessFlow: React.FC = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    { id: 1, title: "DIAGNÓSTICO", desc: "Levantamiento físico y digital.", detail: "Escaneo completo de parámetros." },
    { id: 2, title: "PROPUESTA", desc: "Alcance, costo y ROI.", detail: "Análisis financiero y técnico." },
    { id: 3, title: "EJECUCIÓN", desc: "Intervención técnica estandarizada.", detail: "Protocolo HITECH en sitio." },
    { id: 4, title: "ENTREGA", desc: "Documentación y cierre.", detail: "Entrega de carpeta de evidencias." },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative animate-fade-up px-16">
      <div className="absolute top-[40%] left-0 right-0 h-[2px] bg-white/10 z-0 w-full" />
      <div
        className="absolute top-[40%] left-0 h-[2px] bg-gradient-to-r from-cyan to-transparent z-0 transition-all duration-500 ease-out"
        style={{
          width: hoveredStep ? `${(hoveredStep / steps.length) * 100}%` : "0%",
          opacity: 0.5,
        }}
      />

      <div className="flex justify-between w-full h-[60%] items-center relative z-10">
        {steps.map((step) => {
          const isHovered = hoveredStep === step.id;
          const isPassed = hoveredStep !== null && hoveredStep >= step.id;

          return (
            <div
              key={step.id}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
              className="group relative flex flex-col items-center justify-start h-full w-1/4 cursor-pointer"
            >
              <div
                className={`absolute top-[40%] h-8 w-[2px] -translate-y-full transition-colors duration-300 ${
                  isPassed ? "bg-cyan" : "bg-white/10"
                }`}
              />

              <div
                className={`absolute top-[40%] -translate-y-1/2 w-6 h-6 rotate-45 border-2 transition-all duration-300 z-20 bg-black ${
                  isPassed ? "border-cyan bg-cyan shadow-[0_0_15px_#00F0FF]" : "border-white/30"
                } ${isHovered ? "scale-150 border-gold bg-black shadow-[0_0_25px_#AB7B26]" : ""}`}
              />

              <div
                className={`absolute top-[28%] font-display font-bold text-4xl select-none transition-all duration-500 ${
                  isHovered ? "text-gold -translate-y-2 opacity-100" : "text-white/5 translate-y-0"
                }`}
              >
                0{step.id}
              </div>

              <div
                className={`mt-[48%] w-[90%] p-4 border-l-2 transition-all duration-300 bg-gradient-to-r from-white/5 to-transparent ${
                  isHovered ? "border-gold bg-white/10 translate-y-2" : "border-white/10 opacity-70 hover:opacity-100"
                } ${isPassed && !isHovered ? "border-cyan" : ""}`}
              >
                <h3 className={`font-display font-bold text-lg mb-2 ${isHovered ? "text-white" : "text-gray-400"}`}>
                  {step.title}
                </h3>
                <p className="font-code text-sm text-gray-400 leading-tight">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessFlow;

