# Mein Deutsch — Source of Truth
*Last updated: 2026-06-13 — Session 29-C (Partikeln Phase 3 complete, pushed to live)*

---

## Current State

**6 modules live. UI cleaned up.** App at https://rsperotti.github.io/mein_deutsch. Home screen uses 2-column grid cards. Module homes show title in nav-context, merged progress+list card. Lesen & Hören has pill buttons (toggle + read). **Pushed to GitHub — Session 18c complete.**

**Vergangenheit Phase 2 COMPLETE.** Three new exercise type handlers added to `js/exercises.js`: `partizip_ii` (text input), `auxiliary_choice` (2-button MC), `conjugation_table` (6-row table, tense-parameterised for Präsens/Präteritum/Perfekt). 1,083 new exercises generated (248 partizip_ii + 248 auxiliary_choice + 587 conjugation_table). All exercises have a `tense` field for Phase 3 tab filtering.

**Vergangenheit Phase 3 COMPLETE.** Präsens/Vergangenheit tab toggle live on Verbs module home. Perfekt/Präteritum sub-picker shown in exercise session when tenseContext = 'vergangenheit'. Regular/Irregular pill + case badge rendered on every verb exercise card. Tense filtering verified clean (0 bleed in both directions). Known limitation: prefix variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Phase 4 enhancement item. **Next: Phase 4 — spaced repetition / scoring system.** See `PRD_Vergangenheit.md`.

## What Exists

| File / Folder | Status | Notes |
|---|---|---|
| `index.html` | ✅ Updated | Screens: Home, Word List, Module Home, Exercise, Verbliste, Nomenliste, Adverbliste, Adjektivliste, **Präpositionsliste**, **Listening List**, **Listening Reader**, Results. Static module progress card removed from Module Home. |
| `css/styles.css` | ✅ Updated | Full design system. Added `.home-modules-grid`, `.module-card-grid`, `.pill-toggle-btn`, `.pill-read-btn`. Old `.listening-toggle-btn`, `.listening-read-btn` (circle) replaced. |
| `js/app.js` | ✅ Updated | Module cards: 2-column grid, no icons, no eyebrow. Nav-context shows module title in caps. All 5 word module renderers: merged unlocked-count+list card. Prepositions: Niveau text removed from exercise card. **Phase 3: `_verbTenseTab` state + `setVerbTenseTab()`; tense-tab toggle in `_renderVerbModuleCategories()`; tenseContext passed to `openExercise()`.** **Hotfix: load order changed to prefer `exercises.module_verbs` (2,075) over stale `exercises_verbs` (936).** **Session 24: History API wired into `navigateTo()` + `popstate` listener for Android gesture back.** **Session 29-B: `appData.particles`, `_particlesCefr`, `_particlesGramOpen` state, particles loading in `loadData()`, `module_particles` icon, `renderModuleHome()` updated, `_renderParticleModuleCategories()`, `setParticlesCefr()`, `_renderParticlesGrammatikStrip()`, `toggleParticlesGrammatikAccordion()`, `openPartikelliste()` stub.** |
| `js/progress.js` | ✅ Updated | Root/variant split for nouns. Adjectives key. **Prepositions difficulty key** (`app_prepositions_difficulty`). **`app_articles_read` key** + `markArticleRead` / `isArticleRead` / `getReadArticles`. |
| `js/exercises.js` | ✅ Updated | Nouns, adjectives, **prepositions** in queue builder. Two new renderers: `select_preposition`, `select_case`. Inline difficulty switcher. **`_ensureFirstExposure()`** guarantees translate_word is first for new words. **Parenthetical hints removed from all conjugation exercises.** **`returnFromResults` + `returnHome` fix nav stack bug.** **Phase 2: `partizip_ii`, `auxiliary_choice`, `conjugation_table` handlers + `checkPartizipII()` + `submitConjugationTable()`.** **Phase 3: `startExercise()` reads tenseContext; `_buildQueue()` filters by tense; `setVerbTense()` + `_updateVerbTensePicker()`; `_verbMetaBadge()` injects Regular/Irregular + case badge.** **Session 24: `_showResults()` replaced with `returnFromResults()` in both call sites — results screen no longer shown.** |
| `js/wordpractice.js` | ✅ Built | Adjektive class in WLP_CLASSES picker |
| `js/wordlist.js` | ✅ Updated | Adjectives in buildWordObjects(). **Case dot helpers** (`_normalizeCase`, `_renderCaseDots`, `showCaseLegend`, `hideCaseLegend`). Verb cards show case dots on left; MIXED/STRONG/WEAK labels removed; dotted gray circle for verbs with no case. |
| `data/modules.json` | ✅ Updated | **7 modules**: Verbs + Nouns + Adjectives + Adverbs + Prepositions + Listening + **Particles** (all active) |
| `js/data.js` | ✅ **Bundled** | Format: `window.APP_DATA = {…}`. All content embedded. **Total verb exercises: 2,075 (992 existing Präsens + 1,083 new Vergangenheit). Phase 1 data: `prateritum` + Perfekt on all 248 verbs. Phase 2: all new exercises bundled with `tense` field for tab routing. Session 24: 188 parenthetical hints stripped from `question.de` fields.** |
| `js/listening-data.js` | ✅ **New** | Format: `window.LISTENING_DATA = {module, articles[]}`. 45 articles with transcripts + vocabulary. 212 KB. |
| `js/listening.js` | ✅ **New** | Article list renderer, reader, vocab highlighting, audio caching, read-state. |
| `data/verbs.json` | ✅ **91 root verbs** | Audit complete. 23 moves/removes, 14 new bases added. |
| `data/exercises/exercises-verbs.json` | ✅ **2,075 exercises** | 992 Präsens exercises + 1,083 new Vergangenheit (248 partizip_ii + 248 auxiliary_choice + 587 conjugation_table). All new exercises have `tense` field. |
| `manifest.json` | ✅ Built | PWA config |
| `service-worker.js` | ✅ Updated | **v4.** Cache-first. PRECACHE includes listening-data.js + particles-data.js + listening.js. Caches `/content/listening/` on first access. Range request handler for audio. **Deploy rule: bump CACHE version on every push that changes JS/CSS.** |
| `icons/` | ✅ Done | icon-192 + icon-512, speech bubble "de", #85B7EB |
| `data/nouns.json` | ✅ **175 nouns** | A1–B2. 97 roots + 78 variations. `section` + `formation` fields. |
| `data/exercises/exercises-nouns.json` | ✅ **525 exercises** | 175 × 3 (fill_blank ×2 + translate_word ×1) |
| `data/adverbs.json` | ✅ **127 adverbs** | A1–B2 complete |
| `data/exercises/exercises-adverbs.json` | ✅ **508 exercises** | 127 × 4 each |
| `data/adjectives.json` | ✅ **100 adjectives** | A1–B2 complete (25 per level) |
| `data/exercises/exercises-adjectives.json` | ✅ **400 exercises** | 100 × 4 each |
| `data/prepositions.json` | ✅ **53 prepositions** | A1–B2. Categories: two-way, akkusativ, dativ, genitiv. case_notes + example_sentences per entry. |
| `data/exercises/exercises-prepositions.json` | ✅ **158 exercises** | 79 select_preposition + 79 select_case. Difficulty: A1×42, A2×10, B1×74, B2×32. |
| `data/grammar/lessons.json` | ✅ **New** | 6 lessons with sections, key_rules, and quiz questions (rule_check + exercise_ref). Lesson 1 has no unlock target; lessons 2–6 each gate a category. |
| `js/grammar-data.js` | ✅ **New** | `window.GRAMMAR_DATA` — lessons array bundled for offline use. Generated from lessons.json. |
| `js/grammar.js` | ✅ **Updated** | `Grammar` object: `getLessonState()`, `setLessonState()`, `isComplete()`, `markStarted()`, `recordQuizResult()`, `isCategoryUnlocked()`, `init()` migration. `PASS_THRESHOLD = 0.8`. **Session 27: added `renderGrammarLesson()`, `openLesson()`, `startGrammarQuiz()` stub, `renderGrammatikStrip()`, `toggleGrammatikAccordion()`, `_grammatikOpen`.** |

## Design System

- **Background:** `#EDE9E1` (warm beige)
- **Surface:** `#FFFFFF` (white cards)
- **Green dark:** `#2D4A1A` (accent, text, progress bars)
- **Green accent:** `#3D6020` (labels, links)
- **Green lime:** `#8DC44A` (hero card, success button)
- **Layout:** `--max-w: 430px` / `--page-x: 16px` (updated Session 24 for Pixel 8 Pro)
- **Typography:** Roboto (system font on Android, fallback to system sans)

## Active Decisions

| Decision | Value |
|---|---|
| App name | Mein Deutsch |
| Platform | Android PWA (Chrome "Add to Home Screen") |
| Fonts | Roboto system font (no import — offline safe) |
| Pronunciation | Web Speech API (`speechSynthesis`, `de-DE`) |
| Exercises per word | 4 (blueprint rule) |
| Default sort | Alphabetical |
| Session size | **No cap** — full queue served until complete. Applies to all modules. |
| Adjectives scope | 100 adjectives (25 per level A1–B2); more to be added when Deklinationen area is built |
| Prepositions difficulty | Exact match (selecting B1 shows only B1 exercises). Default: A1. Changeable mid-session. |
| Prepositions unlock | None — all 53 always accessible in Präpositionsliste. No word unlock mechanic. |
| Prepositions CEFR cap | B2 (C1/C2 reserved in architecture for future expansion) |

## Content Progress

| Batch | Category | Level | Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1–4 | Verbs | A1–B2 | **91 root + 157 variants** | **992** | ✅ Audited |
| nouns-level1 | Nouns | A1 | 25 | 100 | ✅ Done |
| nouns-level2 | Nouns | A2 | 50 | 200 | ✅ Done |
| nouns-level3 | Nouns | B1 | 50 | 200 | ✅ Done |
| nouns-level4 | Nouns | B2 | 50 | 200 | ✅ Done |
| adverbs-level1–4 | Adverbs | A1–B2 | 127 | 508 | ✅ Done |
| adjectives-level1 | Adjectives | A1 | 25 | 100 | ✅ Done |
| adjectives-level2 | Adjectives | A2 | 25 | 100 | ✅ Done |
| adjectives-level3 | Adjectives | B1 | 25 | 100 | ✅ Done |
| adjectives-level4 | Adjectives | B2 | 25 | 100 | ✅ Done |
| **Adjectives total** | | A1–B2 | **100** | **400** | ✅ Done |
| prepositions | Prepositions | A1–B2 | 53 | 158 | ✅ Done |

## Total app content: 2,583 exercises across 5 modules

## Hosting

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` branch → GitHub Pages auto-deploys

## Git / GitHub Setup

- **Auth method:** SSH (set up 2026-06-12). Password authentication no longer works on GitHub.
- **SSH key:** `~/.ssh/id_ed25519` (ed25519, linked to rsperotti@gmail.com)
- **Remote URL:** `git@github.com:RsPerotti/mein_deutsch.git` (SSH, not HTTPS)
- **To push:** `git push origin main` — no password prompt, works automatically

## Partikeln Module

*PRD signed off: 2026-06-13 — Session 28. Phase 1 complete: Session 29. Phase 2 complete: Session 29-B.*

**Concept:** Standalone 7th module. Teaches German particles — the words (doch, mal, ja, wohl, eigentlich, gar, etc.) that make speech sound natural. Two tiers: Core (A1–B2) and Advanced (C1–C2). First module in the app to include C1/C2 content.

**Two areas:**
1. **Category exercises** — fill-in-the-blank sentences, CEFR level filter (default A1), same UX as Prepositions
2. **Grammar curriculum** — 8 category lessons (soft-gated) + "Alle Partikeln" reference lookup per particle

**Content:**

| Tier | Categories | Particles |
|---|---|---|
| Core (A1–B2) | Softening & Requesting / Shared Knowledge & Attitude / Probability & Concession / Gradation & Focus / doch answer particle | ~22 |
| Advanced (C1–C2) | Nuanced Connectors / Emphasis & Register | ~13 |

**Key decisions:**
- Soft gate (recommend lesson, don't force)
- **15 exercises per particle** (~525 total) — single-answer integrity is the top constraint
- No auto-advance on correct answer — particle feedback card shown after every answer
- Particle feedback card: lime left border + subtle green tint, particle name + category + context explanation
- Per-particle reference card: signals, position, 3 examples, contrast note, related particles
- eben and halt = two separate entries with contrast note cross-referencing each other
- "Alle Partikeln" = fixed button at top of module home
- TTS pronunciation: skipped (flat TTS misleads on particles where intonation carries meaning)

**Files built (Phase 1):** `data/particles.json` ✅, `data/exercises/exercises-particles.json` ✅, `data/grammar/particle-lessons.json` ✅, `js/particles-data.js` ✅ (326 KB, `window.PARTICLES_DATA`). SW bumped to v4.
**Files updated (Phase 2):** `data/modules.json` ✅, `index.html` ✅, `css/styles.css` ✅ (`.particles-alle-nav-btn`, `.particles-cefr-picker`, `.particles-tier-header`), `js/app.js` ✅ (particles loading, icon, module home renderer, CEFR filter state, grammatik strip, openPartikelliste stub)
**Files updated (Phase 3):** `index.html` ✅ (CEFR picker in exercise screen), `css/styles.css` ✅ (`.particle-feedback-card`), `js/exercises.js` ✅ (fill_blank_particle renderer + feedback card + CEFR-aware queue + particles selectAnswer path), `js/app.js` ✅ (CEFR range badges on category cards), `service-worker.js` ✅ (v5)
**New localStorage keys:** `app_particles_lesson`, `app_particles_cefr` (default `A1`)
**Full PRD:** `PRD_Partikeln.md`

**Module home layout:**
- `#particles-alle-nav-btn` lives in nav-header (always visible, outside scroll area)
- Summary card + CEFR pills + Grammatik accordion in scroll area
- Core section: 4 cards (modal-softening / modal-attitude / modal-probability / gradation-focus), each showing CEFR range badge
- Advanced section: 2 cards (nuanced-connectors / emphasis-register)
- CEFR filter: stores to localStorage, wired to exercise queue (Phase 3 ✅)
- Grammatik lessons: all locked (progress wired in Phase 4)

**Exercise flow (fill_blank_particle):**
- Sentence rendered with `___` blank, 4 grid options (shuffled)
- On any answer → `.particle-feedback-card` shown immediately (particle + category label + full feedback)
- No auto-advance on correct — always requires manual "Weiter →"
- CEFR-aware empty state if filter/category mismatch (shows available levels)

**CEFR coverage per category:**
- modal-softening, modal-attitude, gradation-focus: A1, A2, B1
- modal-probability: A2, B1
- nuanced-connectors: B2, C1
- emphasis-register: B2, C1, C2

**Build phases (8–10 sessions est.):**
1. ~~Data architecture~~ ✅ Session 29
2. ~~Module home + CEFR filter~~ ✅ Session 29-B
3. ~~Exercise engine (fill_blank_particle renderer + particle feedback card)~~ ✅ Session 29-C
4. Grammar lessons (reuse Verbs renderer, soft gate prompt)
5. Per-particle reference screen
6. Content review pass
7. QA + deploy

---

## Grammatik Curriculum Layer

*PRD written: 2026-06-13 — Session 25. Status: signed off. Build not yet started.*

**Concept:** Structured grammar curriculum woven into the Verbs module. Users complete a lesson (explanation + quiz) to unlock the corresponding exercise category. Lessons are always visible and freely accessible — no locks between lessons, only between lesson completion and the exercise content it gates.

**6 lessons (Verbs v1):**

| # | Lesson | Unlocks |
|---|---|---|
| 1 | Verb Basics | Stammverben → Präsens exercises |
| 2 | Regular Conjugation (Präsens) | Stammverben Präsens exercises |
| 3 | Trennbare Verben | Variationen (separable prefix variants) |
| 4 | Modal Verben | Modal verb exercises |
| 5 | Vergangenheit — Perfekt | Vergangenheit → Perfekt exercises |
| 6 | Vergangenheit — Präteritum | Vergangenheit → Präteritum exercises |

**Decided:**
- Pass threshold: 80% (16/20)
- Quiz length: variable per lesson, capped at 20
- Retry policy: unlimited
- Lesson visibility: all visible and freely accessible (no prereq gating between lessons)
- Existing users: auto-granted "complete" on first load for lessons whose content they already have progress in

**New files when built:** `data/grammar/lessons.json`, `js/grammar.js`
**New localStorage key:** `app_grammar_lessons`
**Full PRD:** `PRD_Grammatik.md`

**Build phases:**
1. ~~Data + architecture (lessons.json schema, grammar.js, localStorage keys, migration)~~ ✅ Session 26
2. ~~Lesson screen (explanation renderer, key rules, Start Quiz CTA, Grammatik strip on Verbs home)~~ ✅ Session 27
3. Quiz engine (rule_check + exercise_ref types, scoring, pass/fail)
4. Unlock gating (exercise category lock state on Verbs module home, unlock on pass)
5. Content (write all 6 lessons — MOSTLY DONE in Session 26 stub; Session 27 review pass)
6. QA + deploy

---

## Next Steps

*Updated: 2026-06-13 — Session 25*

**Vergangenheit — all phases complete:**
1. ~~Phase 1: Präteritum data — root verbs~~ ✅ Session 21
2. ~~Phase 1: Perfekt + Präteritum data — prefix variants~~ ✅ Session 21
3. ~~Phase 2: Exercise engine~~ ✅ Session 22
4. ~~Phase 3: UI toggle~~ ✅ Session 23
5. ~~Phase 4: Verification + QoL~~ ✅ Session 24

**Known open item (Vergangenheit):**
- Prefix variants inherit parent root's `grammar.case_requirements` — `verstehen` shows Irregular with no case badge (should be Akkusativ). Fix: add per-variant `grammar` override field. Deferred.

**After Vergangenheit:**
- **Grammatik curriculum layer — PRD signed off ✅. Ready to build. See "Grammatik Curriculum Layer" section above.**
- **Partikeln module — PRD signed off ✅. Ready to build. See "Partikeln Module" section above.**
- Articles module reimagined with gender-pattern rules
- Deklinationen area for Adjectives
6. **Lesen & Hören — more years** — run crawler on 2025, 2024 archives; re-bundle listening-data.js
7. **Prepositions C1/C2 expansion** — architecture ready; just add entries with `"cefr": "C1"` and `"difficulty": "C1"`

---

## DW Crawler — How to Add More Years

**Status: built and run. 45 articles from 2026 archive complete.**

To add articles from a previous year (2025, 2024, etc.):

**Step 1 — Find the archive URL for that year**
Go to `https://learngerman.dw.com` → Top-Thema → Archiv → select the year. Copy the URL. It will look like:
`https://learngerman.dw.com/de/top-thema-mit-vokabeln-archiv-2025/a-XXXXXXXX`

**Step 2 — Add it to crawler.py**
Open `crawler.py`. At the top, `ARCHIVE_URL` is set to the 2026 archive. Change it to the new year's URL, or (better) add a `--year` flag to support multiple years.

For a quick one-off, just change the line temporarily:
```python
ARCHIVE_URL = "https://learngerman.dw.com/de/top-thema-mit-vokabeln-archiv-2025/a-XXXXXXXX"
```

**Step 3 — Run the crawler**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
python3 crawler.py
```

The crawler deduplicates by slug — articles already in `index.json` with status `"complete"` are skipped automatically. New articles are added alongside existing ones.

**Step 4 — Verify**
Check `content/listening/index.json` — new articles should appear with `"status": "complete"`.

**Notes:**
- The article content structure (Apollo state, vocab format) is consistent across years on DW — the crawler should work without changes.
- If a year's archive page has a different layout, run `python3 probe_article.py` (pointing at a sample URL from that year) to check the HTML before running the full crawl.
- Re-run cadence is manual — there's no scheduled task. Run whenever you want to add new content.

---

## Feature: DW Crawler — Reading & Listening Comprehension

*Designed: 2026-06-07 — Session 16*

### Purpose

A standalone Python script that crawls Deutsche Welle's "Top-Thema mit Vokabeln" archive, extracts structured content (audio, transcript, vocabulary with English translations), and saves it locally so the app can serve a new Reading & Listening Comprehension module — fully offline.

### Source URL

Archive entry point (2026): `https://learngerman.dw.com/de/top-thema-mit-vokabeln-archiv-2026/a-75204525`

Each article on the archive page links to an article detail page. From there, a top-right chevron menu exposes sub-pages. The crawler targets two of them:

| Sub-page | What we need |
|---|---|
| **Manuskript** | Full text transcript + inline vocabulary words with German explanations |
| **Extras** | Direct MP3 audio file URL (under "Audios und Videos zur Lektion") |

### What the Crawler Captures per Article

1. **Audio file** — MP3 downloaded locally. Source: Extras sub-page. Stored offline to avoid broken URLs if DW changes their CDN paths.
2. **Transcript** — Full text of the Manuskript, stored as a plain string.
3. **Vocabulary** — Inline words in the transcript that have pop-up definitions. For each:
   - The word itself
   - The German explanation (as shown on DW)
   - An English translation of that explanation (via Claude API)

### File Structure

```
German Learning App/
└── content/
    └── listening/
        ├── index.json                        ← master article list + crawl status
        └── articles/
            └── {article-slug}/
                ├── data.json                 ← transcript, vocabulary, metadata
                └── audio.mp3
```

### `index.json` Schema

```json
[
  {
    "id": "ein-kleines-stuck-rembrandt",
    "title": "Ein kleines Stück Rembrandt",
    "url": "https://learngerman.dw.com/de/...",
    "date": "2026-01-15",
    "status": "complete"
  }
]
```

`status` values: `"complete"` | `"failed"` | `"partial"`. The crawler skips any article with `"complete"` on subsequent runs (deduplication). Failed/partial articles are retried automatically.

### `data.json` Schema (per article)

```json
{
  "id": "ein-kleines-stuck-rembrandt",
  "title": "Ein kleines Stück Rembrandt",
  "url": "https://learngerman.dw.com/de/...",
  "crawled_at": "2026-06-07T10:00:00",
  "audio_file": "audio.mp3",
  "transcript": "Full transcript as a single plain-text string...",
  "vocabulary": [
    {
      "word": "das Gemälde",
      "explanation_de": "Ein Bild, das mit Farbe auf eine Fläche gemalt wurde",
      "explanation_en": "A painting made with color on a surface"
    }
  ]
}
```

### Technical Architecture

**Language:** Python 3.10+

**Key libraries:**
- `playwright` (headless Chromium) — DW pages are JavaScript-rendered; `requests` alone won't work. Playwright renders the page fully before scraping.
- `anthropic` — Claude API SDK for translating German vocabulary explanations to English.
- `pathlib`, `json`, `re` — standard library for file management and parsing.

**Why Playwright over requests/BeautifulSoup:** DW's site renders content via JavaScript. A plain HTTP request returns a near-empty HTML shell. Playwright launches a headless browser, waits for the DOM to fully load, then reads the rendered content.

**Claude API usage — cost control:** All vocabulary explanations for a single article are batched into one Claude API call (not one call per word). The prompt passes all German explanations as a structured list and asks for English translations in return. This keeps API costs minimal.

**Deduplication logic:**
1. On startup, the script loads `index.json`.
2. For each article URL on the archive page, it checks if a matching `id` exists in the index with `"status": "complete"`.
3. If yes → skip. If no or status is `"failed"` / `"partial"` → process.
4. After successfully saving `data.json` and `audio.mp3`, the index entry is updated to `"complete"`.

**Error handling:** If any step fails for an article (network error, missing audio, API failure), the article is marked `"failed"` in the index and the script continues to the next. Partial data is not saved — a clean retry on next run.

**CLI interface:**
```bash
# Normal run — crawl all new articles, skip completed ones
python crawler.py

# Force re-crawl a specific article (ignores "complete" status)
python crawler.py --recrawl "ein-kleines-stuck-rembrandt"

# Dry run — list what would be crawled, don't fetch anything
python crawler.py --dry-run
```

**Environment variable required:**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### App Integration Plan (Post-Crawler)

Once the crawler is verified to produce correct output, a new module will be added to the app:

- **Entry point:** New card in the module list below Prepositions — "Lesen & Hören" (Reading & Listening)
- **List screen:** Shows all crawled article titles (sourced from `content/listening/index.json`)
- **Article screen:** Displays transcript with vocabulary words highlighted/tappable, plays audio via `<audio>` element pointing to local `audio.mp3`
- **Data loading:** Same pattern as existing modules — content bundled via `js/data.js` or loaded from local files depending on PWA offline strategy chosen at build time

### Scope

- **Initial crawl:** 2026 archive — ✅ complete (45 articles)
- **Expansion:** Previous years (2025, 2024, etc.) — see "DW Crawler — How to Add More Years" above
- **Re-run cadence:** Manual — run the script whenever new articles should be added

## Open Questions / Known Gaps

- Adjectives Deklinationen card is a placeholder — exercises and UI not yet built
- Articles module not yet started
- Pronunciation uses device TTS (no audio files) — acceptable for v1
- Prepositions not in Word List Practice mode (no unlock mechanic — by design)
- `verpflichten` remains a standalone root (base `pflichten` is archaic — left as-is by design)
- All sessions through 18c pushed to GitHub
