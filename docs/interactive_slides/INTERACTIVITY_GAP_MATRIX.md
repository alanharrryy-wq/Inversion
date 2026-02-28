# INTERACTIVITY_GAP_MATRIX

| Component | Exists | Partial | Missing | Risk | Required Action |
|---|---|---|---|---|---|
| Slide runtime routing (`App.tsx` custom parser) | Yes | Yes | No schema contract | Medium | Extract route parser + canonical contract module and test route edge cases |
| Slide registry (`SlideRenderer.tsx`) | Yes | Yes | Generated contract | High | Replace manual array with schema-driven registry validation |
| Slot naming integrity (Slide7/Slide07, Slide12 slot11) | No | Yes | Canonical naming policy | High | Add lint/tooling rule for slot/component/label alignment |
| Boot runtime engine (`runtime/boot/*`) | Yes | No | Cross-slide integration hooks | Medium | Extend boot evidence hooks beyond slide00 for full deck lifecycle |
| Evidence state engine (`runtime/evidence/*`) | Yes | Yes | Wider event adoption | Medium | Map all interactive slides to explicit evidence keys/transitions |
| Guide runtime engine (`wow/tour/guide/*`) | Yes | Yes | Full slide coverage | Medium | Add scripts/evidence for slides not covered by current enterprise flow |
| Legacy + guide dual path (`useTourEngine`) | Yes | Yes | Unified runtime mode | Medium | Phase to single runtime mode once guide coverage complete |
| Slide00 first-proof ritual | Yes | No | None critical | Low | Keep and reuse as contract template for other ritual slides |
| Slide01-04 UI domains | Yes | No | None critical | Low | Maintain thin orchestrators and pure core tests |
| Slide05 interactive modules | Yes | Yes | Dedicated `slide05-ui` domain | Medium | Extract core reducer/events/tests into `slide05-ui` |
| Slide06 monolith interactivity | No | Yes | Modular core/ui split | High | Decompose into `slide06-ui/{core,ui,tests}` and remove inline monolith logic |
| Slide07 routeb runtime | Yes | Yes | Mounted contract consistency | High | Resolve mounted component mismatch (`Slide7` vs `Slide07`) |
| Slide08 static architecture slide | Yes | Yes | Interactive proof hooks | Medium | Add minimal evidence events and deterministic surface test ids |
| Slide09 monolith ritual | No | Yes | Modular decomposition | High | Split BG/FX/UI/state into dedicated files + add reducer tests |
| Slide10 static doc slide | Yes | Yes | Interactive evidence path | Medium | Add click/selection evidence events for doc interactions |
| Slide12 monolith core modules | Yes | Yes | Domain folder extraction | High | Move module state transitions to `slide12-ui/core` and add replay tests |
| Slide13 KPI ritual | Yes | Yes | Shared ritual base abstraction | Medium | Create reusable gesture ritual primitives across slide07/13 |
| Slide14/15 static slides | Yes | Yes | Interaction contracts | Medium | Add minimal deterministic interactions and test ids |
| Slide16 monolith (3233 LOC) | No | Yes | Full modular architecture | High | Split into runtime core + UI adapters + overlay module + tests |
| Slide16_Investor static view | Yes | Yes | Runtime-backed KPI hooks | Medium | Add event contracts for critical investor actions |
| Slide17 case reveal | Yes | Yes | Real asset-backed evidence media | High | Replace empty modal payload with manifest-backed assets |
| Slide18/19 static closing slides | Yes | Yes | Interaction instrumentation | Medium | Add explicit action anchors and smoke assertions |
| Animation policy engine | No | Yes (tokens scattered) | Central policy/budget runtime | High | Introduce `runtime/animation/*` and per-slide animation budgets |
| Asset loader engine | No | No | Manifest + loader + validator | High | Implement manifest generator and runtime resolver |
| Audio/media engine | No | No | Full engine | Medium | Add disabled-by-default media cue runtime and contracts |
| Deterministic clock service | No | Yes (ad-hoc timestamps) | Shared clock abstraction | High | Introduce injected clock for reducers/replay/tests |
| Build determinism guard | Yes (partial) | Yes | Timestamp/report drift checks | Medium | Add deterministic artifact checker in tooling gate |
| E2E smoke coverage breadth | Yes | Yes (00-04 heavy) | Per-slide smoke for 05-19 | High | Add lightweight per-slide route+primary interaction smoke tests |
| Unit coverage of monolith logic | No | Yes | Reducer-level tests for 06/09/12/16 | High | Extract pure logic and add focused unit suites |
