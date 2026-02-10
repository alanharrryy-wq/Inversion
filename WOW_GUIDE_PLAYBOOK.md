# WOW Guide Playbook

## 1. Mission
Build and run an interactive, deterministic, evidence-first guided demo system.

The guide runtime is designed for:
- Operator assistance.
- Presenter reliability under pressure.
- Verifiable, deterministic state transitions.
- No dependency on cinematic timing.

## 2. Architecture Overview
The new guide architecture lives in `wow/tour/guide/` and is intentionally additive.

### 2.1 Core modules
- `wow/tour/guide/types.ts`
  - Domain model for scripts, evidence, completion rules, runtime actions, and overlay model.
- `wow/tour/guide/schema.ts`
  - Script validation and integrity checks.
- `wow/tour/guide/evidence.ts`
  - Deterministic evidence evaluation and rule resolution.
- `wow/tour/guide/selectors.ts`
  - Read model selectors for active step, blocked reasons, missing evidence, and overlay model.
- `wow/tour/guide/reducer.ts`
  - Predictable reducer/state machine with explicit action transitions.
- `wow/tour/guide/engine.ts`
  - State transition wrapper and helper runtime API.
- `wow/tour/guide/events.ts`
  - Typed guide evidence channel (`wow:guide:evidence`).
- `wow/tour/guide/adapter.ts`
  - Bridge from guide schema to legacy tour shape.
- `wow/tour/guide/registry.ts`
  - Script catalog and resolver.

### 2.2 Script modules
- `wow/tour/guide/scripts/enterprise.ts`
  - Enterprise-compatible deterministic script.
- `wow/tour/guide/scripts/guided-demo.ts`
  - Richer operator-oriented script with stronger evidence declarations.

### 2.3 UI modules
- `wow/tour/guide/ui/GuideProgressHeader.tsx`
- `wow/tour/guide/ui/GuideEvidenceList.tsx`
- `wow/tour/guide/ui/GuideCompletionToast.tsx`
- `wow/tour/guide/ui/GuideOperatorDock.tsx`
- `wow/tour/guide/ui/GuideScaffold.tsx`
- `wow/tour/guide/ui/guide-ui.css`

## 3. Integration Points
These are the integration points used by the guide system:

- `App.tsx`
  - Creates tour engine with `useTourEngine`.
  - Emits slide-level evidence events (`slide:changed`, `slide:entered`) on channel(s).
  - Passes `guideOverlayModel` into `TourOverlay`.

- `wow/tour/useTourEngine.ts`
  - Runtime switch between legacy tour path and new guide path.
  - Consumes `wow:tour-event`, legacy guide channel, and new guide evidence channel.
  - Exposes state + active step + completion + guide overlay model.

- `wow/tour/TourOverlay.tsx`
  - Existing tour coachmark remains intact.
  - New guide scaffold and operator dock rendered only behind guide UI flags.
  - Diagnostics optionally show guide-specific blocker metrics.

- `components/Slide/slideEvents.ts`
  - Bridge emitter to all relevant evidence channels.

- `components/slides/Slide05.tsx`
  - Adds guide anchors and deterministic interaction evidence hooks.
  - Extra-height now separately gated.

## 4. Runtime Model

### 4.1 State machine actions
The reducer in `wow/tour/guide/reducer.ts` supports explicit actions:
- `START`
- `RESTART`
- `STOP`
- `SKIP`
- `NEXT`
- `BACK`
- `SLIDE_CHANGED`
- `EVIDENCE_CAPTURED`

No implicit timing action advances a step.

### 4.2 Completion mechanics
A step can complete via explicit rule resolution:
- `manual`
- `evidence` reference
- `event`
- `slide`
- `all` rule group
- `any` rule group

Each transition is deterministic:
- Same event log + same current slide + same script => same completion result.

### 4.3 Evidence model
Each step can define evidence entries with source type:
- `event`
- `slide`
- `selector`

The evaluator produces:
- Matched evidence set.
- Missing evidence set.
- Human-readable expected/observed traces.
- Blocked reasons for UI.

## 5. Flags and Gating

## 5.1 Required flags (default OFF)
All resolve to false when env vars are absent.

- `VITE_WOW_GUIDE_ENGINE`
- `VITE_WOW_GUIDE_UI`
- `VITE_WOW_OPERATOR_PANEL`
- `VITE_WOW_SLIDE05_EXTRAHEIGHT`

Optional:
- `VITE_WOW_GUIDE_DIAGNOSTICS`

## 5.2 Effective gating behavior
All guide flags are additionally gated by `VITE_WOW_DEMO`.

Examples:
- `WOW_GUIDE_ENGINE = WOW_DEMO && envFlag(VITE_WOW_GUIDE_ENGINE)`
- `WOW_GUIDE_UI = WOW_DEMO && envFlag(VITE_WOW_GUIDE_UI)`
- `WOW_OPERATOR_PANEL = WOW_DEMO && envFlag(VITE_WOW_OPERATOR_PANEL)`
- `WOW_SLIDE05_EXTRAHEIGHT = WOW_DEMO && envFlag(VITE_WOW_SLIDE05_EXTRAHEIGHT)`

## 5.3 Safety behavior
- Flags OFF: legacy overlay and deck behavior remain unchanged.
- Flags ON: guide runtime + guide UI scaffolds activate.
- Operator panel is separate from legacy director panel and has independent gating.

## 6. Script Selection
`VITE_WOW_TOUR_SCRIPT` supports:
- `enterprise`
- `guided-demo`

Resolver behavior:
- Unknown script id falls back to `enterprise`.

## 7. Slide05 Guide Anchors
`Slide05` includes additive guide anchors:
- `data-guide-anchor="slide05-surface"`
- `data-guide-anchor="slide05-narrative"`
- `data-guide-anchor="slide05-modules"`
- `data-guide-anchor="slide05-module-XX"`

Evidence hooks include events:
- `slide05:surface-ready`
- `slide05:module-hover`
- `slide05:module-focus`
- `slide05:module-click`

Extra height is now controlled by:
- `VITE_WOW_SLIDE05_EXTRAHEIGHT`

## 8. UI Behavior

### 8.1 Guide scaffold
When `WOW_GUIDE_ENGINE` + `WOW_GUIDE_UI` are ON:
- Header with script name, status, progress.
- Evidence checklist with missing/satisfied sections.
- Blocked reason list explaining why Next is blocked.
- Success toast.

### 8.2 Operator dock
When `WOW_OPERATOR_PANEL` is also ON:
- Presenter notes.
- Next tease.
- Next step title.
- Current blockers and missing evidence summary.

### 8.3 Legacy compatibility
If `WOW_GUIDE_UI` is OFF:
- Existing tour coachmark remains as before.
- Legacy guide polish widgets continue under existing conditions.

## 9. Determinism Rules
The guide system must remain deterministic:
- No network calls in guide modules.
- No random ids/timing as correctness source.
- Step progression only through explicit reducer actions + evidence evaluation.

Correctness should not depend on animation, delay, or cinematic sequence.

## 10. Evidence Emission Contract

### 10.1 Channel contract
Primary evidence channel:
- `wow:guide:evidence`

Payload shape:
- `name: string`
- `payload?: Record<string, serializable>`
- `ts: number`

### 10.2 Cross-channel bridge
For compatibility, slide events can flow through:
- Legacy guide channel.
- New guide evidence channel.
- Tour event channel.

## 11. Authoring New Guide Steps
Use this checklist for each step:

1. Define step intent.
2. Define explicit evidence list.
3. Define completion rule from evidence.
4. Define operator notes and tease.
5. Define deterministic target selector.
6. Define fallback warning if selector missing.
7. Keep success text concrete and verifiable.

Avoid:
- Timer-driven correctness.
- Non-deterministic dependencies.
- Hidden state assumptions.

## 12. Completion Rule Patterns

### 12.1 Single event
Use when one event proves completion.

### 12.2 All evidence required
Use when safety requires multiple independent proofs.

### 12.3 Any evidence acceptable
Use when multiple operator paths are acceptable.

### 12.4 Slide + event combined
Use for navigation-plus-action gates.

## 13. Diagnostics

### 13.1 Standard diagnostics
`VITE_WOW_DIAGNOSTICS=1` shows general overlay diagnostics.

### 13.2 Guide diagnostics
`VITE_WOW_GUIDE_DIAGNOSTICS=1` adds:
- `guideStep`
- blocker count
- missing evidence count
- satisfied evidence count

## 14. Operator Run Sequence

1. Enable flags.
2. Start guide.
3. Follow evidence checklist.
4. Read blocker explanations before forcing Next.
5. Use operator dock to prepare next transition.
6. Close with explicit commitment and replay if needed.

## 15. Validation Commands

- `npm run wow:guide:smoke`
- `npm run wow:validate`

`wow:validate` executes:
- `npm run typecheck`
- `npm run build`

## 16. Troubleshooting

### Symptom: Next is disabled
- Inspect blocked reasons list.
- Confirm required evidence events are emitted.
- Confirm active slide matches step expectation.
- Confirm target selectors are mounted.

### Symptom: Overlay shows no guide scaffold
- Ensure `VITE_WOW_DEMO=1`.
- Ensure `VITE_WOW_GUIDE_ENGINE=1`.
- Ensure `VITE_WOW_GUIDE_UI=1`.

### Symptom: operator dock not visible
- Ensure `VITE_WOW_OPERATOR_PANEL=1`.
- Toggle operator panel button.

### Symptom: Slide05 does not expand
- Ensure `VITE_WOW_SLIDE05_EXTRAHEIGHT=1`.

## 17. Non-Goals
This system is not designed as a cinematic timeline player.

Non-goals:
- Timer-based autoplay as correctness mechanism.
- Randomized transitions.
- Network-dependent progression logic.

## 18. Change Safety Rules
- Keep new guide behavior additive.
- Do not add new global keybinds.
- Avoid modifying unrelated slides for guide logic.
- Keep forbidden slides untouched (`Slide09.tsx`, `Slide16.tsx`).

## 19. Hand-off Notes
For future polish work:
- UI styling can be upgraded independently of reducer/evidence architecture.
- Script copy can evolve without engine refactor.
- Operator language can be localized without touching state machine internals.

## 20. Quick Env Example

```env
VITE_WOW_DEMO=1
VITE_WOW_TOUR=1
VITE_WOW_TOUR_SCRIPT=guided-demo
VITE_WOW_GUIDE_ENGINE=1
VITE_WOW_GUIDE_UI=1
VITE_WOW_OPERATOR_PANEL=1
VITE_WOW_SLIDE05_EXTRAHEIGHT=1
VITE_WOW_GUIDE_DIAGNOSTICS=0
```

## 21. Summary
The guide runtime now provides:
- Deterministic reducer/state-machine transitions.
- Evidence-first completion logic with explainable blockers.
- Script registry with enterprise + guided-demo flows.
- Operator/presenter scaffolds behind safe default-off flags.
- Additive Slide05 evidence anchors with independent extra-height gating.
