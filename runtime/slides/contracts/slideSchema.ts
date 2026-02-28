import rawCatalog from "../../../docs/slides/SLIDES_CATALOG.json";

export type SlideClassification = "CORE" | "BRIDGE" | "UI";
export type SlideInteractionModel = "FSM" | "REDUCER" | "LOCAL_STATE" | "NONE";
export type SlideReplayMode = "JSON" | "PROGRAMMATIC" | "NONE";
export type SlideDeterminism = "STRICT" | "CONDITIONAL" | "NONE";

export type SlideSlot = number;
export type SlideRouteId = string;
export type SlideId = string;
export type SlideLabel = string;
export type SlideComponentName = string;

export type SlideCatalogMainEntry = {
  index: number;
  routeId: string;
  slideId: string;
  title: string;
  componentName: string;
  componentFile: string;
  classification: SlideClassification;
  interactionModel: SlideInteractionModel;
  replay: SlideReplayMode;
  determinism: SlideDeterminism;
  stableIds: string[];
  aliases?: string[];
  visualOnlyAllow?: string[];
  componentMappingNote?: string;
};

export type SlideCatalogLegacyEntry = {
  routeId: string;
  slideId: string;
  componentName: string;
  componentFile: string;
  reason: string;
};

export type SlidesCatalog = {
  schemaVersion: string;
  catalogPolicy: {
    singleAuthority: string;
    routePattern: string;
    routePathTemplate: string;
  };
  mainRoute: SlideCatalogMainEntry[];
  legacy: SlideCatalogLegacyEntry[];
};

export type SlideSchemaEntry = {
  slot: SlideSlot;
  routeId: SlideRouteId;
  slideId: SlideId;
  componentExport: SlideComponentName;
  label: SlideLabel;
  canonicalName: string;
  aliases: string[];
  fileCandidates: string[];
  notes: string;
  classification: SlideClassification;
  interactionModel: SlideInteractionModel;
  replay: SlideReplayMode;
  determinism: SlideDeterminism;
  stableIds: string[];
  visualOnlyAllow: string[];
};

export type SlideSchemaLookup = {
  ordered: SlideSchemaEntry[];
  bySlot: Map<SlideSlot, SlideSchemaEntry>;
  byRouteId: Map<SlideRouteId, SlideSchemaEntry>;
  byAlias: Map<string, SlideSchemaEntry>;
};

const CLASSIFICATIONS = new Set<SlideClassification>(["CORE", "BRIDGE", "UI"]);
const INTERACTION_MODELS = new Set<SlideInteractionModel>(["FSM", "REDUCER", "LOCAL_STATE", "NONE"]);
const REPLAY_MODES = new Set<SlideReplayMode>(["JSON", "PROGRAMMATIC", "NONE"]);
const DETERMINISM_MODES = new Set<SlideDeterminism>(["STRICT", "CONDITIONAL", "NONE"]);

function padRouteId(index: number): string {
  return String(index).padStart(2, "0");
}

function normalizeAliasToken(input: string): string {
  return input.trim().toLowerCase().replace(/[\s\-_/]+/g, "");
}

function cloneEntry(entry: SlideSchemaEntry): SlideSchemaEntry {
  return {
    slot: entry.slot,
    routeId: entry.routeId,
    slideId: entry.slideId,
    componentExport: entry.componentExport,
    label: entry.label,
    canonicalName: entry.canonicalName,
    aliases: [...entry.aliases],
    fileCandidates: [...entry.fileCandidates],
    notes: entry.notes,
    classification: entry.classification,
    interactionModel: entry.interactionModel,
    replay: entry.replay,
    determinism: entry.determinism,
    stableIds: [...entry.stableIds],
    visualOnlyAllow: [...entry.visualOnlyAllow],
  };
}

function asCatalog(payload: unknown): SlidesCatalog {
  if (!payload || typeof payload !== "object") {
    throw new Error("Slides catalog must be an object.");
  }
  const catalog = payload as SlidesCatalog;
  if (!Array.isArray(catalog.mainRoute)) {
    throw new Error("Slides catalog is missing mainRoute[].");
  }
  if (!Array.isArray(catalog.legacy)) {
    throw new Error("Slides catalog is missing legacy[].");
  }
  return catalog;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0))).sort((left, right) =>
    left.localeCompare(right)
  );
}

function canonicalNameForRoute(routeId: string): string {
  return `Slide${routeId}`;
}

function mapMainRouteEntry(entry: SlideCatalogMainEntry): SlideSchemaEntry {
  const canonicalName = canonicalNameForRoute(entry.routeId);
  const aliases = uniqueSorted([
    entry.routeId,
    String(entry.index),
    entry.slideId,
    entry.slideId.toLowerCase(),
    canonicalName,
    canonicalName.toLowerCase(),
    entry.componentName,
    entry.componentName.toLowerCase(),
    `slides/${entry.routeId}`,
    ...(entry.aliases ?? []),
  ]);

  const mismatch = canonicalName !== entry.componentName;
  const notes = mismatch
    ? entry.componentMappingNote ?? "Catalog-declared alternative component mapping."
    : "Canonical slot and mounted component are aligned.";

  return {
    slot: entry.index,
    routeId: entry.routeId,
    slideId: entry.slideId,
    componentExport: entry.componentName,
    label: canonicalName,
    canonicalName,
    aliases,
    fileCandidates: [entry.componentFile],
    notes,
    classification: entry.classification,
    interactionModel: entry.interactionModel,
    replay: entry.replay,
    determinism: entry.determinism,
    stableIds: [...entry.stableIds],
    visualOnlyAllow: [...(entry.visualOnlyAllow ?? [])],
  };
}

export const SLIDES_CATALOG: SlidesCatalog = asCatalog(rawCatalog);

export const SLIDE_SCHEMA: SlideSchemaEntry[] = SLIDES_CATALOG.mainRoute.map(mapMainRouteEntry);

export const SLIDE_SLOT_COUNT = SLIDE_SCHEMA.length;

export function getCatalogMainRoute(): SlideCatalogMainEntry[] {
  return SLIDES_CATALOG.mainRoute.map((entry) => ({
    ...entry,
    aliases: entry.aliases ? [...entry.aliases] : [],
    stableIds: [...entry.stableIds],
    visualOnlyAllow: entry.visualOnlyAllow ? [...entry.visualOnlyAllow] : [],
  }));
}

export function getCatalogLegacy(): SlideCatalogLegacyEntry[] {
  return SLIDES_CATALOG.legacy.map((entry) => ({ ...entry }));
}

export function validateSchema(schema: SlideSchemaEntry[]): SlideSchemaEntry[] {
  if (!Array.isArray(schema) || schema.length === 0) {
    throw new Error("Slide schema validation failed:\n- Schema must include at least one slide.");
  }

  const errors: string[] = [];
  const seenSlots = new Set<number>();
  const seenRouteIds = new Set<string>();
  const seenSlideIds = new Set<string>();
  const seenAliases = new Map<string, SlideSchemaEntry>();

  const orderedBySlot = schema
    .map(cloneEntry)
    .sort((left, right) => left.slot - right.slot);

  for (const [orderedIndex, entry] of orderedBySlot.entries()) {
    if (!Number.isInteger(entry.slot)) {
      errors.push(`Invalid slot (non-integer): ${String(entry.slot)}`);
      continue;
    }

    if (entry.slot < 0) {
      errors.push(`Invalid slot (negative): ${entry.slot}`);
    }

    if (seenSlots.has(entry.slot)) {
      errors.push(`Duplicate slot: ${entry.slot}`);
    }
    seenSlots.add(entry.slot);

    if (entry.slot !== orderedIndex) {
      errors.push(
        `Slot sequence mismatch at position ${orderedIndex}: expected ${orderedIndex}, got ${entry.slot}`
      );
    }

    if (!/^\d{2}$/.test(entry.routeId)) {
      errors.push(`Invalid routeId format for slot ${entry.slot}: ${entry.routeId}`);
    }

    const expectedRouteId = padRouteId(entry.slot);
    if (entry.routeId !== expectedRouteId) {
      errors.push(`Route mismatch at slot ${entry.slot}: expected ${expectedRouteId}, got ${entry.routeId}`);
    }

    if (seenRouteIds.has(entry.routeId)) {
      errors.push(`Duplicate routeId: ${entry.routeId}`);
    }
    seenRouteIds.add(entry.routeId);

    const expectedSlideId = `slide${entry.routeId}`;
    if (entry.slideId !== expectedSlideId) {
      errors.push(`slideId mismatch at slot ${entry.slot}: expected ${expectedSlideId}, got ${entry.slideId}`);
    }

    if (seenSlideIds.has(entry.slideId)) {
      errors.push(`Duplicate slideId: ${entry.slideId}`);
    }
    seenSlideIds.add(entry.slideId);

    if (!entry.componentExport?.trim()) {
      errors.push(`Missing componentExport at slot ${entry.slot}`);
    }
    if (!entry.label?.trim()) {
      errors.push(`Missing label at slot ${entry.slot}`);
    }
    if (!entry.canonicalName?.trim()) {
      errors.push(`Missing canonicalName at slot ${entry.slot}`);
    }
    if (!Array.isArray(entry.aliases) || entry.aliases.length === 0) {
      errors.push(`Missing aliases at slot ${entry.slot}`);
    }
    if (!Array.isArray(entry.fileCandidates) || entry.fileCandidates.length === 0) {
      errors.push(`Missing fileCandidates at slot ${entry.slot}`);
    }
    if (!Array.isArray(entry.stableIds) || entry.stableIds.length === 0) {
      errors.push(`Missing stableIds at slot ${entry.slot}`);
    }

    if (!CLASSIFICATIONS.has(entry.classification)) {
      errors.push(`Invalid classification at slot ${entry.slot}: ${entry.classification}`);
    }
    if (!INTERACTION_MODELS.has(entry.interactionModel)) {
      errors.push(`Invalid interactionModel at slot ${entry.slot}: ${entry.interactionModel}`);
    }
    if (!REPLAY_MODES.has(entry.replay)) {
      errors.push(`Invalid replay mode at slot ${entry.slot}: ${entry.replay}`);
    }
    if (!DETERMINISM_MODES.has(entry.determinism)) {
      errors.push(`Invalid determinism mode at slot ${entry.slot}: ${entry.determinism}`);
    }

    if (entry.canonicalName.trim() !== entry.componentExport.trim() && !entry.notes.trim()) {
      errors.push(`Missing notes for mismatch at slot ${entry.slot}`);
    }

    for (const alias of entry.aliases) {
      const normalizedAlias = normalizeAliasToken(alias);
      if (!normalizedAlias) {
        errors.push(`Empty alias at slot ${entry.slot}`);
        continue;
      }

      const previous = seenAliases.get(normalizedAlias);
      if (previous && previous.slot !== entry.slot) {
        errors.push(
          `Duplicate alias "${alias}" (normalized: ${normalizedAlias}) for slots ${previous.slot} and ${entry.slot}`
        );
        continue;
      }
      seenAliases.set(normalizedAlias, entry);
    }
  }

  if (errors.length > 0) {
    const orderedErrors = [...errors].sort((left, right) => left.localeCompare(right));
    throw new Error(`Slide schema validation failed:\n- ${orderedErrors.join("\n- ")}`);
  }

  return orderedBySlot;
}

export function buildLookup(schema: SlideSchemaEntry[]): SlideSchemaLookup {
  const ordered = validateSchema(schema);
  const bySlot = new Map<SlideSlot, SlideSchemaEntry>();
  const byRouteId = new Map<SlideRouteId, SlideSchemaEntry>();
  const byAlias = new Map<string, SlideSchemaEntry>();

  for (const entry of ordered) {
    bySlot.set(entry.slot, entry);
    byRouteId.set(entry.routeId, entry);

    const normalizedAliases = entry.aliases
      .map((alias) => normalizeAliasToken(alias))
      .filter((alias) => alias.length > 0)
      .sort((left, right) => left.localeCompare(right));

    for (const alias of normalizedAliases) {
      const previous = byAlias.get(alias);
      if (previous && previous.slot !== entry.slot) {
        throw new Error(
          `Slide schema lookup collision for alias "${alias}" between slots ${previous.slot} and ${entry.slot}`
        );
      }
      byAlias.set(alias, entry);
    }
  }

  return {
    ordered,
    bySlot,
    byRouteId,
    byAlias,
  };
}

export function normalizeAliasForLookup(value: string): string {
  return normalizeAliasToken(value);
}
