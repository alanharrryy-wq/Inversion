# Slide13 Route B Operationalization

## Domain
Slide13 implements an operator ritual for KPI outcome control:
1. Drag KPI threshold marker.
2. Hold movement pressure to freeze report.
3. Release to seal and collapse RightSeal.

This folder documents contracts for `components/slides/slide13-ui/routeb/**`.

## Scope Boundary
- In scope:
  - `components/slides/slide13-ui/routeb/**`
  - `components/slides/Slide13.tsx`
  - `tests/e2e/slide13-routeb.e2e.spec.ts`
  - `docs/slide13/**`
- Out of scope:
  - Existing KPI widget internals in `components/widgets/kpi/**`
  - Runtime boot/tour subsystems
  - Other slides

## Event Contracts
Slide13 emits browser `CustomEvent` with canonical names and details:

### Entry
- `slide:13:entered`
  - emitted once when ritual hook mounts
  - detail: `{ slide: 13, enteredAt: number }`

### Anchor Engagement
- `anchor:slide13-kpi-threshold:engaged`
  - emitted when drag threshold is first crossed
- `anchor:slide13-kpi-freeze:engaged`
  - emitted when hold threshold is first crossed
- `anchor:slide13-rightseal:engaged`
  - emitted when release seals ritual

### Gesture Completion
- `gesture:slide13-drag:completed`
- `gesture:slide13-hold:completed`
- `gesture:slide13-release:completed`

### State / Evidence
- `state:slide13-sealed:set`
- `evidence:slide13-primary:satisfied`

## Test IDs
Primary test IDs introduced by Route B:
- `slide13-root`
- `slide13-rail`
- `slide13-rail-step-drag`
- `slide13-rail-step-hold`
- `slide13-rail-step-release`
- `slide13-gesture-drag`
- `slide13-gesture-hold`
- `slide13-gesture-release`
- `slide13-seal`
- `slide13-seal-state`

Support diagnostics test IDs:
- `slide13-rail-gesture-drag`
- `slide13-rail-gesture-hold`
- `slide13-rail-gesture-release`

## Type Contracts
Core contracts:
- `slide13.types.ts`
  - `Slide13State`
  - `Slide13Snapshot`
  - `Slide13MachineEvent`
  - `Slide13ReplayFixture`
- `slide13.helpers.ts`
  - `createInitialSlide13State`
  - `transitionSlide13State`
  - `deriveSlide13Snapshot`
  - `resolveSlide13Thresholds`
- `slide13.replay.ts`
  - `replaySlide13Events`
  - `assertSlide13Fixture`
  - `runSlide13FixtureCatalog`
- `slide13.fixtures.ts`
  - `SLIDE13_REPLAY_FIXTURES`
  - `SLIDE13_FIXTURE_CATALOG`

## UI Modules
Route B modules:
- `KpiRitual.tsx`: ritual composition root (orchestrator of local domain only)
- `KpiSurface.tsx`: wraps existing `KpiDashboard`, adds gesture overlay and threshold marker
- `KpiRail.tsx`: ritual steps and progress rail
- `RightSeal.tsx`: seal state display and collapse behavior
- `slide13.debugOverlay.tsx`: dev-only introspection
- `glass/*`: slide-local premium surface kit

## Replay Strategy
Replay is deterministic:
- Same event trace and thresholds must produce identical final state/snapshot/events.
- Fixtures include sealed and non-sealed traces.
- Fixture assertion enforces required event contract names.

## No Timers Policy
For new Route B files:
- `setTimeout` forbidden
- `setInterval` forbidden

Playwright smoke includes explicit regex checks against `components/slides/slide13-ui/routeb/**`.

## Smoke Run
Suggested smoke command:

```bash
npm run test:e2e -- --grep "Slide13"
```

Expected behavior:
1. Navigate from deck root to Slide13.
2. Drag over threshold.
3. Hold movement until freeze completes.
4. Release.
5. `slide13-seal` becomes `data-sealed="true"`.
6. `slide13-seal-state` indicates collapsed seal state.

## Unit Specs
Local helper/replay specs:
- `components/slides/slide13-ui/routeb/__tests__/slide13.helpers.test.ts`
- `components/slides/slide13-ui/routeb/__tests__/slide13.replay.test.ts`

Specs cover:
- Threshold boundary clamping.
- Drag threshold boundary.
- Hold threshold boundary.
- Seal release transition.
- Idempotence and foreign pointer rejection.
- Replay determinism and fixture catalog validity.

## What Not To Touch
- Do not refactor `components/widgets/kpi/KpiDashboard.tsx`.
- Do not add timer-driven progression to Slide13 Route B.
- Do not move Route B state logic into `Slide13.tsx`.
- Do not spread Slide13 event names into other slide domains.
- Do not delete non-Route-B files as cleanup.

## Future Extension Slots
Reserved extensions with no current implementation requirement:
- KPI operator profile presets per audience.
- Evidence bridge to boot runtime ingestion.
- Server-side ritual trace persistence.
- Multi-operator conflict resolution.
