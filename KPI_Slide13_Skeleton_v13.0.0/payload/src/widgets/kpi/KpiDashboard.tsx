import React, { useMemo } from "react";
import { KPI_ITEMS } from "./kpi.data";
import { useKpiController } from "./kpi.hooks";
import { KpiScene } from "./KpiScene";
import { KpiGrid } from "./KpiGrid";
import { KpiHud } from "./KpiHud";
import { KpiTelemetry } from "./KpiTelemetry";

export const KpiDashboard: React.FC = () => {
  const ctrl = useKpiController(KPI_ITEMS);

  const activeItem = useMemo(
    () => ctrl.items.find((x) => x.id === ctrl.activeId) ?? null,
    [ctrl.items, ctrl.activeId]
  );

  return (
    <div className="relative w-full h-full">
      <KpiScene mode={ctrl.mode} reducedMotion={ctrl.prefersReducedMotion} />

      <div className="w-full h-full grid grid-rows-[1fr_auto]">
        <KpiGrid
          items={ctrl.items}
          hoveredId={ctrl.hoveredId}
          selectedId={ctrl.selectedId}
          onHover={ctrl.setHovered}
          onSelect={ctrl.select}
        />

        <KpiHud item={activeItem} locked={ctrl.mode === "locked"} />
      </div>

      <KpiTelemetry />
    </div>
  );
};
