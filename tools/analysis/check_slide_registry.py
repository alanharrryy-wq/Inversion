#!/usr/bin/env python3
"""Deterministic slide registry drift checker.

Inputs:
- Exported schema JSON from scripts/export-slide-schema.ts

Outputs:
- docs/_generated/SLIDE_REGISTRY_REPORT.json
- docs/_generated/SLIDE_REGISTRY_REPORT.md

Determinism constraints:
- Stable ordering for all collections
- No required timestamps in artifacts
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "slide-registry-report.v1"
SLOT_COUNT = 20
REQUIRED_SLOTS = list(range(SLOT_COUNT))
REQUIRED_ROUTE_IDS = [f"{idx:02d}" for idx in REQUIRED_SLOTS]


@dataclass(frozen=True)
class Issue:
    code: str
    level: str  # error | warning | info
    message: str
    slot: int | None = None
    route_id: str | None = None

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "code": self.code,
            "level": self.level,
            "message": self.message,
        }
        if self.slot is not None:
            out["slot"] = self.slot
        if self.route_id is not None:
            out["routeId"] = self.route_id
        return out


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate canonical slide registry and report drift.")
    parser.add_argument(
        "--schema-json",
        default=".run/slide-schema-export.json",
        help="Path to exported schema JSON.",
    )
    parser.add_argument(
        "--json-out",
        default="docs/_generated/SLIDE_REGISTRY_REPORT.json",
        help="Deterministic JSON report output path.",
    )
    parser.add_argument(
        "--md-out",
        default="docs/_generated/SLIDE_REGISTRY_REPORT.md",
        help="Deterministic Markdown report output path.",
    )
    return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8")
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("Schema JSON root must be an object")
    return payload


def normalize_rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def find_existing_candidates(repo_root: Path, file_candidates: list[str]) -> list[str]:
    existing: list[str] = []
    for candidate in sorted(file_candidates):
        candidate_path = (repo_root / candidate).resolve()
        try:
            candidate_path.relative_to(repo_root)
        except ValueError:
            continue
        if candidate_path.exists() and candidate_path.is_file():
            existing.append(candidate)
    return existing


def choose_mounted_candidate(
    component_export: str,
    file_candidates: list[str],
    existing_candidates: list[str],
) -> str | None:
    if not existing_candidates:
        return None

    candidate_by_export = [
        candidate
        for candidate in existing_candidates
        if Path(candidate).stem == component_export
    ]
    if candidate_by_export:
        return sorted(candidate_by_export)[0]

    default_candidate = f"components/slides/{component_export}.tsx"
    if default_candidate in existing_candidates:
        return default_candidate

    for candidate in sorted(file_candidates):
        if candidate in existing_candidates:
            return candidate

    return sorted(existing_candidates)[0]


def collect_slide_files(repo_root: Path) -> list[str]:
    slides_dir = repo_root / "components" / "slides"
    if not slides_dir.exists():
        return []
    return sorted(
        normalize_rel(path, repo_root)
        for path in slides_dir.glob("Slide*.tsx")
        if path.is_file()
    )


def collect_schema_issues(entries: list[dict[str, Any]]) -> list[Issue]:
    issues: list[Issue] = []
    seen_slots: set[int] = set()
    seen_route_ids: set[str] = set()

    for entry in entries:
        slot = entry.get("slot")
        route_id = entry.get("routeId")

        if not isinstance(slot, int):
            issues.append(Issue("SCHEMA_SLOT_INVALID", "error", f"Invalid slot value: {slot!r}"))
            continue
        if slot < 0 or slot >= SLOT_COUNT:
            issues.append(
                Issue(
                    "SCHEMA_SLOT_RANGE",
                    "error",
                    f"Slot out of range 0..19: {slot}",
                    slot=slot,
                )
            )
        if slot in seen_slots:
            issues.append(
                Issue(
                    "SCHEMA_SLOT_DUPLICATE",
                    "error",
                    f"Duplicate slot in schema: {slot}",
                    slot=slot,
                )
            )
        seen_slots.add(slot)

        if not isinstance(route_id, str) or not re.match(r"^\d{2}$", route_id):
            issues.append(
                Issue(
                    "SCHEMA_ROUTE_INVALID",
                    "error",
                    f"Invalid routeId format at slot {slot}: {route_id!r}",
                    slot=slot if isinstance(slot, int) else None,
                )
            )
            continue

        expected_route = f"{slot:02d}" if isinstance(slot, int) else None
        if expected_route and route_id != expected_route:
            issues.append(
                Issue(
                    "SCHEMA_ROUTE_MISMATCH",
                    "error",
                    f"Slot {slot} expected routeId {expected_route}, got {route_id}",
                    slot=slot,
                    route_id=route_id,
                )
            )

        if route_id in seen_route_ids:
            issues.append(
                Issue(
                    "SCHEMA_ROUTE_DUPLICATE",
                    "error",
                    f"Duplicate routeId in schema: {route_id}",
                    slot=slot,
                    route_id=route_id,
                )
            )
        seen_route_ids.add(route_id)

    missing_slots = [slot for slot in REQUIRED_SLOTS if slot not in seen_slots]
    if missing_slots:
        issues.append(
            Issue(
                "SCHEMA_SLOT_MISSING",
                "error",
                f"Missing slots: {', '.join(f'{slot:02d}' for slot in missing_slots)}",
            )
        )

    missing_routes = [route_id for route_id in REQUIRED_ROUTE_IDS if route_id not in seen_route_ids]
    if missing_routes:
        issues.append(
            Issue(
                "SCHEMA_ROUTE_MISSING",
                "error",
                f"Missing routeIds: {', '.join(missing_routes)}",
            )
        )

    return issues


def build_report(
    repo_root: Path,
    schema_payload: dict[str, Any],
) -> tuple[dict[str, Any], list[Issue]]:
    entries = schema_payload.get("slides")
    if not isinstance(entries, list):
        raise ValueError("Schema payload must include slides[]")

    ordered_entries = sorted(entries, key=lambda entry: int(entry["slot"]))
    issues = collect_schema_issues(ordered_entries)
    slide_files = collect_slide_files(repo_root)

    referenced_files: set[str] = set()
    slot_details: list[dict[str, Any]] = []
    mismatches: list[dict[str, Any]] = []
    orphan_candidates: list[dict[str, Any]] = []

    for raw_entry in ordered_entries:
        slot = int(raw_entry["slot"])
        route_id = str(raw_entry["routeId"])
        component_export = str(raw_entry["componentExport"])
        label = str(raw_entry["label"])
        canonical_name = str(raw_entry["canonicalName"])
        aliases = sorted(str(alias) for alias in raw_entry.get("aliases", []))
        notes = str(raw_entry.get("notes", ""))
        file_candidates = sorted(str(candidate) for candidate in raw_entry.get("fileCandidates", []))
        existing_candidates = find_existing_candidates(repo_root, file_candidates)
        mounted_candidate = choose_mounted_candidate(component_export, file_candidates, existing_candidates)
        referenced_files.update(file_candidates)

        missing_candidates = [candidate for candidate in file_candidates if candidate not in existing_candidates]
        if not existing_candidates:
            issues.append(
                Issue(
                    "CANDIDATE_FILE_MISSING",
                    "error",
                    f"Slot {slot:02d} has no existing candidate file for component {component_export}.",
                    slot=slot,
                    route_id=route_id,
                )
            )

        if missing_candidates:
            issues.append(
                Issue(
                    "CANDIDATE_FILE_PARTIAL",
                    "warning",
                    f"Slot {slot:02d} has missing candidate files: {', '.join(missing_candidates)}",
                    slot=slot,
                    route_id=route_id,
                )
            )

        if canonical_name != component_export or label != canonical_name:
            if notes.strip():
                mismatches.append(
                    {
                        "slot": slot,
                        "routeId": route_id,
                        "componentExport": component_export,
                        "label": label,
                        "canonicalName": canonical_name,
                        "notes": notes,
                    }
                )
            else:
                issues.append(
                    Issue(
                        "MISMATCH_NOT_DOCUMENTED",
                        "error",
                        (
                            f"Slot {slot:02d} mismatch is undocumented "
                            f"(component={component_export}, label={label}, canonical={canonical_name})."
                        ),
                        slot=slot,
                        route_id=route_id,
                    )
                )

        if len(existing_candidates) > 1 and mounted_candidate:
            for orphan in sorted(candidate for candidate in existing_candidates if candidate != mounted_candidate):
                orphan_candidates.append(
                    {
                        "slot": slot,
                        "routeId": route_id,
                        "mountedCandidate": mounted_candidate,
                        "orphanCandidate": orphan,
                    }
                )
            issues.append(
                Issue(
                    "ORPHAN_DUPLICATE_IMPLEMENTATION",
                    "warning",
                    f"Slot {slot:02d} has multiple implementations; mounted={mounted_candidate}.",
                    slot=slot,
                    route_id=route_id,
                )
            )

        slot_details.append(
            {
                "slot": slot,
                "routeId": route_id,
                "componentExport": component_export,
                "label": label,
                "canonicalName": canonical_name,
                "aliases": aliases,
                "fileCandidates": file_candidates,
                "existingCandidates": existing_candidates,
                "mountedCandidate": mounted_candidate,
                "notes": notes,
            }
        )

    unreferenced_slide_files = sorted(path for path in slide_files if path not in referenced_files)
    if unreferenced_slide_files:
        issues.append(
            Issue(
                "UNREFERENCED_SLIDE_FILE",
                "warning",
                "Unreferenced slide files detected outside schema candidate lists.",
            )
        )

    issues_sorted = sorted(
        issues,
        key=lambda item: (item.level, item.code, item.slot if item.slot is not None else 999, item.message),
    )
    errors = [issue.as_dict() for issue in issues_sorted if issue.level == "error"]
    warnings = [issue.as_dict() for issue in issues_sorted if issue.level == "warning"]
    info = [issue.as_dict() for issue in issues_sorted if issue.level == "info"]

    checks = [
        {
            "id": "slots_coverage_0_19",
            "status": "pass" if not any(issue["code"] in {"SCHEMA_SLOT_INVALID", "SCHEMA_SLOT_RANGE", "SCHEMA_SLOT_DUPLICATE", "SCHEMA_SLOT_MISSING"} for issue in errors) else "fail",
        },
        {
            "id": "route_ids_coverage_00_19",
            "status": "pass" if not any(issue["code"] in {"SCHEMA_ROUTE_INVALID", "SCHEMA_ROUTE_DUPLICATE", "SCHEMA_ROUTE_MISSING", "SCHEMA_ROUTE_MISMATCH"} for issue in errors) else "fail",
        },
        {
            "id": "documented_mismatches",
            "status": "pass" if not any(issue["code"] == "MISMATCH_NOT_DOCUMENTED" for issue in errors) else "fail",
        },
        {
            "id": "candidate_files_exist",
            "status": "pass" if not any(issue["code"] == "CANDIDATE_FILE_MISSING" for issue in errors) else "fail",
        },
    ]

    report = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceSchemaVersion": schema_payload.get("schemaVersion", "unknown"),
        "summary": {
            "slotCount": len(slot_details),
            "routeCount": len({entry["routeId"] for entry in slot_details}),
            "errorCount": len(errors),
            "warningCount": len(warnings),
            "infoCount": len(info),
            "isValid": len(errors) == 0,
        },
        "checks": checks,
        "slots": slot_details,
        "drift": {
            "documentedMismatches": sorted(mismatches, key=lambda item: item["slot"]),
            "orphanImplementations": sorted(
                orphan_candidates,
                key=lambda item: (item["slot"], item["orphanCandidate"]),
            ),
            "unreferencedSlideFiles": unreferenced_slide_files,
        },
        "issues": {
            "errors": errors,
            "warnings": warnings,
            "info": info,
        },
    }

    return report, issues_sorted


def to_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines: list[str] = []
    lines.append("# Slide Registry Report")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Slot count: {summary['slotCount']}")
    lines.append(f"- Route count: {summary['routeCount']}")
    lines.append(f"- Errors: {summary['errorCount']}")
    lines.append(f"- Warnings: {summary['warningCount']}")
    lines.append(f"- Valid: {'YES' if summary['isValid'] else 'NO'}")
    lines.append("")
    lines.append("## Checks")
    lines.append("")
    for check in report["checks"]:
        lines.append(f"- `{check['id']}`: `{check['status']}`")
    lines.append("")
    lines.append("## Documented Mismatches")
    lines.append("")
    mismatches = report["drift"]["documentedMismatches"]
    if not mismatches:
        lines.append("- None")
    else:
        lines.append("| Slot | Route | Mounted Export | Canonical | Label | Notes |")
        lines.append("|---|---|---|---|---|---|")
        for mismatch in mismatches:
            lines.append(
                "| "
                f"{mismatch['slot']:02d} | "
                f"{mismatch['routeId']} | "
                f"{mismatch['componentExport']} | "
                f"{mismatch['canonicalName']} | "
                f"{mismatch['label']} | "
                f"{mismatch['notes']} |"
            )
    lines.append("")
    lines.append("## Orphan Implementations")
    lines.append("")
    orphan_impl = report["drift"]["orphanImplementations"]
    if not orphan_impl:
        lines.append("- None")
    else:
        lines.append("| Slot | Route | Mounted Candidate | Orphan Candidate |")
        lines.append("|---|---|---|---|")
        for item in orphan_impl:
            lines.append(
                "| "
                f"{item['slot']:02d} | "
                f"{item['routeId']} | "
                f"{item['mountedCandidate']} | "
                f"{item['orphanCandidate']} |"
            )
    lines.append("")
    lines.append("## Unreferenced Slide Files")
    lines.append("")
    unreferenced = report["drift"]["unreferencedSlideFiles"]
    if not unreferenced:
        lines.append("- None")
    else:
        for file_path in unreferenced:
            lines.append(f"- `{file_path}`")
    lines.append("")
    lines.append("## Errors")
    lines.append("")
    errors = report["issues"]["errors"]
    if not errors:
        lines.append("- None")
    else:
        for issue in errors:
            lines.append(f"- `{issue['code']}`: {issue['message']}")
    lines.append("")
    lines.append("## Warnings")
    lines.append("")
    warnings = report["issues"]["warnings"]
    if not warnings:
        lines.append("- None")
    else:
        for issue in warnings:
            lines.append(f"- `{issue['code']}`: {issue['message']}")
    lines.append("")
    return "\n".join(lines)


def write_outputs(json_out: Path, md_out: Path, report: dict[str, Any]) -> None:
    json_out.parent.mkdir(parents=True, exist_ok=True)
    md_out.parent.mkdir(parents=True, exist_ok=True)

    json_out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    md_out.write_text(to_markdown(report) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    script_path = Path(__file__).resolve()
    repo_root = script_path.parents[2]
    schema_json = (repo_root / args.schema_json).resolve()
    json_out = (repo_root / args.json_out).resolve()
    md_out = (repo_root / args.md_out).resolve()

    if not schema_json.exists():
        raise FileNotFoundError(f"Schema JSON not found: {schema_json}")

    schema_payload = read_json(schema_json)
    report, issues = build_report(repo_root, schema_payload)
    write_outputs(json_out, md_out, report)

    rel_json = normalize_rel(json_out, repo_root)
    rel_md = normalize_rel(md_out, repo_root)
    print(f"[check_slide_registry] wrote {rel_json}")
    print(f"[check_slide_registry] wrote {rel_md}")

    has_errors = any(issue.level == "error" for issue in issues)
    if has_errors:
        print("[check_slide_registry] FAIL (errors detected)")
        return 1

    print("[check_slide_registry] PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
