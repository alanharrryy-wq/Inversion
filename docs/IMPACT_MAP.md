# IMPACT_MAP

## Impact Matrix

| Surface | Primary Files | Direct Impact | Downstream Impact | Minimum Validation | Confidence |
|---|---|---|---|---|---|
| Deck routing and URL sync | `App.tsx` | Changes slide parsing, normalization, history path updates | Breaks navigation test IDs and route entry behavior | `tests/e2e/deck-smoke-00-04.e2e.spec.ts`, `tests/e2e/demo.e2e.spec.ts` | HIGH |
| Slide registry and dispatch | `components/SlideRenderer.tsx`, `components/slides/Slide*.tsx` | Changes which slide mounts at each index and required props | Regressions in slide-specific E2E and runtime overlays | Slide-specific E2E specs (`slide00`, `slide01`, `slide02`, `slide03`, `slide04`, `demo`) | HIGH |
| Boot gate and evidence lifecycle | `runtime/boot/*`, `runtime/evidence/*`, `components/slides/Slide00.tsx` | Changes arm/confirm/override behavior and evidence satisfaction | WOW tour/demo gating and diagnostics visibility shift | `tests/unit/boot-*.unit.ts`, `tests/e2e/slide00-boot-gate.e2e.spec.ts` | HIGH |
| WOW flags, tour orchestration, overlays | `config/wow.ts`, `wow/tour/*`, `App.tsx`, `components/AIChat.tsx` | Changes feature enablement and event-driven tour progression | Tour/manual-start contract and operator UX can regress | `tests/unit/wow-guide-*.unit.ts`, `tests/e2e/demo.e2e.spec.ts` | HIGH |
| AI boundary and API contract | `components/AIChat.tsx`, `server/index.ts`, `vite.config.ts` | Changes chat transport, `/api/ai` request shape, timeout/stub behavior | Boundary/security checks and demo deterministic mode can fail | `tests/e2e/gemini-boundary.e2e.spec.ts`, `tests/e2e/demo.e2e.spec.ts`, `scripts/client-boundary-guard.mjs` | HIGH |
| Guardrail scripts and build gates | `scripts/no-rework-guard.mjs`, `scripts/client-boundary-guard.mjs`, `package.json` | Changes pass/fail policy for build/verify/test workflows | CI/local operator flow may block or miss regressions | `npm run build`, `npm run verify`, direct script runs | MEDIUM |
| Playwright harness topology | `playwright.config.ts`, `tests/e2e/*.config.ts` | Changes server boot mode, base URL, and test scope | False positives/negatives in E2E and artifact collection | `npm run test:e2e` and per-config smoke runs | MEDIUM |
| Docs-only map artifacts | `NOTEBOOK.md`, `docs/*.md`, `docs/_generated/*` | No runtime impact | Can mislead operators if stale/inaccurate | Manual doc review against source files | HIGH |

## Cross-Cutting Dependencies

1. `App.tsx` is the highest centrality file: slide index, URL state, providers, overlays, and chat mounting all converge here.
2. `config/wow.ts` and `runtime/boot/wowGate.ts` jointly control whether tour/demo features are reachable.
3. `components/AIChat.tsx` depends on frontend flags and the backend route contract in `server/index.ts`.
4. `SlideRenderer` index mapping controls which test IDs exist at runtime, affecting most E2E assertions.

## Sensitive Contracts To Preserve

- URL contract: `/slides/NN`
- API contract: `POST /api/ai` with `{ mode, message }`
- Deterministic stub path when backend is disabled/not configured/demo mode
- Boot evidence key `evidence:system:armed` as blocker for WOW feature gates
- No-rework and client-boundary script enforcement in build/test pipelines
