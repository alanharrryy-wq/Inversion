
# BOOT_GATE

## Contract

Slide 00 is the deterministic BOOT/GATE surface. Runtime progression follows:

1. `ACTION`: operator presses **ARM SYSTEM**.
2. `WHY`: arming exists to register verifiable activity and satisfy blockers.
3. `CONFIRM`: operator confirms arming explicitly.

No timer, RAF, or autoplay path can satisfy primary evidence.

## Boot State Machine

- `IDLE`
- `ARMED_PENDING_CONFIRM`
- `ARMED_CONFIRMED`
- `OPERATOR_ASSISTED`

Transitions:

- `IDLE -> ARMED_PENDING_CONFIRM` via `boot:arm:requested`.
- `ARMED_PENDING_CONFIRM -> ARMED_CONFIRMED` via `boot:arm:confirmed`.
- `IDLE -> OPERATOR_ASSISTED` via operator override.
- `OPERATOR_ASSISTED -> ARMED_CONFIRMED` via explicit arm confirmation.
- `* -> IDLE` via local reset.

## Evidence Keys

Primary blocker:

- `evidence:system:armed`

Informational keys:

- `evidence:slide00:entered`
- `evidence:boot:arm:requested`
- `evidence:boot:arm:confirmed`
- `evidence:boot:operator:override`

Semantics:

- `evidence:system:armed` is only satisfied by `boot:arm:confirmed`.
- Operator override never satisfies blockers.
- Local reset unsatisfies all keys.

## WOW Precedence Rules

Gate resolution is enforced by `runtime/boot/wowGate.ts`.

When gate is locked:

- `WOW_TOUR` locked.
- `WOW_TOUR_AUTOSTART` locked.
- `WOW_DEMO_SCRIPT` locked.
- `WOW_OPENING_CINEMA` locked.
- `WOW_MIRROR` locked.

When armed or operator-assisted:

- Features become available according to flags.
- `WOW_TOUR_AUTOSTART` stays non-authoritative with reason `autostart-disabled-by-boot-contract`.
- Tour start remains manual (`TourOverlay` launch button).

## Operator Overrides

`OPERATOR_DIAGNOSTICS` is default OFF.

When enabled, dock provides:

- Last event and last anchor.
- Current boot state.
- Evidence satisfied/missing lists.
- Local timestamp.
- `Allow advance without arming`.
- `Reset local`.
- `Snapshot` copy/download.

Override is visibly labeled as operator-assisted and does not fake evidence.

## Deterministic Events

Slide entry and actions are ingested into runtime/evidence with stable IDs:

- `boot-000001` runtime IDs
- `ev-000001` evidence IDs

Important events:

- `slide:entered`
- `slide:00:entered`
- `boot:arm:requested`
- `boot:arm:confirmed`
- `boot:override:enabled`
- `boot:override:disabled`
- `boot:local:reset`

## Tests

Run unit tests:

```bash
npm run test:unit
```

Run e2e tests:

```bash
npm run test:e2e
```

Run focused Slide00 E2E:

```bash
npx playwright test tests/e2e/slide00-boot-gate.e2e.spec.ts
```

