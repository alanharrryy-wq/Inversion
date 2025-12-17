
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import IndustrialIntelligenceStack from './IndustrialStack';
import FinancialDonut from './FinancialDonut';
import { Slide5 } from './slides/Slide5';
import { Slide06 } from './slides/Slide06';
import { Slide7 } from './slides/Slide7';
import { Slide17 } from './slides/Slide17';
import { Slide18 } from './slides/Slide18';
import { Slide19 } from './slides/Slide19';
import { Slide12 } from './slides/Slide12';
import RotatingCore from './RotatingCore';


interface SlideProps {
  index: number;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (idx: number) => void;
  openModal: (images: string[], title: string) => void;
}

// --- UTILITY COMPONENTS ---

export function SlideContainer({ children, className = '' }: { children?: ReactNode; className?: string }) {
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
        {slideNum.toString().padStart(2, '0')}
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
          {isHome ? 'INICIO' : 'SIGUIENTE'}
        </button>
      )}
    </div>
  );
}

const DataBox: React.FC<{
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


const TextList = ({ items }: { items: { title: string; desc: string }[] | string[] }) => (
  <ul className="space-y-4">
    {items.map((item, idx) => (
      <li key={idx} className="pl-6 relative text-2xl text-offwhite font-medium leading-normal">
        <span className="absolute left-0 text-cyan top-1 text-lg">►</span>
        {typeof item === 'string' ? (
          <span dangerouslySetInnerHTML={{ __html: item }} />
        ) : (
          <>
            <strong className="text-white">{item.title}:</strong> <span className="text-gray-300">{item.desc}</span>
          </>
        )}
      </li>
    ))}
  </ul>
);

const LensWrapper = ({ children }: { children?: ReactNode }) => {
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
          transform: active ? 'scale(2)' : 'scale(1)' 
        }}
      >
        {children}
      </div>
      {!active && <div className="absolute top-2 right-2 text-cyan/50 text-xs border border-cyan/30 px-2 rounded bg-black/50 pointer-events-none">HOVER TO ZOOM</div>}
    </div>
  );
};

// --- INLINE COMPONENTS (Lightweight) ---

const SystemAlertLog = () => {
  const alerts = [
    { id: 1, label: 'CRITICAL_ERROR', desc: 'Paros no planeados = Pérdida directa de utilidad.', color: 'red' },
    { id: 2, label: 'WARNING_OPS', desc: 'Bomberazos constantes. Equipo estresado sin rumbo.', color: 'orange' },
    { id: 3, label: 'MISSING_DOCS', desc: 'Cajas negras. Nadie sabe cómo funciona el equipo.', color: 'red' },
    { id: 4, label: 'DEPENDENCY', desc: 'Si el técnico se va, la planta se detiene.', color: 'red' },
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
              ${alert.color === 'red' ? 'border-red-600 bg-red-900/10' : 'border-orange-500 bg-orange-900/10'}
              ${hovered === alert.id ? 'translate-x-4 bg-white/10' : ''}
            `}
          >
            <div className={`font-code text-xl font-bold tracking-widest ${alert.color === 'red' ? 'text-red-500' : 'text-orange-500'}`}>
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
                  <h3 className="text-2xl text-white font-bold mb-2">{alerts.find(a => a.id === hovered)?.label}</h3>
                  <p className="text-xl text-gray-300 leading-relaxed">{alerts.find(a => a.id === hovered)?.desc}</p>
               </div>
            ) : (
               <div className="text-gray-600 font-code text-lg animate-pulse">
                  HOVER TO SCAN ERROR...
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const EvolutionSlider = () => {
  const [sliderVal, setSliderVal] = useState(95);
  
  return (
    <div className="w-full h-full max-h-[500px] relative select-none animate-fade-up border border-white/20 rounded-xl overflow-hidden group">
      <div className="absolute inset-0 bg-[#050505] flex items-center justify-center z-0">
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/20 to-transparent"></div>
         <div className="text-center z-10">
            <h3 className="text-6xl font-display font-black text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] mb-2">SISTEMA</h3>
            <p className="text-xl text-cyan font-code tracking-[8px]">HITECH RTS</p>
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-left max-w-lg mx-auto">
               <div className="flex items-center text-green-400 font-code text-lg"><span className="mr-2">✓</span> PROCESOS</div>
               <div className="flex items-center text-green-400 font-code text-lg"><span className="mr-2">✓</span> DOCS</div>
               <div className="flex items-center text-green-400 font-code text-lg"><span className="mr-2">✓</span> PREVENCIÓN</div>
               <div className="flex items-center text-green-400 font-code text-lg"><span className="mr-2">✓</span> CONTROL</div>
            </div>
         </div>
      </div>
      <div 
        className="absolute inset-0 bg-red-950 flex items-center justify-center overflow-hidden border-r-4 border-gold shadow-[10px_0_50px_rgba(0,0,0,0.8)] z-10"
        style={{ width: `${sliderVal}%` }}
      >
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay z-0"></div>
         <div className="w-screen max-w-[1600px] h-full flex items-center justify-center relative z-10">
             <div className="text-center">
                <h3 className="text-6xl font-display font-black text-red-500 line-through decoration-white/50 decoration-4 mb-2 drop-shadow-[0_4px_0_rgba(0,0,0,1)]">CAOS</h3>
                <p className="text-xl text-white font-code tracking-[8px] font-bold drop-shadow-md">MODO SUPERVIVENCIA</p>
                 <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-left max-w-lg mx-auto">
                   <div className="flex items-center text-red-400 font-code text-lg font-bold"><span className="mr-2">✕</span> URGENCIA</div>
                   <div className="flex items-center text-red-400 font-code text-lg font-bold"><span className="mr-2">✕</span> BOMBERAZOS</div>
                   <div className="flex items-center text-red-400 font-code text-lg font-bold"><span className="mr-2">✕</span> IMPROVISACIÓN</div>
                   <div className="flex items-center text-red-400 font-code text-lg font-bold"><span className="mr-2">✕</span> MIEDO</div>
                </div>
             </div>
         </div>
      </div>
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={sliderVal} 
        onChange={(e) => setSliderVal(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-50"
      />
      <div 
         className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center pointer-events-none z-40 transition-transform duration-75"
         style={{ left: `calc(${sliderVal}% - 20px)` }}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M14 6l6 6-6 6M10 6L4 12l6 6" fill="none" stroke="black" strokeWidth="2"/></svg>
      </div>
      <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none z-30">
         <span className="bg-black/50 px-3 py-1 rounded text-white font-code text-xs border border-white/20 tracking-widest">DESLIZA PARA EVOLUCIONAR</span>
      </div>
    </div>
  );
};

const HolographicFiles = () => {
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
          <div key={it.key} className="group relative h-[220px] rounded-2xl overflow-hidden bg-black/35 border border-cyan/20 transition-all duration-300 hover:border-cyan/60 hover:shadow-[0_0_42px_rgba(0,240,255,0.18)] hover:-translate-y-[2px]">
            <div className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="hitech-scanline pointer-events-none absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ height: "26px", top: "-30px", background: "linear-gradient(to bottom, rgba(0,240,255,0.00), rgba(0,240,255,0.10), rgba(0,240,255,0.00))", animation: "hitech-scan 1.25s linear infinite" }} />
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


const MissionProgressBar = () => {
  const [activePhase, setActivePhase] = useState(0);
  const phases = [
    { title: 'FASE 1: ORDEN', days: '0-30', tasks: ['Regularización fiscal', 'Limpieza operativa', 'Setup de sistema'] },
    { title: 'FASE 2: EJECUCIÓN', days: '30-60', tasks: ['Despliegue SRG', 'Capacitación equipo', 'Primeros entregables'] },
    { title: 'FASE 3: ESTABILIDAD', days: '60-90', tasks: ['Flujo repetible', 'Optimización', 'Expansión comercial'] },
  ];
  return (
    <div className="w-full flex flex-col items-center justify-center h-full animate-fade-up px-4">
      <div className="w-full h-3 bg-gray-800 rounded-full mb-8 flex relative overflow-hidden">
         {phases.map((_, i) => (
            <div key={i} className={`h-full flex-1 transition-all duration-500 border-r border-black ${i <= activePhase ? 'bg-cyan shadow-[0_0_20px_#00F0FF]' : 'bg-transparent'}`}></div>
         ))}
      </div>
      <div className="w-full flex justify-between gap-6">
         {phases.map((phase, i) => (
            <div key={i} onClick={() => setActivePhase(i)} className={`flex-1 p-5 border rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 ${activePhase === i ? 'bg-white/10 border-cyan' : 'bg-black/40 border-white/10 opacity-60'}`}>
               <div className="flex justify-between items-center mb-4"><h4 className="text-lg font-bold text-white">{phase.title}</h4><span className="font-code text-gold bg-gold/10 px-2 py-0.5 rounded text-sm">{phase.days}</span></div>
               <ul className="space-y-2">{phase.tasks.map((task, t) => (<li key={t} className="flex items-center text-base text-gray-300"><span className={`mr-2 ${activePhase >= i ? 'text-green-400' : 'text-gray-600'}`}>✓</span>{task}</li>))}</ul>
            </div>
         ))}
      </div>
    </div>
  );
};

const FinancialEquation = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-up">
       <div className="flex items-center gap-6 text-7xl font-black font-display text-white">
          <div className="flex flex-col items-center"><span className="text-cyan drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">$330K</span><span className="text-lg font-main font-normal text-gray-400 mt-2">INVERSIÓN</span></div>
          <span className="text-gray-600">=</span>
          <div className="flex flex-col items-center"><span className="text-white">$200K</span><span className="text-lg font-main font-normal text-gray-400 mt-2">DEUDA MARIO</span></div>
          <span className="text-gold">+</span>
          <div className="flex flex-col items-center"><span className="text-white">$130K</span><span className="text-lg font-main font-normal text-gray-400 mt-2">OPERACIÓN (60D)</span></div>
       </div>
       <DataBox highlight="gold" className="text-center py-6 mt-12 max-w-4xl"><p className="text-2xl m-0 leading-normal">"Limpio el tablero y compro 2 meses de pista para despegar."</p></DataBox>
    </div>
  );
};

const TractionVault = () => {
  const [activeFile, setActiveFile] = useState<'srg' | 'flex' | null>(null);
  const renderDigitalDoc = (type: 'srg' | 'flex') => {
    if (type === 'srg') {
      return (<div className="font-code space-y-6 text-green-400 h-full flex flex-col justify-center"><div className="border-b-2 border-green-500/50 pb-6 mb-4 text-3xl"><span className="text-white font-bold">DOC_TYPE:</span> PURCHASE_ORDER <br/><span className="text-white font-bold">CLIENT_ID:</span> SRG_GLOBAL_IRAPUATO</div><div className="text-3xl space-y-3"><p>&gt; PO_NUMBER: <span className="text-white font-bold">4500289102</span></p><p>&gt; DATE: <span className="text-white">2024-11-15</span></p><p>&gt; VENDOR: <span className="text-white">HITECH_RTS</span></p></div><div className="my-8 pl-8 border-l-8 border-green-500 py-4 bg-green-900/10"><p className="text-white text-2xl">ITEM 10: RECTIFIER_MAINTENANCE_L1</p><p className="text-white text-2xl">ITEM 20: DIAGNOSTIC_SUITE_Q4</p><p className="text-gold font-black mt-8 text-8xl shadow-black drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">$225,000 USD</p></div><div className="mt-auto"><p className="animate-pulse text-4xl">&gt; STATUS: <span className="bg-green-600 text-black font-bold px-4 py-1 rounded">APPROVED</span></p></div></div>);
    } else {
      return (<div className="font-code space-y-6 text-cyan h-full flex flex-col justify-center"><div className="border-b-2 border-cyan/50 pb-6 mb-4 text-3xl"><span className="text-white font-bold">DOC_TYPE:</span> PROJECT_LOG <br/><span className="text-white font-bold">CLIENT_ID:</span> FLEX_N_GATE</div><div className="text-3xl space-y-3"><p>&gt; PROJECT_ID: <span className="text-white font-bold">FNG-24-RETROFIT</span></p><p>&gt; SCOPE: <span className="text-white">LINE_3_OVERHAUL</span></p></div><div className="my-8 pl-8 border-l-8 border-cyan py-4 bg-cyan/10"><p className="text-white text-3xl mb-2">LOG_ENTRY_01: DIAGNOSTIC_COMPLETE</p><p className="text-white text-3xl mb-2">LOG_ENTRY_02: PARTS_ORDERED</p><p className="text-white text-3xl mb-2">LOG_ENTRY_03: INSTALLATION_PENDING</p></div><div className="mt-auto"><p className="animate-pulse text-4xl">&gt; STATUS: <span className="bg-cyan/20 text-cyan px-4 py-1 rounded border border-cyan">IN_PROGRESS</span></p></div></div>);
    }
  };
  return (
    <div className="w-full h-full flex items-center justify-center gap-12 animate-fade-up px-8">
      <div onClick={() => setActiveFile(activeFile === 'srg' ? null : 'srg')} className={`relative cursor-pointer transition-all duration-500 border bg-black/60 overflow-hidden rounded-xl ${activeFile === 'srg' ? 'w-[80%] h-[95%] border-green-500 shadow-[0_0_50px_rgba(0,255,0,0.2)] z-20' : 'w-[40%] h-[500px] border-white/20 hover:border-green-500/50 hover:-translate-y-2'} ${activeFile === 'flex' ? 'w-[15%] h-[300px] opacity-30 blur-sm' : ''}`}>
         {!activeFile || activeFile !== 'srg' ? (<div className="h-full flex flex-col items-center justify-center text-center p-6"><div className="text-8xl mb-6 grayscale group-hover:grayscale-0 transition-all">🏭</div><h3 className="text-5xl font-black text-white mb-4">SRG GLOBAL</h3><p className="text-green-400 font-code tracking-widest text-lg border border-green-500/30 px-4 py-2 rounded uppercase">Click to Access Vault</p></div>) : (<div className="h-full p-12 flex flex-col"><div className="flex justify-between items-start mb-6 border-b border-green-500/50 pb-4"><h3 className="text-6xl font-black text-white">SRG_VAULT</h3><button className="text-green-500 font-code text-2xl border-2 border-green-500 px-6 py-2 hover:bg-green-900/50 uppercase font-bold">[CLOSE X]</button></div><div className="flex-1 bg-black/80 border border-green-500/30 p-12 font-code overflow-y-auto custom-scrollbar shadow-inner">{renderDigitalDoc('srg')}</div></div>)}
      </div>
      <div onClick={() => setActiveFile(activeFile === 'flex' ? null : 'flex')} className={`relative cursor-pointer transition-all duration-500 border bg-black/60 overflow-hidden rounded-xl ${activeFile === 'flex' ? 'w-[80%] h-[95%] border-cyan shadow-[0_0_50px_rgba(0,240,255,0.2)] z-20' : 'w-[40%] h-[500px] border-white/20 hover:border-cyan/50 hover:-translate-y-2'} ${activeFile === 'srg' ? 'w-[15%] h-[300px] opacity-30 blur-sm' : ''}`}>
         {!activeFile || activeFile !== 'flex' ? (<div className="h-full flex flex-col items-center justify-center text-center p-6"><div className="text-8xl mb-6">🔧</div><h3 className="text-5xl font-black text-white mb-4">FLEX & GATE</h3><p className="text-cyan font-code tracking-widest text-lg border border-cyan/30 px-4 py-2 rounded uppercase">Click to Access Vault</p></div>) : (<div className="h-full p-12 flex flex-col"><div className="flex justify-between items-start mb-6 border-b border-cyan/50 pb-4"><h3 className="text-6xl font-black text-white">FLEX_VAULT</h3><button className="text-cyan font-code text-2xl border-2 border-cyan px-6 py-2 hover:bg-cyan/20 uppercase font-bold">[CLOSE X]</button></div><div className="flex-1 bg-black/80 border border-cyan/30 p-12 font-code overflow-y-auto custom-scrollbar shadow-inner">{renderDigitalDoc('flex')}</div></div>)}
      </div>
    </div>
  );
};

const ValuePropInteractive = () => {
  const props = [
    { title: 'VISIBILIDAD TOTAL', desc: 'No más cajas negras. Monitoreo en tiempo real.', icon: '👁️' },
    { title: 'CONTROL OPERATIVO', desc: 'Decisiones basadas en datos, no en intuición.', icon: '🎛️' },
    { title: 'RENTABILIDAD', desc: 'Menos paros, mayor vida útil de activos.', icon: '💰' },
  ];
  return (
    <div className="flex gap-4 justify-center items-center h-full animate-fade-up">
      {props.map((p, i) => (
        <DataBox key={i} className="flex-1 h-64 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5">
          <div className="text-5xl">{p.icon}</div>
          <h3 className="text-2xl font-bold text-white">{p.title}</h3>
          <p className="text-gray-300">{p.desc}</p>
        </DataBox>
      ))}
    </div>
  );
};

const ProcessFlow = () => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const steps = [
    { id: 1, title: 'DIAGNÓSTICO', desc: 'Levantamiento físico y digital.', detail: 'Escaneo completo de parámetros.' },
    { id: 2, title: 'PROPUESTA', desc: 'Alcance, costo y ROI.', detail: 'Análisis financiero y técnico.' },
    { id: 3, title: 'EJECUCIÓN', desc: 'Intervención técnica estandarizada.', detail: 'Protocolo HITECH en sitio.' },
    { id: 4, title: 'ENTREGA', desc: 'Documentación y cierre.', detail: 'Entrega de carpeta de evidencias.' },
  ];
  return (
    <div className="w-full h-full flex flex-col justify-center items-center relative animate-fade-up px-16">
      <div className="absolute top-[40%] left-0 right-0 h-[2px] bg-white/10 z-0 w-full" />
      <div className="absolute top-[40%] left-0 h-[2px] bg-gradient-to-r from-cyan to-transparent z-0 transition-all duration-500 ease-out" style={{ width: hoveredStep ? `${(hoveredStep / steps.length) * 100}%` : '0%', opacity: 0.5 }} />
      <div className="flex justify-between w-full h-[60%] items-center relative z-10">
        {steps.map((step) => {
          const isHovered = hoveredStep === step.id;
          const isPassed = hoveredStep !== null && hoveredStep >= step.id;
          return (
            <div key={step.id} onMouseEnter={() => setHoveredStep(step.id)} onMouseLeave={() => setHoveredStep(null)} className="group relative flex flex-col items-center justify-start h-full w-1/4 cursor-pointer">
               <div className={`absolute top-[40%] h-8 w-[2px] -translate-y-full transition-colors duration-300 ${isPassed ? 'bg-cyan' : 'bg-white/10'}`}></div>
               <div className={`absolute top-[40%] -translate-y-1/2 w-6 h-6 rotate-45 border-2 transition-all duration-300 z-20 bg-black ${isPassed ? 'border-cyan bg-cyan shadow-[0_0_15px_#00F0FF]' : 'border-white/30'} ${isHovered ? 'scale-150 border-gold bg-black shadow-[0_0_25px_#AB7B26]' : ''}`}></div>
               <div className={`absolute top-[28%] font-display font-bold text-4xl select-none transition-all duration-500 ${isHovered ? 'text-gold -translate-y-2 opacity-100' : 'text-white/5 translate-y-0'}`}>0{step.id}</div>
               <div className={`mt-[48%] w-[90%] p-4 border-l-2 transition-all duration-300 bg-gradient-to-r from-white/5 to-transparent ${isHovered ? 'border-gold bg-white/10 translate-y-2' : 'border-white/10 opacity-70 hover:opacity-100'} ${isPassed && !isHovered ? 'border-cyan' : ''}`}>
                  <h3 className={`font-display font-bold text-lg mb-2 ${isHovered ? 'text-white' : 'text-gray-400'}`}>{step.title}</h3>
                  <p className="font-code text-sm text-gray-400 leading-tight">{step.desc}</p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LiveKPIDashboard = () => {
   return (
      <div className="grid grid-cols-2 gap-8 w-full h-full animate-fade-up px-12 py-4">
         <DataBox className="flex flex-col justify-center items-center"><h3 className="text-gray-400 font-code tracking-widest mb-2">UPTIME PROMEDIO</h3><div className="text-7xl font-black text-green-500 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">98.5%</div><p className="text-sm text-green-400 mt-2">↑ 15% vs Anterior</p></DataBox>
         <DataBox className="flex flex-col justify-center items-center"><h3 className="text-gray-400 font-code tracking-widest mb-2">COST SAVINGS</h3><div className="text-7xl font-black text-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">$45K</div><p className="text-sm text-gold mt-2">En refacciones evitadas</p></DataBox>
         <DataBox className="flex flex-col justify-center items-center"><h3 className="text-gray-400 font-code tracking-widest mb-2">TIEMPO RESPUESTA</h3><div className="text-7xl font-black text-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">24H</div><p className="text-sm text-cyan mt-2">vs 72H Promedio Industria</p></DataBox>
         <DataBox className="flex flex-col justify-center items-center"><h3 className="text-gray-400 font-code tracking-widest mb-2">ROI PROYECTADO</h3><div className="text-7xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">4.5x</div><p className="text-sm text-gray-400 mt-2">En 12 meses</p></DataBox>
      </div>
   );
};

const RiskCoverageMeter = () => {
   return (
      <div className="w-full bg-black/40 border border-white/10 p-6 rounded-xl animate-fade-up">
         <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold text-white">COBERTURA DE RIESGO</h3><span className="font-code text-green-500 bg-green-900/20 px-3 py-1 rounded border border-green-500/50">170% COVERED</span></div>
         <div className="relative w-full h-12 bg-gray-900 rounded-full overflow-hidden border border-white/20">
            <div className="absolute left-0 top-0 h-full bg-red-900/50 w-[30%] border-r border-white/20 flex items-center justify-center text-xs text-red-300 font-bold">DEUDA ($200K)</div>
            <div className="absolute left-[30%] top-0 h-full bg-yellow-900/50 w-[20%] border-r border-white/20 flex items-center justify-center text-xs text-yellow-300 font-bold">OPS ($130K)</div>
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500/80 to-green-400/80 w-[85%] shadow-[0_0_20px_#00ff00]"><div className="w-full h-full opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)]"></div></div>
            <div className="absolute inset-0 flex items-center justify-end pr-4 text-white font-black drop-shadow-md z-10">CONTRATO SRG ($5M+)</div>
         </div>
         <p className="text-right text-gray-400 text-sm mt-2">El contrato actual cubre 1.7x la inversión solicitada.</p>
      </div>
   );
};

const BridgeLoanPanel = () => {
   return (
      <div className="flex gap-4 animate-fade-up">
         <div className="flex-1 bg-black/40 border border-gold/50 p-6 rounded-xl relative overflow-hidden group hover:bg-gold/10 transition-colors">
            <h3 className="text-gold font-bold text-xl mb-2">PRÉSTAMO PUENTE</h3>
            <div className="text-4xl font-black text-white mb-2">$34,000 MXN</div>
            <p className="text-sm text-gray-300">Capital de trabajo inmediato para desbloquear el contrato SRG.</p>
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 text-gold group-hover:scale-110 transition-transform">💰</div>
         </div>
         <div className="flex-1 bg-black/40 border border-cyan/50 p-6 rounded-xl relative overflow-hidden group hover:bg-cyan/10 transition-colors">
            <h3 className="text-cyan font-bold text-xl mb-2">DESTINO</h3>
            <ul className="text-sm text-gray-300 space-y-2"><li>• Materiales Iniciales (30%)</li><li>• Nómina Técnica (40%)</li><li>• Logística (30%)</li></ul>
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 text-cyan group-hover:scale-110 transition-transform">🏗️</div>
         </div>
      </div>
   );
};

const SlideRenderer: React.FC<SlideProps> = ({ index, nextSlide, prevSlide, goToSlide, openModal }) => {
  switch (index) {
    case 0:
      return (
        <SlideContainer>
           <div className="border-b-2 border-white/10"></div>
           <div className="grid grid-cols-1 place-items-center text-center content-center h-full">
             <div className="animate-fade-up">
               <div className="font-code text-gold text-2xl tracking-[2px] font-bold mb-2">SYSTEM_BOOT // V2.2</div>
               <h1 className="font-display text-[7rem] tracking-[10px] text-white font-black drop-shadow-[4px_4px_0_#000] mb-2 leading-none">HITECH RTS</h1>
               <div className="text-4xl tracking-[5px] text-gold font-bold drop-shadow-[2px_2px_4px_#000] mb-10">SISTEMA DE GESTIÓN INTEGRAL</div>
               <div className="animate-fade-up inline-block px-12 py-4 border-2 border-cyan bg-cyan/5" style={{ animationDelay: '0.2s' }}><p className="font-code text-2xl text-white tracking-[4px] font-bold m-0">ESTATUS: OPERATIVO 🟢</p></div>
             </div>
           </div>
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 1:
      return (
        <SlideContainer>
          <Header title="EL PROBLEMA" breadcrumb="DIAGNÓSTICO" slideNum={2} />
          <SystemAlertLog />
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 2:
      return (
        <SlideContainer>
          <Header title="INSIGHT" breadcrumb="ORIGEN" slideNum={3} />
          <div className="flex flex-col h-full justify-center"><EvolutionSlider /></div>
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 3:
      return (
        <SlideContainer>
          <Header title="TRACCIÓN" breadcrumb="EVIDENCIA" slideNum={4} />
          <TractionVault />
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 4:
      return (
        <SlideContainer>
           <Header title="PROPUESTA DE VALOR" breadcrumb="SOLUCIÓN" slideNum={5} />
           <ValuePropInteractive />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 5:
      return <Slide5 nextSlide={nextSlide} prevSlide={prevSlide} />;
    case 6:
      return <Slide06 nextSlide={nextSlide} prevSlide={prevSlide} goToSlide={goToSlide} openModal={openModal} />;
    case 7:
      return <Slide7 nextSlide={nextSlide} prevSlide={prevSlide} />;
    case 8:
      return (
        <SlideContainer>
          <Header title="SISTEMA HITECH" breadcrumb="ARQUITECTURA" slideNum={9} />
          <IndustrialIntelligenceStack />
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 9:
      return (
        <SlideContainer>
           <Header title="MAPA DE PROCESOS" breadcrumb="FLUJO" slideNum={10} />
           <ProcessFlow />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 10:
      return (
        <SlideContainer>
          <Header title="DOCUMENTACIÓN" breadcrumb="SOPORTE" slideNum={11} />
          <div className="flex flex-col justify-center h-full"><p className="mb-10 text-center text-xl text-gray-200">Si no está escrito, no existe. El rastro documental nos protege.</p><HolographicFiles /></div>
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 11:
      return <Slide12 nextSlide={nextSlide} prevSlide={prevSlide} />;
    case 12:
      return (
        <SlideContainer>
           <Header title="KPIs DEL SISTEMA" breadcrumb="RESULTADOS" slideNum={13} />
           <LiveKPIDashboard />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 13:
      return (
        <SlideContainer>
           <Header title="PLAN 90 DÍAS" breadcrumb="EJECUCIÓN" slideNum={14} />
           <MissionProgressBar />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 14:
      return (
        <SlideContainer>
           <Header title="RESUMEN NUMÉRICO" breadcrumb="CAPITAL" slideNum={15} />
           <FinancialEquation />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 15:
      return (
        <SlideContainer>
           <Header title="USO DE FONDOS" breadcrumb="DETALLE" slideNum={16} />
           <FinancialDonut />
           <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 16:
      return (
        <SlideContainer>
          <Header title="GARANTÍA SRG" breadcrumb="INGRESOS" slideNum={17} />
          <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2"><RiskCoverageMeter /><BridgeLoanPanel /></div>
          <NavArea prev={prevSlide} next={nextSlide} />
        </SlideContainer>
      );
    case 17:
      return <Slide17 nextSlide={nextSlide} prevSlide={prevSlide} openModal={openModal} />;
    case 18:
      return <Slide18 nextSlide={nextSlide} prevSlide={prevSlide} />;
    case 19:
      return <Slide19 goToSlide={goToSlide} prevSlide={prevSlide} />;
    default:
      return null;
  }
};

export default SlideRenderer;
