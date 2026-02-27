# Foundation Scan Report

## Executive Summary
- Repo root: `F:/OneDrive/Hitech/3.Proyectos/CHAT GPT AI Estudio/repos/Inversion`
- Output dir: `F:/OneDrive/Hitech/3.Proyectos/CHAT GPT AI Estudio/repos/Inversion/nf_scan_out`
- Documents scanned: 141
- Living rules extracted: 15629
- Duplicate pairs: 46
- Contradiction candidates: 10000

## Severity Counts
- `BLOCKER`: 816
- `ERROR`: 5134
- `WARN`: 2933
- `INFO`: 6746

## Top Topics
- `general`: 11105
- `architecture`: 1710
- `ui`: 1099
- `imports`: 910
- `testing`: 395
- `security`: 246
- `delivery`: 83
- `performance`: 53
- `documentation`: 28

## Extraction Warnings
- None

## Next Recommended Action
- Resolve top contradiction candidates first, then consolidate duplicate docs to reduce governance drift.

## Technical Summary
- Scanner is read-only; no application runtime code was modified.
- File ordering, hashing, and CSV serialization are deterministic.
- Near-duplicate detection uses candidate blocking with caps to avoid quadratic blowup.
