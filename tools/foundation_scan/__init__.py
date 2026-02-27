"""Foundation Scan package exports with lazy CLI imports.

Lazy wrappers avoid importing `scan.py` during package init, which prevents
`python -m tools.foundation_scan.scan` runpy warnings.
"""

from __future__ import annotations

from typing import Dict, Sequence

from .config import ScanConfig


def run_scan(config: ScanConfig) -> Dict[str, object]:
    from .scan import run_scan as _run_scan

    return _run_scan(config)


def main(argv: Sequence[str] | None = None) -> int:
    from .scan import main as _main

    return _main(argv)


__all__ = ["ScanConfig", "main", "run_scan"]
