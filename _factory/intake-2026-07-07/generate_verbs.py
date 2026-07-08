#!/usr/bin/env python3
"""Verb intake generator — expands seed files into app entries + exercises.
Usage: python3 generate_verbs.py  (run from repo root or intake dir; paths resolved relative to this file)
Outputs: temp-verbs-new.json (root entries), temp-verbs-attach.json (variant records per base root),
         temp-exercises-verbs.json (all new exercises)
"""
import json, os, sys, copy

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
PERSONS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
PERSON_EN = {"ich": "first person singular (ich)", "du": "second person singular (du)",
             "er_sie_es": "third person singular (er/sie/es)", "wir": "first person plural (wir)",
             "ihr": "second person plural (ihr)", "sie_Sie": "third person plural / formal (sie/Sie)"}
AUX_FORMS = {"haben": ["habe", "hast", "hat", "haben", "habt", "haben"],
             "sein": ["bin", "bist", "ist", "sind", "seid", "sind"]}
REFL = {"wohlfühlen": ["mich", "dich", "sich", "uns", "euch", "sich"]}

def expand_praet(praet):
    if isinstance(praet, list):
        return praet
    t = praet  # regular '-te' ich-form
    return [t, t + "st", t, t + "n", t + "t", t + "n"]

def fill_sentence(de, ans):
    parts = ans.split(" ... ")
    out = de
    for part in parts:
        out = out.replace("_____", part, 1)
    return out

def joined(form, prefix, sep):
    """Display form of a conjugated verb with prefix placement."""
    if sep and prefix:
        return f"{form} {prefix}"
    return form

def make_distractors(ans, person, word, pres, praet, prefix, sep, pp, base_inf):
    """4 wrong answers for fill_blank/conjugation_choice."""
    if person == "inf":
        er = joined(pres[2], prefix, sep)
        praet_ich = joined(praet[0], prefix, sep)
        ich = joined(pres[0], prefix, sep)
        du = joined(pres[1], prefix, sep)
        opts = [pp, er, praet_ich, base_inf, ich, du, joined(praet[3], prefix, sep)]
        out, seen = [], {ans}
        for o in opts:
            if o not in seen:
                out.append(o); seen.add(o)
        return out[:4]
    pi = PERSONS.index(person)
    if sep and " ... " in ans:
        # pattern from existing content: unseparated, bare form, infinitive, praeteritum+prefix
        form = pres[pi]
        cand = [prefix + form, form, word, f"{praet[pi]} {prefix}"]
    else:
        cand = []
        for j in [1, 2, 0, 3, 4, 5]:  # other persons
            f = joined(pres[j], prefix, sep) if False else pres[j]
            if j != pi and f != (ans if not sep else pres[pi]):
                cand.append(f)
        cand = cand[:3] + [praet[pi]]
    out, seen = [], {ans, ans.capitalize(), ans.lower()}
    for c in cand:
        if c not in seen and c.capitalize() != ans and c.lower() != ans.lower():
            out.append(c); seen.add(c)
    # top up from praet other persons if dedupe removed some
    k = 0
    while len(out) < 4 and k < 6:
        f = praet[k]
        if f not in seen:
            out.append(f); seen.add(f)
        k += 1
    return out[:4]

def pp_note(vtype, prefix, sep):
    if vtype == "mixed":
        return "Mixed verb — stem change with a weak -t ending."
    if vtype != "weak":
        return "Irregular — must be memorised."
    if prefix and sep:
        return f"Separable verb: {prefix} + ge + stem + -t."
    if prefix and not sep:
        return "Inseparable prefix verb — no ge-: stem + -t."
    return "Regular verb: ge- + stem + -t."

def aux_expl(word, aux):
    if aux == "haben":
        return f"'{word}' uses 'haben' in the Perfekt. Most transitive verbs take 'haben'."
    return f"'{word}' uses 'sein' in the Perfekt (motion / change of state)."

def gen_exercises(word, wid, english, vtype, pres, praet, pp, aux, prefix, sep, sent, tdist, trans_note, is_root):
    ex = []
    praet = expand_praet(praet)
    base_inf = word[len(prefix):] if (prefix and sep and word.startswith(prefix)) else (word[len(prefix):] if prefix and word.startswith(prefix) else word)
    # 001 translate_word
    ex.append({"exercise_id": f"ex_{wid}_001", "word_id": wid, "type": "translate_word", "difficulty": 1,
               "question": {"de": word, "prompt_en": "What does this verb mean?"},
               "correct_answer": english, "wrong_answers": tdist,
               "explanation_en": f"'{word}' means '{english}'. {trans_note}".strip()})
    # 002 + 004 fill_blank from sent[0], sent[1]; 003 conjugation_choice from sent[2]
    for n, (i, typ, diff) in enumerate([(0, "fill_blank", 1), (2, "conjugation_choice", 2), (1, "fill_blank", 1)]):
        s = sent[i]
        num = ["002", "003", "004"][n]
        wrongs = make_distractors(s["ans"], s["p"], word, pres, praet, prefix, sep, pp, base_inf)
        if s["p"] == "inf":
            expl = f"With a modal or auxiliary construction, the infinitive '{word}' goes to the end of the sentence."
        else:
            sep_note = f" Separable — '{prefix}' goes to the end of the clause." if (sep and prefix and " ... " in s["ans"]) else ""
            expl = f"'{s['ans']}' is the {PERSON_EN[s['p']]} present-tense form of '{word}'.{sep_note}"
        ex.append({"exercise_id": f"ex_{wid}_{num}", "word_id": wid, "type": typ, "difficulty": diff,
                   "question": {"de": s["de"], "en": s["en"], "show_english": True},
                   "correct_answer": s["ans"], "wrong_answers": wrongs, "explanation_en": expl})
    # partizip_ii
    ex.append({"exercise_id": f"{wid}_partizip", "word_id": wid, "type": "partizip_ii", "tense": "perfekt", "difficulty": 2,
               "question": {"de": word, "prompt_en": "Type the Partizip II (past participle)."},
               "correct_answer": pp,
               "explanation_en": f"The Partizip II of '{word}' is '{pp}'. {pp_note(vtype, prefix, sep)}"})
    # auxiliary_choice
    ex.append({"exercise_id": f"{wid}_aux", "word_id": wid, "type": "auxiliary_choice", "tense": "perfekt", "difficulty": 2,
               "question": {"de": word, "prompt_en": "Which auxiliary verb does this use in Perfekt?"},
               "correct_answer": AUX_FORMS[aux][2], "wrong_answers": [AUX_FORMS["sein" if aux == "haben" else "haben"][2]],
               "explanation_en": aux_expl(word, aux)})
    # conjugation tables
    refl = REFL.get(word)
    def table(tense, forms, diff):
        return {"exercise_id": f"{wid}_table_{tense}", "word_id": wid, "type": "conjugation_table",
                "tense": tense, "difficulty": diff,
                "question": {"de": word, "tense_label": {"prasens": "Präsens", "prateritum": "Präteritum", "perfekt": "Perfekt"}[tense]},
                "forms": dict(zip(PERSONS, forms))}
    if is_root:
        pres_forms = [joined(f, prefix, sep) for f in pres]
        ex.append(table("prasens", pres_forms, 2))
    if refl:
        prat_forms = [f"{praet[i]} {refl[i]} {prefix}" for i in range(6)]
        perf_forms = [f"{AUX_FORMS[aux][i]} {refl[i]} {pp}" for i in range(6)]
    else:
        prat_forms = [joined(praet[i], prefix, sep) for i in range(6)]
        perf_forms = [f"{AUX_FORMS[aux][i]} {pp}" for i in range(6)]
    ex.append(table("prateritum", prat_forms, 3))
    ex.append(table("perfekt", perf_forms, 3))
    return ex

def main():
    seeds = []
    for f in ["verb-seeds-1.json", "verb-seeds-2.json"]:
        seeds += json.load(open(os.path.join(HERE, f), encoding="utf-8"))["roots"]
    attach = json.load(open(os.path.join(HERE, "verb-seeds-attach.json"), encoding="utf-8"))["attach"]
    existing = json.load(open(os.path.join(REPO, "data", "verbs.json"), encoding="utf-8"))
    existing_ids = {e["id"] for e in existing} | {pv["id"] for e in existing for pv in e.get("prefix_variants", [])}
    by_root = {e["root"]: e for e in existing}

    new_entries, attach_records, exercises = [], {}, []

    for s in seeds:
        wid = f"verb_{s['root']}"
        assert wid not in existing_ids, f"ID collision: {wid}"
        variants = []
        for v in s.get("variants", []):
            vid = f"verb_{v['word']}"
            assert vid not in existing_ids, f"ID collision: {vid}"
            variants.append({"id": vid, "prefix": v["prefix"], "word": v["word"],
                             "english": v["english"], "separable": v["separable"], "notes": v["notes"]})
            # variant present forms derive from root seed pres
            if v["separable"]:
                vpres = s["pres"]
            else:
                vpres = [v["prefix"] + f for f in s["pres"]]
            vtype = "strong" if isinstance(v["praet"], list) else "weak"
            exercises.extend(gen_exercises(v["word"], vid, v["english"], vtype,
                                           vpres, v["praet"], v["pp"], v["aux"], v["prefix"], v["separable"],
                                           v["sent"], v["tdist"], v["notes"], is_root=False))
        entry = {"id": wid, "root": s["root"], "english": s["english"], "type": s["type"],
                 "frequency_rank": s["freq"], "module": "verbs", "unlock_level": s["unlock"],
                 "conjugation": {"present": dict(zip(PERSONS, [joined(f, s["sep"], bool(s["sep"])) for f in s["pres"]])) if False else dict(zip(PERSONS, s["pres"])),
                                 "past_participle": s["pp"], "auxiliary": s["aux"]},
                 "prefix_variants": variants,
                 "example_sentences": [{"de": fill_sentence(x["de"], x["ans"]), "en": x["en"],
                                        "exercise_type": ["fill_blank", "translate"]} for x in s["sent"][:2]],
                 "grammar": {"transitivity": s["gram"]["transitivity"], "case_requirements": s["gram"]["case_requirements"],
                             "notes_en": s["gram"]["notes_en"], "dual_case": s["gram"]["dual_case"]},
                 "tags": s["tags"]}
        if s["sep"]:
            entry["separable_root"] = True
            entry["prefix"] = s["sep"]
        new_entries.append(entry)
        exercises.extend(gen_exercises(s["root"], wid, s["english"], s["type"], s["pres"], s["praet"],
                                       s["pp"], s["aux"], s["sep"] or "", bool(s["sep"]), s["sent"],
                                       s["tdist"], s["trans_note"], is_root=True))

    for v in attach:
        vid = f"verb_{v['word']}"
        assert vid not in existing_ids, f"ID collision: {vid}"
        base = by_root.get(v["base"])
        assert base, f"Base root not found: {v['base']}"
        bpres = [base["conjugation"]["present"][p] for p in PERSONS]
        vpres = bpres if v["separable"] else [v["prefix"] + f for f in bpres]
        # for insep attach whose praet is regular string derived from full variant (e.g. 'veränderte'), keep as-is
        rec = {"id": vid, "prefix": v["prefix"], "word": v["word"], "english": v["english"],
               "separable": v["separable"], "notes": v["notes"]}
        attach_records.setdefault(v["base"], []).append(rec)
        vtype = "strong" if isinstance(v["praet"], list) else "weak"
        praet = v["praet"]
        if not v["separable"] and isinstance(praet, str) and not praet.startswith(v["prefix"]):
            praet = v["prefix"] + praet  # e.g. ver + änderte — only if seed gave base form
        exercises.extend(gen_exercises(v["word"], vid, v["english"], vtype, vpres, praet, v["pp"], v["aux"],
                                       v["prefix"], v["separable"], v["sent"], v["tdist"], v["notes"], is_root=False))

    json.dump(new_entries, open(os.path.join(HERE, "temp-verbs-new.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(attach_records, open(os.path.join(HERE, "temp-verbs-attach.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(exercises, open(os.path.join(HERE, "temp-exercises-verbs.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    n_words = len(new_entries) + sum(len(v) for v in attach_records.values()) + sum(len(e["prefix_variants"]) for e in new_entries)
    print(f"roots: {len(new_entries)}, attach variants: {sum(len(v) for v in attach_records.values())}, "
          f"new-root variants: {sum(len(e['prefix_variants']) for e in new_entries)}, "
          f"total words: {n_words}, exercises: {len(exercises)}")

if __name__ == "__main__":
    main()
