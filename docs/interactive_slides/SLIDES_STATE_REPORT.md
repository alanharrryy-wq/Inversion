# SLIDES_STATE_REPORT

## Scope and assumptions
- Audit date: 2026-02-27 (local workspace scan).
- Repository root: `Inversion`.
- Scan excludes generated or heavy mirrors: `node_modules`, `dist`, `.git`, `test-results`, `.run`, `.logs`, `screenshots`, and historical audit dump folders.
- Interactivity completeness percentage is a deterministic heuristic score (0-100) based on mounted slide contracts:
  - imports slide module runtime (`slideXX-ui`): +30
  - has dedicated `slideXX-ui` folder: +20
  - stateful hooks in mounted file: +10
  - pointer/gesture handlers in mounted file: +10
  - test ids in mounted file: +10
  - baseline mounted contract: +20

## Repository structural map (current)

### Core runtime layer
- Entry mount: `index.tsx` (React root + crash overlay).
- App orchestration: `App.tsx`.
- Slide dispatch registry: `components/SlideRenderer.tsx`.
- Runtime providers:
  - `runtime/boot/BootRuntimeContext.tsx`
  - `components/DeckRuntimeMode.tsx`
  - `components/slides/slide00-ui/Slide00ViewVisibilityContext.tsx`

### UI layer
- Shared UI shell: `components/Slide/SlideShell.tsx`.
- Mounted slide files: `components/slides/Slide00.tsx` to `Slide19.tsx` (20 slots).
- Dedicated slide UI subdomains exist for:
  - `slide00-ui`, `slide01-ui`, `slide02-ui`, `slide03-ui`, `slide04-ui`, `slide07-ui`, `slide13-ui`.
- Monolithic slide files still dominate several domains (`Slide06`, `Slide09`, `Slide12`, `Slide16`, `Slide7`).

### Animation layer
- Global CSS animation/tokens:
  - `index.css`
  - `wow/animations.css`
  - `wow/effects.css`
  - `wow/tour/motion.tokens.css`
  - `wow/tour/tokens.css`
- Runtime animation control is split across many files using:
  - CSS keyframes
  - inline transitions
  - `requestAnimationFrame` loops in component hooks.
- No centralized animation engine API currently enforces budgets/tiers per slide.

### State layer
- Boot/evidence deterministic reducers:
  - `runtime/boot/*`
  - `runtime/evidence/*`
- Guided tour runtime reducers/selectors/schema:
  - `wow/tour/guide/*`
  - orchestrated by `wow/tour/useTourEngine.ts`
- Significant local state still lives inside large slide monoliths.

### Assets layer
- Local media assets (image/video/audio/font) in repo: `0`.
- Local asset-like files found by extension inventory: only `7` JSON files.
- No `assets/` folder and no `public/` folder currently.
- Modal image resolution (`components/Modal.tsx`) expects `assets/...` paths and falls back to external `picsum.photos` when missing.

### Tooling layer
- Script suite (`scripts/*`): 22 files (guards, smoke tests, audits, demo operators).
- Python tooling package (`tools/foundation_scan/*`): 11 files.
- Build guards integrated in `npm run build`:
  - `scripts/client-boundary-guard.mjs --strict`
  - `scripts/no-rework-guard.mjs`

## Slide rendering and routing status
- Routing system is custom in `App.tsx` (no React Router):
  - parses `pathname`, `hash`, and `?slide=`.
  - canonicalizes URL to `/slides/NN` via `history.replaceState`.
- Global slide count: `TOTAL_SLIDES = 20`.
- Visible deck nav widget is clamped to slides `00..04` (`DECK_NAV_START/END`).
- Slide registry is static array in `SlideRenderer.tsx`.

## Current interactive slide status (mounted slots)

| Slot | Component | LOC | Heuristic Score | Classification | Notes |
|---|---:|---:|---:|---|---|
| 00 | Slide00 | 998 | 90 | systemized | Boot runtime + first-proof gesture runtime + diagnostics/evidence wiring |
| 01 | Slide01 | 20 | 80 | systemized | Thin orchestrator into `slide01-ui` |
| 02 | Slide02 | 30 | 70 | systemized | Thin orchestrator into `slide02-ui` |
| 03 | Slide03 | 18 | 80 | systemized | Thin orchestrator into `slide03-ui` |
| 04 | Slide04 | 20 | 70 | systemized | Thin orchestrator into `slide04-ui` |
| 05 | Slide05 | 212 | 40 | monolith-interactive | Interactive module hover/click emits guide events |
| 06 | Slide06 | 1441 | 40 | monolith-interactive | Large inline logic/styles; interactive node model |
| 07 | Slide7 | 1124 | 60 | monolith-interactive | Rich interaction; naming mismatch with `Slide07.tsx` file |
| 08 | Slide08 | 14 | 20 | static-or-light | Renders shared stack widget |
| 09 | Slide09 | 2219 | 40 | monolith-interactive | Very large layered interaction shell |
| 10 | Slide10 | 19 | 20 | static-or-light | Widget composition only |
| 11 | Slide12 | 1099 | 40 | monolith-interactive | Slot label/index mismatch risks with naming |
| 12 | Slide13 | 14 | 50 | static-or-light | Thin orchestrator into `slide13-ui` |
| 13 | Slide14 | 14 | 40 | static-or-light | Static composition |
| 14 | Slide15 | 14 | 20 | static-or-light | Static composition |
| 15 | Slide16 | 3233 | 40 | monolith-interactive | Largest monolith, build timestamp injected at compile |
| 16 | Slide16_Investor | 127 | 20 | static-or-light | Mostly static layout |
| 17 | Slide17 | 88 | 30 | static-or-light | Case reveal hooks/events present but light |
| 18 | Slide18 | 52 | 20 | static-or-light | Static composition |
| 19 | Slide19 | 66 | 20 | static-or-light | Static composition |

### Orphan and naming anomalies
- Orphan slide file: `components/slides/Slide07.tsx` (not mounted in `SlideRenderer.tsx`).
- Mounted component for slot 07 is `Slide7.tsx`, while labels and docs reference `Slide07`.
- Slot 11 mounts `Slide12`, while labels include `Slide11`; this can drift guidance, analytics, and QA scripts.

## Interactivity completeness summary
- Mounted slides: `20`
- Classification split:
  - systemized: `5`
  - monolith-interactive: `6`
  - static-or-light: `9`
- Overall interactivity completeness heuristic: **44.5%**

## Technical debt and fragile zones

### High debt
- Monolith concentration:
  - `components/slides/Slide16.tsx` (3233 LOC)
  - `components/slides/Slide09.tsx` (2219 LOC)
  - `components/slides/Slide06.tsx` (1441 LOC)
  - `components/slides/Slide7.tsx` (1124 LOC)
  - `components/slides/Slide12.tsx` (1099 LOC)
- These files mix rendering, state machines, event emission, and visual styling in single units.

### Medium debt
- Split runtime models across multiple event buses:
  - `wow:tour-event`
  - `wow:guide:evidence`
  - direct `window.dispatchEvent` patterns in slides/components.
- Duplicate/legacy paths still present (`components/DeckMode_v2.tsx` not in active path).

### Fragile zones
- Custom routing + manual URL sync in `App.tsx` without schema-based route contracts.
- Hardcoded constants in runtime orchestration:
  - `TOTAL_SLIDES = 20`
  - nav clamp to `00..04`
  - heavy FX whitelist `[4, 13]`
- Modal asset fallback can trigger external network dependency (`picsum.photos`) during demos.

## Determinism risks

### Runtime determinism drift
- Time-based calls (`Date.now`, `performance.now`) are widespread across runtime and slide interaction logic.
- `Math.random` still appears in interactive components (`components/DealSelector.tsx`, `components/IndustrialStack.tsx`).
- `Slide16.tsx` exports `__SLIDE16_BUILD_TS__ = new Date().toISOString()`; build artifact content changes every build.

### Tooling determinism drift
- Report generators embed timestamps (e.g., `scripts/slide-map.mjs`, `scripts/slide-intel.mjs`, `scripts/client-boundary-guard.mjs`).
- Build output bundle names are content-hashed (expected), but report metadata is not content-stable.

## Performance notes (Windows + constrained RAM)
- `npm run build` is currently passing; output includes heavy bundles:
  - JS chunk: ~`976 kB` (pre-gzip)
  - CSS bundle: ~`318 kB` (pre-gzip)
- Vite warns about large chunks (>500 kB).
- Many simultaneous blur/gradient/keyframe effects and RAF loops can pressure integrated GPUs and low-memory Windows machines.
- Large monolith slide files increase TypeScript check and HMR churn during development.

## Tooling audit snapshot

### Existing build/test helpers
- Build/typecheck:
  - `npm run typecheck`
  - `npm run build`
- Validation guards:
  - `scripts/client-boundary-guard.mjs`
  - `scripts/no-rework-guard.mjs`
  - `scripts/security-check.mjs`
- Demo and smoke:
  - `scripts/demo-smoke.mjs`
  - `scripts/wow-guide-smoke.ps1`
  - `scripts/wow-validate.ps1`

### Test strategy currently implemented
- Unit tests target reducers and contracts (`tests/unit/*`).
- E2E tests heavily concentrated on deck and slides 00-04 (`tests/e2e/*`).
- Slide-level E2E for later slides is partial (guide/demo flows exist but not full per-slide readiness).

### Current verification result in this audit pass
- `npm run typecheck`: PASS
- `npm run build`: PASS (with large chunk warning)

## Definition of Done for fully interactive slides
1. Every mounted slide has a dedicated `components/slides/slideXX-ui/` domain with:
   - pure core reducer/logic
   - UI adapter components
   - explicit event/evidence contracts
2. `SlideRenderer` mounts one canonical component per slot with no orphan duplicate names.
3. Slide index contract is explicit and shared across runtime, guide scripts, labels, tests, and analytics.
4. Asset pipeline exists with deterministic manifest (`assets.json`) and no runtime fallback to external placeholder URLs.
5. Interaction events are normalized through one event contract layer (no ad-hoc global events).
6. Deterministic clock abstraction exists for replay/tests (injectable time source).
7. Smoke E2E covers all mounted slides at minimum route + primary interaction assertions.
8. Build determinism checker blocks non-deterministic report metadata in required artifacts.
9. Performance budgets exist per slide (CPU/frame budget + animation tier policy).
10. Full suite is defined and run only at block close/merge gate, while per-iteration stays smoke-focused.
