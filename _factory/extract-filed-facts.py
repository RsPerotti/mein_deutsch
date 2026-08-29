#!/usr/bin/env python3
"""Collect what the app currently claims about each prefix variant.

Reads the Vorsilben variant seeds, data/verbs.json and the generated verb
exercises, and writes _factory/vorsilben/filed-facts.json — the input to
verify-variants.py. Pure read; changes nothing.
"""
import json, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(ROOT, "_factory", "vorsilben")

seeds = {}
for p in sorted(glob.glob(os.path.join(V, "variant-seeds-*.json"))):
    for s in json.load(open(p, encoding="utf-8")):
        seeds[s["w"]] = s

verbs = json.load(open(os.path.join(ROOT, "data/verbs.json"), encoding="utf-8"))
variants = {}
for r in verbs:
    for v in r.get("prefix_variants", []):
        variants[v["word"]] = (r, v)

ex = json.load(open(os.path.join(ROOT, "data/exercises/exercises-verbs.json"), encoding="utf-8"))
pii, aux_ex = {}, {}
for e in ex:
    t = e.get("type")
    if t not in ("partizip_ii", "auxiliary_choice"):
        continue
    w = (e.get("question") or {}).get("de")
    if not w:
        continue
    (pii if t == "partizip_ii" else aux_ex)[w] = e.get("correct_answer")

out = []
for w, s in sorted(seeds.items()):
    root, v = variants.get(w, (None, None))
    out.append({
        "word": w,
        "root": (root or {}).get("root"),
        "root_partizip_ii": ((root or {}).get("conjugation") or {}).get("past_participle"),
        "prefix": (v or {}).get("prefix"),
        "separable": (v or {}).get("separable", not s.get("sep") is False),
        "aux": s.get("aux"),
        "aux_in_exercises": aux_ex.get(w),
        "partizip_ii": pii.get(w),
        "case": (v or {}).get("grammar", {}).get("case_requirements"),
        "judgement": s.get("judgement"),
        "in_verbs_json": root is not None,
    })

dest = os.path.join(V, "filed-facts.json")
json.dump(out, open(dest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} variants -> {dest}")
print("  with judgement calls:", sum(1 for o in out if o["judgement"]))
print("  missing from verbs.json:", [o['word'] for o in out if not o['in_verbs_json']])
print("  missing Partizip II:", [o['word'] for o in out if not o['partizip_ii']])
