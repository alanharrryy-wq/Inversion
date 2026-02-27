"""CLI entrypoint for Foundation Scan.

Usage:
    python -m tools.foundation_scan.scan --in . --out nf_scan_out --max-file-mb 200
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Sequence

from .config import ProgressTracker, ScanConfig, utc_now_iso
from .contradictions import detect_contradictions
from .dedupe import detect_all_duplicates
from .doc_ingest import ingest_documents, warning_rows_to_dicts
from .doc_rules import extract_living_rules
from .output_writer import write_all_outputs
from .repo_scan import scan_repo_structure


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="foundation_scan",
        description="Deterministic repository + documentation foundation scanner.",
    )
    parser.add_argument("--in", dest="in_dir", default=".", help="Input repo root")
    parser.add_argument(
        "--out",
        dest="out_dir",
        default="nf_scan_out",
        help="Output directory for reports and CSV artifacts",
    )
    parser.add_argument(
        "--max-file-mb",
        dest="max_file_mb",
        type=int,
        default=200,
        help="Maximum file size in MB",
    )
    parser.add_argument(
        "--include-ext",
        dest="include_ext",
        default=".pdf,.docx,.md,.txt,.qml",
        help="Comma-separated included extensions",
    )
    parser.add_argument(
        "--exclude-dirs",
        dest="exclude_dirs",
        default=(
            ".git,node_modules,dist,build,out,.next,.turbo,.venv,venv,"
            "__pycache__,coverage,tmp,temp,.idea,.vscode"
        ),
        help="Comma-separated directory names to exclude recursively",
    )
    parser.add_argument(
        "--near-dup-threshold",
        dest="near_dup_threshold",
        type=float,
        default=0.92,
        help="Near duplicate threshold (Jaccard similarity)",
    )
    parser.add_argument(
        "--max-near-dup-pairs",
        dest="max_near_dup_pairs",
        type=int,
        default=8000,
        help="Maximum near-duplicate result pairs",
    )
    parser.add_argument(
        "--chunk-size",
        dest="chunk_size",
        type=int,
        default=1400,
        help="Chunk size in chars for rule extraction",
    )
    parser.add_argument(
        "--chunk-overlap",
        dest="chunk_overlap",
        type=int,
        default=150,
        help="Chunk overlap in chars",
    )
    parser.add_argument(
        "--no-progress",
        dest="no_progress",
        action="store_true",
        help="Disable progress printing",
    )
    return parser


def _stage(title: str) -> None:
    print(f"[foundation-scan] {title}", file=sys.stderr)


def run_scan(config: ScanConfig) -> Dict[str, object]:
    stage_progress = ProgressTracker(
        title="scan-stages",
        total=6,
        enabled=config.show_progress,
    )

    _stage("1/6 ingest documents")
    docs, chunks, warnings = ingest_documents(config)
    warning_rows = warning_rows_to_dicts(warnings)
    stage_progress.update()

    _stage("2/6 extract living rules")
    rules = extract_living_rules(chunks)
    stage_progress.update()

    _stage("3/6 detect duplicates")
    duplicates = detect_all_duplicates(
        docs=docs,
        threshold=config.near_dup_threshold,
        max_near_dup_pairs=config.max_near_dup_pairs,
        max_docs_for_near_dup=config.max_docs_for_near_dup,
        progress_enabled=config.show_progress,
    )
    stage_progress.update()

    _stage("4/6 detect contradiction candidates")
    contradictions = detect_contradictions(rules, max_pairs=10_000)
    stage_progress.update()

    _stage("5/6 scan repository structure")
    repo_result = scan_repo_structure(config)
    stage_progress.update()

    _stage("6/6 write output artifacts")
    created_files = write_all_outputs(
        config=config,
        docs=docs,
        rules=rules,
        duplicates=duplicates,
        contradictions=contradictions,
        repo_result=repo_result,
        extraction_warning_rows=warning_rows,
    )
    stage_progress.update()
    stage_progress.finish()

    return {
        "docs": docs,
        "chunks": chunks,
        "rules": rules,
        "duplicates": duplicates,
        "contradictions": contradictions,
        "repo_result": repo_result,
        "warning_rows": warning_rows,
        "created_files": created_files,
    }


def print_final_report(config: ScanConfig, result: Dict[str, object]) -> None:
    created_files: List[Path] = list(result["created_files"])  # type: ignore[assignment]
    rules_count = len(result["rules"])  # type: ignore[arg-type]
    duplicates_count = len(result["duplicates"])  # type: ignore[arg-type]
    contradictions_count = len(result["contradictions"])  # type: ignore[arg-type]
    docs_count = len(result["docs"])  # type: ignore[arg-type]
    warning_rows = result["warning_rows"]  # type: ignore[assignment]

    print("")
    print("FINAL REPORT")
    print(f"Timestamp UTC: {utc_now_iso()}")
    print("Created/Modified Files:")
    for path in sorted(created_files, key=lambda p: p.name.lower()):
        print(f"- {path.as_posix()}")
    print("")
    print("Scan Summary:")
    print(f"- Documents scanned: {docs_count}")
    print(f"- Living rules: {rules_count}")
    print(f"- Duplicate pairs: {duplicates_count}")
    print(f"- Contradiction candidates: {contradictions_count}")
    print(f"- Extraction warnings: {len(warning_rows)}")
    print("")
    print("How To Run:")
    print(
        "python -m tools.foundation_scan.scan --in . --out nf_scan_out "
        "--max-file-mb 200"
    )
    print("")
    print("Output Folder:")
    print(f"- {config.out_dir.as_posix()}")
    print("")
    print("Known Limitations:")
    print("- Some PDFs require OCR; text extraction may be partial without OCR tooling.")
    print("- Import graph resolution focuses on local file imports and ignores runtime alias configs.")
    print("- Contradictions are heuristic candidates and should be reviewed by a maintainer.")
    print("")


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    config = ScanConfig.from_inputs(
        in_dir=args.in_dir,
        out_dir=args.out_dir,
        include_ext=args.include_ext,
        exclude_dirs=args.exclude_dirs,
        max_file_mb=args.max_file_mb,
        near_dup_threshold=args.near_dup_threshold,
        max_near_dup_pairs=args.max_near_dup_pairs,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        show_progress=not args.no_progress,
    )

    result = run_scan(config)
    print_final_report(config, result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

