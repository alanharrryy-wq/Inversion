import React from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import { Scene } from "./slide02-ui";

type Slide02Props = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export const Slide02: React.FC<Slide02Props> = ({ nextSlide, prevSlide }) => {
  return (
    <div data-stable-id="slide02-root" className="w-full h-full">
      <SlideContainer>
        <Header title="PUENTE OPERATIVO" breadcrumb="SISTEMA" slideNum={3} />

        <Scene
          uiStrings={{
            heading: "Bridge: Constraint Tightening",
            subheading:
              "Compact continuity layer from selected route into deterministic system evidence.",
            hint:
              "Adjust the controls to tighten constraints. Panels update instantly from reducer output.",
            replayHint:
              "Replay capture/playback is deterministic and does not depend on timers or random input.",
          }}
        />

        <NavArea prev={prevSlide} next={nextSlide} />
      </SlideContainer>
    </div>
  );
};
