
import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const forbiddenClientPatterns: Array<{ id: string; pattern: RegExp }> = [
  { id: "forbidden_provider_sdk", pattern: /@google\/genai/gi },
  { id: "legacy_route", pattern: /\/api\/gemini\b/gi },
  { id: "deprecated_guide_path", pattern: /wow\/guide(?:\/|['"])/gi },
  { id: "forbidden_vite_env", pattern: /\bVITE_(?:GEMINI|GENAI|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b/g },
  { id: "forbidden_import_meta", pattern: /import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI|GENAI|GOOGLE)/gi },
  { id: "forbidden_brand_literal", pattern: /["'`][^"'`\n\r]*gemini[^"'`\n\r]*["'`]/gi },
];

const allowedClientFiles = new Set<string>([
  "tests/e2e/gemini-boundary.e2e.spec.ts",
]);

type ScanIssue = {
  file: string;
  line: number;
  id: string;
  snippet: string;
};

function normalize(relPath: string): string {
  return relPath.replace(/\\/g, "/");
}

function isClientScope(relPath: string): boolean {
  const rel = normalize(relPath).toLowerCase();
  const name = path.basename(rel);
  return (
    rel.startsWith("components/") ||
    rel.startsWith("src/") ||
    rel.startsWith("public/") ||
    rel === "index.html" ||
    /^vite\.config\.(ts|js|mjs|cjs|mts|cts)$/.test(name)
  );
}

function isTextFile(relPath: string): boolean {
  const ext = path.extname(relPath).toLowerCase();
  return [
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
  ].includes(ext);
}

function walk(dir: string): string[] {
  const stack = [dir];
  const out: string[] = [];
  const excluded = new Set([".git", "node_modules", "dist", "build", "coverage", ".run", ".next", ".vite"]);

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = readdirSync(current);
    for (const entry of entries) {
      const full = path.join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (excluded.has(entry)) continue;
        stack.push(full);
        continue;
      }
      const rel = normalize(path.relative(repoRoot, full));
      if (!isTextFile(rel)) continue;
      out.push(rel);
    }
  }

  return out.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function collectClientIssues(): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const files = walk(repoRoot).filter((rel) => isClientScope(rel) && !allowedClientFiles.has(rel));

  for (const rel of files) {
    const content = readFileSync(path.join(repoRoot, rel), "utf8");
    const lines = content.split(/\r?\n/u);

    lines.forEach((line, index) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("#")) {
        return;
      }

      for (const rule of forbiddenClientPatterns) {
        if (rule.pattern.test(line)) {
          issues.push({
            file: rel,
            line: index + 1,
            id: rule.id,
            snippet: line.trim().slice(0, 220),
          });
        }
        rule.pattern.lastIndex = 0;
      }
    });
  }

  return issues;
}

test("client boundary: no forbidden SDK imports, route names, or branding leaks", async () => {
  const issues = collectClientIssues();
  const summary = issues
    .map((issue) => `${issue.id} ${issue.file}:${issue.line} :: ${issue.snippet}`)
    .join("\n");

  expect(
    issues,
    summary || "Expected zero client boundary issues."
  ).toEqual([]);
});

test("route rename consistency: /api/ai present and /api/gemini removed from runtime paths", async () => {
  const aiChat = readFileSync(path.join(repoRoot, "components", "AIChat.tsx"), "utf8");
  const server = readFileSync(path.join(repoRoot, "server", "index.ts"), "utf8");
  const verifyDemo = readFileSync(path.join(repoRoot, "scripts", "verify-demo.mjs"), "utf8");
  const verifyAi = readFileSync(path.join(repoRoot, "scripts", "verify-ai.mjs"), "utf8");
  const smoke = readFileSync(path.join(repoRoot, "scripts", "demo-smoke.mjs"), "utf8");

  expect(aiChat).toContain("/api/ai");
  expect(aiChat).not.toContain("/api/gemini");
  expect(server).toContain('const AI_ROUTE_PATH = "/api/ai"');
  expect(server).not.toContain('"/api/gemini"');
  expect(verifyDemo).toContain("/api/ai");
  expect(verifyAi).toContain("/api/ai");
  expect(smoke).toContain("/api/ai");
  expect(verifyDemo).not.toContain("/api/gemini");
  expect(verifyAi).not.toContain("/api/gemini");
  expect(smoke).not.toContain("/api/gemini");
});

test("audit strict semantics: fixture suite passes and enforces client-only strict failures", async () => {
  const result = spawnSync("node", ["scripts/gemini-audit-fixture.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
  }

  expect(result.status).toBe(0);
  expect(result.stdout).toContain("[gemini:audit:fixture] PASS");
});

