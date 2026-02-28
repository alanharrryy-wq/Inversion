from __future__ import annotations

import argparse
import json
import subprocess
import traceback
from dataclasses import asdict, dataclass
from pathlib import Path
from time import perf_counter
from typing import Sequence


@dataclass(frozen=True)
class SubprocessResult:
    rc: int
    stdout: str
    stderr: str
    cmd: list[str]
    cwd: str
    duration_ms: int

    def to_json(self) -> str:
        return json.dumps(asdict(self), sort_keys=True, ensure_ascii=False)


def run_command(cmd: Sequence[str], *, cwd: str) -> SubprocessResult:
    start = perf_counter()
    try:
        proc = subprocess.run(
            list(cmd),
            cwd=cwd,
            shell=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        duration_ms = int((perf_counter() - start) * 1000)
        return SubprocessResult(
            rc=int(proc.returncode),
            stdout=proc.stdout or "",
            stderr=proc.stderr or "",
            cmd=[str(part) for part in cmd],
            cwd=str(cwd),
            duration_ms=duration_ms,
        )
    except Exception as exc:
        duration_ms = int((perf_counter() - start) * 1000)
        return SubprocessResult(
            rc=255,
            stdout="",
            stderr=f"subprocessx internal failure: {exc!r}\n{traceback.format_exc()}",
            cmd=[str(part) for part in cmd],
            cwd=str(cwd),
            duration_ms=duration_ms,
        )


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deterministic subprocess runner with JSON output")
    parser.add_argument("--cwd", required=True)
    parser.add_argument("cmd", nargs=argparse.REMAINDER)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    cmd = list(args.cmd)
    if cmd and cmd[0] == "--":
        cmd = cmd[1:]
    if not cmd:
        payload = SubprocessResult(
            rc=255,
            stdout="",
            stderr="subprocessx: empty command",
            cmd=[],
            cwd=str(Path(args.cwd)),
            duration_ms=0,
        )
        print(payload.to_json())
        return 0

    payload = run_command(cmd, cwd=str(Path(args.cwd)))
    print(payload.to_json())
    # Keep runner exit code deterministic for wrapper consumers; command rc lives in JSON.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
