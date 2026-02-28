# INTERACTIVE_SLIDES_ARCHITECTURE

## Target architecture objective
Create a deterministic, modular slide platform where each slide can scale 10x without leaking logic across domains.

## Layered engine model

### 1) Slide Runtime Core

**Responsibility**
- App-level orchestration of slide lifecycle, URL-state synchronization, and provider bootstrapping.
- Slot-to-slide registry and lifecycle hooks for `slide:entered` events.

**Public API surface (target)**
- `resolveSlideRoute(location): SlideRoute`
- `slideRouteToPath(route): string`
- `mountSlide(slot, context): ReactNode`
- `onSlideEntered(slot, metadata): void`

**Where code should live (target)**
- `runtime/slides/core/*`
- `runtime/slides/router/*`
- `runtime/slides/contracts/*`
- Thin orchestration only in `App.tsx` and `components/SlideRenderer.tsx`.

**Expandability strategy**
- Keep runtime index mapping and route parsing in pure modules.
- Slide registry generated from schema, not hand-edited array literals.

**Current exists vs missing**
- Exists:
  - manual orchestration in `App.tsx`
  - manual registry in `components/SlideRenderer.tsx`
- Missing:
  - shared typed route contract
  - canonical slide schema source for slot mapping
  - generated registry + lint guard for orphan slides

---

### 2) Interactivity Engine

**Responsibility**
- Normalize interactive gestures/events into deterministic domain events.
- Provide per-slide reducers/transition contracts and replayability.

**Public API surface (target)**
- `createInteractionSession(slideId, config)`
- `dispatchInteraction(event)`
- `selectInteractionSnapshot(state)`
- `replayInteractions(script)`

**Where code should live (target)**
- `runtime/interactivity/core/*`
- `runtime/interactivity/events/*`
- `runtime/interactivity/replay/*`
- Slide adapters in `components/slides/slideXX-ui/interactions/*`.

**Expandability strategy**
- Event contracts first, UI adapters second.
- Reducers pure and side-effect free; side effects in adapters.

**Current exists vs missing**
- Exists:
  - mature per-slide reducers in `slide00-ui/first-proof`, `slide07-ui/routeb`, `slide13-ui/routeb`
  - guide/tour evidence event channels
- Missing:
  - shared cross-slide interaction contract
  - unified event namespace governance
  - deterministic clock injection across all slide engines

---

### 3) Animation Engine

**Responsibility**
- Centralize animation tokens, timing tiers, and performance budgets.
- Enforce reduced-motion and heavy-FX policy per slide.

**Public API surface (target)**
- `getAnimationTier(slideId, runtimeMode): AnimationTier`
- `resolveMotionToken(tokenName): string`
- `withReducedMotionFallback(effect): EffectSpec`

**Where code should live (target)**
- `runtime/animation/tokens/*`
- `runtime/animation/policies/*`
- `runtime/animation/perf/*`

**Expandability strategy**
- Keep CSS tokens and JS policy in lock-step via generated token maps.
- Add per-slide animation budget manifests.

**Current exists vs missing**
- Exists:
  - token-like CSS (`wow/tour/motion.tokens.css`, `wow/tour/tokens.css`)
  - `DeckModeProvider` heavy-FX whitelist behavior
- Missing:
  - centralized animation policy engine
  - frame-budget enforcement and diagnostics hooks
  - single source for animation tiering outside inline slide code

---

### 4) State Engine

**Responsibility**
- Provide deterministic global state slices for boot, evidence, guide, and slide runtime status.
- Isolate state reducers from UI rendering concerns.

**Public API surface (target)**
- `dispatchRuntime(action)`
- `selectRuntimeSnapshot(state)`
- `serializeRuntimeSnapshot(state)`
- `restoreRuntimeSnapshot(snapshot)`

**Where code should live (target)**
- Existing:
  - `runtime/boot/*`
  - `runtime/evidence/*`
  - `wow/tour/guide/*`
- Add:
  - `runtime/slides/state/*` for cross-slide runtime metadata.

**Expandability strategy**
- Maintain one-way data flow: reducer -> selector -> UI adapter.
- All transitions typed and replay-friendly.

**Current exists vs missing**
- Exists:
  - solid boot/evidence reducer architecture
  - guide schema + reducer + selector stack
- Missing:
  - cross-slide state registry (beyond boot/tour)
  - deterministic ID/time service abstraction

---

### 5) Asset Loader Engine

**Responsibility**
- Resolve and validate local assets from deterministic manifest.
- Prevent missing/duplicate assets and provide preflight checks.

**Public API surface (target)**
- `loadAsset(assetId)`
- `getAssetManifest()`
- `validateAssetRef(ref)`
- `preloadAssets(slideId)`

**Where code should live (target)**
- `runtime/assets/loader/*`
- `runtime/assets/manifest/*`
- build tooling under `tools/analysis/*` and `tools/assets/*`.

**Expandability strategy**
- Manifest-first approach with stable IDs and SHA-256.
- Slide-level asset groups for preload budgets.

**Current exists vs missing**
- Exists:
  - no dedicated loader; ad-hoc string paths
- Missing:
  - local media asset directory convention
  - deterministic `assets.json` manifest
  - runtime resolver + validation hook

---

### 6) Audio/Media Engine

**Responsibility**
- Optional controlled playback/synchronization for audio/video cues.
- Track media readiness and fallback behavior deterministically.

**Public API surface (target)**
- `registerMediaCue(cue)`
- `playCue(cueId)`
- `stopCue(cueId)`
- `selectMediaState()`

**Where code should live (target)**
- `runtime/media/core/*`
- `runtime/media/contracts/*`
- slide adapters in `components/slides/slideXX-ui/media/*`.

**Expandability strategy**
- Disabled-by-default runtime service with explicit policy gates.
- Deterministic no-op path in smoke/test mode.

**Current exists vs missing**
- Exists:
  - no explicit media engine (voice mode is flagged but limited)
- Missing:
  - media cue contracts
  - deterministic playback policy

---

### 7) Tooling Layer

**Responsibility**
- Deterministic analysis, validation, and generation tools for slide factory work.
- Provide safe CI gates and worker-ready outputs.

**Public API surface (target)**
- `scan-slides`
- `generate-asset-manifest`
- `validate-slide-contracts`
- `validate-build-determinism`

**Where code should live (target)**
- `tools/analysis/*`
- `tools/foundation_scan/*`
- thin wrappers in `scripts/*.ps1` / `scripts/*.mjs`

**Expandability strategy**
- Keep scanners deterministic (no timestamps in required output unless explicitly optional).
- Emit machine-readable JSON consumed by aggregator worker.

**Current exists vs missing**
- Exists:
  - strong guard scripts and smoke scripts
  - foundation scan Python package
- Missing:
  - slide-focused deterministic scanner baseline (added in this iteration at `tools/analysis/scan_slides.py`)
  - formal determinism checker for report metadata and runtime clocks

## Contract boundaries (must stay strict)
- UI must not own business/runtime rules.
- Runtime reducers must not import UI components.
- Tooling must validate contracts, not mutate runtime state.
- Asset resolution must flow through manifest; no ad-hoc external fallback for production/demo-critical flows.

## Path map (recommended target)
- `runtime/slides/core/*`
- `runtime/slides/router/*`
- `runtime/slides/contracts/*`
- `runtime/interactivity/*`
- `runtime/animation/*`
- `runtime/assets/*`
- `runtime/media/*`
- `components/slides/slideXX-ui/{core,ui,interactions,tests,index.ts}`
- `tools/analysis/*`
- `tools/assets/*`

## Immediate architectural priorities
1. Remove slot/component ambiguity (`Slide7` vs `Slide07`, `Slide12` in slot 11 naming chain).
2. Extract monolith slide runtimes into `slideXX-ui/core` reducers and adapters.
3. Introduce deterministic clock service consumed by boot, guide, and slide runtimes.
4. Introduce manifest-based asset loader before enabling richer media surfaces.
5. Keep entry points thin: `App.tsx` and `SlideXX.tsx` orchestrate only.
