#!/usr/bin/env python3
"""
generate.py — Adverb Scales (Session 42, PRD_Adverb_Scales.md)

Inputs (hand-authored seeds):
  axes.json             16 axes: tiers / grid cells, anchors, drill config, side notes
  new-words.json        74 words the axes need that the app did not have
  wiktionary-cache.tsv  de.wiktionary.org evidence (fetched in the in-app browser)

Outputs (never hand-edit):
  data/adverbs.json                      + new entries   (tag 'scales_s42')
  data/exercises/exercises-adverbs.json  + 4 exercises per new word
                                         + scale_choice drill exercises (ex_adv_scale_*)
  data/adverb-scales.json                the reference screen's data
  _factory/adverb-scales/report.md       verification status + Wiktionary warnings

Idempotent: everything tagged/namespaced by a previous run is removed first, so the
output always reflects ALL seeds, not the rows one run happened to add.
Rules live in validate-adverb-scales.py as an independent copy — keep it that way.
"""
import json, random, re, itertools
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
D = ROOT / "data"
TAG = "scales_s42"
UNLOCK = {"A1": 1, "A2": 2, "B1": 3, "B2": 4}
STOP = {"ein", "als", "im", "in", "der", "die", "das", "vor", "zu", "von", "kein", "jedes"}


def slug(w):
    s = w.lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    return "adv_" + re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def cap(s):
    return s[:1].upper() + s[1:]


def blank_is_initial(sentence, marker):
    i = sentence.index(marker)
    before = sentence[:i].rstrip()
    return before == "" or before.endswith(("–", ".", "!", "?"))


def load_cache():
    rows = {}
    for line in (HERE / "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        c = line.split("\t")
        c += [""] * (7 - len(c))
        rows[c[0]] = dict(exists=c[1] == "1", deutsch=c[2] == "1", pos=c[3], bed=c[4],
                          syn=[x for x in c[5].split(",") if x], gegen=[x for x in c[6].split(",") if x])
    return rows


def status(word, cache):
    r = cache.get(word)
    if r and r["exists"] and r["deutsch"]:
        return "ok"
    toks = [t for t in word.split() if t.lower() not in STOP]
    if len(word.split()) > 1 and toks and all(cache.get(t, {}).get("deutsch") for t in toks):
        return "phrase"
    return "unverified"


def main():
    axes = json.loads((HERE / "axes.json").read_text(encoding="utf-8"))["axes"]
    seeds = json.loads((HERE / "new-words.json").read_text(encoding="utf-8"))["new_words"]
    cache = load_cache()

    adverbs = json.loads((D / "adverbs.json").read_text(encoding="utf-8"))
    exercises = json.loads((D / "exercises" / "exercises-adverbs.json").read_text(encoding="utf-8"))
    # Strip a previous run's output
    old_ids = {a["id"] for a in adverbs if TAG in a.get("tags", [])} | {slug(s["word"]) for s in seeds}
    adverbs = [a for a in adverbs if a["id"] not in old_ids]
    exercises = [e for e in exercises if e["word_id"] not in old_ids
                 and not e["exercise_id"].startswith("ex_adv_scale_")]

    existing_words = {a["word"].lower() for a in adverbs}
    ids = {a["id"] for a in adverbs}

    # ── new words ─────────────────────────────────────────────────────────
    new_entries, new_ex = [], []
    for s in seeds:
        w = s["word"]
        if w.lower() in existing_words:
            raise SystemExit(f"new word already in adverbs.json: {w}")
        wid = slug(w)
        if wid in ids:
            raise SystemExit(f"id collision: {wid}")
        ids.add(wid)
        fb_de = s["fb"]["de"]
        initial = blank_is_initial(fb_de, "_____")
        ans = cap(w) if initial else w
        full_de = fb_de.replace("_____", ans)
        axis_tags = sorted({a["id"] for a in axes for t in a.get("tiers", [])
                            for x in t["words"] if x.split("@")[0] == w}
                           | {a["id"] for a in axes for r in a.get("cells", []) for c in r
                              for x in c if x.split("@")[0] == w})
        new_entries.append({
            "id": wid, "word": w, "english": s["english"], "category": s["category"],
            "register": s["register"], "module": "adverbs", "unlock_level": UNLOCK[s["cefr"]],
            "cefr": s["cefr"],
            "example_sentences": [{"de": full_de, "en": s["fb"]["en"],
                                   "exercise_type": ["fill_blank", "translate_word"]}],
            "tags": [TAG] + axis_tags + [s["cefr"].lower()],
        })
        g_fb = [cap(x) if initial else x for x in s["gdist"]]
        note = s["note"]
        new_ex += [
            {"exercise_id": f"ex_{wid}_001", "word_id": wid, "type": "translate_word", "difficulty": 1,
             "question": {"de": w, "prompt_en": "WHAT DOES THIS ADVERB MEAN?"},
             "correct_answer": s["english"], "wrong_answers": s["tdist"],
             "explanation_en": f"'{w}' means '{s['english']}'. {note}"},
            {"exercise_id": f"ex_{wid}_002", "word_id": wid, "type": "fill_blank", "difficulty": 2,
             "question": {"de": fb_de, "en": s["fb"]["en"]},
             "correct_answer": ans, "wrong_answers": g_fb,
             "explanation_en": f"The correct word here is '{w}' ({s['english']})."},
            {"exercise_id": f"ex_{wid}_003", "word_id": wid, "type": "translate_word", "difficulty": 2,
             "question": {"de": s["english"], "prompt_en": "WIE SAGT MAN DAS AUF DEUTSCH?"},
             "correct_answer": w, "wrong_answers": s["gdist"],
             "explanation_en": f"'{s['english']}' is '{w}' in German."},
            {"exercise_id": f"ex_{wid}_004", "word_id": wid, "type": "translate_word", "difficulty": 3,
             "question": {"de": full_de, "prompt_en": "WHAT DOES THIS SENTENCE MEAN?"},
             "correct_answer": s["fb"]["en"], "wrong_answers": s["wsent"],
             "explanation_en": f"'{full_de}' = '{s['fb']['en']}' — '{w}' means '{s['english']}'."},
        ]

    all_adv = adverbs + new_entries
    by_word = {}
    for a in all_adv:
        by_word.setdefault(a["word"].lower(), []).append(a)
    by_id = {a["id"]: a for a in all_adv}

    def resolve(ref):
        w, _, explicit = ref.partition("@")
        if explicit:
            if explicit not in by_id or by_id[explicit]["word"].lower() != w.lower():
                raise SystemExit(f"bad explicit id {ref}")
            return by_id[explicit]
        hits = by_word.get(w.lower(), [])
        if len(hits) != 1:
            raise SystemExit(f"'{w}' resolves to {len(hits)} entries — give an explicit @id")
        return hits[0]

    def chip(ref):
        a = resolve(ref)
        return {"w": a["word"], "id": a["id"], "en": a["english"], "status": status(a["word"], cache)}

    def example_of(a):
        ex = (a.get("example_sentences") or [{}])[0]
        return {"de": ex.get("de", ""), "en": ex.get("en", "")}

    # ── reference data ────────────────────────────────────────────────────
    out_axes, drills, warnings = [], [], []
    for ax in axes:
        o = {k: ax[k] for k in ("id", "title", "question_de", "question_en", "layout") if k in ax}
        o["side"] = []
        for sd in ax.get("side", []):
            o["side"].append({"text": sd["text"],
                              "words": [chip(x) for x in sd.get("words", [])]})
        if ax["layout"] == "linear":
            o["top"], o["bottom"] = ax["top"], ax["bottom"]
            o["tiers"] = []
            for t in ax["tiers"]:
                chips = [chip(x) for x in t["words"]]
                # The example comes from the anchor word when there is one: the anchor was
                # chosen for this axis's sense, while the tier's first word may be polysemous
                # (kaum's own example is the frequency sense, wrong on Gewissheit).
                src = next((x for x in t["words"] if t.get("anchor_word") and
                            x.split("@")[0].lower() == t["anchor_word"].lower()), t["words"][0])
                first = resolve(src)
                tier = {"label": t["label"], "label_en": t["label_en"], "words": chips,
                        # seed override when the word's stored example shows another sense
                        "example": dict(t["example"]) if t.get("example") else example_of(first)}
                if ax.get("anchor") and t.get("anchor_word"):
                    aw = t["anchor_word"]
                    frame = ax["anchor"]
                    filled = frame.replace("___", cap(aw) if blank_is_initial(frame, "___") else aw)
                    tier["anchor"] = {"de": filled, "word": cap(aw) if blank_is_initial(frame, "___") else aw,
                                      "en": t["anchor_en"]}
                if t.get("note"):
                    tier["note"] = t["note"]
                if t.get("drill") is False:
                    tier["drill"] = False
                o["tiers"].append(tier)
            o["anchor_frame"] = ax.get("anchor")
        else:
            o["cols"], o["cols_en"], o["rows"], o["rows_en"] = ax["cols"], ax["cols_en"], ax["rows"], ax["rows_en"]
            o["cells"] = [[[chip(x) for x in cell] for cell in row] for row in ax["cells"]]
        o["drill"] = bool(ax.get("drill"))
        if ax.get("evidence"):
            o["evidence"] = ax["evidence"]
        out_axes.append(o)

        # Wiktionary cross-check (warnings for the report; hard rules live in the validator)
        if ax["layout"] == "linear" and not ax.get("synonyms_expected"):
            pos = {}
            for i, t in enumerate(ax["tiers"]):
                for x in t["words"]:
                    pos[x.split("@")[0]] = i
            for w, i in pos.items():
                for s_ in cache.get(w, {}).get("syn", []):
                    if s_ in pos and abs(pos[s_] - i) >= 2:
                        warnings.append(f"{ax['id']}: Wiktionary lists '{s_}' as a synonym of '{w}', "
                                        f"but they are {abs(pos[s_]-i)} tiers apart")

        # ── drills ──
        dr = ax.get("drill")
        if not dr:
            continue
        rng = random.Random(ax["id"])
        items = []
        if ax["layout"] == "linear":
            elig = [i for i, t in enumerate(ax["tiers"]) if t.get("drill") is not False]
            gap = dr["gap"]
            combos = []
            for k in (4, 3):
                combos = [c for c in itertools.combinations(elig, k)
                          if all(b - a >= gap for a, b in zip(c, c[1:]))]
                if combos:
                    break
            if not combos:
                raise SystemExit(f"{ax['id']}: no drill combination with gap {gap}")
            rng.shuffle(combos)
            dirs = [d for d in ("most", "least") if d in dr]
            per_dir = 8 // len(dirs)
            for di, d in enumerate(dirs):
                seen_sets = set()
                for n, c in enumerate(combos * 4):
                    if len([i for i in items if i["scale"]["direction"] == d]) >= per_dir:
                        break
                    picks = []
                    for ti in c:
                        ws = ax["tiers"][ti]["words"]
                        picks.append((ti, resolve(ws[(n + di) % len(ws)])))
                    key = tuple(sorted(p[1]["id"] for p in picks))
                    if key in seen_sets:
                        continue
                    seen_sets.add(key)
                    correct = picks[0] if d == "most" else picks[-1]
                    order = " → ".join(p[1]["word"] for p in picks)
                    items.append({
                        "type": "scale_choice", "difficulty": 2,
                        "question": {"de": dr[d][0], "en": dr[d][1], "axis": ax["title"]},
                        "correct_answer": correct[1]["word"],
                        "wrong_answers": [p[1]["word"] for p in picks if p is not correct],
                        "word_id": correct[1]["id"],
                        "scale": {"axis": ax["id"], "direction": d, "tiers": [p[0] for p in picks]},
                        "explanation_en": f"{ax['title']} ({ax['top']} → {ax['bottom']}): {order}",
                    })
        else:
            R, C = len(ax["rows"]), len(ax["cols"])
            for r in range(R):
                for c in range(C):
                    corr = resolve(ax["cells"][r][c][0])
                    # Wrong options never come from the cell's own column: those words are
                    # printed in the prompt's pattern, so they would be free eliminations.
                    others = [resolve(ax["cells"][r][cc][0]) for cc in range(C) if cc != c]
                    others += [resolve(ax["cells"][rr][cc][0]) for rr in range(R) for cc in range(C)
                               if rr != r and cc != c]
                    seen, wrong = {corr["word"]}, []
                    for x in others:
                        if x["word"] not in seen:
                            seen.add(x["word"]); wrong.append(x["word"])
                    wrong = wrong[:3]
                    pattern = " → ".join("___" if rr == r else resolve(ax["cells"][rr][c][0])["word"]
                                         for rr in range(R))
                    items.append({
                        "type": "scale_choice", "difficulty": 2,
                        "question": {"de": f"{ax['cols'][c]} · {ax['rows'][r]}: {pattern}",
                                     "en": f"{ax['cols_en'][c]} · {ax['rows_en'][r]}", "axis": ax["title"]},
                        "correct_answer": corr["word"], "wrong_answers": wrong, "word_id": corr["id"],
                        "scale": {"axis": ax["id"], "direction": "cell", "cell": [r, c]},
                        "explanation_en": f"{ax['title']} — {ax['cols_en'][c]}: " +
                                          " → ".join(f"{resolve(ax['cells'][rr][c][0])['word']} ({ax['rows_en'][rr]})"
                                                     for rr in range(R)),
                    })
        for n, it in enumerate(items, 1):
            it["exercise_id"] = f"ex_adv_scale_{ax['id']}_{n:03d}"
            drills.append(it)

    # ── write ─────────────────────────────────────────────────────────────
    (D / "adverbs.json").write_text(json.dumps(all_adv, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (D / "exercises" / "exercises-adverbs.json").write_text(
        json.dumps(exercises + new_ex + drills, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (D / "adverb-scales.json").write_text(
        json.dumps({"axes": out_axes}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    st = {}
    for o in out_axes:
        chips = [c for t in o.get("tiers", []) for c in t["words"]] + \
                [c for r in o.get("cells", []) for cell in r for c in cell]
        for c in chips:
            st[c["w"]] = c["status"]
    lines = ["# Adverb Scales — generation report", "",
             f"- axes: {len(out_axes)}", f"- new words: {len(new_entries)} (+{len(new_ex)} exercises)",
             f"- drill exercises: {len(drills)}", "",
             "## Verification status (de.wiktionary.org)", ""]
    for k in ("ok", "phrase", "unverified"):
        ws = sorted(w for w, s_ in st.items() if s_ == k)
        lines.append(f"- **{k}** ({len(ws)}): {', '.join(ws)}")
    lines += ["", "`phrase` = no entry of its own, but every content word has one. "
              "`unverified` = shown in the app with a ? badge.", "",
              "## Wiktionary synonyms placed ≥2 tiers apart (review; usually polysemy)", ""]
    lines += [f"- {w}" for w in sorted(set(warnings))] or ["- none"]
    (HERE / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"adverbs {len(all_adv)}  exercises {len(exercises)+len(new_ex)+len(drills)}  "
          f"(+{len(new_ex)} word, +{len(drills)} drill)  axes {len(out_axes)}  warnings {len(set(warnings))}")


if __name__ == "__main__":
    main()
