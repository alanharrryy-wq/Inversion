import type { ExperienceSpec, OperationalSignal } from "./types";

export const EXPERIENCE_SPECS: ExperienceSpec[] = [
  {
    id: "exp-iso",
    title: "ISO STANDARD",
    subtitle: "COMPLIANCE",
    description: "Procedimientos auditables y trazabilidad sin fricción de handoff.",
  },
  {
    id: "exp-loto",
    title: "LOTO READY",
    subtitle: "SAFETY",
    description: "Disciplina de bloqueo, etiquetado y cierre con evidencia operativa.",
  },
  {
    id: "exp-evidence",
    title: "EVIDENCIA 360",
    subtitle: "TRACEABILITY",
    description: "Bitácora documental consistente para operación, auditoría y defensa.",
  },
  {
    id: "exp-oem",
    title: "OEM QUALITY",
    subtitle: "STANDARDS",
    description: "Nivel de ejecución industrial con criterios de ingeniería repetibles.",
  },
];

export const OPERATIONAL_SIGNALS: OperationalSignal[] = [
  {
    id: "sig-input",
    label: "INPUT CONTROL",
    detail: "Sensores + captura estructurada de condición",
    score: 91,
  },
  {
    id: "sig-logic",
    label: "DECISION CORE",
    detail: "Probabilidad x impacto con reglas de escalamiento",
    score: 87,
  },
  {
    id: "sig-output",
    label: "ACTION PROOF",
    detail: "SOP + checklist + evidencia de cierre",
    score: 95,
  },
];
