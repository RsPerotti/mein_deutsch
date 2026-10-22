#!/usr/bin/env python3
"""
verify-adverb-distractors-validator.py — mutation test for validate-adverb-distractors.py.

Each mutation plants one second-right-answer (or giveaway) in a scratch copy and asserts the
validator fails with the right check AND, for L1, names the relation the mutation was built
to exercise — so every relation is proven to work on its own, not just "something fired".
"""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "_factory" / "validate-adverb-distractors.py"
COPY = ["data", "_factory/adverb-scales/wiktionary-cache.tsv", "_factory/adverb-distractors/extra-viable.json"]
EXF = "data/exercises/exercises-adverbs.json"


def setwrong(eid, i, val):
    def f(t):
        p = t / EXF; e = json.loads(p.read_text(encoding="utf-8"))
        x = next(x for x in e if x["exercise_id"] == eid)
        x["wrong_answers"][i] = val
        p.write_text(json.dumps(e, ensure_ascii=False), encoding="utf-8")
    return f


def capital(eid):
    def f(t):
        p = t / EXF; e = json.loads(p.read_text(encoding="utf-8"))
        x = next(x for x in e if x["exercise_id"] == eid)
        x["wrong_answers"][0] = x["wrong_answers"][0][:1].upper() + x["wrong_answers"][0][1:]
        p.write_text(json.dumps(e, ensure_ascii=False), encoding="utf-8")
    return f


def dup(eid):
    def f(t):
        p = t / EXF; e = json.loads(p.read_text(encoding="utf-8"))
        x = next(x for x in e if x["exercise_id"] == eid)
        x["wrong_answers"][1] = x["wrong_answers"][0]
        p.write_text(json.dumps(e, ensure_ascii=False), encoding="utf-8")
    return f


M = [
    ("L1", "(cell)",   "grid cell: irgendwer for jemand",           setwrong("ex_adv_jemand_002", 0, "irgendwer")),
    ("L1", "(tier)",   "1 tier apart: täglich for stündlich",        setwrong("ex_adv_stuendlich_003", 0, "täglich")),
    ("L1", "(wikt)",   "Wiktionary synonym: übrigens for eigentlich", setwrong("ex_adv_eigentlich_003", 0, "übrigens")),
    ("L1", "(cosyn)",  "co-synonym: daher for dadurch",             setwrong("ex_adv_dadurch_003", 0, "daher")),
    ("L1", "(gloss)",  "shared gloss: früher for vorhin",            setwrong("ex_adv_vorhin_003", 0, "früher")),
    ("L1", "(stem)",   "shared stem: ehrlicherweise for ehrlich gesagt", setwrong("ex_adv_ehrlich_gesagt_003", 0, "ehrlicherweise")),
    ("L1", "(manual)", "manual pair: aber for sondern",              setwrong("ex_adv_sondern_003", 0, "aber")),
    ("L2", "",         "English line names the distractor",          setwrong("ex_adv_sozusagen_002", 0, "im Grunde")),
    ("L3", "",         "DE→EN: daher's gloss offered for deswegen",  setwrong("ex_adv_deswegen_2_001", 0, "hence / for that reason")),
    ("L4", "",         "unreviewed non-adverb option",               setwrong("ex_adv_oft_003", 0, "irgendwas")),
    ("L5", "",         "capitalised distractor",                     capital("ex_adv_oft_003")),
    ("L6", "",         "duplicate option",                           dup("ex_adv_oft_001")),
]


def scratch():
    t = Path(tempfile.mkdtemp(prefix="distr-mut-"))
    for c in COPY:
        s, d = ROOT / c, t / c
        d.parent.mkdir(parents=True, exist_ok=True)
        (shutil.copytree if s.is_dir() else shutil.copy2)(s, d)
    return t


def run(t):
    r = subprocess.run([sys.executable, str(V)], env=dict(os.environ, DISTRACTORS_ROOT=str(t)),
                       capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


t = scratch(); code, out = run(t); shutil.rmtree(t)
if code != 0:
    print("baseline fails:\n" + out); sys.exit(1)
print("baseline: PASS")
missed = 0
for code_, rel, name, fn in M:
    t = scratch(); fn(t); c, out = run(t); shutil.rmtree(t)
    ok = c == 1 and any(l.strip().startswith(f"[{code_}]") and rel in l for l in out.splitlines())
    print(f"  {'caught' if ok else 'MISSED'}  [{code_}] {name}")
    missed += not ok
print(f"{len(M) - missed}/{len(M)} mutations caught")
sys.exit(1 if missed else 0)
