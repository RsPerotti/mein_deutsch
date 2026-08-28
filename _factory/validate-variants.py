#!/usr/bin/env python3
"""
validate-variants.py — independent check for the Vorsilben reconciliation.

Holds its OWN derivation of Partizip II and of the conjugated forms, so a bug
in generate-variants.py cannot pass silently. Same discipline as
validate-declension.py and validate-prefixes.py.

Must report 0 errors before merge.
Run:  python3 _factory/validate-variants.py
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERBS = ROOT / "data" / "verbs.json"
VEXER = ROOT / "data" / "exercises" / "exercises-verbs.json"
SEEDS = sorted((ROOT / "_factory" / "vorsilben").glob("variant-seeds-*.json"))

PRONOUNS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
EXPECTED_TYPES = Counter({
    "translate_word": 1, "fill_blank": 2, "conjugation_choice": 1,
    "partizip_ii": 1, "auxiliary_choice": 1, "conjugation_table": 2,
})
# Independent copy of the auxiliary paradigms.
AUX = {
    "hat": ["habe", "hast", "hat", "haben", "habt", "haben"],
    "ist": ["bin", "bist", "ist", "sind", "seid", "sind"],
}

errors, warnings = [], []
def err(c, m): errors.append(f"[{c}] {m}")


def participle(prefix, root_part, sep):
    """Independent derivation, written from the grammar rule, not imported."""
    if sep:
        return prefix + root_part
    if root_part.startswith("ge"):
        return prefix + root_part[2:]
    return prefix + root_part


def main():
    verbs = json.loads(VERBS.read_text(encoding="utf-8"))
    exercises = json.loads(VEXER.read_text(encoding="utf-8"))
    seeds = {}
    for f in SEEDS:
        for s in json.loads(f.read_text(encoding="utf-8")):
            if s["w"] in seeds:
                err("seed-dupe", f"{s['w']} seeded twice")
            seeds[s["w"]] = s

    by_root = {v["root"]: v for v in verbs}
    tables = {}
    for e in exercises:
        if e["type"] == "conjugation_table":
            tables.setdefault(e.get("word_id", ""), {})[e["tense"]] = e["forms"]

    by_word = {}
    for v in verbs:
        for pv in v.get("prefix_variants", []):
            if pv["word"] in by_word:
                err("variant-dupe", f"{pv['word']} appears under two roots")
            by_word[pv["word"]] = (v, pv)

    ex_by_word = {}
    for e in exercises:
        ex_by_word.setdefault(e.get("word_id"), []).append(e)

    # --- global structural ---------------------------------------------------
    ids = Counter(e.get("exercise_id") for e in exercises)
    for i, c in ids.items():
        if c > 1:
            err("unique-id", f"exercise_id {i} appears {c} times")

    vids = Counter(pv["id"] for v in verbs for pv in v.get("prefix_variants", []))
    for i, c in vids.items():
        if c > 1:
            err("unique-variant-id", f"variant id {i} appears {c} times")

    checked = 0
    for word, seed in seeds.items():
        if word not in by_word:
            err("missing", f"{word} was seeded but is not in verbs.json")
            continue
        root, pv = by_word[word]
        checked += 1
        vid = pv["id"]
        prefix = pv["prefix"]
        sep = pv["separable"]

        # 1. the variant must actually be prefix + root
        if prefix + root["root"] != word:
            err("composition", f"{word} != {prefix} + {root['root']}")
        if sep != seed["sep"]:
            err("separable", f"{word} separable={sep}, seed says {seed['sep']}")
        if vid != "verb_" + word:
            err("id-format", f"{word} has id {vid}")

        # 2. grammar override present only when it diverges
        root_case = (root.get("grammar") or {}).get("case_requirements")
        override = (pv.get("grammar") or {}).get("case_requirements")
        if seed.get("case") and seed["case"] != root_case:
            if override != seed["case"]:
                err("case-override", f"{word} should override case to {seed['case']}, got {override}")
        elif override is not None:
            err("case-override", f"{word} has a redundant override identical to its root")

        # 3. exercises: count and type distribution
        exs = ex_by_word.get(vid, [])
        got = Counter(e["type"] for e in exs)
        if got != EXPECTED_TYPES:
            err("exercise-mix", f"{word} has {dict(got)}, expected {dict(EXPECTED_TYPES)}")

        want_part = participle(prefix, root["conjugation"]["past_participle"], sep)
        prat_root = tables.get("verb_" + root["root"], {}).get("prateritum")
        pres_root = root["conjugation"]["present"]

        for e in exs:
            t = e["type"]
            if t == "partizip_ii":
                if e["correct_answer"] != want_part:
                    err("partizip", f"{word}: got '{e['correct_answer']}', derived '{want_part}'")
                # NOTE: do not try to detect a leftover 'ge-' augment by looking
                # at the characters after the prefix. Roots whose STEM begins
                # with "ge" (geben, gehen, gewinnen) make that undecidable —
                # 'umgeben' is the correct inseparable participle of umgeben,
                # and a naive check flags it as an error. The derivation check
                # above is the real guarantee; this is only a human-eyeball aid.
                if not sep and e["correct_answer"][len(prefix):].startswith("ge") \
                        and not root["conjugation"]["past_participle"][2:].startswith("ge"):
                    warnings.append(
                        f"[eyeball] {word}: inseparable participle "
                        f"'{e['correct_answer']}' still reads with 'ge-' after the "
                        f"prefix — confirm this is stem, not augment")
            elif t == "auxiliary_choice":
                if e["correct_answer"] != seed["aux"]:
                    err("aux", f"{word}: exercise says {e['correct_answer']}, seed says {seed['aux']}")
                if e["correct_answer"] not in ("hat", "ist"):
                    err("aux-value", f"{word}: bad auxiliary {e['correct_answer']}")
            elif t == "conjugation_table":
                forms = e["forms"]
                if list(forms) != PRONOUNS:
                    err("table-pronouns", f"{word} {e['tense']} has {list(forms)}")
                if e["tense"] == "perfekt":
                    for i, p in enumerate(PRONOUNS):
                        want = f"{AUX[seed['aux']][i]} {want_part}"
                        if forms[p] != want:
                            err("table-perfekt", f"{word} {p}: '{forms[p]}' != '{want}'")
                elif e["tense"] == "prateritum":
                    if prat_root is None:
                        err("table-source", f"{word}: root has no Präteritum table")
                    else:
                        for p in PRONOUNS:
                            want = f"{prat_root[p]} {prefix}" if sep else prefix + prat_root[p]
                            if forms[p] != want:
                                err("table-prat", f"{word} {p}: '{forms[p]}' != '{want}'")
            elif t == "conjugation_choice":
                want = (f"{pres_root['er_sie_es']} ... {prefix}" if sep
                        else prefix + pres_root["er_sie_es"])
                if e["correct_answer"] != want:
                    err("conj-choice", f"{word}: '{e['correct_answer']}' != '{want}'")
                if sep and not e["question"]["de"].rstrip(".").endswith(prefix):
                    err("conj-sentence", f"{word}: separable prompt must end with the prefix")
                if not sep and e["question"]["de"].rstrip(".").endswith(" " + prefix):
                    err("conj-sentence", f"{word}: inseparable prompt must not strand the prefix")

            # shared MC hygiene
            if "wrong_answers" in e:
                if e["correct_answer"] in e["wrong_answers"]:
                    err("mc-answer", f"{e['exercise_id']}: correct answer also listed as wrong")
                if len(set(e["wrong_answers"])) != len(e["wrong_answers"]):
                    err("mc-dupe", f"{e['exercise_id']}: duplicate distractors")
                if not e["wrong_answers"]:
                    err("mc-empty", f"{e['exercise_id']}: no distractors")
            if "question" in e and "de" in e["question"]:
                if "_____" in e["question"]["de"] and e["question"]["de"].count("_____") != 1:
                    err("blank-count", f"{e['exercise_id']}: expected exactly one blank")

    # --- regression: derivation rule must also hold for pre-existing variants
    spot = 0
    for v in verbs:
        rp = v["conjugation"].get("past_participle")
        for pv in v.get("prefix_variants", []):
            if pv["word"] in seeds or not rp:
                continue
            pex = [e for e in ex_by_word.get(pv["id"], []) if e["type"] == "partizip_ii"]
            if not pex:
                continue
            spot += 1
            want = participle(pv["prefix"], rp, pv.get("separable", True))
            if pex[0]["correct_answer"] != want:
                warnings.append(
                    f"[pre-existing] {pv['word']}: stored '{pex[0]['correct_answer']}' "
                    f"vs derived '{want}' — irregular formation, not a new-data error")

    print(f"variants checked        : {checked}")
    print(f"pre-existing spot-checks: {spot}")
    print(f"total verbs             : {len(verbs)} roots, "
          f"{sum(len(v.get('prefix_variants', [])) for v in verbs)} variants")
    print(f"total verb exercises    : {len(exercises)}")
    print()
    if warnings:
        print(f"{len(warnings)} warning(s) on pre-existing data (not blocking):")
        for w in warnings[:12]:
            print("  " + w)
        if len(warnings) > 12:
            print(f"  … and {len(warnings) - 12} more")
        print()
    if errors:
        print(f"❌ {len(errors)} integrity error(s):")
        for e in errors[:60]:
            print("  " + e)
        if len(errors) > 60:
            print(f"  … and {len(errors) - 60} more")
        sys.exit(1)
    print("✅ 0 integrity errors")


if __name__ == "__main__":
    main()
