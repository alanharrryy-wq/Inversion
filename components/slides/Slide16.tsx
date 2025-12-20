import React from "react";
import { SlideContainer, Header, NavArea } from "../SlideRenderer";

import FinancialDonut from "../FinancialDonut";
import RiskCoverageMeter from "../widgets/RiskCoverageMeter";
import BridgeLoanPanel from "../widgets/BridgeLoanPanel";

export const Slide16: React.FC<{ nextSlide: () => void; prevSlide: () => void }> = ({
  nextSlide,
  prevSlide,
}) => {
  return (
    <SlideContainer>
      <Header title="USO DE FONDOS" breadcrumb="DETALLE + GARANTÍA" slideNum={16} />

      <div className="grid grid-cols-[55%_45%] gap-6 h-full overflow-hidden">
        {/* LEFT: Donut (Uso de fondos) */}
        <div className="h-full overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            <FinancialDonut />
          </div>

          <div className="mt-4 text-xs text-gray-400 font-code tracking-widest">
            NOTA: Distribución estimada de capital (ajustable por fase y contrato).
          </div>
        </div>

        {/* RIGHT: Garantía SRG */}
        <div className="h-full min-h-0 overflow-y-auto pr-2 flex flex-col gap-6">
          <RiskCoverageMeter />
          <BridgeLoanPanel />
        </div>
      </div>

      <NavArea prev={prevSlide} next={nextSlide} />
    </SlideContainer>
  );
};

export default Slide16;
