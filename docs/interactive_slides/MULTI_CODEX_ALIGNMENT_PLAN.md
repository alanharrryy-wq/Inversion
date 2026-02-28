# MULTI_CODEX_ALIGNMENT_PLAN

## Coordination assumptions
- Target integration model: 5-worker internal factory (`A_core`, `B_tooling`, `C_features`, `D_validation`, `Z_aggregator`).
- Feature flags remain OFF by default in code contracts; demo-specific `.env.local` may still override locally.
- Additive migration: no destructive runtime removals until replacement contracts are validated.

## Backlog grouped by worker

## A_core

### A-001
- Goal: Formalize slide schema as single source of truth for slot/component/label/index alignment.
- Input: `components/SlideRenderer.tsx`, `App.tsx`, existing slide files.
- Output: `runtime/slides/contracts/slideSchema.ts` + generated registry adapter.
- Acceptance criteria: no orphan mounted mismatch; build fails on duplicated slot or label drift.
- Complexity: M

### A-002
- Goal: Extract runtime route parser and URL canonicalization into pure module.
- Input: routing logic currently in `App.tsx`.
- Output: `runtime/slides/router/*` with unit tests.
- Acceptance criteria: all current route forms still resolve; no behavior regression in `/slides/NN`, hash, query.
- Complexity: S

### A-003
- Goal: Introduce deterministic clock service used by runtime reducers and replay engines.
- Input: `Date.now()` and `performance.now()` usages in runtime/guide/slide reducers.
- Output: `runtime/core/clock.ts` with injected `now()` contract.
- Acceptance criteria: reducers/replay tests can run with fixed clock and deterministic snapshots.
- Complexity: M

### A-004
- Goal: Decompose Slide16 monolith into modular runtime + UI boundaries.
- Input: `components/slides/Slide16.tsx`.
- Output: `components/slides/slide16-ui/{core,ui,overlays,index.ts}` and thin `Slide16.tsx` orchestrator.
- Acceptance criteria: visual parity maintained, typecheck/build pass, unit tests cover core transitions.
- Complexity: L

### A-005
- Goal: Normalize Slide07 mount contract (`Slide7` vs `Slide07`) and remove ambiguity.
- Input: `components/SlideRenderer.tsx`, `components/slides/Slide7.tsx`, `components/slides/Slide07.tsx`.
- Output: canonical one-component mount path + naming consistency guard.
- Acceptance criteria: one mounted source, no orphan duplicate for same slot semantics.
- Complexity: S

### A-006
- Goal: Create shared interaction contract interface for slide ritual engines.
- Input: `slide00-ui/first-proof`, `slide07-ui/routeb`, `slide13-ui/routeb`.
- Output: `runtime/interactivity/contracts/*` + adapters.
- Acceptance criteria: common event envelope and replay compatibility across these slides.
- Complexity: M

## B_tooling

### B-001
- Goal: Stabilize deterministic slide scanner pipeline.
- Input: `tools/analysis/scan_slides.py`.
- Output: scanner smoke test + JSON schema doc.
- Acceptance criteria: repeated runs produce identical output bytes on unchanged tree.
- Complexity: S

### B-002
- Goal: Build asset manifest generator (`assets.json`) with hash/dedupe checks.
- Input: `assets/` directory (to be introduced), naming conventions.
- Output: `tools/assets/generate_manifest.py` + `assets/data/manifests/assets.json`.
- Acceptance criteria: sorted deterministic output, sha256 on all assets, duplicate-content report.
- Complexity: M

### B-003
- Goal: Add asset reference validator to block missing local media.
- Input: TS/TSX/CSS/HTML references and manifest.
- Output: `tools/assets/validate_refs.py` + script wrapper.
- Acceptance criteria: build gate fails on unresolved required assets.
- Complexity: M

### B-004
- Goal: Add build determinism checker for non-deterministic metadata in required artifacts.
- Input: generated report scripts and `.run` outputs.
- Output: `tools/analysis/check_determinism.py`.
- Acceptance criteria: checker flags timestamp drift in required committed artifacts.
- Complexity: M

### B-005
- Goal: Add registry consistency checker (slot/component/label alignment).
- Input: `SlideRenderer` registry, slide schema, labels.
- Output: `tools/analysis/check_slide_registry.py`.
- Acceptance criteria: CI fails if slot label/component mismatch is introduced.
- Complexity: S

### B-006
- Goal: Provide PowerShell wrappers for Windows-first execution.
- Input: Python tooling commands.
- Output: `tools/analysis/*.ps1` thin wrappers with progress output.
- Acceptance criteria: wrappers run without `EncodedCommand`, paths resolve from repo root.
- Complexity: S

## C_features

### C-001
- Goal: Convert Slide05 into modular `slide05-ui` runtime domain.
- Input: `components/slides/Slide05.tsx`.
- Output: `slide05-ui/{core,ui,tests}` + thin orchestrator.
- Acceptance criteria: existing interactions preserved; guide evidence events still emitted.
- Complexity: M

### C-002
- Goal: Convert Slide06 monolith into modular interaction runtime.
- Input: `components/slides/Slide06.tsx`.
- Output: `slide06-ui/{core,ui,tests}`.
- Acceptance criteria: same visual behavior; new core reducer replayable with deterministic tests.
- Complexity: L

### C-003
- Goal: Convert Slide09 layered monolith into bounded modules.
- Input: `components/slides/Slide09.tsx`.
- Output: `slide09-ui/{layers,core,ui,tests}`.
- Acceptance criteria: explicit layer contracts, no cross-layer side effects, smoke flow preserved.
- Complexity: L

### C-004
- Goal: Convert Slide12 module interactions into reducer-driven core.
- Input: `components/slides/Slide12.tsx`.
- Output: `slide12-ui/{core,ui,tests}`.
- Acceptance criteria: module open/hover behavior uses pure transition functions and stable events.
- Complexity: L

### C-005
- Goal: Add interaction anchors/test ids for slides 08,10,14,15,18,19.
- Input: current static slide components.
- Output: minimal deterministic interaction hooks and event emissions.
- Acceptance criteria: each target slide has at least one primary action anchor for guide/test coverage.
- Complexity: M

### C-006
- Goal: Replace Slide17 placeholder modal assets with local manifest-backed evidence bundle.
- Input: `Slide17.tsx`, `Modal.tsx`, new asset manifest.
- Output: deterministic local case media path resolution.
- Acceptance criteria: no remote fallback required for core case reveal path.
- Complexity: M

## D_validation

### D-001
- Goal: Define and implement lightweight per-slide smoke tests (05-19).
- Input: current Playwright setup and slide anchors.
- Output: `tests/e2e/slideXX-smoke.e2e.spec.ts` minimal suite.
- Acceptance criteria: each slide route loads and primary interaction/assertion passes.
- Complexity: M

### D-002
- Goal: Add unit suites for extracted reducers/helpers from slide06/09/12/16.
- Input: new `slideXX-ui/core` modules.
- Output: focused unit specs under each slide domain or `tests/unit`.
- Acceptance criteria: deterministic replay/transition assertions for critical logic.
- Complexity: L

### D-003
- Goal: Add schema validation for slide schema and guide script alignment.
- Input: slide schema + guide scripts.
- Output: validation tests and CI command.
- Acceptance criteria: fails when guide references non-mounted/misaligned slide IDs.
- Complexity: M

### D-004
- Goal: Add asset integrity checks into smoke validation lane.
- Input: manifest + reference validator.
- Output: `npm run verify:assets` and optional PS wrapper.
- Acceptance criteria: missing asset refs fail fast before E2E.
- Complexity: S

### D-005
- Goal: Add Git integrity checks for additive-only constraints in automation flows.
- Input: existing dev scripts and no-rework guard.
- Output: check script that blocks accidental destructive operations in scripted pipelines.
- Acceptance criteria: unsafe git commands are rejected in automation context.
- Complexity: S

### D-006
- Goal: Define full-suite merge gate profile (not repeatedly executed during iteration).
- Input: existing `verify`, `test`, `wow:validate`, E2E configs.
- Output: documented merge gate command matrix + CI profile.
- Acceptance criteria: single command entrypoint for pre-merge full verification.
- Complexity: S

## Z_aggregator

### Z-001
- Goal: Define cross-worker status schema for slide completion reporting.
- Input: outputs from A/B/C/D workers.
- Output: `docs/interactive_slides/SLIDE_COMPLETION_SCHEMA.md` + JSON schema.
- Acceptance criteria: all workers can emit machine-readable status under same schema.
- Complexity: S

### Z-002
- Goal: Build aggregator script to consolidate worker outputs.
- Input: worker JSON reports (scan, validation, feature status).
- Output: `tools/analysis/aggregate_status.py` + consolidated JSON/MD reports.
- Acceptance criteria: deterministic merged report with stable ordering.
- Complexity: M

### Z-003
- Goal: Track per-slide readiness metrics dashboard.
- Input: interactivity score, test coverage, asset readiness, perf flags.
- Output: `docs/interactive_slides/SLIDE_READINESS_DASHBOARD.md`.
- Acceptance criteria: each slide gets Red/Amber/Green with measurable criteria.
- Complexity: M

### Z-004
- Goal: Define weekly snapshot format for factory operations.
- Input: aggregator outputs and git metadata.
- Output: timestamp-free canonical snapshot + optional timestamped operational export.
- Acceptance criteria: canonical snapshot stable across reruns on unchanged state.
- Complexity: S

### Z-005
- Goal: Define executive report format for completion and blocker rollup.
- Input: consolidated readiness + top blockers + trend deltas.
- Output: `docs/interactive_slides/EXEC_REPORT_TEMPLATE.md`.
- Acceptance criteria: includes summary, risks, unaffected domains, and next worker assignments.
- Complexity: S

### Z-006
- Goal: Implement blocker escalation matrix by severity/owner.
- Input: validation and feature failures.
- Output: `docs/interactive_slides/BLOCKER_ESCALATION_MATRIX.md`.
- Acceptance criteria: each blocker auto-routes to owner worker and SLA lane.
- Complexity: S

## Consolidation metrics to aggregate (Z contract)
- Slide contract health: slot/name/label consistency.
- Interactivity readiness score per slide.
- Asset readiness: missing refs, duplicates, manifest coverage.
- Determinism readiness: clock/random/timestamp drift counts.
- Test readiness: smoke coverage per slide + critical unit coverage.
- Build readiness: typecheck/build status + chunk budget alerts.

## Report format (aggregated)
- `summary`: totals and high-severity issues.
- `by_slide`: one object per slot with status and blockers.
- `by_worker`: completed/in-progress/pending tasks.
- `risks`: sorted by severity and owner.
- `next_actions`: ordered top priorities for next iteration.
