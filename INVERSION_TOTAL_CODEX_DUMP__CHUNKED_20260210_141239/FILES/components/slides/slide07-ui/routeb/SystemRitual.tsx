
import React from "react";
import { SLIDE07_COPY } from "./slide07.copy";
import {
  Slide07CanonicalProfile,
  Slide07DomainEvent,
  Slide07Snapshot,
  Slide07Thresholds,
} from "./slide07.types";
import { useSystemRitual } from "./useSystemRitual";
import { GraphSurface } from "./GraphSurface";
import { SystemRail } from "./SystemRail";
import { RightSeal } from "./RightSeal";
import { Slide07DebugOverlay } from "./slide07.debugOverlay";

export function SystemRitual(props: {
  profile?: Slide07CanonicalProfile;
  thresholds?: Partial<Slide07Thresholds>;
  onDomainEvent?: (domainEvent: Slide07DomainEvent) => void;
  onSnapshotChange?: (snapshot: Slide07Snapshot) => void;
  debug?: boolean;
}) {
  const ritual = useSystemRitual({
    thresholds: props.thresholds,
    onDomainEvent: props.onDomainEvent,
    onSnapshotChange: props.onSnapshotChange,
  });

  return (
    <section
      data-testid="slide07-root"
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <header style={{ display: "grid", gap: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(184, 225, 241, 0.9)",
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {SLIDE07_COPY.ritualLabel}
        </p>
        <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, color: "rgba(238, 248, 255, 0.97)" }}>
          {SLIDE07_COPY.title} / {SLIDE07_COPY.breadcrumb}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(193, 221, 234, 0.8)" }}>{SLIDE07_COPY.ritualSubtitle}</p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 344px",
          gap: 12,
          alignItems: "start",
        }}
      >
        <GraphSurface snapshot={ritual.snapshot} gestureHandlers={ritual.gestureHandlers} />

        <aside style={{ display: "grid", gap: 10 }}>
          <SystemRail snapshot={ritual.snapshot} />
          <RightSeal snapshot={ritual.snapshot} profile={props.profile} />
          {props.debug ? (
            <Slide07DebugOverlay
              state={ritual.state}
              snapshot={ritual.snapshot}
              thresholds={ritual.thresholds}
              forceVisible
            />
          ) : null}
        </aside>
      </div>
    </section>
  );
}

