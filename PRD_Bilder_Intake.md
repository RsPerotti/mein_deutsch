# PRD — Bilder-Intake (vocabulary from Instagram screenshots)

*Drafted: 2026-11-09 — Session 44. Status: SIGNED OFF by Ricco 2026-11-09 — BUILT (v26).*

---

## Problem

Ricco saves German vocabulary from Instagram posts and reels as screenshots. They don't reach the app, so the words never get drilled or picked up by Wiederholung. This batch has 20 screenshots, which are 10 unique images (each was sent twice).

## Success criteria

1. Every new word or expression from the 10 images is in the right module with exercises and live on the PWA.
2. Words already in the app are skipped. No duplicates, and no duplicate of an existing prefix variant.
3. Every exercise has exactly one viable answer. A validator holds its own copy of the synonym and alternative-preposition lists and fails the build when an option breaks this rule.
4. All new exercises run on the **Main engine**, so they enter Wiederholung automatically and write to both progress stores. No new engine.

## Inventory (deduped against the app, 2026-11-09)

| Image | Already in app | New |
|---|---|---|
| Globio A1/A2 → B1/B2 | manchmal, ab und zu, verstehen, krank, billig, wichtig, helfen, beginnen, reisen, besuchen, sprechen, warten, fragen, einfach, brauchen, anfangen, unterstützen, anhalten | **Verbs:** dauern, begreifen, verreisen, vorbeikommen, reden, sich gedulden, (sich) melden, benötigen · **Adj:** erkältet, günstig, bedeutend, unkompliziert, ausgezeichnet · **Ausdruck:** Klasse! |
| Whiteboard (body sounds) | — | **Verbs:** niesen, lachen, schnipsen*, flüstern, schnarchen, husten, klatschen, furzen (tagged vulgar) |
| Satz family | Ansatz | **Nouns:** Satz, Ersatz, Aufsatz, Zusatz, Absatz, Umsatz, Einsatz, Gegensatz, Vorsatz |
| Häufigkeit | all 11 | — |
| da-words (car video) | da, daher, dagegen, danach | **Adverb:** dahin · **Präp. section:** davon, dazu, damit, dabei, dafür, davor |
| Nouns for Life | 11 of 20 | **Nouns:** Alltag, Gewohnheit, Gelegenheit, Unterstützung, Sicherheit, Geduld, Aufmerksamkeit, Schwierigkeit, Erfolg |
| 5 verbos úteis | ablenken, überlegen, einladen | **Verbs:** nachsehen, herausfinden (colloquial form *rausfinden* shown in its note) |
| darüber/daran sentences | — | **Präp. section:** darüber, daran + pairs nachdenken über, sich freuen über, sprechen über, denken an, arbeiten an, glauben an, bereit sein für, danken für, wissen von |
| nach / vor / über table | fragen, streben, suchen, nachdenken, sprechen | **Verbs:** fahnden, (sich) fürchten, warnen, fliehen, (sich) schützen, sich wundern · **Präp. section:** fragen/streben/suchen/fahnden nach, sich fürchten/warnen/fliehen/sich schützen vor, sich wundern über |
| Feelings & Emotions | 14 of 24 | **Adj:** wütend, einsam, gelangweilt, entspannt, verlegen, besorgt, genervt, dankbar, nachdenklich, verliebt, gestresst |
| Connectors (car video) | 9 of 11 | **Adverbs:** ebenso, ebenfalls, obwohl |
| Mir ist nach / Was hältst du von / gerade dabei / erinnert mich an | — | **Ausdrücke:** Mir ist nach …, Was hältst du von …?, Ich bin gerade dabei, … zu …, Das erinnert mich an … · **Verb:** (sich) erinnern |
| Double conjunctions | single words only | **Ausdrücke:** je … desto, sowohl … als auch, entweder … oder, weder … noch, nicht nur … sondern auch, zwar … aber, einerseits … andererseits |
| Adverbs (tatsächlich …) | 6 of 7 | **Adverb:** insofern |
| DOGFU (accusative preps) | durch, ohne, gegen, für, um | — |
| Advanced Verbs | überzeugen, hervorheben, bewirken, widersprechen, übertreiben, durchsetzen | **Verbs:** bewältigen, gewährleisten, voraussetzen, beeinträchtigen, veranschaulichen, nachvollziehen, vorausgehen, analysieren, beabsichtigen, veranlassen, ausgleichen, einschätzen, anstreben, einräumen |

\*"schipsen" on the whiteboard is assumed to be *schnipsen* (to snap your fingers). This is checked against Wiktionary before it's added.

**Totals:** about 39 verbs · 18 nouns · 16 adjectives · 5 adverbs · 13 expressions · a new *Verben mit Präposition* section (about 20 pairs + 8 da-words).

## Scope

**In**
- Verbs go in `verbs.json`. A verb whose root already exists becomes a prefix variant of that root (nachsehen → sehen, vorbeikommen → kommen, verreisen → reisen, herausfinden → finden…). The rest become new roots under the Stammverben rule (de.wiktionary Herkunft). Each verb gets 8 exercises (the Session 35 intake standard).
- Nouns ×3, adjectives ×4, adverbs ×4 exercises (existing standards). Expressions ×4 (translate_word, fill_blank, situation match).
- **Verben mit Präposition**, a new section in the Präpositionen module, using the existing `select_preposition` exercise type so the Main engine and Wiederholung pick it up with no engine work:
  - verb + preposition drills: "Ich denke oft _____ meinen Urlaub." → *an*
  - da-word drills: "Wir sprechen morgen _____." → *darüber*
  - the case after the preposition, wherever it isn't already obvious
- Translations come from dictionaries, not from the images. Several image glosses are loose, e.g. "Zusatz = additive" and "Einsatz = use".
- CEFR is capped at B2, as decided on 2026-07-07. The "Advanced Verbs" are C1 in reality but get labelled B2.
- Synonym pairs from the Globio image are added as plain words (Ricco, 2026-11-09). They are also entered in the validator's synonym list, so *billig* can never be a wrong option for *günstig*, *reden* for *sprechen*, and so on.
- `intake-log.json` entry, rebundle, SW bump, QA, push.

**Out**
- A "level up" synonym drill (declined 2026-11-09).
- A grammar lesson for double conjunctions. They go into Ausdrücke as expressions (Ricco, 2026-11-09).
- Re-auditing existing modules for synonym distractors. That is still an open item from Session 42.

## Main risk: one viable answer in preposition drills

Many verbs take more than one preposition: *sprechen über / von / mit*, *denken an / über*, *sich freuen über / auf*, *warnen vor / wegen*. A drill like "Ich spreche _____ dem Film" has two right answers. Guards:
1. Every pair carries a list of **all** prepositions the verb takes, sourced from Wiktionary/DWDS and cached in `_factory/bilder-intake/`. A preposition the verb also takes can never be offered as a wrong answer.
2. A drill sentence has to rule out the verb's other prepositions by meaning. The validator flags any drill whose verb has more than one valid preposition and which carries no `disambiguation` note, and those drills get rewritten.
3. Seeded-bug test: the validator must fail on deliberately broken drills before its passes are trusted.

## Plan

| Phase | Work | Check |
|---|---|---|
| 1 | Verify against Wiktionary: lemmas, separability, Partizip II, auxiliary, gender/plural, verb + preposition valency → cache | Cache complete for all new items |
| 2 | Verbs (seeds → generator → exercises) | `validate-variants` / `validate-stammverben` + new checks |
| 3 | Nouns, adjectives, adverbs | Distractor validator (L-rules) extended to these modules |
| 4 | Ausdrücke (13 expressions) | Single-answer validator |
| 5 | Verben mit Präposition section + lesson intro page | New validator + seeded-bug test, 375 px screenshot |
| 6 | Bundle, SW bump, full QA suites, push, live check | Live SW version |

Each phase ends at a clean stopping point.

## Open questions

None blocking. Default unless you say otherwise: the new Präpositionen section has no unlock gating, the same as the rest of that module.

---

*Sign-off required before Phase 1.*

---

## Build notes (amended 2026-11-09, after the build)

- **Counts as built:** 39 verbs · 18 nouns · 16 adjectives · 5 adverbs · **12** Ausdrücke (the PRD said
  "about 13"; the 7 double conjunctions + 5 expressions are all there is) · 24 verb + preposition pairs.
  611 exercises in total (verb-preposition section: 82).
- **DWDS added as a source** for verb + preposition valency: Wiktionary did not state *sprechen über*,
  *warnen vor*, *nachdenken über*. Every taught pair is attested in at least one of the two.
- **No Präteritum distractors** in the new verb exercises (a deviation from the older generator, which
  offered them although they are grammatical in a present-tense sentence).
- **validate-stammverben.py check C** amended: noun + verb compounds (*gewährleisten*) are not prefix verbs.
- **Lesson intro** is an intro card at the top of the Verben-mit-Präposition list, not a separate lesson page.
