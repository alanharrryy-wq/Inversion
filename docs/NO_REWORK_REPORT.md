# NO_REWORK_REPORT

## Scope
This report closes the overlap + test harness chapter for Inversion with canonical module decisions, overlap removal, and guard rails.

## What Changed

### 1) Test harness separation (resolved)
- Playwright now runs only e2e tests from `tests/e2e`:
  - `playwright.config.ts` now sets:
    - `testDir: './tests/e2e'`
    - `testMatch: ['**/*.e2e.spec.ts']`
    - `testIgnore: ['**/*.unit.ts']`
- E2E tests moved:
  - `tests/demo.spec.ts` -> `tests/e2e/demo.e2e.spec.ts`
  - `tests/gemini-boundary.spec.ts` -> `tests/e2e/gemini-boundary.e2e.spec.ts`
- Unit tests moved:
  - `tests/wow-guide-engine.spec.ts` -> `tests/unit/wow-guide-engine.unit.ts`
  - `tests/wow-guide-schema.spec.ts` -> `tests/unit/wow-guide-schema.unit.ts`
- Added unit runner:
  - `tests/unit/run-all.ts`
  - `npm run test:unit`
- Updated `npm test` to run both deterministic unit + e2e suites.

### 2) Guide path overlap (canonicalized)
- Canonical runtime remains `wow/tour/guide/*`.
- `wow/guide/*` converted to compatibility-only surface:
  - kept wrappers: `wow/guide/index.ts`, `wow/guide/events.ts`, `wow/guide/aiGuidance.stub.ts`
  - removed duplicated runtime files:
    - `wow/guide/engine.ts`
    - `wow/guide/reducer.ts`
    - `wow/guide/script.types.ts`
    - `wow/guide/selectors.ts`
    - `wow/guide/selectors.engine.ts`
    - `wow/guide/script.sample.ts`
- App/runtime imports migrated off legacy event channel:
  - `App.tsx`
  - `components/Slide/slideEvents.ts`
  - `wow/tour/useTourEngine.ts`

### 3) Choreo type overlap (consolidated)
- Canonical choreo types consolidated in:
  - `wow/tour/choreo/types.ts`
- Removed duplicate:
  - `wow/tour/choreo/choreo.types.ts`
- Updated imports:
  - `wow/tour/choreo/choreo.utils.ts`
  - `wow/tour/choreo/useChoreoPhases.ts`

### 4) DirectorOverlay overlap (consolidated)
- Canonical component remains:
  - `wow/tour/director/DirectorOverlay.tsx`
- Removed duplicate unused implementation:
  - `wow/tour/ui/DirectorOverlay.tsx`

### 5) Guide script source of truth (de-duplicated)
- `wow/tour/scripts/enterprise.ts` no longer duplicates script content.
- It is now a compatibility wrapper adapting canonical guide script from `wow/tour/guide/scripts/enterprise.ts`.

### 6) Guard rails and docs
- Added static no-rework guard:
  - `scripts/no-rework-guard.mjs`
- Added npm command:
  - `npm run no:rework:check`
- Guard integrated into build path:
  - `npm run build` now runs boundary guard + no-rework guard before Vite build.
- Added architecture baseline documentation:
  - `docs/ARCHITECTURE_BASELINE.md`
- Added execution plan documentation:
  - `docs/NO_REWORK_PLAN.md`

### 7) Additional tests for chapter closure
- Added unit guard fixture tests:
  - `tests/unit/no-rework-guard.unit.ts`
  - verifies guard passes on repo and fails for reintroduced overlap fixture.
- Added unit harness scoping test:
  - `tests/unit/playwright-harness.unit.ts`
  - verifies Playwright scope config and e2e file confinement.
- Strengthened client boundary check:
  - `tests/e2e/gemini-boundary.e2e.spec.ts` now also forbids deprecated `wow/guide` imports in client scope.

## Why These Changes
- Remove lingering parallel implementations and make ownership explicit.
- Prevent test-runner cross-discovery and keep CI deterministic.
- Keep additive compatibility where necessary while blocking new drift.
- Encode architecture decisions into automated guards so they survive future changes.

## Validation Executed
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm test` ✅
- `npm run no:rework:check` ✅
- `npx playwright test` ✅

## Constraints Check
- `components/slides/Slide09.tsx` untouched ✅
- `components/slides/Slide16.tsx` untouched ✅
- No new global keybinds introduced ✅
- Deterministic/offline-first flow preserved ✅

## Intentional Deferrals
1. Full hard removal of legacy `wow/guide` entry path is deferred; wrappers remain for compatibility while guard blocks new non-wrapper usage.
2. Large bundle size warning from Vite remains (not part of this overlap/test-harness closure).
