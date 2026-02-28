import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "docs", "slides", "SLIDES_CATALOG.json");
const REPORT_JSON_OUT = path.join(ROOT, "docs", "_generated", "SLIDE_REGISTRY_REPORT.json");
const REPORT_MD_OUT = path.join(ROOT, "docs", "_generated", "SLIDE_REGISTRY_REPORT.md");
const ENGINE_MATRIX_OUT = path.join(ROOT, "docs", "slides", "ENGINE_MATRIX.md");
const SLIDE_RENDERER_PATH = path.join(ROOT, "components", "SlideRenderer.tsx");

const NON_DETERMINISTIC_APIS = [
  { token: "Math.random", pattern: /Math\.random\s*\(/g },
  { token: "Date.now", pattern: /Date\.now\s*\(/g },
  { token: "performance.now", pattern: /performance\.now\s*\(/g },
];

const VALID_CLASSIFICATIONS = new Set(["CORE", "BRIDGE", "UI"]);
const VALID_INTERACTIONS = new Set(["FSM", "REDUCER", "LOCAL_STATE", "NONE"]);
const VALID_REPLAY = new Set(["JSON", "PROGRAMMATIC", "NONE"]);
const VALID_DETERMINISM = new Set(["STRICT", "CONDITIONAL", "NONE"]);

function sortByCodeThenRoute(left, right) {
  if (left.severity !== right.severity) return left.severity.localeCompare(right.severity);
  if (left.code !== right.code) return left.code.localeCompare(right.code);
  if ((left.routeId ?? "") !== (right.routeId ?? "")) {
    return (left.routeId ?? "").localeCompare(right.routeId ?? "");
  }
  return left.message.localeCompare(right.message);
}

function padRoute(index) {
  return String(index).padStart(2, "0");
}

function normalizeSlash(inputPath) {
  return inputPath.replace(/\\/g, "/");
}

function relativeFromRoot(absPath) {
  return normalizeSlash(path.relative(ROOT, absPath));
}

function addIssue(issues, severity, code, message, routeId = null) {
  issues.push({ severity, code, message, routeId });
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeText(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content}\n`, "utf8");
}

async function listFilesRecursively(dirPath) {
  const results = [];
  async function walk(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
        continue;
      }
      results.push(nextPath);
    }
  }

  await walk(dirPath);
  return results;
}

async function parseSlideRendererMap() {
  const src = await fs.readFile(SLIDE_RENDERER_PATH, "utf8");

  const imports = new Map();
  for (const match of src.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+"([^"]+)";/g)) {
    imports.set(match[1], match[2]);
  }

  const mapBlockMatch = src.match(/const SLIDE_COMPONENTS:[\s\S]*?=\s*\{([\s\S]*?)\};/);
  const mapped = new Set();
  if (mapBlockMatch) {
    const block = mapBlockMatch[1];
    for (const match of block.matchAll(/^\s*([A-Za-z0-9_]+)\s*(?::|,)/gm)) {
      mapped.add(match[1]);
    }
  }

  return { imports, mapped };
}

function validateEnumeration(catalog, issues) {
  const mainRoute = Array.isArray(catalog.mainRoute) ? [...catalog.mainRoute] : [];
  if (mainRoute.length < 12 || mainRoute.length > 14) {
    addIssue(
      issues,
      "error",
      "ROUTE_COUNT_OUT_OF_RANGE",
      `mainRoute must contain 12-14 slides. Found ${mainRoute.length}.`
    );
  }

  const ordered = [...mainRoute].sort((left, right) => Number(left.index) - Number(right.index));
  const seenRouteIds = new Set();
  const seenSlideIds = new Set();

  for (const [position, entry] of ordered.entries()) {
    const index = Number(entry.index);
    const expectedRoute = padRoute(position);
    const expectedSlideId = `slide${expectedRoute}`;

    if (!Number.isInteger(index)) {
      addIssue(issues, "error", "INDEX_INVALID", `index must be integer. Got ${String(entry.index)}.`);
      continue;
    }
    if (index !== position) {
      addIssue(
        issues,
        "error",
        "INDEX_GAP_OR_MISMATCH",
        `Expected index ${position}, got ${index}. Sequential and gapless order is required.`,
        entry.routeId
      );
    }

    if (entry.routeId !== expectedRoute) {
      addIssue(
        issues,
        "error",
        "ROUTE_MISMATCH",
        `routeId mismatch for index ${index}. Expected ${expectedRoute}, got ${entry.routeId}.`,
        entry.routeId
      );
    }

    if (entry.slideId !== expectedSlideId) {
      addIssue(
        issues,
        "error",
        "SLIDE_ID_MISMATCH",
        `slideId mismatch for index ${index}. Expected ${expectedSlideId}, got ${entry.slideId}.`,
        entry.routeId
      );
    }

    if (seenRouteIds.has(entry.routeId)) {
      addIssue(issues, "error", "ROUTE_DUPLICATE", `Duplicate routeId: ${entry.routeId}.`, entry.routeId);
    }
    seenRouteIds.add(entry.routeId);

    if (seenSlideIds.has(entry.slideId)) {
      addIssue(issues, "error", "SLIDE_ID_DUPLICATE", `Duplicate slideId: ${entry.slideId}.`, entry.routeId);
    }
    seenSlideIds.add(entry.slideId);

    if (!VALID_CLASSIFICATIONS.has(entry.classification)) {
      addIssue(
        issues,
        "error",
        "CLASSIFICATION_INVALID",
        `Invalid classification '${entry.classification}'.`,
        entry.routeId
      );
    }
    if (!VALID_INTERACTIONS.has(entry.interactionModel)) {
      addIssue(
        issues,
        "error",
        "INTERACTION_MODEL_INVALID",
        `Invalid interactionModel '${entry.interactionModel}'.`,
        entry.routeId
      );
    }
    if (!VALID_REPLAY.has(entry.replay)) {
      addIssue(issues, "error", "REPLAY_INVALID", `Invalid replay '${entry.replay}'.`, entry.routeId);
    }
    if (!VALID_DETERMINISM.has(entry.determinism)) {
      addIssue(
        issues,
        "error",
        "DETERMINISM_INVALID",
        `Invalid determinism '${entry.determinism}'.`,
        entry.routeId
      );
    }
  }

  return ordered;
}

async function validateComponentMapping(catalogRoute, issues) {
  const renderer = await parseSlideRendererMap();

  for (const entry of catalogRoute) {
    const componentFileAbs = path.join(ROOT, entry.componentFile);
    let exists = true;
    try {
      await fs.access(componentFileAbs);
    } catch {
      exists = false;
    }

    if (!exists) {
      addIssue(
        issues,
        "error",
        "COMPONENT_FILE_MISSING",
        `Component file does not exist: ${entry.componentFile}`,
        entry.routeId
      );
      continue;
    }

    if (!renderer.imports.has(entry.componentName)) {
      addIssue(
        issues,
        "error",
        "COMPONENT_IMPORT_MISSING",
        `SlideRenderer is missing import for component ${entry.componentName}.`,
        entry.routeId
      );
      continue;
    }

    const importedFrom = renderer.imports.get(entry.componentName);
    const relativeComponent = entry.componentFile
      .replace(/^components\/slides\//, "")
      .replace(/\.tsx$/, "");
    const relativeDir = normalizeSlash(path.posix.dirname(relativeComponent));
    const expectedImports = new Set([`./slides/${relativeComponent}`]);
    if (relativeDir !== ".") {
      expectedImports.add(`./slides/${relativeDir}`);
    }

    if (!expectedImports.has(importedFrom)) {
      addIssue(
        issues,
        "error",
        "COMPONENT_IMPORT_MISMATCH",
        `SlideRenderer import mismatch for ${entry.componentName}. Expected one of ${Array.from(expectedImports).join(", ")}, got '${importedFrom}'.`,
        entry.routeId
      );
    }

    if (!renderer.mapped.has(entry.componentName)) {
      addIssue(
        issues,
        "error",
        "COMPONENT_MAP_MISSING",
        `SLIDE_COMPONENTS map is missing ${entry.componentName}.`,
        entry.routeId
      );
    }
  }
}

async function validateStableIdsAndDeterminism(catalogRoute, issues) {
  for (const entry of catalogRoute) {
    const componentFileAbs = path.join(ROOT, entry.componentFile);
    let content = "";
    try {
      content = await fs.readFile(componentFileAbs, "utf8");
    } catch {
      continue;
    }

    const stableIds = Array.isArray(entry.stableIds) ? entry.stableIds : [];
    if (stableIds.length === 0) {
      addIssue(
        issues,
        "error",
        "STABLE_IDS_MISSING",
        "stableIds must contain at least one identifier.",
        entry.routeId
      );
    }

    for (const stableId of stableIds) {
      if (!content.includes(stableId)) {
        addIssue(
          issues,
          "error",
          "STABLE_ID_NOT_FOUND",
          `stableId '${stableId}' not found in ${entry.componentFile}.`,
          entry.routeId
        );
      }
    }

    const whitelist = new Set(Array.isArray(entry.visualOnlyAllow) ? entry.visualOnlyAllow : []);

    for (const api of NON_DETERMINISTIC_APIS) {
      const matches = content.match(api.pattern) || [];
      if (matches.length === 0) continue;

      const isWhitelisted = whitelist.has(api.token);
      if (!isWhitelisted) {
        addIssue(
          issues,
          "error",
          "NON_DETERMINISTIC_API",
          `${api.token} detected in ${entry.componentFile} without VISUAL_ONLY whitelist.`,
          entry.routeId
        );
        continue;
      }

      if (entry.determinism === "STRICT") {
        addIssue(
          issues,
          "warning",
          "STRICT_WITH_WHITELIST",
          `${api.token} is whitelisted in a STRICT slide; verify this is visual-only.`,
          entry.routeId
        );
      }
    }

    if (entry.classification === "CORE" && entry.interactionModel === "NONE") {
      addIssue(
        issues,
        "error",
        "CORE_ENGINE_CONTRACT",
        "CORE slide cannot declare interactionModel NONE.",
        entry.routeId
      );
    }

    if (entry.interactionModel === "NONE" && entry.replay !== "NONE") {
      addIssue(
        issues,
        "error",
        "ENGINE_CONTRACT_REPLAY_MISMATCH",
        "Slides with interactionModel NONE must set replay NONE.",
        entry.routeId
      );
    }
  }
}

async function validateLegacyCoverage(catalog, issues) {
  const mainRouteFiles = new Set((catalog.mainRoute ?? []).map((entry) => normalizeSlash(entry.componentFile)));
  const legacyFiles = new Set((catalog.legacy ?? []).map((entry) => normalizeSlash(entry.componentFile)));
  const declaredFiles = new Set([...mainRouteFiles, ...legacyFiles]);

  const allSlideFiles = (await listFilesRecursively(path.join(ROOT, "components", "slides")))
    .map((absPath) => relativeFromRoot(absPath))
    .filter((relPath) => /^components\/slides\/Slide[^/]+\.tsx$/i.test(relPath));

  for (const filePath of allSlideFiles) {
    if (declaredFiles.has(filePath)) continue;
    addIssue(
      issues,
      "error",
      "ORPHAN_SLIDE_COMPONENT",
      `Slide component is not referenced by mainRoute or legacy: ${filePath}`
    );
  }
}

function buildCheckResults(issues) {
  const hasCode = (severity, codes) =>
    issues.some((issue) => issue.severity === severity && codes.includes(issue.code));

  return [
    {
      id: "sequential_numbering",
      status: hasCode("error", ["INDEX_INVALID", "INDEX_GAP_OR_MISMATCH"]) ? "fail" : "pass",
    },
    {
      id: "route_id_uniqueness",
      status: hasCode("error", ["ROUTE_DUPLICATE", "ROUTE_MISMATCH"]) ? "fail" : "pass",
    },
    {
      id: "slide_id_alignment",
      status: hasCode("error", ["SLIDE_ID_MISMATCH", "SLIDE_ID_DUPLICATE"]) ? "fail" : "pass",
    },
    {
      id: "determinism_constraints",
      status: hasCode("error", ["NON_DETERMINISTIC_API"]) ? "fail" : "pass",
    },
    {
      id: "stable_ids_present",
      status: hasCode("error", ["STABLE_ID_NOT_FOUND", "STABLE_IDS_MISSING"]) ? "fail" : "pass",
    },
    {
      id: "component_mapping_integrity",
      status: hasCode(
        "error",
        [
          "COMPONENT_FILE_MISSING",
          "COMPONENT_IMPORT_MISSING",
          "COMPONENT_IMPORT_MISMATCH",
          "COMPONENT_MAP_MISSING",
        ]
      )
        ? "fail"
        : "pass",
    },
  ];
}

function createEngineMatrixMd(mainRoute) {
  const lines = [];
  lines.push("# Engine Matrix");
  lines.push("");
  lines.push("Canonical source: `docs/slides/SLIDES_CATALOG.json`.");
  lines.push("");
  lines.push("| Route | SlideId | Component | Classification | Interaction | Replay | Determinism |");
  lines.push("|---|---|---|---|---|---|---|");

  for (const entry of mainRoute) {
    lines.push(
      `| ${entry.routeId} | ${entry.slideId} | ${entry.componentName} | ${entry.classification} | ${entry.interactionModel} | ${entry.replay} | ${entry.determinism} |`
    );
  }

  lines.push("");
  return lines.join("\n");
}

function createReportMarkdown(report) {
  const lines = [];
  lines.push("# Slide Registry Report");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- mainRoute slides: ${report.summary.mainRouteCount}`);
  lines.push(`- errors: ${report.summary.errorCount}`);
  lines.push(`- warnings: ${report.summary.warningCount}`);
  lines.push(`- valid: ${report.summary.isValid ? "YES" : "NO"}`);
  lines.push("");
  lines.push("## Final Enumerated Route");
  lines.push("");

  for (const entry of report.mainRoute) {
    lines.push(
      `- ${entry.routeId} - ${entry.componentName} - ${entry.classification} - ${entry.determinism}`
    );
  }

  lines.push("");
  lines.push("## Checks");
  lines.push("");
  for (const check of report.checks) {
    lines.push(`- \`${check.id}\`: \`${check.status}\``);
  }

  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (report.issues.length === 0) {
    lines.push("- None");
  } else {
    for (const issue of report.issues) {
      const routePrefix = issue.routeId ? `[${issue.routeId}] ` : "";
      lines.push(`- \`${issue.code}\` ${routePrefix}${issue.message}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function printClassificationMatrix(mainRoute) {
  console.log("[verify:slides] engine classification matrix");
  for (const entry of mainRoute) {
    console.log(
      `  ${entry.routeId} | ${entry.componentName} | ${entry.classification} | ${entry.interactionModel} | ${entry.replay} | ${entry.determinism}`
    );
  }
}

function printFinalRoute(mainRoute) {
  console.log("[verify:slides] final route order");
  for (const entry of mainRoute) {
    console.log(
      `  ${entry.routeId} - ${entry.componentName} - ${entry.classification} - ${entry.determinism}`
    );
  }
}

async function main() {
  console.log("[verify:slides] loading catalog");
  const catalog = await readJson(CATALOG_PATH);

  const issues = [];
  const orderedMainRoute = validateEnumeration(catalog, issues);

  console.log("[verify:slides] validating component mapping");
  await validateComponentMapping(orderedMainRoute, issues);

  console.log("[verify:slides] validating stable ids and determinism");
  await validateStableIdsAndDeterminism(orderedMainRoute, issues);

  console.log("[verify:slides] validating orphan coverage");
  await validateLegacyCoverage(catalog, issues);

  const sortedIssues = [...issues].sort(sortByCodeThenRoute);
  const checks = buildCheckResults(sortedIssues);
  const errorCount = sortedIssues.filter((issue) => issue.severity === "error").length;
  const warningCount = sortedIssues.filter((issue) => issue.severity === "warning").length;

  const report = {
    schemaVersion: "slide-registry-report.v2",
    sourceCatalogVersion: catalog.schemaVersion ?? "unknown",
    summary: {
      mainRouteCount: orderedMainRoute.length,
      errorCount,
      warningCount,
      isValid: errorCount === 0,
    },
    checks,
    mainRoute: orderedMainRoute.map((entry) => ({
      index: entry.index,
      routeId: entry.routeId,
      slideId: entry.slideId,
      componentName: entry.componentName,
      componentFile: entry.componentFile,
      classification: entry.classification,
      interactionModel: entry.interactionModel,
      replay: entry.replay,
      determinism: entry.determinism,
      stableIds: entry.stableIds,
    })),
    legacy: Array.isArray(catalog.legacy) ? catalog.legacy : [],
    issues: sortedIssues,
  };

  console.log("[verify:slides] writing reports");
  await writeText(REPORT_JSON_OUT, JSON.stringify(report, null, 2));
  await writeText(REPORT_MD_OUT, createReportMarkdown(report));
  await writeText(ENGINE_MATRIX_OUT, createEngineMatrixMd(orderedMainRoute));

  printClassificationMatrix(orderedMainRoute);
  printFinalRoute(orderedMainRoute);

  if (errorCount > 0) {
    console.error(`[verify:slides] FAIL errors=${errorCount} warnings=${warningCount}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[verify:slides] PASS errors=0 warnings=${warningCount}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[verify:slides] FAIL ${message}`);
  process.exitCode = 1;
});
