import {
  Slide13CopyPack,
  Slide13SealState,
  Slide13StepKey,
} from "./slide13.types";

export const SLIDE13_COPY: Slide13CopyPack = {
  ritualTitle: "KPI Ritual // Route B",
  ritualSubtitle: "El operador mueve umbral, congela reporte y sella evidencia.",
  railTitle: "Ritual Steps",
  railSubtitle: "Gesto explícito, sistema obediente, evidencia sellada.",
  sealTitle: "RightSeal // Operacional",
  sealOpen: "Reporte abierto. Umbral aún no congelado.",
  sealFrozen: "Reporte congelado. Listo para sellado final.",
  sealSealed: "Reporte sellado con evidencia primaria.",
  sealCollapsed: "RightSeal colapsado. Estado final persistido.",
  frozenBadge: "REPORT FREEZE",
  releasedBadge: "RELEASE TO SEAL",
  thresholdLabel: "KPI Threshold Marker",
  thresholdHint: "Arrastra para cambiar capa de foco KPI.",
  debugTitle: "Debug Overlay // Slide13",
  debugHint: "Visible solo en desarrollo para ver snapshot/eventos.",
  steps: {
    drag: {
      label: "Drag Threshold",
      detail: "Mueve el marcador hasta superar el umbral determinístico.",
    },
    hold: {
      label: "Hold Freeze",
      detail: "Acumula movimiento sostenido para congelar reporte.",
    },
    release: {
      label: "Release Seal",
      detail: "Suelta al completar hold para sellar y colapsar RightSeal.",
    },
  },
};

const SEAL_COPY_BY_STATE: Record<Slide13SealState, string> = {
  open: SLIDE13_COPY.sealOpen,
  freezing: SLIDE13_COPY.sealFrozen,
  sealed: SLIDE13_COPY.sealSealed,
  collapsed: SLIDE13_COPY.sealCollapsed,
};

export function getSlide13SealLine(sealState: Slide13SealState): string {
  return SEAL_COPY_BY_STATE[sealState] ?? SLIDE13_COPY.sealOpen;
}

const STEP_SIGNAL: Record<Slide13StepKey, string> = {
  drag: "threshold",
  hold: "freeze",
  release: "seal",
};

export function getSlide13StepSignal(step: Slide13StepKey): string {
  return STEP_SIGNAL[step];
}

export function getSlide13ProgressNarrative(progress: number): string {
  if (progress >= 1) {
    return "Ritual cerrado. Evidencia completa.";
  }
  if (progress >= 0.75) {
    return "Cierre inminente. Preparando sellado.";
  }
  if (progress >= 0.5) {
    return "Congelamiento en curso. KPI bajo control.";
  }
  if (progress >= 0.25) {
    return "Umbral en ajuste. Falta presión sostenida.";
  }
  return "Esperando gesto inicial del operador.";
}
