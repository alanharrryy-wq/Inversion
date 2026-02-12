
import React, { useEffect, useMemo, useState } from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";
import { WOW_GUIDE_ENGINE, WOW_SLIDE05_EXTRAHEIGHT, WOW_SLIDE05_INTERACTIVE } from "../../config/wow";
import { emitSlideGuideEvent } from "../Slide/slideEvents";
import "./Slide05.interactive.css";

const SPECS = [
  {
    id: "01",
    title: "ISO STANDARD",
    subtitle: "COMPLIANCE",
    icon: "📝",
    desc: "Procedimientos alineados a normativa internacional. Auditoría sin fricción.",
  },
  {
    id: "02",
    title: "LOTO READY",
    subtitle: "SAFETY",
    icon: "🔒",
    desc: "Protocolos de bloqueo y etiquetado estrictos. Cero accidentes.",
  },
  {
    id: "03",
    title: "EVIDENCIA 360",
    subtitle: "TRACEABILITY",
    icon: "📸",
    desc: "Reportes fotográficos y mediciones trazables. Historial inmutable.",
  },
  {
    id: "04",
    title: "OEM QUALITY",
    subtitle: "STANDARDS",
    icon: "⚙️",
    desc: "Refacciones y procesos de grado fabricante. Durabilidad garantizada.",
  },
];

type SpecItem = (typeof SPECS)[0];

const TechModule = ({ item, interactive }: { item: SpecItem; interactive: boolean }) => {
  const [hover, setHover] = useState(false);

  const emit = (kind: "hover" | "click" | "focus") => {
    if (!interactive) return;
    emitSlideGuideEvent(`slide05:module-${kind}`, { moduleId: item.id, title: item.title, slide: 5 });
  };

  return (
    <div
      className={`
        relative group h-48 w-full border transition-all duration-500 ease-out cursor-pointer overflow-hidden
        ${
          hover
            ? "border-cyan bg-cyan/5 shadow-[0_0_30px_rgba(0,240,255,0.1)]"
            : "border-white/10 bg-black/40 hover:border-white/30"
        }
      `}
      onMouseEnter={() => {
        setHover(true);
        emit("hover");
      }}
      onMouseLeave={() => setHover(false)}
      onFocus={() => emit("focus")}
      onClick={() => emit("click")}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          emit("click");
        }
      }}
      role="button"
      tabIndex={0}
      data-tour-id={`slide05-module-${item.id}`}
      data-guide-anchor={`slide05-module-${item.id}`}
      data-guide-evidence="slide05-module"
    >
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${hover ? "opacity-20" : "opacity-0"}`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors duration-300 ${hover ? "border-cyan" : "border-white/20"}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors duration-300 ${hover ? "border-cyan" : "border-white/20"}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors duration-300 ${hover ? "border-cyan" : "border-white/20"}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors duration-300 ${hover ? "border-cyan" : "border-white/20"}`} />

      <div className="relative h-full p-6 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className={`font-code text-[10px] tracking-widest mb-1 transition-colors duration-300 ${hover ? "text-cyan" : "text-gray-500"}`}>
              MOD // {item.id}
            </span>
            <h3 className={`font-display font-bold text-xl tracking-wide transition-colors duration-300 ${hover ? "text-white" : "text-gray-300"}`}>
              {item.title}
            </h3>
          </div>
          <div className={`text-2xl transition-all duration-500 ${hover ? "scale-110 grayscale-0" : "grayscale opacity-50"}`}>{item.icon}</div>
        </div>

        <div className="relative overflow-hidden mt-2 flex-1 flex flex-col justify-end">
          <div className={`transform transition-all duration-500 ease-out ${hover ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
            <p className="text-sm text-cyan/90 leading-relaxed font-main border-l-2 border-cyan/50 pl-3">{item.desc}</p>
          </div>
          <div className={`absolute bottom-0 left-0 transform transition-all duration-500 ${hover ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
            <p className="text-xs font-code text-gray-600 uppercase tracking-widest">{item.subtitle} PROTOCOL</p>
          </div>
        </div>

        <div className="w-full h-[1px] bg-white/10 mt-4 relative overflow-hidden">
          <div className={`absolute inset-0 bg-cyan shadow-[0_0_10px_#00F0FF] transition-transform duration-700 ease-out ${hover ? "translate-x-0" : "-translate-x-full"}`} />
        </div>
      </div>
    </div>
  );
};

interface Slide05Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

function BackgroundLayer() {
  return <div className="wow-slide05-interactive__background" aria-hidden="true" />;
}

function ImpactLayer() {
  return (
    <div aria-hidden="true">
      <div className="wow-slide05-interactive__impact-zone wow-slide05-interactive__impact-zone--left" />
      <div className="wow-slide05-interactive__impact-zone wow-slide05-interactive__impact-zone--right" />
    </div>
  );
}

function FooterLayer() {
  return (
    <div className="wow-slide05-interactive__footer" aria-hidden="true">
      <div className="wow-slide05-interactive__status">INTERACTIVE GUIDE SURFACE READY</div>
    </div>
  );
}

export const Slide05: React.FC<Slide05Props> = ({ nextSlide, prevSlide }) => {
  const specs = useMemo(() => SPECS, []);
  const interactiveOn = WOW_SLIDE05_INTERACTIVE || WOW_GUIDE_ENGINE;
  const extraHeightOn = WOW_SLIDE05_EXTRAHEIGHT;

  useEffect(() => {
    if (!interactiveOn) return;
    emitSlideGuideEvent("slide:entered", { slide: 5 });
    emitSlideGuideEvent("slide05:surface-ready", { slide: 5, modules: specs.length });
  }, [interactiveOn, specs.length]);

  return (
    <SlideContainer extraHeight={extraHeightOn}>
      <Header title="KNOW-HOW AUTOMOTRIZ" breadcrumb="EXPERIENCIA" slideNum={6} />

      <div
        className={`wow-slide05-interactive ${extraHeightOn ? "wow-slide05-interactive--extra-height" : ""}`}
        data-tour-id="slide05-surface"
        data-guide-anchor="slide05-surface"
      >
        {interactiveOn && <BackgroundLayer />}
        {interactiveOn && <ImpactLayer />}

        <div className="wow-slide05-interactive__foreground">
          <div className="grid grid-cols-[35%_65%] gap-12 items-center h-full px-8 pt-4">
            <div
              className="flex flex-col justify-center gap-8 border-r border-white/5 pr-12 h-[80%]"
              data-tour-id="slide05-narrative"
              data-guide-anchor="slide05-narrative"
            >
              <div className="animate-fade-up space-y-8">
                <div className="inline-block px-3 py-1 border border-gold/30 rounded bg-gold/5 text-gold font-code text-xs tracking-[2px] mb-2">ORIGEN INDUSTRIAL</div>
                <h3 className="text-3xl font-display text-white leading-tight">La base de HITECH viene de ambientes pesados.</h3>
                <p className="text-xl text-gray-300 font-light leading-relaxed">
                  Formados en la exigencia de <strong className="text-gold font-bold">Ford</strong> y <strong className="text-gold font-bold">GM</strong>. Donde el error no es una opción y el estándar es la ley.
                </p>
                <div className="mt-4 pl-6 border-l-2 border-cyan/50 py-2">
                  <p className="text-2xl text-offwhite italic">
                    "Tu operación produce. <br />
                    <span className="text-cyan font-bold not-italic">Yo aporto estandarización.</span>"
                  </p>
                </div>
                {interactiveOn ? <div className="wow-slide05-interactive__beat">ACTION: Hover/click modules to emit evidence events</div> : null}
              </div>
            </div>

            <div
              className="grid grid-cols-2 gap-4 w-full max-w-4xl animate-fade-up"
              style={{ animationDelay: "0.2s" }}
              data-tour-id="slide05-modules"
              data-guide-anchor="slide05-modules"
            >
              {specs.map((spec) => (
                <TechModule key={spec.id} item={spec} interactive={interactiveOn} />
              ))}
            </div>
          </div>
        </div>

        {interactiveOn && <FooterLayer />}
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

