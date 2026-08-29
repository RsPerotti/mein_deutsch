#!/usr/bin/env python3
"""
validate-prefixes.py — independent integrity check for the Vorsilben module.

Deliberately holds its OWN copy of the exclusion table and its own reading of
the rules, so a bug in generate-prefixes.py cannot pass silently. Same
discipline as validate-declension.py.

Must report 0 errors before any merge.
Run:  python3 _factory/validate-prefixes.py
"""

import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREFIXES = ROOT / "data" / "prefixes.json"
EXERCISES = ROOT / "data" / "exercises" / "exercises-prefixes.json"

N_OPTIONS = 4
EXPECT_SELECT_PREFIX = 6
EXPECT_SELECT_FEELING = 4

# Independent copy — written from the PRD, not imported from the generator.
NEAR_SYNONYMS = [
    ("ab", "weg"), ("ab", "fort"), ("weg", "fort"),
    ("ver", "zer"), ("miss", "ver"),
    ("an", "zu"), ("durch", "über"),
    ("zurück", "wieder"),
    ("mit", "zusammen"), ("mit", "bei"),
    ("weiter", "fort"), ("nieder", "ab"),
    ("entgegen", "wider"), ("her", "hin"),
    # Session 38 — added after visual QA caught "vorgehen = to proceed;
    # to go on" offered against fort- ("onward").
    ("vor", "fort"),
    ("ent", "weg"), ("ent", "ab"), ("ent", "fort"),
    ("ver", "weg"), ("ver", "ab"), ("ver", "fort"),
    ("zurück", "fort"), ("bei", "weiter"), ("durch", "er"),
    ("ge", "aus"), ("los", "weiter"), ("nach", "hinter"),
]

# Independent copy of the stopword list used by the generator.
STOPWORDS = set(
    "to a an the of in on and or with sth sb into out up down off over under "
    "back again for by from at it its as".split()
)


def keywords(text):
    import re
    return {w for w in re.findall(r"[a-z]+", text.lower())
            if w not in STOPWORDS and len(w) > 2}

errors = []
warnings = []


def err(check, msg):
    errors.append(f"[{check}] {msg}")



def check_dual_pairs():
    """Every AMBIGUOUS verb must be taught in Lesson 5, with facts matching the cache.

    Holds its own reading of the cache — it does not import generate-dual-section.py.
    Without this, a future intake could add a dual-reading verb that the lesson
    silently never mentions, which is exactly the gap Session 39 opened this for.
    """
    V = ROOT / "_factory" / "vorsilben"
    report = V / "verify-report.md"
    if not report.exists():
        warnings.append("[dual-pairs] verify-report.md absent — pair coverage not checked")
        return

    ambiguous = sorted({ln.split("`")[1] for ln in report.read_text(encoding="utf-8").splitlines()
                        if ln.startswith("| `") and "**AMBIGUOUS**" in ln})

    lessons = json.loads((ROOT / "data" / "grammar" / "prefix-lessons.json")
                         .read_text(encoding="utf-8"))
    section = None
    for l in lessons:
        for sec in l.get("sections", []):
            if sec.get("type") == "pairs":
                section = sec
    if section is None:
        for v in ambiguous:
            err("dual-pairs", f"{v} is AMBIGUOUS but no pairs section exists")
        return

    taught = {p["verb"]: p for p in section.get("pairs", [])}
    for v in ambiguous:
        if v not in taught:
            err("dual-pairs", f"{v} is AMBIGUOUS but is not in the Lesson 5 pair list")
    for v in taught:
        if v not in ambiguous:
            err("dual-pairs", f"{v} is taught as a pair but is not AMBIGUOUS in verify-report.md")

    # facts must match the cache, independently re-read
    cache = {}
    for line in (V / "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        w, _, rest = line.partition("\t")
        if rest.strip() in ("MISSING", "NOTEMPLATE"):
            continue
        forms = set()
        for chunk in rest.split("||"):
            parts = [c.strip() for c in chunk.strip().split("~")]
            forms.add(parts[0])
        cache[w] = forms
    for v, p in taught.items():
        listed = {r["form"] for r in p["readings"]}
        if v in cache and listed != cache[v]:
            err("dual-pairs", f"{v}: lesson lists {sorted(listed)}, cache has {sorted(cache[v])}")
        drilled = [r for r in p["readings"] if r.get("drilled")]
        if len(drilled) != 1:
            err("dual-pairs", f"{v}: {len(drilled)} readings marked as drilled, expected exactly 1")
        for r in p["readings"]:
            if not r.get("en"):
                err("dual-pairs", f"{v}/{r['form']}: no English gloss")


def main():
    prefixes = json.loads(PREFIXES.read_text(encoding="utf-8"))
    exercises = json.loads(EXERCISES.read_text(encoding="utf-8"))

    by_id = {p["id"]: p for p in prefixes}
    prefix_to_id = {p["prefix"]: p["id"] for p in prefixes}
    core_to_id = {}
    for p in prefixes:
        core_to_id.setdefault(p["core"], []).append(p["id"])

    # (root, prefix_id) -> {english, ...}
    # A set, not a scalar: the same root can appear twice under one prefix
    # (e.g. widersprechen and der Widerspruch both have root "sprechen").
    verb_index = {}
    for p in prefixes:
        for ex in p["examples"]:
            verb_index.setdefault((ex["root"], p["id"]), set()).add(ex["english"])

    banned = set()
    for a, b in NEAR_SYNONYMS:
        banned.add(frozenset((a, b)))

    # --- 1. structural ----------------------------------------------------
    seen_ids = Counter(e["id"] for e in exercises)
    for eid, c in seen_ids.items():
        if c > 1:
            err("unique-id", f"{eid} appears {c} times")

    for e in exercises:
        opts = e["options"]
        if len(opts) != N_OPTIONS:
            err("options-count", f"{e['id']} has {len(opts)} options")
        if len(set(opts)) != len(opts):
            err("options-dupe", f"{e['id']} has duplicate options")
        if e["correct"] not in opts:
            err("correct-present", f"{e['id']} correct answer not among options")
        if opts.count(e["correct"]) != 1:
            err("single-answer", f"{e['id']} correct answer appears more than once")

    # --- 2. core feelings must be globally unique -------------------------
    for core, ids in core_to_id.items():
        if len(ids) > 1:
            err("core-unique",
                f"core feeling shared by {ids} — select_feeling cannot be unambiguous")

    # --- 3. exclusion pairs ------------------------------------------------
    for e in exercises:
        pid = e["prefix_id"]
        if e["type"] == "select_prefix":
            opt_ids = [prefix_to_id.get(o) for o in e["options"]]
        else:
            opt_ids = [core_to_id.get(o, [None])[0] for o in e["options"]]
        if any(o is None for o in opt_ids):
            err("option-resolve", f"{e['id']} has an option that maps to no prefix")
            continue
        for o in opt_ids:
            if o != pid and frozenset((pid, o)) in banned:
                err("near-synonym",
                    f"{e['id']} pairs {pid} with near-synonym {o}")

    # --- 4. select_prefix semantic safety ---------------------------------
    for e in exercises:
        if e["type"] != "select_prefix":
            continue
        pid = e["prefix_id"]
        if e["target_en"] not in verb_index.get((e["root"], pid), set()):
            err("answer-real",
                f"{e['id']} correct prefix + root does not reconstruct the example")
        expected = by_id[pid]["prefix"].rstrip("-") + e["root"]
        if expected.lower() != e["answer_verb"].replace("sich ", "").lower():
            err("answer-verb",
                f"{e['id']} {expected} != {e['answer_verb']} — prompt would not "
                "form the answer verb")
        for o in e["options"]:
            oid = prefix_to_id[o]
            if oid == pid:
                continue
            if e["target_en"] in verb_index.get((e["root"], oid), set()):
                err("distractor-valid",
                    f"{e['id']} distractor {oid}+{e['root']} also means "
                    f"'{e['target_en']}'")

    # --- 4b. semantic overlap ------------------------------------------------
    # A distractor whose own core feeling explains the target meaning makes the
    # item ambiguous even when the prefixes are not near-synonyms. Session 38.
    for e in exercises:
        target = e["target_en"] if e["type"] == "select_prefix" else e["verb_en"]
        tkw = keywords(target)
        for o in e["options"]:
            oid = prefix_to_id.get(o) if e["type"] == "select_prefix" \
                else core_to_id.get(o, [None])[0]
            if oid is None or oid == e["prefix_id"]:
                continue
            overlap = tkw & keywords(by_id[oid]["core"])
            if overlap:
                err("semantic-overlap",
                    f"{e['id']} '{target}' shares {sorted(overlap)} with "
                    f"distractor {oid}'s core feeling")

    # --- 5. coverage -------------------------------------------------------
    per_prefix = Counter((e["prefix_id"], e["type"]) for e in exercises)
    for p in prefixes:
        pid = p["id"]
        sp = per_prefix[(pid, "select_prefix")]
        sf = per_prefix[(pid, "select_feeling")]
        if p.get("exercisable", True):
            if sp != EXPECT_SELECT_PREFIX:
                err("coverage", f"{pid} has {sp} select_prefix (expected {EXPECT_SELECT_PREFIX})")
            if sf != EXPECT_SELECT_FEELING:
                err("coverage", f"{pid} has {sf} select_feeling (expected {EXPECT_SELECT_FEELING})")
        else:
            if sp or sf:
                err("non-exercisable",
                    f"{pid} is marked exercisable:false but has {sp + sf} exercises")

    # --- 6. source data sanity --------------------------------------------
    for p in prefixes:
        if p["group"] not in ("trennbar", "untrennbar", "beide"):
            err("group", f"{p['id']} has unknown group {p['group']}")
        if len(p["examples"]) != 10:
            err("examples", f"{p['id']} has {len(p['examples'])} examples (expected 10)")
        for f in ("core", "hint", "feeling", "mnemonic"):
            if not p.get(f):
                err("field", f"{p['id']} missing {f}")
        if p.get("exercisable", True) and \
           sum(1 for e in p["examples"] if e["drillable"]) < EXPECT_SELECT_PREFIX:
            err("drillable", f"{p['id']} has too few drillable examples")

    check_dual_pairs()

    # --- report ------------------------------------------------------------
    print(f"prefixes      : {len(prefixes)}")
    print(f"exercises     : {len(exercises)}")
    print(f"select_prefix : {sum(1 for e in exercises if e['type'] == 'select_prefix')}")
    print(f"select_feeling: {sum(1 for e in exercises if e['type'] == 'select_feeling')}")
    print(f"dual pairs    : checked against verify-report.md + wiktionary-cache.tsv")
    print()
    if warnings:
        print(f"{len(warnings)} warning(s):")
        for w in warnings:
            print("  " + w)
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
