
import React from "react";
import { Slide07Snapshot, Slide07State, Slide07Thresholds } from "./slide07.types";

const DEV_ENABLED = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

export function Slide07DebugOverlay(props: {
  state: Slide07State;
  snapshot: Slide07Snapshot;
  thresholds: Slide07Thresholds;
  forceVisible?: boolean;
}) {
  if (!DEV_ENABLED && !props.forceVisible) {
    return null;
  }

  return (
    <aside
      style={{
        borderRadius: 10,
        border: "1px solid rgba(125, 190, 214, 0.34)",
        background: "rgba(4, 13, 20, 0.82)",
        padding: "8px 10px",
        display: "grid",
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(188, 225, 241, 0.86)",
          fontFamily: 'Consolas, "Courier New", monospace',
        }}
      >
        Slide07 Debug Overlay
      </p>

      <pre
        style={{
          margin: 0,
          fontSize: 10,
          lineHeight: 1.4,
          color: "rgba(208, 232, 244, 0.88)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: 'Consolas, "Courier New", monospace',
        }}
      >
        {JSON.stringify(
          {
            stage: props.snapshot.stage,
            drag: Number(props.snapshot.dragProgress.toFixed(4)),
            hold: Number(props.snapshot.holdProgress.toFixed(4)),
            total: Number(props.snapshot.totalProgress.toFixed(4)),
            events: props.snapshot.recentDomainEvents,
            thresholds: props.thresholds,
            pointerActive: props.state.pointerActive,
          },
          null,
          2
        )}
      </pre>
    </aside>
  );
}

