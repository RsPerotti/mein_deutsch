# Mein Deutsch — Source of Truth
*Last updated: 2026-07-09 — Session 36 (Adjektiv-Deklinationen — v13 live)*

---

## Current State

**9 modules built and live.** App at https://rsperotti.github.io/mein_deutsch (v13).

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
| `data/modules.json` | ✅ Updated | 9 modules active: + Ausdrücke (Expressions). |
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
| `service-worker.js` | ✅ v13 | Cache-first. Precaches all JS/CSS including particles-data.js, grammar-data.js, article-grammar-data.js, declension-data.js. Range request handler for audio. |
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

**Total exercises: ~5,494 across 8 modules + Deklinationen area + Artikel (dynamic queue from unlocked nouns).**

---

## Hosting & Git

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` → GitHub Pages auto-deploys
- **Auth:** SSH (`~/.ssh/id_ed25519`, ed25519). Remote: `git@github.com:RsPerotti/mein_deutsch.git`
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
- Ricco to confirm two flagged sheet entries: "Aufziele" (→ abzielen?) and "kindersinne" (skipped)
- Next Wörter intake when the sheet grows (diff against `_factory/intake-log.json`)
- Lesen & Hören — more years: run crawler on 2025, 2024 archives; re-bundle listening-data.js
- Prepositions C1/C2 expansion — architecture ready; add entries with `"cefr": "C1"`
- Deklinationen expansions (later): stem-changers, Komparativ/Superlativ declension, adjectival nouns, case filter

**Known open items:**
- Prefix verb variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Fix: add per-variant `grammar` override field. Deferred.
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
