# Day Log — Mein Deutsch

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
