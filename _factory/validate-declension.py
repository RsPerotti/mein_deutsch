#!/usr/bin/env python3
"""Validate exercises-declension.json — 7 integrity checks (see declension-spec.md).

Deliberately independent of the generator: the ending table below is a second,
hand-written copy. If generator and validator disagree, something is wrong.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Independent copy of the ending table (do NOT import from the generator).
TABLE = {
    ("schwach", "nominativ", "m"): "e",  ("schwach", "nominativ", "f"): "e",
    ("schwach", "nominativ", "n"): "e",  ("schwach", "nominativ", "pl"): "en",
    ("schwach", "akkusativ", "m"): "en", ("schwach", "akkusativ", "f"): "e",
    ("schwach", "akkusativ", "n"): "e",  ("schwach", "akkusativ", "pl"): "en",
    ("schwach", "dativ", "m"): "en", ("schwach", "dativ", "f"): "en",
    ("schwach", "dativ", "n"): "en", ("schwach", "dativ", "pl"): "en",
    ("schwach", "genitiv", "m"): "en", ("schwach", "genitiv", "f"): "en",
    ("schwach", "genitiv", "n"): "en", ("schwach", "genitiv", "pl"): "en",
    ("gemischt", "nominativ", "m"): "er", ("gemischt", "nominativ", "f"): "e",
    ("gemischt", "nominativ", "n"): "es", ("gemischt", "nominativ", "pl"): "en",
    ("gemischt", "akkusativ", "m"): "en", ("gemischt", "akkusativ", "f"): "e",
    ("gemischt", "akkusativ", "n"): "es", ("gemischt", "akkusativ", "pl"): "en",
    ("gemischt", "dativ", "m"): "en", ("gemischt", "dativ", "f"): "en",
    ("gemischt", "dativ", "n"): "en", ("gemischt", "dativ", "pl"): "en",
    ("gemischt", "genitiv", "m"): "en", ("gemischt", "genitiv", "f"): "en",
    ("gemischt", "genitiv", "n"): "en", ("gemischt", "genitiv", "pl"): "en",
    ("stark", "nominativ", "m"): "er", ("stark", "nominativ", "f"): "e",
    ("stark", "nominativ", "n"): "es", ("stark", "nominativ", "pl"): "e",
    ("stark", "akkusativ", "m"): "en", ("stark", "akkusativ", "f"): "e",
    ("stark", "akkusativ", "n"): "es", ("stark", "akkusativ", "pl"): "e",
    ("stark", "dativ", "m"): "em", ("stark", "dativ", "f"): "er",
    ("stark", "dativ", "n"): "em", ("stark", "dativ", "pl"): "en",
    ("stark", "genitiv", "m"): "en", ("stark", "genitiv", "f"): "er",
    ("stark", "genitiv", "n"): "en", ("stark", "genitiv", "pl"): "er",
}

DER_WORDS = {"der", "die", "das", "den", "dem", "des", "dieser", "diese", "dieses",
             "diesen", "diesem", "jeder", "jede", "jedes", "jeden", "jedem",
             "welcher", "welche", "welches", "alle", "allen", "aller"}
EIN_WORDS = {"ein", "eine", "einen", "einem", "einer", "eines"} | {
    p + s for p in ("kein", "mein", "dein", "sein", "ihr", "unser", "euer")
    for s in ("", "e", "en", "em", "er", "es")}
BLOCKLIST = {"dunkel", "teuer", "hoch", "sauer", "leise", "müde", "böse",
             "rosa", "lila", "prima", "super"}
ART_TO_GENDER = {"der": "m", "die": "f", "das": "n"}
VALID = {"pattern": {"schwach", "gemischt", "stark"},
         "case": {"nominativ", "akkusativ", "dativ", "genitiv"},
         "gender": {"m", "f", "n", "pl"},
         "cefr": {"A1", "A2", "B1", "B2"},
         "correct": {"e", "en", "er", "es", "em"}}
REQUIRED = ["id", "type", "cefr", "adjective_id", "noun_id", "pattern", "case",
            "gender", "sentence_de", "sentence_en", "correct", "feedback"]


def main():
    exercises = json.load(open(os.path.join(ROOT, "data/exercises/exercises-declension.json")))
    adjs = json.load(open(os.path.join(ROOT, "data/adjectives.json")))
    nouns = json.load(open(os.path.join(ROOT, "data/nouns.json")))
    if isinstance(adjs, dict): adjs = adjs.get("adjectives", adjs.get("items"))
    if isinstance(nouns, dict): nouns = nouns.get("nouns", nouns.get("items"))
    adj_by_id = {a["id"]: a for a in adjs}
    noun_by_id = {n["id"]: n for n in nouns}

    errors, ids = [], set()
    for e in exercises:
        eid = e.get("id", "<missing id>")
        def err(msg): errors.append(f"{eid}: {msg}")

        # 7 — structure
        for k in REQUIRED:
            if k not in e: err(f"missing field '{k}'")
        if eid in ids: err("duplicate id")
        ids.add(eid)
        if e.get("type") != "type_ending": err(f"bad type {e.get('type')}")
        for k in ("pattern", "case", "gender", "cefr", "correct"):
            if e.get(k) not in VALID[k]: err(f"bad {k}: {e.get(k)}")
        if any(e.get(k) not in VALID[k] for k in ("pattern", "case", "gender")):
            continue

        # 1 — exactly one blank
        if e["sentence_de"].count("___") != 1: err("blank count != 1")

        # 2 — ending must match the lookup table
        expect = TABLE[(e["pattern"], e["case"], e["gender"])]
        if e["correct"] != expect:
            err(f"correct '{e['correct']}' != table '{expect}' for {e['pattern']}/{e['case']}/{e['gender']}")

        # 3 — adjective exists and is allowed
        a = adj_by_id.get(e["adjective_id"])
        if not a:
            err(f"unknown adjective_id {e['adjective_id']}")
        else:
            if a["word"] in BLOCKLIST: err(f"blocklisted adjective '{a['word']}'")
            if a["cefr"] != e["cefr"]: err(f"cefr {e['cefr']} != adjective's {a['cefr']}")
            stem = a["word"].lower()
            if stem + "___" not in e["sentence_de"].lower():
                err(f"adjective stem '{stem}' not found before blank")

        # 4 — noun exists; gender consistent (singular only)
        n = noun_by_id.get(e["noun_id"])
        if not n:
            err(f"unknown noun_id {e['noun_id']}")
        elif e["gender"] != "pl":
            g = ART_TO_GENDER.get(n.get("article"))
            if g != e["gender"]: err(f"gender '{e['gender']}' contradicts noun article '{n.get('article')}'")

        # 5 & 6 — the word before the blank must match the pattern
        tokens = re.findall(r"[\w___äöüÄÖÜß]+", e["sentence_de"])
        blank_idx = next((i for i, t in enumerate(tokens) if "___" in t), None)
        if blank_idx is None:
            err("no blank token found")
        else:
            prev = tokens[blank_idx - 1].lower() if blank_idx > 0 else None
            if e["pattern"] == "schwach" and prev not in DER_WORDS:
                err(f"weak pattern but preceding word is '{prev}'")
            if e["pattern"] == "gemischt":
                if prev not in EIN_WORDS:
                    err(f"mixed pattern but preceding word is '{prev}'")
                if e["gender"] == "pl" and prev in {"ein", "eine", "einen", "einem", "einer", "eines"}:
                    err("mixed plural cannot use 'ein'")  # check 6
            if e["pattern"] == "stark" and (prev in DER_WORDS or prev in EIN_WORDS):
                err(f"strong pattern but an article '{prev}' precedes the adjective")

    # volume
    from collections import Counter
    c = Counter((e.get("pattern"), e.get("case")) for e in exercises)
    print(f"{len(exercises)} exercises | per pattern x case: {dict(c)}")
    if len(exercises) != 360: errors.append(f"TOTAL: expected 360, got {len(exercises)}")
    for k, v in c.items():
        if v != 30: errors.append(f"VOLUME {k}: expected 30, got {v}")

    if errors:
        print(f"\n{len(errors)} ERROR(S):")
        for x in errors: print(" -", x)
        sys.exit(1)
    print("0 integrity errors — PASS")


if __name__ == "__main__":
    main()
