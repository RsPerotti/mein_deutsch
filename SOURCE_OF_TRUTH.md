# Mein Deutsch — Source of Truth
*Last updated: 2026-08-28 — Session 39 (Variant verification + Wechselpräfix pairs)*

---

## Current State

**10 modules built and live.** App at https://rsperotti.github.io/mein_deutsch (v18).

**Session 39b — the Wechselpräfix pairs are taught explicitly (v18).** Vorsilben Lesson 5 now ends with a generated pair list: all 11 dual-reading verbs, both readings each, with separability, auxiliary, Partizip II and a gloss, and the half the app drills marked **geübt**. The list is not hand-kept — it is built from the AMBIGUOUS verdicts in `verify-report.md` plus `wiktionary-cache.tsv`, and `validate-prefixes.py` now fails if an AMBIGUOUS verb is missing from it, so a future intake cannot add a pair the lesson silently ignores. New `pairs` section type with its own renderer branch in `grammar.js` (the other four lesson renderers are untouched, and a regression check enforces that). Screenshot-verified at 375px: no horizontal overflow. **Also fixed: Lesson 5's own example contradicted the rule it taught** — "Der Topf läuft über. / Er ist zum Feind übergelaufen." was offered as separable-vs-inseparable, but *übergelaufen* is the separable participle, so both halves were separable. The same error sat in the `überlaufen` card in `prefixes.json`. PRD: `PRD_Wechselpraefixe_Paare.md`.

**Session 39 — the 133 prefix variants are now dictionary-verified.** Separability, auxiliary and Partizip II for every variant were checked against de.wiktionary.org's `{{Deutsch Verb Übersicht}}` fields by a new independent script: **120 PASS, 0 MISMATCH, 11 AMBIGUOUS, 2 NOT-FOUND.** One genuine error found and corrected: `durchgehen` was filed separable + **haben**, a combination Wiktionary attests for neither of its two readings — corrected to separable + **sein**. Two apparent mismatches were faults in the checker, not the data (`ausziehen`'s second auxiliary lives in the `Hilfsverb*` field my parser ignored; the `ge`-infix cross-check misfires on stems that begin with *ge* and on bases forming no *ge*-participle — replaced with an exact `prefix + root participle` comparison). Also fixed, found via the AMBIGUOUS rows: five Verbs cards carried a dual-reading gloss copied from `prefixes.json` ("umfahren = to drive around / to run over"), and the sentence builder was pasting dictionary scaffolding into English prompts ("I have to teach sb sth him German"). **Case requirements remain unverified** — 22 calls, deliberately out of scope. PRD: `PRD_Verify_Variants.md`. Report: `_factory/vorsilben/verify-report.md`.

**Session 38 — Vorsilben fixes.** Module-home progress was stuck at 0 / n: `selectPrefixAnswer()` never wrote to exercise history. Fixed, and the same omission fixed in the Deklination engine. One-shot migration added (`migrateMisfiledQuizResults`) that recovers quiz results written to the wrong store by the pre-Session-37 bug — previously-passed Partikeln / Artikel / Deklinationen lessons show as complete again with no action needed. First visual QA at 375px: the `select_feeling` wrapping concern was unfounded, but it exposed an ambiguous item (`vorgehen` offered against `fort-`). Now prevented structurally by a `semantic-overlap` check in the validator plus 13 new exclusion pairs.

**Vorsilben module COMPLETE (Session 37).** New standalone 10th module teaching German verb prefixes as a generative system rather than as vocabulary. 35 prefixes across three groups (8 untrennbar / 20 trennbar / 7 beide), each with a core feeling, a feeling paragraph, a mnemonic and 10 worked examples. 5 grammar lessons (no gating, Artikel model) + 330 exercises of two new types. Filters by **separability, not CEFR** — a deliberate departure from every other module, recorded in Active Decisions. `emp-` and `hinter-` are reference-only (closed sets, no exercises). Machine-validated by an independent script — 0 integrity errors. 49-check headless QA suite passes. PRD: `PRD_Vorsilben.md`. Commit `ec4891c`, pushed and live (v14).

**BUGFIX shipped with v14 — grammar quiz results were recorded against the wrong module.** `advanceGrammarQuiz()` always called `_renderGrammarQuizResults()`, which writes into the Verbs `Grammar` singleton. Partikeln, Artikel and Deklinationen quiz completions were therefore never recorded against `ParticleGrammar` / `ArticleGrammar` / `DeclensionGrammar`: their Grammatik accordion dots never turned green, and their lesson IDs were written as stray keys into `app_grammar_lessons`. `advanceGrammarQuiz()` now dispatches on `_grammarQuizState.module`, matching what `onScreenEnter` already did. Affects all four modules. Existing users will see previously-completed Partikeln/Artikel/Deklinationen lessons still showing as incomplete — the old results were written to the wrong store and are not migrated.

**Deklinationen area COMPLETE (Session 36).** The Adjectives module's placeholder card is now a full adjective-endings area: 5 grammar lessons (no gating, Artikel model) + 360 `type_ending` exercises (3 patterns × 4 cases × 30), strict ending-only typing, feedback card after every answer, cooldown re-queue, cumulative CEFR picker. Endings machine-generated from the pattern×case×gender lookup table and validated by an independent script — 0 integrity errors. Excluded from v1: stem-changers, indeclinables, comparative/superlative declension, adjectival nouns. PRD: `PRD_Deklinationen.md`. Spec: `_factory/declension-spec.md`. Commit 00dea53.

**Wörter Intake #1 COMPLETE (Session 35).** 213 reading-vocabulary words from Ricco's Google Sheet processed: 152 new words added across Verbs (+65 word forms), Nouns (+55), Adjectives (+36), Adverbs (+12), plus the new **Ausdrücke module** (9th module, 8 expressions, 32 exercises, no gating). ~958 new exercises. Full row-by-row resolution: `_factory/intake-log.json`. Repeatable workflow: sheet stays the inbox; future runs diff against the intake log and process only new rows. PRD: `PRD_Woerter_Intake.md`. Two flagged sheet entries need Ricco's confirmation: "Aufziele" (interpreted as abzielen) and "kindersinne" (skipped, unidentifiable).

**Artikel module COMPLETE.** Standalone 8th module. 6 grammar lessons (grammatical gender → masculine/feminine/neuter endings → meaning categories → compound nouns). Der/Die/Das exercise engine (select_article type, runtime queue from unlocked root nouns). No gating. Pushed and live (v9).

**Partikeln module COMPLETE.** All 7 phases done. 34 particles, 510 exercises (15 per particle), 8 grammar lessons. Commit 8726903 pushed and live.

**Grammatik curriculum (Verbs) COMPLETE.** All 6 phases done. Quiz engine (rule_check MC, 5 questions per lesson, 80% pass threshold). Unlock gating wired to Verbs module home. Pushed and live (v8).

**Vergangenheit Phase 3 COMPLETE.** Präsens/Vergangenheit tab toggle live on Verbs module home. Perfekt/Präteritum sub-picker shown in exercise session. Regular/Irregular pill + case badge rendered on every verb exercise card. Known limitation: prefix variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Deferred.

---

## What Exists

| File / Folder | Status | Notes |
|---|---|---|
| `index.html` | ✅ Updated | Screens: Home, Word List, Module Home, Exercise, Verbliste, Nomenliste, Adverbliste, Adjektivliste, Präpositionsliste, Listening List, Listening Reader, Results, **screen-particle-reference**, **soft gate sheet**, **particle detail sheet**. |
| `css/styles.css` | ✅ Updated | Full design system. `.home-modules-grid`, `.module-card-grid`, `.pill-toggle-btn`, `.pill-read-btn`, `.particles-alle-nav-btn`, `.particles-cefr-picker`, `.particles-tier-header`, `.particle-feedback-card`, reference screen, detail sheet, sort toggle, chips, secondary-btn. |
| `js/app.js` | ✅ Updated | All 7 module renderers. History API for Android gesture back. **Particles (Sessions 29-B, 30):** `appData.particles`, `_particlesCefr`, `_particlesGramOpen`, particles loading, icon, module home renderer, CEFR filter state, grammatik strip, `openPartikelliste()`, `renderPartikelliste()`, `_renderParticleList()`, `showParticleDetail()`, `openParticleExercise()` + soft gate, `_PARTICLE_GATE_MAP`, `ParticleGrammar.init()` in bootstrap. |
| `js/exercises.js` | ✅ Updated | All exercise types including `fill_blank_particle` renderer, `_showParticleFeedbackCard()`, CEFR-aware particle queue, `setParticlesCefrInSession()`. Also: `partizip_ii`, `auxiliary_choice`, `conjugation_table` for Verbs. |
| `js/grammar.js` | ✅ Updated | `Grammar` + `ParticleGrammar` + `ArticleGrammar` singletons. Full lesson + quiz renderers for all three modules. |
| `js/progress.js` | ✅ Updated | All localStorage keys: root/variant split for nouns, adjectives, prepositions difficulty, articles read. |
| `js/wordlist.js` | ✅ Updated | Adjectives. Case dot helpers. Verb cards show case dots. |
| `js/wordpractice.js` | ✅ Built | Adjektive class in WLP_CLASSES picker. |
| `js/data.js` | ✅ Bundled | `window.APP_DATA` (2.2 MB). All word data + exercises incl. expressions. Rebundled Session 35. |
| `js/listening-data.js` | ✅ Built | `window.LISTENING_DATA`. 45 articles, transcripts + vocabulary. 212 KB. |
| `js/listening.js` | ✅ Built | Article list, reader, vocab highlighting, audio caching, read-state. |
| `js/particles-data.js` | ✅ Updated | `window.PARTICLES_DATA`. 34 particles + 510 exercises + 8 lessons. **244 KB. Content-reviewed (Phase 6).** |
| `js/grammar-data.js` | ✅ Built | `window.GRAMMAR_DATA` — Verbs grammar lessons bundled. |
| `data/modules.json` | ✅ Updated | 10 modules active: + Vorsilben (Prefixes, S37). NOTE: the Vorsilben descriptor is delivered via `js/prefixes-data.js` and merged in `loadData()` — `js/data.js` was deliberately NOT rebundled for v14 (2.2 MB churn avoided). Same mechanism the listening module uses. |
| `data/expressions.json` | ✅ 8 expressions | NEW (Session 35). Schwein haben, Abgemacht!, Einverstanden, Wie auch immer, Bitte sachlich bleiben, Ratschläge geben, möglichst+, durcheinander kommen. |
| `data/exercises/exercises-expressions.json` | ✅ 32 exercises | 8 × 4: meaning, 2× gap-fill, situation-match. Reuses translate_word + fill_blank renderers. |
| `_factory/intake-log.json` | ✅ NEW | Row-by-row resolution of all 213 sheet entries. Future intake runs diff against this. |
| `data/verbs.json` | ✅ 149 roots + 287 variants | Session 38: +133 prefix_variants from the Vorsilben module. Variants may now carry a `grammar.case_requirements` override; inheritance from the root remains the default. |
| `data/nouns.json` | ✅ 230 nouns | 152 roots + 78 variations. Session 35: +55 roots (intake #1). |
| `data/adverbs.json` | ✅ 139 adverbs | Session 35: +12 (new categories: Indefinites, Place & Direction, Connectors additions). |
| `data/adjectives.json` | ✅ 136 adjectives | Session 35: +36 (intake #1). |
| `data/prepositions.json` | ✅ 53 prepositions | A1–B2. Categories: two-way, akkusativ, dativ, genitiv. |
| `data/particles.json` | ✅ 34 particles | Core (A1–B2) + Advanced (C1–C2). Per-particle: signals, position, 3 examples, contrast note, related. |
| `data/exercises/exercises-verbs.json` | ✅ 3,708 exercises | Session 38: +1,064 (133 new variants x 8). |
| `_factory/generate-variants.py` | ✅ NEW (S38) | Expands the variant seeds. Partizip II derived, Präsens/Präteritum lifted from the root's tables, Perfekt built. Writes `judgement-review.md`. |
| `_factory/validate-variants.py` | ✅ NEW (S38) | Independent re-derivation of participles and all conjugated forms + MC hygiene. |
| `_factory/bundle-data.py` | ✅ NEW (S38) | **First reproducible builder for `js/data.js`** — it was assembled ad hoc before, which is how it drifted from `data/modules.json` (see v10). |
| `_factory/qa-variants.js` | ✅ NEW (S38) | 21 headless checks incl. the verstehen case badge. |
| `_factory/vorsilben/variant-seeds-*.json` | ✅ NEW (S38) | 133 authored seeds — separability, auxiliary, case, 2 complements. Only what cannot be derived. |
| `_factory/vorsilben/dual-readings.json` | ✅ NEW (S39) | The only authored input to the pair list: an English gloss + register tag per reading, paraphrased from the matching Wiktionary sense lines. Keyed by Partizip II. |
| `_factory/generate-dual-section.py` | ✅ NEW (S39) | Builds the Lesson 5 `pairs` section from verify-report + cache + filed facts. Idempotent — replaces any existing pairs section. |
| `data/grammar/prefix-lessons.json` | ✅ Updated (S39) | Lesson 5 gained a generated `pairs` section; its section-1 example corrected. |
| `_factory/verify-variants.py` | ✅ NEW (S39) | Compares filed separability/auxiliary/Partizip II against the Wiktionary cache. Holds its own derivation (Präsens_ich split, cross-checked against prefix + root participle) — imports nothing from the generator. Exits non-zero on any MISMATCH. |
| `_factory/extract-filed-facts.py` | ✅ NEW (S39) | Collects what the app claims per variant into `filed-facts.json`. Read-only. |
| `_factory/vorsilben/wiktionary-cache.tsv` | ✅ NEW (S39) | 133 verbs as de.wiktionary.org has them, fetched 2026-08-28. Committed so the verdict is reproducible offline. |
| `_factory/vorsilben/verify-report.md` | ✅ NEW (S39) | Per-verb verdict: PASS / MISMATCH / AMBIGUOUS / NOT-FOUND. |
| `_factory/vorsilben/judgement-review.md` | ✅ VERIFIED (S39) | No longer flagged UNVERIFIED for separability + auxiliary. Both its table and the 12-override section are now recomputed from seeds and `verbs.json` on every generator run, so a partial re-run can no longer truncate it. Case calls still open. |
| `data/exercises/exercises-nouns.json` | ✅ 690 exercises | 230 × 3. |
| `data/exercises/exercises-adverbs.json` | ✅ 556 exercises | 139 × 4. |
| `data/exercises/exercises-adjectives.json` | ✅ 544 exercises | 136 × 4. |
| `data/exercises/exercises-prepositions.json` | ✅ 158 exercises | 79 select_preposition + 79 select_case. |
| `data/exercises/exercises-particles.json` | ✅ 510 exercises | 34 × 15. **Content-reviewed (Phase 6) — 0 integrity errors.** |
| `data/grammar/lessons.json` | ✅ Built | 6 Verbs grammar lessons. |
| `data/grammar/particle-lessons.json` | ✅ Built | 8 Particles grammar lessons (4 sections + 5 quiz questions each). |
| `data/grammar/article-lessons.json` | ✅ Built | 6 Artikel grammar lessons (4 sections + 5 quiz questions each). |
| `js/article-grammar-data.js` | ✅ Built | `window.ARTICLE_GRAMMAR_DATA` — Artikel grammar lessons bundled. |
| `data/grammar/declension-lessons.json` | ✅ NEW (S36) | 5 Deklinationen lessons (4 sections + 5 quiz questions each). |
| `data/exercises/exercises-declension.json` | ✅ 360 exercises | NEW (S36). type_ending, 30 per pattern × case. Machine-validated, 0 errors. |
| `js/declension-data.js` | ✅ Built | `window.DECLENSION_DATA` (lessons + exercises). 184 KB. |
| `_factory/generate-declension.py` | ✅ NEW (S36) | Regenerates exercises from curated pairs; endings computed from lookup table. |
| `_factory/validate-declension.py` | ✅ NEW (S36) | Independent ending table + 7 integrity checks. Run before any merge. |
| `data/prefixes.json` | ✅ NEW (S37) | 35 verb prefixes. Per-prefix: group, core feeling, feeling paragraph, mnemonic, 10 worked examples (verb, root, English, why), related prefixes, `exercisable` flag. |
| `data/grammar/prefix-lessons.json` | ✅ NEW (S37) | 5 Vorsilben lessons (4 sections + 5 quiz questions each). |
| `data/exercises/exercises-prefixes.json` | ✅ 330 exercises | NEW (S37). 33 drilled prefixes × 10 (6 `select_prefix` + 4 `select_feeling`). Machine-validated, 0 errors. |
| `js/prefixes-data.js` | ✅ Built | `window.PREFIXES_DATA` (prefixes + exercises + lessons + module descriptor). 277 KB. |
| `_factory/generate-prefixes.py` | ✅ NEW (S37) | Deterministic generator (fixed seed). Every exercise derived from a reviewed example — nothing invented. |
| `_factory/validate-prefixes.py` | ✅ NEW (S37) | Independent exclusion table + 6 integrity check families. Run before any merge. |
| `_factory/bundle-prefixes.py` | ✅ NEW (S37) | Bundles the three JSON sources into `js/prefixes-data.js`. |
| `_factory/qa-prefixes.js` | ✅ NEW (S37) | 49-check headless jsdom suite: data wiring, module home, reference, detail sheet, lessons, quiz, both exercise types, feedback card, cooldown, results, plus regressions on Verbs/Partikeln/Deklinationen. Needs `npm i jsdom`. |
| `_factory/vorsilben/source-reference.html` | ✅ NEW (S37) | The reviewed 35-prefix reference the module content was generated from. |
| `service-worker.js` | ✅ v18 | Cache-first. Precaches all JS/CSS including particles-data.js, prefixes-data.js, grammar-data.js, article-grammar-data.js, declension-data.js. Range request handler for audio. |
| `manifest.json` | ✅ Built | PWA config. |
| `icons/` | ✅ Done | icon-192 + icon-512, speech bubble "de", #85B7EB. |

---

## Design System

- **Background:** `#EDE9E1` (warm beige)
- **Surface:** `#FFFFFF` (white cards)
- **Green dark:** `#2D4A1A` (accent, text, progress bars)
- **Green accent:** `#3D6020` (labels, links)
- **Green lime:** `#8DC44A` (hero card, success button)
- **Layout:** `--max-w: 430px` / `--page-x: 16px`
- **Typography:** Roboto (system font on Android, fallback to system sans)

---

## Active Decisions

| Decision | Value |
|---|---|
| App name | Mein Deutsch |
| Platform | Android PWA (Chrome "Add to Home Screen") |
| Fonts | Roboto system font (no import — offline safe) |
| Pronunciation | Web Speech API (`speechSynthesis`, `de-DE`) |
| Exercises per word | 4 (blueprint rule) |
| Default sort | Alphabetical |
| Session size | No cap — full queue served until complete |
| Adjectives scope | 100 adjectives (25 per level A1–B2); more when Deklinationen is built |
| Prepositions difficulty | Exact match. Default: A1. Changeable mid-session. |
| Prepositions unlock | None — all 53 always accessible. No word unlock mechanic. |
| Prepositions CEFR cap | B2 (C1/C2 reserved in architecture) |
| Particles exercises | 15 per particle. Single-answer integrity is the top constraint. |
| Particles TTS | Skipped — flat TTS misleads on particles where intonation carries meaning. |
| Wörter intake CEFR | Capped at B2 — no C1/C2 labels (decision 2026-07-07). |
| Wörter intake pipeline | Sheet = inbox. Diff against `_factory/intake-log.json`, seed files + generator, validation pass per category before merge. |
| New verb exercise depth | 8 per word (9 for roots) — not the full ~22 of original seeds. Expandable later. |
| Ausdrücke scope | Minimal by design — only expressions from Ricco's readings. No gating. |
| Deklination exercises | type_ending: strict, ending only ("en" ✓, "großen" ✗). No auto-advance; feedback card after every answer. |
| Deklination lessons | 5 lessons, NO gating (Artikel model). Signal principle as unifying idea. |
| Deklination CEFR filter | **Cumulative** ("Niveau bis") — NOT exact-match. Changelog: deviation from PRD spec, flagged + accepted 2026-07-09 (exact-match B2 = empty session; no B2 adjectives in weak/mixed pairs). |
| Deklination content rule | Endings never hand-written — generator computes from lookup table, validator holds independent copy. Regenerate + validate via `_factory/*-declension.py`. |
| Vorsilben filter axis | **Separability (Trennbar / Untrennbar / Beide), NOT CEFR.** Deliberate departure from every other module — prefixes do not map cleanly onto CEFR (`ver-` is A2 in *verkaufen*, C1 in *sich versprechen*), and separability is what governs sentence behaviour. Decided 2026-08-26. |
| Vorsilben exercise types | Two: `select_prefix` (root + target meaning → prefix) and `select_feeling` (prefixed verb → core feeling). Tests generation and decoding in both directions. |
| Vorsilben volume | 10 per prefix (6 + 4). 33 drilled × 10 = 330. |
| Vorsilben gating | None (Artikel/Deklinationen model). Feedback card after every answer instead. |
| Vorsilben thin sets | `emp-` (3 verbs) and `hinter-` (~7) are `exercisable: false` — full reference cards with an explicit closed-set notice, no exercises. Drilling them would teach a rule that does not generalise. |
| Vorsilben distractor rule | A distractor is invalid if its own core feeling shares a content keyword with the target meaning, even when the two prefixes are not near-synonyms. Enforced in both generator and validator (`semantic-overlap`). Added Session 38. |
| Vorsilben content rule | Exercises are never invented — the generator derives every item from a reviewed worked example in `prefixes.json`, and the validator holds an independent copy of the near-synonym exclusion table. Regenerate + validate via `_factory/*-prefixes.py`. |
| Vorsilben vocabulary | Reconciled into `verbs.json` in Session 38 (v16): 133 variants added where the root already existed. 121 whose root is also absent remain out of scope — future Wörter intake. |
| Correctness verification | Ricco is a learner and cannot validate German. Never route linguistic correctness through him — verify against a dictionary or an independent script. His review is for usability and product direction only. |
| Variant verification | Separability + auxiliary are checked against de.wiktionary.org by `verify-variants.py` before any variant ships. Case is NOT — Wiktionary marks valency in prose, and parsing it would be a heuristic dressed up as verification. Decided 2026-08-28. |
| Wechselpräfix pair list | Generated from the AMBIGUOUS verdicts, never hand-kept. `validate-prefixes.py` fails if an AMBIGUOUS verb is missing from Lesson 5, or if a verb has other than exactly one `drilled` reading. |
| Lesson section types | `explanation` (all modules) and `pairs` (Vorsilben Lesson 5 only). A new type gets its own renderer branch — the existing branch is never edited, and `qa-prefixes.js` asserts the Verbs renderer stays free of it. |
| Variant glosses | Where a verb has two readings, the Verbs card gloss is pinned to the filed reading via an `english` field in the seed. `prefixes.json` keeps both readings — it has a `why` field to explain them; the Verbs card does not. |
| Variant case requirements | Variants inherit `grammar.case_requirements` from their root unless they carry their own override. Overrides exist only where the case genuinely diverges — chiefly the transitivising prefixes be-, er-, ver-, über-. |
| js/data.js builds | Always via `_factory/bundle-data.py`. Never hand-edited. |
| Deklination v1 exclusions | Stem-changers (dunkel/hoch/teuer), indeclinables (rosa/lila), Komparativ/Superlativ declension, adjectival nouns. |

---

## Content Progress

| Module | Scope | Items | Exercises | Status |
|---|---|---|---|---|
| Verbs | A1–B2 | 149 roots + **287 variants** | **3,708** | ✅ Complete (S38 reconciliation) |
| Nouns | A1–B2 | 230 (152 roots + 78 variants) | 690 | ✅ Complete |
| Adverbs | A1–B2 | 139 | 556 | ✅ Complete |
| Adjectives | A1–B2 | 136 | 544 | ✅ Complete |
| Prepositions | A1–B2 | 53 | 158 | ✅ Complete |
| Listening | 2026 | 45 articles | — | ✅ Complete |
| Particles | A1–C2 | 34 | 510 | ✅ Complete |
| Ausdrücke | B1–B2 | 8 expressions | 32 | ✅ Live — grows with readings |
| Deklinationen | A1–B2 | 3 patterns × 4 cases | 360 | ✅ Complete (Session 36) |
| Vorsilben | — | 35 prefixes (33 drilled) | 330 | ✅ Complete (Session 37) |

**Total exercises: ~5,824 across 9 modules + Deklinationen area + Artikel (dynamic queue from unlocked nouns).**

---

## Hosting & Git

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` → GitHub Pages auto-deploys
- **Auth:** HTTPS with a personal access token embedded in the remote URL in `.git/config`. (This entry previously said SSH — stale, corrected Session 37. SSH does not work from the Cowork sandbox, which is why the token approach was adopted.)
- **Token note:** `.git/config` is untracked, so the token never reaches the public repo — but it does sync to Google Drive with the rest of the folder. Accepted tradeoff. Rotate at github.com → Settings → Developer settings → Personal access tokens (classic, scope `repo`) and re-run `git remote set-url` if it ever leaks or expires.
- **To push:** `git push origin main` from Mac Terminal (no password prompt)

---

## Partikeln Module — COMPLETE

*PRD signed off: 2026-06-13 — Session 28. All 7 phases complete: Sessions 29–31.*

**Concept:** Standalone 7th module. 34 particles (doch, mal, ja, wohl, eigentlich, gar, etc.), two tiers (Core A1–B2 / Advanced C1–C2). First module with C1/C2 content.

**Two areas:**
1. **Category exercises** — fill-in-the-blank, CEFR level filter (default A1)
2. **Grammar curriculum** — 8 lessons (soft-gated) + "Alle Partikeln" reference lookup

**Content:**

| Tier | Categories | Particles |
|---|---|---|
| Core (A1–B2) | modal-softening / modal-attitude / modal-probability / gradation-focus / doch-answer | 20 |
| Advanced (C1–C2) | nuanced-connectors / emphasis-register | 14 |

**Key decisions:**
- Soft gate (recommend lesson, don't force)
- 15 exercises per particle (510 total) — single-answer integrity is the top constraint
- No auto-advance on correct — particle feedback card shown after every answer
- Particle feedback card: lime left border (`#8DC44A`) + green-tint bg, particle + category + context explanation
- Per-particle reference card: signals, position, 3 examples, contrast note, related particles
- eben and halt: two separate entries with cross-referenced contrast notes
- "Alle Partikeln" button: fixed in nav-header, always visible
- TTS: skipped

**Exercise integrity rules (enforced in Phase 6):**
- eben/halt never appear together as options (interchangeable in most sentences)
- ohnehin/sowieso never appear together as options (near-synonyms)
- schon/wohl: sentences include context ("Keine Sorge,…" / "Ich bin nicht sicher,…") so the intended particle function is unambiguous

**CEFR coverage:**
- modal-softening, modal-attitude, gradation-focus: A1, A2, B1
- modal-probability: A2, B1
- nuanced-connectors: B2, C1
- emphasis-register: B2, C1, C2

**localStorage keys:** `app_particles_lesson`, `app_particles_cefr` (default `A1`)

**Build phases:**
1. ~~Data architecture~~ ✅ Session 29
2. ~~Module home + CEFR filter~~ ✅ Session 29-B
3. ~~Exercise engine~~ ✅ Session 29-C
4. ~~Grammar lessons~~ ✅ Session 30
5. ~~Per-particle reference screen~~ ✅ Session 30
6. ~~Content review pass~~ ✅ Session 31
7. ~~QA + deploy~~ ✅ Session 31 — commit 8726903, pushed to live

**Full PRD:** `PRD_Partikeln.md`

---

## Vorsilben Module — BUILT, AWAITING PUSH

*PRD signed off: 2026-08-26 — Session 37. Phases 1–5 complete. Phase 6 (reconciliation) approved for v15.*

**Concept:** Standalone 10th module. Teaches the ~35 German verb prefixes as a generative system: learn the gesture each prefix carries and you can decode verbs you have never seen.

**Two areas:**
1. **Reference** — "Alle Vorsilben" screen, searchable (prefix, core feeling, or any example verb), filterable by group. Detail bottom sheet per prefix.
2. **Exercises** — four cards: Trennbar / Untrennbar / Beide / Alle.

**Content:**

| Group | Count | Prefixes |
|---|---|---|
| Untrennbar | 8 | be-, ent-, emp-, er-, ge-, miss-, ver-, zer- |
| Trennbar | 20 | ab-, an-, auf-, aus-, bei-, ein-, fort-, her-, hin-, los-, mit-, nach-, nieder-, vor-, weg-, weiter-, zu-, zurück-, zusammen-, entgegen- |
| Beide | 7 | durch-, hinter-, über-, um-, unter-, wider-, wieder- |

**5 lessons:** Was sind Vorsilben? · Trennbar oder untrennbar? · Die untrennbaren Vorsilben · Die trennbaren Vorsilben · Die Wechselpräfixe.

**Exercise integrity rules (enforced by `validate-prefixes.py`):**
- Near-synonym prefixes never appear together as options: ab/weg/fort, ver/zer, miss/ver, an/zu, durch/über, zurück/wieder, mit/zusammen, mit/bei, weiter/fort, nieder/ab, entgegen/wider, her/hin.
- `select_prefix`: no distractor may form a real verb with the same meaning as the target.
- `select_prefix`: prefix + root must literally reconstruct the answer verb (this check caught `missgelingen` / `missgefallen`, where miss- replaces ge- — both dropped from the drill pool).
- Core feelings must be globally unique, or `select_feeling` cannot have one right answer.

**localStorage keys:** `app_grammar_prefix_lessons`

**Build phases:**
1. ~~Data architecture~~ ✅ Session 37
2. ~~Lessons content~~ ✅ Session 37
3. ~~Exercise generation + validation~~ ✅ Session 37
4. ~~Engine + UI~~ ✅ Session 37
5. ~~QA + deploy~~ ✅ Session 37 — 49 headless checks pass. Commit `ec4891c`, pushed and live (v14).
6. Reconciliation into `verbs.json` — v15, not started

**Full PRD:** `PRD_Vorsilben.md`

---

## Grammatik Curriculum Layer (Verbs)

*PRD signed off: Session 25. All phases complete. Live.*

**Concept:** Grammar lessons woven into Verbs module. Lesson completion soft-gates the corresponding exercise category.

**6 lessons:**

| # | Lesson | Gates |
|---|---|---|
| 1 | Verb Basics | Stammverben Präsens |
| 2 | Regular Conjugation (Präsens) | Stammverben Präsens |
| 3 | Trennbare Verben | Variationen |
| 4 | Modal Verben | Modal exercises |
| 5 | Vergangenheit — Perfekt | Perfekt exercises |
| 6 | Vergangenheit — Präteritum | Präteritum exercises |

**Build phases:**
1. ~~Data + architecture~~ ✅ Session 26
2. ~~Lesson screen + Grammatik strip~~ ✅ Session 27
3. ~~Quiz engine (rule_check MC, scoring, pass/fail)~~ ✅ Session 32
4. ~~Unlock gating~~ ✅ Session 32
5. ~~Content (6 lessons × 5 rule_check questions)~~ ✅ already in lessons.json
6. ~~QA + deploy~~ ✅ Session 32

**Full PRD:** `PRD_Grammatik.md`

---

## Next Steps

**Up next (in rough priority):**
- ~~Verify the judgement calls against a dictionary~~ — **done, Session 39** for separability, auxiliary and Partizip II. `durchgehen` corrected.
- **Verify the 22 case calls** — the half `verify-variants.py` deliberately does not cover. Needs a valency source (DWDS Wortprofil, or Duden), not Wiktionary prose. Same rule: never route it through Ricco.
- ~~Decide what to do about the 11 AMBIGUOUS verbs~~ — **done, Session 39b.** Taught explicitly in Lesson 5. **Residual gap, accepted:** a learner drilling `umfahren` in the **Verbs** module still meets it cold — Lesson 5 lives in Vorsilben, with no gating or cross-link. Closing that needs a card note or a link, which was the option not chosen.
- **`entgegenlaufen` and `herreichen` have no Wiktionary page** — both filed by derivation only. Check against Duden, or drop them.
- **Sentence-builder English is weak for adverbial complements** — "We want to overflow almost." (`überlaufen`), "I have to befall to him." (`widerfahren`). The German is fine; the English gloss line is not. Affects a handful of intransitive variants.
- **Device QA** on the new verb variants and on the Vorsilben module — usability only (does it look right, does it feel right), never correctness.
- **Remaining 121 prefix verbs** whose root is also missing from `verbs.json` (entsorgen, hintertreiben, niederknien…) — a future Wörter intake, not a reconciliation.
- Ricco to confirm two flagged sheet entries: "Aufziele" (→ abzielen?) and "kindersinne" (skipped)
- Next Wörter intake when the sheet grows (diff against `_factory/intake-log.json`)
- Lesen & Hören — more years: run crawler on 2025, 2024 archives; re-bundle listening-data.js
- Prepositions C1/C2 expansion — architecture ready; add entries with `"cefr": "C1"`
- Deklinationen expansions (later): stem-changers, Komparativ/Superlativ declension, adjectival nouns, case filter

**Known open items:**
- ~~Prefix verb variants inherit parent root's `grammar.case_requirements`~~ — **resolved Session 38 (v16).** Variants may carry their own override and `_verbMetaBadge()` prefers it; `verstehen` now shows Akkusativ.
- ~~Vorsilben quiz bugfix is not retroactive~~ — resolved Session 38. `migrateMisfiledQuizResults()` recovers those results on first load after v15.
- Deklinationen not yet QA'd on device (headless-tested only) — Ricco to try a session on the phone; check inline input + Android keyboard behavior.
- Prepositions not in Word List Practice mode (no unlock mechanic — by design).
- `.git` repo lives inside Google Drive folder — causes stale lock files (HEAD.lock, index.lock) that block commits. Must `rm .git/*.lock` from Terminal before committing. Long-term: move repo outside Drive.

---

## DW Crawler — How to Add More Years

**Status: built and run. 45 articles from 2026 archive complete.**

1. Find the archive URL for the target year at `https://learngerman.dw.com` → Top-Thema → Archiv
2. Update `ARCHIVE_URL` in `crawler.py`
3. Run: `export ANTHROPIC_API_KEY="sk-ant-..." && python3 crawler.py`
4. Verify: `content/listening/index.json` — new articles with `"status": "complete"`

The crawler deduplicates by slug — articles already complete are skipped. The article structure is consistent across DW years; if a year's archive page has a different layout, run `python3 probe_article.py` first.
