
import {
  FirstProofCanonicalProfile,
  FirstProofSealStatus,
  FirstProofStepKey,
} from "./firstProof.types";

export const FIRST_PROOF_LOCAL_PROFILE_KEY = "slide00:firstproof:profile";

export const FIRST_PROOF_COPY = {
  ritualLabel: "FIRST PROOF RITUAL",
  ritualSubtitle: "Drag / hold / release. No autoplay.",
  hardLine:
    "Motion is allowed and required — ONLY as a response to explicit operator inputs (gesture-driven), never time-driven.",
  railTitle: "MICRO-RAIL",
  railSubtitle: "ARRASTRA · MANTÉN PRESIONADO · SUELTA PARA SELLAR",
  gestureHint: "Arrastra para abrir capas. Mantén para armar. Suelta para sellar.",
  steps: {
    drag: {
      label: "ARRASTRA",
      detail: "Recorre distancia mínima con dirección coherente.",
    },
    hold: {
      label: "MANTÉN PRESIONADO",
      detail: "Sostén el gesto hasta cumplir el umbral de persistencia.",
    },
    release: {
      label: "SUELTA PARA SELLAR",
      detail: "Suelta solo cuando el sistema esté armado.",
    },
  } satisfies Record<FirstProofStepKey, { label: string; detail: string }>,
  status: {
    incomplete: "Ejecución incompleta",
    "intent-registered": "Intención registrada",
    "responsibility-pending": "Responsabilidad pendiente",
    "system-armed": "Sistema armado",
    sealed: "Sistema sellado",
  } satisfies Record<FirstProofSealStatus, string>,
  statusDetail: {
    incomplete: "No hay prueba sin gesto verificable.",
    "intent-registered": "Dirección válida detectada.",
    "responsibility-pending": "Falta sostener la presión operativa.",
    "system-armed": "Listo para soltar y sellar.",
    sealed: "Sello emitido. Estado congelado.",
  } satisfies Record<FirstProofSealStatus, string>,
  seal: {
    title: "RIGHT SEAL",
    preSealCopy: "El panel juzga ejecución. No explica.",
    progressLabel: "Progreso",
    stateLabel: "Juicio",
    tinyProgressLabel: "Ritual",
  },
  canonical: {
    opening: "Esto no fue diseñado para ser amigable.",
    legacy:
      "Fue diseñado para ser posible… hoy, mañana y cuando tú ya no estés aquí operándolo.",
    speed: "Para quien se mueve más rápido que los demás.",
  },
};

function normalizeProfileValue(raw: string | null | undefined): FirstProofCanonicalProfile | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "legacy") return "legacy";
  if (normalized === "speed") return "speed";
  return null;
}

export function resolveFirstProofProfileSetting(
  preferred?: FirstProofCanonicalProfile
): FirstProofCanonicalProfile {
  if (preferred) {
    return preferred;
  }

  if (typeof window === "undefined") {
    return "legacy";
  }

  const urlProfile = normalizeProfileValue(
    new URLSearchParams(window.location.search).get("slide00_profile")
  );
  if (urlProfile) {
    return urlProfile;
  }

  const storedProfile = normalizeProfileValue(
    window.localStorage.getItem(FIRST_PROOF_LOCAL_PROFILE_KEY)
  );

  return storedProfile ?? "legacy";
}

export function writeFirstProofProfileSetting(profile: FirstProofCanonicalProfile): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FIRST_PROOF_LOCAL_PROFILE_KEY, profile);
}

export function getFirstProofCanonicalLine(profile: FirstProofCanonicalProfile): string {
  if (profile === "speed") {
    return FIRST_PROOF_COPY.canonical.speed;
  }
  return FIRST_PROOF_COPY.canonical.legacy;
}

export function getFirstProofStatusCopy(status: FirstProofSealStatus): string {
  return FIRST_PROOF_COPY.status[status];
}

export function getFirstProofStatusDetailCopy(status: FirstProofSealStatus): string {
  return FIRST_PROOF_COPY.statusDetail[status];
}

