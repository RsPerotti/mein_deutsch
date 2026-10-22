#!/usr/bin/env python3
"""
fix-distractors.py — make sure no adverb exercise has more than one viable answer
(Session 42 follow-up, PRD_Adverb_Scales.md §Follow-up).

A "wrong" option is VIABLE when it means the same as the answer. Two German adverbs are
treated as equivalent when ANY of these holds (deliberately strict — over-replacing a fine
distractor costs nothing, leaving a second right answer costs the learner a point):
  same     the same word (kaum / kaum_2 are two entries of one word)
  tier     same grid cell, or at most ONE tier apart on a shared Adverb Scale
           (neighbours like sehr/ziemlich are told apart only by the English cue — too close)
  wikt     de.wiktionary.org lists one as a Synonym of the other (either direction)
  cosyn    same category and a common Wiktionary synonym (daher / dadurch via deshalb)
  stem     they share a content word of 5+ letters (ehrlich gesagt / ehrlicherweise)
  gloss    their English glosses share a segment ("that's why" in deshalb and deswegen)
  manual   extra-viable.json
For fill-blank items there is one more, context rule: an option is viable when one of its
English glosses appears in the item's English sentence ("He's basically the boss" makes
*im Grunde* right, whatever the intended answer).
For DE→EN items the option is English: it is viable when it shares a gloss segment with the
answer or with any word equivalent to the answer.

Each viable distractor is replaced, deterministically, by the best non-equivalent word:
  0  same scale axis, ≥3 tiers away (a clear contrast in the same slot)
  1  same category
  2  related category
  3  anything else
never a word equivalent to the answer, adjacent on a shared axis, already among the options,
or equivalent to another option. Capitalisation of every option follows the answer, so case
can't give the answer away.

Run AFTER _factory/adverb-scales/generate.py (which rewrites the S42 words' exercises),
then bundle-data.py, then validate-adverb-distractors.py (independent copy of the rule).
Writes report.md with every change. Idempotent.
"""
import json, re, hashlib
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
EXF = ROOT / "data" / "exercises" / "exercises-adverbs.json"
SIBLING = {
    "Cause & Effect": ["Contrast", "Connectors"], "Contrast": ["Cause & Effect", "Connectors"],
    "Connectors": ["Contrast", "Cause & Effect"], "Frequency & Time": ["Certainty & Probability"],
    "Certainty & Probability": ["Frequency & Time", "Agreement & Reaction"],
    "Agreement & Reaction": ["Certainty & Probability"], "Intensifiers": ["Frequency & Time"],
    "Indefinites": ["Place & Direction", "Frequency & Time"], "Place & Direction": ["Indefinites"],
    "Politeness & Softeners": ["Certainty & Probability"], "Modal Particles": ["Intensifiers"],
}
QUIET = {"Sentence Openers", "Fillers & Conversation Flow"}   # only offered within their own category


def segs(g):
    g = re.sub(r"\([^)]*\)", "", g.lower())
    return {s.strip().removeprefix("to ").strip() for s in re.split(r"[/,;]", g) if s.strip()}


def main():
    adv = json.loads((ROOT / "data" / "adverbs.json").read_text(encoding="utf-8"))
    ex = json.loads(EXF.read_text(encoding="utf-8"))
    axes = json.loads((ROOT / "data" / "adverb-scales.json").read_text(encoding="utf-8"))["axes"]
    extra = json.loads((HERE / "extra-viable.json").read_text(encoding="utf-8"))
    by_id = {a["id"]: a for a in adv}

    gloss, cat, english = defaultdict(set), {}, {}
    for a in adv:
        k = a["word"].lower()
        gloss[k] |= segs(a["english"])
        cat.setdefault(k, a["category"]); english.setdefault(k, a["english"])
    syn = defaultdict(set)
    for line in (ROOT / "_factory" / "adverb-scales" / "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        c = line.split("\t") + [""] * 7
        for s in filter(None, c[5].split(",")):
            syn[c[0].lower()].add(s.lower()); syn[s.lower()].add(c[0].lower())
    pos = defaultdict(dict)   # word -> {axis: tier index}
    tiers = defaultdict(set)
    for ax in axes:
        for i, t in enumerate(ax.get("tiers", [])):
            for ch in t["words"]:
                pos[ch["w"].lower()][ax["id"]] = i
        for r, row in enumerate(ax.get("cells", [])):
            for c, cell in enumerate(row):
                for ch in cell:
                    tiers[ch["w"].lower()].add((ax["id"], r, c))
    manual = defaultdict(set)
    for a, b, _ in extra["pairs"]:
        manual[a].add(b); manual[b].add(a)

    def equiv(a, b):
        a, b = a.lower(), b.lower()
        if a == b: return "same"
        if tiers[a] & tiers[b]: return "tier"
        if any(abs(pos[a][x] - pos[b][x]) <= 1 for x in pos[a].keys() & pos[b].keys()): return "tier"
        if b in syn[a]: return "wikt"
        if cat.get(a) and cat.get(a) == cat.get(b) and syn[a] & syn[b]: return "cosyn"
        if gloss[a] & gloss[b]: return "gloss"
        if stem(a, b): return "stem"
        if b in manual[a]: return "manual"
        return None

    STEM_IGNORE = {"nicht", "gesagt", "immer", "zeit"}

    def stem(a, b):
        # one content word starts the other: ehrlich / ehrlicherweise, Grunde / Grunde genommen.
        # Prefix only, so opposites built by prefixing (wahrscheinlich / unwahrscheinlich,
        # irgendwo / nirgendwo, weder / entweder) stay available as contrasts.
        ta = [t for t in re.findall(r"[a-zäöüß]+", a) if len(t) >= 5 and t not in STEM_IGNORE]
        tb = [t for t in re.findall(r"[a-zäöüß]+", b) if len(t) >= 5 and t not in STEM_IGNORE]
        return any(x.startswith(y) or y.startswith(x) for x in ta for y in tb)

    def in_context(x, en):
        en = " " + re.sub(r"[^a-z' ]", " ", en.lower()) + " "
        return any(len(g) >= 4 and f" {g} " in en for g in gloss[x.lower()])

    def too_close(a, b):
        pa, pb = pos[a.lower()], pos[b.lower()]
        return any(abs(pa[x] - pb[x]) < 3 for x in pa.keys() & pb.keys())

    pool = sorted({a["word"] for a in adv}, key=str.lower)

    def rank(w, c):
        wl, cl = w.lower(), c.lower()
        shared = pos[wl].keys() & pos[cl].keys()
        if shared and all(abs(pos[wl][x] - pos[cl][x]) >= 3 for x in shared): r = 0
        elif cat.get(cl) == cat.get(wl): r = 1
        elif cat.get(cl) in SIBLING.get(cat.get(wl), []): r = 2
        else: r = 3
        if cat.get(cl) in QUIET and cat.get(cl) != cat.get(wl):
            r = 9
        return (r, hashlib.md5(f"{w}|{c}".encode()).hexdigest())

    def pick_de(w, keep, ctx=""):
        for c in sorted(pool, key=lambda c: rank(w, c)):
            if rank(w, c)[0] >= 9: break
            if equiv(w, c) or too_close(w, c) or (ctx and in_context(c, ctx)): continue
            if any(c.lower() == k.lower() or equiv(c, k) for k in keep): continue
            return c
        raise SystemExit(f"no replacement for {w}")

    def pick_en(w, eqG, keep):
        for c in sorted(pool, key=lambda c: rank(w, c)):
            if rank(w, c)[0] >= 9: break
            g = english[c.lower()]
            if equiv(w, c) or too_close(w, c) or segs(g) & eqG: continue
            if any(segs(g) & segs(k) for k in keep): continue
            return g
        raise SystemExit(f"no English replacement for {w}")

    def case_like(ref, s):
        return (s[:1].upper() + s[1:]) if ref[:1].isupper() else (s[:1].lower() + s[1:])

    changes = []
    for e in ex:
        if e["type"] == "scale_choice":
            continue
        w = by_id[e["word_id"]]["word"]
        pr = e["question"].get("prompt_en", "")
        if e["type"] == "fill_blank" or pr == "WIE SAGT MAN DAS AUF DEUTSCH?":
            out = []
            ctx = e["question"].get("en", "") if e["type"] == "fill_blank" else ""
            for i, x in enumerate(e["wrong_answers"]):
                why = (equiv(w, x) or ("context" if ctx and in_context(x, ctx) else None)
                       or ("duplicate" if x.lower() in {o.lower() for o in out} else None))
                keep = out + e["wrong_answers"][i + 1:]
                if why:
                    new = case_like(e["correct_answer"], pick_de(w, keep + [e["correct_answer"]], ctx))
                    changes.append((e["exercise_id"], w, x, new, why))
                    out.append(new)
                else:
                    y = case_like(e["correct_answer"], x)
                    if y != x:
                        changes.append((e["exercise_id"], w, x, y, "case"))
                    out.append(y)
            e["wrong_answers"] = out
        elif pr == "WHAT DOES THIS ADVERB MEAN?":
            eqW = {k for k in gloss if equiv(w, k)}
            eqG = set().union(*[gloss[k] for k in eqW]) | segs(e["correct_answer"])
            out = []
            for i, x in enumerate(e["wrong_answers"]):
                keep = out + e["wrong_answers"][i + 1:] + [e["correct_answer"]]
                dup = x.lower() in {o.lower() for o in out}
                if segs(x) & eqG or dup:
                    new = pick_en(w, eqG, keep)
                    changes.append((e["exercise_id"], w, x, new, "duplicate" if dup else "gloss"))
                    out.append(new)
                else:
                    out.append(x)
            e["wrong_answers"] = out

    if not changes:
        print("nothing to fix — every exercise already has exactly one viable answer")
        return
    EXF.write_text(json.dumps(ex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # The ledger is cumulative: generate.py rewrites the S42 words' exercises from seeds on
    # every run, so this script re-applies the same changes each time — keyed rows keep the
    # record complete without duplicating it.
    led_f = HERE / "ledger.tsv"
    ledger = {}
    if led_f.exists():
        for line in led_f.read_text(encoding="utf-8").splitlines()[1:]:
            r = line.split("\t"); ledger[(r[0], r[2])] = r
    for c in changes:
        ledger[(c[0], c[2])] = list(c)
    rows = sorted(ledger.values())
    led_f.write_text("exercise\tanswer\twas\tnow\twhy\n" + "\n".join("\t".join(r) for r in rows) + "\n", encoding="utf-8")
    sem = [r for r in rows if r[4] != "case"]
    lines = ["# Distractor fix — report (all changes ever applied; source: ledger.tsv)", "",
             f"- semantic replacements: {len(sem)} in {len({r[0] for r in sem})} exercises "
             f"({len({r[1] for r in sem})} words)",
             f"- capitalisation fixes: {len(rows) - len(sem)}", "",
             "| exercise | answer | was | now | why |", "|---|---|---|---|---|"]
    lines += ["| " + " | ".join(r) + " |" for r in rows]
    (HERE / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"this run: {len(changes)} changes · ledger: {len(sem)} semantic in {len({r[0] for r in sem})} exercises, {len(rows) - len(sem)} case")


if __name__ == "__main__":
    main()
