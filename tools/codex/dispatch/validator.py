from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import secrets
import time
import zipfile
from pathlib import Path
from typing import Any

PASS = "PASS"
BLOCKED = "BLOCKED"

CODEX_IDS: tuple[str, ...] = (
    "A_core",
    "B_tooling",
    "C_features",
    "D_validation",
    "Z_aggregator",
)

RUN_ID_NEW_RE = re.compile(r"^(?P<day>\d{8})_(?P<time>\d{6})_(?P<rand>[A-Z0-9]{4})$")
RUN_ID_OLD_RE = re.compile(r"^(?P<day>\d{8})_(?P<seq>\d+)$")
PACK_SECTION_RE = re.compile(r"^===\s+(?P<worker>[A-Za-z0-9_]+)\s+PROMPT\s+===$")
PACK_WORKER_HEADERS: dict[str, str] = {
    "A_core": "=== A_core PROMPT ===",
    "B_tooling": "=== B_tooling PROMPT ===",
    "C_features": "=== C_features PROMPT ===",
    "D_validation": "=== D_validation PROMPT ===",
    "Z_aggregator": "=== Z_aggregator PROMPT ===",
}

REPO_ROOT = Path(__file__).resolve().parents[3]
CODEX_DIR = REPO_ROOT / "tools" / "codex"
PROMPT_ZIPS_DIR = CODEX_DIR / "prompt_zips"
PROMPTS_ROOT = CODEX_DIR / "prompts"
RUNS_ROOT = CODEX_DIR / "runs"

HEADER_SCAN_LINES = 40
DOC_WORKERS: tuple[str, ...] = CODEX_IDS[:-1]
WORKER_BUNDLE_REQUIRED: tuple[str, ...] = (
    "STATUS.json",
    "SUMMARY.md",
    "FILES_CHANGED.json",
    "DIFF.patch",
    "SUGGESTIONS.md",
    "DONE.marker",
)
AGGREGATOR_FINAL_REPORT_REL = "FILES/FINAL_REPORT.txt"
ROOT_FINAL_REPORT = REPO_ROOT / "FINAL_REPORT.md"


def _parse_workers_subset(raw: str | None) -> list[str]:
    if raw is None or not raw.strip():
        return list(CODEX_IDS)

    parsed = [part.strip() for part in str(raw).split(",") if part.strip()]
    if not parsed:
        return list(CODEX_IDS)

    unknown = [worker for worker in parsed if worker not in CODEX_IDS]
    if unknown:
        raise ValueError(f"unknown worker ids in --workers: {','.join(sorted(set(unknown)))}")

    deduped: list[str] = []
    for worker in parsed:
        if worker not in deduped:
            deduped.append(worker)
    return deduped


def _collect_existing_run_ids(day_prefix: str) -> list[str]:
    found: set[str] = set()
    roots = [RUNS_ROOT, PROMPTS_ROOT, PROMPT_ZIPS_DIR]

    for root in roots:
        if not root.exists():
            continue
        if root == PROMPT_ZIPS_DIR:
            entries = [item.stem for item in root.glob("*.zip") if item.is_file()]
        else:
            entries = [item.name for item in root.iterdir()]

        for name in entries:
            is_compatible = bool(RUN_ID_NEW_RE.fullmatch(name) or RUN_ID_OLD_RE.fullmatch(name))
            if is_compatible and str(name).startswith(day_prefix + "_"):
                found.add(name)

    return sorted(found)


def next_run_id(now_utc: dt.datetime | None = None) -> dict[str, Any]:
    now = now_utc or dt.datetime.now(dt.timezone.utc)
    day = now.strftime("%Y%m%d")
    existing = _collect_existing_run_ids(day)
    tries = 0
    run_id = ""
    while tries < 512:
        tries += 1
        stamp = now.strftime("%Y%m%d_%H%M%S")
        random4 = secrets.token_hex(2).upper()
        candidate = f"{stamp}_{random4}"
        if candidate not in existing and not (RUNS_ROOT / candidate).exists():
            run_id = candidate
            break
    if not run_id:
        return {
            "status": BLOCKED,
            "error": "unable to allocate collision-safe run_id after 512 attempts",
            "day": day,
            "existing_for_day": existing,
        }
    return {
        "status": PASS,
        "run_id": run_id,
        "day": day,
        "existing_for_day": existing,
        "source_counts": {
            "runs": len([item for item in existing if (RUNS_ROOT / item).exists()]),
            "prompts": len([item for item in existing if (PROMPTS_ROOT / item).exists()]),
            "prompt_zips": len([item for item in existing if (PROMPT_ZIPS_DIR / f"{item}.zip").exists()]),
        },
    }


def _parse_prompt_pack(text: str) -> tuple[dict[str, str], list[str], list[str]]:
    sections: dict[str, list[str]] = {}
    duplicates: list[str] = []
    seen_headers: list[str] = []
    current_worker: str | None = None

    for raw_line in text.splitlines():
        line = raw_line.rstrip("\n")
        match = PACK_SECTION_RE.match(line.strip())
        if match:
            worker = str(match.group("worker")).strip()
            seen_headers.append(worker)
            if worker in sections:
                duplicates.append(worker)
            sections.setdefault(worker, [])
            current_worker = worker
            continue

        if current_worker is not None:
            sections[current_worker].append(raw_line)

    extracted: dict[str, str] = {}
    for worker in CODEX_IDS:
        content_lines = sections.get(worker)
        if content_lines is None:
            continue
        prompt_text = "\n".join(content_lines).strip()
        if prompt_text:
            extracted[worker] = prompt_text + "\n"
        else:
            extracted[worker] = ""

    return extracted, duplicates, seen_headers


def materialize_prompt_pack(run_id: str, pack_path: Path) -> dict[str, Any]:
    prompt_dir = PROMPTS_ROOT / run_id
    expected = expected_prompt_files(run_id)

    if prompt_dir.exists():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "pack_path": pack_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
            "error": f"prompt folder already exists: {prompt_dir.as_posix()}",
        }

    if not pack_path.exists() or not pack_path.is_file():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "pack_path": pack_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
            "error": f"prompts pack missing: {pack_path.as_posix()}",
        }

    try:
        raw_text = pack_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "pack_path": pack_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
            "error": f"prompts pack is not UTF-8: {exc}",
        }

    parsed, duplicates, seen_headers = _parse_prompt_pack(raw_text)
    missing = [worker for worker in CODEX_IDS if worker not in parsed]
    empty = [worker for worker in CODEX_IDS if worker in parsed and not parsed[worker].strip()]
    unknown_sections = sorted(set(seen_headers) - set(CODEX_IDS))

    if missing or duplicates or empty or unknown_sections:
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "pack_path": pack_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
            "missing_sections": [PACK_WORKER_HEADERS.get(worker, worker) for worker in missing],
            "duplicate_sections": sorted(set(duplicates)),
            "empty_sections": sorted(empty),
            "unknown_sections": unknown_sections,
            "error": "prompts pack section validation failed",
        }

    prompt_dir.mkdir(parents=True, exist_ok=False)
    written: list[str] = []
    for worker in CODEX_IDS:
        file_name = expected[worker]
        target = prompt_dir / file_name
        resolved_text = parsed[worker].replace("{{RUN_ID}}", run_id)
        target.write_text(resolved_text, encoding="utf-8", newline="\n")
        written.append(target.as_posix())

    return {
        "status": PASS,
        "run_id": run_id,
        "pack_path": pack_path.as_posix(),
        "prompt_dir": prompt_dir.as_posix(),
        "written": sorted(written),
    }


def expected_prompt_files(run_id: str) -> dict[str, str]:
    return {worker: f"{worker}_{run_id}.txt" for worker in CODEX_IDS}


def _emit(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, indent=2, sort_keys=True))


def _status_code(status: str) -> int:
    return 0 if str(status).upper() == PASS else 2


def _match_header_value(text: str, key: str) -> tuple[str | None, int | None]:
    pattern = re.compile(rf"^\s*{re.escape(key)}\s*[:=]\s*(\S+)\s*$", re.IGNORECASE)
    for index, line in enumerate(text.splitlines()[:HEADER_SCAN_LINES], start=1):
        match = pattern.match(line)
        if match:
            return str(match.group(1)).strip(), index
    return None, None


def validate_run_id(run_id: str) -> list[str]:
    errors: list[str] = []
    match_new = RUN_ID_NEW_RE.fullmatch(run_id)
    match_old = RUN_ID_OLD_RE.fullmatch(run_id)
    if not match_new and not match_old:
        errors.append(
            "RUN_ID must match YYYYMMDD_HHMMSS_RAND4 (example: 20260228_215959_A1B2) "
            "or YYYYMMDD_SEQ (example: 20260228_17)."
        )
        return errors

    if match_new:
        day = str(match_new.group("day"))
        time_part = str(match_new.group("time"))
        try:
            dt.datetime.strptime(day + time_part, "%Y%m%d%H%M%S")
        except ValueError:
            errors.append(f"RUN_ID date/time component is invalid: {day}_{time_part}")
        return errors

    assert match_old is not None
    day_old = str(match_old.group("day"))
    try:
        dt.datetime.strptime(day_old, "%Y%m%d")
    except ValueError:
        errors.append(f"RUN_ID date component is invalid: {day_old}")

    return errors


def extract_prompt_zip(run_id: str) -> dict[str, Any]:
    zip_path = PROMPT_ZIPS_DIR / f"{run_id}.zip"
    prompt_dir = PROMPTS_ROOT / run_id
    expected = expected_prompt_files(run_id)
    expected_names = set(expected.values())

    if prompt_dir.exists():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "error": f"prompt folder already exists: {prompt_dir.as_posix()}",
            "zip": zip_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
        }

    if not zip_path.exists():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "error": f"missing prompt zip: {zip_path.as_posix()}",
            "zip": zip_path.as_posix(),
            "prompt_dir": prompt_dir.as_posix(),
        }

    with zipfile.ZipFile(zip_path) as archive:
        members = [member for member in archive.infolist() if not member.is_dir()]
        by_basename: dict[str, list[zipfile.ZipInfo]] = {}
        for member in members:
            base = Path(member.filename).name
            if not base:
                continue
            by_basename.setdefault(base, []).append(member)

        missing = sorted(name for name in expected_names if name not in by_basename)
        duplicates = sorted(name for name, items in by_basename.items() if name in expected_names and len(items) > 1)
        unexpected = sorted(name for name in by_basename if name not in expected_names)

        if missing or duplicates or unexpected:
            return {
                "status": BLOCKED,
                "run_id": run_id,
                "zip": zip_path.as_posix(),
                "prompt_dir": prompt_dir.as_posix(),
                "missing": missing,
                "duplicates": duplicates,
                "unexpected": unexpected,
                "error": "zip shape validation failed",
            }

        decoded_prompts: dict[str, str] = {}
        for worker in CODEX_IDS:
            name = expected[worker]
            info = by_basename[name][0]
            raw = archive.read(info)
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError as exc:
                return {
                    "status": BLOCKED,
                    "run_id": run_id,
                    "zip": zip_path.as_posix(),
                    "prompt_dir": prompt_dir.as_posix(),
                    "error": f"prompt is not UTF-8: {name} ({exc})",
                }
            decoded_prompts[name] = text

        prompt_dir.mkdir(parents=True, exist_ok=False)
        extracted: list[str] = []
        for worker in CODEX_IDS:
            name = expected[worker]
            target = prompt_dir / name
            target.write_text(decoded_prompts[name], encoding="utf-8", newline="\n")
            extracted.append(target.as_posix())

    return {
        "status": PASS,
        "run_id": run_id,
        "zip": zip_path.as_posix(),
        "prompt_dir": prompt_dir.as_posix(),
        "extracted": sorted(extracted),
    }


def _validate_prompt_file(path: Path, run_id: str, worker: str) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    normalized_text = text.replace("\\", "/")

    run_value, run_line = _match_header_value(text, "RUN_ID")
    if run_value is None:
        errors.append("missing RUN_ID header near file top")
    elif run_value != run_id:
        errors.append(f"RUN_ID mismatch in header (line {run_line}): expected {run_id}, got {run_value}")

    codex_value, codex_line = _match_header_value(text, "CODEX_ID")
    if codex_value is None:
        errors.append("missing CODEX_ID header near file top")
    elif codex_value != worker:
        errors.append(f"CODEX_ID mismatch in header (line {codex_line}): expected {worker}, got {codex_value}")

    marker_path = f"tools/codex/runs/{run_id}/{worker}/DONE.marker"
    if marker_path not in normalized_text:
        errors.append(f"missing DONE.marker path instruction: {marker_path}")

    return errors


def validate_prompt_folder(run_id: str) -> dict[str, Any]:
    prompt_dir = PROMPTS_ROOT / run_id
    expected = expected_prompt_files(run_id)
    expected_names = set(expected.values())

    if not prompt_dir.exists() or not prompt_dir.is_dir():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "prompt_dir": prompt_dir.as_posix(),
            "error": "prompt folder is missing",
        }

    entries = sorted(prompt_dir.iterdir(), key=lambda item: item.name)
    entry_errors: list[str] = []
    file_names: set[str] = set()

    for entry in entries:
        if entry.is_dir():
            if entry.name != "logs":
                entry_errors.append(f"unexpected directory in prompt folder: {entry.name}")
            continue
        file_names.add(entry.name)
        if entry.name not in expected_names:
            entry_errors.append(f"unexpected file in prompt folder: {entry.name}")

    missing_names = sorted(name for name in expected_names if name not in file_names)
    if len(file_names.intersection(expected_names)) != len(expected_names):
        entry_errors.extend(f"missing prompt file: {name}" for name in missing_names)

    file_results: list[dict[str, Any]] = []
    for worker in CODEX_IDS:
        name = expected[worker]
        path = prompt_dir / name
        if not path.exists() or not path.is_file():
            file_results.append({"worker": worker, "file": name, "status": BLOCKED, "errors": ["file missing"]})
            continue
        file_errors = _validate_prompt_file(path, run_id, worker)
        file_results.append(
            {
                "worker": worker,
                "file": path.as_posix(),
                "status": PASS if not file_errors else BLOCKED,
                "errors": file_errors,
            }
        )

    blocked = [item for item in file_results if item["status"] != PASS]
    if entry_errors:
        blocked.append({"worker": "<folder>", "status": BLOCKED, "errors": entry_errors})

    return {
        "status": PASS if not blocked else BLOCKED,
        "run_id": run_id,
        "prompt_dir": prompt_dir.as_posix(),
        "entries": [entry.name for entry in entries],
        "results": file_results,
        "errors": entry_errors,
        "blocked": len(blocked),
    }


def wait_for_done_markers(
    run_id: str,
    *,
    workers: list[str] | None,
    timeout_seconds: int,
    poll_seconds: float,
) -> dict[str, Any]:
    chosen_workers = workers or list(CODEX_IDS)
    start = time.monotonic()
    deadline = start + max(1, int(timeout_seconds))

    per_worker: dict[str, dict[str, Any]] = {
        worker: {
            "worker": worker,
            "marker": (RUNS_ROOT / run_id / worker / "DONE.marker").as_posix(),
            "status": "PENDING",
            "content_ok": False,
            "error": "",
        }
        for worker in chosen_workers
    }

    while time.monotonic() <= deadline:
        all_done = True
        for worker, entry in per_worker.items():
            marker = Path(str(entry["marker"]))
            token = f"DONE {run_id} {worker}"
            if not marker.exists():
                entry["status"] = "PENDING"
                entry["content_ok"] = False
                entry["error"] = "marker missing"
                all_done = False
                continue

            try:
                text = marker.read_text(encoding="utf-8")
            except OSError as exc:
                entry["status"] = "PENDING"
                entry["content_ok"] = False
                entry["error"] = f"marker unreadable: {exc}"
                all_done = False
                continue

            if token not in text:
                entry["status"] = "PENDING"
                entry["content_ok"] = False
                entry["error"] = f"marker content missing token: {token}"
                all_done = False
                continue

            entry["status"] = PASS
            entry["content_ok"] = True
            entry["error"] = ""

        if all_done:
            duration = round(time.monotonic() - start, 3)
            return {
                "status": PASS,
                "run_id": run_id,
                "duration_seconds": duration,
                "timeout_seconds": int(timeout_seconds),
                "workers": [per_worker[worker] for worker in chosen_workers],
            }

        time.sleep(max(0.1, float(poll_seconds)))

    duration = round(time.monotonic() - start, 3)
    blocked_workers = [entry for entry in per_worker.values() if entry["status"] != PASS]
    blocked_names = sorted(str(item["worker"]) for item in blocked_workers)
    return {
        "status": BLOCKED,
        "run_id": run_id,
        "duration_seconds": duration,
        "timeout_seconds": int(timeout_seconds),
        "workers": [per_worker[worker] for worker in chosen_workers],
        "blocked": len(blocked_workers),
        "error": f"DONE.marker timeout after {int(timeout_seconds)}s; pending_workers={','.join(blocked_names)}",
        "pending_workers": blocked_names,
    }


def _bundle_missing_entries(run_id: str, worker: str) -> list[str]:
    root = RUNS_ROOT / run_id / worker
    missing: list[str] = []
    for rel in WORKER_BUNDLE_REQUIRED:
        if not (root / rel).exists():
            missing.append(rel)
    files_dir = root / "FILES"
    if not files_dir.exists() or not files_dir.is_dir():
        missing.append("FILES/")
    return sorted(set(missing))


def validate_guardrails(run_id: str) -> dict[str, Any]:
    run_root = RUNS_ROOT / run_id
    errors: list[str] = []
    workers_payload: list[dict[str, Any]] = []

    if not run_root.exists():
        return {
            "status": BLOCKED,
            "run_id": run_id,
            "error": f"run folder missing: {run_root.as_posix()}",
        }

    for worker in DOC_WORKERS:
        worker_root = run_root / worker
        docs_dir = worker_root / "FILES" / "docs_test"
        docs = sorted(
            [path.as_posix() for path in docs_dir.glob("*.md") if path.is_file()],
            key=lambda value: value,
        ) if docs_dir.exists() else []
        missing_bundle = _bundle_missing_entries(run_id, worker)
        docs_count = len(docs)
        docs_ok = docs_count == 3
        bundle_ok = len(missing_bundle) == 0
        if not docs_ok:
            errors.append(f"{worker}: expected exactly 3 docs in FILES/docs_test, found {docs_count}")
        if not bundle_ok:
            errors.append(f"{worker}: missing bundle artifacts: {', '.join(missing_bundle)}")
        workers_payload.append(
            {
                "bundle_ok": bundle_ok,
                "docs_count": docs_count,
                "docs_ok": docs_ok,
                "docs": docs,
                "missing_bundle": missing_bundle,
                "worker": worker,
            }
        )

    for worker in CODEX_IDS:
        missing_bundle = _bundle_missing_entries(run_id, worker)
        if missing_bundle:
            errors.append(f"{worker}: missing bundle artifacts: {', '.join(missing_bundle)}")

    aggregator_report = run_root / "Z_aggregator" / "FILES" / "FINAL_REPORT.txt"
    if not aggregator_report.exists():
        errors.append(f"missing aggregator report: {aggregator_report.as_posix()}")
    else:
        text = aggregator_report.read_text(encoding="utf-8")
        ROOT_FINAL_REPORT.write_text(text, encoding="utf-8", newline="\n")

    if not ROOT_FINAL_REPORT.exists():
        errors.append(f"missing root report: {ROOT_FINAL_REPORT.as_posix()}")

    return {
        "status": PASS if not errors else BLOCKED,
        "run_id": run_id,
        "workers": workers_payload,
        "z_aggregator_report": aggregator_report.as_posix(),
        "root_final_report": ROOT_FINAL_REPORT.as_posix(),
        "errors": sorted(set(errors)),
    }


def _cmd_validate_run_id(args: argparse.Namespace) -> int:
    errors = validate_run_id(args.run_id)
    payload = {
        "status": PASS if not errors else BLOCKED,
        "run_id": args.run_id,
        "errors": errors,
    }
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_extract_zip(args: argparse.Namespace) -> int:
    payload = extract_prompt_zip(args.run_id)
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_validate_prompts(args: argparse.Namespace) -> int:
    payload = validate_prompt_folder(args.run_id)
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_wait_done(args: argparse.Namespace) -> int:
    try:
        chosen_workers = _parse_workers_subset(args.workers)
    except ValueError as exc:
        payload = {
            "status": BLOCKED,
            "run_id": args.run_id,
            "error": str(exc),
        }
        _emit(payload)
        return _status_code(payload["status"])

    payload = wait_for_done_markers(
        args.run_id,
        workers=chosen_workers,
        timeout_seconds=int(args.timeout_seconds),
        poll_seconds=float(args.poll_seconds),
    )
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_validate_guardrails(args: argparse.Namespace) -> int:
    payload = validate_guardrails(args.run_id)
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_next_run_id(args: argparse.Namespace) -> int:
    payload = next_run_id()
    _emit(payload)
    return _status_code(payload["status"])


def _cmd_materialize_pack(args: argparse.Namespace) -> int:
    payload = materialize_prompt_pack(args.run_id, Path(args.pack_path))
    _emit(payload)
    return _status_code(payload["status"])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="RUN_ID prompt system validator")
    sub = parser.add_subparsers(dest="command", required=True)

    validate_run_id_cmd = sub.add_parser("validate-run-id", help="Validate RUN_ID format")
    validate_run_id_cmd.add_argument("--run-id", required=True)
    validate_run_id_cmd.set_defaults(func=_cmd_validate_run_id)

    extract_zip_cmd = sub.add_parser("extract-zip", help="Extract strict prompt zip")
    extract_zip_cmd.add_argument("--run-id", required=True)
    extract_zip_cmd.set_defaults(func=_cmd_extract_zip)

    validate_prompts_cmd = sub.add_parser("validate-prompts", help="Validate prompt folder and files")
    validate_prompts_cmd.add_argument("--run-id", required=True)
    validate_prompts_cmd.set_defaults(func=_cmd_validate_prompts)

    wait_done_cmd = sub.add_parser("wait-done", help="Wait for all DONE.marker files")
    wait_done_cmd.add_argument("--run-id", required=True)
    wait_done_cmd.add_argument("--workers", help="Comma-separated worker IDs subset")
    wait_done_cmd.add_argument("--timeout-seconds", type=int, default=3600)
    wait_done_cmd.add_argument("--poll-seconds", type=float, default=2.0)
    wait_done_cmd.set_defaults(func=_cmd_wait_done)

    guardrails_cmd = sub.add_parser("validate-guardrails", help="Validate worker docs/bundles and publish root FINAL_REPORT.md")
    guardrails_cmd.add_argument("--run-id", required=True)
    guardrails_cmd.set_defaults(func=_cmd_validate_guardrails)

    next_run_id_cmd = sub.add_parser("next-run-id", help="Generate next RUN_ID in YYYYMMDD_HHMMSS_RAND4 format")
    next_run_id_cmd.set_defaults(func=_cmd_next_run_id)

    materialize_pack_cmd = sub.add_parser("materialize-pack", help="Parse a pack file and write canonical worker prompt files")
    materialize_pack_cmd.add_argument("--run-id", required=True)
    materialize_pack_cmd.add_argument("--pack-path", required=True)
    materialize_pack_cmd.set_defaults(func=_cmd_materialize_pack)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
