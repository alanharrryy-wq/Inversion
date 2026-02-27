# REPO_MAP

## Scope

- Target repo: `F:/OneDrive/Hitech/3.Proyectos/CHAT GPT AI Estudio/repos/Inversion`
- Inventory source: `docs/_generated/FILE_INDEX.json`
- Heavy directories excluded from inventory:
  - `.git`
  - `.run`
  - `dist`
  - `node_modules`
  - `screenshots`
  - `test-results`
  - `tmp_rain`
  - `INVERSION_AUDIT_*`
  - `INVERSION_SUPER_AUDIT_*`
  - `INVERSION_TOTAL_CODEX_DUMP__CHUNKED_*`

## Git Snapshot

- Branch: `main`
- HEAD: `2e0ceff6d332c1a1eeb3a358f8fa3239b4de7495`
- Dirty worktree: `true`

## Inventory Summary

- Filtered files: `498`
- Top-level distribution:
  - `components`: `286`
  - `wow`: `70`
  - `.` (repo root files): `54`
  - `docs`: `24`
  - `scripts`: `22`
  - `tests`: `20`
  - `runtime`: `18`
  - `.vscode`: `2`
  - `config`: `1`
  - `server`: `1`

## Runtime Entrypoints

### 1) Browser mount

- `index.tsx` mounts `<App />` under `CrashOverlay`.

### 2) App shell and providers

- `App.tsx` is the main orchestrator:
  - slide index normalization (`0..19`)
  - URL parsing (`/slides/:id`, hash, query)
  - URL canonicalization (`/slides/NN` via `history.replaceState`)
  - provider stack:
    - `BootRuntimeProvider`
    - `Slide00ViewVisibilityProvider`
    - `DeckModeProvider`
  - renders `Background`, overlays, `SlideRenderer`, `AIChat`, modal.

### 3) Slide registry and dispatch

- `components/SlideRenderer.tsx` maps 20 runtime slots.
- Registered components by slot:
  - `0`: `Slide00`
  - `1`: `Slide01`
  - `2`: `Slide02`
  - `3`: `Slide03`
  - `4`: `Slide04`
  - `5`: `Slide05`
  - `6`: `Slide06`
  - `7`: `Slide7`
  - `8`: `Slide08`
  - `9`: `Slide09`
  - `10`: `Slide10`
  - `11`: `Slide12`
  - `12`: `Slide13`
  - `13`: `Slide14`
  - `14`: `Slide15`
  - `15`: `Slide16`
  - `16`: `Slide16_Investor`
  - `17`: `Slide17`
  - `18`: `Slide18`
  - `19`: `Slide19`

### 4) API/backend entrypoint

- `server/index.ts` hosts Express API:
  - `GET /api/health`
  - `POST /api/ai`
- Stub/offline behavior is default unless flags and key allow backend calls.

## Routing and Navigation Model

- Canonical slide path: `/slides/NN`
- Parsing fallback order in `App.tsx`:
  - pathname (`/slides/NN`)
  - hash (`#slides/NN`, `#slide/NN`, `#slide-NN`)
  - query (`?slide=NN`)
- `TOTAL_SLIDES = 20` with modular normalization.
- Visible deck navigation widget is intentionally clamped to `00..04` (`DeckSlideNav`).

## UI Domain Map

- Global/shared components: `components/*.tsx`
- Slide shells and common primitives:
  - `components/Slide/SlideShell.tsx`
  - `components/Slide/slideEvents.ts`
- Slide domain families:
  - `components/slides/slide00-ui`: `79` files
  - `components/slides/slide01-ui`: `43` files
  - `components/slides/slide02-ui`: `23` files
  - `components/slides/slide03-ui`: `29` files
  - `components/slides/slide04-ui`: `18` files
  - `components/slides/slide07-ui`: `20` files
  - `components/slides/slide13-ui`: `20` files

## Shared Runtime and State

- Feature flags: `config/wow.ts`
- Boot runtime: `runtime/boot/*`
- Evidence store and transitions: `runtime/evidence/*`
- Tour/guide orchestration: `wow/tour/*` (`58` files inside `wow/tour`)

## Tooling and Test Surface

- Scripts: `scripts/*` (`22` files)
  - guardrails: `client-boundary-guard.mjs`, `no-rework-guard.mjs`
  - verification helpers: `verify-demo.mjs`, `verify-ai.mjs`, `demo-smoke.mjs`
- Unit tests: `tests/unit/*` (`9` files), run by `tests/unit/run-all.ts`
- E2E tests: `tests/e2e/*` (`11` files), default Playwright config in `playwright.config.ts`

## Evidence-Based Anomalies

- `docs/INDEX.md` references files that are not present:
  - `docs/runbooks/30_TOOLING_SCRIPTS.md`
  - `docs/runbooks/40_RELEASE_DEMO_CHECKLIST.md`
  - `docs/reference/TESTID_CONTRACT.md`
  - `docs/reference/FLAGS_AND_MODES.md`
- `HYPOTHESIS`: `components/slides/Slide07.tsx` is currently unmounted by `SlideRenderer` (which imports `Slide7`).
- `UNKNOWN`: long-term intent for `Slide11` label vs `Slide12` component slot.
