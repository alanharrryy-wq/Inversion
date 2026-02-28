import {
  SLIDE_SCHEMA,
  SLIDE_SLOT_COUNT,
  SlideComponentName,
  SlideRouteId,
  SlideSchemaEntry,
  SlideSlot,
  buildLookup,
  normalizeAliasForLookup,
} from "./slideSchema";

type SlideRegistry = {
  schema: SlideSchemaEntry[];
  slotCount: number;
  lookup: ReturnType<typeof buildLookup>;
};

let cachedRegistry: SlideRegistry | null = null;

function isValidSlot(input: number): input is SlideSlot {
  return Number.isInteger(input) && input >= 0 && input < SLIDE_SLOT_COUNT;
}

function parseRouteIdInput(input: string): SlideRouteId | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const routeMatch = trimmed.match(/^\/?slides\/(\d{1,2})\/?$/i);
  if (routeMatch) {
    const numeric = Number(routeMatch[1]);
    if (!Number.isInteger(numeric)) return null;
    const normalized = String(numeric).padStart(2, "0") as SlideRouteId;
    return normalized;
  }

  const numericMatch = trimmed.match(/^\d{1,2}$/);
  if (numericMatch) {
    const numeric = Number(trimmed);
    if (!Number.isInteger(numeric)) return null;
    return String(numeric).padStart(2, "0") as SlideRouteId;
  }

  return null;
}

export function createSlideRegistry(): SlideRegistry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  const lookup = buildLookup(SLIDE_SCHEMA);
  cachedRegistry = {
    schema: lookup.ordered,
    slotCount: lookup.ordered.length,
    lookup,
  };

  return cachedRegistry;
}

export function getSlideComponentForSlot(slot: number): SlideComponentName | null {
  if (!isValidSlot(slot)) {
    return null;
  }
  const entry = createSlideRegistry().lookup.bySlot.get(slot);
  return entry ? entry.componentExport : null;
}

export function resolveSlideComponentForSlot<TComponent>(
  slot: number,
  componentMap: Record<string, TComponent>
): TComponent | null {
  const componentExport = getSlideComponentForSlot(slot);
  if (!componentExport) return null;
  return componentMap[componentExport] ?? null;
}

export function normalizeSlideRef(input: unknown): SlideRouteId | null {
  const registry = createSlideRegistry();

  if (typeof input === "number" && Number.isInteger(input)) {
    if (!isValidSlot(input)) return null;
    const entry = registry.lookup.bySlot.get(input);
    return entry ? entry.routeId : null;
  }

  if (typeof input !== "string") {
    return null;
  }

  const aliasKey = normalizeAliasForLookup(input);
  if (aliasKey) {
    const fromAlias = registry.lookup.byAlias.get(aliasKey);
    if (fromAlias) {
      return fromAlias.routeId;
    }
  }

  const routeId = parseRouteIdInput(input);
  if (!routeId) {
    return null;
  }

  const fromRoute = registry.lookup.byRouteId.get(routeId);
  return fromRoute ? fromRoute.routeId : null;
}

export function getSlideLabels(): string[] {
  return createSlideRegistry().schema.map((entry) => entry.label);
}

export function getSlideSchema(): SlideSchemaEntry[] {
  return createSlideRegistry().schema.map((entry) => ({
    ...entry,
    aliases: [...entry.aliases],
    fileCandidates: [...entry.fileCandidates],
  }));
}

export function assertSlideRegistryInvariant(options?: {
  expectedSlotCount?: number;
  availableComponentExports?: string[];
}): void {
  const registry = createSlideRegistry();
  const errors: string[] = [];

  if (
    typeof options?.expectedSlotCount === "number" &&
    registry.slotCount !== options.expectedSlotCount
  ) {
    errors.push(
      `Registry slot count mismatch: expected ${options.expectedSlotCount}, got ${registry.slotCount}`
    );
  }

  if (Array.isArray(options?.availableComponentExports)) {
    const available = new Set(options.availableComponentExports);
    for (const entry of registry.schema) {
      if (!available.has(entry.componentExport)) {
        errors.push(
          `Missing mounted component export "${entry.componentExport}" for slot ${entry.slot}`
        );
      }
    }
  }

  for (const entry of registry.schema) {
    if (!isValidSlot(entry.slot)) {
      errors.push(`Invalid slot in registry: ${entry.slot}`);
    }
    if (!registry.lookup.byRouteId.has(entry.routeId)) {
      errors.push(`Missing route mapping for routeId ${entry.routeId}`);
    }
  }

  if (errors.length > 0) {
    const ordered = [...errors].sort((left, right) => left.localeCompare(right));
    throw new Error(`Slide registry invariant failed:\n- ${ordered.join("\n- ")}`);
  }
}
