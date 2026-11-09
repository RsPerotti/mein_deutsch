#!/usr/bin/env python3
"""
validate.py — Session 44 Bilder-Intake. Independent check of everything generate.py wrote.

Written from PRD_Bilder_Intake.md, NOT from generate.py, and never imports it: it holds its own
copies of the grammar rules, case tables, synonym clusters and da-word rule, so a bug in the
generator cannot pass silently. It reads the generated DATA (data/*.json), not the seeds,
except for the id manifest and the external caches. Mutation-tested by verify-validator.py.

  V1  verb forms agree with de.wiktionary (Präsens ich/du/er, Präteritum ich, Partizip II, Hilfsverb)
  V2  conjugation tables equal an independent derivation (Präsens / Präteritum / Perfekt)
  V3  verb gap-fills: no wrong option is the right form for that subject, nor a Präteritum form
      (a past form would be grammatical), nor the infinitive in an infinitive slot
  V4  no verb gap right after 'Sie'/'sie' (subject ambiguous: she / they / you)
  V5  exercise package per verb: roots 9, attached variants 8; Stammverben rule for new roots
  N1  noun gap-fills: the determiner before the gap fits the answer's gender and NO distractor's
  N2  noun article / plural / genitive agree with de.wiktionary
  A1  adjective comparative agrees with de.wiktionary (blank where Wiktionary has none)
  S1  no option shares a synonym cluster with the answer (all German-option exercises)
  S2  DE→EN: no wrong gloss is the English of a word in the answer's synonym cluster
  F1  every filled gap sentence appears in the word's example sentences
  P1  each taught verb+preposition is attested (de.wiktionary or DWDS valency evidence)
  P2  no preposition distractor is one the verb is attested with (or authored-banned)
  P3  case clash: the word after the gap is unambiguously Akk or Dat; every distractor governs
      only the OTHER case; the answer governs the pair's case
  P4  da-words derived independently (da + prep, dar- before a vowel); no distractor's preposition
      is attested for the verb; no temporal/causal da-adverbs as distractors
  P5  select_case: highlight starts with the preposition and its determiner shows the answer's case
  G1  option hygiene: 3 distinct wrong options (1 for auxiliary), answer not among them,
      capitalisation of options matches the answer
  G2  exercise ids unique across ALL exercise files; every new exercise has an owner
  G3  js/data.js equals data/*.json for every touched key (incl. verb_prepositions)
  G4  every new exercise type is served by the Main engine (no new engine — see PRD)

Run: python3 _factory/bilder-intake-2026-11-09/validate.py [--root PATH]   (exit 1 on failure)
"""
import argparse, json, re, sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent.parent)
ROOT = ap.parse_args().root
HERE = ROOT / "_factory" / "bilder-intake-2026-11-09"
load = lambda p: json.loads((ROOT / p).read_text(encoding="utf-8"))
errors = []
def err(code, msg): errors.append(f"[{code}] {msg}")

def tsv(name):
    out = {}
    for line in (HERE / name).read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            c = line.split("\t"); out[c[0]] = c[1:]
    return out

# ── own tables ─────────────────────────────────────────────────────────────
PERS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"]
HABEN = ["habe", "hast", "hat", "haben", "habt", "haben"]
SEIN = ["bin", "bist", "ist", "sind", "seid", "sind"]
ALWAYS_REFLEXIVE = {"gedulden": ["mich", "dich", "sich", "uns", "euch", "sich"]}
SEP_PARTICLES = ["voraus", "heraus", "vorbei", "nach", "aus", "ein", "an", "vor"]
AKK_PREPS = {"für", "durch", "gegen", "ohne", "um"}
DAT_PREPS = {"mit", "nach", "von", "zu", "bei", "aus", "seit"}
TWO_WAY = {"an", "auf", "in", "über", "unter", "vor", "hinter", "neben", "zwischen"}
AKK_MARK = {"einen", "das", "ein", "mein", "dein", "sein", "kein", "dieses", "die", "eine", "meine", "deine", "seine",
            "ihre", "keine", "diese", "mich", "dich", "ihn"}
DAT_MARK = {"dem", "einem", "meinem", "deinem", "seinem", "ihrem", "unserem", "keinem", "diesem", "der", "einer",
            "meiner", "deiner", "seiner", "ihrer", "keiner", "dieser", "mir", "dir", "ihm"}
ADVERBIAL_DA = {"danach", "davor", "dabei", "dazu", "damit", "dagegen", "dadurch", "darum", "daher", "darauf"}
# determiner directly before a noun gap → genders it allows (m/f/n, p = plural)
DET = {"der": "mf", "den": "mp", "dem": "mn", "des": "mn", "die": "fp", "das": "n", "ein": "mn", "einen": "m",
       "einem": "mn", "einer": "f", "eine": "f", "mein": "mn", "meine": "fp", "deine": "fp", "deinen": "mp",
       "ihre": "fp", "ihrer": "fp", "jede": "f", "jeden": "m", "jedes": "n", "im": "mn", "zum": "mn", "zur": "f"}
GENDER = {"der": "m", "die": "f", "das": "n"}
# synonym clusters (own copy) — two words in one cluster can both be right
CLUSTERS = [
    {"reden", "sprechen", "plaudern"}, {"benötigen", "brauchen"}, {"begreifen", "verstehen", "kapieren", "nachvollziehen"},
    {"dauern", "anhalten"}, {"gedulden", "warten"}, {"vorbeikommen", "besuchen"}, {"verreisen", "reisen"},
    {"bewältigen", "überwinden", "schaffen", "meistern"}, {"gewährleisten", "sicherstellen", "garantieren"},
    {"veranlassen", "bewirken", "verursachen", "auslösen"}, {"beabsichtigen", "vorhaben", "planen"},
    {"einschätzen", "beurteilen", "bewerten"}, {"einräumen", "zugeben", "eingestehen"}, {"anstreben", "streben", "abzielen"},
    {"nachsehen", "nachschauen", "prüfen", "kontrollieren", "überprüfen"}, {"herausfinden", "rausfinden", "entdecken"},
    {"fürchten", "befürchten"}, {"fahnden", "suchen"}, {"fliehen", "flüchten"}, {"schützen", "beschützen"},
    {"erinnern", "gedenken"}, {"wundern", "staunen", "erstaunen"}, {"ausgleichen", "kompensieren"},
    {"voraussetzen", "annehmen", "erfordern"}, {"beeinträchtigen", "schaden", "stören"},
    {"veranschaulichen", "verdeutlichen", "illustrieren"},
    {"günstig", "billig", "preiswert"}, {"bedeutend", "wichtig", "bedeutsam", "wesentlich", "erheblich", "entscheidend"},
    {"unkompliziert", "einfach", "leicht", "simpel", "locker", "entspannt"}, {"ausgezeichnet", "hervorragend", "toll", "super", "prima", "klasse", "gut", "großartig"},
    {"erkältet", "krank"}, {"wütend", "sauer", "verärgert", "zornig", "böse", "genervt"}, {"einsam", "allein", "isoliert"},
    {"gelangweilt", "langweilig"}, {"entspannt", "ruhig", "gelassen"}, {"verlegen", "peinlich", "beschämt", "schüchtern"},
    {"besorgt", "ängstlich", "beunruhigt", "nervös"}, {"gestresst", "gehetzt", "überlastet", "nervös", "erschöpft"},
    {"dankbar", "erkenntlich"}, {"nachdenklich", "grüblerisch"}, {"verliebt", "verknallt"},
    {"gelegenheit", "möglichkeit", "chance"}, {"gegensatz", "unterschied", "gegenteil"}, {"vorsatz", "absicht", "vorhaben"},
    {"schwierigkeit", "problem", "hürde"}, {"unterstützung", "hilfe"}, {"sicherheit", "schutz"}, {"umsatz", "ertrag", "gewinn"},
    {"erfolg", "sieg"}, {"gewohnheit", "routine", "angewohnheit"}, {"aufmerksamkeit", "konzentration"}, {"zusatz", "ergänzung"},
    {"ersatz", "austausch"}, {"alltag", "routine"},
    {"ebenso", "genauso", "ebenfalls", "gleichfalls", "auch"}, {"obwohl", "obgleich", "obschon", "wenngleich", "trotzdem"},
    {"insofern", "insoweit"}, {"dahin", "dorthin", "hin"},
    {"desto", "umso"}, {"aber", "doch", "jedoch"}, {"als auch", "wie auch"}, {"sondern auch", "aber auch"},
    {"klasse", "toll", "super", "prima", "spitze", "ausgezeichnet", "großartig"}, {"nach", "zumute"},
]
def close(a, b):
    a, b = a.lower(), b.lower()
    return a == b or any(a in c and b in c for c in CLUSTERS)

def da_word(prep):
    return "da" + ("r" if prep[0] in "aeiouäöü" else "") + prep

def gloss_parts(g):
    g = re.sub(r"\([^)]*\)", "", g.lower())
    out = set()
    for p in re.split(r"[/,;]", g):
        p = re.sub(r"^(the|to|a|an) ", "", p.strip())
        if p: out.add(p)
    return out

# ── load ───────────────────────────────────────────────────────────────────
gen = json.loads((HERE / "generated-ids.json").read_text(encoding="utf-8"))
NEW_W, NEW_E = set(gen["words"]), set(gen["exercises"])
verbs = load("data/verbs.json"); nouns = load("data/nouns.json"); adjs = load("data/adjectives.json")
advs = load("data/adverbs.json"); exprs = load("data/expressions.json"); vps = load("data/verb-prepositions.json")
EXF = ["verbs", "nouns", "adjectives", "adverbs", "expressions", "prepositions", "particles", "prefixes", "declension"]
allex = {}
for f in EXF:
    p = ROOT / "data" / "exercises" / f"exercises-{f}.json"
    if p.exists():
        d = json.loads(p.read_text(encoding="utf-8"))
        allex[f] = d if isinstance(d, list) else [x for v in d.values() if isinstance(v, list) for x in v]
newex = [e for f in allex.values() for e in f if e.get("exercise_id") in NEW_E]

wk_v = tsv("wiktionary-verbs.tsv"); wk_n = tsv("wiktionary-nouns.tsv"); wk_a = tsv("wiktionary-adjectives.tsv")
ev = json.loads((HERE / "valency-evidence.json").read_text(encoding="utf-8"))
glossmap = {}
for coll, key in ((verbs, "root"), (nouns, "word"), (adjs, "word"), (advs, "word")):
    for x in coll:
        glossmap.setdefault(x[key].lower(), set()).update(gloss_parts(x["english"]))
        for pv in x.get("prefix_variants", []) or []:
            glossmap.setdefault(pv["word"].lower(), set()).update(gloss_parts(pv["english"]))

# ── verbs ──────────────────────────────────────────────────────────────────
vinfo = {}   # wid -> (word, english, prefix, sep, is_root, base_entry)
for v in verbs:
    if v["id"] in NEW_W:
        sep = bool(v.get("separable_root"))
        vinfo[v["id"]] = (v["root"], v["english"], v.get("prefix", "") if sep else "", sep, True, v)
    for pv in v.get("prefix_variants", []) or []:
        if pv["id"] in NEW_W:
            vinfo[pv["id"]] = (pv["word"], pv["english"], pv["prefix"] if pv["separable"] else "", pv["separable"], False, v)

def split_sep(form):
    """'sehe nach' -> ('sehe','nach'); 'begreife' -> ('begreife','')"""
    parts = form.split(" ")
    return (parts[0], parts[1]) if len(parts) == 2 else (form, "")

def derive(word, prefix, sep):
    c = wk_v.get(word)
    if not c:
        err("V1", f"{word}: no Wiktionary row"); return None
    _, ich, du, er, prat, pp, aux = c[:7]
    ich, p1 = split_sep(ich); du, _ = split_sep(du); er, _ = split_sep(er); prat, _ = split_sep(prat)
    if sep and p1 != prefix: err("V1", f"{word}: Wiktionary separates '{p1}', app prefix '{prefix}'")
    if not sep and p1: err("V1", f"{word}: Wiktionary says separable ('{p1}') but app treats it as inseparable")
    inf = word[len(prefix):] if sep else word
    stem = inf[:-2] if inf.endswith("en") else inf[:-1]
    ihr = stem + ("et" if stem[-1] in "dt" or (stem[-1] in "mn" and stem[-2] not in "lrhmn" + "aeiouäöü") else "t")
    pres = [ich, du, er, inf, ihr, inf]
    if prat.endswith("te"):
        pr = [prat, prat + "st", prat, prat + "n", prat + "t", prat + "n"]
    else:
        e = "e" if prat[-1] in "dt" else ""
        pr = [prat, prat + e + "st", prat, prat + "en", prat + e + "t", prat + "en"]
    return {"pres": pres, "prat": pr, "pp": pp, "aux": aux, "inf": inf}

for wid, (word, eng, prefix, sep, is_root, entry) in vinfo.items():
    d = derive(word, prefix, sep)
    if not d: continue
    exs = {e["exercise_id"]: e for e in newex if e.get("word_id") == wid}
    if is_root:
        conj = entry["conjugation"]
        if [conj["present"][p] for p in PERS] != d["pres"]: err("V1", f"{word}: present {list(conj['present'].values())} ≠ {d['pres']}")
        if conj["past_participle"] != d["pp"]: err("V1", f"{word}: PII {conj['past_participle']} ≠ {d['pp']}")
        if conj["auxiliary"] != d["aux"]: err("V1", f"{word}: aux {conj['auxiliary']} ≠ {d['aux']}")
        hd = entry.get("standalone_variant")
        if hd and entry.get("root") != entry.get("prefix", "") + entry.get("base", ""): err("V5", f"{word}: standalone root ≠ prefix+base")
    else:
        base = [entry["conjugation"]["present"][p] for p in PERS]
        vp_ = next(pv["prefix"] for pv in entry["prefix_variants"] if pv["word"] == word)
        if (base if sep else [vp_ + f for f in base]) != d["pres"]:
            err("V1", f"{word}: present derived from {entry['root']} ≠ Wiktionary-based {d['pres']}")
    want = 9 if is_root else 8
    if len(exs) != want: err("V5", f"{word}: {len(exs)} exercises, expected {want}")
    refl = ALWAYS_REFLEXIVE.get(word, [""] * 6)
    def J(*xs): return " ".join(x for x in xs if x)
    tables = {"prasens": [J(d["pres"][i], refl[i], prefix) for i in range(6)],
              "prateritum": [J(d["prat"][i], refl[i], prefix) for i in range(6)],
              "perfekt": [J((HABEN if d["aux"] == "haben" else SEIN)[i], refl[i], d["pp"]) for i in range(6)]}
    for e in exs.values():
        t = e["type"]
        if t == "conjugation_table":
            got = [e["forms"][p] for p in PERS]
            if got != tables[e["tense"]]: err("V2", f"{e['exercise_id']}: {got} ≠ {tables[e['tense']]}")
        elif t == "partizip_ii":
            if e["correct_answer"] != d["pp"]: err("V1", f"{e['exercise_id']}: PII {e['correct_answer']}")
        elif t == "auxiliary_choice":
            if e["correct_answer"] != ("hat" if d["aux"] == "haben" else "ist"): err("V1", f"{e['exercise_id']}: aux")
        elif t in ("fill_blank", "conjugation_choice"):
            q = e["question"]["de"]; ans = e["correct_answer"]
            before = q.split("_____")[0].split()
            if before and before[-1] in ("Sie", "sie"): err("V4", f"{e['exercise_id']}: gap right after '{before[-1]}'")
            if ans == word:  # infinitive slot
                valid = {word}; pret = set()
            else:
                pi = None
                for i in range(6):
                    f = f"{d['pres'][i]} ... {prefix}" if (sep and " ... " in ans) else d["pres"][i]
                    if f == ans: pi = i; break
                if pi is None: err("V3", f"{e['exercise_id']}: answer '{ans}' is no present form of {word}"); continue
                valid = {ans}
                pret = {f"{d['prat'][pi]} ... {prefix}" if sep else d["prat"][pi], J(d["prat"][pi], prefix)}
            for w in e["wrong_answers"]:
                if w in valid: err("V3", f"{e['exercise_id']}: wrong option '{w}' is right")
                if w in pret: err("V3", f"{e['exercise_id']}: wrong option '{w}' is a Präteritum form (grammatical)")
                if ans == word and w == d["inf"]: err("V3", f"{e['exercise_id']}: '{w}' is also an infinitive")

# Stammverben rule for new roots: a non-standalone new root must not be prefix + a verb the app teaches
taught = {v["root"] for v in verbs} | {pv["word"] for v in verbs for pv in v.get("prefix_variants", []) or []}
for v in verbs:
    if v["id"] in NEW_W and not v.get("standalone_variant"):
        for p in ["ab", "an", "auf", "aus", "be", "ein", "ent", "er", "ge", "nach", "ver", "vor", "zu", "über", "um"]:
            if v["root"].startswith(p) and v["root"][len(p):] in taught:
                err("V5", f"{v['root']}: Stammverb is {p}- + {v['root'][len(p):]}, which the app teaches")

# ── nouns ──────────────────────────────────────────────────────────────────
ng = {n["word"]: n for n in nouns}
for n in nouns:
    if n["id"] not in NEW_W: continue
    c = wk_n.get(n["word"])
    if not c: err("N2", f"{n['word']}: no Wiktionary row"); continue
    _, genus, pl, gen = c[:4]
    if GENDER[n["article"]] != genus: err("N2", f"{n['word']}: article {n['article']} vs Genus {genus}")
    if pl != "—" and n["plural"] != pl: err("N2", f"{n['word']}: plural {n['plural']} ≠ {pl}")
    if not n["genitive"].endswith(" " + gen): err("N2", f"{n['word']}: genitive {n['genitive']} ≠ … {gen}")
    exs = [e for e in newex if e.get("word_id") == n["id"]]
    if len(exs) != 3: err("N1", f"{n['word']}: {len(exs)} exercises")
    for e in exs:
        if e["type"] != "fill_blank": continue
        q = e["question"]["de"]
        det = q.split("_____")[0].split()[-1].lower()
        if det not in DET: err("N1", f"{e['exercise_id']}: '{det}' before the gap does not fix gender"); continue
        if GENDER[n["article"]] not in DET[det]: err("N1", f"{e['exercise_id']}: '{det}' does not fit {n['article']} {n['word']}")
        for w in e["wrong_answers"]:
            x = ng.get(w)
            if not x: err("N1", f"{e['exercise_id']}: distractor '{w}' is not an app noun (gender unknown)"); continue
            if GENDER[x["article"]] in DET[det]: err("N1", f"{e['exercise_id']}: '{det} {w}' is grammatical")
            if "p" in DET[det] and x["plural"] == w: err("N1", f"{e['exercise_id']}: '{w}' = its plural, fits '{det}'")
            if close(w, n["word"]): err("S1", f"{e['exercise_id']}: '{w}' close to '{n['word']}'")
        if q.replace("_____", n["word"]) not in {s["de"] for s in n["example_sentences"]}:
            err("F1", f"{e['exercise_id']}: filled sentence not among examples")

# ── adjectives ─────────────────────────────────────────────────────────────
adjwords = {a["word"] for a in adjs}
for a in adjs:
    if a["id"] not in NEW_W: continue
    c = wk_a.get(a["word"])
    if not c: err("A1", f"{a['word']}: no Wiktionary row"); continue
    comp = c[1]
    if comp in ("", "—"):
        if a["comparative"]: err("A1", f"{a['word']}: comparative '{a['comparative']}' not attested")
    elif a["comparative"] != comp: err("A1", f"{a['word']}: comparative {a['comparative']} ≠ {comp}")
    for e in [e for e in newex if e.get("word_id") == a["id"]]:
        german = e["type"] == "fill_blank" or e["question"].get("prompt_en") == "WHICH GERMAN WORD MEANS THIS?"
        if german:
            for w in e["wrong_answers"]:
                if close(w, a["word"]): err("S1", f"{e['exercise_id']}: '{w}' close to '{a['word']}'")
                if w not in adjwords: err("S1", f"{e['exercise_id']}: '{w}' is not an app adjective")
        if e["type"] == "fill_blank" and e["question"]["de"].replace("_____", a["word"]) not in {s["de"] for s in a["example_sentences"]}:
            err("F1", f"{e['exercise_id']}: filled sentence not among examples")

# ── DE→EN distractors (verbs, nouns, adjectives, adverbs) ──────────────────
owner = {}
for coll, key in ((verbs, "root"), (nouns, "word"), (adjs, "word"), (advs, "word")):
    for x in coll:
        owner[x["id"]] = x[key]
        for pv in x.get("prefix_variants", []) or []: owner[pv["id"]] = pv["word"]
for e in newex:
    q = e.get("question", {})
    if e["type"] == "translate_word" and q.get("prompt_en", "").upper() in ("WHAT DOES THIS VERB MEAN?", "WHAT DOES THIS WORD MEAN?", "WHAT DOES THIS ADJECTIVE MEAN?", "WHAT DOES THIS ADVERB MEAN?"):
        w = owner.get(e["word_id"], "").lower()
        right = gloss_parts(e["correct_answer"])
        for k, g in glossmap.items():
            if k != w and close(k, w): right |= g
        for x in e["wrong_answers"]:
            if gloss_parts(x) & right: err("S2", f"{e['exercise_id']}: '{x}' is also a translation of '{w}' or a synonym")

# ── adverbs & expressions: synonym clusters ────────────────────────────────
for e in newex:
    if e.get("word_id", "").startswith(("adv_", "expr_")):
        q = e["question"]
        german = e["type"] == "fill_blank" or q.get("prompt_en") in ("WIE SAGT MAN DAS AUF DEUTSCH?",)
        if german:
            for w in e["wrong_answers"]:
                if close(w, e["correct_answer"]): err("S1", f"{e['exercise_id']}: '{w}' close to '{e['correct_answer']}'")
for x in exprs:
    if x["id"] not in NEW_W: continue
    exs = [e for e in newex if e.get("word_id") == x["id"]]
    if len(exs) != 4: err("F1", f"{x['id']}: {len(exs)} exercises")
    for e in exs:
        if e["type"] == "fill_blank":
            filled = e["question"]["de"].replace("_____", e["correct_answer"], 1)
            if filled not in {s["de"] for s in x["example_sentences"]}: err("F1", f"{e['exercise_id']}: '{filled}' not an example")

# ── Verben mit Präposition ─────────────────────────────────────────────────
def attested(evkey):
    out = set()
    w = ev["wiktionary"].get(evkey); d = ev["dwds"].get(evkey)
    if w: out |= set(w[1].keys())
    if d: out |= set(d.keys())
    return out
seeds = {p["slug"]: p for p in json.loads((HERE / "verb-preposition-seeds.json").read_text(encoding="utf-8"))["pairs"]}
for vp in vps:
    slug = vp["id"][3:]
    s = seeds.get(slug)
    if not s: err("P1", f"{vp['id']}: no seed"); continue
    att = attested(s["ev"]); banned = att | set(s["extra_bans"])
    if vp["preposition"] not in att: err("P1", f"{vp['id']}: '{vp['preposition']}' not attested for {s['ev']}")
    if vp["da_form"] != da_word(vp["preposition"]): err("P4", f"{vp['id']}: da-form {vp['da_form']} ≠ {da_word(vp['preposition'])}")
    if vp["preposition"] in AKK_PREPS and vp["case"] != "Akkusativ": err("P3", f"{vp['id']}: {vp['preposition']} is Akk-only")
    if vp["preposition"] in DAT_PREPS and vp["case"] != "Dativ": err("P3", f"{vp['id']}: {vp['preposition']} is Dat-only")
    exs = [e for e in newex if e.get("vp_id") == vp["id"]]
    if not exs: err("G2", f"{vp['id']}: no exercises")
    for e in exs:
        q = e["question"]["de"]
        if e["type"] == "select_case":
            hl = e["question"]["highlight"].split()
            if hl[0] != vp["preposition"]: err("P5", f"{e['exercise_id']}: highlight starts '{hl[0]}'")
            c = "Akkusativ" if hl[1] in AKK_MARK else "Dativ" if hl[1] in DAT_MARK else None
            if c != e["correct_answer"] or c != vp["case"]: err("P5", f"{e['exercise_id']}: '{hl[1]}' shows {c}, answer {e['correct_answer']}")
            continue
        ans = e["correct_answer"]
        if ans.startswith("da"):
            if ans != vp["da_form"]: err("P4", f"{e['exercise_id']}: answer {ans}")
            for w in e["wrong_answers"]:
                p = next((x for x in sorted(AKK_PREPS | DAT_PREPS | TWO_WAY, key=len, reverse=True) if w in (da_word(x),)), None)
                if p is None: err("P4", f"{e['exercise_id']}: '{w}' is not a da-word"); continue
                if p in banned: err("P4", f"{e['exercise_id']}: '{w}' — {s['ev']} is attested with '{p}'")
                if w in ADVERBIAL_DA: err("P4", f"{e['exercise_id']}: '{w}' can stand alone as an adverb")
            continue
        if ans != vp["preposition"]: err("P3", f"{e['exercise_id']}: answer {ans}")
        nxt = q.split("_____", 1)[1].split()[0].strip(".,!?")
        c = "Akkusativ" if nxt in AKK_MARK else "Dativ" if nxt in DAT_MARK else None
        if c is None: err("P3", f"{e['exercise_id']}: '{nxt}' after the gap does not show the case"); continue
        if c != vp["case"]: err("P3", f"{e['exercise_id']}: '{nxt}' is {c} but {vp['display']} needs {vp['case']}")
        for w in e["wrong_answers"]:
            if w in banned: err("P2", f"{e['exercise_id']}: '{w}' is attested with {s['ev']}")
            gov = "Akkusativ" if w in AKK_PREPS else "Dativ" if w in DAT_PREPS else "both"
            if gov == "both" or gov == c: err("P3", f"{e['exercise_id']}: '{w} {nxt}' is grammatical")

# ── option hygiene, ids, bundle, engine ────────────────────────────────────
for e in newex:
    if e["type"] in ("partizip_ii", "conjugation_table"): continue
    w = e.get("wrong_answers", [])
    need = 1 if e["type"] == "auxiliary_choice" else 3
    if len(w) != need: err("G1", f"{e['exercise_id']}: {len(w)} wrong options (need {need})")
    if len({x.lower() for x in w} | {e["correct_answer"].lower()}) != len(w) + 1: err("G1", f"{e['exercise_id']}: duplicate / answer among wrongs")
    if e["type"] in ("fill_blank", "conjugation_choice", "select_preposition") and any(x[:1].isupper() != e["correct_answer"][:1].isupper() for x in w):
        err("G1", f"{e['exercise_id']}: capitalisation gives the answer away")
seen = {}
for f, L in allex.items():
    for e in L:
        i = e.get("exercise_id") or e.get("id")
        if i in seen: err("G2", f"duplicate exercise id {i} ({seen[i]} / {f})")
        seen[i] = f
missing = NEW_E - set(seen)
if missing: err("G2", f"{len(missing)} generated exercises missing from data, e.g. {sorted(missing)[:3]}")
owners = set(owner) | {x["id"] for x in exprs} | {x["id"] for x in vps}
for e in newex:
    o = e.get("vp_id") or e.get("word_id")
    if o not in owners: err("G2", f"{e['exercise_id']}: owner {o} unknown")
try:
    s = (ROOT / "js" / "data.js").read_text(encoding="utf-8").strip()
    B = json.loads(re.sub(r"^\s*window\.APP_DATA\s*=\s*", "", s).rstrip(";"))
    for key, path in [("verbs", "data/verbs.json"), ("nouns", "data/nouns.json"), ("adjectives", "data/adjectives.json"),
                      ("adverbs", "data/adverbs.json"), ("expressions", "data/expressions.json"),
                      ("verb_prepositions", "data/verb-prepositions.json"),
                      ("exercises_prepositions", "data/exercises/exercises-prepositions.json"),
                      ("exercises_nouns", "data/exercises/exercises-nouns.json")]:
        if B.get(key) != load(path): err("G3", f"js/data.js '{key}' ≠ {path} — run bundle-data.py")
    if B["exercises"]["module_verbs"] != load("data/exercises/exercises-verbs.json"): err("G3", "js/data.js verb exercises stale")
except Exception as ex:
    err("G3", f"cannot read bundle: {ex}")
MAIN = {"translate_word", "fill_blank", "conjugation_choice", "partizip_ii", "auxiliary_choice", "conjugation_table",
        "select_preposition", "select_case"}
src = (ROOT / "js" / "exercises.js").read_text(encoding="utf-8")
for t in {e["type"] for e in newex}:
    if t not in MAIN or f"ex.type === '{t}'" not in src: err("G4", f"type {t} not dispatched by the Main engine")

print(f"Bilder-Intake: {len(NEW_W)} words · {len(newex)} exercises checked")
for e in errors[:120]: print("  ERROR " + e)
print(f"{'✅ 0' if not errors else '❌ ' + str(len(errors))} errors")
sys.exit(1 if errors else 0)
