# PLAYWRIGHT RUNBOOK — DETERMINISM / DEBUG / ARTIFACTS
STATUS: ACTIVE
GOAL: stable smoke tests that never gaslight the operator.

## 0) Canon Commands
From repo root:
- Typecheck:
  - `npm run typecheck`
- Build:
  - `npm run build`
- Deck smoke (config scoped):
  - `npx playwright test -c tests/e2e/deck.playwright.config.ts`

## 1) Deterministic Contract (What must exist)
### Navigation contract (App.tsx)
Required test ids:
- `nav-prev`
- `nav-next`
- `nav-jump-*`
- `nav-current-index`
- `nav-current-id`

### Slide root contract
Each slide must have a stable mounted root id used by tests:
- `slide-00-root`
- `slide02-root`
- `slide03-root`
- `s04-root`
(and so on; keep naming consistent)

Tests must assert:
1) nav current index/id first
2) then slide root visibility

This prevents false positives due to animation / delayed mounting.

## 2) Failure Artifacts (When things break)
Playwright is configured for failure-only capture:
- screenshot: `only-on-failure`
- trace: `retain-on-failure`

Additionally, deck smoke adds a manual screenshot on root visibility failure:
- `test-results/deck-smoke-root-failure-<root>.png`

## 3) Debugging Strategy (Fast and brutal)
When smoke fails:
1) Check `nav-current-index` and `nav-current-id` values printed in diagnostics.
2) Open the failure screenshot:
   - `test-results/deck-smoke-root-failure-*.png`
3) If trace exists, open it (Playwright HTML report or trace viewer).
4) Confirm the root test id matches the actual mounted wrapper.

## 4) Writing Tests (Rules)
- Prefer robust selectors: `getByTestId(...)`
- Avoid CSS selectors and text selectors where possible.
- Avoid timing guesses. Assert state.
- If you must wait, wait on a deterministic signal (nav contract, root, state).

## 5) When to Add New Smoke Tests
- Only when it increases determinism and confidence.
- Keep it minimal: 1 representative path per critical surface.
- Add “failure-only diagnostics” instead of adding more waits.

## 6) Avoid These Mistakes
- Adding global keybinds for test convenience (forbidden).
- Relying on animation timing or setTimeout.
- Using brittle DOM structure selectors.
- Testing high-complexity slides early if it causes flakiness unless explicitly required.

## 7) Output Policy
Every Playwright-related change must be documented in CODEX_OUTPUT:
- file diffs
- exact command logs
- and the pass/fail result

Determinism > speed.
Evidence > vibes. 😈🔥