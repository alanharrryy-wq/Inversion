"""Living-rules extraction heuristics for Foundation Scan."""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence, Set, Tuple

from .config import ChunkRecord, RuleRecord, stable_sha1_text


SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\n+")
MULTISPACE_RE = re.compile(r"\s+")
TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


MANDATORY_MARKERS: Tuple[str, ...] = (
    "must",
    "shall",
    "required",
    "mandatory",
    "non-negotiable",
)

SOFT_MARKERS: Tuple[str, ...] = (
    "should",
    "recommended",
    "prefer",
    "ideally",
)

NEGATIVE_MARKERS: Tuple[str, ...] = (
    "must not",
    "never",
    "forbidden",
    "prohibited",
    "do not",
    "can't",
    "cannot",
)

BLOCKER_MARKERS: Tuple[str, ...] = (
    "critical",
    "blocker",
    "non-negotiable",
    "prohibited",
    "forbidden",
    "never",
)

ERROR_MARKERS: Tuple[str, ...] = (
    "must",
    "shall",
    "required",
    "mandatory",
)

WARN_MARKERS: Tuple[str, ...] = (
    "should",
    "prefer",
    "recommended",
)

TOPIC_KEYWORDS: Tuple[Tuple[str, Tuple[str, ...]], ...] = (
    ("architecture", ("architecture", "orchestrator", "module", "boundary", "contract")),
    ("imports", ("import", "dependency", "coupling", "cross-boundary")),
    ("testing", ("test", "smoke", "e2e", "unit", "snapshot")),
    ("performance", ("parallel", "latency", "performance", "scale", "runtime")),
    ("documentation", ("readme", "manual", "runbook", "docs", "documentation")),
    ("ui", ("ui", "slide", "visual", "gesture", "component")),
    ("security", ("security", "token", "credential", "secret", "permission")),
    ("delivery", ("deliverable", "output", "report", "artifact", "csv")),
)


@dataclass(frozen=True)
class RuleHeuristic:
    severity: str
    polarity: str
    topic: str


def _normalize_text(text: str) -> str:
    return MULTISPACE_RE.sub(" ", text.strip())


def _iter_sentences(text: str) -> Iterable[str]:
    for sentence in SENTENCE_SPLIT_RE.split(text):
        cleaned = _normalize_text(sentence)
        if not cleaned:
            continue
        yield cleaned


def _contains_any(text: str, markers: Sequence[str]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


def _infer_severity(sentence: str) -> str:
    lowered = sentence.lower()
    if any(marker in lowered for marker in BLOCKER_MARKERS):
        return "BLOCKER"
    if any(marker in lowered for marker in ERROR_MARKERS):
        return "ERROR"
    if any(marker in lowered for marker in WARN_MARKERS):
        return "WARN"
    return "INFO"


def _infer_polarity(sentence: str) -> str:
    lowered = sentence.lower()
    if any(marker in lowered for marker in NEGATIVE_MARKERS):
        return "NEG"
    if any(marker in lowered for marker in MANDATORY_MARKERS):
        return "POS"
    if any(marker in lowered for marker in SOFT_MARKERS):
        return "POS"
    return "NEU"


def _infer_topic(sentence: str) -> str:
    lowered = sentence.lower()
    for topic, keys in TOPIC_KEYWORDS:
        if any(key in lowered for key in keys):
            return topic
    return "general"


def _is_rule_candidate(sentence: str) -> bool:
    lowered = sentence.lower()
    if len(lowered) < 18:
        return False
    has_rule_language = (
        _contains_any(lowered, MANDATORY_MARKERS)
        or _contains_any(lowered, SOFT_MARKERS)
        or _contains_any(lowered, NEGATIVE_MARKERS)
    )
    if has_rule_language:
        return True
    explicit_tags = (
        "rule:",
        "policy:",
        "forbidden:",
        "allowed:",
        "must:",
        "should:",
        "prohibido",
        "obligatorio",
        "no negociable",
    )
    return any(tag in lowered for tag in explicit_tags)


def _tokenize(text: str) -> List[str]:
    return [token.lower() for token in TOKEN_RE.findall(text)]


def _build_check_id(topic: str, severity: str, sentence: str) -> str:
    digest = stable_sha1_text(f"{topic}|{severity}|{sentence}")[:8].upper()
    return f"RULE-{topic[:3].upper()}-{severity[:3].upper()}-{digest}"


def _compact_snippet(sentence: str, max_chars: int = 220) -> str:
    cleaned = _normalize_text(sentence)
    if len(cleaned) <= max_chars:
        return cleaned
    return f"{cleaned[: max_chars - 3]}..."


def _coach_why(topic: str, severity: str) -> str:
    if topic == "architecture":
        return (
            "Boundary drift increases coupling and makes runtime behavior harder "
            "to reason about under parallel delivery."
        )
    if topic == "imports":
        return (
            "Cross-domain imports make modules interdependent and reduce safe "
            "parallelization of feature work."
        )
    if topic == "testing":
        return (
            "Weak test guidance increases regression risk and slows confidence "
            "during high-scale iterations."
        )
    if topic == "performance":
        return (
            "Performance ambiguity can degrade runtime predictability as data and "
            "document volume grow."
        )
    if topic == "documentation":
        return (
            "Unclear rules in docs produce execution drift across repos and teams."
        )
    if severity in ("BLOCKER", "ERROR"):
        return (
            "High-severity ambiguity can break contract compliance and increase "
            "operational risk."
        )
    return "Clarifying this rule reduces drift and improves execution speed."


def _coach_fix(topic: str, polarity: str) -> str:
    if topic == "architecture":
        return (
            "State the ownership boundary explicitly and move implementation details "
            "into module-local runtime/helpers."
        )
    if topic == "imports":
        return (
            "Define allowed dependency direction in contract docs and enforce it in "
            "CI lint checks."
        )
    if topic == "testing":
        return (
            "Specify minimum smoke coverage and deterministic replay checks in the "
            "same domain folder."
        )
    if topic == "performance":
        return (
            "Attach measurable thresholds and cap expensive pairwise operations with "
            "clear defaults."
        )
    if polarity == "NEG":
        return "Replace vague prohibitions with explicit alternatives and scope."
    return "Convert statement into a single actionable requirement with owner + scope."


def _coach_examples(topic: str) -> Tuple[str, str]:
    if topic == "architecture":
        return (
            "Bad: \"Entry point chooses domain logic inline.\"",
            "Good: \"Entry point orchestrates only; logic lives in domain runtime.\"",
        )
    if topic == "imports":
        return (
            "Bad: \"ui/ imports runtime/internal directly.\"",
            "Good: \"ui/ depends only on public runtime contract module.\"",
        )
    if topic == "testing":
        return (
            "Bad: \"Run all tests every tiny change.\"",
            "Good: \"Run targeted smoke and reducer units per domain iteration.\"",
        )
    if topic == "performance":
        return (
            "Bad: \"Compare every doc against every doc.\"",
            "Good: \"Use LSH candidate blocks and pair caps before similarity checks.\"",
        )
    return (
        "Bad: \"Rule text is vague and non-actionable.\"",
        "Good: \"Rule states owner, scope, and measurable action.\"",
    )


def _next_best_action(topic: str) -> str:
    mapping = {
        "architecture": "Promote this rule into CONTRACT.md boundary section.",
        "imports": "Add import direction guard and run it in CI.",
        "testing": "Create one deterministic smoke test for this rule.",
        "performance": "Set and enforce explicit complexity caps.",
        "documentation": "Consolidate duplicated rule text into one canonical source.",
    }
    return mapping.get(topic, "Convert this statement into one canonical rule row.")


def _dedupe_candidate_rules(records: List[RuleRecord]) -> List[RuleRecord]:
    seen: Set[str] = set()
    out: List[RuleRecord] = []
    for row in records:
        fingerprint = stable_sha1_text(
            f"{row.source_file}|{row.statement.lower()}|{row.severity}|{row.topic}|{row.polarity}"
        )
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        out.append(row)
    return out


def extract_living_rules(chunks: Sequence[ChunkRecord]) -> List[RuleRecord]:
    """Extract rule-like sentences from chunked docs with coach contract fields."""
    rows: List[RuleRecord] = []
    for chunk in chunks:
        for sentence in _iter_sentences(chunk.text):
            if not _is_rule_candidate(sentence):
                continue
            severity = _infer_severity(sentence)
            polarity = _infer_polarity(sentence)
            topic = _infer_topic(sentence)
            statement = _normalize_text(sentence)
            rule_seed = f"{chunk.doc_rel_path}|{chunk.chunk_id}|{statement}"
            rule_id = f"R-{stable_sha1_text(rule_seed)[:12]}"
            check_id = _build_check_id(topic, severity, statement)
            bad_example, good_example = _coach_examples(topic)

            rows.append(
                RuleRecord(
                    rule_id=rule_id,
                    source_file=chunk.doc_rel_path,
                    chunk_id=chunk.chunk_id,
                    severity=severity,
                    polarity=polarity,
                    topic=topic,
                    statement=statement,
                    evidence_snippet=_compact_snippet(sentence),
                    check_id=check_id,
                    what_detected=f"Detected a {severity.lower()} rule candidate in documentation text.",
                    why_it_matters=_coach_why(topic, severity),
                    how_to_fix=_coach_fix(topic, polarity),
                    minimal_bad_example=bad_example,
                    minimal_good_example=good_example,
                    next_best_action=_next_best_action(topic),
                )
            )

    deduped = _dedupe_candidate_rules(rows)
    deduped.sort(
        key=lambda row: (
            {"BLOCKER": 0, "ERROR": 1, "WARN": 2, "INFO": 3}.get(row.severity, 9),
            row.topic,
            row.source_file.lower(),
            row.rule_id,
        )
    )
    return deduped


def summarize_rule_topics(rules: Sequence[RuleRecord], top_n: int = 8) -> List[Tuple[str, int]]:
    counter: Counter[str] = Counter(row.topic for row in rules)
    rows = sorted(counter.items(), key=lambda item: (-item[1], item[0]))
    return rows[:top_n]


def summarize_rule_severity(rules: Sequence[RuleRecord]) -> Dict[str, int]:
    counter: Counter[str] = Counter(row.severity for row in rules)
    return {
        severity: counter.get(severity, 0)
        for severity in ("BLOCKER", "ERROR", "WARN", "INFO")
    }


def build_rule_index(rules: Sequence[RuleRecord]) -> Dict[str, RuleRecord]:
    return {row.rule_id: row for row in rules}


def keywords_from_rule(rule: RuleRecord, stop_words: Sequence[str] | None = None) -> Set[str]:
    if stop_words is None:
        stop_words = (
            "the",
            "a",
            "an",
            "and",
            "or",
            "for",
            "to",
            "in",
            "of",
            "on",
            "with",
            "is",
            "are",
            "be",
            "must",
            "should",
            "never",
            "do",
            "not",
        )
    stop = {word.lower() for word in stop_words}
    tokens = _tokenize(rule.statement)
    return {token for token in tokens if token not in stop and len(token) >= 3}


def lexical_overlap(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    if union == 0:
        return 0.0
    return inter / union

