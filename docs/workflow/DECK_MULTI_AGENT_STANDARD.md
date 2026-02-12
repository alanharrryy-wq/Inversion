# INVERSION · DECK MULTI-AGENT STANDARD
Version: v1.1  
Owner: Deck Architecture  
Status: ACTIVE

---

## 0. NON-NEGOTIABLE SAFETY (ANTI-DELETION)

### ABSOLUTE RULE
UNLESS A FILE WAS CREATED BY THE SAME AGENT IN THE SAME RUN,
IT MUST NOT BE DELETED, RENAMED, OR MOVED.

#### PROHIBITED OPERATIONS
- Deleting any existing file not created in this run
- Renaming existing files or folders
- Moving files across folders
- Deleting slide wrappers (Slide0X.tsx)
- Deleting router, nav, registry, config, or shared code
- Deleting tests or docs from other slides

#### IF A DELETE IS NEEDED
- DO NOT PERFORM IT
- Document it inside CODEX_OUTPUT_*.txt under:

\\\
DELETION_REQUESTS:
  - <path> — <reason>
\\\

If uncertain → assume NOT allowed.

Violating this rule = INVALID AGENT OUTPUT.

---

## 1. PURPOSE

This document defines the official operating system for:
- Multi-agent Codex execution
- Strict scope isolation
- Reproducible artifacts
- Deterministic interaction
- Deck-level integrity

Goal:
NOT pretty isolated slides  
BUT a deterministic, navigable, testable deck end-to-end.

---

## 2. SINGLE SOURCE OF TRUTH

### Slide truth
components/slides/slide0X-ui/**

### Deck integration truth
Router + Slide Registry + SlideNav

### Audit / Legal truth
CODEX_OUTPUT_*.txt at repo root

If it is not in CODEX_OUTPUT, it does not exist.

---

## 3. MULTI-AGENT WORKFLOW

- Each Codex agent owns exactly ONE slide
- Each agent runs in isolation (branch/worktree)
- No cross-slide edits
- No router/nav edits unless Deck Glue Agent
- Every agent MUST output CODEX_OUTPUT

---

## 4. SLIDE DIRECTORY CONTRACT

components/slides/
  Slide0X.tsx            ← thin wrapper ONLY
  slide0X-ui/
    core/
      fsm/
      model/
      replay/
    ui/
      scene/
      panels/
      atoms/
      hud/
    tests/
    index.ts

docs/slide0X/
  00-contract.md
  REPORT.md

tests/e2e/
  slide0X-*.e2e.spec.ts

---

## 5. WHAT "DONE" MEANS (REAL CHECKLIST)

A slide is DONE when ALL are true:

- Typecheck passes  
- Build passes  
- Renders with safe defaults  
- Deterministic FSM (no timers)  
- Explicit COMMIT / SEAL action  
- Non-gesture fallback exists  
- Replay export/import deterministic  
- Unit tests pass  
- 1 smoke e2e passes  
- slide-0X-root data-testid exists  
- CODEX_OUTPUT_Slide0X.txt exists

Not required:
- Visual polish
- Animations
- Final copy

---

## 6. SACRED RULES

- No setTimeout / setInterval
- No autoplay
- No hidden mutable state
- No cross-slide imports
- No router edits (unless Deck Glue)
- data-testid immutability
- Replay schema immutability
- NO DELETIONS (see section 0)

---

## 7. TEST ID CONTRACT

Required:
\\\
data-testid="slide-0X-root"
\\\

Plus:
- primary-action
- commit-seal
- replay-export
- replay-import
- reset (if exists)

Navigation (global):
- nav-prev
- nav-next
- nav-current-index
- nav-current-id

---

## 8. REPLAY CONTRACT

- Replay captures reducer-level actions
- JSON serializable
- Replayed through same reducer
- Identical end state required

Schema changes are breaking.

---

## 9. DECK GLUE AGENT

ONLY Deck Glue Agent may:
- Modify router
- Modify registry
- Modify SlideNav
- Modify Playwright global config
- Add deck-level e2e

---

## 10. FINAL SUCCESS CONDITION

Slide00 → Slide01 → Slide02 → Slide03 → Slide04

- Navigable
- Buildable
- Smoke-tested

END OF STANDARD
