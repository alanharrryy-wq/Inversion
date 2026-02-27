# NOTEBOOK

## Block 1 Docs Maps (Inversion)

This notebook is the docs-only index generated for Block 1 mapping.
Runtime code was not modified by this task.

## Repository Snapshot

- Repo: `F:/OneDrive/Hitech/3.Proyectos/CHAT GPT AI Estudio/repos/Inversion`
- Branch: `main`
- HEAD: `2e0ceff6d332c1a1eeb3a358f8fa3239b4de7495`
- Dirty worktree at start: `true`

## Generated Artifacts

- `docs/REPO_MAP.md`
- `docs/IMPACT_MAP.md`
- `docs/OPPORTUNITY_MAP.md`
- `docs/_generated/FILE_INDEX.json`
- `docs/_generated/CHANGE_SAFELOG.md`

## How To Read

1. Start with `docs/REPO_MAP.md` for structure and entrypoints.
2. Use `docs/IMPACT_MAP.md` before touching runtime files.
3. Use `docs/OPPORTUNITY_MAP.md` for prioritized cleanup/improvement work.
4. Use `docs/_generated/FILE_INDEX.json` for deterministic path inventory.
5. Use `docs/_generated/CHANGE_SAFELOG.md` for safety and scope audit.

## Key Findings Summary

- App boot path is `index.tsx` -> `App.tsx` -> providers -> `SlideRenderer`.
- URL routing is normalized to `/slides/NN` with hash/query parsing fallback.
- Visible deck navigation controls are clamped to slide indices `00..04`.
- Slide registry contains 20 slots with naming mismatches (`Slide7`/`Slide07`, index 11 maps to `Slide12` component).
- AI path is proxy-backed (`/api/ai` via Vite -> Express server).
- Guard scripts enforce no-rework and client exposure boundaries.

## Known Unknowns and Hypotheses

- `HYPOTHESIS`: `components/slides/Slide07.tsx` is a parallel implementation that is currently not mounted by `components/SlideRenderer.tsx`.
- `UNKNOWN`: whether the `Slide11` label mapped to `Slide12` component is intentional long-term naming policy or transitional compatibility.
