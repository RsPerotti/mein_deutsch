# Mein Deutsch — Source of Truth
*Last updated: 2026-06-14 — Session 32 (Grammatik curriculum complete — live)*

---

## Current State

**7 modules built. Partikeln module complete (all phases).** App at https://rsperotti.github.io/mein_deutsch.

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
| `js/grammar.js` | ✅ Updated | `Grammar` + `ParticleGrammar` singletons. `openParticleLesson()`, `renderParticleLesson()`, `startParticleQuiz()` stub. `openLesson()` sets module flag to prevent bleed. |
| `js/progress.js` | ✅ Updated | All localStorage keys: root/variant split for nouns, adjectives, prepositions difficulty, articles read. |
| `js/wordlist.js` | ✅ Updated | Adjectives. Case dot helpers. Verb cards show case dots. |
| `js/wordpractice.js` | ✅ Built | Adjektive class in WLP_CLASSES picker. |
| `js/data.js` | ✅ Bundled | `window.APP_DATA`. 2,075 verb exercises (992 Präsens + 1,083 Vergangenheit). 188 parenthetical hints stripped. |
| `js/listening-data.js` | ✅ Built | `window.LISTENING_DATA`. 45 articles, transcripts + vocabulary. 212 KB. |
| `js/listening.js` | ✅ Built | Article list, reader, vocab highlighting, audio caching, read-state. |
| `js/particles-data.js` | ✅ Updated | `window.PARTICLES_DATA`. 34 particles + 510 exercises + 8 lessons. **244 KB. Content-reviewed (Phase 6).** |
| `js/grammar-data.js` | ✅ Built | `window.GRAMMAR_DATA` — Verbs grammar lessons bundled. |
| `data/modules.json` | ✅ Updated | 7 modules active: Verbs, Nouns, Adjectives, Adverbs, Prepositions, Listening, Particles. |
| `data/verbs.json` | ✅ 91 root verbs | Audited. 23 moves/removes, 14 new bases added. |
| `data/nouns.json` | ✅ 175 nouns | A1–B2. 97 roots + 78 variations. |
| `data/adverbs.json` | ✅ 127 adverbs | A1–B2 complete. |
| `data/adjectives.json` | ✅ 100 adjectives | A1–B2 (25 per level). |
| `data/prepositions.json` | ✅ 53 prepositions | A1–B2. Categories: two-way, akkusativ, dativ, genitiv. |
| `data/particles.json` | ✅ 34 particles | Core (A1–B2) + Advanced (C1–C2). Per-particle: signals, position, 3 examples, contrast note, related. |
| `data/exercises/exercises-verbs.json` | ✅ 2,075 exercises | 992 Präsens + 1,083 Vergangenheit. All have `tense` field. |
| `data/exercises/exercises-nouns.json` | ✅ 525 exercises | 175 × 3. |
| `data/exercises/exercises-adverbs.json` | ✅ 508 exercises | 127 × 4. |
| `data/exercises/exercises-adjectives.json` | ✅ 400 exercises | 100 × 4. |
| `data/exercises/exercises-prepositions.json` | ✅ 158 exercises | 79 select_preposition + 79 select_case. |
| `data/exercises/exercises-particles.json` | ✅ 510 exercises | 34 × 15. **Content-reviewed (Phase 6) — 0 integrity errors.** |
| `data/grammar/lessons.json` | ✅ Built | 6 Verbs grammar lessons. |
| `data/grammar/particle-lessons.json` | ✅ Built | 8 Particles grammar lessons (4 sections + 5 quiz questions each). |
| `service-worker.js` | ✅ v7 | Cache-first. Precaches all JS/CSS including particles-data.js. Range request handler for audio. |
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

---

## Content Progress

| Module | Scope | Items | Exercises | Status |
|---|---|---|---|---|
| Verbs | A1–B2 | 91 root + 157 variants | 2,075 | ✅ Complete |
| Nouns | A1–B2 | 175 (97 roots + 78 variants) | 525 | ✅ Complete |
| Adverbs | A1–B2 | 127 | 508 | ✅ Complete |
| Adjectives | A1–B2 | 100 | 400 | ✅ Complete |
| Prepositions | A1–B2 | 53 | 158 | ✅ Complete |
| Listening | 2026 | 45 articles | — | ✅ Complete |
| Particles | A1–C2 | 34 | 510 | ✅ Complete |

**Total exercises: ~4,176 across 7 modules.**

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
- Articles module — gender-pattern rules approach (reimagined)
- Articles module — gender-pattern rules approach (reimagined)
- Deklinationen area for Adjectives
- Lesen & Hören — more years: run crawler on 2025, 2024 archives; re-bundle listening-data.js
- Prepositions C1/C2 expansion — architecture ready; add entries with `"cefr": "C1"`

**Known open items:**
- Prefix verb variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Fix: add per-variant `grammar` override field. Deferred.
- Adjectives Deklinationen card is a placeholder — exercises and UI not yet built.
- Prepositions not in Word List Practice mode (no unlock mechanic — by design).

---

## DW Crawler — How to Add More Years

**Status: built and run. 45 articles from 2026 archive complete.**

1. Find the archive URL for the target year at `https://learngerman.dw.com` → Top-Thema → Archiv
2. Update `ARCHIVE_URL` in `crawler.py`
3. Run: `export ANTHROPIC_API_KEY="sk-ant-..." && python3 crawler.py`
4. Verify: `content/listening/index.json` — new articles with `"status": "complete"`

The crawler deduplicates by slug — articles already complete are skipped. The article structure is consistent across DW years; if a year's archive page has a different layout, run `python3 probe_article.py` first.
