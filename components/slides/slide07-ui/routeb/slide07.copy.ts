import { Slide07CanonicalProfile, Slide07RitualStage, Slide07StepKey } from "./slide07.types";

export const SLIDE07_COPY = {
  title: "SMARTSERVICE™",
  breadcrumb: "SISTEMA",
  ritualLabel: "Route B · Graph Ritual",
  ritualSubtitle: "Drag to align. Hold to check. Release to seal.",
  railTitle: "Operational Rail",
  railSubtitle: "A deterministic system only moves when the operator moves.",
  graphTitle: "Visible Graph Surface",
  graphSubtitle: "Node links react to direct operator gesture.",
  holdLabel: "Deterministic Check",
  releaseLabel: "Release Channel",
  steps: {
    drag: {
      label: "Drag",
      detail: "Align the graph backbone until the primary link engages.",
    },
    hold: {
      label: "Hold",
      detail: "Sustain pointer pressure so deterministic checks can complete.",
    },
    release: {
      label: "Release",
      detail: "Release only when CHECK READY is armed to seal the graph.",
    },
  } as Record<Slide07StepKey, { label: string; detail: string }>,
  seal: {
    title: "RightSeal",
    progressLabel: "Seal Progress",
    stateLabel: "Seal State",
    compactHint: "The panel collapses only after deterministic completion.",
    stateLabels: {
      idle: "Unaligned graph",
      dragging: "Alignment in progress",
      "drag-complete": "Link alignment confirmed",
      holding: "Deterministic check running",
      "hold-complete": "Release channel armed",
      sealed: "Graph sealed",
    } as Record<Slide07RitualStage, string>,
  },
  canonical: {
    opening: "Sistema operable. Respuesta determinista.",
    legacy: "Hoy, mañana y cuando tú ya no estés aquí operándolo.",
    speed: "Para quien se mueve más rápido que los demás.",
  },
  releasePrompts: {
    idle: "Release channel standby.",
    armed: "Release now to seal the graph.",
    sealed: "Seal emitted. Graph frozen.",
  },
};

export function getSlide07CanonicalLine(profile: Slide07CanonicalProfile): string {
  if (profile === "speed") {
    return SLIDE07_COPY.canonical.speed;
  }
  return SLIDE07_COPY.canonical.legacy;
}

export function getSlide07SealStateLabel(stage: Slide07RitualStage): string {
  return SLIDE07_COPY.seal.stateLabels[stage];
}

export function getSlide07ReleasePrompt(stage: Slide07RitualStage): string {
  if (stage === "sealed") {
    return SLIDE07_COPY.releasePrompts.sealed;
  }
  if (stage === "hold-complete") {
    return SLIDE07_COPY.releasePrompts.armed;
  }
  return SLIDE07_COPY.releasePrompts.idle;
}
