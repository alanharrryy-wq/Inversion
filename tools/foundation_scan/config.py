"""Configuration and shared typed contracts for Foundation Scan.

This module centralizes:
- deterministic defaults
- data models passed between modules
- light progress reporting utilities
- CLI/env parsing helpers
"""

from __future__ import annotations

import dataclasses
import hashlib
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


DEFAULT_EXCLUDE_DIRS: Tuple[str, ...] = (
    ".git",
    "node_modules",
    "dist",
    "build",
    "out",
    ".next",
    ".turbo",
    ".venv",
    "venv",
    "__pycache__",
    "coverage",
    "tmp",
    "temp",
    ".idea",
    ".vscode",
)


DEFAULT_INCLUDE_EXTENSIONS: Tuple[str, ...] = (
    ".pdf",
    ".docx",
    ".md",
    ".txt",
    ".qml",
)


DEFAULT_BOUNDARY_CONTRACT_FILES: Tuple[str, ...] = (
    "CONTRACT.md",
    "docs/CONTRACT.md",
    "docs/architecture/CONTRACT.md",
)


SEVERITIES: Tuple[str, ...] = ("BLOCKER", "ERROR", "WARN", "INFO")
POLARITIES: Tuple[str, ...] = ("POS", "NEG", "NEU")


def utc_now_iso() -> str:
    """Return a UTC timestamp in ISO-8601 with second precision."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def parse_comma_list(value: str) -> List[str]:
    """Parse comma-separated tokens preserving deterministic order."""
    if not value:
        return []
    pieces = [piece.strip() for piece in value.split(",")]
    return [piece for piece in pieces if piece]


def normalize_extension(ext: str) -> str:
    normalized = ext.strip().lower()
    if not normalized:
        return normalized
    if not normalized.startswith("."):
        normalized = f".{normalized}"
    return normalized


def parse_extensions_csv(value: str) -> Tuple[str, ...]:
    exts = [normalize_extension(item) for item in parse_comma_list(value)]
    exts = [item for item in exts if item]
    # Deterministic unique preserving lexical order.
    return tuple(sorted(set(exts)))


def parse_dirs_csv(value: str) -> Tuple[str, ...]:
    dirs = [item.strip() for item in parse_comma_list(value)]
    dirs = [item for item in dirs if item]
    return tuple(sorted(set(dirs)))


def env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def stable_sha1_bytes(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()


def stable_sha1_text(text: str) -> str:
    return stable_sha1_bytes(text.encode("utf-8", errors="replace"))


@dataclass(frozen=True)
class ScanConfig:
    """Global scanner settings with deterministic defaults."""

    in_dir: Path
    out_dir: Path
    include_extensions: Tuple[str, ...] = DEFAULT_INCLUDE_EXTENSIONS
    exclude_dirs: Tuple[str, ...] = DEFAULT_EXCLUDE_DIRS
    max_file_mb: int = 200
    near_dup_threshold: float = 0.92
    max_near_dup_pairs: int = 8_000
    chunk_size: int = 1400
    chunk_overlap: int = 150
    contract_paths: Tuple[str, ...] = DEFAULT_BOUNDARY_CONTRACT_FILES
    coach_mode: bool = True
    feature_apply_fixes: bool = False
    feature_write_patches: bool = False
    show_progress: bool = True
    max_docs_for_near_dup: int = 20_000
    max_import_files: int = 80_000
    max_import_edges: int = 500_000

    @property
    def max_file_bytes(self) -> int:
        return self.max_file_mb * 1024 * 1024

    @staticmethod
    def from_inputs(
        in_dir: str,
        out_dir: str,
        include_ext: Optional[str] = None,
        exclude_dirs: Optional[str] = None,
        max_file_mb: Optional[int] = None,
        near_dup_threshold: Optional[float] = None,
        max_near_dup_pairs: Optional[int] = None,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
        show_progress: bool = True,
    ) -> "ScanConfig":
        env_max_file_mb = env_int("MAX_FILE_MB", 200)
        include_list = (
            parse_extensions_csv(include_ext)
            if include_ext
            else DEFAULT_INCLUDE_EXTENSIONS
        )
        exclude_list = (
            parse_dirs_csv(exclude_dirs)
            if exclude_dirs
            else DEFAULT_EXCLUDE_DIRS
        )
        max_file_mb_value = max_file_mb if max_file_mb is not None else env_max_file_mb
        near_dup_threshold_value = (
            near_dup_threshold if near_dup_threshold is not None else 0.92
        )
        max_near_dup_pairs_value = (
            max_near_dup_pairs if max_near_dup_pairs is not None else 8_000
        )
        chunk_size_value = chunk_size if chunk_size is not None else 1400
        chunk_overlap_value = chunk_overlap if chunk_overlap is not None else 150
        return ScanConfig(
            in_dir=Path(in_dir).resolve(),
            out_dir=Path(out_dir).resolve(),
            include_extensions=include_list,
            exclude_dirs=exclude_list,
            max_file_mb=max(1, max_file_mb_value),
            near_dup_threshold=min(1.0, max(0.1, near_dup_threshold_value)),
            max_near_dup_pairs=max(1, max_near_dup_pairs_value),
            chunk_size=max(200, chunk_size_value),
            chunk_overlap=max(0, min(chunk_overlap_value, max(0, chunk_size_value - 1))),
            show_progress=show_progress,
        )


@dataclass
class ExtractionWarning:
    rel_path: str
    warning_code: str
    message: str


@dataclass
class DocumentRecord:
    """Normalized document metadata and extracted text."""

    rel_path: str
    abs_path: Path
    extension: str
    size_bytes: int
    file_sha1: str
    text_sha1: str
    text: str
    char_count: int
    chunk_count: int
    warnings: List[ExtractionWarning] = field(default_factory=list)

    @property
    def line_count(self) -> int:
        if not self.text:
            return 0
        return self.text.count("\n") + 1


@dataclass
class ChunkRecord:
    """Chunked view of a document."""

    chunk_id: str
    doc_rel_path: str
    chunk_index: int
    offset_start: int
    offset_end: int
    text: str
    text_sha1: str

    @property
    def char_count(self) -> int:
        return max(0, self.offset_end - self.offset_start)


@dataclass
class RuleRecord:
    """Living rule candidate extracted from docs."""

    rule_id: str
    source_file: str
    chunk_id: str
    severity: str
    polarity: str
    topic: str
    statement: str
    evidence_snippet: str
    check_id: str
    what_detected: str
    why_it_matters: str
    how_to_fix: str
    minimal_bad_example: str
    minimal_good_example: str
    next_best_action: str


@dataclass
class DuplicateRecord:
    """Duplicate pair for exact or near duplicate detection."""

    duplicate_id: str
    duplicate_type: str
    similarity: float
    doc_a: str
    doc_b: str
    check_id: str
    severity: str
    what_detected: str
    why_it_matters: str
    how_to_fix: str
    minimal_bad_example: str
    minimal_good_example: str
    next_best_action: str


@dataclass
class ContradictionRecord:
    """Contradiction candidate derived from extracted rules."""

    contradiction_id: str
    topic: str
    severity: str
    rule_a_id: str
    rule_b_id: str
    file_a: str
    file_b: str
    statement_a: str
    statement_b: str
    confidence: float
    check_id: str
    what_detected: str
    why_it_matters: str
    how_to_fix: str
    minimal_bad_example: str
    minimal_good_example: str
    next_best_action: str


@dataclass
class ImportHubRecord:
    file: str
    imports_out: int
    imports_in: int
    total_links: int


@dataclass
class BoundaryViolationRecord:
    violation_id: str
    from_file: str
    to_file: str
    from_boundary: str
    to_boundary: str
    severity: str
    check_id: str
    what_detected: str
    why_it_matters: str
    how_to_fix: str
    minimal_bad_example: str
    minimal_good_example: str
    next_best_action: str


@dataclass
class RepoStructureResult:
    """Result of repository structure analysis."""

    tree_lines: List[str]
    language_counts: Dict[str, int]
    import_hubs: List[ImportHubRecord]
    boundary_contract_path: Optional[str]
    boundary_map: Dict[str, str]
    forbidden_edges: List[Tuple[str, str]]
    boundary_violations: List[BoundaryViolationRecord]
    coach_findings: List[Dict[str, str]]


@dataclass
class ScanIndex:
    """Canonical index serialized into INDEX.json."""

    timestamp_utc: str
    repo_root: str
    out_dir: str
    include_extensions: List[str]
    exclude_dirs: List[str]
    max_file_mb: int
    near_dup_threshold: float
    max_near_dup_pairs: int
    chunk_size: int
    chunk_overlap: int
    counts: Dict[str, int]
    extraction_warnings: List[Dict[str, str]]
    docs: List[Dict[str, object]]


class ProgressTracker:
    """Simple deterministic progress bar for long-running operations.

    The progress output is deterministic in structure, but timestamps and elapsed
    naturally vary by run.
    """

    def __init__(self, title: str, total: int, enabled: bool = True) -> None:
        self.title = title
        self.total = max(1, total)
        self.enabled = enabled
        self.current = 0
        self.start_time = time.time()
        self._last_printed_pct = -1

    def update(self, step: int = 1) -> None:
        self.current = min(self.total, self.current + step)
        self._render()

    def advance_to(self, current: int) -> None:
        self.current = max(0, min(self.total, current))
        self._render()

    def _render(self) -> None:
        if not self.enabled:
            return
        pct = int((self.current / self.total) * 100)
        if pct == self._last_printed_pct and self.current < self.total:
            return
        self._last_printed_pct = pct
        bar_width = 28
        filled = int((pct / 100) * bar_width)
        empty = max(0, bar_width - filled)
        bar = f"[{'#' * filled}{'.' * empty}]"
        elapsed = time.time() - self.start_time
        message = (
            f"{self.title} {bar} {pct:3d}% "
            f"({self.current}/{self.total}) elapsed={elapsed:0.1f}s"
        )
        print(message, file=sys.stderr)

    def finish(self) -> None:
        self.current = self.total
        self._render()


def deterministic_doc_sort_key(doc: DocumentRecord) -> Tuple[str, str]:
    return (doc.rel_path.lower(), doc.file_sha1)


def deterministic_chunk_sort_key(chunk: ChunkRecord) -> Tuple[str, int, str]:
    return (chunk.doc_rel_path.lower(), chunk.chunk_index, chunk.text_sha1)


def deterministic_rule_sort_key(rule: RuleRecord) -> Tuple[str, str, str]:
    return (rule.severity, rule.topic, rule.rule_id)


def deterministic_duplicate_sort_key(item: DuplicateRecord) -> Tuple[str, float, str, str]:
    return (
        item.duplicate_type,
        -item.similarity,
        min(item.doc_a, item.doc_b),
        max(item.doc_a, item.doc_b),
    )


def deterministic_contradiction_sort_key(
    item: ContradictionRecord,
) -> Tuple[str, float, str, str]:
    return (item.topic, -item.confidence, item.rule_a_id, item.rule_b_id)


def safe_rel_path(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def dataclass_to_dict_sorted(instance: object) -> Dict[str, object]:
    """Dataclass -> dict with stable key ordering."""
    raw = dataclasses.asdict(instance)
    return {key: raw[key] for key in sorted(raw.keys())}


def stable_unique_strings(values: Iterable[str]) -> List[str]:
    return sorted(set(values))


def choose_topic_by_keywords(text: str, fallback: str = "general") -> str:
    """Shared keyword-based topic classifier."""
    lowered = text.lower()
    topic_keywords = (
        ("architecture", ("architecture", "orchestrator", "module", "boundary")),
        ("testing", ("test", "smoke", "e2e", "unit", "coverage")),
        ("performance", ("performance", "latency", "slow", "parallel", "runtime")),
        ("security", ("security", "vulnerability", "secret", "token", "permission")),
        ("governance", ("rule", "policy", "must", "forbidden", "prohibited")),
        ("documentation", ("docs", "document", "readme", "manual", "runbook")),
        ("ui", ("ui", "visual", "slide", "component", "gesture")),
        ("data", ("data", "schema", "contract", "index", "traceability")),
    )
    for topic, keys in topic_keywords:
        if any(key in lowered for key in keys):
            return topic
    return fallback


def severity_rank(severity: str) -> int:
    table = {"BLOCKER": 0, "ERROR": 1, "WARN": 2, "INFO": 3}
    return table.get(severity, 99)

