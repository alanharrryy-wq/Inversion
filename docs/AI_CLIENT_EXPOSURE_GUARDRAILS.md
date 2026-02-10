# AI Client Exposure Guardrails

## Intent

This repository enforces a strict boundary:

- Client code can use an **AI assistant UI**.
- Client code cannot leak provider branding, provider SDK imports, or provider secrets.
- Provider SDK usage is server-only.
- Offline behavior is deterministic by default.
- Any optional external AI behavior must be explicitly enabled by server feature flags.

The controls in this document are designed for Windows-first local development and CI usage.

## Scope

The boundary and audit controls classify files by scope:

- `CLIENT`: `components/**`, `src/**`, `index.html`, `vite.config.*`, `public/**`
- `SERVER`: `server/**`
- `DOCS`: `*.md`, `README`
- `TOOLING`: `scripts/**`, `*.mjs`
- `OTHER`: all remaining scanned files

Strict failures are based only on `CLIENT` scope findings marked as `CLIENT_P0`.

## Design Targets

1. No provider SDK import in client source.
2. No legacy provider route path in client source.
3. No provider API key env variable names in client source.
4. No provider branding literals in client-facing string paths.
5. No `vite.define` secret-like injection tied to provider tokens.
6. Server-only provider integration remains possible.
7. Server defaults to deterministic, offline-safe behavior unless feature flags are explicitly enabled.

## Runtime Boundary

### Client

- Calls `POST /api/ai`
- Never imports `@google/genai`
- Never references provider secret variables through `import.meta.env`
- Never references `/api/gemini`

### Server

- Route: `POST /api/ai`
- Optional provider SDK usage: `@google/genai`
- Provider key lookup:
  - Primary: `AI_BACKEND_API_KEY`
  - Compatibility fallback: `GEMINI_API_KEY`
- Feature flag for real external provider calls:
  - `ENABLE_AI_BACKEND=true`
- Deterministic fallback mode:
  - Returns stable, deterministic JSON when backend disabled or unconfigured

## Environment Behavior

### Defaults (safe)

When environment variables are absent:

- `ENABLE_AI_BACKEND=false`
- `DEMO_TEST_MODE=false`
- Server still responds from `POST /api/ai` with deterministic stub text
- No external provider call is attempted

### Demo deterministic mode

- Set `DEMO_TEST_MODE=true`
- Server forces deterministic responses
- Useful for demos, smoke checks, and reproducible tests

### Real provider mode

To enable real upstream model calls:

1. `ENABLE_AI_BACKEND=true`
2. `AI_BACKEND_API_KEY=<provider key>`
3. `DEMO_TEST_MODE=false` (or unset)

If key/flag are invalid or missing, server remains stable and deterministic.

## Scripts and Gates

### 1) Client boundary guard

Script:

- `scripts/client-boundary-guard.mjs`

Purpose:

- Performs static scanning of `CLIENT` scope only.
- Checks for forbidden provider exposure patterns.
- Writes machine-readable report to `.run/client-boundary-guard.json`.
- In strict mode exits non-zero to fail build/CI.

Commands:

- `npm run client:guard`
- `npm run client:guard:strict`

`build` gate:

- `npm run build` runs `client:guard:strict` before `vite build`.

### 2) Exposure audit (human report)

Script:

- `scripts/gemini-audit.ps1`

Purpose:

- Produces `GEMINI_EXPOSURE_AUDIT.md`.
- Classifies findings by `CLIENT`, `SERVER`, `DOCS`, `TOOLING`, `OTHER`.
- Marks only true client exposures as `CLIENT_P0`.
- Supports strict mode:
  - Exit `2` only when `CLIENT_P0` findings exist.
  - Otherwise exit `0`.

Commands:

- `npm run gemini:audit`
- `npm run gemini:audit:strict`

### 3) Strict behavior fixture suite

Script:

- `scripts/gemini-audit-fixture.mjs`

Purpose:

- Creates synthetic mini-repos in temp folders.
- Injects controlled exposures.
- Verifies strict semantics:
  - server-only usage must pass strict mode
  - deliberate client exposure must fail strict mode
  - docs/tooling mentions should not fail strict mode

Command:

- `npm run gemini:audit:test`

## Pattern Rules

### Client `CLIENT_P0` rules

1. `CLIENT_IMPORT_GOOGLE_GENAI`
2. `CLIENT_LEGACY_ROUTE`
3. `CLIENT_VITE_SECRET_NAME`
4. `CLIENT_IMPORT_META_ENV`
5. `CLIENT_BRANDING_LITERAL`
6. `CLIENT_VITE_DEFINE_INJECTION`

These are strict-mode blocking rules when found in client scope.

### Informational rules (non-blocking)

1. `SERVER_PROVIDER_IMPORT`
2. `SERVER_PROVIDER_KEY_NAME`
3. `DOC_OR_TOOLING_MENTION`

These are useful migration/context signals but do not block strict mode.

## Why strict mode only blocks client scope

The P0 requirement is client exposure risk. Some strings are valid in non-client scopes:

- Server-only SDK imports
- Server-only provider key env names
- Tooling script names and migration references
- Historical docs

Blocking these by default causes false positives and unstable pipelines.

## Determinism Guarantees

The endpoint and audits are deterministic under constant inputs:

- Server deterministic fallback text format is fixed.
- Audit output ordering is deterministic:
  - sorted file enumeration
  - sorted findings
  - stable report section ordering
- Fixture tests use deterministic case definitions.

## Windows-first execution

NPM commands use PowerShell with policy bypass explicitly:

- `cmd.exe /c powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\gemini-audit.ps1`

This avoids requiring local policy changes and works in standard Windows terminals.

## Typical Validation Flow

Use the following sequence from repo root:

1. `npm run typecheck`
2. `npm run build`
3. `npm run gemini:audit`
4. `npm run gemini:audit:strict`
5. `npm run gemini:audit:test`

Optional deeper checks:

1. `npm run security:check`
2. `npm run demo:smoke`
3. `npm run test`

## Incident Triage

When strict audit fails:

1. Open `GEMINI_EXPOSURE_AUDIT.md`
2. Filter for `Severity = CLIENT_P0`
3. Address findings by rule order:
   - imports first
   - routes second
   - env leaks third
   - branding literals fourth
   - bundler define injection fifth

### Common remediations

#### `CLIENT_IMPORT_GOOGLE_GENAI`

- Remove import/reference from client files.
- Move SDK usage to `server/**` modules only.

#### `CLIENT_LEGACY_ROUTE`

- Replace `/api/gemini` with `/api/ai`.
- Update UI fetch calls, smoke scripts, and route consistency tests.

#### `CLIENT_VITE_SECRET_NAME` or `CLIENT_IMPORT_META_ENV`

- Remove `VITE_GEMINI*` / `VITE_GENAI*` / `VITE_GOOGLE*` usage.
- Keep provider keys only in server `process.env`.

#### `CLIENT_BRANDING_LITERAL`

- Replace visible literal with generic wording:
  - "AI assistant"
  - "AI backend (optional)"
  - "AI provider (server-only)"

#### `CLIENT_VITE_DEFINE_INJECTION`

- Remove provider tokens from `vite.config.*` `define` blocks.
- Keep build-time constants generic and non-secret.

## Route Contract

### Request

`POST /api/ai`

Body:

```json
{
  "mode": "chat",
  "message": "your text"
}
```

Mode values:

- `chat`
- `fast`
- `think`
- `search`
- `voice` (normalized to chat on server transport)

### Response (deterministic fallback)

```json
{
  "text": "[AI_BACKEND:backend_disabled] mode=chat input=\"example\"",
  "sources": []
}
```

### Response (configured upstream)

```json
{
  "text": "model output",
  "sources": []
}
```

## Security Notes

- Client bundle must never include provider SDK package references.
- Client bundle must never include provider keys in `import.meta.env`.
- Server logs only key presence/length, never key values.
- Audit scripts are static checks and must be paired with runtime smoke checks for full confidence.

## Change Management Checklist

When touching AI-related files:

1. Keep client endpoint `/api/ai`.
2. Keep `@google/genai` imports confined to `server/**`.
3. Keep server AI optional behind `ENABLE_AI_BACKEND`.
4. Preserve deterministic fallback behavior.
5. Run strict audit and fixture test suite before merge.

## Examples

### Good client fetch

```ts
await fetch("/api/ai", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ mode: "chat", message: "hello" }),
});
```

### Bad client fetch

```ts
await fetch("/api/gemini", { method: "POST" });
```

### Good server provider import

```ts
import { GoogleGenAI } from "@google/genai";
```

### Bad client provider import

```ts
import { GoogleGenAI } from "@google/genai";
```

## Residual Risks

1. Static scan cannot prove runtime dead-code elimination in all toolchains.
2. New client entrypoints outside configured scope may require scope-map updates.
3. Large generated files can hide literals if excluded from scan patterns.

Mitigation:

1. Keep scope map and extension list updated.
2. Run both static guard and runtime smoke.
3. Review release bundle contents periodically for unexpected strings.
