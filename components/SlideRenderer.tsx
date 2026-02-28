import React from "react";
import {
  assertSlideRegistryInvariant,
  getSlideCount,
  getSlideLabels,
  resolveSlideComponentForSlot,
} from "../runtime/slides/contracts";

// ✅ UI base vive aquí (una sola fuente de verdad)
export {
  SlideContainer,
  Header,
  NavArea,
  DataBox,
  LensWrapper,
} from "./Slide/SlideShell";

// Slides (deja tus imports tal cual)
import { Slide00 } from "./slides/Slide00";
import { Slide01 } from "./slides/Slide01";
import { Slide02 } from "./slides/Slide02";
import { Slide03 } from "./slides/Slide03";
import { Slide04 } from "./slides/Slide04";
import { Slide05ExperienceAndStack } from "./slides/slide05-experience-stack";
import { Slide06 } from "./slides/Slide06";
import { Slide07 } from "./slides/Slide07";
import { Slide12 } from "./slides/Slide12";
import { Slide09InvestmentModel } from "./slides/slide09-investment-model";
import { Slide13 } from "./slides/Slide13";
import { Slide17 } from "./slides/Slide17";
import { Slide11CloseAndRisk } from "./slides/slide11-close-risk";

interface SlideProps {
  index: number;
  totalSlides: number;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (idx: number) => void;
  openModal: (images: string[], title: string) => void;
  wowDemo?: boolean;
}

type SlideFC = React.FC<any>;

const Fallback: React.FC<{ index: number }> = ({ index }) => (
  <div className="w-full h-full flex items-center justify-center bg-black text-white">
    <div className="text-center space-y-3">
      <div className="text-6xl">⚠️</div>
      <div className="text-xl font-bold">Índice fuera de rango</div>
      <div className="text-sm text-white/60">
        index: <span className="font-code text-cyan">{index}</span>
      </div>
    </div>
  </div>
);

const SLIDE_COMPONENTS: Record<string, SlideFC> = {
  Slide00,
  Slide01,
  Slide02,
  Slide03,
  Slide04,
  Slide05ExperienceAndStack,
  Slide06,
  Slide07,
  Slide12,
  Slide09InvestmentModel,
  Slide13,
  Slide17,
  Slide11CloseAndRisk,
};

assertSlideRegistryInvariant({
  expectedSlotCount: getSlideCount(),
  availableComponentExports: Object.keys(SLIDE_COMPONENTS),
});

export const SLIDE_LABELS = getSlideLabels();

const SLIDES: SlideFC[] = SLIDE_LABELS.map((_, slot) => {
  const resolved = resolveSlideComponentForSlot(slot, SLIDE_COMPONENTS);
  if (resolved) {
    return resolved;
  }

  return () => <Fallback index={slot} />;
});

const SlideRenderer: React.FC<SlideProps> = (props) => {
  const { index } = props;
  if (import.meta.env.DEV && props.totalSlides !== SLIDES.length) {
    console.error(
      `[SlideRenderer] slot contract mismatch: totalSlides=${props.totalSlides} registrySlots=${SLIDES.length}`
    );
  }

  const Comp = SLIDES[index] ?? (() => <Fallback index={index} />);
  const slideProps = {
    nextSlide: props.nextSlide,
    prevSlide: props.prevSlide,
    goToSlide: props.goToSlide,
    openModal: props.openModal,
    wowDemo: props.wowDemo,
  };

  return (
    <div key={index} className={props.wowDemo ? "wow-slide-transition" : undefined}>
      <Comp {...slideProps} />
    </div>
  );
};

export default SlideRenderer;
