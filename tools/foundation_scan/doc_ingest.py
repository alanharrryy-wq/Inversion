"""Document ingestion for Foundation Scan.

Responsibilities:
- deterministic file discovery
- exclusion filters
- extraction for PDF/DOCX/MD/TXT/QML
- chunking with overlap
- warnings for extraction failures or truncation
"""

from __future__ import annotations

import re
import zipfile
from pathlib import Path
from typing import Dict, Iterable, Iterator, List, Optional, Sequence, Tuple

from .config import (
    ChunkRecord,
    DocumentRecord,
    ExtractionWarning,
    ProgressTracker,
    ScanConfig,
    safe_rel_path,
    stable_sha1_bytes,
    stable_sha1_text,
)


WORD_DOC_XML_PATHS: Tuple[str, ...] = (
    "word/document.xml",
    "word/footnotes.xml",
    "word/endnotes.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/header3.xml",
    "word/footer1.xml",
    "word/footer2.xml",
    "word/footer3.xml",
)


PDF_TEXT_RE = re.compile(rb"\(([^()]*)\)\s*Tj")
PDF_ARRAY_TEXT_RE = re.compile(rb"\[(.*?)\]\s*TJ", flags=re.DOTALL)
PDF_INNER_STR_RE = re.compile(rb"\(([^()]*)\)")
WHITESPACE_RE = re.compile(r"\s+")
TAG_RE = re.compile(r"<[^>]+>")


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u0000", " ")
    text = WHITESPACE_RE.sub(" ", text)
    return text.strip()


def _decode_pdf_literal(raw: bytes) -> str:
    """Decode a PDF literal string with simple escaped sequences."""
    if not raw:
        return ""
    # common escapes in PDF literal strings.
    transformed = (
        raw.replace(rb"\(", b"(")
        .replace(rb"\)", b")")
        .replace(rb"\n", b"\n")
        .replace(rb"\r", b"\r")
        .replace(rb"\t", b"\t")
        .replace(rb"\\", b"\\")
    )
    try:
        return transformed.decode("utf-8")
    except UnicodeDecodeError:
        return transformed.decode("latin-1", errors="replace")


def _extract_pdf_text_fallback(data: bytes) -> str:
    """Fallback parser for text in PDFs without third-party dependencies."""
    pieces: List[str] = []
    for match in PDF_TEXT_RE.finditer(data):
        pieces.append(_decode_pdf_literal(match.group(1)))
    for match in PDF_ARRAY_TEXT_RE.finditer(data):
        arr = match.group(1)
        for inner in PDF_INNER_STR_RE.finditer(arr):
            pieces.append(_decode_pdf_literal(inner.group(1)))
    text = "\n".join(piece for piece in pieces if piece.strip())
    return _normalize_whitespace(text)


def _extract_pdf_text(path: Path) -> Tuple[str, List[str]]:
    warnings: List[str] = []
    data = path.read_bytes()

    # First try pypdf if installed.
    try:
        from pypdf import PdfReader  # type: ignore

        reader = PdfReader(str(path))
        pages: List[str] = []
        for idx, page in enumerate(reader.pages):
            try:
                pages.append(page.extract_text() or "")
            except Exception as page_exc:  # pragma: no cover - defensive
                warnings.append(f"PDF_PAGE_EXTRACT_FAIL page={idx} err={page_exc}")
        text = _normalize_whitespace("\n".join(pages))
        if not text:
            warnings.append("PDF_EMPTY_TEXT_PYPDF")
            text = _extract_pdf_text_fallback(data)
            if text:
                warnings.append("PDF_FALLBACK_LITERAL_STRINGS")
        return text, warnings
    except Exception:
        warnings.append("PDF_PYPDF_UNAVAILABLE")

    text = _extract_pdf_text_fallback(data)
    if not text:
        warnings.append("PDF_NO_TEXT_EXTRACTED_FALLBACK")
    else:
        warnings.append("PDF_FALLBACK_LITERAL_STRINGS")
    return text, warnings


def _extract_docx_text(path: Path) -> Tuple[str, List[str]]:
    warnings: List[str] = []
    pieces: List[str] = []
    try:
        with zipfile.ZipFile(path, "r") as archive:
            name_set = set(archive.namelist())
            candidate_names = [name for name in WORD_DOC_XML_PATHS if name in name_set]
            if not candidate_names and "word/document.xml" not in name_set:
                warnings.append("DOCX_NO_MAIN_DOCUMENT_XML")
            for name in candidate_names or ["word/document.xml"]:
                if name not in name_set:
                    continue
                raw = archive.read(name)
                xml = raw.decode("utf-8", errors="replace")
                # Replace paragraph boundaries with new lines before tag stripping.
                xml = xml.replace("</w:p>", "\n")
                xml = xml.replace("</w:tr>", "\n")
                xml = xml.replace("</w:tc>", "\t")
                stripped = TAG_RE.sub(" ", xml)
                cleaned = _normalize_whitespace(stripped)
                if cleaned:
                    pieces.append(cleaned)
    except zipfile.BadZipFile:
        warnings.append("DOCX_BAD_ZIP")
    except KeyError as missing_key:
        warnings.append(f"DOCX_MISSING_PART {missing_key}")
    except Exception as exc:  # pragma: no cover - defensive
        warnings.append(f"DOCX_EXTRACT_FAIL {exc}")

    text = "\n".join(piece for piece in pieces if piece.strip())
    text = _normalize_whitespace(text)
    if not text:
        warnings.append("DOCX_EMPTY_TEXT")
    return text, warnings


def _extract_text_plain(path: Path) -> Tuple[str, List[str]]:
    warnings: List[str] = []
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        warnings.append("PLAINTEXT_UTF8_DECODE_FAIL_FALLBACK_LATIN1")
        text = raw.decode("latin-1", errors="replace")
    text = text.replace("\ufeff", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text.strip(), warnings


def _should_skip_dir(name: str, exclude_dirs: Sequence[str]) -> bool:
    lowered = name.lower()
    return any(lowered == item.lower() for item in exclude_dirs)


def _is_in_output_dir(path: Path, output_dir: Path) -> bool:
    try:
        path.resolve().relative_to(output_dir.resolve())
        return True
    except Exception:
        return False


def discover_document_paths(config: ScanConfig) -> List[Path]:
    """Discover files deterministically and enforce exclusions."""
    root = config.in_dir.resolve()
    out_dir = config.out_dir.resolve()
    include_set = {ext.lower() for ext in config.include_extensions}
    discovered: List[Path] = []

    # deterministic traversal by explicit stack.
    stack: List[Path] = [root]
    while stack:
        current = stack.pop()
        if _is_in_output_dir(current, out_dir):
            continue
        try:
            entries = list(current.iterdir())
        except (PermissionError, OSError):
            continue
        entries.sort(key=lambda p: p.name.lower())

        subdirs: List[Path] = []
        for entry in entries:
            if entry.is_dir():
                if _should_skip_dir(entry.name, config.exclude_dirs):
                    continue
                subdirs.append(entry)
            elif entry.is_file():
                ext = entry.suffix.lower()
                if ext not in include_set:
                    continue
                try:
                    size = entry.stat().st_size
                except OSError:
                    continue
                if size > config.max_file_bytes:
                    continue
                discovered.append(entry.resolve())
        # stack is LIFO; append reversed to preserve alphabetical order globally.
        for sub in reversed(subdirs):
            stack.append(sub)

    discovered.sort(key=lambda p: safe_rel_path(p, root).lower())
    return discovered


def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> List[Tuple[int, int, str]]:
    """Chunk text deterministically by character range."""
    if not text:
        return []
    if chunk_size <= 0:
        return [(0, len(text), text)]
    overlap = min(max(0, chunk_overlap), max(0, chunk_size - 1))
    step = max(1, chunk_size - overlap)
    chunks: List[Tuple[int, int, str]] = []
    cursor = 0
    text_len = len(text)
    while cursor < text_len:
        end = min(text_len, cursor + chunk_size)
        piece = text[cursor:end]
        chunks.append((cursor, end, piece))
        if end >= text_len:
            break
        cursor += step
    return chunks


def _extract_by_extension(path: Path) -> Tuple[str, List[str]]:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return _extract_pdf_text(path)
    if ext == ".docx":
        return _extract_docx_text(path)
    if ext in (".md", ".txt", ".qml"):
        return _extract_text_plain(path)
    return "", [f"UNSUPPORTED_EXTENSION {ext}"]


def ingest_documents(
    config: ScanConfig,
) -> Tuple[List[DocumentRecord], List[ChunkRecord], List[ExtractionWarning]]:
    """Run full document ingestion pipeline."""
    paths = discover_document_paths(config)
    progress = ProgressTracker(
        title="ingest-docs",
        total=max(1, len(paths)),
        enabled=config.show_progress,
    )

    docs: List[DocumentRecord] = []
    chunks: List[ChunkRecord] = []
    all_warnings: List[ExtractionWarning] = []

    for path in paths:
        rel_path = safe_rel_path(path, config.in_dir)
        warning_rows: List[ExtractionWarning] = []
        try:
            file_bytes = path.read_bytes()
            file_sha1 = stable_sha1_bytes(file_bytes)
            size_bytes = len(file_bytes)
        except Exception as exc:
            warning_rows.append(
                ExtractionWarning(
                    rel_path=rel_path,
                    warning_code="FILE_READ_FAIL",
                    message=str(exc),
                )
            )
            docs.append(
                DocumentRecord(
                    rel_path=rel_path,
                    abs_path=path,
                    extension=path.suffix.lower(),
                    size_bytes=0,
                    file_sha1="",
                    text_sha1="",
                    text="",
                    char_count=0,
                    chunk_count=0,
                    warnings=warning_rows,
                )
            )
            all_warnings.extend(warning_rows)
            progress.update()
            continue

        text, warn_messages = _extract_by_extension(path)
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        text_sha1 = stable_sha1_text(text)

        for message in warn_messages:
            warning_rows.append(
                ExtractionWarning(
                    rel_path=rel_path,
                    warning_code="EXTRACT_WARN",
                    message=message,
                )
            )

        chunk_ranges = chunk_text(text, config.chunk_size, config.chunk_overlap)
        for chunk_index, (start, end, chunk_body) in enumerate(chunk_ranges):
            chunk_id_seed = f"{rel_path}|{chunk_index}|{start}|{end}|{stable_sha1_text(chunk_body)}"
            chunk_id = f"CHK-{stable_sha1_text(chunk_id_seed)[:12]}"
            chunks.append(
                ChunkRecord(
                    chunk_id=chunk_id,
                    doc_rel_path=rel_path,
                    chunk_index=chunk_index,
                    offset_start=start,
                    offset_end=end,
                    text=chunk_body,
                    text_sha1=stable_sha1_text(chunk_body),
                )
            )

        doc_record = DocumentRecord(
            rel_path=rel_path,
            abs_path=path,
            extension=path.suffix.lower(),
            size_bytes=size_bytes,
            file_sha1=file_sha1,
            text_sha1=text_sha1,
            text=text,
            char_count=len(text),
            chunk_count=len(chunk_ranges),
            warnings=warning_rows,
        )
        docs.append(doc_record)
        all_warnings.extend(warning_rows)
        progress.update()

    progress.finish()
    docs.sort(key=lambda d: d.rel_path.lower())
    chunks.sort(key=lambda c: (c.doc_rel_path.lower(), c.chunk_index, c.chunk_id))
    all_warnings.sort(key=lambda w: (w.rel_path.lower(), w.warning_code, w.message))
    return docs, chunks, all_warnings


def docs_to_index_rows(docs: Sequence[DocumentRecord]) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    for doc in sorted(docs, key=lambda d: d.rel_path.lower()):
        row = {
            "rel_path": doc.rel_path,
            "extension": doc.extension,
            "size_bytes": doc.size_bytes,
            "file_sha1": doc.file_sha1,
            "text_sha1": doc.text_sha1,
            "char_count": doc.char_count,
            "line_count": doc.line_count,
            "chunk_count": doc.chunk_count,
            "warnings": [
                {
                    "warning_code": warning.warning_code,
                    "message": warning.message,
                }
                for warning in sorted(
                    doc.warnings, key=lambda w: (w.warning_code, w.message)
                )
            ],
        }
        rows.append(row)
    return rows


def warning_rows_to_dicts(warnings: Sequence[ExtractionWarning]) -> List[Dict[str, str]]:
    return [
        {
            "rel_path": warning.rel_path,
            "warning_code": warning.warning_code,
            "message": warning.message,
        }
        for warning in sorted(
            warnings,
            key=lambda w: (w.rel_path.lower(), w.warning_code, w.message),
        )
    ]

