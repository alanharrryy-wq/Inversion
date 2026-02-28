# Slide Blueprint Master Plan
- Generated from `SLIDES_CATALOG.json` `mainRoute` (single authority).
- Enumerated route is sequential and gapless.

## Narrative spine (executive)
Money (00 Boot / Authority) -> Motor (01 Route Engine, 02 Hitech OS, 03 Evidence Ladder, 04 Lock Engine, 12 KPI Ritual) -> Money (08 Projection) -> Scale (07 Operational Model) -> Investment (09 Investment Model) -> Product (05 Experience & Stack) -> Vertical (10 Vertical) -> Architecture (06 Blueprint / Architecture) -> Close (11 Close / Risk / Proof).

## 00 — Boot / Authority
**Catalog identity**
- routeId: "00"
- slideId: "slide00"
- component: "Slide00"  (components/slides/Slide00.tsx)
- classification: CORE
- interactionModel: FSM
- replay: JSON
- determinism: CONDITIONAL
- stableIds: ["slide-00-root"]
- aliases: ["00", "slide00", "Slide00", "slides/00"]

**Role in the narrative spine**
- Establishes operator authority and the first money-critical trust beat: the system arms only through explicit evidence.
- As CORE, it proves obedience under guarded sequence before any downstream commercial claim.

**What it must show (content blocks)**
- First-proof ritual surface (layer stack gesture area + ritual rail + right seal readout).
- Boot panel with arm/confirm state, KPI cards, and state chips.
- Status strip and first-actions rail for visible operator actions.
- Evidence list, boot notes, and hidden/diagnostic state surfaces.
- Diagnostics dock/toggle and operator log context (when enabled).

**Primary interaction contract (single primary gesture)**
- gesture: pointer-hold
- expected user input: pointer down on ritual surface, drag to threshold, sustain hold, then release.
- expected visible feedback: drag/hold/release progress, step status changes, seal status updates, and event/log traces.
- ordered steps / no-skip rule: drag threshold -> hold threshold -> release; release before thresholds is blocked and visibly rejected.

**Evidence hook**
- Replay/export/import exists (JSON trace helpers and snapshot copy/download flows are present).
- Anchor/evidence events are emitted during drag, hold, blocked release, and seal.
- Visual proof is complete when seal reaches final state and evidence rows show satisfied progression.

**Failure modes to avoid (perception)**
- avoid release sealing without drag+hold completion.
- avoid dead ritual surface with no progress feedback.
- avoid action controls that click without state change.
- avoid random state jumps between boot statuses.

## 01 — Route Engine
**Catalog identity**
- routeId: "01"
- slideId: "slide01"
- component: "Slide01"  (components/slides/Slide01.tsx)
- classification: CORE
- interactionModel: FSM
- replay: JSON
- determinism: STRICT
- stableIds: ["slide-01-root"]
- aliases: ["01", "slide01", "Slide01", "slides/01"]

**Role in the narrative spine**
- Converts operator intent into a deterministic route decision that can be defended as the motor start point.
- As CORE, it proves route choice is produced by a controlled gesture path, not narrative preference.

**What it must show (content blocks)**
- Route selector scene with phase chip and HUD toggle.
- Gesture weighing arena with pointer start/current markers and metric bars.
- Outcome evidence panel with winner, reasons, and deterministic score line.
- Replay panel (export/copy/load/replay) and criteria signal panels.

**Primary interaction contract (single primary gesture)**
- gesture: scrub
- expected user input: pointer down + drag inside the weigh arena, then pointer up to commit.
- expected visible feedback: live bias/deliberation/urgency metrics, phase transitions, and resolved winner/headline.
- ordered steps / no-skip rule: aim/weigh must occur before commit on release; decision resolves at gesture commit.

**Evidence hook**
- Replay/export/import exists through trace serialization, sample load, and replay apply.
- The same trace payload reproduces phase/decision outcomes.
- Outcome panel and replay panel jointly expose deterministic decision evidence.

**Failure modes to avoid (perception)**
- avoid drag input that does not affect metrics.
- avoid winner changes without a commit event.
- avoid replay success messages with divergent visible outcomes.
- avoid pointer interaction breaking on touch input.

## 02 — Hitech OS
**Catalog identity**
- routeId: "02"
- slideId: "slide02"
- component: "Slide02"  (components/slides/Slide02.tsx)
- classification: CORE
- interactionModel: REDUCER
- replay: JSON
- determinism: STRICT
- stableIds: ["slide02-root"]
- aliases: ["02", "slide02", "Slide02", "slides/02"]

**Role in the narrative spine**
- Bridges selected route into constrained operating response so money claims are backed by system-state evidence.
- As CORE, it proves reducer-driven outputs update deterministically from route + constraints.

**What it must show (content blocks)**
- Top meta strip with route source, seed route, and active route.
- Controls panel with route selector and strictness/budget/latency controls.
- Optional HUD summary rows with route/constraints/status/signature.
- Evidence panel with decision chips, score cards, evidence rows, and response signature.
- Replay panel with export/stage/apply/clear JSON flow.

**Primary interaction contract (single primary gesture)**
- gesture: scrub
- expected user input: adjust constraint sliders (and route selection where needed).
- expected visible feedback: tightness narrative, badge tones, score cards, evidence rows, and signature refresh.
- ordered steps / no-skip rule: control updates feed reducer state first; replay stage/apply follows as explicit second step.

**Evidence hook**
- Replay/export/import exists via replay JSON export, staging, and apply controls.
- Deterministic response signature is always visible as proof surface.
- Re-applied JSON payload reproduces the same evidence model outputs.

**Failure modes to avoid (perception)**
- avoid slider movement with no evidence update.
- avoid signature values that drift without input change.
- avoid replay apply producing inconsistent chips/rows.
- avoid controls that require hover-only affordances.

## 03 — Evidence Ladder
**Catalog identity**
- routeId: "03"
- slideId: "slide03"
- component: "Slide03"  (components/slides/Slide03.tsx)
- classification: CORE
- interactionModel: FSM
- replay: JSON
- determinism: STRICT
- stableIds: ["slide03-root"]
- aliases: ["03", "slide03", "Slide03", "slides/03"]

**Role in the narrative spine**
- Turns the route thesis into laddered evidence so the motor claim reaches decision-grade confidence.
- As CORE, it proves confidence growth is staged and gated, not arbitrary.

**What it must show (content blocks)**
- Stage/topline chips (stage, next expected, revealed count, seal level).
- Three evidence cards (E1/E2/E3) with gesture tracks, thresholds, progress, and confirm controls.
- Seal readout with route/confidence/uncertainty/band/grade.
- Replay controls and replay JSON draft/readout area.
- Optional HUD with replay count and state telemetry.

**Primary interaction contract (single primary gesture)**
- gesture: scrub
- expected user input: scrub each card gesture track to arm a step, then confirm it.
- expected visible feedback: card progress and status chips, stage progression, revealed count, and seal level upgrade.
- ordered steps / no-skip rule: E1 -> E2 -> E3 sequence is enforced; skipped or out-of-order steps remain blocked/rejected.

**Evidence hook**
- Replay/export/import exists through build/play/load/copy replay JSON controls.
- Replay result and action count are exposed on-screen.
- Seal commit plus revealed progression provides direct evidence of ladder completion.

**Failure modes to avoid (perception)**
- avoid confirming unrevealed or locked steps.
- avoid stage progression without visible card progression.
- avoid replay controls that do not affect state.
- avoid invisible rejection reasons when sequence is violated.

## 04 — Lock Engine
**Catalog identity**
- routeId: "04"
- slideId: "slide04"
- component: "Slide04"  (components/slides/Slide04.tsx)
- classification: CORE
- interactionModel: FSM
- replay: JSON
- determinism: STRICT
- stableIds: ["slide04-root"]
- aliases: ["04", "slide04", "Slide04", "slides/04"]

**Role in the narrative spine**
- Closes the engine loop by sealing route + constraints + evidence into a handoff artifact.
- As CORE, it proves final lock cannot be forced without prerequisite satisfaction.

**What it must show (content blocks)**
- Route selection cards.
- Constraint matrix with state selectors.
- Evidence selection grid.
- Final lock action module with hold button, guard/status text, and progress bar.
- Summary panel with sealed output and replay JSON controls.

**Primary interaction contract (single primary gesture)**
- gesture: pointer-hold
- expected user input: after setting route/constraints/evidence, hold the seal action until full progress, then release.
- expected visible feedback: phase progression (idle/arming/locking/sealed), hold percentage, guard messages, and sealed summary output.
- ordered steps / no-skip rule: prerequisites -> hold completion -> release to seal; early release/cancel does not produce sealed output.

**Evidence hook**
- Replay/export/import exists through encoded replay trace and playback in summary panel.
- Replay hash/status is surfaced after apply/copy/playback actions.
- Sealed summary preview line and hash provide visible lock proof.

**Failure modes to avoid (perception)**
- avoid allowing seal without prerequisite conditions.
- avoid full hold completion with no seal on release.
- avoid replay playback that diverges from original sealed summary.
- avoid missing guard feedback when blocked.

## 05 — Experience & Stack
**Catalog identity**
- routeId: "05"
- slideId: "slide05"
- component: "Slide05ExperienceAndStack"  (components/slides/slide05-experience-stack/Slide05ExperienceAndStack.tsx)
- classification: UI
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: STRICT
- stableIds: ["slide05-fused-root"]
- aliases: ["05", "slide05", "Slide05", "slides/05"]

**Role in the narrative spine**
- Communicates business-facing proof that execution quality and operating stack are already structured.
- As UI, it shows money-relevant credibility surfaces (experience, operational signals, stack) without runtime claim escalation.

**What it must show (content blocks)**
- Experience panel (ISO, LOTO, evidencia, OEM quality cards).
- Operational model signal cards with score readouts and deterministic spark bars.
- Stack de ejecución zone with industrial intelligence stack visualization.

**Primary interaction contract (single primary gesture)**
- gesture: none
- expected user input: no primary gesture; slide is read-first with optional hover emphasis only.
- expected visible feedback: static proof blocks stay legible; hover effects are cosmetic.
- ordered steps / no-skip rule: not applicable.

**Evidence hook**
- Visual proof only: fused experience + operational signals + stack are concurrently visible.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid presenting decorative hover states as if they were required actions.
- avoid content hidden behind hover-only behavior on touch devices.
- avoid unlabeled metrics/signals that cannot be interpreted.

## 06 — Blueprint / Architecture
**Catalog identity**
- routeId: "06"
- slideId: "slide06"
- component: "Slide06"  (components/slides/Slide06.tsx)
- classification: CORE
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: CONDITIONAL
- stableIds: ["slide06-root"]
- aliases: ["06", "slide06", "Slide06", "slides/06"]

**Role in the narrative spine**
- States the architectural chain that makes the motor transferable: input -> process -> output under OEM discipline.
- As CORE, it proves architecture intent is operator-driven and visibly locked/unlocked.

**What it must show (content blocks)**
- Left narrative rail (OEM pedigree + INPUT/PROCESS/EFFECT spec cards).
- Holographic blueprint with three process nodes and flow connectors.
- Blueprint HUD/status line indicating idle/tracking/locked state.
- Invitation/closure panel tied to OEM-readiness framing.

**Primary interaction contract (single primary gesture)**
- gesture: click
- expected user input: click a blueprint node to lock it; click outside to clear the lock.
- expected visible feedback: selected node remains highlighted, detail panel updates, and status line moves between idle/tracking/fixed.
- ordered steps / no-skip rule: optional lock/unlock cycle; no mandatory sequence.

**Evidence hook**
- Visual proof only: architecture path is exposed through node states and explicit input/process/output mapping.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid node clicks with no state transition.
- avoid locked state that cannot be cleared.
- avoid interaction affordances that rely on hover only.
- avoid motion noise obscuring architectural labels.

## 07 — Operational Model
**Catalog identity**
- routeId: "07"
- slideId: "slide07"
- component: "Slide07"  (components/slides/Slide07.tsx)
- classification: BRIDGE
- interactionModel: LOCAL_STATE
- replay: PROGRAMMATIC
- determinism: STRICT
- stableIds: ["slide07-root", "slide07-system-ritual"]
- aliases: ["07", "slide07", "Slide07", "slides/07"]

**Role in the narrative spine**
- Connects architecture to operating behavior: the system advances only when operator gesture satisfies deterministic gates.
- As BRIDGE, it proves motor obedience before moving back to money-facing projection/investment beats.

**What it must show (content blocks)**
- Graph surface with gesture layer, node-link network, hold bar, and release channel.
- Operational rail with drag/hold/release step statuses.
- Event feed of recent domain events.
- RightSeal state panel with canonical operational line.

**Primary interaction contract (single primary gesture)**
- gesture: pointer-hold
- expected user input: pointer down in graph surface, drag to link threshold, hold until check completes, then release.
- expected visible feedback: drag/hold/release progress, step status progression, event feed updates, and sealed state.
- ordered steps / no-skip rule: drag -> hold -> release is mandatory; release before hold-complete does not seal.

**Evidence hook**
- Trace/programmatic replay exists (`runSlide07ReplayScript` and fixture/determinism assertions).
- Domain events are emitted for anchor, gesture completion, and primary evidence satisfaction.
- Seal completion is visible only after ordered gesture completion.

**Failure modes to avoid (perception)**
- avoid sealed state without hold-complete state.
- avoid rail/event feed falling out of sync with graph progress.
- avoid broken pointer capture causing interrupted gesture path.
- avoid non-deterministic progress reset behavior.

## 08 — Projection
**Catalog identity**
- routeId: "08"
- slideId: "slide08"
- component: "Slide12"  (components/slides/Slide12.tsx)
- classification: UI
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: STRICT
- stableIds: ["slide12-projection-root"]
- aliases: ["08", "slide08", "Slide08", "slides/08", "projection"]

**Role in the narrative spine**
- Communicates the money-facing projection: compliance is shown as operational control, not document theater.
- As UI, it packages business proof via contrast between traditional pain and core modules.

**What it must show (content blocks)**
- Traditional panel (reactive pain points).
- CORE HITECH module grid (SmartService, ConditionScore, HealthRadar, FailMatrix).
- Expanded module detail area per card.
- Quote/evidence close bar with audit-ready framing and mini stats.

**Primary interaction contract (single primary gesture)**
- gesture: click
- expected user input: click a core module card to open/close its detail section.
- expected visible feedback: card state toggles (OPEN/CLOSE), detail bullets expand/collapse, and signal bar/state shifts.
- ordered steps / no-skip rule: not required; modules can be opened independently.

**Evidence hook**
- Visual proof only: projection is presented through comparable before/after panels and module detail expansion.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid module cards that look clickable but do not expand.
- avoid hidden details inaccessible on touch.
- avoid visual effects reducing text legibility in expanded state.
- avoid mismatched card state labels (OPEN/CLOSE) versus rendered content.

## 09 — Investment Model
**Catalog identity**
- routeId: "09"
- slideId: "slide09"
- component: "Slide09InvestmentModel"  (components/slides/slide09-investment-model/Slide09InvestmentModel.tsx)
- classification: CORE
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: STRICT
- stableIds: ["slide09-investment-root"]
- aliases: ["09", "slide09", "Slide09", "slides/09"]

**Role in the narrative spine**
- Translates validated motor behavior into investable structure (phases, layers, and economic equation).
- As CORE, it proves the money model is tied to staged execution and explicit risk mitigation.

**What it must show (content blocks)**
- Execution roadmap with phased timeline cards and active phase state.
- Investor layers panel (entry, recurring, upside) plus mitigation stack.
- Economic equation panel (current cost, transformation, generated value).

**Primary interaction contract (single primary gesture)**
- gesture: click
- expected user input: click a roadmap phase card.
- expected visible feedback: active phase highlight updates and progress segments reflect the selected phase.
- ordered steps / no-skip rule: phase selection is direct; no forced sequence.

**Evidence hook**
- Visual proof only: roadmap, layer stack, and equation remain simultaneously visible as investment narrative evidence.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid phase cards that do not update active state.
- avoid equation content appearing dynamic without any visible state signal.
- avoid weak linkage between roadmap phase and investment-layer context.

## 10 — Vertical
**Catalog identity**
- routeId: "10"
- slideId: "slide10"
- component: "Slide17"  (components/slides/Slide17.tsx)
- classification: UI
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: STRICT
- stableIds: ["s17-open-evidence"]
- aliases: ["10", "slide10", "Slide10", "slides/10"]

**Role in the narrative spine**
- Shows vertical portability through a concrete case surface and evidence-first CTA.
- As UI, it communicates business proof by exposing case evidence before KPI commitment.

**What it must show (content blocks)**
- Evidence-open card for case inspection.
- Case summary panel with narrative proof text.
- Optional KPI commitment CTA and finale emphasis states (when flags are active).

**Primary interaction contract (single primary gesture)**
- gesture: click
- expected user input: click the evidence card ("Abrir evidencia").
- expected visible feedback: case modal opens and evidence-opened event is emitted.
- ordered steps / no-skip rule: evidence-open is the primary action; summary remains visible alongside.

**Evidence hook**
- Visual proof only: evidence-open action plus case summary are the visible proof surfaces.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid evidence CTA that does not trigger visible consequence.
- avoid summary claims detached from accessible evidence surface.
- avoid optional CTA elements that appear actionable but are inert.

## 11 — Close / Risk / Proof
**Catalog identity**
- routeId: "11"
- slideId: "slide11"
- component: "Slide11CloseAndRisk"  (components/slides/slide11-close-risk/Slide11CloseAndRisk.tsx)
- classification: UI
- interactionModel: LOCAL_STATE
- replay: NONE
- determinism: STRICT
- stableIds: ["slide11-close-root", "slide11-proof-close"]
- aliases: ["11", "slide11", "Slide11", "slides/11"]

**Role in the narrative spine**
- Consolidates business close by pairing documentary evidence, risk defenses, and final proof statement.
- As UI, it communicates investment safety through explicit risk-to-mitigation mapping.

**What it must show (content blocks)**
- Document evidence stack (SOPs, checklists, planos, bitácoras).
- Risk defense matrix grid (técnico, financiero, operativo, escalabilidad).
- Final proof close block with explicit closing quote.

**Primary interaction contract (single primary gesture)**
- gesture: none
- expected user input: no primary gesture; content is read-first with optional hover reveal effects.
- expected visible feedback: static close-proof composition remains visible at all times.
- ordered steps / no-skip rule: not applicable.

**Evidence hook**
- Visual proof only: documentary stack + risk mitigation grid + final close statement are co-present.
- No replay/export/import system claim on this slide.

**Failure modes to avoid (perception)**
- avoid final close text without accompanying risk/document evidence blocks.
- avoid hover-only details that vanish on touch contexts.
- avoid risk entries that do not visibly pair risk and mitigation.

## 12 — KPI Ritual
**Catalog identity**
- routeId: "12"
- slideId: "slide12"
- component: "Slide13"  (components/slides/Slide13.tsx)
- classification: CORE
- interactionModel: FSM
- replay: PROGRAMMATIC
- determinism: STRICT
- stableIds: ["slide12-kpi-root"]
- aliases: ["12", "slide12", "Slide12", "slides/12", "kpi-ritual"]

**Role in the narrative spine**
- Re-closes the motor with KPI sealing: threshold control, freeze, and final evidence commit.
- As CORE, it proves KPI evidence is not passive reporting; it is produced by explicit deterministic gesture.

**What it must show (content blocks)**
- KPI ritual header with progress narrative.
- KPI surface with dashboard underlay and full-surface gesture layer.
- Threshold rail, drag/hold/release readouts, and rail index indicators.
- KPI rail step tracker, RightSeal state panel, and debug overlay.

**Primary interaction contract (single primary gesture)**
- gesture: pointer-hold
- expected user input: drag threshold marker, sustain motion/pressure to complete hold, then release to seal.
- expected visible feedback: drag/hold/release progress, rail index movement, seal state transitions, and right-seal collapse at completion.
- ordered steps / no-skip rule: drag -> hold -> release; sealed/collapsed state only appears after hold completion and release.

**Evidence hook**
- Trace/programmatic replay exists (`replaySlide13Events` and fixture assertions).
- Runtime emits anchor/gesture/state/evidence events through deterministic transition outputs.
- Primary evidence is visible when completed + rightSealCollapsed are both true.

**Failure modes to avoid (perception)**
- avoid seal completion without passing drag and hold thresholds.
- avoid rail/threshold indicators not matching gesture progress.
- avoid release-before-hold producing sealed state.
- avoid emitted-event diagnostics that disagree with visible seal state.

## Engine distribution summary
| Route | Title | Classification | Interaction | Replay | Determinism | Component |
|---|---|---|---|---|---|---|
| 00 | Boot / Authority | CORE | FSM | JSON | CONDITIONAL | Slide00 (components/slides/Slide00.tsx) |
| 01 | Route Engine | CORE | FSM | JSON | STRICT | Slide01 (components/slides/Slide01.tsx) |
| 02 | Hitech OS | CORE | REDUCER | JSON | STRICT | Slide02 (components/slides/Slide02.tsx) |
| 03 | Evidence Ladder | CORE | FSM | JSON | STRICT | Slide03 (components/slides/Slide03.tsx) |
| 04 | Lock Engine | CORE | FSM | JSON | STRICT | Slide04 (components/slides/Slide04.tsx) |
| 05 | Experience & Stack | UI | LOCAL_STATE | NONE | STRICT | Slide05ExperienceAndStack (components/slides/slide05-experience-stack/Slide05ExperienceAndStack.tsx) |
| 06 | Blueprint / Architecture | CORE | LOCAL_STATE | NONE | CONDITIONAL | Slide06 (components/slides/Slide06.tsx) |
| 07 | Operational Model | BRIDGE | LOCAL_STATE | PROGRAMMATIC | STRICT | Slide07 (components/slides/Slide07.tsx) |
| 08 | Projection | UI | LOCAL_STATE | NONE | STRICT | Slide12 (components/slides/Slide12.tsx) |
| 09 | Investment Model | CORE | LOCAL_STATE | NONE | STRICT | Slide09InvestmentModel (components/slides/slide09-investment-model/Slide09InvestmentModel.tsx) |
| 10 | Vertical | UI | LOCAL_STATE | NONE | STRICT | Slide17 (components/slides/Slide17.tsx) |
| 11 | Close / Risk / Proof | UI | LOCAL_STATE | NONE | STRICT | Slide11CloseAndRisk (components/slides/slide11-close-risk/Slide11CloseAndRisk.tsx) |
| 12 | KPI Ritual | CORE | FSM | PROGRAMMATIC | STRICT | Slide13 (components/slides/Slide13.tsx) |

## Open questions (documentation only)
- Unknown whether `CONDITIONAL` determinism on Slide 00 and Slide 06 should be interpreted only as visual-time allowances or also as interaction-state allowances.
- Unknown whether hover-only reveal layers (notably in Slides 05 and 11) are considered canonical behavior for touch-first contexts.
- Unknown whether Slide 08 (mapped to `Slide12`) has projection-specific stable IDs beyond `slide12-projection-root`.
- Unknown whether Slide 09 economic figures are fixed canonical deck values or placeholder narrative constants.
- Unknown whether Slide 10 evidence payload is intentionally empty (`openModal([], "CASO SRG")`) in canonical blueprint state.
