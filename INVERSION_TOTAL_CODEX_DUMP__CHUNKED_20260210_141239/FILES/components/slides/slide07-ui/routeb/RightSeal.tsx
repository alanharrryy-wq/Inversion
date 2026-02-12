
import React from "react";
import { getSlide07CanonicalLine, SLIDE07_COPY } from "./slide07.copy";
import { formatPercent } from "./slide07.helpers";
import { Slide07CanonicalProfile, Slide07Snapshot } from "./slide07.types";
import { GlassSurface } from "./glass/GlassSurface";

export function RightSeal(props: {
  snapshot: Slide07Snapshot;
  profile?: Slide07CanonicalProfile;
}) {
  const profile = props.profile ?? "legacy";
  const canonical = getSlide07CanonicalLine(profile);

  return (
    <GlassSurface
      data-testid="slide07-seal"
      style={{
        display: "grid",
        gap: 8,
        padding: props.snapshot.rightSealCollapsed ? "10px" : "12px",
        borderRadius: props.snapshot.rightSealCollapsed ? 12 : 18,
        background: props.snapshot.rightSealCollapsed
          ? "linear-gradient(180deg, rgba(6,41,32,0.9), rgba(3,24,18,0.94))"
          : "linear-gradient(180deg, rgba(9,30,44,0.88), rgba(5,17,27,0.92))",
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(229, 244, 252, 0.92)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {SLIDE07_COPY.seal.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(183, 214, 229, 0.84)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {SLIDE07_COPY.seal.progressLabel} {formatPercent(props.snapshot.totalProgress)}
        </p>
      </header>

      <p
        style={{
          margin: 0,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(182, 214, 229, 0.76)",
          fontFamily: 'Consolas, "Courier New", monospace',
        }}
      >
        {SLIDE07_COPY.seal.stateLabel}
      </p>
      <p
        data-testid="slide07-seal-state"
        style={{
          margin: 0,
          fontSize: props.snapshot.rightSealCollapsed ? 17 : 21,
          lineHeight: 1.14,
          color: "rgba(236, 248, 255, 0.96)",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {props.snapshot.sealStateLabel}
      </p>

      <div
        style={{
          height: 6,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(113, 162, 184, 0.24)",
        }}
        aria-hidden="true"
      >
        <span
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            transformOrigin: "left center",
            transform: `scaleX(${props.snapshot.totalProgress.toFixed(4)})`,
            background: "linear-gradient(90deg, rgba(82, 227, 255, 0.72), rgba(110, 248, 199, 0.9))",
          }}
        />
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "rgba(184, 213, 227, 0.84)" }}>{SLIDE07_COPY.seal.compactHint}</p>

      {props.snapshot.primaryEvidenceSatisfied ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "rgba(203, 255, 230, 0.94)",
            lineHeight: 1.38,
          }}
        >
          {canonical}
        </p>
      ) : null}
    </GlassSurface>
  );
}

