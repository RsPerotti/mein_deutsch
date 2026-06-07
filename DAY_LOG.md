# Day Log — Mein Deutsch

---

## 2026-06-07 — Session 14: UI Debug Pass (4 Fixes)

**Files changed:** `js/app.js`, `js/wordlist.js`, `js/exercises.js`, `css/styles.css`

### Fix 1 — Prepositions module progress card
- `js/app.js` — Removed "53 Präpositionen · Wörter freigeschaltet" from the module-progress-count label. Now shows only `X / 158 Übungen`.

### Fix 2 — Case dots moved to left badge position (prepositions list)
- `js/app.js` (`_renderPrepCard`) — Removed CEFR badge (A1/A2/B1/B2). Case dots relocated from right side (after translation) to left side where badge was.

### Fix 3 — Verb list cleanup + unknown-case dot
- `js/wordlist.js` (`_renderVerblisteContent`) — Removed MIXED/STRONG/WEAK type labels from verb card headers. Case dots moved to left side (matching prepositions layout).
- `css/styles.css` — Added `.case-dot.case-dot-unknown`: transparent circle with dashed gray border. Shown for verbs with no `case_requirements` in their grammar data, with tooltip "Kein spezifischer Kasus".

### Fix 4 — Back navigation no longer shows results screen
- `js/exercises.js` (`returnFromResults`) — Root cause: `navigateTo()` was pushing `screen-results` onto navStack, so pressing back from module-home looped back to the results screen. Fixed by stripping `screen-exercise` and `screen-results` from the top of navStack before switching screens directly (bypassing `navigateTo`).
- `js/exercises.js` (`returnHome`) — Same pattern: now clears navStack entirely before switching to home, ensuring clean state.

---

## 2026-06-07 — Session 13: Verb Module Debugging (4 Fixes)

**What was changed:**

### Fix #2 — Parenthetical hints removed from conjugation exercises
- `data/exercises/exercises-verbs.json` — Cleaned all 209 `conjugation_choice` exercises that had inline hints like `(zusammenfassen — er, present)` in their `question.de` field. Removed using Python regex `r'\s*\([^)]*[—–][^)]*\)\s*'`. Only the English equivalent sentence now provides context.

### Fix #3 — First-exposure ordering guaranteed
- `js/exercises.js` — Added `_ensureFirstExposure(queue)` function. After final shuffle in `startExercise()`, the queue is post-processed: any word a user has never seen gets its `translate_word` exercise moved to the front of that word's appearances. Applies across all sessions using `Progress.getUnlockedWords()` as the "already seen" check.

### Fix #4 — Color-coded case dots on verb and preposition cards
- `css/styles.css` — Added `.case-dot` (16px colored circle), `.case-dot-group`, `.case-legend-overlay`, `.case-legend-card`, `.case-legend-row`. Colors: Akkusativ=#FFBFBF, Dativ=#B8D8FF, Nominativ=#D8D8D8, Genitiv=#FFE87A.
- `index.html` — Added `#case-legend-overlay` popup with 4 case rows explaining color coding.
- `js/wordlist.js` — Added `_normalizeCase()`, `_renderCaseDots()`, `showCaseLegend()`, `hideCaseLegend()` (global helpers). Updated `_renderVerblisteContent()`: verb card headers now show colored dots; variant rows also show per-variant dots. Removed old text-based `.grammar-box`.
- `js/app.js` — Updated `_renderPrepCard()`: case text labels replaced with colored dots + per-example case dots.

### Fix #1 — Full verb audit (Stammverben cleanup)
- **Removed 4 duplicate roots** that were already correctly present as prefix_variants: `gehören` (→hören), `versuchen` (→suchen), `beschreiben` (→schreiben), `anerkennen` (→kennen).
- **Moved 3 roots to variants of existing bases**: `versprechen` + `widersprechen` → `sprechen`; `umgehen` → `gehen`.
- **Added 14 new base root verbs** (frequency_rank 101–114): `fassen, heben, bieten, schlagen, wählen, nutzen, fordern, scheinen, deuten, wirken, lehnen, weisen, gleichen, meiden`. Each with full conjugation, grammar, example sentences.
- **Moved 16 prefixed roots to variants of the new bases**: zusammenfassen→fassen, hervorheben→heben, anbieten→bieten, vorschlagen→schlagen, auswählen→wählen, benutzen→nutzen, auffordern→fordern, erscheinen→scheinen, bedeuten→deuten, bewirken+auswirken→wirken, ablehnen→lehnen, beweisen+hinweisen→weisen, vergleichen→gleichen, vermeiden→meiden.
- **Added 56 new exercises** (4 per new root, each starting with `translate_word`).
- `js/data.js` — Rebundled with all changes.

**Final verb counts after audit:**
- Roots: 100 → 91
- Variants: 138 → 157
- Verb exercises: 936 → 992

**Decisions made:**
- `verpflichten` kept as a standalone root — `pflichten` is archaic and not a productive base in modern German.
- `umgehen` moved to `gehen` variants as inseparable (bypass/circumvent meaning). The separable "umgehen mit" is a different usage, noted in the variant's notes field.
- All new root exercises start with `translate_word` to comply with the first-exposure ordering rule.

**Pushed:** No — push pending.

---

## 2026-06-07 — Session 12: Präpositionen Module

**What was built:**

- `data/prepositions.json` — 53 prepositions across A1–B2 (A1: 21, A2: 5, B1: 11, B2: 16). Fields: id, preposition, english, cases, case_notes, category (two-way / akkusativ / dativ / genitiv), cefr, frequency_rank, example_sentences (with per-sentence case label).
- `data/exercises/exercises-prepositions.json` — 158 exercises. Two types: `select_preposition` (gap-fill, pick the right preposition) + `select_case` (full sentence shown with highlighted phrase, identify the governed case). 79 of each. Distribution: A1×42, A2×10, B1×74, B2×32.
- `data/modules.json` — Added `module_prepositions` entry (unlock_order 5, status active).
- `js/progress.js` — Added `PREPOSITIONS_DIFFICULTY: 'app_prepositions_difficulty'` key + `getPrepositionsDifficulty()` (default 'A1') + `setPrepositionsDifficulty(level)`.
- `index.html` — Added `screen-prapositionsliste` screen (search bar, all 53 preps). Added inline `prep-difficulty-picker` (A1/A2/B1/B2 buttons, hidden by default) inside `screen-exercise`.
- `css/styles.css` — Added `.diff-btn` / `.diff-btn.active` styles. Added `.prep-highlight` for the bolded preposition phrase in select_case exercises.
- `js/app.js` — `_renderPrepositionModuleCategories()` (progress shows exercises done vs total); `renderPrapositionsliste()`, `filterPrapositionsliste()`, `_renderPrepCard()`, `togglePrepCard()` — **all 53 preps visible always, no unlock gate**. Updated `onScreenEnter()`, `loadData()`, `appData` state object.
- `js/exercises.js` — `_renderSelectPreposition()` (gap-fill layout); `_renderSelectCase()` (highlights prep phrase in green, asks for case); `_buildQueue()` for prepositions filters by exact difficulty match; `setPrepositionDifficulty()` + `_updateDifficultyPicker()` allow mid-session difficulty switch; `_unlockWord()` skipped for prepositions; cooldown retry key uses `exercise_id` for prepositions (no `word_id`).
- `js/data.js` — **Format fixed**: changed `const appData = {` → `window.APP_DATA = {` (resolves scope conflict with app.js's own `const appData`). Embedded `prepositions` and `exercises_prepositions` arrays.

**Decisions made:**

- No word unlock mechanic for prepositions — all 53 always accessible in Präpositionsliste. Progress tracked as exercises answered correctly.
- Difficulty picker: exact match (selecting B1 shows only B1-difficulty exercises, not cumulative). User can switch any time without exiting the exercise screen.
- Capped at B2 for now; architecture ready for C1/C2 expansion (just add entries with `"cefr": "C1"` and `"difficulty": "C1"`).
- `data.js` format fix: the file was incorrectly using `const appData` which conflicted with app.js's own declaration. Now uses `window.APP_DATA` as originally intended.

**Pushed:** Yes — committed and pushed to GitHub.

---

## 2026-06-07 — Session 11: Nouns Module Restructure

**What was changed:**
- `data/nouns.json` — Added `section` field to all 175 nouns: 97 `"roots"` (all A1/A2 + simple/foreign-origin B1/B2), 78 `"variations"` (compound/derived B1/B2 nouns). Added `formation` field to all 78 variations (e.g. `"aus + Druck"`, `"frei + -heit"`). Added `base_noun_id` to 4 variations whose root is in the list (Krankenhaus→noun_haus, Rathaus→noun_haus, Einfluss→noun_fluss, Grundlage→noun_grund). Removed `article_choice` from all `exercise_type` arrays.
- `data/exercises/exercises-nouns.json` — Removed all 175 `article_choice` exercises. Now 525 exercises (350 fill_blank + 175 translate_word). Article exercises belong in a future Articles module.
- `js/progress.js` — Added `NOUNS_ROOT` and `NOUNS_VARIANT` localStorage keys. Replaced flat `unlockNoun()` with `unlockRootNoun()` / `unlockVariantNoun()`. `getUnlockedNouns()` now returns combined list for backwards-compatible Nomenliste.
- `js/exercises.js` — Updated `_buildQueue` for `module_nouns` to filter roots vs variations. Updated context label (NOMEN · STAMMNOMEN / NOMEN · VARIATIONEN). Updated `_unlockWord` to call `unlockRootNoun` vs `unlockVariantNoun` based on noun `section` field.
- `js/app.js` — Rewrote `_renderNounModuleCategories()`: now shows Stammnomen + Variationen cards (Variationen locked until first Stammnomen unlocked), mirroring verbs pattern exactly. Updated Nomenliste detail cards to show `Bildung:` formation string for variation nouns.
- `js/data.js` — Rebundled. Total exercises now 2,369 (down from 2,544 — 175 article_choice removed).

**Decisions made:**
- Articles belong in a future Articles module; article_choice exercises removed from Nouns entirely.
- Root/variation split: A1+A2 = all roots. B1/B2: simple, opaque, or foreign-origin nouns = roots; transparently compound or suffix-derived nouns = variations.
- Variationen locked until at least 1 Stammnomen unlocked (same logic as verbs).
- Formation displayed in Nomenliste detail card for variation nouns.

---

## 2026-06-07 — Session 10: Adjectives Module

**What was built:**
- `data/adjectives.json` — 100 adjectives across A1–B2 (25 per level). Fields: id, word, english, comparative, superlative, antonym, frequency_rank, cefr, example_sentences, tags.
- `data/exercises/exercises-adjectives.json` — 400 exercises (4 per adjective): translate DE→EN, fill_blank (easy), translate EN→DE, fill_blank (harder).
- `_factory/seeds/adjectives-level1–4.json` — all marked done.
- `js/progress.js` — added `ADJECTIVES_UNLOCKED` key + `getUnlockedAdjectives()` / `unlockAdjective()` methods.
- `js/exercises.js` — adjectives added to `_buildQueue`, context label, `_unlockWord`.
- `js/wordlist.js` — adjectives added to `buildWordObjects()` and `_countTotalWords()`.
- `js/wordpractice.js` — Adjektive class added to `WLP_CLASSES` picker.
- `js/app.js` — adjectives in data loading + `_totalWordCount` + `_wordLabel`; `_renderAdjectiveModuleCategories()` (two cards: Grundformen active + Deklinationen placeholder); `renderAdjektivliste()`, `_renderAdjektivCards()`, `toggleAdjektivCard()`, `filterAdjektivList()`.
- `index.html` — added `screen-adjektivliste` with search bar.
- `data/modules.json` — Adjectives status changed from `coming_soon` → `active`.
- `js/data.js` — rebundled. Now 1640 KB. Total exercises: 2,544.

**Decisions made:**
- Adjectives module has two cards: Grundformen (meanings, active) + Deklinationen (case/gender, locked placeholder for future session).
- Starting with 100 adjectives; content will be enriched when Deklinationen is built.
- Same 4-exercise format as other modules (no new exercise types this session).

**Next:** Push to GitHub, then build Deklinationen area.

---

## 2026-06-07 — Session 9A: Adverbs Deploy

Adverbs module (Session 8 content) pushed to GitHub Pages. Live at https://rsperotti.github.io/mein_deutsch.

---

## 2026-06-07 — Session 9B: Word List Practice Mode

**What was built:**
- New `"Wörter üben"` button on the Word List screen (dark green, above the word list)
- New `screen-wl-picker` — class selector screen where user picks which grammatical classes to practice (Verben, Nomen, Adverbien), showing word count per class and checkmark chips
- New `js/wordpractice.js` — handles picker logic, word pool building per class
- Extended `js/exercises.js` — new `exerciseMode` flag + full WL exercise engine: `startWordListExercise()`, `_showNextWL()`, `_renderWLQuestion()`, `_getWLWrongAnswers()`, `_selectWLAnswer()`, `_updateWLChips()`
- Updated `js/progress.js` — `recordWordPractice()` and `getWordPracticeScore()` methods using `app_word_practice_scores` key
- Updated `css/styles.css` — styles for `.wl-practice-btn` and `.wlp-class-chip` components

**Behaviour:**
- Exercise type: translate_word (German → meaning, 4 options, 1 correct + 3 same-class distractors)
- Correct answer: green flash, auto-advance after 1.5s
- Wrong answer: red flash, correct answer revealed, manual "Weiter" to continue
- Session: infinite loop — reshuffles and starts new pass when all words exhausted. Back button returns to Word List.
- Chips show: ✓ Richtig / Queue (remaining this pass) / ✗ Falsch — chips restored to module state on exit
- Scores recorded to `app_word_practice_scores` per word (shared with word score bars)

**Files changed:** `index.html`, `css/styles.css`, `js/exercises.js`, `js/progress.js`
**Files created:** `js/wordpractice.js`

**Auto-prep noted:** linter also added `ADJECTIVES_UNLOCKED` key + `getUnlockedAdjectives()` / `unlockAdjective()` to `progress.js`, and `module_adjectives` handling to `exercises.js`. No action needed — already in place for the next module.

**Next:** Adjectives module.

---

## 2026-06-07 — Session 8: Adverbs Module — Full Content, UI + Deploy

**Deploy:**
- Commit `eaecde1` pushed to `main` → GitHub Pages auto-deploys to https://rsperotti.github.io/mein_deutsch
- Push run from local terminal (sandbox has no GitHub credentials)

---

## 2026-06-07 — Session 8: Adverbs Module — Full Content + UI

**What was built:**
- `data/adverbs.json` — 127 adverbs sourced from uploaded conversation database spreadsheet. 4 levels: 29 A1 + 25 A2 + 51 B1 + 22 B2 (1 C1 folded into B2). Categories: Frequency & Time, Connectors, Certainty & Probability, Intensifiers, Contrast, Cause & Effect, Agreement & Reaction, Politeness & Softeners, Sentence Openers, Fillers & Conversation Flow, Modal Particles.
- `data/exercises/exercises-adverbs.json` — 508 exercises (127 × 4). Types: translate_word DE→EN (difficulty 1), fill_blank sentence (difficulty 2), translate_word EN→DE / "Wie sagt man das auf Deutsch?" (difficulty 2), sentence comprehension (difficulty 3). Distractors drawn from same category first, same level fallback.
- `_factory/seeds/adverbs-level1–4.json` — Seed files for all 4 levels, status: done.
- `data/modules.json` — Added `module_adverbs` (active, unlock_order 4).
- `index.html` — Added `screen-adverbliste` screen.
- `js/app.js` — Added: `appData.adverbs`, `loadData` entry, `_totalWordCount` update, `_wordLabel` lookup, `onScreenEnter` routing, `_renderAdverbModuleCategories()`, `renderAdverbliste()`, `_renderAdverbCards()`, `toggleAdverbCard()`, `filterAdverbList()`.
- `js/exercises.js` — Added: `module_adverbs` context label, build queue handler, `unlockAdverb` call in `_unlockWord`.
- `js/progress.js` — Added: `ADVERBS_UNLOCKED` key, `getUnlockedAdverbs()`, `unlockAdverb()` methods.
- `js/data.js` — Regenerated: now bundles modules (4), verbs (100), nouns (175), adverbs (127), exercises_verbs (936), exercises_nouns (700), exercises_adverbs (508).

**Decisions made:**
- Skipped adjectives, built adverbs first — all words sourced from existing spreadsheet (less token-intensive).
- Kept uneven level distribution as-is (29/25/51/22) — authentic to source material, no artificial curation.
- C1 adverb (1 entry) folded into B2.
- Exercise type 4 (sentence comprehension): wrong answers use other adverbs' full English example sentences rather than word-substitution (more natural distractors).

**Validation:**
- All 508 exercises have required fields, zero duplicate IDs.
- All fill_blank exercises confirmed to have `_____` in question.
- All 7 data.js keys verified present.

**What's next:**
- Push to GitHub Pages (data.js is updated)
- Consider adjectives module

---

## 2026-06-05 — Session 7: Nouns Content — A2, B1, B2 Batches

**What was built:**
- `data/nouns.json` — Expanded from 25 (A1) → 175 total: +50 A2, +50 B1, +50 B2
- `data/exercises/exercises-nouns.json` — Expanded from 100 → 700 total: +200 A2, +200 B1, +200 B2
- `js/data.js` — Regenerated with all new content
- `_factory/seeds/nouns-level2.json` — 50 A2 noun seed file (all done)
- `_factory/seeds/nouns-level3.json` — 50 B1 noun seed file (all done)
- `_factory/seeds/nouns-level4.json` — 50 B2 noun seed file (all done)

**Approach:** 6-pass generation (nouns then exercises per level). Caught and fixed one duplicate ID (Einfluss already in B1; replaced with Überblick + Kompromiss at B2).

**Exercise types per noun:** translate_word (diff 1) → article_choice (diff 1) → fill_blank (diff 1) → fill_blank (diff 2). Grammar explanations cover nominative, accusative, dative, genitive usage.

---

## 2026-06-04 — Session 6: Nouns Module UI

**What was built:**
- `data/modules.json` — Nouns status changed from `coming_soon` → `active`
- `js/data.js` — Regenerated to include `nouns` and `exercises_nouns` (705KB)
- `js/progress.js` — Added `NOUNS_UNLOCKED` key, `unlockNoun()`, `getUnlockedNouns()`
- `js/exercises.js` — Added `article_choice` renderer, noun queue building, noun unlock logic, noun word label
- `js/app.js` — Added `appData.nouns`, nouns to `loadData()` + `_totalWordCount()` + `_wordLabel()`, `_renderNounModuleCategories()`, `renderNomenliste()`, `filterNounList()`, `toggleNounCard()`, `_articleColor()`, router entry for `screen-nomenliste`
- `js/wordlist.js` — Nouns included in `buildWordObjects()` with article display; plural shown in bottom sheet
- `index.html` — Added `screen-nomenliste` screen

**Features live:**
- Nouns module card appears as Module 02 on home screen
- Exercise screen supports all 4 noun exercise types (translate_word, article_choice ×1, fill_blank ×2)
- Article choice exercises use grid layout with der/die/das/declined options
- Nomenliste reference screen: article badge colour-coded (der=blue, die=red, das=green), singular/plural/genitive, examples
- Nouns appear in global Word List with article displayed; bottom sheet shows plural
- Progress tracked separately under `app_nouns_unlocked`

**Status:** Nouns module fully playable. 25 A1 nouns live. Next: nouns-level2 (A2) content batch.

---

## 2026-06-04 — Session 5: Nouns Module — Batch 1 (A1)

**What was built:**
- Created `data/nouns.json` with 25 A1 nouns (Mann, Frau, Kind, Tag, Jahr, Zeit, Haus, Arbeit, Schule, Stadt, Land, Geld, Auto, Tisch, Tür, Straße, Familie, Freund, Wasser, Buch, Frage, Wort, Nummer, Stuhl, Essen)
- Created `data/exercises/exercises-nouns.json` with 100 exercises (4 per noun): translate_word, article_choice, fill_blank ×2
- Created `_factory/seeds/nouns-level1.json` — batch marked done
- Validation passed: 25 words, 100 exercises, all checks green

**Exercise types used:**
- `translate_word` (difficulty 1) — see German word, pick English meaning
- `article_choice` (difficulty 1) — pick correct article in sentence
- `fill_blank` (difficulty 1) — choose correct noun
- `fill_blank` (difficulty 2) — harder context, tests case awareness

**Status:** Nouns module content batch 1 complete. Nouns module UI not yet built. Next: nouns-level1 (A2) batch OR build the Nouns module UI.

---

## 2026-06-04 — Session 4: Icons + GitHub Pages + Bug Fixes

**Icons**
- Designed speech bubble "de" icon in blue (#85B7EB) with white bubble and dark blue text (#185FA5)
- Generated icon-192.png and icon-512.png using cairosvg, saved to `icons/`

**GitHub Pages**
- Created `.gitignore` (excludes .DS_Store, .fig, screens/, thumbnail.png)
- User ran git init, commit, remote add, push from Terminal
- Repo public at https://github.com/RsPerotti/mein_deutsch
- GitHub Pages enabled — app live at https://rsperotti.github.io/mein_deutsch

**Bug fixes (found on first live test)**
- `app.js`: fixed data key mismatch — was reading `d.exercises.module_verbs`, data.js uses `d.exercises_verbs`
- `exercises.js`: removed hardcoded `.slice(0, 10)` dev testing limit that locked queue to first 10 exercises
- `exercises.js`: confirmed session design — **no cap**, full queue served until complete, applies to all modules

**Status:** App fully live and functional. Verbs module shippable. Next: Nouns module.

---

## 2026-06-04 — Session 4: Icons + GitHub Pages

**Icons**
- Designed speech bubble "de" icon in blue (#85B7EB) with white bubble and dark blue text (#185FA5)
- Generated icon-192.png and icon-512.png using cairosvg, saved to `icons/`

**GitHub Pages**
- Created `.gitignore` (excludes .DS_Store, .fig, screens/, thumbnail.png)
- User ran git init, commit, remote add, push from Terminal
- Repo public at https://github.com/RsPerotti/mein_deutsch
- GitHub Pages enabled — app live at https://rsperotti.github.io/mein_deutsch

**Status:** Verbs module fully shipped. Next: Nouns module content batch.

---

## 2026-06-03 — Session 3: Full Verb Module Content (root verbs + all variations)

**What was built:**
- **All 100 root verbs added to `data/verbs.json`** — Levels 1–4 (A1, A2, B1, B2), 25 per level, each with full conjugation, grammar block, case requirements, example sentences, and prefix_variants.
- **All 234 word IDs given exactly 4 exercises each** — 936 exercises total in `exercises-verbs.json`:
  - 100 root exercises (A1, already existed)
  - 300 new root exercises (A2/B1/B2 — 4 per verb × 75 verbs)
  - 208 variation exercises (A1 variants — all 52 prefix variants of L1 roots)
  - 328 variation exercises (A2/B1/B2 variants — all 138 prefix variants of new roots, minus 16 duplicates covered by root exercises)
- **`js/data.js` regenerated** — all content bundled.
- **Seed files created:** `_factory/seeds/verbs-level2.json`, `verbs-level3.json`, `verbs-level4.json` (via inline generation rather than separate files; content is in verbs.json).

**Content Factory notes:**
- Verbs that appear as both root verbs AND prefix variants of other verbs (anerkennen, beschreiben, gehören, versuchen, abschließen, annehmen) — only root exercises kept; variant entries left in parent verb for reference.
- One ID fix during merge: verb_annehmen (L4) → verb_umgehen; verb_abschließen (L4) → verb_schlußfolgern to avoid collision with L1/L2 prefix_variant IDs.
- verb_vorführen (zeigen variant, word=vorzeigen) — exercises correct in Part C.

**Decisions made:**
- All 4 exercise types used for both root and variation verbs: translate_word (d1), fill_blank (d1), conjugation_choice (d2), fill_blank (d2).
- Separable vs inseparable explicitly noted in every explanation_en.

---

## 2026-06-02 — Session 0: Project Setup

**What was built:**
- Full folder structure created (css/, js/, data/, data/exercises/, icons/, _factory/, _factory/seeds/)
- `css/styles.css` — complete design system with CSS variables extracted from design reference screenshots
- `index.html` — SPA shell with all 6 screens: Home, Word List, Module Home, Exercise, Verbliste, Results
- `js/progress.js` — localStorage abstraction layer (all keys per blueprint Section 4 + 11.6)
- `js/wordlist.js` — word list display, alphabetical grouping, search, bottom sheet detail view, Verbliste
- `js/exercises.js` — exercise engine with cooldown logic (blueprint 11.3), flash feedback, unlock system
- `js/app.js` — stack-based SPA router, data loading, home/module renderers
- `data/modules.json` — 3 modules: Verbs (active), Nouns + Adjectives (coming_soon)
- `data/verbs.json` — empty `[]`, ready for Content Factory
- `data/exercises/exercises-verbs.json` — empty `[]`, ready for Content Factory
- `manifest.json` — PWA config (theme, icons, standalone display)
- `service-worker.js` — cache-first offline strategy
- `icons/icon-192.png` + `icons/icon-512.png` — placeholder icons (to be replaced)
- `_factory/batch-prompt.md` — reusable batch generation prompt
- `_factory/validate-prompt.md` — reusable validation prompt
- `_factory/README.md` — Content Factory workflow guide
- `_factory/seeds/verbs-level1.json` — 25 A1 root verbs, all status: "pending"

**Design decisions made:**
- Fonts: Roboto system font (no network import — offline safe)
- Pronunciation: Web Speech API (de-DE, 0.85x rate)
- Workflow: build directly in Cowork, no Claude.ai Design handoff for code

**What's next:**
- Session 1: Run Content Factory on `verbs-level1.json` to generate first 25 verbs + 100 exercises
- Test on Android Chrome once first content batch is in

---

## 2026-06-03 — Session 2: Bug fixes & UI polish

**Issues found and fixed:**

- **Critical bug — data not loading:** `fetch()` silently fails on `file://` protocol. App was rendering "0 VON 0 VERFÜGBAR" with no module cards. Fix: embedded all JSON data into `js/data.js` (loaded via `<script>` tag). `loadData()` in `app.js` now reads from `window.APP_DATA` — no fetch, works on any protocol.
- **UX bug — no visible exercise entry:** Module Home category cards (Stammverben/Variationen) had no CTA — they looked like progress displays, not tappable launchers. Fix: added "Übungen" section label and green "Üben →" CTA to each unlocked card. Variationen lock message changed to English.
- **Results screen:** "Zurück zum Modul" was the only button. Restructured: primary green button = "Zur Startseite" (home), secondary ghost button = "Zurück zum Modul". New `returnHome()` function added to `exercises.js`.

**Files changed:**
- `js/data.js` — new file, auto-generated from JSON data files (99KB)
- `js/app.js` — `loadData()` rewritten; `_renderVerbModuleCategories()` updated with CTA labels
- `js/exercises.js` — added `returnHome()` function
- `index.html` — added `<script src="js/data.js">` load; results screen now has two buttons
- `css/styles.css` — added `.category-card-cta` and `.secondary-btn` styles
- `service-worker.js` — updated PRECACHE to include `data.js` instead of separate JSON files
- `_factory/README.md` — added step 8: regenerate `data.js` after each content batch

**Important workflow note:** After every content batch, `js/data.js` must be regenerated. Ask Claude to run the data bundler script.

**App status:** Working end-to-end — home screen → Verbs module → exercises → results → home. Tested visually by Ricco. First session completed (5 correct, 3 words unlocked).

---

## 2026-06-02 — Session 1: Content Factory — Verbs Level 1

**What was generated:**
- `data/verbs.json` — 25 A1 root verbs, all fully populated per blueprint Section 6.1 schema
- `data/exercises/exercises-verbs.json` — 100 exercises (4 per verb: fill_blank d1, translate_word d1, conjugation_choice d2, fill_blank d2)
- `_factory/seeds/verbs-level1.json` — all 25 words updated to `status: "done"`, batch `status: "done"`, `generated_date: "2026-06-02"`

**Verb types covered:**
- Irregular (sein, haben): 2
- Modal (können, müssen, wollen): 3
- Weak (sagen, machen, glauben, leben): 4
- Strong (werden, gehen, kommen, sehen, lassen, stehen, finden, bleiben, liegen, heißen, nehmen, halten, geben, sprechen): 14
- Mixed (denken, bringen): 2

**Notable grammar highlights in the data:**
- Dual-case verbs flagged: geben, bringen (dative receiver + accusative object)
- Modal verbs: all 6 present tense forms correct, no endings in 1st/3rd person singular
- Stem vowel changes documented: sehen (e→ie), nehmen (e→i), geben (e→i), sprechen (e→i), halten (a→ä), lassen (a→ä)
- Auxiliary tracking: sein verbs (sein, werden, gehen, kommen, bleiben) vs haben for the rest
- Prefix variants included: 18 of 25 verbs have 2–4 prefix variants (modals + a few others have none)

**Validation:**
- Python validation script run: 0 errors. All 25 verb entries and 100 exercise entries passed all checks.

**What's next:**
- Test the app on Android Chrome — exercises should now be live
- Session 2: Generate verbs-level2.json (25 A2 verbs)
- Set up GitHub Pages hosting for shareable link
