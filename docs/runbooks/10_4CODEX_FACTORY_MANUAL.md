# 4 CODEX FACTORY MANUAL — WORKTREES / ISOLATION / DELIVERY
STATUS: LAW
GOAL: parallel progress without corruption.

## 0) The One Rule
✅ One Codex agent = one worktree + one branch + one VS Code window  
❌ Never run multiple agents in the same working tree

This exists because mixed work destroyed trust before.

## 1) Standard Folder Pattern (Example)
- Main:
  - `F:\...\repos\Inversion`
- Worktrees:
  - `F:\...\repos\Inversion__codex-A__slide01-05`
  - `F:\...\repos\Inversion__codex-B__slide07`
  - `F:\...\repos\Inversion__codex-C__tooling`

Naming convention:
`<RepoRoot>__codex-<Letter>__<scope>`

## 2) Agent Roles (Default)
- CODEX-A — Deck glue & determinism:
  - navigation contract
  - Playwright config
  - smoke stability
  - only touches allowed deck-level surfaces
- CODEX-B — One slide surface (single slide)
- CODEX-C — Another slide surface (single slide)
- CODEX-D — Tooling/docs/scripts OR another slide

Do not cross scopes.

## 3) Delivery Contract (Non-negotiable)
Every agent must output:
- `CODEX_OUTPUT_<Scope>.txt` at repo root with:
  - WHAT CHANGED
  - FILES CREATED / MODIFIED
  - DELETION_REQUESTS (never delete silently)
  - COMMAND LOGS (typecheck/build/tests)
  - DIFFS (full diff)
  - FINAL SUMMARY

If it’s not in CODEX_OUTPUT, it didn’t happen.

## 4) Anti-Deletion Discipline
- Do NOT delete existing files unless explicitly approved.
- If deletion is needed, list it under DELETION_REQUESTS with reason.
- Large refactors are forbidden unless explicitly tasked.

## 5) Required Validation (Minimum)
After each agent run:
- `git status`
- `git diff --stat`
- `npm run typecheck`
- `npm run build`
- smoke e2e relevant to the touched surface

## 6) Worktree Corruption (Orphan `.git` missing)
Symptom:
`fatal: validation failed... '.git' does not exist`

Cause:
Folder got deleted partially but metadata remains in `.git/worktrees/...`

Fix:
Use the repo script(s) under:
- `scripts/dev/worktree-cleanup.ps1`
and/or a force-cleaner if needed.

## 7) PowerShell Gotcha (CRITICAL)
Never name a function parameter `$Args`.

Reason:
PowerShell has an automatic `$Args` variable.
If you splat `@Args`, you might splat the automatic empty one.
Result:
Git runs without subcommand → prints “usage: git …”.

Correct pattern:
- Use `$GitArgs` as parameter name
- Splat `@GitArgs`

## 8) Operator Checklist (Before starting 4 agents)
- Confirm main is clean: `git status`
- Worktrees list: `git worktree list`
- Create worktrees per agent
- Open each in its own VS Code window
- Run agents one by one with clear scope prompts

This is a factory, not a jam session. 😈🔥