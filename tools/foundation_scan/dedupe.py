"""Duplicate detection for Foundation Scan.

Implements:
- exact duplicates by normalized text hash
- near duplicates with shingled MinHash signatures and banding
"""

from __future__ import annotations

import math
import re
from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations
from typing import DefaultDict, Dict, Iterable, List, Sequence, Set, Tuple

from .config import DocumentRecord, DuplicateRecord, ProgressTracker, stable_sha1_text


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


def _normalize_for_hash(text: str) -> str:
    lowered = text.lower().replace("\r\n", "\n").replace("\r", "\n")
    normalized = " ".join(lowered.split())
    return normalized


def _tokenize(text: str) -> List[str]:
    return [token.lower() for token in TOKEN_RE.findall(text)]


def _doc_tokens(doc: DocumentRecord) -> List[str]:
    return _tokenize(doc.text)


def _shingles(tokens: Sequence[str], width: int = 5) -> Set[str]:
    if not tokens:
        return set()
    if len(tokens) < width:
        return {" ".join(tokens)}
    out: Set[str] = set()
    for idx in range(0, len(tokens) - width + 1):
        out.add(" ".join(tokens[idx : idx + width]))
    return out


def _jaccard(a: Set[str], b: Set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    if union <= 0:
        return 0.0
    return inter / union


def _minhash_signature(shingles: Set[str], permutations: int = 48) -> Tuple[int, ...]:
    """Produce deterministic pseudo-minhash signature with salted sha1 hashes."""
    if not shingles:
        return tuple([0] * permutations)
    sig: List[int] = []
    sorted_shingles = sorted(shingles)
    for idx in range(permutations):
        salt = f"perm:{idx}:"
        current_min = None
        for token in sorted_shingles:
            digest = stable_sha1_text(salt + token)
            # keep first 8 hex chars to reduce memory.
            value = int(digest[:8], 16)
            if current_min is None or value < current_min:
                current_min = value
        sig.append(current_min if current_min is not None else 0)
    return tuple(sig)


def _band_signature(
    signature: Sequence[int],
    bands: int = 12,
    rows_per_band: int = 4,
) -> List[Tuple[int, Tuple[int, ...]]]:
    out: List[Tuple[int, Tuple[int, ...]]] = []
    expected = bands * rows_per_band
    if len(signature) < expected:
        padded = list(signature) + [0] * (expected - len(signature))
    else:
        padded = list(signature[:expected])
    for band_index in range(bands):
        start = band_index * rows_per_band
        end = start + rows_per_band
        out.append((band_index, tuple(padded[start:end])))
    return out


def _coach_duplicate_fields(kind: str, similarity: float) -> Tuple[str, str, str, str, str, str]:
    if kind == "exact":
        severity = "ERROR"
        what = "Detected exact duplicate documents with identical normalized text hash."
        why = (
            "Exact duplicates split source-of-truth and increase governance drift "
            "across repos."
        )
        fix = (
            "Choose one canonical file, replace others with references, and keep one "
            "owner for updates."
        )
    else:
        severity = "WARN"
        what = f"Detected near-duplicate docs with similarity={similarity:0.3f}."
        why = (
            "Near duplicates often diverge later and create contradictory operational "
            "rules."
        )
        fix = (
            "Merge overlapping sections into a canonical document and preserve context "
            "as links."
        )
    bad = "Bad: duplicate rule docs evolve independently with conflicting edits."
    good = "Good: one canonical rule doc; secondary docs reference it."
    action = "Consolidate duplicates and mark a single owner for the canonical file."
    return severity, what, why, fix, bad, good, action


def detect_exact_duplicates(docs: Sequence[DocumentRecord]) -> List[DuplicateRecord]:
    hash_buckets: DefaultDict[str, List[DocumentRecord]] = defaultdict(list)
    for doc in docs:
        normalized = _normalize_for_hash(doc.text)
        text_hash = stable_sha1_text(normalized)
        hash_buckets[text_hash].append(doc)

    rows: List[DuplicateRecord] = []
    for norm_hash, bucket in sorted(hash_buckets.items(), key=lambda item: item[0]):
        if len(bucket) < 2:
            continue
        bucket = sorted(bucket, key=lambda d: d.rel_path.lower())
        for a, b in combinations(bucket, 2):
            pair_seed = f"exact|{a.rel_path}|{b.rel_path}|{norm_hash}"
            duplicate_id = f"DUP-{stable_sha1_text(pair_seed)[:12]}"
            severity, what, why, fix, bad, good, action = _coach_duplicate_fields(
                "exact", 1.0
            )
            rows.append(
                DuplicateRecord(
                    duplicate_id=duplicate_id,
                    duplicate_type="exact",
                    similarity=1.0,
                    doc_a=min(a.rel_path, b.rel_path),
                    doc_b=max(a.rel_path, b.rel_path),
                    check_id=f"DUP-EXACT-{norm_hash[:8].upper()}",
                    severity=severity,
                    what_detected=what,
                    why_it_matters=why,
                    how_to_fix=fix,
                    minimal_bad_example=bad,
                    minimal_good_example=good,
                    next_best_action=action,
                )
            )
    rows.sort(
        key=lambda row: (
            row.duplicate_type,
            -row.similarity,
            row.doc_a.lower(),
            row.doc_b.lower(),
            row.duplicate_id,
        )
    )
    return rows


@dataclass
class _DocNearDupState:
    doc: DocumentRecord
    shingles: Set[str]
    signature: Tuple[int, ...]


def detect_near_duplicates(
    docs: Sequence[DocumentRecord],
    threshold: float = 0.92,
    max_pairs: int = 8_000,
    max_docs: int = 20_000,
    progress_enabled: bool = True,
) -> List[DuplicateRecord]:
    """Detect near duplicates with bounded candidate generation."""
    docs_sorted = sorted(docs, key=lambda d: d.rel_path.lower())[:max_docs]
    progress = ProgressTracker(
        title="near-dup-signature",
        total=max(1, len(docs_sorted)),
        enabled=progress_enabled,
    )

    states: List[_DocNearDupState] = []
    for doc in docs_sorted:
        tokens = _doc_tokens(doc)
        shingles = _shingles(tokens, width=5)
        signature = _minhash_signature(shingles, permutations=48)
        states.append(_DocNearDupState(doc=doc, shingles=shingles, signature=signature))
        progress.update()
    progress.finish()

    bucket_map: DefaultDict[Tuple[int, Tuple[int, ...]], List[int]] = defaultdict(list)
    for idx, state in enumerate(states):
        for band in _band_signature(state.signature, bands=12, rows_per_band=4):
            bucket_map[band].append(idx)

    candidate_pairs: Set[Tuple[int, int]] = set()
    for _, idxs in sorted(bucket_map.items(), key=lambda item: (item[0][0], item[0][1])):
        if len(idxs) < 2:
            continue
        sorted_idxs = sorted(idxs)
        for a_pos in range(len(sorted_idxs)):
            a = sorted_idxs[a_pos]
            for b_pos in range(a_pos + 1, len(sorted_idxs)):
                b = sorted_idxs[b_pos]
                pair = (a, b)
                if pair in candidate_pairs:
                    continue
                candidate_pairs.add(pair)
                if len(candidate_pairs) >= max_pairs * 8:
                    break
            if len(candidate_pairs) >= max_pairs * 8:
                break
        if len(candidate_pairs) >= max_pairs * 8:
            break

    pair_progress = ProgressTracker(
        title="near-dup-jaccard",
        total=max(1, min(len(candidate_pairs), max_pairs * 8)),
        enabled=progress_enabled,
    )

    rows: List[DuplicateRecord] = []
    evaluated = 0
    for pair in sorted(candidate_pairs):
        if len(rows) >= max_pairs:
            break
        a_idx, b_idx = pair
        state_a = states[a_idx]
        state_b = states[b_idx]
        similarity = _jaccard(state_a.shingles, state_b.shingles)
        evaluated += 1
        pair_progress.update()
        if similarity < threshold:
            continue
        doc_a = min(state_a.doc.rel_path, state_b.doc.rel_path)
        doc_b = max(state_a.doc.rel_path, state_b.doc.rel_path)
        pair_seed = f"near|{doc_a}|{doc_b}|{similarity:0.6f}"
        duplicate_id = f"DUP-{stable_sha1_text(pair_seed)[:12]}"
        severity, what, why, fix, bad, good, action = _coach_duplicate_fields(
            "near", similarity
        )
        rows.append(
            DuplicateRecord(
                duplicate_id=duplicate_id,
                duplicate_type="near",
                similarity=round(similarity, 6),
                doc_a=doc_a,
                doc_b=doc_b,
                check_id=f"DUP-NEAR-{stable_sha1_text(doc_a + '|' + doc_b)[:8].upper()}",
                severity=severity,
                what_detected=what,
                why_it_matters=why,
                how_to_fix=fix,
                minimal_bad_example=bad,
                minimal_good_example=good,
                next_best_action=action,
            )
        )
    pair_progress.finish()

    rows.sort(
        key=lambda row: (
            row.duplicate_type,
            -row.similarity,
            row.doc_a.lower(),
            row.doc_b.lower(),
            row.duplicate_id,
        )
    )
    return rows


def detect_all_duplicates(
    docs: Sequence[DocumentRecord],
    threshold: float,
    max_near_dup_pairs: int,
    max_docs_for_near_dup: int,
    progress_enabled: bool = True,
) -> List[DuplicateRecord]:
    exact = detect_exact_duplicates(docs)
    near = detect_near_duplicates(
        docs=docs,
        threshold=threshold,
        max_pairs=max_near_dup_pairs,
        max_docs=max_docs_for_near_dup,
        progress_enabled=progress_enabled,
    )

    # Remove near entries that are exact duplicates.
    exact_pairs = {(row.doc_a, row.doc_b) for row in exact}
    near_filtered = [
        row for row in near if (row.doc_a, row.doc_b) not in exact_pairs
    ]
    out = exact + near_filtered
    out.sort(
        key=lambda row: (
            {"exact": 0, "near": 1}.get(row.duplicate_type, 9),
            -row.similarity,
            row.doc_a.lower(),
            row.doc_b.lower(),
            row.duplicate_id,
        )
    )
    return out

