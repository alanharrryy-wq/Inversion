# Slide 00 · First Proof Ritual

## Domain Contract Summary

Slide 00 includes a gesture-only ritual named **First Proof**.

Contract:
- Input model: pointer drag, hold, release.
- No autoplay and no timer-driven completion.
- Motion is allowed and required — ONLY as a response to explicit operator inputs (gesture-driven), never time-driven.
- Drag must satisfy deterministic distance + direction sanity.
- Hold must satisfy deterministic duration, measured only from `requestAnimationFrame` ticks while pointer is down.
- Release seals only if drag and hold are already satisfied.

State machine entry points:
- `components/slides/slide00-ui/first-proof/firstProof.helpers.ts`
- `components/slides/slide00-ui/first-proof/useFirstProofRitual.ts`

Primary UI modules:
- `components/slides/slide00-ui/first-proof/FirstProofRitual.tsx`
- `components/slides/slide00-ui/first-proof/LayerStackDemo.tsx`
- `components/slides/slide00-ui/first-proof/FirstProofRail.tsx`
- `components/slides/slide00-ui/first-proof/RightSeal.tsx`

Replay and diagnostics:
- `components/slides/slide00-ui/first-proof/firstProof.replay.ts`
- `components/slides/slide00-ui/first-proof/firstProof.fixtures.ts`
- `components/slides/slide00-ui/first-proof/firstProof.debugOverlay.tsx`

## Events Emitted

Anchor events (`recordAnchorInteraction`):
- `slide00:firstproof:drag-threshold`
- `slide00:firstproof:hold-threshold`
- `slide00:firstproof:release-blocked`
- `slide00:firstproof:sealed`

Evidence/log events (`appendOperatorLog`):
- `slide00:firstproof:drag:accepted`
- `slide00:firstproof:hold:accepted`
- `slide00:firstproof:release:blocked`
- `slide00:firstproof:sealed`
- `slide00:firstproof:reset`

Semantics:
- Anchor events represent explicit operator interaction checkpoints.
- Evidence events represent deterministic system judgment after each checkpoint.

## Data Test IDs

Ritual and steps:
- `slide00-firstproof-root`
- `slide00-firstproof-step-drag`
- `slide00-firstproof-step-hold`
- `slide00-firstproof-step-release`

Gesture surfaces:
- `slide00-firstproof-gesture-drag`
- `slide00-firstproof-gesture-hold`
- `slide00-firstproof-gesture-release`

Right seal:
- `slide00-rightseal`
- `slide00-rightseal-state`

Debug (dev-only):
- `slide00-firstproof-debug-overlay`

## Smoke and Validation Commands

Run once each:

```bash
npm run typecheck
npm run build
npm run test:unit
```

Slide00 e2e smoke (optional but recommended before merge):

```bash
npm run test:e2e -- --grep "Slide00"
```

## What Not To Touch

Do not change these during Slide 00 ritual maintenance:
- Runtime semantics in `runtime/boot/**`.
- Boot provider wiring or gates semantics.
- Cross-slide behavior (`Slide01+`).
- Timer-based completion logic (`setTimeout`, `setInterval`).
- Auto-running or looped motion sequences.

Allowed movement mechanics:
- CSS transitions from state changes.
- `requestAnimationFrame` only while pointer is down.

## Local Profile Selection

Canonical copy profile (`legacy` or `speed`) is local-only:
- Query param: `?slide00_profile=legacy|speed`
- Local storage key: `slide00:firstproof:profile`

No global flags are introduced.
