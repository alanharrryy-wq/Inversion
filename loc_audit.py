from __future__ import annotations

import os
import re
import subprocess
from collections import defaultdict
from datetime import datetime
from pathlib import Path

EXCLUDE_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "build",
    ".vite",
    ".turbo",
    ".next",
    "coverage",
    ".cache",
    ".pnpm-store",
    ".yarn",
    ".idea",
    ".vscode",
}

TEXT_EXT_ALLOWLIST = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".txt",
    ".svg",
    ".env",
    ".toml",
    ".ini",
    ".sh",
    ".ps1",
}

# Matches SlideNN as a path token prefix, including:
# - components/slides/Slide00.tsx
# - components/slides/slide00-ui/...
# - docs/slide07/README.md
SLIDE_REGEX = re.compile(r"(?i)(?:^|[\\/])(slide\d{2})(?=[^0-9]|$)")


def run_git(args: list[str]) -> str:
    try:
        p = subprocess.run(
            ["git", *args],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
    except FileNotFoundError as exc:
        raise SystemExit(
            "ERROR: git not found in PATH. Install Git for Windows and retry."
        ) from exc

    if p.returncode != 0 and args[:1] != ["log"]:
        raise SystemExit(f"ERROR running git {' '.join(args)}\n{p.stderr.strip()}")

    return p.stdout


def safe_read_line_count(path: Path) -> int:
    try:
        with path.open("rb") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0


def is_excluded(path: Path) -> bool:
    parts = {p.lower() for p in path.parts}
    return any(d.lower() in parts for d in EXCLUDE_DIRS)


def normalize_slide_key(raw_key: str) -> str:
    # raw_key expected shape: slideNN (case-insensitive)
    digits = raw_key[-2:]
    return f"Slide{digits}"


def fmt_table(data: dict[str, int], title: str) -> str:
    items = sorted(data.items(), key=lambda kv: kv[1], reverse=True)
    lines = [title, "-" * len(title)]

    if not items:
        lines.append("(no data)")
        lines.append("")
        return "\n".join(lines)

    w_key = max([len(k) for k, _ in items] + [10])
    for key, value in items:
        lines.append(f"{key:<{w_key}}  {value:>12,}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    root = Path.cwd()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    files_raw = run_git(["ls-files"])
    tracked = [Path(line.strip()) for line in files_raw.splitlines() if line.strip()]

    total_loc = 0
    by_ext: dict[str, int] = defaultdict(int)
    by_slide: dict[str, int] = defaultdict(int)
    top_files: list[tuple[int, str]] = []

    for rel in tracked:
        abs_path = root / rel
        if not abs_path.exists():
            continue
        if is_excluded(rel):
            continue

        ext = abs_path.suffix.lower()
        if ext and ext not in TEXT_EXT_ALLOWLIST:
            continue

        loc = safe_read_line_count(abs_path)
        if loc <= 0:
            continue

        total_loc += loc
        by_ext[ext or "(noext)"] += loc

        match = SLIDE_REGEX.search(str(rel))
        slide_key = normalize_slide_key(match.group(1)) if match else "(non-slide)"
        by_slide[slide_key] += loc

        top_files.append((loc, str(rel)))

    top_files.sort(reverse=True, key=lambda x: x[0])
    top_files = top_files[:50]

    ins = 0
    dele = 0
    numstat = run_git(["log", "--numstat", "--pretty=format:"])
    for line in numstat.splitlines():
        line = line.strip()
        if not line:
            continue

        parts = line.split("\t")
        if len(parts) < 3:
            continue

        added, removed = parts[0], parts[1]
        if added.isdigit():
            ins += int(added)
        if removed.isdigit():
            dele += int(removed)

    branch = run_git(["rev-parse", "--abbrev-ref", "HEAD"]).strip()
    status = run_git(["status", "--porcelain=v1"])
    diffstat = run_git(["diff", "--stat"])
    log50 = run_git(["log", "--oneline", "--decorate", "-n", "50"])

    report_name = f"INVERSION_LOC_AUDIT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    report_path = root / report_name

    with report_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("INVERSION - LOC AUDIT (Git-tracked)\n")
        f.write("============================================================\n")
        f.write(f"Generated: {now}\n")
        f.write(f"Repo root: {root}\n")
        f.write(f"Branch   : {branch}\n\n")

        f.write("GIT STATUS (porcelain)\n")
        f.write("------------------------------------------------------------\n")
        f.write(status.strip() + "\n\n" if status.strip() else "(clean)\n\n")

        f.write("GIT DIFF --stat\n")
        f.write("------------------------------------------------------------\n")
        f.write(diffstat.strip() + "\n\n" if diffstat.strip() else "(no diff)\n\n")

        f.write("GIT LOG -n 50\n")
        f.write("------------------------------------------------------------\n")
        f.write(log50.strip() + "\n\n")

        f.write("CURRENT LOC (physical lines)\n")
        f.write("------------------------------------------------------------\n")
        f.write(f"TOTAL LOC (filtered text-ish extensions): {total_loc:,}\n\n")

        f.write(fmt_table(by_ext, "LOC BY EXTENSION"))
        f.write(fmt_table(by_slide, "LOC BY SLIDE (SlideNN)"))

        f.write("TOP 50 FILES BY LOC\n")
        f.write("------------------------------------------------------------\n")
        for loc, path in top_files:
            f.write(f"{loc:>8,}  {path}\n")
        f.write("\n")

        f.write("HISTORICAL GIT CHURN (ALL TIME)\n")
        f.write("------------------------------------------------------------\n")
        f.write(f"Insertions (sum of git log --numstat): {ins:,}\n")
        f.write(f"Deletions   (sum of git log --numstat): {dele:,}\n")
        f.write(f"Net: {ins - dele:,}\n\n")

        f.write("NOTES\n")
        f.write("------------------------------------------------------------\n")
        f.write("- Counts only Git-tracked files (git ls-files).\n")
        f.write("- Excludes common build/cache dirs and non-text extensions.\n")
        f.write("- LOC is physical lines (includes comments/blanks).\n")

    size_mb = report_path.stat().st_size / (1024 * 1024)

    print(f"\nOK: wrote report -> {report_path}")
    print(f"Size: {size_mb:.2f} MB\n")

    try:
        os.startfile(str(report_path))  # type: ignore[attr-defined]
    except Exception:
        pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
