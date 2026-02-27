"""Output serialization for Foundation Scan artifacts."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

from .config import (
    ContradictionRecord,
    DocumentRecord,
    DuplicateRecord,
    RepoStructureResult,
    RuleRecord,
    ScanConfig,
    ScanIndex,
    severity_rank,
    utc_now_iso,
)
from .doc_ingest import docs_to_index_rows, warning_rows_to_dicts
from .doc_rules import summarize_rule_severity, summarize_rule_topics


def ensure_output_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write_csv(path: Path, fieldnames: Sequence[str], rows: Sequence[Dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(fieldnames))
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def _rule_rows(rules: Sequence[RuleRecord]) -> List[Dict[str, object]]:
    sorted_rules = sorted(
        rules,
        key=lambda row: (
            severity_rank(row.severity),
            row.topic,
            row.source_file.lower(),
            row.rule_id,
        ),
    )
    return [
        {
            "rule_id": row.rule_id,
            "source_file": row.source_file,
            "chunk_id": row.chunk_id,
            "severity": row.severity,
            "polarity": row.polarity,
            "topic": row.topic,
            "statement": row.statement,
            "evidence_snippet": row.evidence_snippet,
            "check_id": row.check_id,
            "what_detected": row.what_detected,
            "why_it_matters": row.why_it_matters,
            "how_to_fix": row.how_to_fix,
            "minimal_bad_example": row.minimal_bad_example,
            "minimal_good_example": row.minimal_good_example,
            "next_best_action": row.next_best_action,
        }
        for row in sorted_rules
    ]


def _duplicate_rows(dupes: Sequence[DuplicateRecord]) -> List[Dict[str, object]]:
    sorted_dupes = sorted(
        dupes,
        key=lambda row: (
            {"exact": 0, "near": 1}.get(row.duplicate_type, 9),
            -row.similarity,
            row.doc_a.lower(),
            row.doc_b.lower(),
            row.duplicate_id,
        ),
    )
    return [
        {
            "duplicate_id": row.duplicate_id,
            "duplicate_type": row.duplicate_type,
            "similarity": f"{row.similarity:0.6f}",
            "doc_a": row.doc_a,
            "doc_b": row.doc_b,
            "check_id": row.check_id,
            "severity": row.severity,
            "what_detected": row.what_detected,
            "why_it_matters": row.why_it_matters,
            "how_to_fix": row.how_to_fix,
            "minimal_bad_example": row.minimal_bad_example,
            "minimal_good_example": row.minimal_good_example,
            "next_best_action": row.next_best_action,
        }
        for row in sorted_dupes
    ]


def _contradiction_rows(rows: Sequence[ContradictionRecord]) -> List[Dict[str, object]]:
    sorted_rows = sorted(
        rows,
        key=lambda row: (
            severity_rank(row.severity),
            -row.confidence,
            row.topic,
            row.rule_a_id,
            row.rule_b_id,
        ),
    )
    return [
        {
            "contradiction_id": row.contradiction_id,
            "topic": row.topic,
            "severity": row.severity,
            "rule_a_id": row.rule_a_id,
            "rule_b_id": row.rule_b_id,
            "file_a": row.file_a,
            "file_b": row.file_b,
            "statement_a": row.statement_a,
            "statement_b": row.statement_b,
            "confidence": f"{row.confidence:0.6f}",
            "check_id": row.check_id,
            "what_detected": row.what_detected,
            "why_it_matters": row.why_it_matters,
            "how_to_fix": row.how_to_fix,
            "minimal_bad_example": row.minimal_bad_example,
            "minimal_good_example": row.minimal_good_example,
            "next_best_action": row.next_best_action,
        }
        for row in sorted_rows
    ]


def write_rules_csv(path: Path, rules: Sequence[RuleRecord]) -> None:
    rows = _rule_rows(rules)
    fields = [
        "rule_id",
        "source_file",
        "chunk_id",
        "severity",
        "polarity",
        "topic",
        "statement",
        "evidence_snippet",
        "check_id",
        "what_detected",
        "why_it_matters",
        "how_to_fix",
        "minimal_bad_example",
        "minimal_good_example",
        "next_best_action",
    ]
    _write_csv(path, fields, rows)


def write_duplicates_csv(path: Path, duplicates: Sequence[DuplicateRecord]) -> None:
    rows = _duplicate_rows(duplicates)
    fields = [
        "duplicate_id",
        "duplicate_type",
        "similarity",
        "doc_a",
        "doc_b",
        "check_id",
        "severity",
        "what_detected",
        "why_it_matters",
        "how_to_fix",
        "minimal_bad_example",
        "minimal_good_example",
        "next_best_action",
    ]
    _write_csv(path, fields, rows)


def write_contradictions_csv(path: Path, rows: Sequence[ContradictionRecord]) -> None:
    out_rows = _contradiction_rows(rows)
    fields = [
        "contradiction_id",
        "topic",
        "severity",
        "rule_a_id",
        "rule_b_id",
        "file_a",
        "file_b",
        "statement_a",
        "statement_b",
        "confidence",
        "check_id",
        "what_detected",
        "why_it_matters",
        "how_to_fix",
        "minimal_bad_example",
        "minimal_good_example",
        "next_best_action",
    ]
    _write_csv(path, fields, out_rows)


def write_index_json(
    path: Path,
    config: ScanConfig,
    docs: Sequence[DocumentRecord],
    rules: Sequence[RuleRecord],
    duplicates: Sequence[DuplicateRecord],
    contradictions: Sequence[ContradictionRecord],
    extraction_warnings: Sequence[Dict[str, str]],
) -> None:
    counts = {
        "docs": len(docs),
        "rules": len(rules),
        "duplicates": len(duplicates),
        "contradictions": len(contradictions),
    }
    index_obj = ScanIndex(
        timestamp_utc=utc_now_iso(),
        repo_root=config.in_dir.as_posix(),
        out_dir=config.out_dir.as_posix(),
        include_extensions=list(config.include_extensions),
        exclude_dirs=list(config.exclude_dirs),
        max_file_mb=config.max_file_mb,
        near_dup_threshold=config.near_dup_threshold,
        max_near_dup_pairs=config.max_near_dup_pairs,
        chunk_size=config.chunk_size,
        chunk_overlap=config.chunk_overlap,
        counts=counts,
        extraction_warnings=list(extraction_warnings),
        docs=docs_to_index_rows(docs),
    )
    with path.open("w", encoding="utf-8") as handle:
        json.dump(
            index_obj.__dict__,
            handle,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        handle.write("\n")


def _format_topics_markdown(rules: Sequence[RuleRecord]) -> List[str]:
    topic_rows = summarize_rule_topics(rules, top_n=10)
    if not topic_rows:
        return ["- None"]
    return [f"- `{topic}`: {count}" for topic, count in topic_rows]


def _format_severity_markdown(rules: Sequence[RuleRecord]) -> List[str]:
    counts = summarize_rule_severity(rules)
    return [
        f"- `BLOCKER`: {counts.get('BLOCKER', 0)}",
        f"- `ERROR`: {counts.get('ERROR', 0)}",
        f"- `WARN`: {counts.get('WARN', 0)}",
        f"- `INFO`: {counts.get('INFO', 0)}",
    ]


def write_report_md(
    path: Path,
    config: ScanConfig,
    docs: Sequence[DocumentRecord],
    rules: Sequence[RuleRecord],
    duplicates: Sequence[DuplicateRecord],
    contradictions: Sequence[ContradictionRecord],
    extraction_warning_rows: Sequence[Dict[str, str]],
) -> None:
    lines: List[str] = []
    lines.append("# Foundation Scan Report")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append(f"- Repo root: `{config.in_dir.as_posix()}`")
    lines.append(f"- Output dir: `{config.out_dir.as_posix()}`")
    lines.append(f"- Documents scanned: {len(docs)}")
    lines.append(f"- Living rules extracted: {len(rules)}")
    lines.append(f"- Duplicate pairs: {len(duplicates)}")
    lines.append(f"- Contradiction candidates: {len(contradictions)}")
    lines.append("")
    lines.append("## Severity Counts")
    lines.extend(_format_severity_markdown(rules))
    lines.append("")
    lines.append("## Top Topics")
    lines.extend(_format_topics_markdown(rules))
    lines.append("")
    lines.append("## Extraction Warnings")
    if not extraction_warning_rows:
        lines.append("- None")
    else:
        preview = list(extraction_warning_rows)[:20]
        for warning in preview:
            rel = warning.get("rel_path", "")
            code = warning.get("warning_code", "")
            message = warning.get("message", "")
            lines.append(f"- `{rel}` · `{code}` · {message}")
        if len(extraction_warning_rows) > len(preview):
            lines.append(f"- ... {len(extraction_warning_rows) - len(preview)} more")
    lines.append("")
    lines.append("## Next Recommended Action")
    if contradictions:
        lines.append(
            "- Resolve top contradiction candidates first, then consolidate duplicate docs to reduce governance drift."
        )
    elif duplicates:
        lines.append("- Consolidate duplicate documents into one canonical source of truth.")
    elif rules:
        lines.append("- Promote highest-severity rules into CONTRACT.md and enforce with CI checks.")
    else:
        lines.append("- Add explicit policy language to docs so critical rules can be validated automatically.")
    lines.append("")
    lines.append("## Technical Summary")
    lines.append("- Scanner is read-only; no application runtime code was modified.")
    lines.append("- File ordering, hashing, and CSV serialization are deterministic.")
    lines.append(
        "- Near-duplicate detection uses candidate blocking with caps to avoid quadratic blowup."
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_repo_structure_md(path: Path, result: RepoStructureResult) -> None:
    lines: List[str] = []
    lines.append("# Repo Structure Report")
    lines.append("")
    lines.extend(result.tree_lines)
    lines.append("## Language Detection")
    if not result.language_counts:
        lines.append("- None")
    else:
        for lang, count in sorted(
            result.language_counts.items(), key=lambda item: (-item[1], item[0])
        ):
            lines.append(f"- `{lang}`: {count}")
    lines.append("")
    lines.append("## Import Hub Summary (Top 20)")
    if not result.import_hubs:
        lines.append("- No import hubs detected.")
    else:
        lines.append("| File | Imports Out | Imported By | Total Links |")
        lines.append("|---|---:|---:|---:|")
        for hub in result.import_hubs:
            lines.append(
                f"| `{hub.file}` | {hub.imports_out} | {hub.imports_in} | {hub.total_links} |"
            )
    lines.append("")
    lines.append("## Boundary Violations Summary")
    if result.boundary_contract_path:
        lines.append(f"- Contract file: `{result.boundary_contract_path}`")
    else:
        lines.append("- Contract file: not found")

    if result.boundary_map:
        lines.append("- Boundaries:")
        for name, prefix in sorted(result.boundary_map.items(), key=lambda item: item[0]):
            lines.append(f"  - `{name}` -> `{prefix}`")
    else:
        lines.append("- Boundaries: none parsed")

    if result.forbidden_edges:
        lines.append("- Forbidden imports:")
        for src, dst in result.forbidden_edges:
            lines.append(f"  - `{src}` -> `{dst}`")
    else:
        lines.append("- Forbidden imports: none parsed")

    if result.boundary_violations:
        lines.append("- Violations:")
        for item in result.boundary_violations[:50]:
            lines.append(
                f"  - `{item.from_file}` -> `{item.to_file}` (`{item.from_boundary}` -> `{item.to_boundary}`)"
            )
        if len(result.boundary_violations) > 50:
            lines.append(f"  - ... {len(result.boundary_violations) - 50} more")
    else:
        lines.append("- Violations: none")

    lines.append("")
    lines.append("## Coach Findings")
    if not result.coach_findings:
        lines.append("- No high-confidence drift findings detected.")
    else:
        for finding in result.coach_findings:
            lines.append(f"### {finding['check_id']} · {finding['severity']}")
            lines.append(f"- What detected: {finding['what_detected']}")
            lines.append(f"- Why it matters: {finding['why_it_matters']}")
            lines.append(f"- How to fix: {finding['how_to_fix']}")
            lines.append(f"- Minimal bad example: {finding['minimal_bad_example']}")
            lines.append(f"- Minimal good example: {finding['minimal_good_example']}")
            lines.append(f"- Next best action: {finding['next_best_action']}")
            lines.append("")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_all_outputs(
    config: ScanConfig,
    docs: Sequence[DocumentRecord],
    rules: Sequence[RuleRecord],
    duplicates: Sequence[DuplicateRecord],
    contradictions: Sequence[ContradictionRecord],
    repo_result: RepoStructureResult,
    extraction_warning_rows: Sequence[Dict[str, str]],
) -> List[Path]:
    out_dir = ensure_output_dir(config.out_dir)
    rules_csv = out_dir / "RULES.csv"
    duplicates_csv = out_dir / "DUPLICATES.csv"
    contradictions_csv = out_dir / "CONTRADICTIONS.csv"
    report_md = out_dir / "REPORT.md"
    repo_structure_md = out_dir / "REPO_STRUCTURE.md"
    index_json = out_dir / "INDEX.json"

    write_rules_csv(rules_csv, rules)
    write_duplicates_csv(duplicates_csv, duplicates)
    write_contradictions_csv(contradictions_csv, contradictions)
    write_report_md(
        report_md,
        config=config,
        docs=docs,
        rules=rules,
        duplicates=duplicates,
        contradictions=contradictions,
        extraction_warning_rows=extraction_warning_rows,
    )
    write_repo_structure_md(repo_structure_md, repo_result)
    write_index_json(
        index_json,
        config=config,
        docs=docs,
        rules=rules,
        duplicates=duplicates,
        contradictions=contradictions,
        extraction_warnings=extraction_warning_rows,
    )

    files = [
        report_md,
        rules_csv,
        duplicates_csv,
        contradictions_csv,
        index_json,
        repo_structure_md,
    ]
    return sorted(files, key=lambda p: p.name.lower())

