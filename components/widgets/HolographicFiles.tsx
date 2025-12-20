import React from "react";

const HolographicFiles: React.FC = () => {
  const items = [
    { key: "sops", icon: "📄", title: "SOPs", desc: "Procedimientos estandarizados de operación. Definen cómo, cuándo y con qué criterio se ejecuta cada tarea." },
    { key: "checklists", icon: "✅", title: "CHECKLISTS", desc: "Verificación paso a paso de seguridad y calidad. Evita omisiones y reduce riesgo operativo." },
    { key: "planos", icon: "📐", title: "PLANOS", desc: "Dibujos técnicos y modelos CAD controlados por versión. La fuente única de verdad en piso." },
    { key: "bitacoras", icon: "📘", title: "BITÁCORAS", desc: "Registro cronológico de actividades, hallazgos y decisiones. Evidencia para auditoría y trazabilidad." },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-2">
      <div className="grid grid-cols-4 gap-8">
        {items.map((it) => (
          <div
            key={it.key}
            className="group relative h-[220px] rounded-2xl overflow-hidden bg-black/35 border border-cyan/20 transition-all duration-300 hover:border-cyan/60 hover:shadow-[0_0_42px_rgba(0,240,255,0.18)] hover:-translate-y-[2px]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />

            <div
              className="hitech-scanline pointer-events-none absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                height: "26px",
                top: "-30px",
                background:
                  "linear-gradient(to bottom, rgba(0,240,255,0.00), rgba(0,240,255,0.10), rgba(0,240,255,0.00))",
                animation: "hitech-scan 1.25s linear infinite",
              }}
            />

            <div className="relative z-10 h-full p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="text-5xl">{it.icon}</div>
              <div className="text-cyan font-semibold tracking-[0.18em] text-sm">{it.title}</div>
              <div className="mt-2 w-16 h-[2px] bg-cyan/60 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-center text-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-cyan font-semibold tracking-[0.18em] text-sm mb-3">{it.title}</div>
              <p className="text-[15px] leading-relaxed text-gray-200">{it.desc}</p>
              <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-cyan/60 opacity-40 group-hover:opacity-80 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolographicFiles;
