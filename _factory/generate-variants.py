#!/usr/bin/env python3
"""
generate-variants.py — Vorsilben ↔ Verbs reconciliation (Session 38, v16)

Adds the 133 prefix verbs from the Vorsilben module whose ROOT already exists
in data/verbs.json, as `prefix_variants` under that root, with the full
8-exercise package each (1,064 exercises).

Nothing linguistic is invented at generation time:
  - Partizip II is DERIVED     (separable: prefix + root participle;
                                inseparable: prefix + root participle minus "ge")
  - Präsens / Präteritum are LIFTED from the root's existing conjugation tables
  - Perfekt is BUILT from the seeded auxiliary + derived participle
  - Separability, auxiliary, case and the two example complements are AUTHORED
    in _factory/vorsilben/variant-seeds-*.json, with every judgement call
    flagged for review.

Writes:
  data/verbs.json                          (in place, +133 prefix_variants)
  data/exercises/exercises-verbs.json      (in place, +1064 exercises)
  _factory/vorsilben/judgement-review.md   (every authored call, for Ricco)

Run:  python3 _factory/generate-variants.py
Then: python3 _factory/validate-variants.py   (must report 0 errors)
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERBS = ROOT / "data" / "verbs.json"
VEXER = ROOT / "data" / "exercises" / "exercises-verbs.json"
SEEDS = sorted((ROOT / "_factory" / "vorsilben").glob("variant-seeds-*.json"))
PREFIXES = ROOT / "data" / "prefixes.json"
REVIEW = ROOT / "_factory" / "vorsilben" / "judgement-review.md"

PRONOUNS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
AUX_FORMS = {
    "hat": {"ich": "habe", "du": "hast", "er_sie_es": "hat",
            "wir": "haben", "ihr": "habt", "sie_Sie": "haben"},
    "ist": {"ich": "bin", "du": "bist", "er_sie_es": "ist",
            "wir": "sind", "ihr": "seid", "sie_Sie": "sind"},
}


def clean_en(phrase):
    """Strip dictionary scaffolding so a gloss can sit inside a sentence.

    'to teach sb sth' -> 'to teach', 'to drive around (avoid)' -> 'to drive around'.
    Placeholders and parentheticals belong on a dictionary card, not in
    'I have to teach sb sth him German.'
    """
    v = re.sub(r"\([^)]*\)", "", phrase)
    v = re.sub(r"\b(sth|sb|somebody|someone|something)\b", "", v)
    return re.sub(r"\s{2,}", " ", v).strip(" .,;")


def third_person_en(phrase):
    """'to cancel' -> 'cancels'. Handles the endings that actually occur here."""
    v = clean_en(phrase.split(";")[0].split(",")[0])
    if v.startswith("to "):
        v = v[3:]
    head, _, rest = v.partition(" ")
    if re.search(r"(s|sh|ch|x|z|o)$", head):
        head += "es"
    elif re.search(r"[^aeiou]y$", head):
        head = head[:-1] + "ies"
    else:
        head += "s"
    return (head + (" " + rest if rest else "")).strip()


def bare_en(phrase):
    v = clean_en(phrase.split(";")[0].split(",")[0])
    return v[3:] if v.startswith("to ") else v


def derive_participle(prefix, root_part, separable):
    if separable:
        return prefix + root_part
    return prefix + (root_part[2:] if root_part.startswith("ge") else root_part)


def split_form(form, prefix, separable):
    """Present/past form as it appears in a main clause."""
    return f"{form} {prefix}" if separable else prefix + form


def override_section(verbs, seeded):
    """Pre-existing variants (not from these seeds) whose case diverges from the root.

    Recomputed from the data every run rather than hand-maintained, so it cannot
    drift from what verbs.json actually says.
    """
    rows = []
    for r in verbs:
        root_case = "/".join((r.get("grammar") or {}).get("case_requirements") or []) or "none"
        for pv in r.get("prefix_variants", []):
            if pv["word"] in seeded:
                continue
            own = (pv.get("grammar") or {}).get("case_requirements")
            if not own:
                continue
            own_s = "/".join(own) or "none"
            if own_s != root_case:
                rows.append((pv["word"], r["root"], root_case, own_s,
                             (pv.get("grammar") or {}).get("notes_en", "")))
    rows.sort()
    if not rows:
        return ""
    return ("\n---\n\n## Pre-existing variants given a case override\n\n"
            "These were already in `verbs.json` and inherited their case from the root, "
            "which is what produced the `verstehen` case-badge bug. Recomputed from "
            "`verbs.json` on every run.\n\n"
            f"**{len(rows)} overrides.**\n\n"
            "| Verb | Root | Root case | Variant case | Note |\n|---|---|---|---|---|\n"
            + "\n".join(f"| `{w}` | {r} | {rc} | {vc} | {n} |" for w, r, rc, vc, n in rows) + "\n")


def main():
    verbs = json.loads(VERBS.read_text(encoding="utf-8"))
    exercises = json.loads(VEXER.read_text(encoding="utf-8"))
    prefixes = json.loads(PREFIXES.read_text(encoding="utf-8"))

    seeds = []
    for f in SEEDS:
        seeds += json.loads(f.read_text(encoding="utf-8"))

    by_root = {v["root"]: v for v in verbs}

    # root conjugation tables, lifted from the existing exercise set
    tables = {}
    for e in exercises:
        if e["type"] == "conjugation_table":
            tables.setdefault(e.get("word_id", ""), {})[e["tense"]] = e["forms"]

    # map each seeded word back to its prefix entry in the Vorsilben data
    meta = {}
    for p in prefixes:
        for ex in p["examples"]:
            meta.setdefault(ex["lemma"], (p, ex))

    existing_words = {v["root"] for v in verbs}
    for v in verbs:
        for pv in v.get("prefix_variants", []):
            existing_words.add(pv["word"])

    new_exercises = []
    review_rows = []
    added = 0

    for s in sorted(seeds, key=lambda x: x["w"]):
        word = s["w"]
        if word in existing_words:
            print(f"  skip (already present): {word}")
            continue

        p, ex = meta[word]
        prefix = p["prefix"].rstrip("-")
        root_name = ex["root"]
        root = by_root[root_name]
        vid = "verb_" + word
        sep = s["sep"]
        aux = s["aux"]
        english = s.get("english") or ex["english"]  # seed gloss wins: pins the filed reading

        root_part = root["conjugation"]["past_participle"]
        participle = derive_participle(prefix, root_part, sep)
        pres_root = root["conjugation"]["present"]
        prat_root = tables["verb_" + root_name]["prateritum"]

        # ---- variant record ----------------------------------------------
        record = {
            "id": vid,
            "prefix": prefix,
            "word": word,
            "english": english,
            "separable": sep,
            "notes": s.get("note") or (
                f"Prefix separates in main clause: Ich {pres_root['ich']} … {prefix}."
                if sep else
                f"Inseparable: the prefix stays attached — 'Ich {prefix}{pres_root['ich']}.'"
            ),
        }
        # Per-variant grammar override — only where it diverges from the root.
        root_case = (root.get("grammar") or {}).get("case_requirements")
        if s.get("case") and s["case"] != root_case:
            record["grammar"] = {
                "case_requirements": s["case"],
                "notes_en": s.get("judgement", ""),
            }

        root.setdefault("prefix_variants", []).append(record)
        added += 1

        # ---- exercises ----------------------------------------------------
        en3 = third_person_en(english)
        enb = bare_en(english)
        sep_note = (f"Separable: the prefix '{prefix}' detaches — "
                    f"'Ich {pres_root['ich']} … {prefix}.'"
                    if sep else
                    f"Inseparable: '{prefix}' never detaches, and the Partizip II takes no 'ge-'.")

        # 1 translate_word — distractors are sibling variants' meanings
        siblings = [pv["english"] for pv in root.get("prefix_variants", [])
                    if pv["word"] != word]
        pool = siblings + [root["english"]]
        wrong = []
        for cand in pool:
            if cand != english and cand not in wrong:
                wrong.append(cand)
            if len(wrong) == 4:
                break
        for other in meta:
            if len(wrong) == 4:
                break
            oe = meta[other][1]["english"]
            if oe != english and oe not in wrong:
                wrong.append(oe)
        new_exercises.append({
            "exercise_id": f"ex_{vid}_001", "word_id": vid, "type": "translate_word",
            "difficulty": 1,
            "question": {"de": word, "prompt_en": "What does this verb mean?"},
            "correct_answer": english, "wrong_answers": wrong[:4],
            "explanation_en": f"'{word}' means '{english}'. {sep_note}",
        })

        # 2–3 fill_blank — infinitive at the end of a modal clause
        for i, key in enumerate(("c1", "c2"), start=2):
            de_c, en_c = s[key]
            stem = "Ich muss" if i == 2 else "Wir wollen"
            stem_en = "I have to" if i == 2 else "We want to"
            fb_wrong = []
            for pv in root.get("prefix_variants", []):
                if pv["word"] != word and pv["word"] not in fb_wrong:
                    fb_wrong.append(pv["word"])
                if len(fb_wrong) == 3:
                    break
            fb_wrong.append(root_name)
            new_exercises.append({
                "exercise_id": f"ex_{vid}_{i:03d}", "word_id": vid, "type": "fill_blank",
                "difficulty": 1,
                "question": {"de": f"{stem} {de_c} _____.",
                             "en": f"{stem_en} {enb} {en_c}.", "show_english": True},
                "correct_answer": word, "wrong_answers": fb_wrong[:4],
                "explanation_en": (
                    f"'{word}' ({english}). After a modal verb the infinitive stays "
                    f"whole at the end of the clause."),
            })

        # 4 conjugation_choice — present tense main clause
        de_c, en_c = s["c2"]
        if sep:
            q_de = f"Er _____ {de_c} {prefix}."
            answer = f"{pres_root['er_sie_es']} ... {prefix}"
            wrongs = [prefix + pres_root["er_sie_es"], pres_root["er_sie_es"],
                      word, f"{prat_root['er_sie_es']} {prefix}"]
            expl = (f"'{word}' is separable. In a present-tense main clause the prefix "
                    f"'{prefix}' goes to the end: 'Er {pres_root['er_sie_es']} {de_c} {prefix}.'")
        else:
            q_de = f"Er _____ {de_c}."
            answer = prefix + pres_root["er_sie_es"]
            wrongs = [f"{pres_root['er_sie_es']} {prefix}", pres_root["er_sie_es"],
                      word, prefix + prat_root["er_sie_es"]]
            expl = (f"'{word}' is inseparable. The prefix stays attached: "
                    f"'Er {prefix}{pres_root['er_sie_es']} {de_c}.'")
        new_exercises.append({
            "exercise_id": f"ex_{vid}_004", "word_id": vid, "type": "conjugation_choice",
            "difficulty": 2,
            "question": {"de": q_de, "en": f"He {en3} {en_c}.", "show_english": True},
            "correct_answer": answer,
            "wrong_answers": [w for w in dict.fromkeys(wrongs) if w != answer][:4],
            "explanation_en": expl,
        })

        # 5 partizip_ii
        new_exercises.append({
            "exercise_id": f"{vid}_partizip", "word_id": vid, "type": "partizip_ii",
            "tense": "perfekt", "difficulty": 2,
            "question": {"de": word, "prompt_en": "Type the Partizip II (past participle)."},
            "correct_answer": participle,
            "explanation_en": (
                f"The Partizip II of '{word}' is '{participle}'. "
                + (f"Separable: the 'ge-' sits between prefix and stem."
                   if sep else
                   f"Inseparable verbs take no 'ge-'.")),
        })

        # 6 auxiliary_choice
        new_exercises.append({
            "exercise_id": f"{vid}_aux", "word_id": vid, "type": "auxiliary_choice",
            "tense": "perfekt", "difficulty": 2,
            "question": {"de": word,
                         "prompt_en": "Which auxiliary verb does this use in Perfekt?"},
            "correct_answer": aux,
            "wrong_answers": ["ist" if aux == "hat" else "hat"],
            "explanation_en": (
                f"'{word}' uses '{'haben' if aux == 'hat' else 'sein'}' in the Perfekt. "
                + ("Verbs of motion and change of state take 'sein'."
                   if aux == "ist" else "Most transitive verbs take 'haben'.")),
        })

        # 7–8 conjugation_table — Präteritum and Perfekt
        new_exercises.append({
            "exercise_id": f"{vid}_table_prateritum", "word_id": vid,
            "type": "conjugation_table", "tense": "prateritum", "difficulty": 3,
            "question": {"de": word, "tense_label": "Präteritum"},
            "forms": {pr: split_form(prat_root[pr], prefix, sep) for pr in PRONOUNS},
        })
        new_exercises.append({
            "exercise_id": f"{vid}_table_perfekt", "word_id": vid,
            "type": "conjugation_table", "tense": "perfekt", "difficulty": 3,
            "question": {"de": word, "tense_label": "Perfekt"},
            "forms": {pr: f"{AUX_FORMS[aux][pr]} {participle}" for pr in PRONOUNS},
        })

    VERBS.write_text(json.dumps(verbs, ensure_ascii=False, indent=2) + "\n",
                     encoding="utf-8")
    VEXER.write_text(json.dumps(exercises + new_exercises, ensure_ascii=False, indent=2) + "\n",
                     encoding="utf-8")

    # Built from ALL seeds — never only the rows this run added. A partial
    # re-run (one corrected verb) must not truncate the review file.
    for s in sorted(seeds, key=lambda x: x["w"]):
        if s.get("judgement"):
            _p, _ex = meta[s["w"]]
            review_rows.append((s["w"], _ex["root"],
                                "separable" if s["sep"] else "inseparable",
                                s["aux"], "/".join(s.get("case") or []), s["judgement"]))
    review_rows.sort()
    REVIEW.write_text(
        "# Vorsilben reconciliation — judgement calls for review\n\n"
        "*Generated by `_factory/generate-variants.py`. Verification status: "
        "`verify-report.md` (Session 39).*\n\n"
        "Every row is a call I made that could not be derived mechanically: "
        "separability for dual-behaviour prefixes, auxiliary where it does not "
        "inherit from the root, and case requirements that diverge from the root.\n\n"
        "> **Not a task for Ricco.** He is a learner, not a German teacher — asking "
        "him to grammar-check the material that teaches him is circular. These rows "
        "are checked against de.wiktionary.org by `_factory/verify-variants.py`; see "
        "`verify-report.md` for the per-verb verdict.\n\n"
        "Partizip II, Präsens, Präteritum and Perfekt are **not** here — those are "
        "derived or lifted, and checked by `validate-variants.py`.\n\n"
        f"**{len(review_rows)} calls.**\n\n"
        "| Verb | Root | Separability | Perfekt | Case | Reasoning |\n"
        "|---|---|---|---|---|---|\n"
        + "\n".join(f"| `{w}` | {r} | {sp} | {a} | {c or '—'} | {j} |"
                    for w, r, sp, a, c, j in review_rows) + "\n"
        + override_section(verbs, {x["w"] for x in seeds}),
        encoding="utf-8")

    print(f"variants added   : {added}")
    print(f"exercises added  : {len(new_exercises)}")
    print(f"judgement calls  : {len(review_rows)} -> {REVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
