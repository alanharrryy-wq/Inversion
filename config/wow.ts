export function envFlag(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;

export const WOW_DEMO = envFlag(env?.VITE_WOW_DEMO);
export const WOW_OVERLAY = envFlag(env?.VITE_WOW_OVERLAY);
export const WOW_REVEAL = envFlag(env?.VITE_WOW_REVEAL);
export const WOW_MIRROR = envFlag(env?.VITE_WOW_MIRROR);
export const WOW_XRAY = envFlag(env?.VITE_WOW_XRAY);
export const WOW_OPENING_IMPACT = envFlag(env?.VITE_WOW_OPENING_IMPACT);
export const WOW_EVIDENCE_IMPACT = envFlag(env?.VITE_WOW_EVIDENCE_IMPACT);
export const WOW_MODEL_IMPACT = envFlag(env?.VITE_WOW_MODEL_IMPACT);
export const WOW_OPENING_CINEMA = envFlag(env?.VITE_WOW_OPENING_CINEMA);
export const WOW_PROOF_LOCK = envFlag(env?.VITE_WOW_PROOF_LOCK);
export const WOW_CORE_MODULES = envFlag(env?.VITE_WOW_CORE_MODULES);
export const WOW_AI_MOMENT = envFlag(env?.VITE_WOW_AI_MOMENT);
export const WOW_CASE_REVEAL = envFlag(env?.VITE_WOW_CASE_REVEAL);
export const WOW_DEMO_SCRIPT = envFlag(env?.VITE_WOW_DEMO_SCRIPT);
export const WOW_TOUR = envFlag(env?.VITE_WOW_TOUR);
export const WOW_TOUR_SCRIPT = typeof env?.VITE_WOW_TOUR_SCRIPT === "string" ? env.VITE_WOW_TOUR_SCRIPT.trim().toLowerCase() : "";

export const WOW_FLAGS = {
  WOW_DEMO,
  WOW_OVERLAY,
  WOW_REVEAL,
  WOW_MIRROR,
  WOW_XRAY,
  WOW_OPENING_IMPACT,
  WOW_EVIDENCE_IMPACT,
  WOW_MODEL_IMPACT,
  WOW_OPENING_CINEMA,
  WOW_PROOF_LOCK,
  WOW_CORE_MODULES,
  WOW_AI_MOMENT,
  WOW_CASE_REVEAL,
  WOW_DEMO_SCRIPT,
  WOW_TOUR,
} as const;
