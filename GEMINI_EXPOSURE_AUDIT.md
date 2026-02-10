# Gemini Exposure Audit

- Timestamp: 2026-02-09 23:29:09
- RepoRoot: `F:\OneDrive\Hitech\3.Proyectos\CHAT GPT AI Estudio\repos\Inversion`
- Strict: **ON**
- IncludeNodeModules: **OFF**

## Scope Classification

- CLIENT: `components/**`, `src/**`, `index.html`, `vite.config.*`, `public/**`
- SERVER: `server/**`
- DOCS: `*.md`, `README`
- TOOLING: `scripts/**`, `*.mjs`
- OTHER: all remaining scanned files

## Executive Summary

| Metric | Count |
|---|---:|
| CLIENT_P0 (strict gate) | 0 |
| INFO (server/docs/tooling/context) | 58 |
| Total findings | 58 |

### Findings by Scope

| Scope | Count |
|---|---:|
| DOCS | 19 |
| SERVER | 5 |
| TOOLING | 34 |

### Findings by Rule

| RuleId | Count |
|---|---:|
| DOC_OR_TOOLING_MENTION | 53 |
| SERVER_PROVIDER_IMPORT | 3 |
| SERVER_PROVIDER_KEY_NAME | 2 |

## Rules

| RuleId | Applies To | CLIENT_P0 Eligible | Meaning |
|---|---|---|---|
| SERVER_PROVIDER_KEY_NAME | SERVER | No | Server-side provider key variable usage. |
| SERVER_PROVIDER_IMPORT | SERVER | No | Server import/reference to provider SDK. |
| CLIENT_VITE_DEFINE_INJECTION | CLIENT | Yes | Vite define block references Gemini/GenAI/Google (client-bundle injection risk). |
| DOC_OR_TOOLING_MENTION | DOCS, TOOLING | No | Docs/tooling mention for migration traceability. |
| CLIENT_BRANDING_LITERAL | CLIENT | Yes | Gemini branding appears in client string literal. |
| CLIENT_LEGACY_ROUTE | CLIENT | Yes | Legacy /api/gemini route in client scope. |
| CLIENT_IMPORT_GOOGLE_GENAI | CLIENT | Yes | Client references @google/genai (import, require, or importmap). |
| CLIENT_IMPORT_META_ENV | CLIENT | Yes | Gemini/GenAI/Google env read via import.meta.env in client scope. |
| CLIENT_VITE_SECRET_NAME | CLIENT | Yes | Gemini/GenAI/Google VITE env variable in client scope. |

## Findings

| Severity | RuleId | Scope | File:Line | Match | Snippet |
|---|---|---|---|---|---|
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:42` | `@google/genai` | - Never imports `@google/genai` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:44` | `/api/gemini` | - Never references `/api/gemini` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:49` | `@google/genai` | - Optional provider SDK usage: `@google/genai` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:113` | `gemini` | - `scripts/gemini-audit.ps1` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:126` | `gemini` | - `npm run gemini:audit` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:127` | `gemini` | - `npm run gemini:audit:strict` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:133` | `gemini` | - `scripts/gemini-audit-fixture.mjs` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:146` | `gemini` | - `npm run gemini:audit:test` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:195` | `gemini` | - `cmd.exe /c powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\gemini-audit.ps1` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:205` | `gemini` | 3. `npm run gemini:audit` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:206` | `gemini` | 4. `npm run gemini:audit:strict` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:207` | `gemini` | 5. `npm run gemini:audit:test` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:237` | `/api/gemini` | - Replace `/api/gemini` with `/api/ai`. |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:310` | `@google/genai` | 2. Keep `@google/genai` imports confined to `server/**`. |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:330` | `/api/gemini` | await fetch("/api/gemini", { method: "POST" }); |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:336` | `@google/genai` | import { GoogleGenAI } from "@google/genai"; |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `docs\AI_CLIENT_EXPOSURE_GUARDRAILS.md:342` | `@google/genai` | import { GoogleGenAI } from "@google/genai"; |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `README.md:64` | `gemini` | - `npm run gemini:audit` writes `GEMINI_EXPOSURE_AUDIT.md` and exits `0` |
| INFO | DOC_OR_TOOLING_MENTION | DOCS | `README.md:65` | `gemini` | - `npm run gemini:audit:strict` exits `2` only on true client P0 exposure |
| INFO | SERVER_PROVIDER_IMPORT | SERVER | `server\index.ts:3` | `@google/genai` | import { GoogleGenAI } from "@google/genai"; |
| INFO | SERVER_PROVIDER_IMPORT | SERVER | `server\index.ts:3` | `GoogleGenAI` | import { GoogleGenAI } from "@google/genai"; |
| INFO | SERVER_PROVIDER_KEY_NAME | SERVER | `server\index.ts:45` | `GEMINI_API_KEY` | const PROVIDER_API_KEY = process.env.AI_BACKEND_API_KEY \|\| process.env.GEMINI_API_KEY; |
| INFO | SERVER_PROVIDER_KEY_NAME | SERVER | `server\index.ts:45` | `AI_BACKEND_API_KEY` | const PROVIDER_API_KEY = process.env.AI_BACKEND_API_KEY \|\| process.env.GEMINI_API_KEY; |
| INFO | SERVER_PROVIDER_IMPORT | SERVER | `server\index.ts:155` | `GoogleGenAI` | const ai = AI_CONFIGURED ? new GoogleGenAI({ apiKey: PROVIDER_API_KEY! }) : null; |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:184` | `@google/genai` | "Client code cannot import or reference @google/genai.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:189` | `/api/gemini` | "Legacy /api/gemini route is forbidden in client scope.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:190` | `gemini` | /\/api\/gemini\b/gi |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:194` | `Gemini` | "Gemini/GenAI VITE_* env keys are forbidden in client scope.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:195` | `GEMINI` | /\bVITE_(?:GEMINI\|GENAI\|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b/g |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:199` | `Gemini` | "import.meta.env references for Gemini/GenAI/Google AI are forbidden.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:200` | `GEMINI` | /import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI\|GENAI\|GOOGLE)/gi |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:204` | `Gemini` | "Gemini branding in client-facing literals is forbidden.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:205` | `gemini` | /["'`][^"'`\n\r]*gemini[^"'`\n\r]*["'`]/gi, |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:213` | `gemini` | if (/(gemini\|genai\|google)/i.test(block)) { |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\client-boundary-guard.mjs:221` | `Gemini` | "Vite define() block injects Gemini/GenAI/Google token(s) into client build.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:8` | `gemini` | const auditScript = path.join(repoRoot, "scripts", "gemini-audit.ps1"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:82` | `@google/genai` | 'import { GoogleGenAI } from "@google/genai";', |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:120` | `gemini` | const tmpBase = mkdtempSync(path.join(os.tmpdir(), "inversion-gemini-audit-")); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:139` | `gemini` | console.log(`[gemini:audit:fixture] case=${name} strict_exit=${strictResult.status} expected=${expectedStrictExit}`); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:141` | `gemini` | console.error("[gemini:audit:fixture] strict stdout:"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:143` | `gemini` | console.error("[gemini:audit:fixture] strict stderr:"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:149` | `gemini` | console.error("[gemini:audit:fixture] non-strict stdout:"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:151` | `gemini` | console.error("[gemini:audit:fixture] non-strict stderr:"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:205` | `@google/genai` | 'import { GoogleGenAI } from "@google/genai";', |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:224` | `/api/gemini` | "export const post = () => fetch('/api/gemini', { method: 'POST' });", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:247` | `@google/genai` | '    "imports": { "@google/genai": "https://example.invalid/genai.js" }', |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:272` | `/api/gemini` | "Historical note: legacy endpoint `/api/gemini` existed in older revisions.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:273` | `@google/genai` | "Historical note: provider SDK mention `@google/genai` for server migration logs.", |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\gemini-audit-fixture.mjs:287` | `gemini` | console.log("[gemini:audit:fixture] PASS"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:55` | `@google/genai` | issues.push(`${file.rel}: @google/genai must remain server-only`); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:57` | `gemini` | if (findPattern(content, /\/api\/gemini\b/g)) { |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:58` | `/api/gemini` | issues.push(`${file.rel}: legacy /api/gemini route should not appear in client scope`); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:60` | `GEMINI` | if (findPattern(content, /\bVITE_(?:GEMINI\|GENAI\|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b/g)) { |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:61` | `Gemini` | issues.push(`${file.rel}: VITE_* Gemini/GenAI/Google env names are forbidden`); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:63` | `GEMINI` | if (findPattern(content, /import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI\|GENAI\|GOOGLE)/gi)) { |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:64` | `Gemini` | issues.push(`${file.rel}: import.meta.env Gemini/GenAI/Google references are forbidden`); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:104` | `gemini` | assert(!/\/api\/gemini/.test(aiChat), "AIChat.tsx: legacy /api/gemini reference detected"); |
| INFO | DOC_OR_TOOLING_MENTION | TOOLING | `scripts\security-check.mjs:104` | `/api/gemini` | assert(!/\/api\/gemini/.test(aiChat), "AIChat.tsx: legacy /api/gemini reference detected"); |

## Strict Mode Semantics

- Default mode: always exits `0` after writing report.
- `-Strict`: exits `2` only when one or more `CLIENT_P0` findings exist.
- `SERVER`, `DOCS`, and `TOOLING` findings never trigger strict failure.

