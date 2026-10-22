#!/usr/bin/env python3
"""
verify-adverb-scales-validator.py — mutation test for validate-adverb-scales.py.

A validator that has never failed proves nothing (see Session 40: two checks passed
on deliberately broken code). Each mutation below plants one real bug in a scratch
copy of the data and asserts that the validator fails WITH THE RIGHT CHECK LETTER —
failing for some unrelated reason doesn't count.

Run:  python3 _factory/verify-adverb-scales-validator.py
"""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VALIDATOR = ROOT / "_factory" / "validate-adverb-scales.py"
COPY = ["data", "_factory/adverb-scales", "js/data.js", "js/exercises.js"]


def jl(p): return json.loads(p.read_text(encoding="utf-8"))
def jw(p, o): p.write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")


def rebundle(t):
    """Keep js/data.js in sync with the mutated JSON, so only the intended check can fire."""
    dj = t / "js" / "data.js"
    s = dj.read_text(encoding="utf-8")
    b = json.loads(s[s.index("{"): s.rindex("}") + 1])
    b["adverbs"] = jl(t / "data/adverbs.json")
    b["exercises_adverbs"] = jl(t / "data/exercises/exercises-adverbs.json")
    b["adverb_scales"] = jl(t / "data/adverb-scales.json")
    dj.write_text("window.APP_DATA = " + json.dumps(b, ensure_ascii=False) + ";\n", encoding="utf-8")


def ex_file(t): return t / "data/exercises/exercises-adverbs.json"
def sc_file(t): return t / "data/adverb-scales.json"


def m_chip_missing(t):
    d = jl(sc_file(t)); d["axes"][0]["tiers"][0]["words"][0]["id"] = "adv_does_not_exist"; jw(sc_file(t), d)

def m_dup_word(t):
    d = jl(sc_file(t)); ax = d["axes"][0]
    ax["tiers"][3]["words"].append(dict(ax["tiers"][0]["words"][0])); jw(sc_file(t), d)

def m_three_words(t):
    d = jl(sc_file(t)); q = next(a for a in d["axes"] if a["id"] == "quelle")
    q["tiers"] = q["tiers"][:2]; q["tiers"][1]["words"] = q["tiers"][1]["words"][:2]; jw(sc_file(t), d)

def m_anchor_wrong_tier(t):
    d = jl(sc_file(t)); g = d["axes"][0]
    g["tiers"][0]["anchor"]["word"] = "vielleicht"
    g["tiers"][0]["anchor"]["de"] = g["anchor_frame"].replace("___", "vielleicht"); jw(sc_file(t), d)

def m_example_offtier(t):
    d = jl(sc_file(t)); d["axes"][0]["tiers"][0]["example"] = {"de": "Ich kenne ihn kaum.", "en": "x"}; jw(sc_file(t), d)

def m_capital_tell(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"] == "ex_adv_garantiert_002")
    x["wrong_answers"][0] = x["wrong_answers"][0].capitalize(); jw(ex_file(t), e)

def m_example_mismatch(t):
    a = jl(t / "data/adverbs.json"); x = next(x for x in a if x["id"] == "adv_stets")
    x["example_sentences"][0]["de"] = "Er war stets nett."; jw(t / "data/adverbs.json", a)

def m_synonym_distractor(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"] == "ex_adv_womoeglich_003")
    x["wrong_answers"][0] = "eventuell"; jw(ex_file(t), e)          # same tier as womöglich

def m_wiktionary_synonym(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"] == "ex_adv_stets_002")
    x["wrong_answers"][0] = "dauernd"; jw(ex_file(t), e)           # Wiktionary: Synonym of stets, other tier

def m_drill_wrong_answer(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"] == "ex_adv_scale_gewissheit_001")
    w = x["wrong_answers"][-1]; x["wrong_answers"][-1] = x["correct_answer"]; x["correct_answer"] = w
    x["word_id"] = next(a["id"] for a in jl(t / "data/adverbs.json") if a["word"] == w); jw(ex_file(t), e)

def m_drill_gap(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"] == "ex_adv_scale_gewissheit_001")
    x["wrong_answers"][0] = "bestimmt"; jw(ex_file(t), e)           # tier 1 next to definitiv (gap 2 axis)

def m_grid_column_leak(t):
    e = jl(ex_file(t))
    x = next(x for x in e if x["exercise_id"].startswith("ex_adv_scale_alle_keine_")
             and x["correct_answer"] == "irgendwann")
    x["wrong_answers"][0] = "immer"; jw(ex_file(t), e)

def m_dup_id(t):
    e = jl(ex_file(t)); e.append(dict(e[0])); jw(ex_file(t), e)

def m_status_lie(t):
    d = jl(sc_file(t))
    for ax in d["axes"]:
        for tier in ax.get("tiers", []):
            for c in tier["words"]:
                if c["w"] == "mega": c["status"] = "ok"
    jw(sc_file(t), d)

def m_stale_bundle(t):
    a = jl(t / "data/adverbs.json"); a[-1]["english"] = "changed"; jw(t / "data/adverbs.json", a)
    return "no-rebundle"

def m_no_dispatch(t):
    p = t / "js/exercises.js"; s = p.read_text(encoding="utf-8")
    p.write_text(s.replace("card.innerHTML = _renderScaleChoice(ex);", "card.innerHTML = _renderTranslateWord(ex);"), encoding="utf-8")

def m_bypass_funnel(t):
    p = t / "js/exercises.js"; s = p.read_text(encoding="utf-8")
    i = s.index("function _renderScaleChoice")
    j = s.index('onclick="selectAnswer(this)"', i)
    p.write_text(s[:j] + 'onclick="_scaleAnswer(this)"' + s[j + len('onclick="selectAnswer(this)"'):], encoding="utf-8")


MUTATIONS = [
    ("A", "chip points at a missing id", m_chip_missing),
    ("B", "word on two tiers of one axis", m_dup_word),
    ("C", "axis with only 3 words", m_three_words),
    ("D", "anchor word from another tier", m_anchor_wrong_tier),
    ("D", "tier example uses none of the tier's words", m_example_offtier),
    ("E", "capitalised distractor (giveaway)", m_capital_tell),
    ("E", "example sentence ≠ filled blank", m_example_mismatch),
    ("F", "same-tier synonym as distractor", m_synonym_distractor),
    ("F", "Wiktionary synonym as distractor", m_wiktionary_synonym),
    ("G", "drill answer is not the extreme", m_drill_wrong_answer),
    ("G", "drill options too close on a gap-2 axis", m_drill_gap),
    ("G", "grid distractor from the prompt's own column", m_grid_column_leak),
    ("H", "duplicate exercise id", m_dup_id),
    ("I", "unverified word claims 'ok'", m_status_lie),
    ("J", "js/data.js stale", m_stale_bundle),
    ("K", "scale_choice not dispatched", m_no_dispatch),
    ("K", "renderer bypasses selectAnswer funnel", m_bypass_funnel),
]


def run(root):
    env = dict(os.environ, SCALES_ROOT=str(root))
    r = subprocess.run([sys.executable, str(VALIDATOR)], env=env, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


def scratch():
    t = Path(tempfile.mkdtemp(prefix="scales-mut-"))
    for c in COPY:
        src, dst = ROOT / c, t / c
        dst.parent.mkdir(parents=True, exist_ok=True)
        (shutil.copytree if src.is_dir() else shutil.copy2)(src, dst)
    return t


def main():
    t = scratch()
    code, out = run(t)
    shutil.rmtree(t)
    if code != 0:
        print("baseline does not pass — fix the data first:\n" + out); sys.exit(1)
    print("baseline: PASS")
    bad = 0
    for letter, name, fn in MUTATIONS:
        t = scratch()
        flag = fn(t)
        if flag != "no-rebundle":
            rebundle(t)
        code, out = run(t)
        shutil.rmtree(t)
        caught = code == 1 and f"[{letter}]" in out
        others = sorted({l[3] for l in out.splitlines() if l.strip().startswith("[") and l.strip()[1] != letter})
        print(f"  {'caught' if caught else 'MISSED'}  [{letter}] {name}" + (f"   (also: {', '.join(others)})" if caught and others else ""))
        bad += not caught
    print(f"{len(MUTATIONS) - bad}/{len(MUTATIONS)} mutations caught")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
