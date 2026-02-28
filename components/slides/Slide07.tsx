import React, { useEffect } from "react";
import { Header, NavArea, SlideContainer } from "../SlideRenderer";
import { buildSlide07EnteredEvent } from "./slide07-ui/routeb/slide07.helpers";
import { SystemRitual } from "./slide07-ui/routeb/SystemRitual";

interface Slide07Props {
  nextSlide: () => void;
  prevSlide: () => void;
}

function emitSlide07Entered(): void {
  if (typeof window === "undefined") {
    return;
  }

  const domainEvent = buildSlide07EnteredEvent(0);
  window.dispatchEvent(
    new CustomEvent(domainEvent.name, {
      detail: domainEvent,
    })
  );
}

export const Slide07: React.FC<Slide07Props> = ({ nextSlide, prevSlide }) => {
  useEffect(() => {
    emitSlide07Entered();
  }, []);

  return (
    <div data-stable-id="slide07-root" className="w-full h-full">
      <SlideContainer>
        <Header title="SMARTSERVICE™" breadcrumb="SISTEMA" slideNum={8} />

        <div
          data-stable-id="slide07-system-ritual"
          style={{
            height: "100%",
            width: "100%",
            padding: "12px 16px 6px",
            display: "grid",
            gridTemplateRows: "1fr",
          }}
        >
          <SystemRitual profile="legacy" />
        </div>

        <NavArea prev={prevSlide} next={nextSlide} />
      </SlideContainer>
    </div>
  );
};
