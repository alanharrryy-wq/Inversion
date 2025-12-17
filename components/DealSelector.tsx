import React, { useState } from 'react';

// NEW: Holographic Smart Contract Overlay for Slide 18 - "DIGITAL HANDSHAKE" VERSION (ENHANCED)
export const TermSheetOverlay = ({ deal, onClose }: { deal: any, onClose: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [hash, setHash] = useState('');

  if (!deal) return null;

  const handleInitiate = () => {
    setStatus('processing');
    
    // Simulate generation delay
    setTimeout(() => {
      setHash('0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase());
      setStatus('success');
      
      // Auto-open mail client
      setTimeout(() => {
         const subject = `CONFIRMACIÓN DE PROTOCOLO: ${deal.title}`;
         const body = `HITECH SYSTEM,\n\nSolicito iniciar el proceso de formalización para la ${deal.title} (${deal.type}).\n\nInversión: $330,000 MXN\nHash de Referencia: ${hash}\n\nQuedo en espera de los documentos finales.`;
         window.location.href = `mailto:contacto@hitech-rts.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }, 2000);
    }, 2500);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-8 animate-fade-up">
      {/* Enhanced Container: Wider, Taller */}
      <div className={`w-[95%] h-[95%] border relative p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-colors duration-500 flex flex-col ${status === 'success' ? 'border-green-500 bg-black shadow-[0_0_50px_rgba(0,255,0,0.2)]' : 'border-cyan bg-black shadow-[0_0_50px_rgba(0,240,255,0.2)]'}`}>
        
        {/* Status: IDLE (Contract Review) */}
        {status === 'idle' && (
          <>
            <div className="flex justify-between items-start mb-8 border-b border-white/20 pb-4 shrink-0">
              <div>
                <h3 className="text-5xl font-display font-black text-white mb-2">SMART CONTRACT // {deal.id}</h3>
                <p className="font-code text-gold text-2xl tracking-widest">{deal.type} PROTOCOL</p>
              </div>
              <div className="text-right">
                 <div className="text-lg text-cyan font-code animate-pulse mb-2">STATUS: PENDING SIGNATURE</div>
              </div>
            </div>

            {/* Financial Dashboard - NEW FEATURE */}
            <div className="grid grid-cols-2 gap-8 mb-8 shrink-0">
               <div className="bg-white/5 border border-gold/50 p-6 flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-xl font-code mb-2">INVERSIÓN REQUERIDA</span>
                  <div className="text-8xl text-white font-black">$330k</div>
               </div>
               <div className="bg-white/5 border border-cyan/50 p-6 flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-xl font-code mb-2">RETORNO / VALOR</span>
                  <div className="text-8xl text-cyan font-black">{deal.val}</div>
               </div>
            </div>

            <div className="font-code text-2xl text-gray-300 space-y-4 mb-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
               <p className="text-cyan"> &gt; INITIATING_TERM_SHEET_GENERATION...</p>
               <p> &gt; <span className="text-white">INVESTOR_PROFILE:</span> ACCREDITED</p>
               <p> &gt; <span className="text-white">TERMS:</span></p>
               <ul className="list-disc pl-10 space-y-2 text-gray-400">
                  <li>Instrumento: <strong className="text-white">{deal.id === 'A' ? 'Acciones Ordinarias (Equity Puro)' : deal.id === 'B' ? 'Contrato de Mutuo (Deuda Privada)' : 'Nota Convertible / SAFE'}</strong></li>
                  <li>Plazo: <strong className="text-white">{deal.id === 'A' ? 'Indefinido (Exit/Dividendos)' : deal.id === 'B' ? '12-24 Meses (Amortizable)' : '24 Meses (Conversión/Pago)'}</strong></li>
                  <li>Garantía: <strong className="text-white">{deal.id === 'B' ? 'Activos de la empresa + Pagaré' : 'Desempeño comercial y valor de marca'}</strong></li>
               </ul>
               <p className="mt-8 text-white text-3xl italic border-l-4 border-gold pl-4"> &gt; "{deal.verdict}"</p>
            </div>

            <div className="flex justify-end gap-6 shrink-0">
               <button onClick={onClose} className="px-8 py-4 border-2 border-red-500 text-red-500 font-bold text-xl hover:bg-red-500/10 tracking-widest">CANCEL</button>
               <button onClick={handleInitiate} className="px-8 py-4 bg-cyan text-black font-bold text-xl hover:bg-white hover:shadow-[0_0_20px_#fff] tracking-widest">INITIATE PROTOCOL</button>
            </div>
          </>
        )}

        {/* Status: PROCESSING */}
        {status === 'processing' && (
           <div className="flex-1 flex flex-col items-center justify-center font-code text-cyan">
              <div className="w-32 h-32 border-8 border-cyan border-t-transparent rounded-full animate-spin mb-12"></div>
              <p className="text-4xl animate-pulse mb-4">&gt; ENCRYPTING ASSETS...</p>
              <p className="text-xl text-gray-500">ESTABLISHING SECURE UPLINK</p>
           </div>
        )}

        {/* Status: SUCCESS */}
        {status === 'success' && (
           <div className="flex-1 flex flex-col items-center justify-center font-code text-center animate-fade-up">
              <div className="text-9xl mb-8">✅</div>
              <h2 className="text-6xl font-bold text-green-500 mb-4">ACCESS GRANTED</h2>
              <p className="text-white text-3xl tracking-[10px] mb-12">PROTOCOL ACTIVE</p>
              
              <div className="bg-green-900/20 border border-green-500/30 p-8 rounded-xl mb-8 max-w-3xl">
                 <p className="text-lg text-gray-400 mb-2">TRANSACTION HASH:</p>
                 <p className="text-green-400 font-bold text-2xl break-all">{hash}</p>
              </div>

              <p className="text-gray-400 animate-pulse text-xl">REDIRECTING TO SECURE CHANNEL...</p>
           </div>
        )}

      </div>
    </div>
  );
};

const InteractiveDealSelector = ({ openModal }: { openModal?: (images: string[], title: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeTermSheet, setActiveTermSheet] = useState<any | null>(null);

  const deals = [
    { 
      id: 'A', 
      title: 'SOCIO PATRIMONIAL', 
      subtitle: 'EQUITY', 
      val: '20%', 
      sub: 'DE LA EMPRESA', 
      verdict: 'Multiplica valor a largo plazo y tiene voz en la operación.', 
      color: 'gold',
      details: [
        '$300,000 MXN Inversión',
        'Asiento Consultivo',
        'Horizonte 18-36 Meses',
        'Salida: Recompra/Venta'
      ]
    },
    { 
      id: 'B', 
      title: 'RENTA FIJA', 
      subtitle: 'DEUDA PRIVADA', 
      val: '+20%', 
      sub: 'ROI FIJO', 
      verdict: 'Retorno claro sin participación accionaria.', 
      color: 'cyan',
      details: [
        '$300,000 MXN Inversión',
        'Plazo: 60-120 Días',
        'Garantía: OC / Pagaré',
        'Sin Equity'
      ]
    },
    { 
      id: 'C', 
      title: 'HÍBRIDO', 
      subtitle: 'BALANCEADO', 
      val: '10% + 10%', 
      sub: 'EQUITY + ROI', 
      verdict: 'Mejor de ambos mundos: liquidez + upside.', 
      color: 'gold', // Using gold for hybrid focus
      details: [
        '10% Acciones HITECH',
        '10% ROI s/Capital',
        'Retorno Rápido',
        'Upside Futuro'
      ]
    }
  ];

  const handleSelect = (deal: any) => {
    setActiveTermSheet(deal);
  };

  return (
    <>
      <div className="flex justify-center gap-4 h-[90%] items-center animate-fade-up mt-2">
        {deals.map((deal) => {
          const isSelected = selected === deal.id;
          const isDimmed = selected && selected !== deal.id;
          const borderColor = deal.color === 'gold' ? 'border-gold' : 'border-cyan';
          const textColor = deal.color === 'gold' ? 'text-gold' : 'text-cyan';
          const shadowColor = deal.color === 'gold' ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.3)';

          return (
            <div 
              key={deal.id} 
              onMouseEnter={() => setSelected(deal.id)} 
              onMouseLeave={() => setSelected(null)} 
              className={`
                relative h-full transition-all duration-500 ease-out cursor-pointer border flex flex-col items-center justify-start pt-10 px-6 overflow-hidden
                ${isSelected ? `w-[45%] bg-black/80 ${borderColor} shadow-[0_0_40px_${shadowColor}] z-10` : isDimmed ? 'w-[25%] bg-black/40 border-white/10 opacity-40 blur-[2px]' : 'w-[30%] bg-black/40 border-white/20'}
              `}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h4 className={`text-2xl font-bold font-display tracking-wider mb-1 transition-colors ${isSelected ? textColor : 'text-gray-400'}`}>
                  {deal.title}
                </h4>
                <p className="text-sm font-code tracking-[4px] text-white/60 uppercase">
                  {deal.subtitle}
                </p>
              </div>
              
              {/* Big Data */}
              <div className="flex flex-col items-center justify-center py-6 border-y border-white/10 w-full mb-6 bg-white/5">
                <div className={`text-7xl font-black font-display leading-none mb-2 transition-transform ${isSelected ? `scale-110 text-white drop-shadow-[0_0_15px_${shadowColor}]` : 'text-gray-500'}`}>
                  {deal.val}
                </div>
                <div className={`text-lg font-bold font-main uppercase tracking-widest ${isSelected ? textColor : 'text-gray-600'}`}>
                  {deal.sub}
                </div>
              </div>

              {/* Details List */}
              <ul className={`w-full space-y-3 mb-8 transition-all duration-300 ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {deal.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center text-lg text-gray-300 font-main">
                    <span className={`mr-3 text-xl ${textColor}`}>›</span>
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Footer Quote & Action */}
              <div className={`mt-auto mb-8 w-full text-center transition-all duration-500 delay-100 flex flex-col items-center ${isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className={`w-16 h-[2px] bg-${deal.color} mb-4 opacity-50`}></div>
                <p className="text-xl text-white font-medium italic leading-relaxed mb-6">
                  "{deal.verdict}"
                </p>
                <button 
                  onClick={() => handleSelect(deal)}
                  className={`px-8 py-3 border ${borderColor} ${textColor} font-bold hover:bg-${deal.color} hover:text-black transition-all uppercase tracking-widest text-sm`}
                >
                  SELECCIONAR
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {activeTermSheet && (
        <TermSheetOverlay deal={activeTermSheet} onClose={() => setActiveTermSheet(null)} />
      )}
    </>
  );
};

export default InteractiveDealSelector;