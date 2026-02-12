# Slide04 Contract

## 0. Purpose

Slide04 is the lock-in and handoff beat. It must:

- Keep navigation stable (no global keybind changes, no navigation interception).
- Require explicit operator intent to lock the final summary.
- Produce deterministic lock output from route + constraints + evidence.
- Export a replay trace that can reproduce the same sealed state.
- Never rely on autoplay, timers, polling, or implicit progression.

This contract defines the behavior for:

- `components/slides/Slide04.tsx`
- `components/slides/slide04-ui/core/*`
- `components/slides/slide04-ui/ui/*`
- `tests/e2e/slide04-lock-handoff.e2e.spec.ts`

## 1. State Machine

### 1.1 Canonical Phases

The lock machine has exactly four phases:

1. `idle`
2. `arming`
3. `locking`
4. `sealed`

Phase semantics:

- `idle`: no valid route is selected yet.
- `arming`: route selected and lock preconditions can be reviewed.
- `locking`: pointer is actively held on the seal action; rAF updates hold progress.
- `sealed`: lock is complete and summary hash is frozen until explicit unseal/reset.

### 1.2 Allowed Transitions

Only the transitions below are valid:

1. `idle -> arming`
2. `arming -> locking`
3. `locking -> arming`
4. `locking -> sealed`
5. `sealed -> arming`
6. `arming -> idle`

Transition notes:

- `idle -> arming` occurs when the first route is selected.
- `arming -> locking` requires explicit pointer down on seal action and guard pass.
- `locking -> arming` occurs on cancel, blur, pointer release before threshold, or guard failure.
- `locking -> sealed` occurs only on pointer release after threshold and guard pass.
- `sealed -> arming` requires explicit unseal event.
- `arming -> idle` occurs when route is cleared.

### 1.3 Forbidden Transitions

Forbidden paths must be ignored or downgraded safely:

- `idle -> locking`
- `idle -> sealed`
- `arming -> sealed` (without locking hold)
- `sealed -> locking` (must unseal first)
- Any transition triggered by timers/autoplay

## 2. Lock Guards

A lock attempt can complete only when all guard rules pass:

1. `selectedRouteId` exists.
2. At least two evidence entries are selected.
3. No constraint is in `blocked` state.
4. Hold progress reached `1.0` at release.

Guard failure behavior:

- Machine returns to `arming`.
- `lastGuardFailure` is populated.
- Previous sealed payload is not overwritten.

## 3. Determinism Requirements

### 3.1 Pure Model

Summary generation is pure:

- No `Date.now()` inside summary model.
- No random IDs in summary payload.
- Canonical order for route/constraints/evidence.
- Hash derived from canonical JSON only.

### 3.2 Reducer Discipline

Reducer is deterministic:

- Action + previous state => next state, no side effects.
- No timers, async callbacks, and no non-deterministic branches.
- Idempotent guards for invalid actions.

### 3.3 Replay Discipline

Replay is deterministic:

- Trace events are reduced in order.
- Unknown event kinds are reported as errors, not thrown.
- Valid trace playback must reproduce phase + summary hash.

## 4. Interaction Contract

### 4.1 Seal Interaction

Lock action is deliberate hold-to-seal:

1. Pointer down enters `locking` and starts rAF.
2. rAF updates hold progress while pointer is down.
3. Pointer up attempts seal.
4. rAF cancels on pointer up / pointer cancel / blur / unmount.

No timer fallback is allowed.

### 4.2 rAF Safety

rAF constraints:

- rAF runs only while pointer is down.
- rAF id must be cancelled on all release paths.
- Component unmount must cancel rAF.
- Window blur must cancel active hold.

### 4.3 Replay Interaction

UI supports trace operations:

- Copy/export replay JSON.
- Paste replay JSON.
- Run playback with explicit button click.
- Playback must not run automatically.

## 5. Domain Data Contract

### 5.1 Routes

A route has:

- `id`
- `label`
- `thesis`
- `owner`
- `horizonDays`
- `riskBand`
- `handoffTag`

### 5.2 Constraints

Each constraint has:

- `id`
- `label`
- `state` in `satisfied | at-risk | blocked`
- `weight` (integer)
- `rationale`

### 5.3 Evidence

Each evidence item has:

- `id`
- `label`
- `source`
- `confidence` (integer)
- `note`

## 6. Summary Output Contract

Summary output includes:

- `schemaVersion`
- `route`
- `constraintDigest`
- `evidenceDigest`
- `decision`
- `seal`

`seal` includes:

- `hash`
- `signature`
- `holdMs`
- `sealedAtMs`

All fields are deterministic from reducer state + input action stream.

## 7. Replay JSON Contract

Replay payload shape:

```json
{
  "version": "slide04-replay.v1",
  "seed": "string",
  "meta": {
    "scenario": "string",
    "capturedAt": "ISO-8601 string"
  },
  "events": [
    {
      "seq": 1,
      "atMs": 0,
      "kind": "route.select",
      "payload": { "routeId": "route-service-led" }
    }
  ]
}
```

Validation rules:

- `version` must match exactly.
- `seed` is required string.
- `events` must be array.
- `seq` must be positive integer.
- `atMs` must be finite number >= 0.
- `kind` must be known event.

## 8. UI Test IDs

### 8.1 Root + Scene

- `s04-root`
- `s04-scene`
- `s04-route-grid`
- `s04-constraint-grid`
- `s04-evidence-grid`

### 8.2 Route Controls

- `s04-route-card-route-direct-oem`
- `s04-route-card-route-service-led`
- `s04-route-card-route-white-label`
- `s04-route-current`

### 8.3 Constraint Controls

- `s04-constraint-capital-window`
- `s04-constraint-integration-risk`
- `s04-constraint-audit-pressure`
- `s04-constraint-delivery-speed`
- `s04-constraint-compliance-rigor`

### 8.4 Evidence Controls

- `s04-evidence-live-telemetry`
- `s04-evidence-chain-of-custody`
- `s04-evidence-quality-snapshot`
- `s04-evidence-service-ledger`
- `s04-evidence-board-brief`

### 8.5 Seal Action

- `s04-seal-action`
- `s04-seal-progress`
- `s04-seal-status`
- `s04-seal-reset`

### 8.6 Summary Panel

- `s04-summary-panel`
- `s04-summary-phase`
- `s04-summary-route`
- `s04-summary-constraints`
- `s04-summary-evidence`
- `s04-seal-output`
- `s04-seal-hash`
- `s04-seal-signature`

### 8.7 Replay Controls

- `s04-replay-json`
- `s04-replay-copy`
- `s04-replay-playback`
- `s04-replay-status`
- `s04-replay-last-hash`

### 8.8 Dev HUD

- `s04-hud`
- `s04-hud-phase`
- `s04-hud-trace-length`
- `s04-hud-summary-hash`

## 9. Error Handling Contract

Errors must be surfaced as safe UI state and not throw render exceptions.

Error classes:

1. Replay parse failure.
2. Replay schema mismatch.
3. Replay event validation failure.
4. Guard failure on lock attempt.

Error UI rules:

- Status text updates in `s04-replay-status` or `s04-seal-status`.
- Existing sealed state remains intact on replay failure.
- No console error spam from expected validation failures.

## 10. Accessibility Contract

- Route and evidence items are buttons with labels.
- Seal control is keyboard focusable.
- Summary remains readable in all phases.
- No hidden autoplay transitions.

## 11. Unit Coverage Contract

Required deterministic unit coverage:

1. Summary canonicalization and hash stability.
2. Reducer transition correctness.
3. Guard enforcement.
4. Hold-progress behavior.
5. Replay encode/decode roundtrip.
6. Replay playback determinism.

## 12. E2E Smoke Contract

Single smoke path:

1. Navigate from slide 00 to slide 04.
2. Select route.
3. Ensure enough evidence selected.
4. Hold seal control past threshold.
5. Release to produce sealed output.
6. Assert `s04-summary-phase` is `sealed`.
7. Assert `s04-seal-output` and `s04-seal-hash` visible.
8. Optionally run replay playback and assert hash match.

## 13. Invariants

The following invariants must always hold:

1. `phase === idle` implies `selectedRouteId === null`.
2. `phase === locking` implies `hold.startedAtMs !== null`.
3. `phase === sealed` implies `sealedSummary !== null`.
4. `hold.progress` is clamped to `[0,1]`.
5. `selectedEvidenceIds` sorted and deduplicated.
6. Constraint IDs and evidence IDs remain from registry only.
7. Replay event sequence is monotonic by `seq`.

## 14. Non-Goals

Out of scope for Slide04:

- Network persistence of traces.
- Background autoplay progression.
- Cross-slide side effects.
- Mutation of global deck mode.

## 15. Manual QA Checklist

1. Enter slide and confirm initial phase is `idle`.
2. Select route and confirm transition to `arming`.
3. Set one constraint to `blocked` and verify seal cannot complete.
4. Restore constraints and hold/release to seal.
5. Confirm hash and signature render.
6. Copy replay JSON and replay from pasted value.
7. Confirm replay reproduces same sealed hash.
8. Unseal and re-lock with different route; hash must change.
9. Blur window while holding; hold cancels safely.
10. Navigate next/prev after sealing; navigation remains functional.

## 16. Acceptance Mapping

This contract maps directly to requested deliverables:

- FSM + summary + replay are deterministic and pure.
- UI modules are separated and composable.
- Slide04 shell stays thin.
- Tests cover model/reducer/determinism + one smoke.
- Replay trace is shareable JSON and reproducible.
