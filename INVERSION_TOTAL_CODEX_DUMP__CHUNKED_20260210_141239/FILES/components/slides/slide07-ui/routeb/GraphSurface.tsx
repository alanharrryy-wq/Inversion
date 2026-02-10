
import React, { useMemo } from "react";
import { getSlide07ReleasePrompt, SLIDE07_COPY } from "./slide07.copy";
import { formatPercent } from "./slide07.helpers";
import { Slide07Snapshot } from "./slide07.types";
import { Slide07GestureHandlers } from "./useSystemRitual";
import { GlassSurface } from "./glass/GlassSurface";
import { GlowEdge } from "./glass/GlowEdge";
import { NoiseOverlay } from "./glass/NoiseOverlay";
import { SpecularSheen } from "./glass/SpecularSheen";

function nodeRoleColor(role: Slide07Snapshot["nodes"][number]["role"]): string {
  if (role === "input") return "rgba(123, 240, 255, 0.88)";
  if (role === "logic") return "rgba(235, 246, 255, 0.9)";
  if (role === "output") return "rgba(255, 225, 152, 0.9)";
  return "rgba(157, 255, 212, 0.9)";
}

export function GraphSurface(props: {
  snapshot: Slide07Snapshot;
  gestureHandlers: Slide07GestureHandlers;
}) {
  const nodesById = useMemo(() => {
    const record: Record<string, Slide07Snapshot["nodes"][number]> = {};
    for (const node of props.snapshot.nodes) {
      record[node.id] = node;
    }
    return record;
  }, [props.snapshot.nodes]);

  return (
    <section style={{ display: "grid", gap: 10 }}>
      <header style={{ display: "grid", gap: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(180, 229, 247, 0.88)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {SLIDE07_COPY.graphTitle}
        </p>
        <p
          style={{
            margin: 0,
            color: "rgba(191, 218, 231, 0.78)",
            fontSize: 12,
          }}
        >
          {SLIDE07_COPY.graphSubtitle}
        </p>
      </header>

      <GlassSurface style={{ position: "relative", minHeight: 440, overflow: "hidden", padding: 12 }}>
        <div
          data-testid="slide07-gesture-drag"
          role="group"
          tabIndex={0}
          aria-label={SLIDE07_COPY.ritualSubtitle}
          onPointerDown={props.gestureHandlers.onPointerDown}
          onPointerMove={props.gestureHandlers.onPointerMove}
          onPointerUp={props.gestureHandlers.onPointerUp}
          onPointerCancel={props.gestureHandlers.onPointerCancel}
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            height: 360,
            borderRadius: 14,
            border: "1px solid rgba(137, 212, 239, 0.28)",
            background:
              "radial-gradient(600px 240px at 14% -12%, rgba(84, 217, 255, 0.24), rgba(0,0,0,0) 65%), linear-gradient(160deg, rgba(7,22,34,0.92), rgba(3,11,18,0.94))",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            aria-hidden="true"
          >
            {props.snapshot.links.map((link) => {
              const from = nodesById[link.from];
              const to = nodesById[link.to];
              if (!from || !to || !link.visible) {
                return null;
              }

              const opacity = 0.12 + link.strength * 0.78;
              const strokeWidth = 0.4 + link.strength * 1.2;

              return (
                <line
                  key={link.id}
                  x1={from.x * 100}
                  y1={from.y * 100}
                  x2={to.x * 100}
                  y2={to.y * 100}
                  stroke={link.locked ? "rgba(146, 255, 211, 0.95)" : "rgba(101, 224, 255, 0.92)"}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                />
              );
            })}
          </svg>

          {props.snapshot.nodes.map((node) => {
            const roleColor = nodeRoleColor(node.role);
            return (
              <article
                key={node.id}
                style={{
                  position: "absolute",
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  minWidth: 124,
                  borderRadius: 10,
                  border: "1px solid rgba(147, 216, 240, 0.34)",
                  background: node.sealed
                    ? "linear-gradient(160deg, rgba(11,57,46,0.82), rgba(6,30,24,0.9))"
                    : "linear-gradient(160deg, rgba(8,24,36,0.88), rgba(4,13,22,0.9))",
                  padding: "8px 9px",
                  boxShadow:
                    "0 8px 22px rgba(2, 10, 16, 0.46), inset 0 0 0 1px rgba(255,255,255,0.04)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontFamily: 'Consolas, "Courier New", monospace',
                    color: roleColor,
                  }}
                >
                  {node.role}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(231,245,252,0.93)" }}>
                  {node.label}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 10,
                    color: node.linked ? "rgba(146, 255, 211, 0.86)" : "rgba(169, 203, 220, 0.72)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: 'Consolas, "Courier New", monospace',
                  }}
                >
                  {node.linked ? "linked" : "standby"}
                </p>
              </article>
            );
          })}

          <div
            data-testid="slide07-gesture-hold"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 46,
              minHeight: 34,
              borderRadius: 9,
              border: "1px solid rgba(126, 205, 233, 0.3)",
              background: "rgba(4, 17, 27, 0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(199, 232, 245, 0.86)",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {SLIDE07_COPY.holdLabel}
            </span>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(238, 247, 255, 0.94)",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {formatPercent(props.snapshot.holdProgress)}
            </span>
          </div>

          <div
            data-testid="slide07-gesture-release"
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 8,
              minHeight: 30,
              borderRadius: 9,
              border:
                props.snapshot.stage === "sealed"
                  ? "1px solid rgba(129, 255, 203, 0.52)"
                  : "1px solid rgba(138, 206, 232, 0.36)",
              background: props.snapshot.stage === "sealed" ? "rgba(5, 42, 32, 0.74)" : "rgba(4, 16, 25, 0.76)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(196, 228, 241, 0.84)",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {SLIDE07_COPY.releaseLabel}
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color:
                  props.snapshot.stage === "hold-complete" || props.snapshot.stage === "sealed"
                    ? "rgba(167, 255, 215, 0.92)"
                    : "rgba(214, 233, 244, 0.86)",
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              {getSlide07ReleasePrompt(props.snapshot.stage)}
            </span>
          </div>

          <GlowEdge intensity={props.snapshot.totalProgress} />
          <NoiseOverlay opacity={0.07 + props.snapshot.dragProgress * 0.04} />
          <SpecularSheen strength={0.24 + props.snapshot.totalProgress * 0.64} />
        </div>
      </GlassSurface>
    </section>
  );
}

