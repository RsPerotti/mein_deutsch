#!/usr/bin/env python3
"""
validate-adverb-scales.py — independent checks for the Adverb Scales (Session 42).

Holds its OWN copy of the rules. It reads the generated data and the seeds, but
never imports generate.py, so a generator bug cannot pass silently.
Mutation-tested by verify-adverb-scales-validator.py.

  A  every chip on the reference screen points at a real adverb with the same word
  B  no word appears twice on one axis (tiers, cells and side notes together)
  C  Ricco's rule: an axis has 4+ words (side notes don't count)
  D  anchor sentences: one blank in the frame, filled with a word from that tier;
     every tier example contains one of the tier's words
  E  new words: 4 exercises, sane options, consistent capitalisation, example = filled blank
  F  new-word distractors are not synonyms (same tier on any axis, or Wiktionary synonym)
  G  drill exercises: options from distinct drillable tiers, gap respected, answer is the extreme
  H  exercise ids unique across every exercise file
  I  verification status of each chip matches the Wiktionary cache
  J  js/data.js carries exactly the JSON on disk
  K  scale_choice is dispatched in the Main engine and answers through selectAnswer()

Run:  python3 _factory/validate-adverb-scales.py      (exit 1 on any failure)
"""
import json, os, re, sys
from pathlib import Path

ROOT = Path(os.environ.get("SCALES_ROOT") or Path(__file__).resolve().parent.parent)
SEEDS = ROOT / "_factory" / "adverb-scales"
fails = []


def fail(check, msg):
    fails.append(f"[{check}] {msg}")


def J(*p):
    return json.loads(ROOT.joinpath(*p).read_text(encoding="utf-8"))


adverbs = J("data", "adverbs.json")
exs = J("data", "exercises", "exercises-adverbs.json")
scales = J("data", "adverb-scales.json")["axes"]
seed_axes = {a["id"]: a for a in J("_factory", "adverb-scales", "axes.json")["axes"]}
seed_new = J("_factory", "adverb-scales", "new-words.json")["new_words"]
by_id = {a["id"]: a for a in adverbs}

cache = {}
for line in (SEEDS / "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
    if line and not line.startswith("#"):
        c = line.split("\t") + [""] * 7
        cache[c[0]] = {"ok": c[1] == "1" and c[2] == "1", "syn": set(filter(None, c[5].split(",")))}

# ── A, B, C, D, I ───────────────────────────────────────────────────────────
NONCONTENT = {"ein", "als", "im", "in", "der", "die", "das", "vor", "zu", "von", "kein", "jedes"}


def expected_status(w):
    if cache.get(w, {}).get("ok"):
        return "ok"
    parts = w.split()
    content = [p for p in parts if p.lower() not in NONCONTENT]
    if len(parts) > 1 and content and all(cache.get(p, {}).get("ok") for p in content):
        return "phrase"
    return "unverified"


tier_of = {}      # axis -> {adverb id: tier index}
for ax in scales:
    aid = ax["id"]
    chips = []
    if ax["layout"] == "linear":
        for i, t in enumerate(ax["tiers"]):
            for c in t["words"]:
                chips.append(c)
                tier_of.setdefault(aid, {})[c["id"]] = i
    else:
        for row in ax["cells"]:
            for cell in row:
                chips += cell
    side = [c for s in ax.get("side", []) for c in s["words"]]
    for c in chips + side:
        a = by_id.get(c["id"])
        if not a:
            fail("A", f"{aid}: chip '{c['w']}' → missing id {c['id']}")
        elif a["word"] != c["w"]:
            fail("A", f"{aid}: chip '{c['w']}' points at '{a['word']}'")
        if c.get("status") != expected_status(c["w"]):
            fail("I", f"{aid}: '{c['w']}' status {c.get('status')} ≠ cache-derived {expected_status(c['w'])}")
    ids = [c["id"] for c in chips + side]
    words = [c["w"].lower() for c in chips + side]
    for x in set(ids):
        if ids.count(x) > 1:
            fail("B", f"{aid}: id {x} appears {ids.count(x)}×")
    for x in set(words):
        if words.count(x) > 1:
            fail("B", f"{aid}: word '{x}' appears {words.count(x)}×")
    if len(set(c["id"] for c in chips)) < 4:
        fail("C", f"{aid}: only {len(set(c['id'] for c in chips))} words (rule: 4+)")
    if ax["layout"] == "linear":
        for t in ax["tiers"]:
            exd = (t.get("example") or {}).get("de", "").lower()
            if not any(re.search(r"(?<![a-zäöüß])" + re.escape(c["w"].lower()) + r"(?![a-zäöüß])", exd)
                       for c in t["words"]):
                fail("D", f"{aid}/{t['label']}: example '{exd}' uses none of the tier's words")
        frame = ax.get("anchor_frame")
        for t in ax["tiers"]:
            an = t.get("anchor")
            if not an:
                continue
            if not frame or frame.count("___") != 1:
                fail("D", f"{aid}: anchor frame must contain exactly one ___")
                continue
            if frame.replace("___", an["word"]) != an["de"]:
                fail("D", f"{aid}/{t['label']}: anchor '{an['de']}' is not the frame filled with '{an['word']}'")
            if an["word"].lower() not in [c["w"].lower() for c in t["words"]]:
                fail("D", f"{aid}/{t['label']}: anchor word '{an['word']}' is not in this tier")

# ── E, F ────────────────────────────────────────────────────────────────────
same_tier = {}    # adverb id -> set of ids sharing a tier on some axis
for aid, m in tier_of.items():
    for x, i in m.items():
        same_tier.setdefault(x, set()).update(y for y, j in m.items() if j == i and y != x)
word_ids = {}
for a in adverbs:
    word_ids.setdefault(a["word"].lower(), set()).add(a["id"])

ex_by_word = {}
for e in exs:
    ex_by_word.setdefault(e["word_id"], []).append(e)
new_words = {s["word"] for s in seed_new}
new = [a for a in adverbs if "scales_s42" in a.get("tags", [])]
if {a["word"] for a in new} != new_words:
    fail("E", "tagged new adverbs ≠ new-words.json seeds")
for a in new:
    mine = sorted((e for e in ex_by_word.get(a["id"], []) if e["type"] != "scale_choice"),
                  key=lambda e: e["exercise_id"])
    if [e["type"] for e in mine] != ["translate_word", "fill_blank", "translate_word", "translate_word"]:
        fail("E", f"{a['word']}: expected 4 exercises tw/fb/tw/tw, got {[e['type'] for e in mine]}")
        continue
    for e in mine:
        opts = [e["correct_answer"]] + e["wrong_answers"]
        if e["correct_answer"] in e["wrong_answers"]:
            fail("E", f"{e['exercise_id']}: correct answer among wrongs")
        if len(set(opts)) != len(opts):
            fail("E", f"{e['exercise_id']}: duplicate options")
        if len(e["wrong_answers"]) < 3:
            fail("E", f"{e['exercise_id']}: fewer than 3 wrong answers")
    fb, en_de = mine[1], mine[2]
    q = fb["question"]["de"]
    if q.count("_____") != 1:
        fail("E", f"{fb['exercise_id']}: blank count ≠ 1")
    if q.replace("_____", fb["correct_answer"]) != a["example_sentences"][0]["de"]:
        fail("E", f"{fb['exercise_id']}: example sentence ≠ filled blank")
    if fb["correct_answer"].lower() != a["word"].lower():
        fail("E", f"{fb['exercise_id']}: answer '{fb['correct_answer']}' ≠ word '{a['word']}'")
    for e in (fb, en_de):
        up = e["correct_answer"][:1].isupper()
        for w in e["wrong_answers"]:
            if w[:1].isupper() != up:
                fail("E", f"{e['exercise_id']}: '{w}' capitalised differently from the answer (a giveaway)")
    if en_de["correct_answer"] != a["word"]:
        fail("E", f"{en_de['exercise_id']}: EN→DE answer ≠ word")
    # F — a distractor that is a synonym makes two answers right
    syn_ids = same_tier.get(a["id"], set())
    for e in (fb, en_de):
        for w in e["wrong_answers"]:
            wl = w.lower()
            if word_ids.get(wl, set()) & syn_ids:
                fail("F", f"{e['exercise_id']}: '{w}' shares a tier with '{a['word']}'")
            if w in cache.get(a["word"], {}).get("syn", set()) or wl in {s.lower() for s in cache.get(a["word"], {}).get("syn", set())}:
                fail("F", f"{e['exercise_id']}: '{w}' is a Wiktionary synonym of '{a['word']}'")

# ── G ───────────────────────────────────────────────────────────────────────
ax_by_id = {a["id"]: a for a in scales}
for e in (x for x in exs if x["type"] == "scale_choice"):
    m = re.match(r"ex_adv_scale_(.+)_\d{3}$", e["exercise_id"])
    if not m or m.group(1) not in ax_by_id:
        fail("G", f"{e['exercise_id']}: id does not name an axis")
        continue
    ax, sd = ax_by_id[m.group(1)], seed_axes[m.group(1)]
    if not sd.get("drill"):
        fail("G", f"{e['exercise_id']}: axis {ax['id']} is not drillable")
        continue
    opts = [e["correct_answer"]] + e["wrong_answers"]
    if len(set(opts)) != len(opts) or len(opts) < 3:
        fail("G", f"{e['exercise_id']}: needs 3+ distinct options")
    if by_id.get(e["word_id"], {}).get("word") != e["correct_answer"]:
        fail("G", f"{e['exercise_id']}: word_id does not match the answer")
    if ax["layout"] == "linear":
        idx = {}
        for i, t in enumerate(ax["tiers"]):
            for c in t["words"]:
                idx[c["w"]] = (i, t.get("drill", True))
        if any(o not in idx for o in opts):
            fail("G", f"{e['exercise_id']}: option not on the axis")
            continue
        tiers = [idx[o][0] for o in opts]
        if any(not idx[o][1] for o in opts):
            fail("G", f"{e['exercise_id']}: option from a tier excluded from drills")
        st = sorted(tiers)
        if len(set(st)) != len(st) or any(b - a < sd["drill"]["gap"] for a, b in zip(st, st[1:])):
            fail("G", f"{e['exercise_id']}: tiers {tiers} violate gap {sd['drill']['gap']}")
        d = e["question"]["de"]
        if d == sd["drill"].get("most", [None])[0]:
            want = min(tiers)
        elif d == sd["drill"].get("least", [None])[0]:
            want = max(tiers)
        else:
            fail("G", f"{e['exercise_id']}: question is neither the axis's 'most' nor 'least' prompt")
            continue
        if tiers[0] != want:
            fail("G", f"{e['exercise_id']}: '{e['correct_answer']}' is not the extreme for “{d}”")
    else:
        where = {}
        for r, row in enumerate(ax["cells"]):
            for c, cell in enumerate(row):
                for ch in cell:
                    where[ch["w"]] = (r, c)
        if any(o not in where for o in opts):
            fail("G", f"{e['exercise_id']}: option not in the grid")
            continue
        r, c = where[e["correct_answer"]]
        if f"{ax['cols'][c]} · {ax['rows'][r]}" not in e["question"]["de"]:
            fail("G", f"{e['exercise_id']}: answer is not the asked cell")
        for w in e["wrong_answers"]:
            if where[w][1] == c:
                fail("G", f"{e['exercise_id']}: wrong option '{w}' is in the asked column (shown in the prompt)")

# ── H ───────────────────────────────────────────────────────────────────────
seen = {}
for f in sorted((ROOT / "data" / "exercises").glob("*.json")):
    data = json.loads(f.read_text(encoding="utf-8"))
    for e in (data if isinstance(data, list) else []):
        i = e.get("exercise_id") or e.get("id")
        if i in seen:
            fail("H", f"duplicate exercise id {i} ({seen[i]} / {f.name})")
        seen[i] = f.name

# ── J ───────────────────────────────────────────────────────────────────────
dj = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
try:
    bundle = json.loads(dj[dj.index("{"): dj.rindex("}") + 1])
    for key, val in (("adverbs", adverbs), ("exercises_adverbs", exs), ("adverb_scales", {"axes": scales})):
        if bundle.get(key) != val:
            fail("J", f"js/data.js '{key}' differs from data/ — run bundle-data.py")
except ValueError as err:
    fail("J", f"js/data.js unparsable: {err}")

# ── K ───────────────────────────────────────────────────────────────────────
src = (ROOT / "js" / "exercises.js").read_text(encoding="utf-8")
if not re.search(r"ex\.type === 'scale_choice'\)\s*\{\s*card\.innerHTML = _renderScaleChoice\(ex\)", src):
    fail("K", "_showNext does not dispatch scale_choice to _renderScaleChoice")
m = re.search(r"function _renderScaleChoice\(ex\) \{([\s\S]*?)\n\}", src)
if not m or 'onclick="selectAnswer(this)"' not in m.group(1):
    fail("K", "_renderScaleChoice must answer through selectAnswer() (the _recordAnswer funnel)")

# ── report ──────────────────────────────────────────────────────────────────
n_drill = sum(1 for e in exs if e["type"] == "scale_choice")
print(f"axes {len(scales)} · adverbs {len(adverbs)} (new {len(new)}) · exercises {len(exs)} (drill {n_drill})")
if fails:
    print(f"FAIL — {len(fails)} problem(s):")
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("PASS — A–K all green")
