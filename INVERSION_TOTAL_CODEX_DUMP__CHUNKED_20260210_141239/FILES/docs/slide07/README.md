
# Slide07 Route B README

## Domain
- Slide: `Slide07`
- Runtime boundary: `components/slides/slide07-ui/routeb`
- Objective: make SMARTSERVICE™ feel operable through deterministic graph manipulation.

## Contracts
- Types: `slide07.types.ts`
- Pure state machine: `slide07.helpers.ts`
- Replay harness: `slide07.replay.ts`
- Fixtures catalog: `slide07.fixtures.ts`
- Hook orchestration: `useSystemRitual.ts`

## Domain Events
- `slide:07:entered`
- `anchor:slide07-graph-link:engaged`
- `anchor:slide07-check-runner:engaged`
- `gesture:slide07-drag:completed`
- `gesture:slide07-hold:completed`
- `gesture:slide07-release:completed`
- `state:slide07-sealed:set`
- `evidence:slide07-primary:satisfied`

## Test IDs
- `slide07-root`
- `slide07-rail`
- `slide07-rail-step-*`
- `slide07-gesture-drag`
- `slide07-gesture-hold`
- `slide07-gesture-release`
- `slide07-seal`
- `slide07-seal-state`

## Gesture Contract
1. Drag pointer until graph link aligns.
2. Keep pointer pressed while hold ticks accumulate deterministic check completion.
3. Release once hold is complete to seal and collapse RightSeal.

## Determinism and Replay
- `slide07.replay.ts` replays machine events without side effects.
- `slide07.fixtures.ts` provides a large deterministic catalog (sealed and partial runs).
- Each fixture defines expected stage, expected evidence state, and exact event chain.

## No Timers Rule
- Route B modules must not contain `setTimeout` or `setInterval`.
- Active hold progression is handled with `requestAnimationFrame` only while pointer is active.

## Smoke Run
1. `npm run typecheck`
2. `npm run build`
3. `npm run test:unit`
4. Optional: `npm run test:e2e -- --grep "Slide07"`

## What Not To Touch
- Do not change event names used by route contracts.
- Do not move deterministic logic from helpers into UI components.
- Do not introduce timer-based progress.
- Do not rewrite cross-slide renderer wiring in this iteration.
- Do not delete existing slide runtime files outside this domain.

