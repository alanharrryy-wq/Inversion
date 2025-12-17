import React, { useState } from 'react';
import { SlideContainer, Header, NavArea } from '../SlideRenderer';

const HolographicBlueprint = () => {
  const [activeBox, setActiveBox] = useState<'CAD' | 'OEM' | 'OUT' | null>(null);
  const cards = {
    CAD: { title: 'CAD / DISEÑO', subtitle: 'Modelos · Planos · Librerías', desc: 'Tu hijo construye librerías CAD reutilizables (fixtures/herramentales), con nomenclatura y revisión. Diseño que se puede versionar y repetir.', color: 'cyan' },
    OEM: { title: 'ESCUELA OEM', subtitle: 'Proceso · Calidad · Seguridad', desc: 'HITECH amarra disciplina: SOP, checklist, seguridad, control de cambios y evidencia. Lo que se diseña se vuelve estándar operativo.', color: 'gold' },
    OUT: { title: 'ENTREGABLES', subtitle: 'Docs · Evidencia · Trazabilidad', desc: 'Paquete final listo para planta: plano + SOP + checklist + evidencia + cierre técnico. Entregable que sobrevive auditoría y rotación.', color: 'cyan' },
  } as const;
  const isDim = (k: 'CAD' | 'OEM' | 'OUT') => activeBox !== null && activeBox !== k;
  const boxBase = 'absolute rounded-xl border bg-black/25 backdrop-blur-[1px] transition-all duration-300 cursor-pointer select-none';
  const glowCyan = 'shadow-[0_0_0_1px_rgba(0,240,255,0.30),0_0_28px_rgba(0,240,255,0.18)] border-cyan/60';
  const glowGold = 'shadow-[0_0_0_1px_rgba(171,123,38,0.35),0_0_28px_rgba(171,123,38,0.18)] border-gold/60';
  const boxClass = (k: 'CAD' | 'OEM' | 'OUT') => {
    const active = activeBox === k;
    const dim = isDim(k);
    const glow = k === 'OEM' ? glowGold : glowCyan;
    return [boxBase, 'hover:scale-[1.02]', active ? `scale-[1.02] ${glow}` : 'border-cyan/30', dim ? 'opacity-25 blur-[0.3px]' : 'opacity-100'].join(' ');
  };
  const activeCard = activeBox ? cards[activeBox] : null;

  return (
    <div className="w-full h-full max-h-[450px] relative bg-black/40 border border-cyan/30 rounded-xl overflow-hidden animate-fade-up flex items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="relative w-[95%] h-[70%]">
        <div className={boxClass('CAD')} style={{ left: '2%', top: '18%', width: '30%', height: '44%' }} onMouseEnter={() => setActiveBox('CAD')} onMouseLeave={() => setActiveBox(null)}>
          <div className="p-4"><div className="text-cyan text-lg font-bold tracking-wide">CAD / DISEÑO</div><div className="text-cyan/80 text-sm mt-1">Modelos · Planos · Librerías</div></div>
        </div>
        <div className="absolute" style={{ left: '32%', top: '38%', width: '6%', height: '24%' }}>
          <svg viewBox="0 0 120 60" className="w-full h-full opacity-80"><line x1="0" y1="30" x2="92" y2="30" stroke="#00F0FF" strokeWidth="2" /><polygon points="92,24 120,30 92,36" fill="#00F0FF" /></svg>
        </div>
        <div className={boxClass('OEM')} style={{ left: '38%', top: '18%', width: '30%', height: '44%' }} onMouseEnter={() => setActiveBox('OEM')} onMouseLeave={() => setActiveBox(null)}>
          <div className="p-4"><div className="text-gold text-lg font-bold tracking-wide">ESCUELA OEM</div><div className="text-gold/80 text-sm mt-1">Proceso · Calidad · Seguridad</div></div>
        </div>
        <div className="absolute" style={{ left: '68%', top: '38%', width: '6%', height: '24%' }}>
          <svg viewBox="0 0 120 60" className="w-full h-full opacity-80"><line x1="0" y1="30" x2="92" y2="30" stroke="#00F0FF" strokeWidth="2" /><polygon points="92,24 120,30 92,36" fill="#00F0FF" /></svg>
        </div>
        <div className={boxClass('OUT')} style={{ left: '74%', top: '18%', width: '24%', height: '44%' }} onMouseEnter={() => setActiveBox('OUT')} onMouseLeave={() => setActiveBox(null)}>
          <div className="p-4"><div className="text-cyan text-lg font-bold tracking-wide">ENTREGABLES</div><div className="text-cyan/80 text-sm mt-1">Docs · Evidencia · Trazabilidad</div></div>
        </div>
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-0 w-[92%] transition-all duration-300 ${activeCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
          <div className="border border-cyan/25 bg-black/75 rounded-xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.10)]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-offwhite font-bold text-lg">{activeCard?.title} <span className="text-gray-400 font-normal text-sm">— {activeCard?.subtitle}</span></div>
            </div>
            <p className="text-gray-200 mt-2 leading-relaxed">{activeCard?.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Slide6Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

export const Slide6: React.FC<Slide6Props> = ({ nextSlide, prevSlide }) => {
  return (
    <SlideContainer>
      <Header title="CAD + INGENIERÍA" breadcrumb="FUTURO" slideNum={7} />
      <div className="mt-2 flex flex-col">
        <p className="text-sm text-gray-400">Esto también es <span className="text-gold">legado técnico</span>: conocimiento que se queda en casa y se vuelve sistema.</p>
        <div className="grid grid-cols-[30%_70%] gap-8 items-start mt-6">
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-3xl text-offwhite mb-4 leading-snug">La mancuerna natural: <strong className="text-gold">diseño/CAD</strong> + <strong className="text-cyan">disciplina automotriz</strong>.</p>
            <p className="text-xl text-gray-300 leading-relaxed">Tu hijo aporta <strong>modelos, planos y librerías</strong>. Yo aporto <strong>estándares, seguridad, calidad y trazabilidad</strong>.<span className="text-offwhite"> Resultado:</span> entregables listos para piso (y auditables).</p>
            <div className="mt-6 grid gap-3">
              <div className="flex items-start gap-3 text-lg text-gray-200"><span className="text-cyan mt-1">●</span><span><strong className="text-white">CAD →</strong> fixtures/herramentales + planos controlados por versión</span></div>
              <div className="flex items-start gap-3 text-lg text-gray-200"><span className="text-gold mt-1">●</span><span><strong className="text-white">Proceso →</strong> SOP + checklist + evidencia + cierre técnico</span></div>
              <div className="flex items-start gap-3 text-lg text-gray-200"><span className="text-green-400 mt-1">●</span><span><strong className="text-white">Efecto →</strong> menos retrabajo, menos riesgo, más velocidad de entrega</span></div>
            </div>
            <div className="mt-6 p-4 border border-gold/40 bg-black/50 rounded-xl shadow-[0_0_30px_rgba(171,123,38,0.15)] hover:shadow-[0_0_45px_rgba(171,123,38,0.25)] transition-all">
              <div className="flex items-center justify-between gap-3"><span className="text-gold font-code text-xs tracking-[5px]">INVITACIÓN</span><span className="text-cyan/70 text-xs font-code tracking-[3px]">NEXT STEP</span></div>
              <p className="text-gray-100 text-lg mt-2 leading-relaxed">Tu hijo entra a <strong className="text-white">HITECH</strong> a aprender y construir el sistema con nosotros: <strong className="text-cyan"> diseño con estándares</strong>, no “dibujos bonitos”.</p>
            </div>
          </div>
          <HolographicBlueprint />
        </div>
      </div>
      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};