#!/usr/bin/env python3
"""
generate.py — Session 44 Bilder-Intake (vocabulary from Ricco's Instagram screenshots).

Expands the authored seeds in this folder into app entries + exercises and merges them into
data/. Idempotent: every id this script ever wrote is listed in generated-ids.json and stripped
before re-adding, so re-running gives the same result.

Seeds (authored):   verb-seeds.json, noun-seeds.json, adjective-seeds.json, adverb-seeds.json,
                    expression-seeds.json, verb-preposition-seeds.json
Caches (fetched):   wiktionary-*.tsv, valency-evidence.json, adverb-wiktionary.json
Writes:             data/{verbs,nouns,adjectives,adverbs,expressions,verb-prepositions}.json,
                    data/exercises/exercises-{verbs,nouns,adjectives,adverbs,expressions,prepositions}.json,
                    generated-ids.json, report.md, and appends rows to the adverb Wiktionary cache.

Then run: python3 _factory/bundle-data.py && python3 _factory/bilder-intake-2026-11-09/validate.py
"""
import json, re, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
D = ROOT / "data"
EX = D / "exercises"
PERSONS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
PERSON_EN = {"ich": "ich", "du": "du", "er_sie_es": "er/sie/es", "wir": "wir", "ihr": "ihr", "sie_Sie": "sie/Sie"}
AUX = {"haben": ["habe", "hast", "hat", "haben", "habt", "haben"], "sein": ["bin", "bist", "ist", "sind", "seid", "sind"]}
UNLOCK = {"A1": 1, "A2": 2, "B1": 3, "B2": 4}
DAT_ONLY = ["mit", "nach", "von", "zu", "bei", "aus", "seit"]
AKK_ONLY = ["für", "durch", "gegen", "ohne", "um"]
DA_PURE = ["daran", "darüber", "davon", "dafür", "darin", "daraus", "darunter"]
DA_OF = {"daran": "an", "darüber": "über", "davon": "von", "dafür": "für", "darin": "in", "daraus": "aus",
         "darunter": "unter", "danach": "nach", "davor": "vor", "dabei": "bei", "dazu": "zu", "damit": "mit",
         "dagegen": "gegen", "darauf": "auf", "darum": "um", "dadurch": "durch"}
NOT_DAT = {"einen", "das", "ein", "mein", "dein", "sein", "kein", "dieses", "die", "eine", "meine", "deine",
           "seine", "ihre", "keine", "diese", "mich", "dich", "ihn"}
NOT_AKK = {"dem", "einem", "meinem", "deinem", "seinem", "ihrem", "unserem", "keinem", "diesem", "der", "einer",
           "meiner", "deiner", "seiner", "ihrer", "keiner", "dieser", "mir", "dir", "ihm"}
PREP_ID = {"über": "prep_ueber", "für": "prep_fuer", "an": "prep_an", "von": "prep_von", "nach": "prep_nach",
           "vor": "prep_vor", "bei": "prep_bei", "zu": "prep_zu", "mit": "prep_mit", "gegen": "prep_gegen"}


def jload(p): return json.loads(Path(p).read_text(encoding="utf-8"))
def jdump(p, o): Path(p).write_text(json.dumps(o, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def translit(w, strip=False):
    w = w.lower()
    if strip:
        return w.replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss")
    return w.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")


def tsv(name):
    out = {}
    for line in (HERE / name).read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            c = line.split("\t"); out[c[0]] = c[1:]
    return out


def joined(form, prefix, sep):
    return f"{form} {prefix}" if (sep and prefix) else form


def expand_praet(praet):
    if isinstance(praet, list): return praet
    t = praet
    return [t, t + "st", t, t + "n", t + "t", t + "n"]


def fill(de, ans):
    out = de
    for part in ans.split(" ... "):
        out = out.replace("_____", part, 1)
    return out


def uniq(seq, exclude):
    out, seen = [], {x.lower() for x in exclude}
    for x in seq:
        if x and x.lower() not in seen:
            out.append(x); seen.add(x.lower())
    return out


# ───────────────────────────── verbs ─────────────────────────────
def verb_wrongs(s, word, pres, prefix, sep, pp):
    """Three wrong options that cannot fit: other persons / unseparated form / bare Partizip II.
    No Präteritum forms: a past form is grammatical in a present sentence (Session 44 change)."""
    ans, p = s["ans"], s["p"]
    zu_inf = f"{prefix}zu{word[len(prefix):]}" if sep else f"zu {word}"   # last-resort wrong form (never finite)
    return (_verb_wrongs(s, word, pres, prefix, sep, pp) + [zu_inf])[:3] if len(_verb_wrongs(s, word, pres, prefix, sep, pp)) < 3 else _verb_wrongs(s, word, pres, prefix, sep, pp)


def _verb_wrongs(s, word, pres, prefix, sep, pp):
    ans, p = s["ans"], s["p"]
    if p == "inf":
        er = joined(pres[2], prefix, sep)
        cand = [er, pp, (prefix + pres[2]) if sep else joined(pres[1], prefix, sep), joined(pres[0], prefix, sep)]
        return uniq(cand, [ans, word])[:3]
    pi = PERSONS.index(p)
    if " ... " in ans:
        others = [f"{pres[j]} ... {prefix}" for j in (1, 2, 0, 3, 4, 5) if pres[j] != pres[pi]]
        return uniq([others[0], prefix + pres[pi], pp] + others[1:], [ans])[:3]
    others = [pres[j] for j in (1, 2, 0, 3, 4, 5) if pres[j] != pres[pi]]
    return uniq(others[:2] + [pp] + others[2:], [ans])[:3]


def verb_exercises(word, wid, english, vtype, pres, praet, pp, aux, prefix, sep, sent, tdist, note, is_root, refl):
    ex = []
    praet = expand_praet(praet)
    ex.append({"exercise_id": f"ex_{wid}_001", "word_id": wid, "type": "translate_word", "difficulty": 1,
               "question": {"de": word, "prompt_en": "What does this verb mean?"},
               "correct_answer": english, "wrong_answers": tdist,
               "explanation_en": f"'{word}' means '{english}'. {note}".strip()})
    for num, (i, typ, diff) in zip(["002", "003", "004"], [(0, "fill_blank", 1), (2, "conjugation_choice", 2), (1, "fill_blank", 1)]):
        s = sent[i]
        if s["p"] == "inf":
            expl = f"After a modal verb (or zu/lassen) the infinitive '{word}' goes to the end of the clause."
        else:
            sp = f" Separable — '{prefix}' goes to the end of the clause." if " ... " in s["ans"] else ""
            expl = f"'{s['ans']}' is the {PERSON_EN[s['p']]} form of '{word}' in the present tense.{sp}"
        ex.append({"exercise_id": f"ex_{wid}_{num}", "word_id": wid, "type": typ, "difficulty": diff,
                   "question": {"de": s["de"], "en": s["en"], "show_english": True},
                   "correct_answer": s["ans"], "wrong_answers": verb_wrongs(s, word, pres, prefix, sep, pp),
                   "explanation_en": expl})
    if vtype in ("strong", "irregular", "mixed"):
        ppn = "Irregular (strong) verb — must be memorised."
    elif prefix and sep:
        ppn = f"Separable verb: {prefix} + ge + stem + -t."
    elif pp.endswith("iert") and not pp.startswith("ge"):
        ppn = "-ieren verb: no ge- in the Partizip II."
    elif not pp.startswith("ge") or word.startswith("ge"):
        ppn = "Inseparable verb — no extra ge-: stem + -t."
    else:
        ppn = "Regular verb: ge- + stem + -t."
    ex.append({"exercise_id": f"{wid}_partizip", "word_id": wid, "type": "partizip_ii", "tense": "perfekt", "difficulty": 2,
               "question": {"de": word, "prompt_en": "Type the Partizip II (past participle)."},
               "correct_answer": pp, "explanation_en": f"The Partizip II of '{word}' is '{pp}'. {ppn}"})
    other = "sein" if aux == "haben" else "haben"
    ex.append({"exercise_id": f"{wid}_aux", "word_id": wid, "type": "auxiliary_choice", "tense": "perfekt", "difficulty": 2,
               "question": {"de": word, "prompt_en": "Which auxiliary verb does this use in Perfekt?"},
               "correct_answer": AUX[aux][2], "wrong_answers": [AUX[other][2]],
               "explanation_en": (f"'{word}' uses 'haben' in the Perfekt." if aux == "haben"
                                  else f"'{word}' uses 'sein' in the Perfekt (movement / change of state).")})
    r = refl or [""] * 6
    def table(tense, forms, diff):
        return {"exercise_id": f"{wid}_table_{tense}", "word_id": wid, "type": "conjugation_table", "tense": tense,
                "difficulty": diff, "question": {"de": word, "tense_label": {"prasens": "Präsens", "prateritum": "Präteritum", "perfekt": "Perfekt"}[tense]},
                "forms": dict(zip(PERSONS, forms))}
    def with_refl(form, i, tail=""):
        parts = [form] + ([r[i]] if r[i] else []) + ([tail] if tail else [])
        return " ".join(parts)
    if is_root:
        ex.append(table("prasens", [with_refl(pres[i], i, prefix if sep else "") for i in range(6)], 2))
    ex.append(table("prateritum", [with_refl(praet[i], i, prefix if sep else "") for i in range(6)], 3))
    ex.append(table("perfekt", [with_refl(AUX[aux][i], i, pp) for i in range(6)], 3))
    return ex


def build_verbs(ids):
    seeds = jload(HERE / "verb-seeds.json")
    verbs = [v for v in jload(D / "verbs.json") if v["id"] not in ids]
    for v in verbs:
        v["prefix_variants"] = [pv for pv in v.get("prefix_variants", []) if pv["id"] not in ids]
    existing = {v["id"] for v in verbs} | {pv["id"] for v in verbs for pv in v.get("prefix_variants", [])}
    by_root = {v["root"]: v for v in verbs}
    rank = max(v["frequency_rank"] for v in verbs)
    new_ids, exercises = [], []
    for s in seeds["roots"]:
        wid = f"verb_{s['root']}"
        assert wid not in existing, f"ID collision {wid}"
        rank += 1
        sep = s["sep"]
        entry = {"id": wid, "root": s["root"], "english": s["english"], "type": s["type"], "frequency_rank": rank,
                 "module": "verbs", "unlock_level": UNLOCK[s["cefr"]],
                 "conjugation": {"present": dict(zip(PERSONS, s["pres"])), "past_participle": s["pp"], "auxiliary": s["aux"]},
                 "prefix_variants": [],
                 "example_sentences": [{"de": fill(x["de"], x["ans"]), "en": x["en"], "exercise_type": ["fill_blank", "translate"]} for x in s["sent"][:2]],
                 "grammar": s["gram"], "tags": s["tags"] + [s["cefr"].lower()] if s["cefr"].lower() not in s["tags"] else s["tags"]}
        if sep:
            entry["separable_root"] = True; entry["prefix"] = sep
        if s.get("standalone"):
            st = s["standalone"]
            entry.update({"standalone_variant": True, "prefix": st["prefix"], "base": st["base"], "separable": st["separable"]})
        verbs.append(entry); new_ids.append(wid)
        exercises += verb_exercises(s["root"], wid, s["english"], s["type"], s["pres"], s["praet"], s["pp"], s["aux"],
                                    sep or "", bool(sep), s["sent"], s["tdist"], s["trans_note"], True, s.get("refl"))
    for a in seeds["attach"]:
        vid = f"verb_{a['word']}"
        assert vid not in existing, f"ID collision {vid}"
        base = by_root[a["base"]]
        bpres = [base["conjugation"]["present"][p] for p in PERSONS]
        vpres = bpres if a["separable"] else [a["prefix"] + f for f in bpres]
        base["prefix_variants"].append({"id": vid, "prefix": a["prefix"], "word": a["word"], "english": a["english"],
                                        "separable": a["separable"], "notes": a["notes"]})
        new_ids.append(vid)
        vtype = "strong" if isinstance(a["praet"], list) else "weak"
        exercises += verb_exercises(a["word"], vid, a["english"], vtype, vpres, a["praet"], a["pp"], a["aux"],
                                    a["prefix"] if a["separable"] else "", a["separable"], a["sent"], a["tdist"], a["notes"], False, None)
    jdump(D / "verbs.json", verbs)
    return new_ids, exercises


# ───────────────────────────── nouns ─────────────────────────────
def build_nouns(ids):
    seeds = jload(HERE / "noun-seeds.json")["nouns"]
    nouns = [n for n in jload(D / "nouns.json") if n["id"] not in ids]
    rank = max(n["frequency_rank"] for n in nouns)
    new_ids, ex = [], []
    for s in seeds:
        nid = f"noun_{translit(s['word'])}"
        assert nid not in {n['id'] for n in nouns}, nid
        rank += 1
        plural = s["word"] if s["plural"] == "—" else s["plural"]
        e = {"id": nid, "word": s["word"], "article": s["article"], "english": s["english"], "plural": plural,
             "plural_article": "die", "genitive": s["genitive"], "frequency_rank": rank, "module": "nouns",
             "unlock_level": UNLOCK[s["cefr"]],
             "example_sentences": [{"de": fill(x["de"], s["word"]), "en": x["en"], "exercise_type": ["fill_blank"]} for x in s["sent"]],
             "tags": s["tags"] + [s["cefr"].lower()], "section": s["section"]}
        if s["plural"] == "—":
            e["plural_note"] = "no plural"
        if s.get("formation"): e["formation"] = s["formation"]
        nouns.append(e); new_ids.append(nid)
        art = s["article"]
        ex.append({"exercise_id": f"ex_{nid}_001", "word_id": nid, "type": "translate_word", "difficulty": 1,
                   "question": {"de": f"{art} {s['word']}", "prompt_en": "What does this word mean?"},
                   "correct_answer": f"the {s['english']}", "wrong_answers": s["tdist"],
                   "explanation_en": f"'{s['word']}' ({art} {s['word']}, plural: {'—' if s['plural'] == '—' else 'die ' + s['plural']}) means '{s['english']}'. {s['note']}".strip()})
        for k, x in enumerate(s["sent"]):
            ex.append({"exercise_id": f"ex_{nid}_00{k + 2}", "word_id": nid, "type": "fill_blank", "difficulty": k + 1,
                       "question": {"de": x["de"], "en": x["en"]}, "correct_answer": s["word"], "wrong_answers": x["wrong"],
                       "explanation_en": f"'{s['word']}' is {'masculine' if art == 'der' else 'feminine' if art == 'die' else 'neuter'} ({art}). "
                                         f"The article/ending before the gap only fits a {'masculine' if art == 'der' else 'feminine' if art == 'die' else 'neuter'} noun — the other options have a different gender."})
    jdump(D / "nouns.json", nouns)
    return new_ids, ex


# ─────────────────────────── adjectives ───────────────────────────
def build_adjectives(ids):
    seeds = jload(HERE / "adjective-seeds.json")["adjectives"]
    cache = tsv("wiktionary-adjectives.tsv")
    adjs = [a for a in jload(D / "adjectives.json") if a["id"] not in ids]
    rank = max(a["frequency_rank"] for a in adjs)
    new_ids, ex = [], []
    for s in seeds:
        aid = f"adj_{translit(s['word'], strip=True)}"
        assert aid not in {a['id'] for a in adjs}, aid
        rank += 1
        comp, sup = cache[s["word"]][1], cache[s["word"]][2]
        e = {"id": aid, "word": s["word"], "english": s["english"],
             "comparative": "" if comp in ("", "—") else comp,
             "superlative": "" if sup in ("", "—") else f"am {sup}",
             "frequency_rank": rank, "module": "adjectives", "unlock_level": UNLOCK[s["cefr"]], "cefr": s["cefr"],
             "example_sentences": [{"de": fill(x["de"], s["word"]), "en": x["en"]} for x in s["sent"]],
             "tags": s["tags"] + [s["cefr"].lower()]}
        if s["antonym"]: e["antonym"] = s["antonym"]
        adjs.append(e); new_ids.append(aid)
        opp = f" Opposite: '{s['antonym']}'." if s["antonym"] else ""
        ex.append({"exercise_id": f"ex_{aid}_001", "word_id": aid, "type": "translate_word", "difficulty": 1,
                   "question": {"de": s["word"], "prompt_en": "WHAT DOES THIS ADJECTIVE MEAN?"},
                   "correct_answer": s["english"], "wrong_answers": s["tdist"],
                   "explanation_en": f"'{s['word']}' means '{s['english']}'.{opp} {s['note']}".strip()})
        ex.append({"exercise_id": f"ex_{aid}_002", "word_id": aid, "type": "fill_blank", "difficulty": 1,
                   "question": {"de": s["sent"][0]["de"], "en": s["sent"][0]["en"]}, "correct_answer": s["word"],
                   "wrong_answers": s["sent"][0]["wrong"], "explanation_en": f"Only '{s['word']}' ({s['english']}) makes sense here."})
        ex.append({"exercise_id": f"ex_{aid}_003", "word_id": aid, "type": "translate_word", "difficulty": 2,
                   "question": {"de": s["english"], "prompt_en": "WHICH GERMAN WORD MEANS THIS?"},
                   "correct_answer": s["word"], "wrong_answers": s["de_wrong"],
                   "explanation_en": f"'{s['english']}' is '{s['word']}' in German."})
        ex.append({"exercise_id": f"ex_{aid}_004", "word_id": aid, "type": "fill_blank", "difficulty": 2,
                   "question": {"de": s["sent"][1]["de"], "en": s["sent"][1]["en"]}, "correct_answer": s["word"],
                   "wrong_answers": s["sent"][1]["wrong"], "explanation_en": f"Only '{s['word']}' ({s['english']}) makes sense here."})
    jdump(D / "adjectives.json", adjs)
    return new_ids, ex


# ───────────────────────────── adverbs ─────────────────────────────
def build_adverbs(ids):
    seeds = jload(HERE / "adverb-seeds.json")["adverbs"]
    advs = [a for a in jload(D / "adverbs.json") if a["id"] not in ids]
    new_ids, ex = [], []
    for s in seeds:
        aid = f"adv_{translit(s['word'])}"
        assert aid not in {a['id'] for a in advs}, aid
        e = {"id": aid, "word": s["word"], "english": s["english"], "category": s["category"], "register": "Neutral",
             "module": "adverbs", "unlock_level": UNLOCK[s["cefr"]], "cefr": s["cefr"],
             "example_sentences": [{"de": fill(s["fill"]["de"], s["word"].capitalize() if s["fill"]["de"].startswith("_____") else s["word"]), "en": s["fill"]["en"], "exercise_type": ["fill_blank"]},
                                   {"de": s["sentence"]["de"], "en": s["sentence"]["en"], "exercise_type": ["translate_word"]}],
             "tags": s["tags"] + [s["cefr"].lower()]}
        advs.append(e); new_ids.append(aid)
        initial = s["fill"]["de"].startswith("_____")
        ans = s["word"].capitalize() if initial else s["word"]
        ex.append({"exercise_id": f"ex_{aid}_001", "word_id": aid, "type": "translate_word", "difficulty": 1,
                   "question": {"de": s["word"], "prompt_en": "WHAT DOES THIS ADVERB MEAN?"},
                   "correct_answer": s["english"], "wrong_answers": s["tdist"],
                   "explanation_en": f"'{s['word']}' means '{s['english']}'. {s['note']}"})
        ex.append({"exercise_id": f"ex_{aid}_002", "word_id": aid, "type": "fill_blank", "difficulty": 2,
                   "question": {"de": s["fill"]["de"], "en": s["fill"]["en"]}, "correct_answer": ans,
                   "wrong_answers": s["fill"]["wrong"], "explanation_en": f"Only '{s['word']}' ({s['english']}) fits the grammar here. {s['note']}"})
        ex.append({"exercise_id": f"ex_{aid}_003", "word_id": aid, "type": "translate_word", "difficulty": 2,
                   "question": {"de": s["english"], "prompt_en": "WIE SAGT MAN DAS AUF DEUTSCH?"},
                   "correct_answer": s["word"], "wrong_answers": s["de_wrong"],
                   "explanation_en": f"'{s['english']}' is '{s['word']}' in German."})
        ex.append({"exercise_id": f"ex_{aid}_004", "word_id": aid, "type": "translate_word", "difficulty": 3,
                   "question": {"de": s["sentence"]["de"], "prompt_en": "WHAT DOES THIS SENTENCE MEAN?"},
                   "correct_answer": s["sentence"]["en"], "wrong_answers": s["sentence"]["wrong"],
                   "explanation_en": f"'{s['sentence']['de']}' = '{s['sentence']['en']}'"})
    jdump(D / "adverbs.json", advs)
    # Adverb Wiktionary cache rows (the adverb distractor validator reads synonyms from it)
    cache_p = ROOT / "_factory" / "adverb-scales" / "wiktionary-cache.tsv"
    lines = cache_p.read_text(encoding="utf-8").splitlines()
    have = {l.split("\t")[0] for l in lines if l and not l.startswith("#")}
    words = {a["word"] for a in advs}
    for w, row in jload(HERE / "adverb-wiktionary.json").items():
        if w.startswith("_") or w in have: continue
        syn = ",".join(x for x in row["syn"] if x in words)
        geg = ",".join(x for x in row["geg"] if x in words)
        lines.append("\t".join([w, "1", "1", row["wa"], row["bed"].replace("\t", " "), syn, geg]))
    cache_p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return new_ids, ex


# ─────────────────────────── expressions ───────────────────────────
def build_expressions(ids):
    seeds = jload(HERE / "expression-seeds.json")["expressions"]
    exprs = [e for e in jload(D / "expressions.json") if e["id"] not in ids]
    new_ids, ex = [], []
    for s in seeds:
        assert s["id"] not in {e['id'] for e in exprs}, s["id"]
        exprs.append({"id": s["id"], "expression": s["expression"], "english": s["english"], "literal": s["literal"],
                      "register": s["register"], "situation_en": s["situation_en"], "example_sentences": s["examples"],
                      "notes": s["notes"], "related": s["related"]})
        new_ids.append(s["id"])
        i = s["id"]
        ex.append({"exercise_id": f"ex_{i}_001", "word_id": i, "type": "translate_word", "difficulty": 1,
                   "question": {"de": s["expression"], "prompt_en": "WHAT DOES THIS EXPRESSION MEAN?"},
                   "correct_answer": s["english"], "wrong_answers": s["tdist"],
                   "explanation_en": f"'{s['expression']}' = '{s['english']}'. {s['notes']}"})
        for num, key, diff in (("002", "f1", 2), ("004", "f2", 2)):
            f = s[key]
            ex.append({"exercise_id": f"ex_{i}_{num}", "word_id": i, "type": "fill_blank", "difficulty": diff,
                       "question": {"de": f["de"], "en": next(x["en"] for x in s["examples"] if x["de"] == fill(f["de"], f["ans"]))},
                       "correct_answer": f["ans"], "wrong_answers": f["wrong"],
                       "explanation_en": f"The fixed pattern is '{s['expression']}'. {s['notes']}"})
        ex.insert(len(ex) - 1, {"exercise_id": f"ex_{i}_003", "word_id": i, "type": "translate_word", "difficulty": 2,
                                "question": {"de": s["sit"]["de"], "prompt_en": "WHICH EXPRESSION FITS THIS SITUATION?"},
                                "correct_answer": s["sit"]["ans"], "wrong_answers": s["sit"]["wrong"],
                                "explanation_en": f"{s['situation_en']} → '{s['expression']}'."})
    jdump(D / "expressions.json", exprs)
    return new_ids, ex


# ─────────────────────── Verben mit Präposition ───────────────────────
def bans_for(pair, ev):
    b = set(pair["extra_bans"]) | {pair["prep"]}
    for src in ("wiktionary", "dwds"):
        row = ev[src].get(pair["ev"])
        if row is not None:
            b |= set((row[1] if src == "wiktionary" else row).keys())
    return b


def build_verb_prepositions(ids):
    seeds = jload(HERE / "verb-preposition-seeds.json")["pairs"]
    ev = jload(HERE / "valency-evidence.json")
    data, ex = [], []
    for s in seeds:
        vid = f"vp_{s['slug']}"
        bans = bans_for(s, ev)
        data.append({"id": vid, "verb": s["verb"], "display": s["display"], "preposition": s["prep"], "case": s["case"],
                     "da_form": s["daform"], "english": s["english"], "cefr": s["cefr"], "notes": s["note"],
                     "example_sentences": [{"de": fill(s[k]["de"], s["prep"]), "en": s[k]["en"]} for k in ("p1", "p2")]
                                          + ([{"de": fill(s["dasent"]["de"], s["daform"]), "en": s["dasent"]["en"]}] if s["dasent"] else [])})
        for n, k in ((1, "p1"), (2, "p2")):
            nxt = s[k]["de"].split("_____", 1)[1].split()[0].strip(".,!?").lower()
            if nxt in NOT_DAT:
                pool, objcase = DAT_ONLY, "Akkusativ"
            elif nxt in NOT_AKK:
                pool, objcase = AKK_ONLY, "Dativ"
            else:
                raise SystemExit(f"{vid} {k}: word after the gap ('{nxt}') does not show its case")
            wrong = [p for p in pool if p not in bans][:3]
            assert len(wrong) == 3, f"{vid} {k}: only {wrong}"
            other = "Dativ" if objcase == "Akkusativ" else "Akkusativ"
            ex.append({"exercise_id": f"ex_{vid}_{n}", "prep_id": PREP_ID[s["prep"]], "vp_id": vid, "type": "select_preposition",
                       "difficulty": s["cefr"], "question": {"de": s[k]["de"], "en": s[k]["en"]},
                       "correct_answer": s["prep"], "wrong_answers": wrong,
                       "explanation_en": f"{s['display']} — always {s['prep']} + {s['case']}. "
                                         f"{', '.join(wrong)} need the {other}, but '{nxt}' here is {objcase}. {s['note']}"})
        if s["dasent"]:
            da = s["daform"]
            wrong = [d for d in DA_PURE if d != da and DA_OF[d] not in bans][:3]
            assert len(wrong) == 3, f"{vid} da: only {wrong}"
            ex.append({"exercise_id": f"ex_{vid}_da", "prep_id": PREP_ID[s["prep"]], "vp_id": vid, "type": "select_preposition",
                       "difficulty": s["cefr"], "question": {"de": s["dasent"]["de"], "en": s["dasent"]["en"]},
                       "correct_answer": da, "wrong_answers": wrong,
                       "explanation_en": f"{s['display']}: '{s['prep']} + it/that' becomes {da} (da- + {s['prep']}"
                                         f"{', with -r- before a vowel' if da.startswith('dar') else ''}). The verb decides which da-word you need."})
        if s["cs"]:
            other = "Dativ" if s["case"] == "Akkusativ" else "Akkusativ"
            ex.append({"exercise_id": f"ex_{vid}_case", "prep_id": PREP_ID[s["prep"]], "vp_id": vid, "type": "select_case",
                       "difficulty": s["cefr"], "question": {"de": s["cs"]["de"], "en": s["cs"]["en"], "highlight": s["cs"]["hl"]},
                       "correct_answer": s["case"], "wrong_answers": [other, "Nominativ", "Genitiv"],
                       "explanation_en": f"'{s['prep']}' is a two-way preposition, but in '{s['display']}' the verb fixes the case: always {s['case']}."})
    jdump(D / "verb-prepositions.json", data)
    return [d["id"] for d in data], ex


def merge_ex(fname, prev_ids, new):
    p = EX / fname
    cur = [e for e in jload(p) if e.get("exercise_id") not in prev_ids]
    have = {e.get("exercise_id") for e in cur}
    for e in new:
        assert e["exercise_id"] not in have, f"exercise id collision {e['exercise_id']}"
    jdump(p, cur + new)
    return len(new)


def main():
    gen_p = HERE / "generated-ids.json"
    prev = jload(gen_p) if gen_p.exists() else {"words": [], "exercises": []}
    bk = HERE / "backups"
    if not bk.exists():
        bk.mkdir()
        for f in ["verbs", "nouns", "adjectives", "adverbs", "expressions"]:
            shutil.copy(D / f"{f}.json", bk / f"{f}.json")
        for f in ["verbs", "nouns", "adjectives", "adverbs", "expressions", "prepositions"]:
            shutil.copy(EX / f"exercises-{f}.json", bk / f"exercises-{f}.json")
        shutil.copy(ROOT / "_factory/adverb-scales/wiktionary-cache.tsv", bk / "adverb-wiktionary-cache.tsv")
    pw, pe = set(prev["words"]), set(prev["exercises"])
    report, all_words, all_ex = [], [], []
    for name, fn, fname in [("verbs", build_verbs, "exercises-verbs.json"), ("nouns", build_nouns, "exercises-nouns.json"),
                            ("adjectives", build_adjectives, "exercises-adjectives.json"), ("adverbs", build_adverbs, "exercises-adverbs.json"),
                            ("expressions", build_expressions, "exercises-expressions.json"),
                            ("verb-prepositions", build_verb_prepositions, "exercises-prepositions.json")]:
        w, e = fn(pw)
        merge_ex(fname, pe, e)
        all_words += w; all_ex += [x["exercise_id"] for x in e]
        report.append(f"| {name} | {len(w)} | {len(e)} |")
    jdump(gen_p, {"words": all_words, "exercises": all_ex})
    (HERE / "report.md").write_text("# Bilder-Intake 2026-11-09 — generated\n\n| set | words | exercises |\n|---|---|---|\n"
                                    + "\n".join(report) + f"\n| **total** | **{len(all_words)}** | **{len(all_ex)}** |\n", encoding="utf-8")
    print("\n".join(report)); print(f"total words {len(all_words)}, exercises {len(all_ex)}")


if __name__ == "__main__":
    main()
