# Dev One-Shot Scripts

Run from repo root (or any subdirectory; scripts auto-detect repo root):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\worktree-cleanup.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\dev\merge-main-take-theirs.ps1 -TargetBranch codex-D-slide00 -TakeTheirsPaths "package-lock.json","tests/e2e/deck-smoke-00-04.e2e.spec.ts"
powershell -ExecutionPolicy Bypass -File .\scripts\dev\gh-pr-automerge.ps1
```

Dry-run mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev\worktree-cleanup.ps1 -DryRun
powershell -ExecutionPolicy Bypass -File .\scripts\dev\merge-main-take-theirs.ps1 -DryRun
powershell -ExecutionPolicy Bypass -File .\scripts\dev\gh-pr-automerge.ps1 -DryRun
```

Notes:
- `worktree-cleanup.ps1` only removes paths reported by `git worktree list --porcelain` and never deletes arbitrary folders.
- `merge-main-take-theirs.ps1` merges `origin/main`; on conflicts it takes `--theirs` only for files listed in `-TakeTheirsPaths`.
- `gh-pr-automerge.ps1` auto-merges mergeable Codex PRs if `gh` is installed and authenticated; otherwise it prints a fallback command block.
