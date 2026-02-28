import React from "react";
import { DataBox } from "../../SlideRenderer";
import type { ExperienceSpec } from "./types";

type ExperiencePanelProps = {
  specs: ExperienceSpec[];
};

export function ExperiencePanel(props: ExperiencePanelProps) {
  const { specs } = props;
  return (
    <DataBox
      title="EXPERIENCIA INDUSTRIAL"
      rightTag="FOUNDATION"
      className="h-full border-white/15"
      highlight="gold"
    >
      <div className="grid grid-cols-2 gap-4">
        {specs.map((spec) => (
          <article
            key={spec.id}
            className="rounded-xl border border-white/12 bg-black/35 p-4 transition-all duration-300 hover:border-cyan/40 hover:bg-black/25"
            data-stable-id={spec.id}
          >
            <p className="text-[10px] font-code tracking-[0.28em] text-cyan/75">{spec.subtitle}</p>
            <h4 className="mt-2 text-lg font-semibold text-white">{spec.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{spec.description}</p>
          </article>
        ))}
      </div>
    </DataBox>
  );
}
