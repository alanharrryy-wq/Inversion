# ARCHITECTURE_BASELINE

## Scope
Baseline architecture and no-rework rules for the WOW interactive demo runtime.

## Product Mode
- Interactive product demo, not cinematic playback.
- No autoplay/timing-driven sequencing as a control mechanism.
- No global keybind additions beyond existing baseline behavior.

## Determinism Baseline
- Offline deterministic behavior is default.
- Online AI is optional and gated by backend flags.
- Frontend must never depend on provider SDK secrets.

## Canonical Modules
### Guide Runtime
- Canonical path: `wow/tour/guide/*`.
- Runtime state machine, schema, selectors, evidence, scripts, and guide UI live here.
- Legacy `wow/guide/*` is compatibility-only and must not gain new runtime logic.

### Tour Runtime
- Canonical orchestration hook: `wow/tour/useTourEngine.ts`.
- Overlay shell: `wow/tour/TourOverlay.tsx`.
- Director overlay canonical component: `wow/tour/director/DirectorOverlay.tsx`.

### Choreography Contracts
- Canonical types file: `wow/tour/choreo/types.ts`.
- `wow/tour/choreo/choreo.types.ts` is deprecated and forbidden.

### Script Source Of Truth
- Canonical guide scripts: `wow/tour/guide/scripts/*`.
- Legacy `wow/tour/scripts/enterprise.ts` is wrapper-only and adapts from canonical guide script.

### Tests
- E2E (Playwright): `tests/e2e/**/*.e2e.spec.ts`.
- Unit (tsx deterministic): `tests/unit/**/*.unit.ts` via `tests/unit/run-all.ts`.

## Deprecation Paths
1. `wow/guide/*` direct imports are deprecated for all non-compatibility code.
2. `wow/tour/choreo/choreo.types.ts` path is deprecated.
3. `wow/tour/ui/DirectorOverlay.tsx` is deprecated and removed.
4. Any duplicate guide runtime files outside `wow/tour/guide/*` are forbidden.

## Overlay Behavior Model
- Guide overlay and operator/director overlays are state-driven by explicit evidence events.
- Step progression comes from reducer rules/evidence, not elapsed time.
- Missing evidence must remain visible and explainable.

## Authoring New Guide Steps
1. Add or edit script in `wow/tour/guide/scripts/*`.
2. Declare explicit evidence items and completion rules.
3. Run:
   - `npm run test:unit`
   - `npm run no:rework:check`
   - `npm run test:e2e`
4. Update authoring docs/playbooks only if runtime semantics changed.

## Guard Rails
- Static overlap guard: `scripts/no-rework-guard.mjs`.
- Command: `npm run no:rework:check`.
- Build hook: `npm run build` executes no-rework guard before Vite build.

## Change Acceptance Criteria
- Additive-only behavior.
- No regression in deterministic mode.
- No new parallel implementation paths.
- Required validations pass:
  - `npm run typecheck`
  - `npm run build`
  - `npm test`
  - `npm run no:rework:check`
  - `npx playwright test`
