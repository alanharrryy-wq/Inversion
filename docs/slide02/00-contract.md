# Slide02 Contract

Version: `slide02-contract.v1`

Date: `2026-02-10`

Scope:
- `components/slides/Slide02.tsx`
- `components/slides/slide02-ui/**`
- `tests/e2e/slide02-bridge-smoke.e2e.spec.ts`

## 1) Product Intent

Slide02 is the bridge between problem framing and execution proof.
It must feel continuous, deterministic, and never block progression.
The slide tightens system constraints from an incoming route signal and responds live with deterministic evidence.

Core promise:
- If prior slides provide no context, Slide02 still renders a valid route + constraints model.
- Any control change updates deterministic response panels immediately.
- Replay capture and playback reproduce the same output signature without randomness.

## 2) Hard Constraints

- No autoplay logic in Slide02.
- No timer-driven transitions.
- No randomization.
- No polling loops.
- Reducer and model are pure and deterministic.
- `Slide02.tsx` remains thin and delegates to `slide02-ui` modules.
- HUD is off by default.

## 3) Canonical Domain Model

### 3.1 Route IDs

Allowed route IDs:
- `stabilize-operations`
- `throughput-push`
- `margin-defense`
- `quality-ringfence`

Default route:
- `stabilize-operations`

### 3.2 Constraints

Each constraint is integer `0..100`.

- `strictness`:
  - Meaning: policy rigor and enforcement depth.
  - Higher value increases compliance confidence and coordination overhead.

- `budgetGuard`:
  - Meaning: financial headroom available to execute route.
  - Higher value improves implementation capacity.

- `latencyGuard`:
  - Meaning: tolerance for operational response latency.
  - Higher value means slower response tolerated.

Default constraints:
- `strictness = 56`
- `budgetGuard = 62`
- `latencyGuard = 38`

### 3.3 System Response

Outputs are deterministic from route + constraints:

- `executionReadiness` (0..100)
- `continuityIndex` (0..100)
- `riskPressure` (0..100)
- `operabilityBand` (`Fragile` | `Managed` | `Stable` | `Hardened`)
- `decision` (`HOLD` | `TIGHTEN` | `PROCEED` | `PROCEED+`)
- `signature` (stable string hash for replay and smoke assertions)

### 3.4 Evidence Rows

Evidence panel shows deterministic rows:
- `Route Signal` (source + normalized route)
- `Constraint Fit` (tightness interpretation)
- `Execution Capacity` (budget and strictness relation)
- `Latency Exposure` (latency risk view)
- `Bridge Verdict` (deterministic decision)

Each row has:
- label
- value
- status (`good` | `watch` | `risk`)
- rationale text

## 4) State Machine Contract

### 4.1 State Shape

`Slide02MachineState` includes:
- `status`
- `seed`
- `route`
- `constraints`
- `response`
- `trace`
- `hud`
- `replay`

### 4.2 Status Enum

- `BOOTSTRAPPED`: initial model is available.
- `INTERACTIVE`: user has made at least one deterministic change.
- `REPLAY_READY`: JSON replay parsed and staged.
- `REPLAY_APPLIED`: staged replay applied; outputs recomputed.
- `REPLAY_ERROR`: invalid replay payload or parse issue.

### 4.3 Actions

- `BOOT`
- `SET_ROUTE`
- `SET_STRICTNESS`
- `SET_BUDGET_GUARD`
- `SET_LATENCY_GUARD`
- `RESET_CONSTRAINTS`
- `TOGGLE_HUD`
- `REPLAY_STAGE_JSON`
- `REPLAY_APPLY_STAGED`
- `REPLAY_CLEAR`

### 4.4 Transition Rules

1. `BOOT -> BOOTSTRAPPED`
2. Control actions from `BOOTSTRAPPED|INTERACTIVE|REPLAY_APPLIED` -> `INTERACTIVE`
3. `REPLAY_STAGE_JSON` with valid payload -> `REPLAY_READY`
4. `REPLAY_STAGE_JSON` with invalid payload -> `REPLAY_ERROR`
5. `REPLAY_APPLY_STAGED` from `REPLAY_READY` -> `REPLAY_APPLIED`
6. `REPLAY_CLEAR` always clears staged replay and returns:
   - `INTERACTIVE` if trace not empty
   - else `BOOTSTRAPPED`

### 4.5 Determinism Rule

For fixed input tuple `(route, strictness, budgetGuard, latencyGuard)`, output tuple `(executionReadiness, continuityIndex, riskPressure, operabilityBand, decision, signature)` must always match.

## 5) Defensive Defaults Contract

Slide02 must never throw when prior context is absent or malformed.

Seed context resolution order:
1. URL query (`?route=...`)
2. `window.history.state.route` if available
3. `localStorage` keys:
   - `inversion.selectedRoute`
   - `inversion.route`
   - `hitech.selectedRoute`
   - `hitech.route`
4. Fallback default route

Constraint seeds use parser + clamp + integer rounding.

Malformed values are ignored and replaced by defaults.

## 6) Replay Contract

### 6.1 Replay JSON Envelope

```json
{
  "version": "slide02.replay.v1",
  "base": {
    "route": "stabilize-operations",
    "constraints": {
      "strictness": 56,
      "budgetGuard": 62,
      "latencyGuard": 38
    }
  },
  "trace": [
    {
      "seq": 1,
      "kind": "set-route",
      "value": "margin-defense"
    },
    {
      "seq": 2,
      "kind": "set-strictness",
      "value": 71
    }
  ],
  "meta": {
    "createdBy": "slide02-ui",
    "createdAt": "deterministic-local",
    "signature": "sig-example"
  }
}
```

### 6.2 Replay Validation

A replay is valid if:
- `version === "slide02.replay.v1"`
- `base.route` is known route
- base constraints are finite numbers
- `trace` is an array of known event kinds
- `seq` values are positive integers and strictly increasing after sanitization

### 6.3 Replay Application

Replay apply algorithm:
1. Build base state from `base` payload.
2. Apply trace events in sequence order.
3. Recompute response via model per event.
4. Final state gets `REPLAY_APPLIED`.
5. Final signature must equal deterministic model output.

## 7) Test IDs Contract

All listed test IDs must exist.

### 7.1 Root & Status

- `slide02-root`
- `slide02-scene`
- `slide02-status`
- `slide02-status-value`
- `slide02-route-source`
- `slide02-seed-route`
- `slide02-trace-length`
- `slide02-response-signature`

### 7.2 Controls Panel

- `slide02-controls-panel`
- `slide02-route-select`
- `slide02-strictness-slider`
- `slide02-budget-slider`
- `slide02-latency-slider`
- `slide02-reset-constraints`

### 7.3 Constraint Readouts

- `slide02-strictness-value`
- `slide02-budget-value`
- `slide02-latency-value`
- `slide02-tightness-label`

### 7.4 Evidence Panel

- `slide02-evidence-panel`
- `slide02-evidence-row-route`
- `slide02-evidence-row-fit`
- `slide02-evidence-row-capacity`
- `slide02-evidence-row-latency`
- `slide02-evidence-row-verdict`
- `slide02-decision-chip`
- `slide02-operability-band`
- `slide02-readiness-value`
- `slide02-continuity-value`
- `slide02-risk-value`

### 7.5 Replay Panel

- `slide02-replay-panel`
- `slide02-replay-export`
- `slide02-replay-textarea`
- `slide02-replay-stage`
- `slide02-replay-apply`
- `slide02-replay-clear`
- `slide02-replay-error`

### 7.6 HUD

- `slide02-hud-toggle`
- `slide02-hud`
- `slide02-hud-route`
- `slide02-hud-constraints`
- `slide02-hud-status`
- `slide02-hud-signature`

## 8) UX Contract

### 8.1 First Paint

On first render Slide02 shows:
- One valid route selected.
- Sliders set to defaults or sanitized seeds.
- Evidence panel with deterministic outputs.
- HUD hidden.

### 8.2 Interaction

When user changes controls:
- UI updates immediately.
- Trace length increments for effective changes.
- Response signature updates deterministically.

### 8.3 Replay

Replay flow:
1. Export current replay JSON.
2. Paste JSON in textarea.
3. Stage JSON.
4. Apply replay.
5. Evidence outputs match deterministic replay result.

## 9) E2E Smoke Assertions

The smoke test must prove:
- Navigation can reach Slide02.
- Slide02 renders baseline outputs.
- Two controls change outputs (signature changes).
- Replay stage/apply path is valid.
- Final state remains deterministic and stable.

## 10) Unit Spec Contract

Required unit coverage:
- Model formulas and band classification.
- Reducer transitions and defensive clamps.
- Replay parse/sanitize/apply determinism.

## 11) Reducer Invariants

Invariant list:
1. Route is always a known route.
2. Constraint values always stay integer `0..100`.
3. Response signature always non-empty.
4. Trace events sequence values strictly increase.
5. `REPLAY_APPLY_STAGED` without staged payload is no-op.
6. `REPLAY_CLEAR` removes replay errors.
7. `RESET_CONSTRAINTS` keeps route and source.

## 12) Replay Invariants

1. Re-exporting replay after apply must produce a valid payload.
2. Parsing invalid JSON never throws past parser boundary.
3. Unknown trace kinds are ignored during sanitization.
4. Duplicate seq values are normalized during sanitization.
5. Missing meta object is auto-filled.

## 13) Accessibility Contract

- Every slider has visible label.
- Every slider has deterministic `data-testid`.
- Route selector is keyboard accessible.
- Replay textarea has accessible label text.
- Buttons are keyboard reachable in source order.

## 14) Failure Semantics

Failures are explicit and non-fatal:
- Invalid replay text -> `REPLAY_ERROR`, message shown in panel.
- Missing staged replay on apply -> state unchanged.
- Malformed seed context -> fallback defaults + continue.

## 15) Route Normalization Rules

Accepted aliases map to canonical route IDs:
- `stabilize`, `ops`, `stability` -> `stabilize-operations`
- `throughput`, `speed`, `flow` -> `throughput-push`
- `margin`, `cost`, `defense` -> `margin-defense`
- `quality`, `qa`, `ringfence` -> `quality-ringfence`

Unknown routes resolve to default route.

## 16) Constraint Narratives

Tightness labels:
- `0..24` => `Loose Window`
- `25..49` => `Guided`
- `50..74` => `Tightened`
- `75..100` => `Hard Lock`

Budget posture labels:
- `0..29` => `Constrained`.
- `30..59` => `Balanced`.
- `60..100` => `Funded`.

Latency exposure labels:
- `0..29` => `Low latency tolerance`.
- `30..59` => `Moderate latency tolerance`.
- `60..100` => `High latency tolerance`.

## 17) Deterministic Signature Contract

Signature format:
- `S2|{routeCode}|{readiness}|{continuity}|{risk}|{decisionCode}|{bandCode}`

Route codes:
- `OPS`
- `THR`
- `MRG`
- `QLT`

Decision codes:
- `H`
- `T`
- `P`
- `PP`

Band codes:
- `F`
- `M`
- `S`
- `H`

## 18) Model Scenario Matrix (Reference)

This matrix is normative for unit specs.

| Scenario | Route | strictness | budget | latency | Expected decision | Expected band |
|---|---|---:|---:|---:|---|---|
| baseline default | stabilize-operations | 56 | 62 | 38 | PROCEED | Stable |
| budget collapse | stabilize-operations | 56 | 10 | 38 | PROCEED | Managed |
| strict heavy funded | margin-defense | 78 | 80 | 22 | PROCEED | Stable |
| latency loose | throughput-push | 44 | 71 | 84 | TIGHTEN | Managed |
| quality hard lock | quality-ringfence | 90 | 64 | 12 | PROCEED | Stable |
| low strictness low budget | throughput-push | 20 | 20 | 50 | HOLD | Fragile |
| high strictness low budget | margin-defense | 88 | 28 | 30 | PROCEED | Managed |
| medium balanced | stabilize-operations | 50 | 50 | 50 | PROCEED | Managed |
| low latency high budget | throughput-push | 40 | 76 | 18 | PROCEED | Stable |
| extreme latency + low budget | throughput-push | 48 | 22 | 92 | HOLD | Fragile |

## 19) Replay Scenario Matrix

| Scenario | Replay Valid | Result Status |
|---|---|---|
| Valid payload, ordered seq | yes | REPLAY_APPLIED |
| Valid payload, unordered seq | yes (sanitized) | REPLAY_APPLIED |
| Unknown route alias in base | yes (normalized) | REPLAY_APPLIED |
| Unknown event kind | yes (ignored) | REPLAY_APPLIED |
| Invalid JSON text | no | REPLAY_ERROR |
| Missing version | no | REPLAY_ERROR |
| Missing base constraints | no | REPLAY_ERROR |

## 20) Coverage Map

Files expected:
- `components/slides/slide02-ui/core/model.ts`
- `components/slides/slide02-ui/core/fsm.ts`
- `components/slides/slide02-ui/core/replay.ts`
- `components/slides/slide02-ui/core/context.ts`
- `components/slides/slide02-ui/ui/ControlsPanel.tsx`
- `components/slides/slide02-ui/ui/EvidencePanel.tsx`
- `components/slides/slide02-ui/ui/HudToggle.tsx`
- `components/slides/slide02-ui/ui/Scene.tsx`
- `components/slides/slide02-ui/ui/ReplayPanel.tsx`

## 21) Non-goals

Out of scope for this iteration:
- Cross-slide global store refactors.
- Async backend calls.
- New keyboard shortcuts.
- New autoplay behavior.

## 22) Acceptance Checklist

- [ ] Slide02 renders with no upstream context.
- [ ] Control changes are deterministic.
- [ ] Replay export works.
- [ ] Replay stage/apply works.
- [ ] HUD defaults to hidden.
- [ ] Documented IDs exist in rendered UI.
- [ ] Smoke e2e passes.
- [ ] Unit specs pass for model/fsm/replay.

## 23) Maintenance Notes

- Keep route aliases centralized in model.
- Keep replay schema versioned.
- Keep reducer pure and side-effect free.
- Keep `Slide02.tsx` thin; feature logic belongs in `slide02-ui`.

## 24) Review Gate

Before merge, reviewer should validate:
1. No timer APIs introduced.
2. No randomness APIs introduced.
3. No hidden state outside reducer for core logic.
4. No non-deterministic replay operations.

## 25) Appendix: Control Semantics

### Route selector

Changing route updates:
- route label
- route evidence row
- response metrics
- signature
- trace length

### Strictness slider

Increasing strictness generally:
- improves compliance confidence
- can reduce agility when budget is low
- often lowers risk when budget is moderate/high

### Budget slider

Increasing budget generally:
- increases readiness and continuity
- reduces risk pressure
- improves decision tendency toward proceed

### Latency slider

Increasing latency tolerance generally:
- increases risk pressure
- can downgrade decision
- can reduce continuity when strictness is low

## 26) Appendix: Glossary

- Bridge: The continuity layer between diagnostic problem framing and traction evidence.
- Constraint Tightening: Operator-driven narrowing of acceptable execution window.
- Signature: Deterministic compressed state marker used for replay equality checks.
- Operability Band: Human-readable operating confidence zone derived from metrics.

## 27) Appendix: Deterministic Design Notes

Design principles used:
- No hidden mutable global state.
- No elapsed-time branching.
- No random seeds.
- Pure computation path from state to response.

## 28) Appendix: Test Author Notes

When extending tests:
- Prefer explicit numeric fixtures over generated data.
- Assert both semantic outputs and signature.
- Cover invalid replay payloads and malformed seed inputs.
- Keep smoke test path compact and deterministic.
