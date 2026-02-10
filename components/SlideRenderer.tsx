import React from "react";

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
import { Slide05 } from "./slides/Slide05";
import { Slide06 } from "./slides/Slide06";
import { Slide7 } from "./slides/Slide7";
import { Slide08 } from "./slides/Slide08";
import { Slide09 } from "./slides/Slide09";
import { Slide10 } from "./slides/Slide10";
import { Slide12 } from "./slides/Slide12";
import { Slide13 } from "./slides/Slide13";
import { Slide14 } from "./slides/Slide14";
import { Slide15 } from "./slides/Slide15";
import { Slide16 } from "./slides/Slide16";
import { Slide16_Investor } from "./slides/Slide16_Investor";
import { Slide17 } from "./slides/Slide17";
import { Slide18 } from "./slides/Slide18";
import { Slide19 } from "./slides/Slide19";

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

// ✅ Mapa declarativo (orden = índice)
const SLIDES: SlideFC[] = [
  Slide00,           // 0
  Slide01,           // 1
  Slide02,           // 2
  Slide03,           // 3
  Slide04,           // 4
  Slide05,           // 5
  Slide06,           // 6 (requiere props extra)
  Slide7,            // 7
  Slide08,           // 8
  Slide09,           // 9
  Slide10,           // 10
  Slide12,           // 11 (ojo: nombre “Slide12” aquí es índice 11 en tu deck)
  Slide13,           // 12
  Slide14,           // 13
  Slide15,           // 14
  Slide16,           // 15
  Slide16_Investor,  // 16
  Slide17,           // 17 (requiere openModal)
  Slide18,           // 18
  Slide19,           // 19 (requiere goToSlide)
];

export const SLIDE_LABELS = [
  "Slide00",
  "Slide01",
  "Slide02",
  "Slide03",
  "Slide04",
  "Slide05",
  "Slide06",
  "Slide07",
  "Slide08",
  "Slide09",
  "Slide10",
  "Slide11",
  "Slide12",
  "Slide13",
  "Slide14",
  "Slide15",
  "Slide16",
  "Slide17",
  "Slide18",
  "Slide19",
] as const;

const SlideRenderer: React.FC<SlideProps> = (props) => {
  const { index } = props;

  const Comp = SLIDES[index] ?? (() => <Fallback index={index} />);

  // ✅ Props “especiales” por slide (quirúrgico y claro)
  // - La mayoría solo ocupa next/prev
  // - Algunos ocupan goToSlide u openModal
  const common = { nextSlide: props.nextSlide, prevSlide: props.prevSlide };

  if (index === 6) {
    return (
      <div key={index} className={props.wowDemo ? "wow-slide-transition" : undefined}>
        <Comp {...common} goToSlide={props.goToSlide} openModal={props.openModal} />
      </div>
    );
  }
  if (index === 17) {
    return (
      <div key={index} className={props.wowDemo ? "wow-slide-transition" : undefined}>
        <Comp {...common} openModal={props.openModal} />
      </div>
    );
  }
  if (index === 19) {
    return (
      <div key={index} className={props.wowDemo ? "wow-slide-transition" : undefined}>
        <Comp prevSlide={props.prevSlide} goToSlide={props.goToSlide} />
      </div>
    );
  }

  return (
    <div key={index} className={props.wowDemo ? "wow-slide-transition" : undefined}>
      <Comp {...common} />
    </div>
  );
};

export default SlideRenderer;
