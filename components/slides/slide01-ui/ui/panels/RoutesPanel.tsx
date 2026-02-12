import React from "react";
import {
  criterionContributionById,
  criterionSignalPercent,
  CriterionId,
  selectedRouteId,
  Slide01State,
  SLIDE01_TEST_IDS,
} from "../../core/fsm";
import { PanelFrame } from "../atoms/PanelFrame";
import { RouteCriterionRow } from "../atoms/RouteCriterionRow";
import { ScorePill } from "../atoms/ScorePill";

const CRITERION_IDS: CriterionId[] = [
  "deliverySpeed",
  "operationalRisk",
  "scalability",
  "budgetPredictability",
  "knowledgeRetention",
];

function routeHighlightClass(routeId: "A" | "B", selected: "A" | "B" | null): string {
  if (!selected) return "border-white/15";
  if (selected === routeId) {
    return routeId === "A"
      ? "border-orange-300/70 shadow-[0_0_26px_rgba(251,146,60,0.25)]"
      : "border-cyan-300/70 shadow-[0_0_26px_rgba(34,211,238,0.25)]";
  }
  return "border-white/15 opacity-70";
}

export const RoutesPanel: React.FC<{ state: Slide01State }> = ({ state }) => {
  const selected = selectedRouteId(state);
  const signal = (criterionId: CriterionId) => criterionSignalPercent(state, criterionId);
  const contribution = (criterionId: CriterionId) => criterionContributionById(state, criterionId);

  return (
    <PanelFrame
      testId={SLIDE01_TEST_IDS.routesPanel}
      title="Route Options"
      subtitle="Both routes are fixed. The gesture determines deterministic fit against these profiles."
      className="h-full"
      rightSlot={
        <div className="flex gap-2">
          <ScorePill label="A" score={state.score.routeA} tone="A" testId={SLIDE01_TEST_IDS.routeScoreA} />
          <ScorePill label="B" score={state.score.routeB} tone="B" testId={SLIDE01_TEST_IDS.routeScoreB} />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article
          data-testid={SLIDE01_TEST_IDS.routeCardA}
          className={`rounded-xl border bg-black/35 p-3 ${routeHighlightClass("A", selected)}`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h4 data-testid={SLIDE01_TEST_IDS.routeTitleA} className="font-display text-lg text-white">
                {state.routes.A.label} - {state.routes.A.name}
              </h4>
              <p data-testid={SLIDE01_TEST_IDS.routeTagA} className="text-xs text-white/70">
                {state.routes.A.summary}
              </p>
            </div>
            <div
              data-testid={SLIDE01_TEST_IDS.routeSelectedA}
              className="font-code text-[10px] uppercase tracking-[0.2em] text-orange-200"
            >
              {selected === "A" ? "selected" : "candidate"}
            </div>
          </div>
          <div className="space-y-2">
            {CRITERION_IDS.map((criterionId) => (
              <RouteCriterionRow
                key={criterionId}
                criterionLabel={`${contribution(criterionId)?.label ?? criterionId} (${signal(
                  criterionId
                ).toFixed(0)}%)`}
                profileValue={state.routes.A.profiles[criterionId]}
                tone="A"
                testId={`slide01-route-criterion-${criterionId}-A`}
              />
            ))}
          </div>
        </article>

        <article
          data-testid={SLIDE01_TEST_IDS.routeCardB}
          className={`rounded-xl border bg-black/35 p-3 ${routeHighlightClass("B", selected)}`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h4 data-testid={SLIDE01_TEST_IDS.routeTitleB} className="font-display text-lg text-white">
                {state.routes.B.label} - {state.routes.B.name}
              </h4>
              <p data-testid={SLIDE01_TEST_IDS.routeTagB} className="text-xs text-white/70">
                {state.routes.B.summary}
              </p>
            </div>
            <div
              data-testid={SLIDE01_TEST_IDS.routeSelectedB}
              className="font-code text-[10px] uppercase tracking-[0.2em] text-cyan-200"
            >
              {selected === "B" ? "selected" : "candidate"}
            </div>
          </div>
          <div className="space-y-2">
            {CRITERION_IDS.map((criterionId) => (
              <RouteCriterionRow
                key={criterionId}
                criterionLabel={`${contribution(criterionId)?.label ?? criterionId} (${signal(
                  criterionId
                ).toFixed(0)}%)`}
                profileValue={state.routes.B.profiles[criterionId]}
                tone="B"
                testId={`slide01-route-criterion-${criterionId}-B`}
              />
            ))}
          </div>
        </article>
      </div>
    </PanelFrame>
  );
};
