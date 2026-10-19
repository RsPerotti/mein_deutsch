#!/usr/bin/env python3
"""
verify-stammverben-validator.py — proves validate-stammverben.py can fail, and
fails for the right reason (see verify-the-verifier).

Each mutation is a plausible slip, applied to TEMP copies (the real files are
never touched). For each one the validator must exit non-zero AND report the
expected check letter. The clean data must pass, or a validator that always fails
would score 100%. Mutation 1 is the regression this session exists to fix:
the pre-Session-41 data (git HEAD before the audit) — Session 13 lost.

Run: python3 _factory/verify-stammverben-validator.py
"""
import copy, json, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VAL = ROOT / "_factory" / "validate-stammverben.py"
VERBS = json.loads((ROOT / "data" / "verbs.json").read_text(encoding="utf-8"))
EXS = json.loads((ROOT / "data" / "exercises" / "exercises-verbs.json").read_text(encoding="utf-8"))


def bundle_of(verbs):
    return "window.APP_DATA = " + json.dumps({"verbs": verbs}, ensure_ascii=False) + ";\n"


def run(verbs, exercises=EXS, bundle=None):
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        (d / "v.json").write_text(json.dumps(verbs, ensure_ascii=False), encoding="utf-8")
        (d / "e.json").write_text(json.dumps(exercises, ensure_ascii=False), encoding="utf-8")
        (d / "b.js").write_text(bundle if bundle is not None else bundle_of(verbs), encoding="utf-8")
        r = subprocess.run([sys.executable, str(VAL), "--verbs", str(d / "v.json"),
                            "--exercises", str(d / "e.json"), "--bundle", str(d / "b.js")],
                           capture_output=True, text=True)
        return r.returncode, r.stdout


def find(verbs, word):
    return next(v for v in verbs if v["root"] == word)


def m_pre_audit():
    old = subprocess.run(["git", "show", "ab95875:data/verbs.json"], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout
    return json.loads(old), "A"

def m_root_readded():               # anbieten back as a root beside bieten
    v = copy.deepcopy(VERBS)
    an = next(p for p in find(v, "bieten")["prefix_variants"] if p["word"] == "anbieten")
    find(v, "bieten")["prefix_variants"].remove(an)
    clone = copy.deepcopy(find(v, "bieten")); clone.update(id=an["id"], root="anbieten", prefix_variants=[])
    v.append(clone)
    return v, "A"

def m_duplicate():                  # gehören filed again as a root
    v = copy.deepcopy(VERBS)
    clone = copy.deepcopy(find(v, "hören")); clone.update(id="verb_gehören", root="gehören", prefix_variants=[])
    v.append(clone)
    return v, "E"

def m_base_dropped():               # a restored base lost again -> its exercises orphan
    v = [x for x in copy.deepcopy(VERBS) if x["root"] != "fassen"]
    return v, "F"

def m_flag_dropped():               # entwickeln loses its standalone flag
    v = copy.deepcopy(VERBS)
    e = find(v, "entwickeln")
    for k in ("standalone_variant", "prefix", "base", "separable"):
        e.pop(k, None)
    return v, "C"

def m_unclassified():               # an intake adds a prefixed verb nobody checked
    v = copy.deepcopy(VERBS)
    clone = copy.deepcopy(find(v, "kaufen")); clone.update(id="verb_aufräumen", root="aufräumen", prefix_variants=[])
    v.append(clone)
    return v, "B"

def m_bad_standalone():             # standalone whose base is a Stammverb
    v = copy.deepcopy(VERBS)
    s = find(v, "ausrufen"); s["base"] = "rufen"
    clone = copy.deepcopy(find(v, "kaufen")); clone.update(id="verb_rufen", root="rufen", prefix_variants=[])
    v.append(clone)
    return v, "D"

def m_bundle_stale():               # data.js edited / not rebuilt
    return VERBS, "G"


def main():
    fails = []
    code, out = run(VERBS)
    print(f"clean data: exit {code}")
    if code != 0:
        fails.append("clean data does not pass:\n" + out)
    cases = [m_pre_audit, m_root_readded, m_duplicate, m_base_dropped, m_flag_dropped,
             m_unclassified, m_bad_standalone, m_bundle_stale]
    for m in cases:
        verbs, letter = m()
        bundle = bundle_of(VERBS[:-1]) if m is m_bundle_stale else None
        code, out = run(verbs, bundle=bundle)
        hit = code != 0 and f"ERROR {letter} " in out
        print(f"{'CAUGHT' if hit else 'MISSED'}  {m.__name__:18s} expects {letter}  exit {code}")
        if not hit:
            fails.append(m.__name__ + "\n" + out)
    print(f"\n{len(cases) - len([f for f in fails if not f.startswith('clean')])}/{len(cases)} mutations caught")
    for f in fails:
        print("FAIL " + f)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
