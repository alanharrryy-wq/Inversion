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

  const isLocked = ctrl.mode === "locked";

  return (
    <div className="relative w-full h-full">
      <KpiScene mode={ctrl.mode} reducedMotion={ctrl.prefersReducedMotion} />

      {/* 🔒 Layout maestro: grid + HUD con altura fija */}
      <div
        ref={ctrl.insideRef}
        className="w-full h-full grid"
        style={{
          gridTemplateRows: "1fr 170px", // 👈 CLAVE: HUD no crece
        }}
      >
        {/* GRID KPI */}
        <div className="min-h-0">
          <KpiGrid
            items={ctrl.items}
            hoveredId={ctrl.hoveredId}
            selectedId={ctrl.selectedId}
            onHover={ctrl.setHovered}
            onSelect={ctrl.toggleSelect}
          />
        </div>

        {/* HUD KPI */}
        <div className="min-h-0 overflow-hidden">
          <KpiHud item={activeItem} locked={isLocked} />
        </div>
      </div>

      <KpiTelemetry />
    </div>
  );
};
