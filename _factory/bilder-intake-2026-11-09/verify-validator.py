#!/usr/bin/env python3
"""
verify-validator.py — seeded-bug test for validate.py (Session 44).

A validator that passes is only evidence if it can fail. Each case below copies the project's
data into a temp root, plants ONE known bug, and requires validate.py to fail with the expected
check code. The unmutated copy must pass. Exit 1 if any planted bug slips through.

Run: python3 _factory/bilder-intake-2026-11-09/verify-validator.py
"""
import json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent

def jl(p): return json.loads(p.read_text(encoding="utf-8"))
def jd(p, o): p.write_text(json.dumps(o, ensure_ascii=False, indent=1), encoding="utf-8")

def setup():
    t = Path(tempfile.mkdtemp())
    shutil.copytree(ROOT / "data", t / "data")
    (t / "js").mkdir(); shutil.copy(ROOT / "js/data.js", t / "js/data.js"); shutil.copy(ROOT / "js/exercises.js", t / "js/exercises.js")
    shutil.copytree(HERE, t / "_factory/bilder-intake-2026-11-09", ignore=shutil.ignore_patterns("backups", "__pycache__"))
    return t

def rebundle(t):
    s = (t / "js/data.js").read_text(encoding="utf-8").strip()
    B = json.loads(re.sub(r"^\s*window\.APP_DATA\s*=\s*", "", s).rstrip(";"))
    for k, f in [("verbs", "verbs"), ("nouns", "nouns"), ("adjectives", "adjectives"), ("adverbs", "adverbs"),
                 ("expressions", "expressions"), ("verb_prepositions", "verb-prepositions")]:
        B[k] = jl(t / f"data/{f}.json")
    B["exercises_prepositions"] = jl(t / "data/exercises/exercises-prepositions.json")
    B["exercises_nouns"] = jl(t / "data/exercises/exercises-nouns.json")
    B["exercises"]["module_verbs"] = jl(t / "data/exercises/exercises-verbs.json")
    (t / "js/data.js").write_text("window.APP_DATA = " + json.dumps(B, ensure_ascii=False) + ";\n", encoding="utf-8")

def ex_edit(t, fname, eid, fn):
    p = t / f"data/exercises/exercises-{fname}.json"; L = jl(p)
    for e in L:
        if e.get("exercise_id") == eid: fn(e)
    jd(p, L)

def data_edit(t, fname, fn):
    p = t / f"data/{fname}.json"; L = jl(p); fn(L); jd(p, L)

def verb(L, root): return next(v for v in L if v["root"] == root)

CASES = [
 ("V1", "wrong Partizip II", lambda t: (data_edit(t, "verbs", lambda L: verb(L, "dauern")["conjugation"].update(past_participle="dauert")))),
 ("V2", "wrong Präteritum table cell", lambda t: ex_edit(t, "verbs", "verb_fliehen_table_prateritum", lambda e: e["forms"].update(du="flohest"))),
 ("V3", "Präteritum offered as a wrong option", lambda t: ex_edit(t, "verbs", "ex_verb_lachen_003", lambda e: e["wrong_answers"].__setitem__(0, "lachte"))),
 ("V3", "base infinitive (grammatical) in an infinitive slot", lambda t: ex_edit(t, "verbs", "ex_verb_nachsehen_004", lambda e: e["wrong_answers"].__setitem__(0, "sehen"))),
 ("V4", "gap after ambiguous 'Sie'", lambda t: ex_edit(t, "verbs", "ex_verb_reden_002", lambda e: e["question"].update(de="Sie _____ oft über Politik."))),
 ("V5", "a verb missing one exercise", lambda t: (lambda p: jd(p, [e for e in jl(p) if e["exercise_id"] != "verb_husten_aux"]))(t / "data/exercises/exercises-verbs.json")),
 ("N1", "noun distractor with a fitting gender", lambda t: ex_edit(t, "nouns", "ex_noun_ersatz_002", lambda e: e["wrong_answers"].__setitem__(0, "Fehler"))),
 ("N1", "noun distractor identical to its plural after 'die'", lambda t: ex_edit(t, "nouns", "ex_noun_gewohnheit_003", lambda e: e["wrong_answers"].__setitem__(0, "Fehler"))),
 ("N2", "wrong plural", lambda t: data_edit(t, "nouns", lambda L: next(n for n in L if n["word"] == "Absatz").update(plural="Absatze"))),
 ("A1", "invented comparative", lambda t: data_edit(t, "adjectives", lambda L: next(a for a in L if a["word"] == "erkältet").update(comparative="erkälteter"))),
 ("S1", "synonym as a wrong adjective option", lambda t: ex_edit(t, "adjectives", "ex_adj_gunstig_003", lambda e: e["wrong_answers"].__setitem__(0, "billig"))),
 ("S1", "synonym in a double-conjunction fill", lambda t: ex_edit(t, "expressions", "ex_expr_je_desto_002", lambda e: e["wrong_answers"].__setitem__(0, "umso"))),
 ("S2", "synonym's English as a wrong verb gloss", lambda t: ex_edit(t, "verbs", "ex_verb_reden_001", lambda e: e["wrong_answers"].__setitem__(0, "to speak"))),
 ("F1", "gap sentence not among the examples", lambda t: ex_edit(t, "nouns", "ex_noun_satz_002", lambda e: e["question"].update(de="Bitte schreib den _____ noch einmal."))),
 ("P1", "preposition not attested for the verb", lambda t: data_edit(t, "verb-prepositions", lambda L: next(v for v in L if v["id"] == "vp_warnen_vor").update(preposition="über", da_form="darüber"))),
 ("P2", "attested preposition used as a distractor", lambda t: ex_edit(t, "prepositions", "ex_vp_fragen_nach_1", lambda e: e["wrong_answers"].__setitem__(0, "um"))),
 ("P3", "case-ambiguous word after the gap", lambda t: ex_edit(t, "prepositions", "ex_vp_denken_an_1", lambda e: e["question"].update(de="Ich denke oft _____ den Urlaub."))),
 ("P3", "distractor governing the same case", lambda t: ex_edit(t, "prepositions", "ex_vp_arbeiten_an_1", lambda e: e["wrong_answers"].__setitem__(0, "mit"))),
 ("P4", "temporal da-adverb as a distractor", lambda t: ex_edit(t, "prepositions", "ex_vp_glauben_an_da", lambda e: e["wrong_answers"].__setitem__(0, "danach"))),
 ("P4", "misspelt da-form", lambda t: data_edit(t, "verb-prepositions", lambda L: next(v for v in L if v["id"] == "vp_nachdenken_ueber").update(da_form="daüber"))),
 ("P5", "case answer flipped", lambda t: ex_edit(t, "prepositions", "ex_vp_angst_vor_case", lambda e: (e.update(correct_answer="Akkusativ"), e.update(wrong_answers=["Dativ", "Nominativ", "Genitiv"])))),
 ("G1", "capitalisation gives the answer away", lambda t: ex_edit(t, "adverbs", "ex_adv_obwohl_002", lambda e: e["wrong_answers"].__setitem__(0, "deshalb"))),
 ("G2", "duplicate exercise id", lambda t: ex_edit(t, "nouns", "ex_noun_satz_003", lambda e: e.update(exercise_id="ex_noun_mann_001"))),
 ("G4", "exercise type no engine serves", lambda t: ex_edit(t, "expressions", "ex_expr_klasse_002", lambda e: e.update(type="match_pairs"))),
]

def run(t):
    r = subprocess.run([sys.executable, str(HERE / "validate.py"), "--root", str(t)], capture_output=True, text=True)
    return r.returncode, r.stdout

def main():
    fails = 0
    t = setup(); rc, out = run(t); shutil.rmtree(t)
    print(f"baseline (no bug): {'PASS' if rc == 0 else 'FAIL'}")
    if rc != 0: print(out); fails += 1
    for code, what, mutate in CASES:
        t = setup(); mutate(t); rebundle(t); rc, out = run(t); shutil.rmtree(t)
        caught = rc == 1 and f"[{code}]" in out
        print(f"  {'caught' if caught else 'MISSED'}  {code}  {what}")
        fails += not caught
    # G3 needs a stale bundle, so no rebundle
    t = setup(); data_edit(t, "verb-prepositions", lambda L: L[0].update(english="x")); rc, out = run(t); shutil.rmtree(t)
    caught = rc == 1 and "[G3]" in out; fails += not caught
    print(f"  {'caught' if caught else 'MISSED'}  G3  bundle stale after a data edit")
    print(f"{len(CASES) + 1 - (fails if fails else 0)}/{len(CASES) + 1} planted bugs caught" if not fails else f"❌ {fails} problem(s)")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
