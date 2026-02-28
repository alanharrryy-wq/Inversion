import React from "react";
import { DataBox } from "../../SlideRenderer";
import IndustrialIntelligenceStack from "../../IndustrialStack";

export function StackPanel() {
  return (
    <DataBox
      title="STACK DE EJECUCIÓN"
      rightTag="FUSED FROM LEGACY 08"
      className="h-full border-cyan/35"
      highlight="cyan"
    >
      <div data-stable-id="slide05-stack-zone" className="h-[460px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <IndustrialIntelligenceStack />
      </div>
    </DataBox>
  );
}
