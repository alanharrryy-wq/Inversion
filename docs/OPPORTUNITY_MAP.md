# OPPORTUNITY_MAP

## Prioritized Opportunities (Evidence-Based)

| ID | Opportunity | Evidence | Expected Benefit | Confidence |
|---|---|---|---|---|
| OPP-01 | Repair stale docs index links | `docs/INDEX.md` points to missing files: `docs/runbooks/30_TOOLING_SCRIPTS.md`, `docs/runbooks/40_RELEASE_DEMO_CHECKLIST.md`, `docs/reference/TESTID_CONTRACT.md`, `docs/reference/FLAGS_AND_MODES.md` | Restores trust in docs navigation and operator onboarding | HIGH |
| OPP-02 | Resolve slide-7 dual implementation ambiguity | `components/SlideRenderer.tsx` mounts `Slide7`; `components/slides/Slide07.tsx` exists but is not referenced | Reduces maintenance split and test confusion | MEDIUM (`HYPOTHESIS`: `Slide07.tsx` may be an intended future replacement) |
| OPP-03 | Document or normalize index-11 naming contract | `components/SlideRenderer.tsx` maps slot `11` to `Slide12` while labels include `"Slide11"` | Prevents operator/test mismatch when addressing slide numbers | MEDIUM (`UNKNOWN`: legacy compatibility requirement) |
| OPP-04 | Expand deterministic E2E coverage for unowned slide ranges | E2E suite has dedicated specs for 00-04 plus selected domain checks in `demo.e2e.spec.ts` (07 and 13). No dedicated specs named for 05, 06, 08, 09, 10, 12, 14-19 | Lower regression risk for currently less-observed slides | MEDIUM (`HYPOTHESIS`: some coverage may still be indirect) |
| OPP-05 | Reduce repo-root artifact clutter | Filtered index shows `54` root files including many `CODEX_OUTPUT_*.txt` and audit text artifacts | Faster repo scanning and cleaner operator workflows | HIGH |
| OPP-06 | Burn down explicit runtime TODO markers | TODOs in `components/slides/Slide00.tsx` and `components/slides/Slide7.tsx` | Reduces deferred behavior uncertainty in active UI paths | HIGH |

## Suggested Execution Order

1. OPP-01 (docs integrity)
2. OPP-02 and OPP-03 (slide mapping consistency)
3. OPP-04 (coverage depth)
4. OPP-06 (explicit TODO cleanup)
5. OPP-05 (artifact organization policy)

## Constraints For Opportunity Work

- Preserve deterministic/offline defaults.
- Keep `/api/ai` boundary and guard scripts intact.
- Treat slide index mapping changes as high-impact; run relevant E2E after any move.
