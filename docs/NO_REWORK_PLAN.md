# NO_REWORK_PLAN

## Objective
Close the overlap + harness chapter with one source of truth per subsystem, deterministic tests, and enforceable guard rails.

## Hard Constraints
- Additive-only changes.
- Interactive-first (no autoplay/timing-driven sequencing added).
- No new global keybinds.
- Offline deterministic by default.
- Env flags remain default-OFF when absent.
- Do not modify `components/slides/Slide09.tsx` and `components/slides/Slide16.tsx`.
- Windows-first tooling (`node`, PowerShell, `npm.cmd` compatible).

## Canonical Decisions
1. Guide runtime canonical path: `wow/tour/guide/*`.
2. Legacy path `wow/guide/*`: keep only thin compatibility wrappers and deprecate for new imports.
3. Choreo types canonical file: `wow/tour/choreo/types.ts` only.
4. Director overlay canonical component: `wow/tour/director/DirectorOverlay.tsx`.
5. Playwright harness canonical scope: `tests/e2e/**/*.e2e.spec.ts`.
6. Unit harness canonical scope: `tests/unit/**/*.unit.ts` executed via `tsx`.
7. Guide script source of truth: `wow/tour/guide/scripts/*`; legacy tour script wrapper must adapt from canonical script (no duplicated script content).

## Risks And Mitigations
- Risk: Removing overlap breaks hidden imports.
  - Mitigation: keep compatibility wrappers where needed and add static guards.
- Risk: Test runner split misses tests.
  - Mitigation: explicit `testDir`, `testMatch`, `testIgnore` in Playwright + explicit unit runner script.
- Risk: Future drift reintroduces duplicates.
  - Mitigation: `scripts/no-rework-guard.mjs` + npm hook + guard fixture unit test.
- Risk: Build friction for local development.
  - Mitigation: run guard in `build` and validation flows, not in `dev`.

## Work Plan (Execution Tasks)
1. Create test directory split: `tests/e2e` and `tests/unit`.
   - Validation: `rg --files tests`.
2. Move Playwright specs to `tests/e2e` and rename to `*.e2e.spec.ts`.
   - Validation: `npx playwright test --list`.
3. Move guide unit specs to `tests/unit` and rename to `*.unit.ts`.
   - Validation: `npm run test:unit`.
4. Add explicit unit test runner entrypoint (`tests/unit/run-all.ts`).
   - Validation: `npm run test:unit`.
5. Update `playwright.config.ts` to strict e2e discovery (`testDir`, `testMatch`, `testIgnore`).
   - Validation: `npx playwright test --list`.
6. Update npm scripts to separate unit/e2e and keep `npm test` deterministic.
   - Validation: `npm test`.
7. Fix guide unit assertion mismatch causing current harness failure.
   - Validation: `npm run test:unit`.
8. Canonicalize guide imports in app/runtime (`wow/tour/guide/events` usage).
   - Validation: `npm run typecheck`.
9. Convert `wow/guide/*` to compatibility wrappers only; remove redundant engine/selectors/type logic.
   - Validation: `rg -n "wow/guide" App.tsx components wow tests scripts`.
10. Move guidance stub to canonical `wow/tour/guide/aiGuidance.stub.ts`; keep legacy wrapper.
   - Validation: `npm run typecheck`.
11. Consolidate choreo types into `wow/tour/choreo/types.ts`; delete `wow/tour/choreo/choreo.types.ts`; update imports.
   - Validation: `rg -n "choreo.types|choreo/types" wow`.
12. Canonicalize DirectorOverlay by deleting unused `wow/tour/ui/DirectorOverlay.tsx`.
   - Validation: `rg -n "DirectorOverlay" wow`.
13. Replace duplicated legacy enterprise tour script content with adapter wrapper from canonical guide script.
   - Validation: `npm run typecheck`.
14. Add static no-rework guard script (`scripts/no-rework-guard.mjs`) for duplicate paths/imports.
   - Validation: `npm run no:rework:check`.
15. Add guard fixture/unit test proving guard catches reintroductions.
   - Validation: `npm run test:unit`.
16. Integrate guard into npm lifecycle (`build` and explicit command).
   - Validation: `npm run build`.
17. Add architecture baseline doc with canonical modules + deprecation path.
   - Validation: manual doc review.
18. Run full required validation suite and produce final closure report.
   - Validation: all commands in validation section pass.

## Validation Commands (Target)
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run no:rework:check`
- `npx playwright test`

## Definition Of Done
- Playwright no longer discovers unit specs.
- Unit specs run outside Playwright and are deterministic.
- `wow/tour/guide/*` is the declared canonical runtime path.
- `wow/guide/*` has no duplicated runtime logic; only wrappers/deprecation compatibility.
- Single choreo type contract file exists.
- Single DirectorOverlay implementation exists.
- Static no-rework guard exists, is wired to npm, and has tests proving failure on overlap reintroduction.
- `docs/ARCHITECTURE_BASELINE.md`, `docs/NO_REWORK_PLAN.md`, and `docs/NO_REWORK_REPORT.md` exist.
- Required validation commands pass.

## Intentional Deferrals (Allowed)
- Full removal of all legacy wrapper entry points is deferred; wrappers remain until downstream imports are fully migrated.
- Broader CSS or visual polish changes are out of scope for this chapter closure.
