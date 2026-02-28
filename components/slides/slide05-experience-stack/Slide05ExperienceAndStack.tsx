import React, { useMemo } from "react";
import { Header, NavArea, SlideContainer } from "../../SlideRenderer";
import { EXPERIENCE_SPECS, OPERATIONAL_SIGNALS } from "./data";
import { ExperiencePanel } from "./ExperiencePanel";
import { OperationalPanel } from "./OperationalPanel";
import { StackPanel } from "./StackPanel";

type Slide05ExperienceAndStackProps = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export function Slide05ExperienceAndStack(props: Slide05ExperienceAndStackProps) {
  const specs = useMemo(() => EXPERIENCE_SPECS, []);
  const signals = useMemo(() => OPERATIONAL_SIGNALS, []);

  return (
    <div data-stable-id="slide05-fused-root" className="w-full h-full">
      <SlideContainer>
        <Header
          title="EXPERIENCE + STACK"
          breadcrumb="FUSED DOMAIN"
          slideNum={6}
          rightBadge="05 / FUSION"
        />

        <div className="grid h-full grid-cols-[36%_64%] gap-4 px-6 pb-20 pt-2">
          <div className="grid grid-rows-[58%_42%] gap-4">
            <ExperiencePanel specs={specs} />
            <OperationalPanel signals={signals} />
          </div>
          <StackPanel />
        </div>

        <NavArea prev={props.prevSlide} next={props.nextSlide} />
      </SlideContainer>
    </div>
  );
}
