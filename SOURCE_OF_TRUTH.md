# Mein Deutsch — Source of Truth
*Last updated: 2026-08-26 — Session 37 (Vorsilben module — v14 live)*

---

## Current State

**10 modules built and live.** App at https://rsperotti.github.io/mein_deutsch (v14).

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
| `data/verbs.json` | ✅ 149 root verbs + 154 variants | Session 35: +49 roots, +16 variants (intake #1). |
| `data/nouns.json` | ✅ 230 nouns | 152 roots + 78 variations. Session 35: +55 roots (intake #1). |
| `data/adverbs.json` | ✅ 139 adverbs | Session 35: +12 (new categories: Indefinites, Place & Direction, Connectors additions). |
| `data/adjectives.json` | ✅ 136 adjectives | Session 35: +36 (intake #1). |
| `data/prepositions.json` | ✅ 53 prepositions | A1–B2. Categories: two-way, akkusativ, dativ, genitiv. |
| `data/particles.json` | ✅ 34 particles | Core (A1–B2) + Advanced (C1–C2). Per-particle: signals, position, 3 examples, contrast note, related. |
| `data/exercises/exercises-verbs.json` | ✅ 2,644 exercises | Session 35: +569. New words: 8-exercise package (9 for roots). |
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
| `service-worker.js` | ✅ v14 | Cache-first. Precaches all JS/CSS including particles-data.js, prefixes-data.js, grammar-data.js, article-grammar-data.js, declension-data.js. Range request handler for audio. |
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
| Vorsilben content rule | Exercises are never invented — the generator derives every item from a reviewed worked example in `prefixes.json`, and the validator holds an independent copy of the near-synonym exclusion table. Regenerate + validate via `_factory/*-prefixes.py`. |
| Vorsilben vocabulary | Self-contained. Detail cards flag which examples already exist in `verbs.json` ("im Verbmodul"). Full reconciliation deferred to v15 — see Next Steps. |
| Deklination v1 exclusions | Stem-changers (dunkel/hoch/teuer), indeclinables (rosa/lila), Komparativ/Superlativ declension, adjectival nouns. |

---

## Content Progress

| Module | Scope | Items | Exercises | Status |
|---|---|---|---|---|
| Verbs | A1–B2 | 149 roots + 154 variants | 2,644 | ✅ Complete |
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
- **Auth:** HTTPS with a personal access token embedded in the remote URL in `.git/config` (NOT SSH — this entry was stale until Session 37). ⚠️ Token sits in plaintext inside the Drive-synced folder; scheduled for rotation.
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
- **Rotate the GitHub token.** `.git/config` holds a classic PAT in plaintext in the remote URL, inside the Drive-synced folder. Not in the repo (`.git/config` is untracked) but it is in cloud storage. Rotate at github.com/settings/tokens, then re-set the remote — ideally via SSH or a credential helper rather than an embedded token.
- **Device QA on Vorsilben** — headless only so far. Check the `select_feeling` option buttons, which wrap to multiple lines on a 430px screen.
- **v15 — Vorsilben ↔ Verbs reconciliation (Phase 6).** Of the 342 reference verbs: 79 already exist in `verbs.json`, **142 are missing but their root verb exists** (add as `prefix_variants`, ~1,100 new exercises, `data.js` rebundle), 121 have no root either (logged for a future Wörter intake). Fix the per-variant `grammar` override in the same pass — see Known open items.
- Ricco to confirm two flagged sheet entries: "Aufziele" (→ abzielen?) and "kindersinne" (skipped)
- Next Wörter intake when the sheet grows (diff against `_factory/intake-log.json`)
- Lesen & Hören — more years: run crawler on 2025, 2024 archives; re-bundle listening-data.js
- Prepositions C1/C2 expansion — architecture ready; add entries with `"cefr": "C1"`
- Deklinationen expansions (later): stem-changers, Komparativ/Superlativ declension, adjectival nouns, case filter

**Known open items:**
- Prefix verb variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Fix: add per-variant `grammar` override field. **Scheduled for v15 Phase 6**, which rewrites `prefix_variants` anyway.
- Vorsilben quiz bugfix is not retroactive: users who completed Partikeln / Artikel / Deklinationen lessons before v14 will see them as incomplete, because those results were written into the wrong store. No migration written — low stakes, single user. Redo the quiz to restore the green dot.
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
