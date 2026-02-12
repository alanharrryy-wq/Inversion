# Slide01 Contract - Route Selector (Deterministic)

## 1. Purpose

Slide01 is a deterministic, user-driven route selector interaction.
The interaction is used to choose between two implementation routes (A and B) by weighing visible criteria through a deliberate pointer gesture.

This contract defines:
- Finite-state machine (FSM) states and transitions.
- Deterministic scoring model.
- Replay trace format and validation.
- Stable `data-testid` identifiers for all actionable controls.
- Test expectations for unit and smoke e2e coverage.

## 2. Scope

In-scope modules are restricted to:
- `components/slides/slide01-ui/**`
- `components/slides/Slide01.tsx`
- `tests/e2e/**` (Slide01 only)
- `docs/slide01/**`

Out of scope:
- runtime boot providers
- gate logic
- global deck wiring
- unrelated slide behavior

## 3. Interaction Summary

User flow:
1. User lands in `idle` state.
2. User presses pointer down inside the weighing arena (`aiming`).
3. User drags deliberately while keeping pointer down (`weighing`).
4. User releases pointer (`committed`).
5. System deterministically resolves selected route and explanation (`resolved`).

There is no autoplay, no randomization, and no timer-based transition.

## 4. Deterministic Invariants

The implementation must satisfy all invariants below.

1. Same trace events in same order always produce the same final state.
2. Same final state always renders the same evidence text and criteria bullets.
3. Tie-breaking is deterministic and explicit (`B` wins ties).
4. Route resolution never depends on wall-clock time.
5. Replay is pure reducer execution over trace-derived actions.
6. Every action has a stable `data-testid` target when initiated from UI.
7. Pointer coordinates are normalized into `[0..1]` and clamped.
8. Pointer move events with no active pointer are ignored.
9. Pointer up with no active session is ignored.
10. Reset always returns to initial state.

## 5. Route Model

### 5.1 Route A

- ID: `A`
- Label: `Route A`
- Name: `Rapid Stabilization`
- Intent: fast local mitigation to reduce immediate operational pressure.

### 5.2 Route B

- ID: `B`
- Label: `Route B`
- Name: `Standardized Scale Path`
- Intent: durable, scalable, and auditable operating model.

### 5.3 Criteria Definitions

Each criterion has:
- stable id
- human label
- weight
- route profile fit for A/B

Criteria IDs:
- `deliverySpeed`
- `operationalRisk`
- `scalability`
- `budgetPredictability`
- `knowledgeRetention`

Weight totals:
- sum of weights must equal `1.00`.

## 6. FSM Contract

### 6.1 States

- `idle`
- `aiming`
- `weighing`
- `committed`
- `resolved`

### 6.2 State Diagram

```text
idle
  -- pointerdown -->
aiming
  -- pointermove (distance >= threshold) -->
weighing
  -- pointerup -->
committed
  -- resolve_committed -->
resolved
  -- reset -->
idle
```

Support transitions:
- `aiming -- reset --> idle`
- `weighing -- reset --> idle`
- `committed -- reset --> idle`
- `resolved -- reset --> idle`

### 6.3 Transition Guards

- `pointerdown` only starts session when inside weighing arena.
- `pointermove` only updates gesture when pointer session is active.
- `pointerup` only commits when pointer session is active.
- `resolve_committed` only transitions when phase is `committed`.

### 6.4 Action Types

- `POINTER_EVENT`
- `RESOLVE_COMMITTED`
- `RESET`
- `TOGGLE_HUD`
- `SET_REPLAY_TEXT`
- `REPLAY_APPLY`

### 6.5 Transition Table

| Current | Action | Guard | Next | Notes |
|---|---|---|---|---|
| idle | POINTER_EVENT(pointerdown) | valid event | aiming | starts gesture session |
| idle | POINTER_EVENT(pointermove) | no session | idle | ignored |
| idle | POINTER_EVENT(pointerup) | no session | idle | ignored |
| idle | RESET | none | idle | idempotent |
| idle | TOGGLE_HUD | none | idle | ui-only flag changes |
| aiming | POINTER_EVENT(pointermove) | movement below threshold | aiming | updates provisional metrics |
| aiming | POINTER_EVENT(pointermove) | movement crosses threshold | weighing | first deliberate weighting frame |
| aiming | POINTER_EVENT(pointerup) | active session | committed | score snapshot frozen |
| aiming | RESET | none | idle | clears trace and score |
| weighing | POINTER_EVENT(pointermove) | active session | weighing | updates provisional score |
| weighing | POINTER_EVENT(pointerup) | active session | committed | score snapshot frozen |
| weighing | RESET | none | idle | clears trace and score |
| committed | RESOLVE_COMMITTED | none | resolved | winner + explanation evidence |
| committed | RESET | none | idle | manual reset |
| resolved | RESET | none | idle | allows repeat |
| resolved | POINTER_EVENT(pointerdown) | valid event | aiming | starts new run in same session counter |
| resolved | TOGGLE_HUD | none | resolved | diagnostics visibility |

## 7. Gesture Contract

### 7.1 Event Capture

Captured events:
- `pointerdown`
- `pointermove`
- `pointerup`

Fields per event:
- `kind`
- `seq`
- `x`
- `y`
- `pointerId`
- `button`
- `targetId`

### 7.2 Normalization

For a pointer event within arena rectangle:
- `x = clamp((clientX - rect.left) / rect.width, 0, 1)`
- `y = clamp((clientY - rect.top) / rect.height, 0, 1)`

### 7.3 Deliberate Gesture Threshold

Aiming becomes weighing when Manhattan delta from start crosses threshold:
- `abs(current.x - start.x) + abs(current.y - start.y) >= 0.045`

### 7.4 Metrics Produced

- `sampleCount`
- `totalDistance`
- `horizontalTravel`
- `verticalTravel`
- `meanX`
- `meanY`
- `spreadX`
- `spreadY`
- `momentum`
- `stability`
- `commitment`
- `urgency`
- `biasRight`
- `deliberation`

## 8. Scoring Contract

### 8.1 Scoring Inputs

Inputs are deterministic metrics from gesture samples.

Derived scalars:
- `biasRight = clamp01((meanX - 0.5) * 1.8 + 0.5)`
- `deliberation = clamp01(stability * 0.55 + commitment * 0.45)`

### 8.2 Criterion Emphasis Formulas

Each criterion emphasis in `[0..1]`.

- `deliverySpeed`
  - `0.25 + urgency*0.5 + momentum*0.2 - stability*0.15`
- `operationalRisk`
  - `0.2 + deliberation*0.5 + biasRight*0.2 + meanY*0.1`
- `scalability`
  - `0.15 + biasRight*0.45 + spreadX*0.2 + commitment*0.2`
- `budgetPredictability`
  - `0.2 + stability*0.45 + commitment*0.25 + meanY*0.1 - urgency*0.1`
- `knowledgeRetention`
  - `0.15 + deliberation*0.35 + meanY*0.2 + biasRight*0.2 + spreadY*0.1`

All formulas are clamped to `[0..1]`.

### 8.3 Route Compatibility

Compatibility function:
- `compatibility = 1 - abs(emphasis - profile)`

Per-criterion points:
- `pointsA = weight * compatibility(emphasis, profileA)`
- `pointsB = weight * compatibility(emphasis, profileB)`

Total score:
- `scoreA = sum(pointsA) * 100`
- `scoreB = sum(pointsB) * 100`

Winner:
- if `scoreB - scoreA > 0.0001` => `B`
- if `scoreA - scoreB > 0.0001` => `A`
- else tie => `B`

### 8.4 Explanation Rules

Explanation bullets are generated from sorted contribution deltas.

Rules:
1. Rank criteria by absolute delta.
2. Emit top 3 criteria as bullets.
3. Emit one metrics bullet summarizing certainty factors.
4. Keep bullet text stable and deterministic.

## 9. Replay Contract

### 9.1 Envelope Schema

```json
{
  "version": "slide01.trace.v1",
  "source": "Slide01",
  "events": [
    {
      "kind": "pointerdown",
      "seq": 1,
      "x": 0.2,
      "y": 0.6,
      "pointerId": 1,
      "button": 0,
      "targetId": "slide01-weigh-arena"
    }
  ]
}
```

### 9.2 Validation

Envelope is valid when:
- `version === "slide01.trace.v1"`
- `source === "Slide01"`
- `events` is an array
- every event has all required fields and normalized coordinates
- events are strictly increasing by `seq`

### 9.3 Replay Execution

Replay resets machine and applies events in order through reducer actions:
1. map trace event to reducer action list
2. apply all mapped actions sequentially
3. return resulting state

Pointer event mapping:
- `pointerdown` -> `[POINTER_EVENT]`
- `pointermove` -> `[POINTER_EVENT]`
- `pointerup` -> `[POINTER_EVENT, RESOLVE_COMMITTED]`

### 9.4 Replay Result

Replay returns:
- final phase
- selected route
- score snapshot
- explanation bullets
- event count
- status reason (`ok` / `parse_error` / `validation_error`)

## 10. UI Components Contract

### 10.1 Scene Composition

- `Slide01Scene` is the single exported scene component from `slide01-ui`.
- `Slide01.tsx` remains a thin shell with Header/NavArea and scene insertion.

### 10.2 Required UI Blocks

- Route cards panel (A/B with criteria fit)
- Weighing arena panel
- Outcome panel
- Replay panel
- Dev HUD panel (off by default)

### 10.3 Mandatory Behaviors

- no autoplay
- no randomization
- no timer loops
- deterministic state progression
- explicit reset action
- trace export action
- trace replay action

## 11. Test IDs

All actionable elements must have stable `data-testid`.

### 11.1 Scene and Root

- `slide01-scene`
- `slide01-title`
- `slide01-subtitle`
- `slide01-phase-chip`
- `slide01-main-grid`

### 11.2 Route Cards

- `slide01-routes-panel`
- `slide01-route-card-A`
- `slide01-route-card-B`
- `slide01-route-title-A`
- `slide01-route-title-B`
- `slide01-route-tag-A`
- `slide01-route-tag-B`
- `slide01-route-score-A`
- `slide01-route-score-B`
- `slide01-route-selected-A`
- `slide01-route-selected-B`
- `slide01-route-criterion-deliverySpeed-A`
- `slide01-route-criterion-deliverySpeed-B`
- `slide01-route-criterion-operationalRisk-A`
- `slide01-route-criterion-operationalRisk-B`
- `slide01-route-criterion-scalability-A`
- `slide01-route-criterion-scalability-B`
- `slide01-route-criterion-budgetPredictability-A`
- `slide01-route-criterion-budgetPredictability-B`
- `slide01-route-criterion-knowledgeRetention-A`
- `slide01-route-criterion-knowledgeRetention-B`

### 11.3 Weighing Arena

- `slide01-weigh-panel`
- `slide01-weigh-instruction`
- `slide01-weigh-arena`
- `slide01-weigh-arena-grid`
- `slide01-weigh-axis-x`
- `slide01-weigh-axis-y`
- `slide01-pointer-dot`
- `slide01-pointer-start-dot`
- `slide01-live-bias`
- `slide01-live-deliberation`
- `slide01-live-urgency`
- `slide01-live-samples`

### 11.4 Outcome

- `slide01-outcome-panel`
- `slide01-outcome-state`
- `slide01-outcome-headline`
- `slide01-outcome-score`
- `slide01-outcome-bullets`
- `slide01-outcome-bullet-0`
- `slide01-outcome-bullet-1`
- `slide01-outcome-bullet-2`
- `slide01-outcome-bullet-3`
- `slide01-outcome-winner`
- `slide01-outcome-reset`

### 11.5 Replay Controls

- `slide01-replay-panel`
- `slide01-trace-length`
- `slide01-trace-export`
- `slide01-trace-copy`
- `slide01-replay-input`
- `slide01-replay-load-sample`
- `slide01-replay-apply`
- `slide01-replay-status`

### 11.6 Dev HUD

- `slide01-hud-toggle`
- `slide01-hud-panel`
- `slide01-hud-phase`
- `slide01-hud-score-A`
- `slide01-hud-score-B`
- `slide01-hud-delta`
- `slide01-hud-trace`
- `slide01-hud-transition-count`

### 11.7 Navigation Hooks

- `slide01-scene` must remain visible while `NavArea` previous/next controls remain functional.

## 12. Evidence Text Contract

Resolved evidence headline format:
- `Route A selected` or `Route B selected`

Score evidence format:
- `A: <xx.xx> | B: <yy.yy> | Delta: <zz.zz>`

Reason bullet format:
- `Operational Risk: +12.40 pts for Route B`

## 13. Error Handling

Replay parse/validation errors must:
- not crash scene
- set replay status to `error`
- surface stable user-visible message
- preserve previous resolved evidence when possible

## 14. Accessibility Contract

- Weighing arena supports pointer interaction.
- Buttons are semantic `<button>` elements.
- Replay textarea has label and placeholder.
- Outcome text uses high-contrast classes.

## 15. Unit Test Matrix

The following matrix must be covered by Slide01 unit tests.

### 15.1 Reducer and FSM

- idle + pointerdown => aiming
- aiming + move below threshold => aiming
- aiming + move above threshold => weighing
- weighing + move => weighing
- aiming + pointerup => committed
- weighing + pointerup => committed
- committed + resolve => resolved
- resolved + reset => idle
- toggle hud flips boolean
- pointermove without active session ignored
- pointerup without active session ignored

### 15.2 Scoring

- stable right-biased deep gesture favors Route B
- urgent left-biased shallow gesture favors Route A
- deterministic tie goes Route B
- weights sum to 1.00
- all criterion emphasis values clamped [0..1]
- score range bounded [0..100]

### 15.3 Replay

- envelope parse success on valid json
- parse error on malformed json
- validation error on out-of-order seq
- validation error on invalid kind
- replay reproduces selected route from original trace
- replay event count equals trace length

## 16. Smoke E2E Matrix

Happy path smoke test:
1. Navigate to app root.
2. Move to Slide01.
3. Assert scene and critical controls visible.
4. Execute deterministic drag gesture from left-mid to right-lower.
5. Assert resolved outcome headline visible.
6. Assert winner evidence text exists.
7. Export trace.
8. Replay trace.
9. Assert winner and score evidence remain stable.

## 17. State Payload Contract

`Slide01MachineState` required keys:
- `phase`
- `phaseHistory`
- `hudVisible`
- `trace`
- `pointer`
- `metrics`
- `score`
- `winner`
- `outcome`
- `transitionCount`
- `replay`

## 18. Reducer Purity

Reducer must:
- be side-effect free
- avoid mutable shared state
- return new objects only when fields change
- never read browser globals directly

Side effects (clipboard, text area IO) remain in UI adapters.

## 19. Replay Purity

Replay runner must:
- be deterministic
- run without DOM
- only call reducer and pure mappers
- return identical output for identical input

## 20. Constants Contract

- `SLIDE01_TRACE_VERSION = "slide01.trace.v1"`
- `SLIDE01_TRACE_SOURCE = "Slide01"`
- `SLIDE01_TIE_BREAKER = "B"`
- `SLIDE01_MOVEMENT_THRESHOLD = 0.045`

## 21. Event Mapping Contract

### 21.1 Live Event Mapping

DOM pointer event -> trace event -> reducer actions.

### 21.2 Replay Event Mapping

JSON trace event -> reducer actions (same mapper).

Mapping function must be shared to guarantee parity.

## 22. Performance Contract

- Gesture handling uses O(1) incremental updates where practical.
- Replay linear complexity O(n) with n = trace events.
- No animation loops in core logic.

## 23. Security and Robustness

- Replay parser limits numeric parsing to finite values.
- Unknown fields in trace payload are ignored.
- Unknown action kinds are rejected.

## 24. Developer HUD Contract

HUD is opt-in via explicit button.
Default HUD state is hidden.
HUD shows:
- phase
- scoreA
- scoreB
- delta
- trace length
- transition count

HUD must not alter scoring or transitions.

## 25. Copy Contract

Scene copy anchors:
- Header label: `ROUTE SELECTOR`
- Instruction: `Click and drag to weigh criteria, then release to commit.`
- Outcome label: `Deterministic decision evidence`

## 26. Regression Constraints

- Deck navigation must remain functional through existing NavArea wiring.
- Slide01 load should not emit console errors.
- Interaction must complete in under 10 seconds in normal test conditions.

## 27. Known Assumptions

- App starts on Slide00, then user navigates to Slide01 using ArrowRight.
- Slide01 scene uses shared shell and does not alter app-level providers.

## 28. Test Data Samples

### 28.1 Route B leaning sample

- down at `(0.22, 0.44)`
- moves toward `(0.78, 0.76)`
- up at `(0.82, 0.78)`

Expected winner: `B`

### 28.2 Route A leaning sample

- down at `(0.70, 0.60)`
- quick moves toward `(0.18, 0.25)`
- up at `(0.12, 0.20)`

Expected winner: `A`

## 29. Contract Compliance Checklist

- [ ] Thin `Slide01.tsx` orchestrator only
- [ ] `slide01-ui` modular tree created
- [ ] deterministic reducer/FSM implemented
- [ ] replay capture and replay loader implemented
- [ ] dev HUD off by default implemented
- [ ] stable `data-testid` coverage complete
- [ ] unit tests added for reducer/scoring/replay
- [ ] smoke e2e added for happy path
- [ ] docs `REPORT.md` added

## 30. Extended Test ID Notes

The following IDs are reserved for future internal assertions and can be added without contract break:
- `slide01-criterion-signal-deliverySpeed`
- `slide01-criterion-signal-operationalRisk`
- `slide01-criterion-signal-scalability`
- `slide01-criterion-signal-budgetPredictability`
- `slide01-criterion-signal-knowledgeRetention`

These IDs are optional in v1 but recommended for diagnostics.

## 31. Deterministic Replay Acceptance

A replay is accepted when all conditions are true:
1. `final.phase === "resolved"`
2. `final.winner` equals expected winner from source run
3. score deltas are exactly equal to source run (rounded string format)
4. `trace.length` equals imported event count

## 32. Failure Modes and User Signals

- parse failure -> `Replay error: invalid JSON`
- schema failure -> `Replay error: invalid trace envelope`
- sequence failure -> `Replay error: invalid sequence`
- unsupported kind -> `Replay error: unsupported pointer kind`

## 33. State Serialization Contract

Serialized deterministic state snapshot contains:
- phase
- scoreA
- scoreB
- winner
- traceLength
- topReasonIds (array)

Snapshot serialization is used only for diagnostics and tests.

## 34. Minimal Replay Harness Requirements

The harness must expose pure functions:
- `serializeTraceEnvelope(state.trace)`
- `parseTraceEnvelope(json)`
- `replayTraceFromInitial(envelope)`

## 35. Final Contract Statement

Slide01 is considered complete when:
- deterministic route selection works by deliberate user gesture,
- replay reproduces decision through reducer path,
- evidence text is visible and stable,
- and all listed tests pass in the target environment.
