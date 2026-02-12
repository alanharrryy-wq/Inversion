# Slide03 Contract - Evidence Ladder

Date: 2026-02-10
Scope: `components/slides/slide03-ui/**`, `components/slides/Slide03.tsx`, `tests/e2e/**` (Slide03), `docs/slide03/**`

## 1. Intent

Slide03 is the proof beat. The interaction must answer one question in less than 15 seconds:

- Why does the chosen route plus explicit constraints produce the better outcome?

The mechanism is an evidence ladder with three sequential steps.

- `E1`: establish operational visibility under constraints.
- `E2`: prove route-to-constraint fit under risk pressure.
- `E3`: demonstrate variance suppression and audit readiness.

The user must trigger each step manually. No autoplay and no randomness are allowed.

## 2. Deterministic Runtime Contract

### 2.1 State Ladder

Only these FSM states are valid:

1. `idle`
2. `step1`
3. `step2`
4. `step3`
5. `sealed`

Transition order is strict and irreversible within a session:

1. `idle` -> `step1`
2. `step1` -> `step2`
3. `step2` -> `step3`
4. `step3` -> `sealed`

No transition may skip a step.

### 2.2 Step Ownership

- `step1` corresponds to evidence card `E1`.
- `step2` corresponds to evidence card `E2`.
- `step3` corresponds to evidence card `E3`.
- `sealed` means all three cards are revealed and locked.

### 2.3 Allowed User Actions

- `POINTER_START`
- `POINTER_FRAME`
- `POINTER_END`
- `POINTER_CANCEL`
- `CONFIRM_STEP`
- `RESET_SESSION`
- `PLAY_REPLAY`
- `LOAD_REPLAY_JSON`

### 2.4 Guard Rules

The reducer must enforce all guards below:

1. A pointer interaction can only start on the next expected card.
2. `POINTER_FRAME` is ignored unless pointer is active and IDs match.
3. A card can only be confirmed when:
   - It is the next expected step.
   - The gesture has reached the unlock threshold.
4. Once revealed, a card remains locked for this session.
5. A later card cannot be armed or confirmed before prior cards reveal.
6. `PLAY_REPLAY` must produce the same final deterministic state from the same input and action log.

### 2.5 Stage-to-Step Mapping

| FSM Stage | Expected Step | Revealed Count | Seal State |
| --- | --- | --- | --- |
| `idle` | `E1` | 0 | `open` |
| `step1` | `E2` | 1 | `forming` |
| `step2` | `E3` | 2 | `forming` |
| `step3` | `none` (await final commit) | 3 | `forming` |
| `sealed` | `none` | 3 | `sealed` |

### 2.6 Confidence Semantics

- Confidence score: integer `0..100`.
- Uncertainty score: integer `0..100`.
- Seal level:
  - `open`: no revealed evidence yet, or confidence `< 60`
  - `forming`: confidence `>= 60` and `< 85`
  - `sealed`: confidence `>= 85` and all evidence steps revealed

## 3. Interaction Contract (No Timers)

### 3.1 Gesture Mechanics

Each card includes a deterministic gesture rail.

- User pointer down starts intent.
- Progress updates on animation frames while pointer is down.
- Unlock threshold is reached when normalized progress >= configured threshold.
- Releasing pointer before threshold resets arm status.
- Releasing after threshold arms the card for explicit confirmation.

### 3.2 Timing Restrictions

- No `setTimeout`.
- No `setInterval`.
- No polling loops.
- `requestAnimationFrame` is permitted only while pointer is actively held.
- Active `requestAnimationFrame` must be canceled on:
  - pointer release
  - pointer cancel
  - window blur
  - component unmount

### 3.3 Confirmation Mechanics

A step reveals only through explicit action.

- Gesture alone does not reveal.
- User must press card confirm control after arm.
- Confirm action commits evidence and moves FSM to next stage.

## 4. Replay Contract

### 4.1 Capture

Capture every user action that reaches reducer entry.

Persist per action:

- sequence number
- action type
- action payload
- accepted/rejected
- rejection reason (if rejected)
- stage before
- stage after
- confidence before
- confidence after
- uncertainty before
- uncertainty after
- revealed IDs after action

### 4.2 Playback

Replay must:

1. Rehydrate the same model context.
2. Apply captured actions in sequence.
3. Preserve deterministic guards.
4. Produce deterministic final confidence + seal output.
5. Expose mismatch diagnostics when expected stages diverge.

### 4.3 JSON Schema (Operational)

Replay JSON payload fields:

- `version`
- `createdAtIso`
- `routeId`
- `constraintDigest`
- `actions[]`
- `expectedFinalStage`
- `expectedFinalConfidence`
- `expectedFinalUncertainty`
- `expectedSealLevel`

## 5. Test ID Contract

All IDs in this section are required and stable.

### 5.1 Root / Scene IDs

| Test ID | Purpose |
| --- | --- |
| `slide03-scene` | Main slide03 evidence scene root |
| `slide03-stage-chip` | Visible current FSM stage marker |
| `slide03-next-step-chip` | Visible next expected evidence step |
| `slide03-confidence-score` | Numeric confidence display |
| `slide03-uncertainty-score` | Numeric uncertainty display |
| `slide03-revealed-count` | Revealed step count display |

### 5.2 Card IDs

For each step in `{e1,e2,e3}`:

| Test ID | Purpose |
| --- | --- |
| `slide03-card-{step}` | Evidence card container |
| `slide03-card-{step}-state` | Card state label |
| `slide03-card-{step}-gesture` | Gesture interaction rail |
| `slide03-card-{step}-progress` | Gesture progress percentage text |
| `slide03-card-{step}-confirm` | Explicit confirm button |
| `slide03-card-{step}-metric-main` | Main metric value for card |
| `slide03-card-{step}-metric-support` | Support metric value for card |
| `slide03-card-{step}-status-chip` | Armed/Locked/Revealed chip |

### 5.3 Seal IDs

| Test ID | Purpose |
| --- | --- |
| `slide03-seal-readout` | Entire confidence seal panel |
| `slide03-seal-level` | Seal level text (`open`, `forming`, `sealed`) |
| `slide03-seal-band` | Confidence band text |
| `slide03-seal-grade` | Grade text (A/B/C etc.) |
| `slide03-seal-route` | Route identifier in seal panel |
| `slide03-seal-commit` | Explicit final seal commit button |

### 5.4 Replay IDs

| Test ID | Purpose |
| --- | --- |
| `slide03-replay-count` | Captured action count |
| `slide03-replay-build` | Build replay JSON from current log |
| `slide03-replay-play` | Play latest replay payload |
| `slide03-replay-copy` | Copy replay JSON text |
| `slide03-replay-load` | Load replay JSON from textarea |
| `slide03-replay-textarea` | Replay JSON editor |
| `slide03-replay-last-result` | Last replay run summary |

### 5.5 HUD IDs

| Test ID | Purpose |
| --- | --- |
| `slide03-hud-toggle` | Toggle dev HUD visibility |
| `slide03-hud` | HUD panel root |
| `slide03-hud-stage` | HUD stage value |
| `slide03-hud-score` | HUD confidence value |
| `slide03-hud-uncertainty` | HUD uncertainty value |
| `slide03-hud-replay` | HUD replay count value |

### 5.6 Slide Container IDs

| Test ID | Purpose |
| --- | --- |
| `slide03-root` | Top-level slide root |
| `slide03-contract-version` | Contract version marker |

## 6. Reducer Transition Matrix

Legend:

- `A`: action accepted
- `I`: action ignored

| Current State | POINTER_START(expected) | POINTER_START(non-expected) | POINTER_FRAME | POINTER_END | CONFIRM_STEP(expected+armed) | CONFIRM_STEP(other) | RESET_SESSION |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `idle` | A | I | A* | A* | A | I | A |
| `step1` | A | I | A* | A* | A | I | A |
| `step2` | A | I | A* | A* | A | I | A |
| `step3` | I | I | I | I | A** | I | A |
| `sealed` | I | I | I | I | I | I | A |

Notes:

- `A*`: only when active pointer exists and pointer IDs match.
- `A**`: only for explicit final commit action from E3 reveal completion flow.

## 7. Determinism Invariants

The following invariants are mandatory:

1. Same route + constraints + same action sequence => same final state.
2. Same replay payload applied twice => same final state both times.
3. Rejected actions must not mutate reveal order.
4. Confidence must never decrease after a valid reveal.
5. Uncertainty must never increase after a valid reveal.
6. Seal can only become `sealed` after E1, E2, E3 are all revealed.

## 8. E2E Smoke Assertions

Smoke path must validate:

1. Navigate to Slide03.
2. Complete E1 gesture + confirm.
3. Complete E2 gesture + confirm.
4. Complete E3 gesture + confirm.
5. Assert `slide03-seal-level` equals `sealed`.
6. Assert confidence score >= 85.
7. Trigger replay playback from captured actions.
8. Assert sealed state remains deterministic after replay.

## 9. Accessibility & UX Contract

- Cards expose role and labels for gesture and confirm actions.
- Confirm controls are keyboard reachable.
- Disabled states are explicit and deterministic.
- Stage progression has visible text labels independent of color.
- Core path is completable in less than 15 seconds by intentional user interaction.

## 10. Versioning

- Contract version: `slide03-contract-v1`.
- Breaking changes require contract version increment and updated test IDs.
