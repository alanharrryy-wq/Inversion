import React, { useState, useEffect } from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';

// --- DATA CONSTANTS ---
const NODES = {
  CAD: { 
    id: 'CAD',
    label: '01. INPUT',
    title: 'CAD / DISEÑO', 
    subtitle: 'Modelos · Planos · Librerías', 
    desc: 'Tu hijo construye librerías CAD reutilizables (fixtures/herramentales), con nomenclatura y revisión. Diseño que se puede versionar y repetir.', 
    color: 'cyan',
    icon: '📐' 
  },
  OEM: { 
    id: 'OEM',
    label: '02. PROCESS',
    title: 'ESCUELA OEM', 
    subtitle: 'Proceso · Calidad · Seguridad', 
    desc: 'HITECH amarra disciplina: SOP, checklist, seguridad, control de cambios y evidencia. Lo que se diseña se vuelve estándar operativo.', 
    color: 'gold',
    icon: '⚙️'
  },
  OUT: { 
    id: 'OUT',
    label: '03. OUTPUT',
    title: 'ENTREGABLES', 
    subtitle: 'Docs · Evidencia · Trazabilidad', 
    desc: 'Paquete final listo para planta: plano + SOP + checklist + evidencia + cierre técnico. Entregable que sobrevive auditoría y rotación.', 
    color: 'cyan',
    icon: '📦'
  },
} as const;

type NodeType = keyof typeof NODES;

// --- UI SUB-COMPONENTS ---

const ProcessNode = ({ 
  nodeKey, 
  activeNode, 
  onHover, 
  onLeave 
}: { 
  nodeKey: NodeType; 
  activeNode: NodeType | null; 
  onHover: (k: NodeType) => void; 
  onLeave: () => void; 
}) => {
  const data = NODES[nodeKey];
  const isActive = activeNode === nodeKey;
  const isDimmed = activeNode !== null && !isActive;
  
  // Dynamic styles based on state
  const borderColor = data.color === 'gold' ? 'border-gold' : 'border-cyan';
  const glowColor = data.color === 'gold' ? 'shadow-[0_0_30px_rgba(171,123,38,0.3)]' : 'shadow-[0_0_30px_rgba(0,240,255,0.3)]';
  const textColor = data.color === 'gold' ? 'text-gold' : 'text-cyan';
  const bgColor = isActive ? 'bg-black/80' : 'bg-black/40';

  return (
    <div 
      className={`relative h-full transition-all duration-500 group cursor-pointer select-none ${isDimmed ? 'opacity-30 grayscale-[50%]' : 'opacity-100'}`}
      onMouseEnter={() => onHover(nodeKey)}
      onMouseLeave={onLeave}
    >
      {/* Node Container */}
      <div className={`
        absolute inset-0 border transition-all duration-300 backdrop-blur-sm
        ${isActive ? `${borderColor} ${glowColor} ${bgColor} scale-[1.02]` : 'border-white/10 hover:border-white/30 bg-black/20'}
      `}>
        
        {/* Corner Brackets (Engineered Look) */}
        <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors ${isActive ? borderColor : 'border-white/20'}`} />
        <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors ${isActive ? borderColor : 'border-white/20'}`} />
        <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors ${isActive ? borderColor : 'border-white/20'}`} />
        <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors ${isActive ? borderColor : 'border-white/20'}`} />

        {/* Content */}
        <div className="h-full flex flex-col p-6 relative overflow-hidden">
          {/* Scanline Effect (Active Only) */}
          <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${data.color}/10 to-transparent h-[50%] w-full pointer-events-none transition-transform duration-1000 ${isActive ? 'translate-y-[200%]' : '-translate-y-full'}`} style={{ transitionTimingFunction: 'linear' }} />
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <span className={`font-code text-[10px] tracking-[2px] uppercase ${isActive ? textColor : 'text-gray-500'}`}>
              {data.label}
            </span>
            <div className={`w-2 h-2 rounded-full ${isActive ? `bg-${data.color} animate-pulse` : 'bg-gray-700'}`} />
          </div>

          {/* Main Icon & Title */}
          <div className="flex-1 flex flex-col justify-center items-center text-center gap-2">
            <div className={`text-4xl transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100 grayscale'}`}>
              {data.icon}
            </div>
            <h3 className={`font-display font-bold text-lg leading-tight mt-2 ${isActive ? 'text-white' : 'text-gray-400'}`}>
              {data.title}
            </h3>
          </div>

          {/* Footer Technical Spec */}
          <div className="mt-auto pt-4 border-t border-white/10 flex justify-between text-[10px] font-code text-gray-500">
            <span>SYS.VER.2.0</span>
            <span className={isActive ? textColor : ''}>{isActive ? 'STATUS: ONLINE' : 'IDLE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlowConnector = ({ active, color }: { active: boolean; color: 'cyan' | 'gold' }) => {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden opacity-80">
      <svg className="w-full h-[2px]" overflow="visible">
        <line 
          x1="0" y1="0" x2="100%" y2="0" 
          stroke={active ? (color === 'gold' ? '#AB7B26' : '#00F0FF') : '#333'} 
          strokeWidth="2" 
          strokeDasharray="4 4"
          className={active ? 'animate-[dash_0.5s_linear_infinite]' : ''}
        />
        <polygon 
          points="0,0 -6,-3 -6,3" 
          fill={active ? (color === 'gold' ? '#AB7B26' : '#00F0FF') : '#333'} 
          className="translate-x-full" // positioned at end of line via CSS logic conceptually, here simpler to just use CSS transform in SVG or another element.
          transform="translate(100%, 0)" // This might break in some SVG renderers without explicit coords, doing clearer implementation below.
        />
        {/* Simple Arrow Head at the end */}
        <path d="M 95 0 L 85 -4 L 85 4 Z" transform="translate(10,0)" fill={active ? (color === 'gold' ? '#AB7B26' : '#00F0FF') : '#333'} />
      </svg>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -16; }
        }
      `}</style>
    </div>
  );
};

const HolographicBlueprint = () => {
  const [activeBox, setActiveBox] = useState<NodeType | null>(null);

  const activeData = activeBox ? NODES[activeBox] : null;

  return (
    <div className="w-full h-[500px] relative bg-[#05080C] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] animate-fade-up group">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Header Bar */}
      <div className="w-full h-10 border-b border-white/10 bg-black/40 flex items-center justify-between px-4 z-10">
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-cyan/50 rounded-full animate-pulse" />
          <span className="font-code text-xs text-cyan/70 tracking-widest">BLUEPRINT_VIEW // ARCH_V2</span>
        </div>
        <span className="font-code text-xs text-gray-600 tracking-widest">MODE: INTERACTIVE</span>
      </div>

      {/* Main Diagram Area */}
      <div className="flex-1 relative p-8 flex items-center justify-center">
        <div className="w-full h-48 flex items-center justify-between relative z-10 max-w-4xl">
          
          {/* CAD Node */}
          <div className="w-[28%] h-full">
            <ProcessNode nodeKey="CAD" activeNode={activeBox} onHover={setActiveBox} onLeave={() => setActiveBox(null)} />
          </div>

          {/* Connector 1 */}
          <div className="flex-1 h-full px-2">
            <div className="h-full flex flex-col justify-center">
               <FlowConnector active={activeBox === 'CAD' || activeBox === 'OEM'} color="cyan" />
            </div>
          </div>

          {/* OEM Node */}
          <div className="w-[28%] h-full">
            <ProcessNode nodeKey="OEM" activeNode={activeBox} onHover={setActiveBox} onLeave={() => setActiveBox(null)} />
          </div>

          {/* Connector 2 */}
          <div className="flex-1 h-full px-2">
            <div className="h-full flex flex-col justify-center">
              <FlowConnector active={activeBox === 'OEM' || activeBox === 'OUT'} color="gold" />
            </div>
          </div>

          {/* OUT Node */}
          <div className="w-[24%] h-full">
            <ProcessNode nodeKey="OUT" activeNode={activeBox} onHover={setActiveBox} onLeave={() => setActiveBox(null)} />
          </div>
        </div>
      </div>

      {/* Info Panel (HUD) */}
      <div className="h-32 border-t border-white/10 bg-[#020305]/90 backdrop-blur-md p-6 relative z-20">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent opacity-50" />
        
        {activeData ? (
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <h4 className={`text-xl font-display font-bold ${activeData.color === 'gold' ? 'text-gold' : 'text-cyan'}`}>
                {activeData.title}
              </h4>
              <span className="h-4 w-[1px] bg-white/20" />
              <span className="font-code text-sm text-gray-400 tracking-wider uppercase">
                {activeData.subtitle}
              </span>
            </div>
            <p className="text-gray-300 font-main leading-relaxed max-w-4xl">
              {activeData.desc}
            </p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 font-code tracking-[4px] text-sm animate-pulse">
            HOVER OVER A MODULE TO INSPECT DATA
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN SLIDE ---

interface Slide06Props {
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (idx: number) => void;
  openModal: (images: string[], title: string) => void;
}

export const Slide06: React.FC<Slide06Props> = ({ nextSlide, prevSlide, goToSlide, openModal }) => {
  return (
    <SlideContainer>
      <Header title="CAD + INGENIERÍA" breadcrumb="FUTURO" slideNum={7} />
      
      <div className="grid grid-cols-[35%_65%] gap-12 items-start h-full pt-8 px-4">
        {/* Left Column: Narrative */}
        <div className="flex flex-col justify-between h-full max-h-[600px]">
          <div className="animate-fade-up space-y-8" style={{ animationDelay: '0.1s' }}>
            
            {/* Lead Statement */}
            <div className="relative pl-6 border-l-2 border-gold/50">
              <p className="text-2xl text-offwhite leading-normal font-medium">
                La mancuerna natural: <br/>
                <span className="text-gold font-bold">Diseño CAD</span> + <span className="text-cyan font-bold">Disciplina OEM</span>.
              </p>
            </div>

            <p className="text-lg text-gray-300 leading-relaxed">
              Tu hijo aporta <strong className="text-white">modelos y librerías</strong>. 
              Yo aporto <strong className="text-white">estándares y seguridad</strong>.
              <br/>
              <span className="text-gray-400 text-sm mt-2 block">
                Esto convierte "dibujos" en <strong>Ingeniería Auditable</strong>.
              </span>
            </p>

            {/* Tech Specs List */}
            <div className="space-y-4 font-code text-sm">
              <div className="flex items-start gap-4 p-3 rounded bg-white/5 border border-white/10 hover:border-cyan/30 transition-colors">
                <span className="text-cyan text-lg">01</span>
                <div>
                  <strong className="text-white block tracking-widest text-xs mb-1">INPUT: CAD</strong>
                  <span className="text-gray-400">Fixtures + Herramentales + Planos controlados.</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded bg-white/5 border border-white/10 hover:border-gold/30 transition-colors">
                <span className="text-gold text-lg">02</span>
                <div>
                  <strong className="text-white block tracking-widest text-xs mb-1">PROCESS: OEM</strong>
                  <span className="text-gray-400">SOP + Checklist + Evidencia Técnica.</span>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded bg-white/5 border border-white/10 hover:border-green-400/30 transition-colors">
                <span className="text-green-400 text-lg">03</span>
                <div>
                  <strong className="text-white block tracking-widest text-xs mb-1">EFFECT: ROI</strong>
                  <span className="text-gray-400">Menos retrabajo. Menos riesgo. Velocidad.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Call to Action Box */}
          <div className="animate-fade-up mt-auto p-5 border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent rounded-lg relative overflow-hidden group" style={{ animationDelay: '0.2s' }}>
             <div className="absolute top-0 right-0 w-20 h-20 bg-gold/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-gold/30 transition-colors" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-gold font-code text-[10px] tracking-[4px] font-bold uppercase">Invitación HITECH</span>
                   <span className="text-white/40 text-xs">→</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                   Tu hijo entra a aprender el sistema: <strong className="text-white">Diseño con estándares</strong>, no solo "dibujos bonitos".
                </p>
             </div>
          </div>
        </div>

        {/* Right Column: Interactive Blueprint */}
        <div className="h-full flex items-center">
           <HolographicBlueprint />
        </div>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};