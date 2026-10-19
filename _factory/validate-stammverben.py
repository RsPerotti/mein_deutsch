#!/usr/bin/env python3
"""
validate-stammverben.py — Session 41. Independent guard for the Stammverben rule.

Written from PRD_Stammverben_Audit.md, NOT from stammverben-audit.py, and must
never import it: a bug in the audit must not be able to pass here silently.

Fails (exit 1) when:
  A. a Stammverb is <prefix> + <another verb the app teaches>   (the Session 13
     regression: anbieten filed as a root while bieten exists)
  B. a Stammverb is prefix-shaped but has no Wiktionary Herkunft row (unclassified —
     e.g. a new intake added it; run the Wiktionary fetch, then stammverben-audit)
  C. a Stammverb's Herkunft says it is formed from a living verb (prefixed by rule)
  D. a standalone variation is malformed: root != prefix + base, or its base is a
     Stammverb (then it must be a variant of that base)
  E. a word id appears twice (root / variant / standalone)
  F. an exercise's word_id belongs to no verb (orphaned — never served)
  G. js/data.js's verbs differ from data/verbs.json (the root cause of the S13
     loss: the bundle was edited, the source was not)

Not covered: whether a meaning, gloss or exercise is correct; case requirements.

Run: python3 _factory/validate-stammverben.py [--verbs P] [--exercises P] [--bundle P]
"""
import argparse, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SV = ROOT / "_factory" / "stammverben"

# Own copy of German verb prefixes/particles (separable + inseparable).
PREFIXES = ["ab", "an", "auf", "aus", "bei", "be", "durch", "ein", "emp", "ent", "er",
            "fort", "ge", "her", "hin", "hinter", "los", "miss", "mit", "nach", "über",
            "um", "unter", "ver", "vor", "weg", "weiter", "wider", "wieder", "zer", "zu",
            "zurück", "zusammen", "hervor", "heraus", "herein", "hinaus", "aufrecht",
            "fest", "frei", "statt", "teil", "dar", "empor"]


def tsv(path):
    out = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            cols = line.split("\t")
            out[cols[0]] = cols[1:]
    return out


def load_bundle(path):
    s = path.read_text(encoding="utf-8").strip()
    s = re.sub(r"^\s*window\.APP_DATA\s*=\s*", "", s).rstrip(";")
    return json.loads(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbs", default=ROOT / "data" / "verbs.json", type=Path)
    ap.add_argument("--exercises", default=ROOT / "data" / "exercises" / "exercises-verbs.json", type=Path)
    ap.add_argument("--bundle", default=ROOT / "js" / "data.js", type=Path)
    a = ap.parse_args()

    verbs = json.loads(a.verbs.read_text(encoding="utf-8"))
    exercises = json.loads(a.exercises.read_text(encoding="utf-8"))
    herk = tsv(SV / "wiktionary-herkunft.tsv")
    bases = tsv(SV / "wiktionary-bases.tsv")
    errors = []

    stamm = [v for v in verbs if not v.get("standalone_variant")]
    stand = [v for v in verbs if v.get("standalone_variant")]
    stamm_words = {v["root"] for v in stamm}
    all_words = set(stamm_words)
    ids = []
    for v in verbs:
        ids.append(v["id"]); all_words.add(v["root"])
        for pv in v.get("prefix_variants") or []:
            ids.append(pv["id"]); all_words.add(pv["word"])

    def living_verb(b):
        row = bases.get(b)
        return bool(row) and int(row[0]) - int(row[1]) > 0

    for v in stamm:
        w = v["root"]
        splits = [(p, w[len(p):]) for p in PREFIXES if w.startswith(p) and len(w) - len(p) >= 4]
        for p, b in splits:                                                   # A
            if b in all_words:
                errors.append(f"A {w}: Stammverb is {p}- + {b}, which the app teaches")
        if splits and w not in herk:                                          # B
            errors.append(f"B {w}: prefix-shaped Stammverb with no Wiktionary Herkunft row")
        if w in herk:                                                         # C
            text = herk[w][1] if len(herk[w]) > 1 else ""
            for b in re.findall(r"(?:dem|zum|vom) Verb (\w+)", text):
                if w.endswith(b) and w != b and living_verb(b):
                    errors.append(f"C {w}: Wiktionary derives it from the verb {b}")

    for v in stand:                                                           # D
        p, b = v.get("prefix"), v.get("base")
        if not p or not b or v["root"] != p + b:
            errors.append(f"D {v['root']}: standalone needs root == prefix + base ({p!r}+{b!r})")
        elif b in stamm_words:
            errors.append(f"D {v['root']}: base {b} is a Stammverb — should be its variant")

    seen = set()                                                              # E
    for i in ids:
        if i in seen:
            errors.append(f"E duplicate word id {i}")
        seen.add(i)

    orphans = sorted({e["word_id"] for e in exercises if e["word_id"] not in seen})
    for o in orphans:                                                         # F
        n = sum(1 for e in exercises if e["word_id"] == o)
        errors.append(f"F {n} exercises for {o}, which no verb owns")

    try:                                                                      # G
        if load_bundle(a.bundle).get("verbs") != verbs:
            errors.append("G js/data.js verbs differ from data/verbs.json — run bundle-data.py")
    except Exception as e:
        errors.append(f"G cannot read bundle: {e}")

    print(f"Stammverben {len(stamm)} | standalone variations {len(stand)} | "
          f"word ids {len(ids)} | exercises {len(exercises)}")
    for e in errors:
        print("  ERROR " + e)
    print(f"{'✅ 0' if not errors else '❌ ' + str(len(errors))} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
