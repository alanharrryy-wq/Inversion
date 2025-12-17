import React, { useState } from 'react';

const FinancialDonut = () => {
  const [hoveredSection, setHoveredSection] = useState<'debt' | 'ops' | null>(null);

  const r = 38; 
  const c = 2 * Math.PI * r;
  const debtPct = 0.606; 
  const opsPct = 0.394;  
  const debtDash = c * debtPct;
  const opsDash = c * opsPct;
  const gap = 1; 
  
  return (
    <div className="flex w-full h-full items-center justify-center gap-20 animate-fade-up px-12">
       <div className="relative w-[450px] h-[450px] shrink-0 flex items-center justify-center perspective-[1000px]">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-spin-slow" style={{ animationDuration: '30s' }}></div>
          <div className="absolute inset-[30px] rounded-full border border-white/5 border-dashed animate-spin-slow" style={{ animationDuration: '40s', animationDirection: 'reverse' }}></div>
          <div className="absolute inset-[-20px] rounded-full border border-cyan/5 animate-pulse" style={{ animationDuration: '4s' }}></div>

          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-visible">
             <defs>
                <filter id="glow-gold-intense" x="-50%" y="-50%" width="200%" height="200%">
                   <feGaussianBlur stdDeviation="1.5" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-cyan-intense" x="-50%" y="-50%" width="200%" height="200%">
                   <feGaussianBlur stdDeviation="1.5" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="grad-gold-3d" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(90)">
                   <stop offset="0%" stopColor="#8a631f" />
                   <stop offset="40%" stopColor="#FFD700" />
                   <stop offset="60%" stopColor="#FFD700" />
                   <stop offset="100%" stopColor="#8a631f" />
                </linearGradient>
                <linearGradient id="grad-cyan-3d" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(90)">
                   <stop offset="0%" stopColor="#014d5e" />
                   <stop offset="40%" stopColor="#00F0FF" />
                   <stop offset="60%" stopColor="#00F0FF" />
                   <stop offset="100%" stopColor="#014d5e" />
                </linearGradient>
             </defs>

             <circle cx="50" cy="50" r={r} fill="none" stroke="#000" strokeWidth="16" />
             <circle cx="50" cy="50" r={r} fill="none" stroke="#222" strokeWidth="16" strokeOpacity="0.5" />
             
             <g 
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredSection('debt')}
                onMouseLeave={() => setHoveredSection(null)}
                style={{ 
                    filter: hoveredSection === 'debt' ? 'url(#glow-gold-intense)' : 'none',
                    opacity: hoveredSection && hoveredSection !== 'debt' ? 0.2 : 1,
                    transform: hoveredSection === 'debt' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '50px 50px',
                }}
             >
                <circle 
                   cx="50" cy="50" r={r} fill="none" stroke="url(#grad-gold-3d)" strokeWidth="14"
                   strokeDasharray={`${debtDash - gap} ${c}`} strokeDashoffset="0"
                   strokeLinecap="butt"
                />
                <circle 
                   cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeWidth="1"
                   strokeDasharray={`${debtDash - gap} ${c}`} strokeDashoffset="0"
                   strokeOpacity="0.2"
                />
             </g>

             <g 
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredSection('ops')}
                onMouseLeave={() => setHoveredSection(null)}
                style={{ 
                    filter: hoveredSection === 'ops' ? 'url(#glow-cyan-intense)' : 'none',
                    opacity: hoveredSection && hoveredSection !== 'ops' ? 0.2 : 1,
                    transform: hoveredSection === 'ops' ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: '50px 50px',
                }}
             >
                <circle 
                   cx="50" cy="50" r={r} fill="none" stroke="url(#grad-cyan-3d)" strokeWidth="14"
                   strokeDasharray={`${opsDash - gap} ${c}`} 
                   strokeDashoffset={-debtDash}
                   strokeLinecap="butt"
                />
                 <circle 
                   cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeWidth="1"
                   strokeDasharray={`${opsDash - gap} ${c}`} 
                   strokeDashoffset={-debtDash}
                   strokeOpacity="0.2"
                />
             </g>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="relative w-48 h-48 bg-black/90 rounded-full border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,1)] flex flex-col items-center justify-center backdrop-blur-md">
                 <div className={`absolute inset-0 rounded-full border-2 opacity-100 transition-all duration-500 ${hoveredSection === 'debt' ? 'border-gold shadow-[0_0_15px_rgba(255,215,0,0.5)]' : hoveredSection === 'ops' ? 'border-cyan shadow-[0_0_15px_rgba(0,240,255,0.5)]' : 'border-white/10'}`}></div>
                 
                 <div className="text-center z-10">
                    <div className={`text-6xl font-black font-display tracking-tighter transition-all duration-300 ${hoveredSection === 'debt' ? 'text-gold scale-110 drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]' : hoveredSection === 'ops' ? 'text-cyan scale-110 drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]' : 'text-white'}`}>
                       {hoveredSection === 'debt' ? '60%' : hoveredSection === 'ops' ? '40%' : '100%'}
                    </div>
                    <div className="text-xs font-code uppercase tracking-[0.2em] text-gray-400 mt-2">
                       {hoveredSection === 'debt' ? 'SANEAMIENTO' : hoveredSection === 'ops' ? 'OPERACIÓN' : 'TOTAL FUNDS'}
                    </div>
                 </div>
             </div>
          </div>
       </div>

       <div className="flex flex-col gap-6 max-w-sm">
          <div 
             onMouseEnter={() => setHoveredSection('debt')}
             onMouseLeave={() => setHoveredSection(null)}
             className={`
               group p-6 border-l-4 transition-all duration-300 cursor-pointer
               bg-gradient-to-r from-white/5 to-transparent
               ${hoveredSection === 'debt' ? 'border-gold bg-white/10 translate-x-4 shadow-[0_0_15px_rgba(171,123,38,0.15)]' : 'border-gold/30 hover:border-gold hover:bg-white/5'}
               ${hoveredSection && hoveredSection !== 'debt' ? 'opacity-30' : 'opacity-100'}
             `}
          >
             <div className="flex justify-between items-baseline mb-1">
               <h4 className="text-4xl font-black text-white">$200,000</h4>
               <span className="text-gold font-bold">60%</span>
             </div>
             <div className="h-[1px] w-full bg-gold/30 mb-2 group-hover:bg-gold transition-colors"></div>
             <p className="text-gold font-display font-bold tracking-wider text-lg">LIQUIDACIÓN DEUDA</p>
             <p className="text-gray-400 text-sm mt-1">Saneamiento financiero inmediato (Préstamo Mario).</p>
          </div>

          <div 
             onMouseEnter={() => setHoveredSection('ops')}
             onMouseLeave={() => setHoveredSection(null)}
             className={`
               group p-6 border-l-4 transition-all duration-300 cursor-pointer
               bg-gradient-to-r from-white/5 to-transparent
               ${hoveredSection === 'ops' ? 'border-cyan bg-white/10 translate-x-4 shadow-[0_0_15px_rgba(2,167,202,0.15)]' : 'border-cyan/30 hover:border-cyan hover:bg-white/5'}
               ${hoveredSection && hoveredSection !== 'ops' ? 'opacity-30' : 'opacity-100'}
             `}
          >
             <div className="flex justify-between items-baseline mb-1">
               <h4 className="text-4xl font-black text-white">$130,000</h4>
               <span className="text-cyan font-bold">40%</span>
             </div>
             <div className="h-[1px] w-full bg-cyan/30 mb-2 group-hover:bg-cyan transition-colors"></div>
             <p className="text-cyan font-display font-bold tracking-wider text-lg">CAPITAL OPERATIVO</p>
             <p className="text-gray-400 text-sm mt-1">Viáticos SRG + Renta + Costos Fiscales (60 días).</p>
          </div>
       </div>
    </div>
  );
};

export default FinancialDonut;