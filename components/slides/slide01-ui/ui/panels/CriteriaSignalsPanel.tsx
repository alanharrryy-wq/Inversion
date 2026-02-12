import React from "react";
import { CriterionId, Slide01State, SLIDE01_OPTIONAL_CRITERION_SIGNAL_TEST_IDS } from "../../core/fsm";
import { MetricBar } from "../atoms/MetricBar";
import { PanelFrame } from "../atoms/PanelFrame";

const ORDER: CriterionId[] = [
  "deliverySpeed",
  "operationalRisk",
  "scalability",
  "budgetPredictability",
  "knowledgeRetention",
];

const LABELS: Record<CriterionId, string> = {
  deliverySpeed: "Delivery Speed Emphasis",
  operationalRisk: "Operational Risk Emphasis",
  scalability: "Scalability Emphasis",
  budgetPredictability: "Budget Predictability Emphasis",
  knowledgeRetention: "Knowledge Retention Emphasis",
};

export const CriteriaSignalsPanel: React.FC<{ state: Slide01State }> = ({ state }) => {
  const valueById = (criterionId: CriterionId): number => {
    const signal = state.score.signals.find((entry) => entry.criterionId === criterionId);
    return (signal?.emphasis ?? 0.5) * 100;
  };

  return (
    <PanelFrame
      testId="slide01-criteria-signals-panel"
      title="Criterion Signals"
      subtitle="Live deterministic signal intensities derived from gesture metrics."
      className="h-full"
    >
      <div className="space-y-3">
        {ORDER.map((criterionId, index) => (
          <MetricBar
            key={criterionId}
            testId={SLIDE01_OPTIONAL_CRITERION_SIGNAL_TEST_IDS[criterionId]}
            label={LABELS[criterionId]}
            value={valueById(criterionId)}
            accent={index % 2 === 0 ? "cyan" : "blue"}
          />
        ))}
      </div>
    </PanelFrame>
  );
};
