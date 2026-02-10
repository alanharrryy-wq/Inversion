import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_REPORT_PATH = path.join(".run", "client-boundary-guard.json");
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
]);
const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".next",
  ".vite",
  ".run",
]);

function parseArgs(argv) {
  const parsed = {
    strict: false,
    repoRoot: process.cwd(),
    reportPath: DEFAULT_REPORT_PATH,
    quiet: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--strict") {
      parsed.strict = true;
      continue;
    }
    if (current === "--quiet") {
      parsed.quiet = true;
      continue;
    }
    if (current === "--repo" || current === "--repo-root") {
      parsed.repoRoot = path.resolve(argv[i + 1] || process.cwd());
      i += 1;
      continue;
    }
    if (current === "--report") {
      parsed.reportPath = argv[i + 1] || DEFAULT_REPORT_PATH;
      i += 1;
      continue;
    }
  }

  parsed.repoRoot = path.resolve(parsed.repoRoot);
  parsed.reportPath = path.resolve(parsed.repoRoot, parsed.reportPath);
  return parsed;
}

function normalizeSlashes(input) {
  return input.replace(/\\/g, "/");
}

function classifyScope(relPath) {
  const rel = normalizeSlashes(relPath);
  const lower = rel.toLowerCase();

  if (
    lower.startsWith("components/") ||
    lower.startsWith("src/") ||
    lower.startsWith("public/") ||
    lower === "index.html" ||
    /^vite\.config\.(ts|js|mjs|cjs|mts|cts)$/.test(path.basename(lower))
  ) {
    return "CLIENT";
  }

  if (lower.startsWith("server/")) return "SERVER";
  if (lower.startsWith("scripts/") || lower.endsWith(".mjs")) return "TOOLING";
  if (lower === "readme.md" || lower.endsWith(".md")) return "DOCS";
  return "OTHER";
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filePath).toLowerCase();
  if (base.startsWith(".env")) return true;
  return false;
}

function walkFiles(repoRoot) {
  const stack = [repoRoot];
  const files = [];

  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry)) continue;
        stack.push(full);
        continue;
      }

      if (!isTextFile(full)) continue;
      const rel = path.relative(repoRoot, full);
      files.push({ full, rel, scope: classifyScope(rel) });
    }
  }

  files.sort((a, b) => normalizeSlashes(a.rel).localeCompare(normalizeSlashes(b.rel), "en", { sensitivity: "base" }));
  return files;
}

function findLineNumber(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function getLineAt(content, lineNumber) {
  const lines = content.split(/\r?\n/u);
  return lines[lineNumber - 1] || "";
}

function isCommentOnly(lineText) {
  const line = lineText.trimStart();
  return line.startsWith("//") || line.startsWith("/*") || line.startsWith("*") || line.startsWith("#");
}

function toFinding(file, line, ruleId, detail, snippet) {
  return {
    scope: file.scope,
    file: normalizeSlashes(file.rel),
    line,
    ruleId,
    detail,
    snippet: snippet.trim().slice(0, 240),
    level: "CLIENT_P0",
  };
}

function scanClientFile(file, content) {
  const findings = [];
  const lowerRel = normalizeSlashes(file.rel).toLowerCase();

  const addRegexFindings = (ruleId, detail, regex, opts = {}) => {
    const globalRegex = new RegExp(regex.source, `${regex.flags.includes("g") ? regex.flags : `${regex.flags}g`}`);
    let match = globalRegex.exec(content);
    while (match) {
      const line = findLineNumber(content, match.index);
      const snippet = getLineAt(content, line);
      const skipComments = opts.skipComments ?? true;
      if (!(skipComments && isCommentOnly(snippet))) {
        findings.push(toFinding(file, line, ruleId, detail, snippet));
      }
      match = globalRegex.exec(content);
    }
  };

  addRegexFindings(
    "CLIENT_IMPORT_GOOGLE_GENAI",
    "Client code cannot import or reference @google/genai.",
    /@google\/genai/gi
  );
  addRegexFindings(
    "CLIENT_LEGACY_ROUTE",
    "Legacy /api/gemini route is forbidden in client scope.",
    /\/api\/gemini\b/gi
  );
  addRegexFindings(
    "CLIENT_VITE_GEMINI_ENV",
    "Gemini/GenAI VITE_* env keys are forbidden in client scope.",
    /\bVITE_(?:GEMINI|GENAI|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b/g
  );
  addRegexFindings(
    "CLIENT_IMPORT_META_SECRET",
    "import.meta.env references for Gemini/GenAI/Google AI are forbidden.",
    /import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI|GENAI|GOOGLE)/gi
  );
  addRegexFindings(
    "CLIENT_GEMINI_BRANDING",
    "Gemini branding in client-facing literals is forbidden.",
    /["'`][^"'`\n\r]*gemini[^"'`\n\r]*["'`]/gi,
    { skipComments: true }
  );

  if (/^vite\.config\./.test(path.basename(lowerRel))) {
    const defineBlock = content.match(/define\s*:\s*\{[\s\S]*?\}/gi);
    if (defineBlock && defineBlock.length > 0) {
      for (const block of defineBlock) {
        if (/(gemini|genai|google)/i.test(block)) {
          const idx = content.indexOf(block);
          const line = findLineNumber(content, idx);
          findings.push(
            toFinding(
              file,
              line,
              "CLIENT_DEFINE_SECRET_INJECTION",
              "Vite define() block injects Gemini/GenAI/Google token(s) into client build.",
              getLineAt(content, line)
            )
          );
        }
      }
    }
  }

  return findings;
}

function scanRepo(files) {
  const findings = [];

  for (const file of files) {
    if (file.scope !== "CLIENT") continue;
    const content = readFileSync(file.full, "utf8");
    findings.push(...scanClientFile(file, content));
  }

  findings.sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file, "en", { sensitivity: "base" });
    if (a.line !== b.line) return a.line - b.line;
    return a.ruleId.localeCompare(b.ruleId, "en", { sensitivity: "base" });
  });
  return findings;
}

function printFindings(findings) {
  if (findings.length === 0) {
    console.log("[client-boundary] PASS no client exposure findings");
    return;
  }

  console.error(`[client-boundary] FAIL found ${findings.length} client exposure finding(s)`);
  for (const item of findings) {
    console.error(
      ` - ${item.ruleId} ${item.file}:${item.line} :: ${item.detail}\n   > ${item.snippet}`
    );
  }
}

function writeReport(reportPath, payload) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = walkFiles(args.repoRoot);
  const findings = scanRepo(files);
  const payload = {
    generatedAt: new Date().toISOString(),
    repoRoot: args.repoRoot,
    strict: args.strict,
    fileCount: files.length,
    clientFileCount: files.filter((item) => item.scope === "CLIENT").length,
    findings,
    findingCount: findings.length,
  };

  writeReport(args.reportPath, payload);
  if (!args.quiet) {
    printFindings(findings);
    console.log(`[client-boundary] report=${args.reportPath}`);
  }

  if (args.strict && findings.length > 0) {
    process.exit(1);
  }
}

main();
