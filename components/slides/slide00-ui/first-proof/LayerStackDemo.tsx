import React from "react";
import { FIRST_PROOF_COPY } from "./firstProof.copy";
import { FirstProofSnapshot } from "./firstProof.types";
import { GlassSurface } from "./glass/GlassSurface";

type GestureHandlers = {
  onPointerDown: React.PointerEventHandler<HTMLDivElement>;
  onPointerMove: React.PointerEventHandler<HTMLDivElement>;
  onPointerUp: React.PointerEventHandler<HTMLDivElement>;
  onPointerCancel: React.PointerEventHandler<HTMLDivElement>;
};

function formatPressureLabel(snapshot: FirstProofSnapshot): string {
  if (snapshot.completed) {
    return "PRESIÓN VALIDADA";
  }

  if (snapshot.holdProgress <= 0) {
    return "SIN PRESIÓN";
  }

  if (snapshot.holdProgress < 0.5) {
    return "PRESIÓN EN ASCENSO";
  }

  if (snapshot.holdProgress < 1) {
    return "PRESIÓN CASI LISTA";
  }

  return "PRESIÓN ARMADA";
}

function formatReleaseLabel(snapshot: FirstProofSnapshot): string {
  if (snapshot.completed) {
    return "SEAL: CERRADO";
  }

  if (!snapshot.releaseReady) {
    return "RELEASE BLOQUEADO";
  }

  return "SUELTA PARA SELLAR";
}

export function LayerStackDemo(props: {
  snapshot: FirstProofSnapshot;
  gestureHandlers: GestureHandlers;
}) {
  const alignmentTightness = props.snapshot.holdProgress;
  const baseOffset = props.snapshot.layerOffsetPx;

  const rearOffset = baseOffset * (0.34 - alignmentTightness * 0.16);
  const midOffset = baseOffset * (0.58 - alignmentTightness * 0.24);
  const frontOffset = baseOffset;

  const rearScale = 0.94 + alignmentTightness * 0.04;
  const midScale = 0.97 + alignmentTightness * 0.03;
  const frontScale = 1 - props.snapshot.compression * 0.04;

  const revealOpacity = Math.min(1, props.snapshot.layerReveal * 1.04);

  return (
    <section className="slide00-firstproof-stage" data-completed={props.snapshot.completed}>
      <header className="slide00-firstproof-stage-head">
        <p className="slide00-firstproof-kicker">{FIRST_PROOF_COPY.ritualLabel}</p>
        <p className="slide00-firstproof-stage-subtitle">{FIRST_PROOF_COPY.ritualSubtitle}</p>
      </header>

      <div
        className="slide00-firstproof-gesture-zone"
        role="group"
        tabIndex={0}
        data-pointer-active={props.snapshot.pointerActive}
        data-sealed={props.snapshot.completed}
        data-testid="slide00-firstproof-gesture-drag"
        aria-label={FIRST_PROOF_COPY.gestureHint}
        onPointerDown={props.gestureHandlers.onPointerDown}
        onPointerMove={props.gestureHandlers.onPointerMove}
        onPointerUp={props.gestureHandlers.onPointerUp}
        onPointerCancel={props.gestureHandlers.onPointerCancel}
      >
        <div className="slide00-firstproof-layer-stack">
          <GlassSurface
            tone={props.snapshot.completed ? "seal" : "rear"}
            offsetPx={rearOffset}
            scale={rearScale}
            glowIntensity={Math.max(0.24, props.snapshot.glowIntensity * 0.7)}
            compression={props.snapshot.compression}
            pointerActive={props.snapshot.pointerActive}
            sealed={props.snapshot.completed}
            zIndex={1}
            className="slide00-firstproof-layer slide00-firstproof-layer--rear"
          />

          <GlassSurface
            tone={props.snapshot.completed ? "seal" : "mid"}
            offsetPx={midOffset}
            scale={midScale}
            glowIntensity={Math.max(0.28, props.snapshot.glowIntensity * 0.84)}
            compression={props.snapshot.compression}
            pointerActive={props.snapshot.pointerActive}
            sealed={props.snapshot.completed}
            zIndex={2}
            className="slide00-firstproof-layer slide00-firstproof-layer--mid"
          />

          <GlassSurface
            tone={props.snapshot.completed ? "seal" : "front"}
            offsetPx={frontOffset}
            scale={frontScale}
            glowIntensity={props.snapshot.glowIntensity}
            compression={props.snapshot.compression}
            pointerActive={props.snapshot.pointerActive}
            sealed={props.snapshot.completed}
            zIndex={3}
            className="slide00-firstproof-layer slide00-firstproof-layer--front"
          >
            <div className="slide00-firstproof-front-copy">
              <span className="slide00-firstproof-layer-caption">OPERATOR INPUT</span>
              <span className="slide00-firstproof-front-metric">
                DRAG {Math.round(props.snapshot.dragDistancePx)}px
              </span>
            </div>
          </GlassSurface>

          <div
            className="slide00-firstproof-underlayer-reveal"
            style={{ opacity: revealOpacity }}
          >
            <span>
              UNDER LAYER · REVEAL {Math.round(props.snapshot.layerReveal * 100)}%
            </span>
          </div>
        </div>

        <div
          className="slide00-firstproof-pressure-lens"
          data-testid="slide00-firstproof-gesture-hold"
        >
          <span>{formatPressureLabel(props.snapshot)}</span>
          <span className="slide00-firstproof-lens-value">
            {Math.round(props.snapshot.holdProgress * 100)}%
          </span>
        </div>

        <div
          className="slide00-firstproof-release-lens"
          data-ready={props.snapshot.releaseReady}
          data-testid="slide00-firstproof-gesture-release"
        >
          <span>{formatReleaseLabel(props.snapshot)}</span>
          <span className="slide00-firstproof-lens-value">
            {Math.round(props.snapshot.releaseProgress * 100)}%
          </span>
        </div>
      </div>
    </section>
  );
}
