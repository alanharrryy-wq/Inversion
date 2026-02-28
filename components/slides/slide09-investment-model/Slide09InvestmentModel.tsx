import React from "react";
import { Header, NavArea, SlideContainer } from "../../SlideRenderer";
import FinancialEquation from "../../widgets/FinancialEquation";
import MissionProgressBar from "../../widgets/MissionProgressBar";
import { InvestorLayersPanel } from "./InvestorLayersPanel";

type Slide09InvestmentModelProps = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export function Slide09InvestmentModel(props: Slide09InvestmentModelProps) {
  return (
    <div data-stable-id="slide09-investment-root" className="w-full h-full">
      <SlideContainer>
        <Header
          title="INVESTMENT MODEL"
          breadcrumb="FUSED CAPITAL STACK"
          slideNum={10}
          rightBadge="09 / FUSION"
        />

        <div className="grid h-full grid-rows-[46%_54%] gap-4 px-6 pb-20 pt-2">
          <section className="grid grid-cols-[58%_42%] gap-4">
            <div className="rounded-2xl border border-cyan/25 bg-black/30 p-4">
              <p className="mb-2 text-xs font-code tracking-[0.24em] text-cyan">
                EXECUTION ROADMAP
              </p>
              <MissionProgressBar />
            </div>
            <InvestorLayersPanel />
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 text-xs font-code tracking-[0.24em] text-white/70">
              ECONOMIC EQUATION
            </p>
            <FinancialEquation />
          </section>
        </div>

        <NavArea prev={props.prevSlide} next={props.nextSlide} />
      </SlideContainer>
    </div>
  );
}
