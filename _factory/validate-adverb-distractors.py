#!/usr/bin/env python3
"""
validate-adverb-distractors.py — every adverb exercise has exactly ONE viable answer.

Independent copy of the rule in adverb-distractors/fix-distractors.py (never imports it).
Mutation-tested by verify-adverb-distractors-validator.py.

Two German options count as the same answer when any relation holds:
  same word · same grid cell / ≤1 tier apart on a shared scale · Wiktionary synonym
  (either direction) · same category + common Wiktionary synonym · shared English gloss
  segment · one content word (5+ letters) starts the other · manual pair (extra-viable.json)

  L1  fill-blank / EN→DE: no wrong option is the same answer as the correct one
  L2  fill-blank: no wrong option has an English gloss that appears in the item's English line
  L3  DE→EN: no wrong gloss shares a segment with the answer's gloss or an equivalent word's
  L4  fill-blank / EN→DE: every wrong option is either an adverb in the app or on the
      hand-reviewed list (otherwise nothing above can check it)
  L5  capitalisation of every option matches the answer (no giveaways)
  L6  option sets: no duplicates, answer not among the wrongs, 3+ wrongs

Run: python3 _factory/validate-adverb-distractors.py   (exit 1 on failure)
"""
import json, os, re, sys
from pathlib import Path

ROOT = Path(os.environ.get("DISTRACTORS_ROOT") or Path(__file__).resolve().parent.parent)
problems = []
def bad(code, msg): problems.append(f"[{code}] {msg}")

load = lambda *p: json.loads(ROOT.joinpath(*p).read_text(encoding="utf-8"))
adverbs = load("data", "adverbs.json")
exercises = load("data", "exercises", "exercises-adverbs.json")
axes = load("data", "adverb-scales.json")["axes"]
extra = load("_factory", "adverb-distractors", "extra-viable.json")

def parts(english):
    english = re.sub(r"\([^)]*\)", "", english.lower())
    out = set()
    for p in re.split(r"[/,;]", english):
        p = p.strip()
        if p.startswith("to "): p = p[3:].strip()
        if p: out.add(p)
    return out

G, CAT = {}, {}
for a in adverbs:
    w = a["word"].lower()
    G.setdefault(w, set()).update(parts(a["english"]))
    CAT.setdefault(w, a["category"])
WORDS = set(G)

SYN = {}
for row in ROOT.joinpath("_factory", "adverb-scales", "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
    if not row.strip() or row[0] == "#": continue
    f = row.split("\t")
    head = f[0].lower()
    for s in (f[5].split(",") if len(f) > 5 else []):
        if s:
            SYN.setdefault(head, set()).add(s.lower())
            SYN.setdefault(s.lower(), set()).add(head)

PLACE, CELL = {}, {}
for ax in axes:
    if ax["layout"] == "linear":
        for i, t in enumerate(ax["tiers"]):
            for c in t["words"]:
                PLACE.setdefault(c["w"].lower(), {})[ax["id"]] = i
    else:
        for r, row in enumerate(ax["cells"]):
            for k, cell in enumerate(row):
                for c in cell:
                    CELL.setdefault(c["w"].lower(), set()).add((ax["id"], r, k))

MANUAL = {}
for a, b, _why in extra["pairs"]:
    MANUAL.setdefault(a.lower(), set()).add(b.lower()); MANUAL.setdefault(b.lower(), set()).add(a.lower())
REVIEWED = {w.lower() for w in extra["reviewed_non_adverbs"]["words"]}
IGNORE = {"nicht", "gesagt", "immer", "zeit"}

def content(w):
    return [t for t in re.findall(r"[a-zäöüß]+", w) if len(t) >= 5 and t not in IGNORE]

def same_answer(a, b):
    """Returns the first relation that makes b a right answer where a is, or None."""
    a, b = a.lower(), b.lower()
    if a == b: return "same"
    if CELL.get(a, set()) & CELL.get(b, set()): return "cell"
    pa, pb = PLACE.get(a, {}), PLACE.get(b, {})
    if any(abs(pa[k] - pb[k]) < 2 for k in set(pa) & set(pb)): return "tier"
    sa, sb = SYN.get(a, set()), SYN.get(b, set())
    if b in sa or a in sb: return "wikt"
    if CAT.get(a) is not None and CAT.get(a) == CAT.get(b) and sa & sb: return "cosyn"
    if G.get(a, set()) & G.get(b, set()): return "gloss"
    if any(x.startswith(y) or y.startswith(x) for x in content(a) for y in content(b)): return "stem"
    if b in MANUAL.get(a, set()): return "manual"
    return None

def gloss_in(word, english):
    line = " " + re.sub(r"[^a-z' ]", " ", english.lower()) + " "
    return any(len(g) >= 4 and (" " + g + " ") in line for g in G.get(word.lower(), ()))

by_id = {a["id"]: a for a in adverbs}
checked = 0
for e in exercises:
    if e["type"] == "scale_choice":
        continue
    word = by_id[e["word_id"]]["word"]
    q = e["question"]
    eid, ans, wrong = e["exercise_id"], e["correct_answer"], e["wrong_answers"]
    if ans in wrong: bad("L6", f"{eid}: answer among wrongs")
    if len(set(x.lower() for x in [ans] + wrong)) != len(wrong) + 1: bad("L6", f"{eid}: duplicate options")
    if len(wrong) < 3: bad("L6", f"{eid}: only {len(wrong)} wrong options")
    german = e["type"] == "fill_blank" or q.get("prompt_en") == "WIE SAGT MAN DAS AUF DEUTSCH?"
    if german:
        checked += 1
        for x in wrong:
            if x.lower() not in WORDS and x.lower() not in REVIEWED and x.lower() not in MANUAL.get(word.lower(), set()):
                bad("L4", f"{eid}: '{x}' is not an adverb in the app and not on the reviewed list")
            why = same_answer(word, x)
            if why:
                bad("L1", f"{eid}: '{x}' is also a right answer for '{word}' ({why})")
            if e["type"] == "fill_blank" and gloss_in(x, q.get("en", "")):
                bad("L2", f"{eid}: '{x}' matches the English line “{q.get('en')}”")
            if x[:1].isupper() != ans[:1].isupper():
                bad("L5", f"{eid}: '{x}' capitalised differently from '{ans}'")
    elif q.get("prompt_en") == "WHAT DOES THIS ADVERB MEAN?":
        checked += 1
        right = set(parts(ans))
        for k in WORDS:
            if same_answer(word, k):
                right |= G[k]
        for x in wrong:
            if parts(x) & right:
                bad("L3", f"{eid}: '{x}' is also a right translation of '{word}'")

print(f"checked {checked} option sets across {len(exercises)} adverb exercises")
if problems:
    print(f"FAIL — {len(problems)}")
    for p in problems[:80]: print("  " + p)
    sys.exit(1)
print("PASS — L1–L6: one viable answer per exercise")
