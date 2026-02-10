import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const issues = [];

const excludedDirs = new Set([".git", "node_modules", "dist", "coverage"]);

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!excludedDirs.has(entry)) files.push(...walk(full));
      continue;
    }
    files.push({ full, rel });
  }
  return files;
}

function findPattern(content, regex) {
  return regex.test(content);
}

function assert(condition, message) {
  if (!condition) issues.push(message);
}

const allFiles = walk(repoRoot);
const textFiles = allFiles.filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html)$/i.test(f.rel));

for (const file of textFiles) {
  const content = readFileSync(file.full, "utf8");

  const isClientFile =
    file.rel.startsWith("components/") ||
    file.rel.startsWith("src/") ||
    file.rel.startsWith("public/") ||
    file.rel === "App.tsx" ||
    file.rel === "index.tsx" ||
    file.rel === "index.html" ||
    /^vite\.config\.(ts|js|mjs|cjs|mts|cts)$/i.test(path.basename(file.rel));
  if (isClientFile) {
    if (findPattern(content, /process\.env\.API_KEY/g)) {
      issues.push(`${file.rel}: forbidden process.env.API_KEY reference`);
    }
    if (findPattern(content, /process\.env\.GEMINI_API_KEY/g)) {
      issues.push(`${file.rel}: forbidden process.env.GEMINI_API_KEY reference`);
    }
    if (findPattern(content, /@google\/genai/g)) {
      issues.push(`${file.rel}: @google/genai must remain server-only`);
    }
    if (findPattern(content, /\/api\/gemini\b/g)) {
      issues.push(`${file.rel}: legacy /api/gemini route should not appear in client scope`);
    }
    if (findPattern(content, /\bVITE_(?:GEMINI|GENAI|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b/g)) {
      issues.push(`${file.rel}: VITE_* Gemini/GenAI/Google env names are forbidden`);
    }
    if (findPattern(content, /import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI|GENAI|GOOGLE)/gi)) {
      issues.push(`${file.rel}: import.meta.env Gemini/GenAI/Google references are forbidden`);
    }
  }

  if (file.rel !== "README.md" && (file.rel.startsWith("components/") || file.rel.startsWith("App.tsx") || file.rel.startsWith("index.tsx"))) {
    if (findPattern(content, /GEMINI_API_KEY/g)) {
      issues.push(`${file.rel}: GEMINI_API_KEY should not appear in client source`);
    }
  }

  if (file.rel === "vite.config.ts" && findPattern(content, /define\s*:\s*\{/g)) {
    issues.push("vite.config.ts: define block found; verify no env secret injection");
  }

  if (!file.rel.startsWith("scripts/") && findPattern(content, /dangerouslySetInnerHTML/g)) {
    issues.push(`${file.rel}: dangerouslySetInnerHTML is forbidden`);
  }

  if (findPattern(content, /AIza[0-9A-Za-z_\-]{20,}/g)) {
    issues.push(`${file.rel}: possible Google API key pattern found`);
  }
  if (findPattern(content, /\bsk-[0-9A-Za-z]{16,}\b/g)) {
    issues.push(`${file.rel}: possible sk-* secret pattern found`);
  }

  const tokenLike = content.match(/[A-Za-z0-9+/=_-]{96,}/g) || [];
  if (tokenLike.length > 0 && !/package-lock\.json$/.test(file.rel)) {
    const suspicious = tokenLike.filter((t) => !t.includes("====") && !t.includes("http") && !/^[A-F0-9]{96,}$/i.test(t));
    if (suspicious.length > 0) {
      issues.push(`${file.rel}: found long token-like strings (possible secret leak)`);
    }
  }
}

const aiChatPath = path.join(repoRoot, "components", "AIChat.tsx");
const aiChat = readFileSync(aiChatPath, "utf8");
assert(/function\s+parseEnvFlag\(/.test(aiChat), "AIChat.tsx: missing parseEnvFlag helper");
assert(/VITE_ENABLE_VOICE/.test(aiChat), "AIChat.tsx: missing VITE_ENABLE_VOICE handling");
assert(/return\s+false;/.test(aiChat), "AIChat.tsx: voice flag default-disabled behavior missing");
assert(/\/api\/ai/.test(aiChat), "AIChat.tsx: expected /api/ai endpoint usage");
assert(!/\/api\/gemini/.test(aiChat), "AIChat.tsx: legacy /api/gemini reference detected");

if (issues.length > 0) {
  console.error("\n[security:check] FAIL");
  for (const issue of issues) {
    console.error(` - ${issue}`);
  }
  process.exit(1);
}

console.log("[security:check] PASS");
