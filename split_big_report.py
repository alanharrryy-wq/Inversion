from __future__ import annotations
import os, re, sys
from pathlib import Path
from datetime import datetime

SECTION_RE = re.compile(r"^=+.*?SECTION\s+\d+\s+—\s+(.+?)\s*$", re.MULTILINE)
FILE_START_RE = re.compile(r"^>>> FILE START:\s+(.+?)\s*$", re.MULTILINE)
FILE_END_RE = re.compile(r"^>>> FILE END:\s+(.+?)\s*$", re.MULTILINE)

def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", errors="replace")

def main():
    if len(sys.argv) < 2:
        print("Usage: python split_big_report.py <big_report.txt>")
        return 2

    src = Path(sys.argv[1]).resolve()
    txt = src.read_text(encoding="utf-8", errors="replace")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = src.parent / f"{src.stem}__CHUNKED_{ts}"
    chunks = out / "CHUNKS"
    files = out / "FILES"
    out.mkdir(parents=True, exist_ok=True)

    # Split sections
    matches = list(SECTION_RE.finditer(txt))
    sections = []
    for i, m in enumerate(matches):
        s = m.start()
        e = matches[i+1].start() if i+1 < len(matches) else len(txt)
        sections.append((m.group(1).strip(), txt[s:e]))

    index = ["# INDEX\n"]

    for i,(title,body) in enumerate(sections):
        safe = re.sub(r"[^a-zA-Z0-9._-]+","_",title)[:120]
        p = chunks / f"{i:02d}__{safe}.txt"
        write(p, body)
        index.append(f"- {p.name} — {title}")

    # Extract files
    for fs in FILE_START_RE.finditer(txt):
        fe = FILE_END_RE.search(txt, fs.end())
        if not fe: continue
        rel = fs.group(1).strip()
        content = txt[fs.end():fe.start()]
        write(files / rel, content)

    write(out / "INDEX.md", "\n".join(index))
    print(f"✅ Chunked output: {out}")
    try:
        os.startfile(out)
    except:
        pass

if __name__ == "__main__":
    raise SystemExit(main())
