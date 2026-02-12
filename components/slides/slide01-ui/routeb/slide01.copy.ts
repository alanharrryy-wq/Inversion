import {
  Slide01SealStatus,
  Slide01StepKey,
  Slide01OperationalEventName,
} from "./slide01.types";

export const SLIDE01_TEST_IDS = {
  root: "slide01-root",
  rail: "slide01-rail",
  railStepPrefix: "slide01-rail-step-",
  gestureDrag: "slide01-gesture-drag",
  gestureHold: "slide01-gesture-hold",
  gestureRelease: "slide01-gesture-release",
  seal: "slide01-seal",
  sealState: "slide01-seal-state",
} as const;

export const SLIDE01_EVENT_NAMES = {
  entered: "slide:01:entered",
  gestureDragCompleted: "gesture:slide01-drag:completed",
  gestureHoldCompleted: "gesture:slide01-hold:completed",
  gestureReleaseCompleted: "gesture:slide01-release:completed",
  stateSealedSet: "state:slide01-sealed:set",
  evidencePrimarySatisfied: "evidence:slide01-primary:satisfied",
} as const;

export const SLIDE01_COPY = {
  title: "DIAGNOSTICO OPERABLE",
  subtitle: "No hay discurso: el Runtime exige gesto del Operator.",
  railTitle: "Rail de evidencia",
  railSubtitle: "Arrastra scanner, sostiene responsabilidad, suelta para sellar.",
  scannerTitle: "Scanner de fallas",
  scannerHint: "Sin autoplay. Solo respuesta directa a tu gesto.",
  sealTitle: "RIGHT SEAL",
  sealBadgeState: "Juicio",
  sealBadgeProgress: "Progreso",
  sealHint: "El sistema no interpreta intenciones: registra evidencia.",
  diagnosticsTitle: "EL PROBLEMA / DIAGNOSTICO",
  diagnosticsSubtitle: "KPI, Runtime y Operator expuestos en tiempo real.",
  steps: {
    drag: {
      label: "Arrastra scanner",
      detail: "Cruza cada fault card para exponer el problema completo.",
    },
    hold: {
      label: "Sostener responsabilidad",
      detail: "Mantener presion confirma que el Operator asume el riesgo.",
    },
    release: {
      label: "Liberar y sellar",
      detail: "Soltar en estado valido fija evidencia y cierra el ritual.",
    },
  } satisfies Record<
    Slide01StepKey,
    {
      label: string;
      detail: string;
    }
  >,
  status: {
    incomplete: "Ejecución incompleta",
    "intent-registered": "Intención registrada",
    "responsibility-pending": "Responsabilidad pendiente",
    "evidence-accepted": "Evidencia aceptada",
    sealed: "Sistema sellado",
  } satisfies Record<Slide01SealStatus, string>,
  statusDetail: {
    incomplete: "Sin gesto verificable no existe diagnostico.",
    "intent-registered": "El sistema detecto direccion de ejecucion.",
    "responsibility-pending": "El problema fue recorrido; falta sostener la carga.",
    "evidence-accepted": "Responsabilidad confirmada. Solo falta liberar el sello.",
    sealed: "Sello emitido. Evidencia primaria satisfecha.",
  } satisfies Record<Slide01SealStatus, string>,
  canonical: {
    continuity: "Hoy, mañana y cuando tú ya no estés aquí operándolo.",
    speed: "Para quien se mueve más rápido que los demás.",
  },
};

export const SLIDE01_FAULT_COPY = [
  {
    id: "fault-01",
    label: "PARO SIN RASTRO",
    detail: "KPI de disponibilidad cae y nadie puede explicar la causa en Runtime.",
    severity: "critical",
  },
  {
    id: "fault-02",
    label: "SOBRECARGA OPERATIVA",
    detail: "Operator reacciona tarde porque todo depende de memoria individual.",
    severity: "high",
  },
  {
    id: "fault-03",
    label: "HISTORICO FRAGMENTADO",
    detail: "Evidencia repartida en chats, hojas y audios no auditables.",
    severity: "critical",
  },
  {
    id: "fault-04",
    label: "RIESGO DE SALIDA",
    detail: "Si un especialista se va, el Runtime pierde continuidad y velocidad.",
    severity: "critical",
  },
] as const;

export function getSlide01StatusLabel(status: Slide01SealStatus): string {
  return SLIDE01_COPY.status[status];
}

export function getSlide01StatusDetail(status: Slide01SealStatus): string {
  return SLIDE01_COPY.statusDetail[status];
}

export function getSlide01RailStepTestId(stepKey: Slide01StepKey): string {
  return SLIDE01_TEST_IDS.railStepPrefix + stepKey;
}

export function buildSlide01FaultAnchorEventName(
  faultId: string
): Slide01OperationalEventName {
  return ("anchor:slide01-" + faultId + ":engaged") as Slide01OperationalEventName;
}
