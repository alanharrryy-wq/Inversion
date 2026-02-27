"""Minimal smoke tests for Foundation Scan.

No pytest dependency required.
Run:
    python tools/foundation_scan/tests_smoke.py
"""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path
from typing import Dict, List


if __package__ is None or __package__ == "":
    repo_root = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(repo_root))

from tools.foundation_scan.config import ScanConfig  # noqa: E402
from tools.foundation_scan.scan import run_scan  # noqa: E402


REQUIRED_OUTPUTS = (
    "REPORT.md",
    "RULES.csv",
    "DUPLICATES.csv",
    "CONTRADICTIONS.csv",
    "INDEX.json",
    "REPO_STRUCTURE.md",
)


def _write(path: Path, body: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def _seed_repo(root: Path) -> None:
    _write(
        root / "docs" / "policy.md",
        """
# Policy

Entry points must orchestrate only.
UI must not import runtime internals.
Tests should run deterministic smoke paths before merge.
Performance scans should cap pairwise comparisons.
""".strip()
        + "\n",
    )

    # Exact duplicate text for duplicate detection.
    _write(
        root / "docs" / "policy_copy.txt",
        """
Entry points must orchestrate only.
UI must not import runtime internals.
Tests should run deterministic smoke paths before merge.
Performance scans should cap pairwise comparisons.
""".strip()
        + "\n",
    )

    # Contradictory guidance.
    _write(
        root / "docs" / "override.md",
        """
For rapid experimentation, UI should import runtime internals directly.
Entry points should include business logic for fast iteration.
""".strip()
        + "\n",
    )

    _write(
        root / "CONTRACT.md",
        """
## BOUNDARIES
- ui: src/ui
- runtime: src/runtime
- docs: docs

## FORBIDDEN_IMPORTS
- ui -> runtime
""".strip()
        + "\n",
    )

    _write(
        root / "src" / "runtime" / "internal.ts",
        """
export const internalFeature = () => "runtime-internal";
""".strip()
        + "\n",
    )
    _write(
        root / "src" / "ui" / "view.ts",
        """
import { internalFeature } from "../runtime/internal";

export const renderView = () => internalFeature();
""".strip()
        + "\n",
    )

    # extra doc type extension coverage (.qml).
    _write(
        root / "docs" / "ui_guidance.qml",
        """
// QML text for scanner ingestion.
// UI must preserve boundary contracts and should avoid runtime internals.
""".strip()
        + "\n",
    )


def _assert_outputs_exist_non_empty(out_dir: Path) -> None:
    for name in REQUIRED_OUTPUTS:
        path = out_dir / name
        assert path.exists(), f"Expected output missing: {path.as_posix()}"
        assert path.stat().st_size > 0, f"Expected non-empty output: {path.as_posix()}"


def _load_json(path: Path) -> Dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def _assert_deterministic_key_outputs(
    before: Dict[str, str],
    after: Dict[str, str],
    index_before: Dict[str, object],
    index_after: Dict[str, object],
) -> None:
    compare_exact = ("RULES.csv", "DUPLICATES.csv", "CONTRADICTIONS.csv", "REPO_STRUCTURE.md")
    for name in compare_exact:
        a = before[name]
        b = after[name]
        assert a == b, f"Non-deterministic content detected in {name}"
    # Timestamp can vary; docs ordering and counts should remain stable.
    docs_a = index_before.get("docs", [])
    docs_b = index_after.get("docs", [])
    counts_a = index_before.get("counts", {})
    counts_b = index_after.get("counts", {})
    assert docs_a == docs_b, "INDEX docs list differs across runs."
    assert counts_a == counts_b, "INDEX counts differ across runs."


def _run_once(root: Path, out_name: str) -> Path:
    out_dir = root / out_name
    config = ScanConfig.from_inputs(
        in_dir=str(root),
        out_dir=str(out_dir),
        include_ext=".pdf,.docx,.md,.txt,.qml",
        exclude_dirs=".git,node_modules,dist,build,out,.next,.turbo,.venv,venv,__pycache__,coverage,tmp,temp,.idea,.vscode",
        max_file_mb=200,
        near_dup_threshold=0.80,
        max_near_dup_pairs=8000,
        chunk_size=500,
        chunk_overlap=80,
        show_progress=False,
    )
    run_scan(config)
    return out_dir


def _snapshot_outputs(out_dir: Path) -> Dict[str, str]:
    return {
        name: (out_dir / name).read_text(encoding="utf-8")
        for name in REQUIRED_OUTPUTS
    }


def run_smoke() -> None:
    with tempfile.TemporaryDirectory(prefix="foundation_scan_smoke_") as temp_dir:
        root = Path(temp_dir).resolve()
        _seed_repo(root)

        out_dir = _run_once(root, "nf_scan_out")
        _assert_outputs_exist_non_empty(out_dir)
        snapshot_before = _snapshot_outputs(out_dir)
        index_before = _load_json(out_dir / "INDEX.json")

        # Run second pass against same folder to verify deterministic outputs.
        _run_once(root, "nf_scan_out")
        _assert_outputs_exist_non_empty(out_dir)
        snapshot_after = _snapshot_outputs(out_dir)
        index_after = _load_json(out_dir / "INDEX.json")

        _assert_deterministic_key_outputs(
            before=snapshot_before,
            after=snapshot_after,
            index_before=index_before,
            index_after=index_after,
        )

        # Spot-check: expect at least one rule and one boundary coach finding.
        rules_csv = (out_dir / "RULES.csv").read_text(encoding="utf-8")
        repo_report = (out_dir / "REPO_STRUCTURE.md").read_text(encoding="utf-8")
        assert "rule_id" in rules_csv, "RULES.csv header missing."
        assert "Coach Findings" in repo_report, "REPO_STRUCTURE.md missing Coach section."


def main() -> int:
    try:
        run_smoke()
    except AssertionError as exc:
        print(f"SMOKE TEST FAILED: {exc}")
        return 1
    except Exception as exc:  # pragma: no cover
        print(f"SMOKE TEST ERROR: {exc}")
        return 2
    print("SMOKE TEST PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
