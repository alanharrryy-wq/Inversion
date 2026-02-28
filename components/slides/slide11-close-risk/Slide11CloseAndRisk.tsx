import React from "react";
import { Header, NavArea, SlideContainer } from "../../SlideRenderer";
import HolographicFiles from "../../widgets/HolographicFiles";
import { RiskProofGrid } from "./RiskProofGrid";

type Slide11CloseAndRiskProps = {
  nextSlide: () => void;
  prevSlide: () => void;
};

export function Slide11CloseAndRisk(props: Slide11CloseAndRiskProps) {
  return (
    <div data-stable-id="slide11-close-root" className="w-full h-full">
      <SlideContainer>
        <Header
          title="CLOSE / RISK / PROOF"
          breadcrumb="FUSED ENDGAME"
          slideNum={12}
          rightBadge="11 / FUSION"
        />

        <div className="grid h-full grid-cols-[58%_42%] gap-4 px-6 pb-20 pt-2">
          <section className="space-y-4 rounded-2xl border border-white/12 bg-black/30 p-4">
            <p className="text-xs font-code tracking-[0.24em] text-cyan/85">
              DOCUMENT EVIDENCE STACK
            </p>
            <HolographicFiles />
          </section>

          <section className="grid grid-rows-[62%_38%] gap-4">
            <div className="rounded-2xl border border-white/12 bg-black/30 p-4">
              <p className="mb-3 text-xs font-code tracking-[0.24em] text-cyan/85">
                RISK DEFENSE MATRIX
              </p>
              <RiskProofGrid />
            </div>

            <div
              data-stable-id="slide11-proof-close"
              className="rounded-2xl border border-gold/30 bg-gold/10 p-5"
            >
              <p className="text-sm font-code tracking-[0.22em] text-gold">FINAL PROOF</p>
              <p className="mt-2 text-2xl font-bold text-white leading-tight">
                &quot;No invertir en esto no es rechazar una idea.
              </p>
              <p className="mt-1 text-xl text-white/90">
                Es rechazar una operación que ya demuestra resultado.&quot;
              </p>
              <p className="mt-3 text-sm text-gray-200">Mario, CEO · HITECH RTS</p>
            </div>
          </section>
        </div>

        <NavArea prev={props.prevSlide} next={props.nextSlide} />
      </SlideContainer>
    </div>
  );
}
