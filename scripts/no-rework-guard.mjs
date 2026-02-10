import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".vite",
  ".run",
]);

const BANNED_DUPLICATE_PATHS = [
  {
    relPath: "wow/tour/choreo/choreo.types.ts",
    ruleId: "DUP_CHOREO_TYPES_FILE",
    message: "Duplicate choreo contract file detected. Keep only wow/tour/choreo/types.ts.",
  },
  {
    relPath: "wow/tour/ui/DirectorOverlay.tsx",
    ruleId: "DUP_DIRECTOR_OVERLAY_FILE",
    message: "Duplicate DirectorOverlay implementation detected. Keep only wow/tour/director/DirectorOverlay.tsx.",
  },
  {
    relPath: "wow/guide/engine.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide engine file detected. Legacy wow/guide must stay as thin compatibility wrappers only.",
  },
  {
    relPath: "wow/guide/reducer.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide reducer detected. Legacy wow/guide must stay as thin compatibility wrappers only.",
  },
  {
    relPath: "wow/guide/script.types.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide types file detected. Canonical types live in wow/tour/guide/types.ts.",
  },
  {
    relPath: "wow/guide/selectors.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide selectors detected. Canonical selectors live in wow/tour/guide/selectors.ts.",
  },
  {
    relPath: "wow/guide/selectors.engine.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide selector engine detected. Canonical runtime is wow/tour/guide/*.",
  },
  {
    relPath: "wow/guide/script.sample.ts",
    ruleId: "LEGACY_GUIDE_RUNTIME_FILE",
    message: "Legacy guide sample script detected. Canonical scripts live in wow/tour/guide/scripts/*.",
  },
];

function parseArgs(argv) {
  const args = {
    repoRoot: process.cwd(),
    quiet: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo-root" || arg === "--repo") {
      args.repoRoot = path.resolve(argv[i + 1] || process.cwd());
      i += 1;
      continue;
    }
    if (arg === "--quiet") {
      args.quiet = true;
      continue;
    }
  }

  args.repoRoot = path.resolve(args.repoRoot);
  return args;
}

function normalize(relPath) {
  return relPath.replace(/\\/g, "/");
}

function isSourceFile(relPath) {
  return SOURCE_EXTENSIONS.has(path.extname(relPath).toLowerCase());
}

function walkSourceFiles(repoRoot) {
  const stack = [repoRoot];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry)) continue;
        stack.push(full);
        continue;
      }
      const rel = normalize(path.relative(repoRoot, full));
      if (!isSourceFile(rel)) continue;
      files.push({ full, rel });
    }
  }

  files.sort((a, b) => a.rel.localeCompare(b.rel, "en", { sensitivity: "base" }));
  return files;
}

function findLine(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function scanImports(files) {
  const findings = [];
  const importFromPattern = /^\s*(?:import|export)\s+(?:[^'"`\n\r]*?\s+from\s+)?['"`]([^'"`\n\r]+)['"`]/gm;
  const dynamicImportPattern = /\bimport\(\s*['"`]([^'"`\n\r]+)['"`]\s*\)/g;

  for (const file of files) {
    const content = readFileSync(file.full, "utf8");
    const matches = [];

    let match = importFromPattern.exec(content);
    while (match) {
      matches.push({ modulePath: match[1], index: match.index });
      match = importFromPattern.exec(content);
    }

    match = dynamicImportPattern.exec(content);
    while (match) {
      matches.push({ modulePath: match[1], index: match.index });
      match = dynamicImportPattern.exec(content);
    }

    for (const item of matches) {
      const rawPath = item.modulePath;
      const line = findLine(content, item.index);

      if (/wow\/guide(?:\/|$)/.test(rawPath) && !file.rel.startsWith("wow/guide/")) {
        findings.push({
          ruleId: "DEPRECATED_WOW_GUIDE_IMPORT",
          file: file.rel,
          line,
          message: "Importing wow/guide from non-compatibility code is forbidden. Use wow/tour/guide.",
          detail: rawPath,
        });
      }

      if (/wow\/tour\/choreo\/choreo\.types(?:\.ts)?$/.test(rawPath)) {
        findings.push({
          ruleId: "DEPRECATED_CHOREO_IMPORT",
          file: file.rel,
          line,
          message: "Import from wow/tour/choreo/choreo.types is forbidden. Use wow/tour/choreo/types.",
          detail: rawPath,
        });
      }

      if (/wow\/tour\/ui\/DirectorOverlay(?:\.tsx?)?$/.test(rawPath)) {
        findings.push({
          ruleId: "DEPRECATED_DIRECTOR_IMPORT",
          file: file.rel,
          line,
          message: "Import from wow/tour/ui/DirectorOverlay is forbidden. Use wow/tour/director/DirectorOverlay.",
          detail: rawPath,
        });
      }
    }
  }

  return findings;
}

function scanBannedPaths(repoRoot) {
  const findings = [];

  for (const rule of BANNED_DUPLICATE_PATHS) {
    const full = path.join(repoRoot, rule.relPath);
    if (!existsSync(full)) continue;
    findings.push({
      ruleId: rule.ruleId,
      file: normalize(rule.relPath),
      line: 1,
      message: rule.message,
      detail: "file exists",
    });
  }

  return findings;
}

function scanPlaywrightConfig(repoRoot) {
  const findings = [];
  const rel = "playwright.config.ts";
  const full = path.join(repoRoot, rel);
  if (!existsSync(full)) {
    findings.push({
      ruleId: "PLAYWRIGHT_CONFIG_MISSING",
      file: rel,
      line: 1,
      message: "playwright.config.ts is required.",
      detail: "missing file",
    });
    return findings;
  }

  const content = readFileSync(full, "utf8");
  if (!/testDir\s*:\s*['"]\.\/tests\/e2e['"]/.test(content)) {
    findings.push({
      ruleId: "PLAYWRIGHT_SCOPE_INVALID",
      file: rel,
      line: 1,
      message: "Playwright testDir must be './tests/e2e'.",
      detail: "testDir mismatch",
    });
  }

  if (!/testMatch\s*:\s*\[[^\]]*e2e\.spec\.ts[^\]]*\]/s.test(content)) {
    findings.push({
      ruleId: "PLAYWRIGHT_MATCH_INVALID",
      file: rel,
      line: 1,
      message: "Playwright testMatch must target '*.e2e.spec.ts'.",
      detail: "testMatch mismatch",
    });
  }

  return findings;
}

function printFindings(findings) {
  if (findings.length === 0) {
    console.log("[no-rework] PASS");
    return;
  }

  console.error(`[no-rework] FAIL findings=${findings.length}`);
  for (const finding of findings) {
    console.error(
      ` - ${finding.ruleId} ${finding.file}:${finding.line} :: ${finding.message} (${finding.detail})`,
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = walkSourceFiles(args.repoRoot);
  const findings = [
    ...scanBannedPaths(args.repoRoot),
    ...scanImports(files),
    ...scanPlaywrightConfig(args.repoRoot),
  ];

  findings.sort((a, b) => {
    if (a.ruleId !== b.ruleId) return a.ruleId.localeCompare(b.ruleId, "en", { sensitivity: "base" });
    if (a.file !== b.file) return a.file.localeCompare(b.file, "en", { sensitivity: "base" });
    return a.line - b.line;
  });

  if (!args.quiet) printFindings(findings);
  process.exit(findings.length === 0 ? 0 : 1);
}

main();
