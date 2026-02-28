export type SlideSlot =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19;

export type SlideRouteId =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19";

export type SlideId = `slide-${SlideRouteId}`;

export type SlideLabel = string;

export type SlideComponentName =
  | "Slide00"
  | "Slide01"
  | "Slide02"
  | "Slide03"
  | "Slide04"
  | "Slide05"
  | "Slide06"
  | "Slide07"
  | "Slide7"
  | "Slide08"
  | "Slide09"
  | "Slide10"
  | "Slide11"
  | "Slide12"
  | "Slide13"
  | "Slide14"
  | "Slide15"
  | "Slide16"
  | "Slide16_Investor"
  | "Slide17"
  | "Slide18"
  | "Slide19";

export type SlideSchemaEntry = {
  slot: SlideSlot;
  routeId: SlideRouteId;
  componentExport: SlideComponentName;
  label: SlideLabel;
  canonicalName: string;
  aliases: string[];
  fileCandidates: string[];
  notes: string;
};

export type SlideSchemaLookup = {
  ordered: SlideSchemaEntry[];
  bySlot: Map<SlideSlot, SlideSchemaEntry>;
  byRouteId: Map<SlideRouteId, SlideSchemaEntry>;
  byAlias: Map<string, SlideSchemaEntry>;
};

const REQUIRED_SLOTS: SlideSlot[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
];

const REQUIRED_ROUTE_IDS: SlideRouteId[] = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
];

export const SLIDE_SLOT_COUNT = REQUIRED_SLOTS.length;

function asRouteId(slot: number): SlideRouteId {
  return String(slot).padStart(2, "0") as SlideRouteId;
}

function normalizeAliasToken(input: string): string {
  return input.trim().toLowerCase().replace(/[\s\-_]+/g, "");
}

function cloneEntry(entry: SlideSchemaEntry): SlideSchemaEntry {
  return {
    slot: entry.slot,
    routeId: entry.routeId,
    componentExport: entry.componentExport,
    label: entry.label,
    canonicalName: entry.canonicalName,
    aliases: [...entry.aliases],
    fileCandidates: [...entry.fileCandidates],
    notes: entry.notes,
  };
}

function createBaseAliases(slot: SlideSlot, canonicalName: string): string[] {
  const routeId = asRouteId(slot);
  const routeDigit = String(slot);
  return [routeId, routeDigit, canonicalName, canonicalName.toLowerCase()];
}

export const SLIDE_SCHEMA: SlideSchemaEntry[] = [
  {
    slot: 0,
    routeId: "00",
    componentExport: "Slide00",
    label: "Slide00",
    canonicalName: "Slide00",
    aliases: createBaseAliases(0, "Slide00"),
    fileCandidates: ["components/slides/Slide00.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 1,
    routeId: "01",
    componentExport: "Slide01",
    label: "Slide01",
    canonicalName: "Slide01",
    aliases: createBaseAliases(1, "Slide01"),
    fileCandidates: ["components/slides/Slide01.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 2,
    routeId: "02",
    componentExport: "Slide02",
    label: "Slide02",
    canonicalName: "Slide02",
    aliases: createBaseAliases(2, "Slide02"),
    fileCandidates: ["components/slides/Slide02.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 3,
    routeId: "03",
    componentExport: "Slide03",
    label: "Slide03",
    canonicalName: "Slide03",
    aliases: createBaseAliases(3, "Slide03"),
    fileCandidates: ["components/slides/Slide03.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 4,
    routeId: "04",
    componentExport: "Slide04",
    label: "Slide04",
    canonicalName: "Slide04",
    aliases: createBaseAliases(4, "Slide04"),
    fileCandidates: ["components/slides/Slide04.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 5,
    routeId: "05",
    componentExport: "Slide05",
    label: "Slide05",
    canonicalName: "Slide05",
    aliases: createBaseAliases(5, "Slide05"),
    fileCandidates: ["components/slides/Slide05.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 6,
    routeId: "06",
    componentExport: "Slide06",
    label: "Slide06",
    canonicalName: "Slide06",
    aliases: createBaseAliases(6, "Slide06"),
    fileCandidates: ["components/slides/Slide06.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 7,
    routeId: "07",
    componentExport: "Slide7",
    label: "Slide07",
    canonicalName: "Slide07",
    aliases: [
      ...createBaseAliases(7, "Slide07"),
      "Slide7",
      "slide7",
      "slides/07",
      "slides/7",
    ],
    fileCandidates: [
      "components/slides/Slide7.tsx",
      "components/slides/Slide07.tsx",
    ],
    notes:
      "Transitional compatibility: runtime keeps mounting Slide7 while canonical naming policy is Slide07.",
  },
  {
    slot: 8,
    routeId: "08",
    componentExport: "Slide08",
    label: "Slide08",
    canonicalName: "Slide08",
    aliases: createBaseAliases(8, "Slide08"),
    fileCandidates: ["components/slides/Slide08.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 9,
    routeId: "09",
    componentExport: "Slide09",
    label: "Slide09",
    canonicalName: "Slide09",
    aliases: createBaseAliases(9, "Slide09"),
    fileCandidates: ["components/slides/Slide09.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 10,
    routeId: "10",
    componentExport: "Slide10",
    label: "Slide10",
    canonicalName: "Slide10",
    aliases: createBaseAliases(10, "Slide10"),
    fileCandidates: ["components/slides/Slide10.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 11,
    routeId: "11",
    componentExport: "Slide12",
    label: "Slide11",
    canonicalName: "Slide11",
    aliases: [
      ...createBaseAliases(11, "Slide11"),
      "Slide12",
      "slide12",
      "slides/11",
    ],
    fileCandidates: [
      "components/slides/Slide12.tsx",
      "components/slides/Slide11.tsx",
    ],
    notes:
      "Transitional compatibility: slot 11 mounts Slide12 to preserve behavior while canonical policy and labels remain Slide11.",
  },
  {
    slot: 12,
    routeId: "12",
    componentExport: "Slide13",
    label: "Slide12",
    canonicalName: "Slide12",
    aliases: ["12", "slides/12", "route12", "slot12"],
    fileCandidates: [
      "components/slides/Slide13.tsx",
      "components/slides/Slide12.tsx",
    ],
    notes:
      "Shifted mapping retained intentionally: slot 12 currently mounts Slide13 while label/canonical policy remains Slide12.",
  },
  {
    slot: 13,
    routeId: "13",
    componentExport: "Slide14",
    label: "Slide13",
    canonicalName: "Slide13",
    aliases: [...createBaseAliases(13, "Slide13"), "slides/13"],
    fileCandidates: [
      "components/slides/Slide14.tsx",
      "components/slides/Slide13.tsx",
    ],
    notes:
      "Shifted mapping retained intentionally: slot 13 currently mounts Slide14 while label/canonical policy remains Slide13.",
  },
  {
    slot: 14,
    routeId: "14",
    componentExport: "Slide15",
    label: "Slide14",
    canonicalName: "Slide14",
    aliases: [...createBaseAliases(14, "Slide14"), "slides/14"],
    fileCandidates: [
      "components/slides/Slide15.tsx",
      "components/slides/Slide14.tsx",
    ],
    notes:
      "Shifted mapping retained intentionally: slot 14 currently mounts Slide15 while label/canonical policy remains Slide14.",
  },
  {
    slot: 15,
    routeId: "15",
    componentExport: "Slide16",
    label: "Slide15",
    canonicalName: "Slide15",
    aliases: [...createBaseAliases(15, "Slide15"), "slides/15"],
    fileCandidates: [
      "components/slides/Slide16.tsx",
      "components/slides/Slide15.tsx",
    ],
    notes:
      "Shifted mapping retained intentionally: slot 15 currently mounts Slide16 while label/canonical policy remains Slide15.",
  },
  {
    slot: 16,
    routeId: "16",
    componentExport: "Slide16_Investor",
    label: "Slide16",
    canonicalName: "Slide16",
    aliases: [
      ...createBaseAliases(16, "Slide16"),
      "Slide16_Investor",
      "slide16investor",
      "slides/16",
    ],
    fileCandidates: [
      "components/slides/Slide16_Investor.tsx",
      "components/slides/Slide16.tsx",
    ],
    notes:
      "Investor variant is intentionally mounted at slot 16 while canonical policy remains Slide16.",
  },
  {
    slot: 17,
    routeId: "17",
    componentExport: "Slide17",
    label: "Slide17",
    canonicalName: "Slide17",
    aliases: createBaseAliases(17, "Slide17"),
    fileCandidates: ["components/slides/Slide17.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 18,
    routeId: "18",
    componentExport: "Slide18",
    label: "Slide18",
    canonicalName: "Slide18",
    aliases: createBaseAliases(18, "Slide18"),
    fileCandidates: ["components/slides/Slide18.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
  {
    slot: 19,
    routeId: "19",
    componentExport: "Slide19",
    label: "Slide19",
    canonicalName: "Slide19",
    aliases: createBaseAliases(19, "Slide19"),
    fileCandidates: ["components/slides/Slide19.tsx"],
    notes: "Canonical slot and mounted component are aligned.",
  },
];

export function validateSchema(schema: SlideSchemaEntry[]): SlideSchemaEntry[] {
  const errors: string[] = [];
  const seenSlots = new Set<number>();
  const seenRouteIds = new Set<string>();
  const seenAliases = new Map<string, SlideSchemaEntry>();

  for (const entry of schema) {
    if (!Number.isInteger(entry.slot)) {
      errors.push(`Invalid slot (non-integer): ${String(entry.slot)}`);
      continue;
    }

    if (entry.slot < 0 || entry.slot >= SLIDE_SLOT_COUNT) {
      errors.push(`Invalid slot (out of range 0..19): ${entry.slot}`);
    }

    if (seenSlots.has(entry.slot)) {
      errors.push(`Duplicate slot: ${entry.slot}`);
    }
    seenSlots.add(entry.slot);

    if (!/^\d{2}$/.test(entry.routeId)) {
      errors.push(`Invalid routeId format for slot ${entry.slot}: ${entry.routeId}`);
    }

    const expectedRouteId = asRouteId(entry.slot);
    if (entry.routeId !== expectedRouteId) {
      errors.push(
        `Route mismatch at slot ${entry.slot}: expected ${expectedRouteId}, got ${entry.routeId}`
      );
    }

    if (seenRouteIds.has(entry.routeId)) {
      errors.push(`Duplicate routeId: ${entry.routeId}`);
    }
    seenRouteIds.add(entry.routeId);

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
    if (
      entry.canonicalName.trim() !== entry.componentExport.trim() &&
      !entry.notes.trim()
    ) {
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

  const missingSlots = REQUIRED_SLOTS.filter((slot) => !seenSlots.has(slot));
  if (missingSlots.length > 0) {
    errors.push(
      `Missing slots: ${missingSlots.map((slot) => String(slot).padStart(2, "0")).join(", ")}`
    );
  }

  const missingRouteIds = REQUIRED_ROUTE_IDS.filter((routeId) => !seenRouteIds.has(routeId));
  if (missingRouteIds.length > 0) {
    errors.push(`Missing routeIds: ${missingRouteIds.join(", ")}`);
  }

  if (errors.length > 0) {
    const orderedErrors = [...errors].sort((left, right) => left.localeCompare(right));
    throw new Error(`Slide schema validation failed:\n- ${orderedErrors.join("\n- ")}`);
  }

  return schema
    .map(cloneEntry)
    .sort((left, right) => left.slot - right.slot);
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
