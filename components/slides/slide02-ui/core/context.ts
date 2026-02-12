import {
  ConstraintValues,
  RouteSourceKind,
  Slide02SeedContext,
  Slide02RouteId,
} from "./types";
import {
  SLIDE02_DEFAULT_CONSTRAINTS,
  SLIDE02_DEFAULT_ROUTE,
  createDefaultSeedContext,
  normalizeRoute,
  sanitizeConstraints,
} from "./model";

const ROUTE_QUERY_KEYS = ["route", "selectedRoute", "selected_route", "r"] as const;
const STRICTNESS_QUERY_KEYS = ["strictness", "strict", "governance"] as const;
const BUDGET_QUERY_KEYS = ["budget", "budgetGuard", "capital"] as const;
const LATENCY_QUERY_KEYS = ["latency", "latencyGuard", "responseLag"] as const;

const ROUTE_STORAGE_KEYS = [
  "inversion.selectedRoute",
  "inversion.route",
  "hitech.selectedRoute",
  "hitech.route",
] as const;

const STRICTNESS_STORAGE_KEYS = [
  "inversion.slide02.strictness",
  "inversion.strictness",
  "hitech.slide02.strictness",
] as const;

const BUDGET_STORAGE_KEYS = [
  "inversion.slide02.budget",
  "inversion.budget",
  "hitech.slide02.budget",
] as const;

const LATENCY_STORAGE_KEYS = [
  "inversion.slide02.latency",
  "inversion.latency",
  "hitech.slide02.latency",
] as const;

export interface Slide02ContextInput {
  route?: string | null;
  strictness?: number | string | null;
  budgetGuard?: number | string | null;
  latencyGuard?: number | string | null;
  routeSource?: RouteSourceKind;
}

declare global {
  interface Window {
    __INVERSION_SELECTED_ROUTE__?: unknown;
    __INVERSION_SLIDE02_SEED__?: Partial<Slide02ContextInput>;
  }
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function pickFromSearchParams(
  params: URLSearchParams,
  keys: ReadonlyArray<string>
): string | null {
  const hit = keys
    .map((key) => params.get(key))
    .find((value) => typeof value === "string" && value.trim().length > 0);

  return hit ?? null;
}

function pickFromStorage(storage: Storage | null, keys: ReadonlyArray<string>): string | null {
  if (!storage) return null;

  const hit = keys
    .map((key) => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    })
    .find((value) => typeof value === "string" && value.trim().length > 0);

  return hit ?? null;
}

function constraintsFromRaw(input: {
  strictness?: unknown;
  budgetGuard?: unknown;
  latencyGuard?: unknown;
}): ConstraintValues {
  const strictness = parseFiniteNumber(input.strictness);
  const budgetGuard = parseFiniteNumber(input.budgetGuard);
  const latencyGuard = parseFiniteNumber(input.latencyGuard);

  return sanitizeConstraints({
    strictness: strictness ?? SLIDE02_DEFAULT_CONSTRAINTS.strictness,
    budgetGuard: budgetGuard ?? SLIDE02_DEFAULT_CONSTRAINTS.budgetGuard,
    latencyGuard: latencyGuard ?? SLIDE02_DEFAULT_CONSTRAINTS.latencyGuard,
  });
}

function resolveQuerySeed(search: string): Partial<Slide02SeedContext> | null {
  if (!search || !search.trim()) return null;

  const params = new URLSearchParams(search);
  const routeRaw = pickFromSearchParams(params, ROUTE_QUERY_KEYS);
  const strictnessRaw = pickFromSearchParams(params, STRICTNESS_QUERY_KEYS);
  const budgetRaw = pickFromSearchParams(params, BUDGET_QUERY_KEYS);
  const latencyRaw = pickFromSearchParams(params, LATENCY_QUERY_KEYS);

  const hasAny = [routeRaw, strictnessRaw, budgetRaw, latencyRaw].some((value) => value !== null);
  if (!hasAny) return null;

  const route = normalizeRoute(routeRaw);
  const constraints = constraintsFromRaw({
    strictness: strictnessRaw,
    budgetGuard: budgetRaw,
    latencyGuard: latencyRaw,
  });

  return {
    route,
    routeSource: "query",
    constraints,
    rawRouteInput: routeRaw ?? undefined,
  };
}

function resolveHistorySeed(historyState: unknown): Partial<Slide02SeedContext> | null {
  if (!historyState || typeof historyState !== "object") return null;

  const maybe = historyState as Record<string, unknown>;
  const routeCandidate = maybe.route ?? maybe.selectedRoute ?? maybe.selected_route;

  const strictness = maybe.strictness ?? maybe.strict;
  const budget = maybe.budgetGuard ?? maybe.budget;
  const latency = maybe.latencyGuard ?? maybe.latency;

  const hasAny =
    routeCandidate !== undefined || strictness !== undefined || budget !== undefined || latency !== undefined;

  if (!hasAny) return null;

  return {
    route: normalizeRoute(routeCandidate),
    routeSource: "history",
    constraints: constraintsFromRaw({
      strictness,
      budgetGuard: budget,
      latencyGuard: latency,
    }),
    rawRouteInput: typeof routeCandidate === "string" ? routeCandidate : undefined,
  };
}

function resolveStorageSeed(
  localStorageRef: Storage | null,
  sessionStorageRef: Storage | null
): Partial<Slide02SeedContext> | null {
  const routeRaw =
    pickFromStorage(localStorageRef, ROUTE_STORAGE_KEYS) ??
    pickFromStorage(sessionStorageRef, ROUTE_STORAGE_KEYS);

  const strictnessRaw =
    pickFromStorage(localStorageRef, STRICTNESS_STORAGE_KEYS) ??
    pickFromStorage(sessionStorageRef, STRICTNESS_STORAGE_KEYS);

  const budgetRaw =
    pickFromStorage(localStorageRef, BUDGET_STORAGE_KEYS) ??
    pickFromStorage(sessionStorageRef, BUDGET_STORAGE_KEYS);

  const latencyRaw =
    pickFromStorage(localStorageRef, LATENCY_STORAGE_KEYS) ??
    pickFromStorage(sessionStorageRef, LATENCY_STORAGE_KEYS);

  const hasAny = [routeRaw, strictnessRaw, budgetRaw, latencyRaw].some((value) => value !== null);
  if (!hasAny) return null;

  return {
    route: normalizeRoute(routeRaw),
    routeSource: "local-storage",
    constraints: constraintsFromRaw({
      strictness: strictnessRaw,
      budgetGuard: budgetRaw,
      latencyGuard: latencyRaw,
    }),
    rawRouteInput: routeRaw ?? undefined,
  };
}

function resolveWindowSeed(windowRef: Window): Partial<Slide02SeedContext> | null {
  const direct = windowRef.__INVERSION_SELECTED_ROUTE__;
  const bundle = windowRef.__INVERSION_SLIDE02_SEED__;

  if (!direct && !bundle) return null;

  const routeCandidate = bundle?.route ?? direct;
  const strictness = bundle?.strictness;
  const budget = bundle?.budgetGuard;
  const latency = bundle?.latencyGuard;

  return {
    route: normalizeRoute(routeCandidate),
    routeSource: "external-payload",
    constraints: constraintsFromRaw({
      strictness,
      budgetGuard: budget,
      latencyGuard: latency,
    }),
    rawRouteInput: typeof routeCandidate === "string" ? routeCandidate : undefined,
  };
}

function mergeSeeds(
  defaults: Slide02SeedContext,
  candidate: Partial<Slide02SeedContext> | null
): Slide02SeedContext {
  if (!candidate) return defaults;

  return {
    route: normalizeRoute(candidate.route ?? defaults.route),
    routeSource: candidate.routeSource ?? defaults.routeSource,
    constraints: sanitizeConstraints(candidate.constraints ?? defaults.constraints),
    rawRouteInput: candidate.rawRouteInput ?? defaults.rawRouteInput,
  };
}

function resolveManualInput(input: Partial<Slide02ContextInput> | null | undefined): Partial<Slide02SeedContext> | null {
  if (!input) return null;

  const hasAny =
    input.route !== undefined ||
    input.strictness !== undefined ||
    input.budgetGuard !== undefined ||
    input.latencyGuard !== undefined;

  if (!hasAny) return null;

  return {
    route: normalizeRoute(input.route),
    routeSource: input.routeSource ?? "external-payload",
    constraints: constraintsFromRaw({
      strictness: input.strictness,
      budgetGuard: input.budgetGuard,
      latencyGuard: input.latencyGuard,
    }),
    rawRouteInput: typeof input.route === "string" ? input.route : undefined,
  };
}

export function resolveSlide02SeedContext(
  manualInput?: Partial<Slide02ContextInput> | null
): Slide02SeedContext {
  const defaults = createDefaultSeedContext();

  if (typeof window === "undefined") {
    return mergeSeeds(defaults, resolveManualInput(manualInput));
  }

  const querySeed = resolveQuerySeed(window.location.search);
  const historySeed = resolveHistorySeed(window.history?.state);
  const storageSeed = resolveStorageSeed(window.localStorage, window.sessionStorage);
  const windowSeed = resolveWindowSeed(window);
  const manualSeed = resolveManualInput(manualInput);

  // Precedence: manual > query > history > storage > window > defaults
  const candidates: Array<Partial<Slide02SeedContext> | null> = [
    windowSeed,
    storageSeed,
    historySeed,
    querySeed,
    manualSeed,
  ];

  return candidates.reduce((acc, candidate) => mergeSeeds(acc, candidate), defaults);
}

export function routeSourceLabel(source: RouteSourceKind): string {
  switch (source) {
    case "default":
      return "Fallback default";
    case "query":
      return "URL query";
    case "history":
      return "History state";
    case "local-storage":
      return "Local storage";
    case "external-payload":
      return "External payload";
    default:
      return "Fallback default";
  }
}

export function routeIdToHuman(route: Slide02RouteId): string {
  if (route === "stabilize-operations") return "Stabilize Operations";
  if (route === "throughput-push") return "Throughput Push";
  if (route === "margin-defense") return "Margin Defense";
  return "Quality Ringfence";
}

export function exportSeedSummary(seed: Slide02SeedContext): string {
  return [
    `route:${seed.route}`,
    `source:${seed.routeSource}`,
    `strictness:${seed.constraints.strictness}`,
    `budget:${seed.constraints.budgetGuard}`,
    `latency:${seed.constraints.latencyGuard}`,
  ].join("|");
}

export function sanitizeRouteForReplay(input: unknown): Slide02RouteId {
  return normalizeRoute(input);
}

export function ensureRouteOrDefault(input: unknown, fallback: Slide02RouteId = SLIDE02_DEFAULT_ROUTE): Slide02RouteId {
  const normalized = normalizeRoute(input);
  return normalized || fallback;
}
