#!/usr/bin/env python3
"""
generate-prefixes.py — builds data/exercises/exercises-prefixes.json

Source of truth: data/prefixes.json (35 curated prefixes x 10 worked examples).
Nothing is invented here: every exercise is derived from a reviewed example.

Two exercise types:
  select_prefix   root verb + target English meaning -> pick the prefix   (6 per prefix)
  select_feeling  prefixed verb -> pick the core feeling                  (4 per prefix)

Prefixes with "exercisable": false (emp-, hinter-) are skipped by design —
they are closed sets and drilling them would teach a rule that does not generalise.

Deterministic: fixed seed, so regeneration produces an identical file.
Run:  python3 _factory/generate-prefixes.py
Then: python3 _factory/validate-prefixes.py   (must report 0 errors before merge)
"""

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "prefixes.json"
OUT = ROOT / "data" / "exercises" / "exercises-prefixes.json"

SEED = 20260826
N_SELECT_PREFIX = 6
N_SELECT_FEELING = 4
N_OPTIONS = 4

# Prefixes whose feelings are too close to sit side by side as options.
# Mirrored in validate-prefixes.py, which holds its own independent copy.
EXCLUSION_GROUPS = [
    {"ab", "weg", "fort"},        # all "away"
    {"ver", "zer"},               # both can read as destruction
    {"miss", "ver"},              # both can read as "gone wrong"
    {"an", "zu"},                 # both "toward"
    {"durch", "über"},            # both "across"
    {"zurück", "wieder"},         # "back" vs "again"
    {"mit", "zusammen"},          # both "together"
    {"mit", "bei"},               # both "alongside"
    {"weiter", "fort"},           # both "onward"
    {"nieder", "ab"},             # both "down/off"
    {"entgegen", "wider"},        # both "against"
    {"her", "hin"},               # mirror pair — ambiguous without context
]


def excluded_with(pid):
    out = set()
    for g in EXCLUSION_GROUPS:
        if pid in g:
            out |= g
    out.discard(pid)
    return out


def main():
    prefixes = json.loads(SRC.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in prefixes}

    # lookup: (root, prefix_id) -> english, used to reject unsafe distractors
    verb_index = {}
    for p in prefixes:
        for ex in p["examples"]:
            verb_index[(ex["root"], p["id"])] = ex["english"]

    rng = random.Random(SEED)
    exercises = []

    for p in sorted(prefixes, key=lambda x: x["id"]):
        if not p.get("exercisable", True):
            continue

        pid = p["id"]
        banned = excluded_with(pid)
        pool = [q["id"] for q in prefixes if q["id"] != pid and q["id"] not in banned]

        drillable = [e for e in p["examples"] if e["drillable"]]
        n = 0

        # ---- select_prefix ------------------------------------------------
        for ex in drillable[:N_SELECT_PREFIX]:
            # a distractor is unsafe if distractor+root is a known verb
            # whose meaning matches the target meaning
            safe = [
                d for d in pool
                if verb_index.get((ex["root"], d)) != ex["english"]
            ]
            distractors = rng.sample(safe, N_OPTIONS - 1)
            options = [by_id[d]["prefix"] for d in distractors] + [p["prefix"]]
            rng.shuffle(options)
            n += 1
            exercises.append({
                "id": f"prefixes_{pid}_{n:03d}",
                "type": "select_prefix",
                "prefix_id": pid,
                "group": p["group"],
                "root": ex["root"],
                "reflexive": ex["reflexive"],
                "target_en": ex["english"],
                "answer_verb": ex["word"],
                "options": options,
                "correct": p["prefix"],
                "feedback": f"{p['prefix']} — {p['core']}. {ex['why']}",
            })

        # ---- select_feeling -----------------------------------------------
        feeling_pool = [e for e in p["examples"] if e["drillable"]][N_SELECT_PREFIX:]
        if len(feeling_pool) < N_SELECT_FEELING:
            feeling_pool += [e for e in p["examples"] if e not in feeling_pool]
        for ex in feeling_pool[:N_SELECT_FEELING]:
            distractors = rng.sample(pool, N_OPTIONS - 1)
            options = [by_id[d]["core"] for d in distractors] + [p["core"]]
            rng.shuffle(options)
            n += 1
            exercises.append({
                "id": f"prefixes_{pid}_{n:03d}",
                "type": "select_feeling",
                "prefix_id": pid,
                "group": p["group"],
                "verb": ex["word"],
                "verb_en": ex["english"],
                "options": options,
                "correct": p["core"],
                "feedback": f"{p['prefix']} — {p['core']}. {ex['why']}",
            })

    OUT.write_text(json.dumps(exercises, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")

    drilled = sum(1 for p in prefixes if p.get("exercisable", True))
    print(f"prefixes drilled : {drilled} of {len(prefixes)}")
    print(f"exercises written: {len(exercises)} -> {OUT.relative_to(ROOT)}")
    for t in ("select_prefix", "select_feeling"):
        print(f"  {t:16s} {sum(1 for e in exercises if e['type'] == t)}")


if __name__ == "__main__":
    main()
