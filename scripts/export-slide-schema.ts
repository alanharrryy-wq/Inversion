import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  SLIDE_SCHEMA,
  buildLookup,
  validateSchema,
} from "../runtime/slides/contracts/slideSchema";

type CliOptions = {
  out: string;
};

function parseArgs(argv: string[]): CliOptions {
  let out = ".run/slide-schema-export.json";
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--out") {
      out = argv[index + 1] ?? out;
      index += 1;
    }
  }
  return { out };
}

function main(): number {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const outPath = path.resolve(repoRoot, options.out);

  const validated = validateSchema(SLIDE_SCHEMA);
  const lookup = buildLookup(validated);

  const report = {
    schemaVersion: "slide-registry.v1",
    slotCount: validated.length,
    slides: validated.map((entry) => ({
      slot: entry.slot,
      routeId: entry.routeId,
      componentExport: entry.componentExport,
      label: entry.label,
      canonicalName: entry.canonicalName,
      aliases: [...entry.aliases].sort((left, right) => left.localeCompare(right)),
      fileCandidates: [...entry.fileCandidates].sort((left, right) => left.localeCompare(right)),
      notes: entry.notes,
    })),
    lookup: {
      routeIds: [...lookup.byRouteId.keys()].sort((left, right) => left.localeCompare(right)),
      slots: [...lookup.bySlot.keys()].sort((left, right) => left - right),
      aliases: [...lookup.byAlias.entries()]
        .map(([alias, entry]) => ({
          alias,
          slot: entry.slot,
          routeId: entry.routeId,
          componentExport: entry.componentExport,
        }))
        .sort((left, right) => {
          if (left.alias !== right.alias) return left.alias.localeCompare(right.alias);
          return left.slot - right.slot;
        }),
    },
  };

  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const relPath = path.relative(repoRoot, outPath).replace(/\\/g, "/");
  console.log(`[export-slide-schema] wrote ${relPath}`);
  return 0;
}

process.exitCode = main();
