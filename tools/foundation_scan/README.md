# Foundation Scan

Deterministic, offline-first scanner for:

1. Documentation corpus (`.pdf`, `.docx`, `.md`, `.txt`, `.qml`)  
2. Repository structure (tree, language fingerprint, import hubs, boundary violations)

The scanner is read-only by default and does not modify application runtime code paths.

## Goals

- Detect architecture/documentation drift early.
- Extract “living rules” from docs with severity and polarity.
- Identify duplicates and contradiction candidates.
- Produce executive + technical artifacts under one output folder.
- Keep output stable and reproducible (sorted paths, stable hashes, stable file names).

## Output Artifacts

Default output folder: `nf_scan_out/`

- `REPORT.md`
- `RULES.csv`
- `DUPLICATES.csv`
- `CONTRADICTIONS.csv`
- `INDEX.json`
- `REPO_STRUCTURE.md`

## CLI

### Basic

```bash
python -m tools.foundation_scan.scan --in . --out nf_scan_out --max-file-mb 200
```

### Full flag set

```bash
python -m tools.foundation_scan.scan \
  --in . \
  --out nf_scan_out \
  --max-file-mb 200 \
  --include-ext ".pdf,.docx,.md,.txt,.qml" \
  --exclude-dirs ".git,node_modules,dist,build,out,.next,.turbo,.venv,venv,__pycache__,coverage,tmp,temp,.idea,.vscode" \
  --near-dup-threshold 0.92 \
  --max-near-dup-pairs 8000 \
  --chunk-size 1400 \
  --chunk-overlap 150
```

### Disable progress

```bash
python -m tools.foundation_scan.scan --in . --out nf_scan_out --no-progress
```

## Optional PowerShell Wrapper

```powershell
.\run_scan.ps1 -In . -Out nf_scan_out
```

## CONTRACT.md Boundary Support

If one of these files exists, boundary checks are enabled:

- `CONTRACT.md`
- `docs/CONTRACT.md`
- `docs/architecture/CONTRACT.md`

Expected simple format:

```md
## BOUNDARIES
- ui: components
- runtime: runtime
- docs: docs

## FORBIDDEN_IMPORTS
- ui -> runtime
- docs -> runtime
```

When present, `REPO_STRUCTURE.md` includes forbidden import violations (heuristic, static).

## Determinism Notes

- Recursive file discovery is stable-sorted by relative path.
- Hashing uses SHA-1 over normalized inputs.
- CSV row ordering is deterministic by explicit sort keys.
- Output file names are fixed.

`INDEX.json` includes timestamp metadata by design, so full byte-level equality across different runs is not expected for this file.

## Coach Output Contract

Findings include:

- `check_id`
- `severity` (`BLOCKER`/`ERROR`/`WARN`/`INFO`)
- what detected
- why it matters
- how to fix
- minimal bad/good examples
- next best action

This contract is emitted in:

- `RULES.csv`
- `DUPLICATES.csv`
- `CONTRADICTIONS.csv`
- `REPO_STRUCTURE.md` (Coach Findings section)

## Performance Guardrails

- Exclusion list avoids common heavy build/vendor dirs.
- Max file size is capped (`--max-file-mb`, env fallback `MAX_FILE_MB`).
- Near-duplicate detection uses blocked candidates + Jaccard threshold + pair caps.
- Import graph collection enforces max edge caps.

## Limitations

- PDF extraction is best-effort. Without dedicated OCR, scanned-image PDFs may return partial or empty text.
- Import resolution is lightweight and local-file oriented; alias/plugin-based resolvers are not fully interpreted.
- Contradictions are candidates; final adjudication is human.

## Smoke Test

No pytest required:

```bash
python tools/foundation_scan/tests_smoke.py
```

The smoke test creates a temporary mini-repo, runs two scans, and verifies:

- required outputs exist and are non-empty
- deterministic ordering/content for key CSV and repo outputs

