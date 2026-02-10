
import React from "react";
import { SLIDE07_COPY } from "./slide07.copy";
import { formatPercent } from "./slide07.helpers";
import { Slide07Snapshot } from "./slide07.types";
import { GlassSurface } from "./glass/GlassSurface";

export function SystemRail(props: { snapshot: Slide07Snapshot }) {
  return (
    <GlassSurface data-testid="slide07-rail" style={{ display: "grid", gap: 10, padding: 12 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(181, 225, 242, 0.9)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {SLIDE07_COPY.railTitle}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(191, 217, 231, 0.8)" }}>{SLIDE07_COPY.railSubtitle}</p>
      </header>

      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {props.snapshot.steps.map((step) => (
          <li
            key={step.key}
            data-testid={`slide07-rail-step-${step.key}`}
            style={{
              display: "grid",
              gap: 5,
              borderRadius: 10,
              border:
                step.status === "complete"
                  ? "1px solid rgba(113, 248, 196, 0.48)"
                  : step.status === "active"
                    ? "1px solid rgba(137, 214, 240, 0.46)"
                    : "1px solid rgba(117, 176, 198, 0.24)",
              background: step.status === "complete" ? "rgba(4, 40, 32, 0.54)" : "rgba(5, 16, 24, 0.72)",
              padding: "8px 10px",
              opacity: step.status === "locked" ? 0.72 : 1,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(227, 242, 250, 0.92)",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {SLIDE07_COPY.steps[step.key].label}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(184, 213, 227, 0.82)" }}>{SLIDE07_COPY.steps[step.key].detail}</p>
            <div
              aria-hidden="true"
              style={{
                height: 4,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(96, 137, 156, 0.26)",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  transformOrigin: "left center",
                  transform: `scaleX(${step.progress.toFixed(4)})`,
                  background: "linear-gradient(90deg, rgba(82, 227, 255, 0.72), rgba(110, 248, 199, 0.9))",
                }}
              />
            </div>
          </li>
        ))}
      </ol>

      <div
        style={{
          display: "grid",
          gap: 6,
          borderRadius: 10,
          border: "1px solid rgba(126, 198, 224, 0.28)",
          background: "rgba(4, 14, 21, 0.72)",
          padding: "8px 10px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(190, 226, 242, 0.82)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          Event Feed
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(228, 243, 252, 0.92)" }}>
          Total progress {formatPercent(props.snapshot.totalProgress)}
        </p>
        <ol style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 2 }}>
          {props.snapshot.recentDomainEvents.slice(-6).map((eventName, index) => (
            <li
              key={`${eventName}-${String(index)}`}
              style={{
                fontSize: 10,
                color: "rgba(170, 210, 227, 0.78)",
                letterSpacing: "0.04em",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {eventName}
            </li>
          ))}
        </ol>
      </div>
    </GlassSurface>
  );
}

