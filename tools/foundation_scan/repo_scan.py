"""Repository structure scanning for Foundation Scan.

Features:
- depth-2 tree summary
- language distribution
- lightweight import graph for ts/js/py
- import hubs (inbound/outbound)
- optional boundary contract parsing + forbidden import violations
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import DefaultDict, Dict, Iterable, Iterator, List, Optional, Sequence, Set, Tuple

from .config import (
    BoundaryViolationRecord,
    ImportHubRecord,
    ProgressTracker,
    RepoStructureResult,
    ScanConfig,
    safe_rel_path,
    stable_sha1_text,
)


SOURCE_EXTENSIONS: Tuple[str, ...] = (".ts", ".tsx", ".js", ".jsx", ".py")

LANGUAGE_BY_EXTENSION: Dict[str, str] = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".py": "Python",
    ".md": "Markdown",
    ".txt": "Text",
    ".qml": "QML",
    ".json": "JSON",
    ".css": "CSS",
    ".html": "HTML",
    ".ps1": "PowerShell",
}

IMPORT_FROM_RE = re.compile(
    r"^\s*import\s+(?:.+?\s+from\s+)?[\"']([^\"']+)[\"']",
    flags=re.MULTILINE,
)
REQUIRE_RE = re.compile(r"require\(\s*[\"']([^\"']+)[\"']\s*\)")
DYNAMIC_IMPORT_RE = re.compile(r"import\(\s*[\"']([^\"']+)[\"']\s*\)")

PY_IMPORT_RE = re.compile(r"^\s*import\s+([a-zA-Z0-9_\.]+)", flags=re.MULTILINE)
PY_FROM_RE = re.compile(r"^\s*from\s+([a-zA-Z0-9_\.]+)\s+import\s+", flags=re.MULTILINE)

CONTRACT_SECTION_BOUNDARIES = "BOUNDARIES"
CONTRACT_SECTION_FORBIDDEN = "FORBIDDEN_IMPORTS"


@dataclass(frozen=True)
class ImportEdge:
    source_file: str
    import_spec: str
    resolved_file: Optional[str]
    external: bool


@dataclass
class ParsedContract:
    contract_path: Optional[str]
    boundaries: Dict[str, str]
    forbidden_edges: List[Tuple[str, str]]


def _is_excluded_dir(name: str, config: ScanConfig) -> bool:
    lowered = name.lower()
    return any(lowered == item.lower() for item in config.exclude_dirs)


def _iter_all_files(config: ScanConfig) -> Iterator[Path]:
    root = config.in_dir.resolve()
    out = config.out_dir.resolve()
    stack: List[Path] = [root]
    while stack:
        current = stack.pop()
        try:
            current.relative_to(out)
            continue
        except Exception:
            pass
        try:
            entries = sorted(current.iterdir(), key=lambda p: p.name.lower())
        except Exception:
            continue
        dirs: List[Path] = []
        for entry in entries:
            if entry.is_dir():
                if _is_excluded_dir(entry.name, config):
                    continue
                dirs.append(entry)
            elif entry.is_file():
                yield entry
        for sub in reversed(dirs):
            stack.append(sub)


def _top_level_name(rel_path: str) -> str:
    parts = rel_path.split("/")
    return parts[0] if parts else rel_path


def build_depth2_tree_summary(config: ScanConfig, max_children_per_dir: int = 24) -> List[str]:
    root = config.in_dir.resolve()
    top_files: List[str] = []
    top_dirs: Dict[str, List[str]] = defaultdict(list)
    second_level: Dict[str, Counter[str]] = defaultdict(Counter)

    for path in _iter_all_files(config):
        rel = safe_rel_path(path, root)
        parts = rel.split("/")
        if len(parts) == 1:
            top_files.append(parts[0])
            continue
        top = parts[0]
        child = parts[1]
        top_dirs[top].append(rel)
        second_level[top][child] += 1

    lines: List[str] = []
    lines.append("## Top-Level Tree (Depth 2)")
    lines.append("")
    for file_name in sorted(top_files):
        lines.append(f"- `{file_name}`")
    for top in sorted(top_dirs):
        total_files = len(top_dirs[top])
        lines.append(f"- `{top}/` ({total_files} files)")
        child_rows = sorted(second_level[top].items(), key=lambda item: (item[0].lower(), item[1]))
        for child, count in child_rows[:max_children_per_dir]:
            suffix = "/" if any(p.startswith(f"{top}/{child}/") for p in top_dirs[top]) else ""
            lines.append(f"  - `{top}/{child}{suffix}` ({count})")
        if len(child_rows) > max_children_per_dir:
            lines.append(f"  - ... ({len(child_rows) - max_children_per_dir} more)")
    lines.append("")
    return lines


def detect_languages(config: ScanConfig) -> Dict[str, int]:
    counter: Counter[str] = Counter()
    root = config.in_dir.resolve()
    for path in _iter_all_files(config):
        ext = path.suffix.lower()
        lang = LANGUAGE_BY_EXTENSION.get(ext, "Other")
        counter[lang] += 1
    return {name: counter[name] for name in sorted(counter)}


def _read_text_safe(path: Path) -> str:
    raw = path.read_bytes()
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw.decode("latin-1", errors="replace")


def _extract_import_specs_from_text(path: Path, text: str) -> List[str]:
    ext = path.suffix.lower()
    specs: List[str] = []
    if ext in (".ts", ".tsx", ".js", ".jsx"):
        specs.extend(IMPORT_FROM_RE.findall(text))
        specs.extend(REQUIRE_RE.findall(text))
        specs.extend(DYNAMIC_IMPORT_RE.findall(text))
    elif ext == ".py":
        specs.extend(PY_IMPORT_RE.findall(text))
        specs.extend(PY_FROM_RE.findall(text))
    # deterministic unique order
    return sorted(set(specs))


def _build_source_file_map(config: ScanConfig) -> Dict[str, Path]:
    root = config.in_dir.resolve()
    out: Dict[str, Path] = {}
    for path in _iter_all_files(config):
        if path.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        rel = safe_rel_path(path, root)
        out[rel] = path
    return dict(sorted(out.items(), key=lambda item: item[0].lower()))


def _resolve_relative_module(base_path: Path, spec: str) -> Optional[Path]:
    """Resolve relative ts/js module spec to an existing file path."""
    if not spec.startswith("."):
        return None
    candidate_base = (base_path.parent / spec).resolve()
    trial_paths: List[Path] = []
    if candidate_base.suffix:
        trial_paths.append(candidate_base)
    else:
        for ext in (".ts", ".tsx", ".js", ".jsx", ".py"):
            trial_paths.append(Path(f"{candidate_base}{ext}"))
        for ext in (".ts", ".tsx", ".js", ".jsx", ".py"):
            trial_paths.append(candidate_base / f"index{ext}")
    for candidate in trial_paths:
        if candidate.exists() and candidate.is_file():
            return candidate.resolve()
    return None


def _resolve_python_module(
    spec: str,
    source_rel: str,
    source_path: Path,
    rel_to_abs: Dict[str, Path],
    abs_to_rel: Dict[Path, str],
) -> Optional[str]:
    # relative module via leading dots in "from .x import y".
    if spec.startswith("."):
        dot_count = 0
        for char in spec:
            if char == ".":
                dot_count += 1
            else:
                break
        remainder = spec[dot_count:]
        parent = source_path.parent
        for _ in range(max(0, dot_count - 1)):
            parent = parent.parent
        if remainder:
            rel_candidate = (parent / remainder.replace(".", "/")).resolve()
        else:
            rel_candidate = parent.resolve()
        trial = [rel_candidate.with_suffix(".py"), rel_candidate / "__init__.py"]
        for candidate in trial:
            rel_candidate_path = abs_to_rel.get(candidate.resolve())
            if rel_candidate_path:
                return rel_candidate_path
        return None

    # absolute module mapping into repo by module path.
    mod_parts = spec.split(".")
    candidate_rel = "/".join(mod_parts) + ".py"
    if candidate_rel in rel_to_abs:
        return candidate_rel
    candidate_pkg_init = "/".join(mod_parts) + "/__init__.py"
    if candidate_pkg_init in rel_to_abs:
        return candidate_pkg_init
    return None


def _resolve_import(
    source_rel: str,
    source_path: Path,
    import_spec: str,
    rel_to_abs: Dict[str, Path],
    abs_to_rel: Dict[Path, str],
) -> Optional[str]:
    ext = source_path.suffix.lower()
    if ext in (".ts", ".tsx", ".js", ".jsx"):
        resolved = _resolve_relative_module(source_path, import_spec)
        if resolved is None:
            return None
        return abs_to_rel.get(resolved.resolve())
    if ext == ".py":
        return _resolve_python_module(import_spec, source_rel, source_path, rel_to_abs, abs_to_rel)
    return None


def build_import_graph(config: ScanConfig) -> Tuple[List[ImportEdge], List[ImportHubRecord]]:
    rel_to_abs = _build_source_file_map(config)
    abs_to_rel = {path.resolve(): rel for rel, path in rel_to_abs.items()}
    source_rows = sorted(rel_to_abs.items(), key=lambda item: item[0].lower())
    progress = ProgressTracker(
        title="repo-import-scan",
        total=max(1, len(source_rows)),
        enabled=config.show_progress,
    )

    edges: List[ImportEdge] = []
    imports_out_count: Counter[str] = Counter()
    imports_in_count: Counter[str] = Counter()
    total_edges = 0

    for source_rel, source_path in source_rows:
        if total_edges >= config.max_import_edges:
            break
        try:
            text = _read_text_safe(source_path)
        except Exception:
            progress.update()
            continue
        specs = _extract_import_specs_from_text(source_path, text)
        for spec in specs:
            if total_edges >= config.max_import_edges:
                break
            resolved = _resolve_import(
                source_rel=source_rel,
                source_path=source_path,
                import_spec=spec,
                rel_to_abs=rel_to_abs,
                abs_to_rel=abs_to_rel,
            )
            external = resolved is None
            edges.append(
                ImportEdge(
                    source_file=source_rel,
                    import_spec=spec,
                    resolved_file=resolved,
                    external=external,
                )
            )
            imports_out_count[source_rel] += 1
            if resolved:
                imports_in_count[resolved] += 1
            total_edges += 1
        progress.update()
    progress.finish()

    hubs: List[ImportHubRecord] = []
    all_files = sorted(set(imports_out_count.keys()) | set(imports_in_count.keys()))
    for rel in all_files:
        out_count = imports_out_count.get(rel, 0)
        in_count = imports_in_count.get(rel, 0)
        hubs.append(
            ImportHubRecord(
                file=rel,
                imports_out=out_count,
                imports_in=in_count,
                total_links=out_count + in_count,
            )
        )
    hubs.sort(key=lambda row: (-row.total_links, -row.imports_in, row.file.lower()))
    edges.sort(
        key=lambda row: (
            row.source_file.lower(),
            row.import_spec,
            row.resolved_file or "",
            str(row.external),
        )
    )
    return edges, hubs


def _clean_contract_line(line: str) -> str:
    cleaned = line.strip()
    if cleaned.startswith("- "):
        cleaned = cleaned[2:].strip()
    if cleaned.startswith("* "):
        cleaned = cleaned[2:].strip()
    return cleaned


def parse_boundary_contract(config: ScanConfig) -> ParsedContract:
    root = config.in_dir.resolve()
    contract_path: Optional[Path] = None
    for rel in config.contract_paths:
        candidate = (root / rel).resolve()
        if candidate.exists() and candidate.is_file():
            contract_path = candidate
            break
    if contract_path is None:
        return ParsedContract(contract_path=None, boundaries={}, forbidden_edges=[])

    text = _read_text_safe(contract_path)
    section: Optional[str] = None
    boundaries: Dict[str, str] = {}
    forbidden_edges: List[Tuple[str, str]] = []

    for raw_line in text.splitlines():
        line = _clean_contract_line(raw_line)
        if not line:
            continue
        upper = line.strip().upper().strip("#").strip()
        if upper == CONTRACT_SECTION_BOUNDARIES:
            section = CONTRACT_SECTION_BOUNDARIES
            continue
        if upper == CONTRACT_SECTION_FORBIDDEN:
            section = CONTRACT_SECTION_FORBIDDEN
            continue
        if section == CONTRACT_SECTION_BOUNDARIES:
            if ":" not in line:
                continue
            name, prefix = line.split(":", 1)
            name = name.strip()
            prefix = prefix.strip().strip("/")
            if not name or not prefix:
                continue
            boundaries[name] = prefix
        elif section == CONTRACT_SECTION_FORBIDDEN:
            if "->" not in line:
                continue
            left, right = line.split("->", 1)
            left = left.strip()
            right = right.strip()
            if not left or not right:
                continue
            forbidden_edges.append((left, right))

    normalized_boundaries = dict(sorted(boundaries.items(), key=lambda item: item[0].lower()))
    forbidden_sorted = sorted(set(forbidden_edges), key=lambda pair: (pair[0], pair[1]))
    rel_contract = safe_rel_path(contract_path, root)
    return ParsedContract(
        contract_path=rel_contract,
        boundaries=normalized_boundaries,
        forbidden_edges=forbidden_sorted,
    )


def _boundary_for_file(rel_path: str, boundaries: Dict[str, str]) -> Optional[str]:
    best_name: Optional[str] = None
    best_len = -1
    for name, prefix in boundaries.items():
        normalized_prefix = prefix.strip("/").lower()
        if not normalized_prefix:
            continue
        if rel_path.lower() == normalized_prefix or rel_path.lower().startswith(normalized_prefix + "/"):
            if len(normalized_prefix) > best_len:
                best_len = len(normalized_prefix)
                best_name = name
    return best_name


def detect_boundary_violations(
    edges: Sequence[ImportEdge],
    boundaries: Dict[str, str],
    forbidden_pairs: Sequence[Tuple[str, str]],
) -> List[BoundaryViolationRecord]:
    forbidden_set = {(a, b) for a, b in forbidden_pairs}
    rows: List[BoundaryViolationRecord] = []

    for edge in edges:
        if not edge.resolved_file:
            continue
        from_boundary = _boundary_for_file(edge.source_file, boundaries)
        to_boundary = _boundary_for_file(edge.resolved_file, boundaries)
        if not from_boundary or not to_boundary:
            continue
        if (from_boundary, to_boundary) not in forbidden_set:
            continue
        seed = f"{edge.source_file}|{edge.resolved_file}|{from_boundary}|{to_boundary}"
        violation_id = f"BND-{stable_sha1_text(seed)[:12]}"
        rows.append(
            BoundaryViolationRecord(
                violation_id=violation_id,
                from_file=edge.source_file,
                to_file=edge.resolved_file,
                from_boundary=from_boundary,
                to_boundary=to_boundary,
                severity="ERROR",
                check_id=f"BND-FORBIDDEN-{stable_sha1_text(seed)[:8].upper()}",
                what_detected=(
                    f"Detected forbidden import from boundary `{from_boundary}` "
                    f"to `{to_boundary}`."
                ),
                why_it_matters=(
                    "Forbidden boundary imports increase coupling and can break "
                    "domain isolation required for parallel work."
                ),
                how_to_fix=(
                    "Move shared contract into an allowed boundary adapter and import "
                    "through that contract only."
                ),
                minimal_bad_example="Bad: ui/ imports runtime/internal implementation directly.",
                minimal_good_example="Good: ui/ imports runtime public adapter boundary.",
                next_best_action="Refactor this edge to an allowed boundary dependency.",
            )
        )
    rows.sort(
        key=lambda row: (
            row.from_boundary,
            row.to_boundary,
            row.from_file.lower(),
            row.to_file.lower(),
        )
    )
    return rows


def build_suspected_drift_findings(edges: Sequence[ImportEdge]) -> List[Dict[str, str]]:
    """Heuristic cross-top-level boundary drift candidates even without contract."""
    rows: List[Dict[str, str]] = []
    grouped: DefaultDict[Tuple[str, str], int] = defaultdict(int)
    for edge in edges:
        if not edge.resolved_file:
            continue
        src_top = _top_level_name(edge.source_file)
        dst_top = _top_level_name(edge.resolved_file)
        if src_top == dst_top:
            continue
        grouped[(src_top, dst_top)] += 1

    for (src_top, dst_top), count in sorted(
        grouped.items(), key=lambda item: (-item[1], item[0][0], item[0][1])
    ):
        if count < 3:
            continue
        seed = f"suspected|{src_top}|{dst_top}|{count}"
        check_id = f"DRIFT-{stable_sha1_text(seed)[:8].upper()}"
        rows.append(
            {
                "check_id": check_id,
                "severity": "WARN",
                "what_detected": (
                    f"Detected {count} cross-top-level imports from `{src_top}` to `{dst_top}`."
                ),
                "why_it_matters": (
                    "Cross-domain import growth is a boundary drift signal that can "
                    "reduce modular expansion capacity."
                ),
                "how_to_fix": (
                    "Define explicit boundary contracts and route dependencies through "
                    "stable adapters."
                ),
                "minimal_bad_example": (
                    "Bad: multiple direct imports across top-level domains."
                ),
                "minimal_good_example": (
                    "Good: cross-domain calls go through one explicit adapter boundary."
                ),
                "next_best_action": "Create/extend CONTRACT.md with boundary map + forbidden edges.",
            }
        )
    return rows


def scan_repo_structure(config: ScanConfig) -> RepoStructureResult:
    tree_lines = build_depth2_tree_summary(config)
    language_counts = detect_languages(config)
    edges, hubs = build_import_graph(config)
    contract = parse_boundary_contract(config)
    violations: List[BoundaryViolationRecord] = []
    if contract.boundaries and contract.forbidden_edges:
        violations = detect_boundary_violations(
            edges=edges,
            boundaries=contract.boundaries,
            forbidden_pairs=contract.forbidden_edges,
        )
    coach_findings = build_suspected_drift_findings(edges)
    for row in violations:
        coach_findings.append(
            {
                "check_id": row.check_id,
                "severity": row.severity,
                "what_detected": row.what_detected,
                "why_it_matters": row.why_it_matters,
                "how_to_fix": row.how_to_fix,
                "minimal_bad_example": row.minimal_bad_example,
                "minimal_good_example": row.minimal_good_example,
                "next_best_action": row.next_best_action,
            }
        )
    coach_findings.sort(
        key=lambda item: (
            {"BLOCKER": 0, "ERROR": 1, "WARN": 2, "INFO": 3}.get(item["severity"], 9),
            item["check_id"],
        )
    )

    return RepoStructureResult(
        tree_lines=tree_lines,
        language_counts=language_counts,
        import_hubs=hubs[:20],
        boundary_contract_path=contract.contract_path,
        boundary_map=contract.boundaries,
        forbidden_edges=contract.forbidden_edges,
        boundary_violations=violations,
        coach_findings=coach_findings,
    )

