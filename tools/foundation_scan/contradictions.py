"""Contradiction candidate detection for Foundation Scan."""

from __future__ import annotations

from collections import defaultdict
from itertools import combinations
from typing import DefaultDict, Dict, Iterable, List, Sequence, Set, Tuple

from .config import ContradictionRecord, RuleRecord, stable_sha1_text
from .doc_rules import keywords_from_rule, lexical_overlap


NEGATION_MARKERS: Tuple[str, ...] = (
    "must not",
    "never",
    "forbidden",
    "prohibited",
    "do not",
    "cannot",
)


AFFIRM_MARKERS: Tuple[str, ...] = (
    "must",
    "should",
    "required",
    "allowed",
    "permit",
)


def _contains_markers(text: str, markers: Sequence[str]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


def _pair_confidence(rule_a: RuleRecord, rule_b: RuleRecord) -> float:
    keys_a = keywords_from_rule(rule_a)
    keys_b = keywords_from_rule(rule_b)
    overlap = lexical_overlap(keys_a, keys_b)
    same_topic_bonus = 0.2 if rule_a.topic == rule_b.topic else 0.0
    cross_file_bonus = 0.1 if rule_a.source_file != rule_b.source_file else 0.0
    polarity_bonus = 0.2 if rule_a.polarity != rule_b.polarity else 0.0
    severity_bonus = 0.1 if "BLOCKER" in (rule_a.severity, rule_b.severity) else 0.0
    confidence = overlap + same_topic_bonus + cross_file_bonus + polarity_bonus + severity_bonus
    return min(1.0, round(confidence, 6))


def _is_contradictory(rule_a: RuleRecord, rule_b: RuleRecord) -> bool:
    if rule_a.topic != rule_b.topic:
        return False
    if rule_a.polarity == rule_b.polarity:
        return False
    overlap = lexical_overlap(keywords_from_rule(rule_a), keywords_from_rule(rule_b))
    if overlap < 0.12:
        return False
    neg_a = _contains_markers(rule_a.statement, NEGATION_MARKERS)
    neg_b = _contains_markers(rule_b.statement, NEGATION_MARKERS)
    aff_a = _contains_markers(rule_a.statement, AFFIRM_MARKERS)
    aff_b = _contains_markers(rule_b.statement, AFFIRM_MARKERS)
    if (neg_a and aff_b) or (neg_b and aff_a):
        return True
    return overlap >= 0.35


def _severity_for_contradiction(rule_a: RuleRecord, rule_b: RuleRecord) -> str:
    severe = {"BLOCKER": 0, "ERROR": 1, "WARN": 2, "INFO": 3}
    best = min(severe.get(rule_a.severity, 9), severe.get(rule_b.severity, 9))
    if best <= 0:
        return "BLOCKER"
    if best == 1:
        return "ERROR"
    return "WARN"


def _coach_why(topic: str) -> str:
    if topic == "architecture":
        return (
            "Conflicting architecture rules create boundary drift and unstable module "
            "ownership."
        )
    if topic == "imports":
        return (
            "Import contradictions make dependency direction inconsistent and harder to "
            "enforce automatically."
        )
    if topic == "testing":
        return (
            "Test-policy contradictions reduce confidence in merge gates and regression "
            "control."
        )
    return (
        "Contradictory guidance increases execution ambiguity and reduces deterministic "
        "delivery."
    )


def _coach_fix(topic: str) -> str:
    if topic == "architecture":
        return (
            "Define one canonical boundary rule in CONTRACT.md and reference it from "
            "all related docs."
        )
    if topic == "imports":
        return (
            "Declare allowed import direction as explicit boundary pairs and remove "
            "opposite statements."
        )
    if topic == "testing":
        return (
            "State one minimum required test protocol for the domain and remove "
            "conflicting alternatives."
        )
    return "Keep one canonical rule statement and rewrite conflicting variants."


def _coach_examples(topic: str) -> Tuple[str, str]:
    if topic == "imports":
        return (
            "Bad: \"UI may import runtime internals\" and \"UI must not import runtime internals\".",
            "Good: \"UI imports runtime only through public boundary adapters.\"",
        )
    if topic == "architecture":
        return (
            "Bad: \"Entry points contain logic\" and \"Entry points are orchestration-only\".",
            "Good: \"Entry points orchestrate only; logic in domain modules.\"",
        )
    return (
        "Bad: two rules issue opposite directives on the same topic.",
        "Good: one clear directive with explicit scope and owner.",
    )


def detect_contradictions(
    rules: Sequence[RuleRecord],
    max_pairs: int = 10_000,
) -> List[ContradictionRecord]:
    by_topic: DefaultDict[str, List[RuleRecord]] = defaultdict(list)
    for rule in rules:
        by_topic[rule.topic].append(rule)

    rows: List[ContradictionRecord] = []
    for topic, topic_rules in sorted(by_topic.items(), key=lambda item: item[0]):
        if len(topic_rules) < 2:
            continue
        topic_rules = sorted(
            topic_rules,
            key=lambda row: (row.source_file.lower(), row.rule_id),
        )
        for rule_a, rule_b in combinations(topic_rules, 2):
            if len(rows) >= max_pairs:
                break
            if not _is_contradictory(rule_a, rule_b):
                continue
            confidence = _pair_confidence(rule_a, rule_b)
            if confidence < 0.35:
                continue
            statement_a = rule_a.statement
            statement_b = rule_b.statement
            check_seed = f"{rule_a.rule_id}|{rule_b.rule_id}|{topic}"
            contradiction_id = f"CON-{stable_sha1_text(check_seed)[:12]}"
            severity = _severity_for_contradiction(rule_a, rule_b)
            bad_example, good_example = _coach_examples(topic)
            rows.append(
                ContradictionRecord(
                    contradiction_id=contradiction_id,
                    topic=topic,
                    severity=severity,
                    rule_a_id=rule_a.rule_id,
                    rule_b_id=rule_b.rule_id,
                    file_a=rule_a.source_file,
                    file_b=rule_b.source_file,
                    statement_a=statement_a,
                    statement_b=statement_b,
                    confidence=confidence,
                    check_id=f"CON-{topic[:3].upper()}-{stable_sha1_text(check_seed)[:8].upper()}",
                    what_detected="Opposite-polarity rules on the same topic with lexical overlap.",
                    why_it_matters=_coach_why(topic),
                    how_to_fix=_coach_fix(topic),
                    minimal_bad_example=bad_example,
                    minimal_good_example=good_example,
                    next_best_action="Promote one canonical rule and deprecate the conflicting one.",
                )
            )
        if len(rows) >= max_pairs:
            break

    rows.sort(
        key=lambda row: (
            {"BLOCKER": 0, "ERROR": 1, "WARN": 2, "INFO": 3}.get(row.severity, 9),
            -row.confidence,
            row.topic,
            row.rule_a_id,
            row.rule_b_id,
        )
    )
    return rows

