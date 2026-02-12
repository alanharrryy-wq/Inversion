import React from "react";
import { ConstraintNarrative, ConstraintValues, RouteOption, Slide02RouteId } from "../core/types";
import { controlTone } from "../core/selectors";

type SliderControlProps = {
  id: string;
  testId: string;
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  valueTestId: string;
  helper: string;
  tone: "good" | "watch" | "risk";
};

const SliderControl: React.FC<SliderControlProps> = ({
  id,
  testId,
  label,
  value,
  onChange,
  valueTestId,
  helper,
  tone,
}) => {
  return (
    <div className="slide02-control-row">
      <div className="slide02-control-row__head">
        <label className="slide02-control-label" htmlFor={id}>
          {label}
        </label>
        <span
          data-testid={valueTestId}
          className={`slide02-control-value slide02-tone-${tone}`}
        >
          {value}
        </span>
      </div>

      <input
        id={id}
        data-testid={testId}
        className="slide02-range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />

      <p className="slide02-control-helper">{helper}</p>
    </div>
  );
};

type ControlsPanelProps = {
  route: Slide02RouteId;
  routeOptions: RouteOption[];
  constraints: ConstraintValues;
  narrative: ConstraintNarrative;
  onRouteChange: (route: string) => void;
  onStrictnessChange: (value: number) => void;
  onBudgetChange: (value: number) => void;
  onLatencyChange: (value: number) => void;
  onReset: () => void;
};

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  route,
  routeOptions,
  constraints,
  narrative,
  onRouteChange,
  onStrictnessChange,
  onBudgetChange,
  onLatencyChange,
  onReset,
}) => {
  const strictnessTone = controlTone(constraints.strictness, "strictness");
  const budgetTone = controlTone(constraints.budgetGuard, "budget");
  const latencyTone = controlTone(constraints.latencyGuard, "latency");

  return (
    <section data-testid="slide02-controls-panel" className="slide02-panel slide02-panel--controls">
      <div className="slide02-panel__header">
        <h3 className="slide02-panel__title">Constraint Tightening</h3>
        <button
          type="button"
          className="slide02-btn slide02-btn--subtle"
          data-testid="slide02-reset-constraints"
          onClick={onReset}
        >
          Reset Defaults
        </button>
      </div>

      <div className="slide02-control-row">
        <div className="slide02-control-row__head">
          <label htmlFor="slide02-route-select" className="slide02-control-label">
            Route Focus
          </label>
        </div>

        <select
          id="slide02-route-select"
          data-testid="slide02-route-select"
          className="slide02-select"
          value={route}
          onChange={(event) => onRouteChange(event.currentTarget.value)}
        >
          {routeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <p className="slide02-control-helper">
          Route selection anchors continuity for the next slides.
        </p>
      </div>

      <SliderControl
        id="slide02-strictness"
        testId="slide02-strictness-slider"
        label="Strictness"
        value={constraints.strictness}
        onChange={onStrictnessChange}
        valueTestId="slide02-strictness-value"
        helper="Governance depth and enforcement rigor across the route."
        tone={strictnessTone}
      />

      <SliderControl
        id="slide02-budget"
        testId="slide02-budget-slider"
        label="Budget Guard"
        value={constraints.budgetGuard}
        onChange={onBudgetChange}
        valueTestId="slide02-budget-value"
        helper="Execution headroom available for route delivery capacity."
        tone={budgetTone}
      />

      <SliderControl
        id="slide02-latency"
        testId="slide02-latency-slider"
        label="Latency Guard"
        value={constraints.latencyGuard}
        onChange={onLatencyChange}
        valueTestId="slide02-latency-value"
        helper="Tolerance for delayed response across handoffs and control loops."
        tone={latencyTone}
      />

      <div className="slide02-inline-summary">
        <span className="slide02-inline-summary__chip" data-testid="slide02-tightness-label">
          {narrative.tightnessLabel}
        </span>
        <span className="slide02-inline-summary__chip">{narrative.budgetPosture}</span>
        <span className="slide02-inline-summary__chip">{narrative.latencyPosture}</span>
      </div>
    </section>
  );
};
