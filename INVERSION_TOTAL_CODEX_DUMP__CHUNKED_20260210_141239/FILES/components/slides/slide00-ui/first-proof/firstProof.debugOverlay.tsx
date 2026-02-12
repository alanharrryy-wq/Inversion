
import React from "react";
import { summarizeFirstProofState } from "./firstProof.helpers";
import { FirstProofSnapshot, FirstProofState, FirstProofThresholds } from "./firstProof.types";

const DEBUG_FLAG_KEY = "slide00:firstproof:debug";

function shouldRenderDebugOverlay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const queryFlag = new URLSearchParams(window.location.search).get("slide00_debug_firstproof");
  if (queryFlag === "1" || queryFlag === "true") {
    return true;
  }

  return window.localStorage.getItem(DEBUG_FLAG_KEY) === "1";
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function FirstProofDebugOverlay(props: {
  state: FirstProofState;
  snapshot: FirstProofSnapshot;
  thresholds: FirstProofThresholds;
}) {
  const visible = shouldRenderDebugOverlay() && import.meta.env.DEV;

  if (!visible) {
    return null;
  }

  return (
    <aside className="slide00-firstproof-debug-overlay" data-testid="slide00-firstproof-debug-overlay">
      <header className="slide00-firstproof-debug-head">
        <strong>First Proof Debug</strong>
        <span>DEV ONLY</span>
      </header>

      <section className="slide00-firstproof-debug-section">
        <p className="slide00-firstproof-debug-row">
          <span>State</span>
          <code>{props.state.stage}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>Summary</span>
          <code>{summarizeFirstProofState(props.state)}</code>
        </p>
      </section>

      <section className="slide00-firstproof-debug-section">
        <p className="slide00-firstproof-debug-title">Thresholds</p>
        <p className="slide00-firstproof-debug-row">
          <span>dragThresholdPx</span>
          <code>{props.thresholds.dragThresholdPx}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>dragDirectionRatio</span>
          <code>{props.thresholds.dragDirectionRatio.toFixed(2)}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>holdDurationMs</span>
          <code>{props.thresholds.holdDurationMs}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>holdTickClampMs</span>
          <code>{props.thresholds.holdTickClampMs}</code>
        </p>
      </section>

      <section className="slide00-firstproof-debug-section">
        <p className="slide00-firstproof-debug-title">Snapshot</p>
        <p className="slide00-firstproof-debug-row">
          <span>dragProgress</span>
          <code>{formatPercent(props.snapshot.dragProgress)}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>holdProgress</span>
          <code>{formatPercent(props.snapshot.holdProgress)}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>releaseProgress</span>
          <code>{formatPercent(props.snapshot.releaseProgress)}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>totalProgress</span>
          <code>{formatPercent(props.snapshot.totalProgress)}</code>
        </p>
        <p className="slide00-firstproof-debug-row">
          <span>sealStatus</span>
          <code>{props.snapshot.sealStatus}</code>
        </p>
      </section>
    </aside>
  );
}

