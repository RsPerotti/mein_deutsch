# Day Log — Mein Deutsch

---

## 2026-06-13 — Session 29-C: Partikeln Phase 3 — Exercise Engine

**Deliverables:**
- `index.html` — `#particles-cefr-picker-ex` div added to exercise screen (after prep-difficulty-picker). 6 pill buttons: A1–C2. Calls `setParticlesCefrInSession()`.
- `css/styles.css` — `.particle-feedback-card` (lime left border `#8DC44A`, `rgba(141,196,74,0.08)` tint, `#2D4A1A` text, shown after every answer)
- `js/exercises.js` — 7 additions:
  - `_buildQueue()`: particles case — filters by `category` + `cefr` (reads from localStorage)
  - `startExercise()`: particles context pill ("PARTIKELN · ERWEICHEN" etc.) + show/hide CEFR picker in exercise screen
  - `_showNext()`: `fill_blank_particle` type routed to new renderer
  - `_renderFillBlankParticle(ex)`: sentence + `___` blank + 4-option grid + `#particle-feedback-card` container
  - `selectAnswer()`: normalized to use `correct_answer ?? correct` and `exercise_id ?? id` (backward-compatible). Particles path: no auto-advance on correct, always shows feedback card, no `_unlockWord()`, no `addNeedsReview()`
  - `_showParticleFeedbackCard(ex, isCorrect)`: fills `#particle-feedback-card` with particle word, category label, full feedback explanation
  - `setParticlesCefrInSession(level)`: rebuilds queue with new CEFR, updates picker buttons, syncs localStorage
  - `_updateParticlesCefrPicker(level)`: toggles active class on exercise-screen picker buttons
  - CEFR-aware empty state: if category has no exercises at selected CEFR, shows which levels are available instead of generic message
- `js/app.js` — category cards now show CEFR range badge (A1–B1, B2–C1, etc.) so users know the right filter before tapping
- `service-worker.js` — bumped to v5

**Data verified:**
- Core categories (modal-softening, modal-attitude, gradation-focus): A1, A2, B1
- modal-probability: A2, B1
- nuanced-connectors: B2, C1
- emphasis-register: B2, C1, C2

**Exercise flow (fill_blank_particle):**
1. User taps category card on module home
2. CEFR filter already selected (default A1 or last saved)
3. `_buildQueue()` filters exercises by category + CEFR
4. If queue empty → CEFR-aware empty state with available levels
5. Sentence rendered with `___` blank, 4 options in grid layout
6. On any answer → particle feedback card shown immediately (no auto-advance)
7. User taps "Weiter →" to advance
8. Wrong answers → cooldown queue (max 2 retries)

**Pushed to live:** github.com/RsPerotti/mein_deutsch (v5)

---

## 2026-06-13 — Session 29-B: Partikeln Phase 2 — Module Home UI

**Deliverables:**
- `data/modules.json` — Partikeln added as 7th module (id: `module_particles`, unlock_order: 7)
- `index.html` — `particles-data.js` added to script load order; hidden `#particles-alle-nav-btn` added to `screen-module-home` nav-header (shown only when particles module is active)
- `css/styles.css` — New rules: `.particles-alle-nav-btn` (outline ghost, `#2D4A1A`, always-visible in nav-header), `.particles-cefr-picker` (pill filter row), `.particles-tier-header` / `.particles-tier-label` / `.particles-tier-badge` (Core/Advanced section dividers)
- `js/app.js` — 7 changes:
  - `appData.particles` array added
  - `_particlesCefr` + `_particlesGramOpen` state variables (localStorage-backed)
  - `loadData()` — loads particles + exercises from `window.PARTICLES_DATA`
  - `_moduleIcon()` — `module_particles` speech-bubble icon added
  - `renderModuleHome()` — `module_particles` case + show/hide of `#particles-alle-nav-btn`
  - `setParticlesCefr(level)` — saves to `app_particles_cefr` localStorage, re-renders
  - `toggleParticlesGrammatikAccordion()` — grammatik strip accordion handler
  - `_renderParticlesGrammatikStrip(lessons)` — renders all 8 lesson stubs (all locked; Phase 4 wires progress)
  - `_renderParticleModuleCategories()` — full module home: summary card, CEFR pills, grammatik strip, Core/Advanced tier sections, 4+2 exercise category cards
  - `openPartikelliste()` — placeholder (Phase 5)

**Layout:**
```
nav-header: [← back] [PARTICLES] [Alle Partikeln →]  ← always visible
scroll area:
  Summary card (34 particles, 510 exercises, progress bar)
  CEFR pills: A1 A2 B1 B2 C1 C2  (saves to localStorage; UI only until Phase 3)
  Grammatik accordion: 8 lesson stubs (all locked until Phase 4)
  ── Core · A1–B2 ──
  [Softening & Requests] [Attitude & Knowledge]
  [Probability]          [Gradation & Focus]
  ── Advanced · B2–C2 ──
  [Nuanced Connectors]   [Emphasis & Register]
```

**Phase 3 next:** `fill_blank_particle` exercise renderer, particle feedback card (lime left border + dark green text), no auto-advance on correct, CEFR filter wiring.

---

## 2026-06-13 — Session 29: Partikeln Phase 1 — Data Architecture

**Deliverables:**
- `data/particles.json` — 34 particle definitions (PRD listed ~35; ohnehin + sowieso are separate entries). Full schema per PRD: id, particle, category, cefr, tier, signals, position, examples ×3, contrast_note, related.
- `data/exercises/exercises-particles.json` — 510 exercises (15 per particle × 34 particles). Type: `fill_blank_particle`. Every exercise has exactly one unambiguous correct answer; distractors are plausible but clearly wrong in sentence context.
- `data/grammar/particle-lessons.json` — 8 lesson stubs matching `lessons.json` schema: id, title, order, module, unlocks, sections, key_rules, quiz (5 questions each).
- `js/particles-data.js` — `window.PARTICLES_DATA = { particles, exercises, lessons }`. 326 KB bundled.
- `service-worker.js` — bumped to v4, `particles-data.js` added to PRECACHE.

**Particle inventory:**
- Core (A1–B2, 20 particles): mal, ruhig, einfach, bloß, nur / ja, doch, auch, denn, etwa / wohl, schon, eigentlich, eben, halt / gar, wirklich, sogar, erst, noch
- Advanced (B2–C2, 14 particles): nämlich, allerdings, zwar, immerhin, jedenfalls, ohnehin, sowieso / ausgerechnet, überhaupt, wiederum, wenigstens, zumindest, bereits, freilich

**Exercise categories:** modal-softening, modal-attitude, modal-probability, gradation-focus, nuanced-connectors, emphasis-register

**Lesson structure:** 8 lessons — What Are Particles? / Softening & Requesting / Shared Knowledge & Attitude / Probability & Concession / Gradation & Focus / Doch—The Yes-to-No / Nuanced Connectors (C1) / Emphasis & Register (C2)

**Phase 2 next:** Module home — new module card, Core/Advanced sections, "Alle Partikeln" button, CEFR filter.

---

## 2026-06-13 — Session 28: Partikeln PRD

**Goal:** Start the Particles module. Interview Ricco, research particle taxonomy, write PRD.

**Decisions made:**
- Particles = standalone 7th module on home screen
- Two tiers: Core (A1–B2, ~22 particles) + Advanced (C1–C2, ~13 particles) — first module in the app to include C1/C2
- Exercise type: fill-in-the-blank (pick correct particle to complete a sentence), same CEFR level filter as Prepositions
- Grammar area: both category-based lessons (8 total) + per-particle reference lookup ("Alle Partikeln")
- Soft gate: recommend lesson before exercises, do not force it
- Exercise count: 4 per particle (blueprint rule), 1–2 bonus for high-frequency particles

**Particle taxonomy agreed:**
- Core: 5 categories (Softening & Requesting / Shared Knowledge & Attitude / Probability & Concession / Gradation & Focus / doch answer particle)
- Advanced: 2 categories (Nuanced Connectors / Emphasis & Register)

**Output:** `PRD_Partikeln.md` written and signed off.

**Decisions locked:**
1. 15 exercises per particle (~525 total) — single-answer integrity is the top constraint
2. "Alle Partikeln" = fixed button at top of module home
3. eben vs halt = two separate entries with contrast note cross-referencing each other
4. Particle feedback card: lime left border (`#8DC44A`) + subtle green tint (`rgba(141,196,74,0.08)`), particle name + category + context-specific explanation. Shown after every answer. No auto-advance on correct.
5. TTS pronunciation: skipped (flat TTS misleads on particles)

**Next session starter:**
> We're starting the Particles module build (Session 29). PRD signed off — read `PRD_Partikeln.md` and `SOURCE_OF_TRUTH.md` before starting. Begin Phase 1: data architecture.
>
> Phase 1 deliverables:
> 1. `data/particles.json` — all 35 particle definitions using the schema in the PRD. eben and halt are separate entries, each with a `contrast_note` pointing to the other.
> 2. `data/exercises/exercises-particles.json` — 15 fill_blank_particle exercises per particle (~525 total). Critical constraint: every exercise must have exactly one unambiguous correct answer — if two particles could fit a sentence, rewrite the sentence.
> 3. `data/grammar/particle-lessons.json` — 8 lesson stubs (same schema as `data/grammar/lessons.json`). Full lesson content can be placeholder for now; flesh out in Phase 6.
> 4. `js/particles-data.js` — bundle all three as `window.PARTICLES_DATA = { particles: [...], exercises: [...], lessons: [...] }`.
>
> Add `particles-data.js` to the SW precache list in `service-worker.js`. Bump the SW cache version.

---

## 2026-06-13 — Session 27: Grammatik Phase 2 — Lesson Screen + Grammatik Strip

**Goal:** Build the lesson screen renderer and surface the Grammatik section on the Verbs module home.

**What was built:**

**`index.html`** — New `screen-grammar-lesson` div. Standard nav-header with back button + `grammar-lesson-nav-context` span. Content area `grammar-lesson-content` populated by JS.

**`css/styles.css`** — New grammar styles appended:
- `.grammatik-strip` + `.grammatik-lesson-card` — strip on Verbs module home (clickable cards, `status-complete` variant has green border/tint)
- `.grammatik-lesson-status-icon` — 28px circle with lock/clock/checkmark, coloured per status
- Grammar lesson screen: `.grammar-lesson-body`, `.grammar-lesson-title`, `.grammar-section`, `.grammar-section-heading`, `.grammar-section-body`, `.grammar-example` (left border accent + italic DE + muted EN), `.grammar-key-rules` (card with `→` bullets), `.grammar-cta-area` (sticky bottom, gradient fade)

**`js/grammar.js`** — Three new functions appended:
- `openLesson(lessonId)` — sets `window._currentGrammarLessonId`, calls `navigateTo('screen-grammar-lesson')`
- `renderGrammarLesson(lessonId)` — full renderer: calls `Grammar.markStarted()`, builds sections + key_rules + CTA; CTA label differs for complete vs. not-yet-passed lessons
- `startGrammarQuiz(lessonId)` — Phase 3 stub (disables button, shows placeholder message)
- `renderGrammatikStrip()` — returns HTML for the 6-lesson strip; status icons (lock/clock/check SVG), status subtitles in German

**`js/app.js`** — Two changes:
- `onScreenEnter`: added `case 'screen-grammar-lesson'`
- `_renderVerbModuleCategories()`: injects `${renderGrammatikStrip()}` between the Verbliste summary card and the Übungen label

**Visible result:** Verbs module home now shows a "Grammatik" section with 6 lesson cards above the exercise categories. Tapping a card opens the lesson screen with full explanation, key rules, and a "Quiz starten" CTA. Existing users see all 6 cards as ✅ (auto-granted in Phase 1 migration). New users see 🔒.

**Accordion refactor (same session):**
Replaced the 6-card vertical strip with a single collapsible accordion card. Collapsed by default. Header shows "GRAMMATIK" label + "X / 6" completion badge + rotating chevron. Expanded body shows compact rows: coloured status dot (grey/amber/green) + lesson title + chevron. Open/closed state held in `_grammatikOpen` (resets on reload). Re-render on tense tab switch correctly restores open state.

Files changed: `css/styles.css` (replaced strip styles with `.grammatik-accordion`, `.grammatik-accordion-body`, `.grammatik-row`), `js/grammar.js` (rewrote `renderGrammatikStrip()`, added `toggleGrammatikAccordion()` + `_grammatikOpen`).

**Next session starter prompt:**
> We're on Phase 3 of the Grammatik layer (Session 28). Phases 1 and 2 are complete. Phase 3 is the quiz engine: tap "Quiz starten" on any lesson screen → launches a quiz using that lesson's `quiz[]` array. Two question types: `rule_check` (multiple choice, 4 options) and `exercise_ref` (renders an existing exercise from the exercise pool by ID). Scoring: track correct/total. On completion: show score, mark lesson complete if ≥ 80%, call `Grammar.recordQuizResult()`. On fail: option to retry or re-read. Read `SOURCE_OF_TRUTH.md` and `PRD_Grammatik.md` before starting.

---

## 2026-06-13 — Session 26: Grammatik Phase 1 — Data Layer + Architecture

**Goal:** Build the data and JS foundation for the Grammatik curriculum layer. No UI yet.

**Clarification resolved:**
- Lesson 1 (Verb Basics) is a pure intro — it has `"unlocks": []` (no exercise gate).
- Lesson 2 (Regular Conjugation) is the actual gate for Stammverben Präsens exercises.

**Files created:**

- `data/grammar/lessons.json` — 6 lessons with `sections[]`, `key_rules[]`, and `quiz[]` arrays. Quiz questions are a mix of `rule_check` (MC) and `exercise_ref` (references into the existing exercise pool). Content is substantive (not placeholders) — Phase 5 is now mostly review/polish rather than writing from scratch.
- `js/grammar-data.js` — `window.GRAMMAR_DATA` (bundled offline copy of lessons.json). Same pattern as `data.js` and `listening-data.js`.
- `js/grammar.js` — `Grammar` object with full localStorage abstraction:
  - Key: `app_grammar_lessons`
  - State schema: `{ status, score, attempts, auto_granted }` per lesson ID
  - `init()` migration: first run checks `app_verbs_root_unlocked`; if non-empty, marks all 6 lessons "complete" (existing user auto-grant); if empty, initialises all as "locked" (new user flow). Subsequent calls are no-ops.
  - `isCategoryUnlocked(categoryId)` — looks up gating lesson in GRAMMAR_DATA; returns true if complete (or if no lesson gates it).

**Files modified:**

- `index.html` — added `<script src="js/grammar-data.js">` and `<script src="js/grammar.js">` before `app.js`.
- `js/app.js` — added `Grammar.init()` call at top of `init()`, before rendering (idempotent).

**Unlock category IDs established (for Phase 4 gating):**
- `stammverben-prasens` → gated by `regular-conjugation`
- `variationen` → gated by `trennbare-verben`
- `modal-prasens` → gated by `modal-verben`
- `perfekt` → gated by `vergangenheit-perfekt`
- `prateritum` → gated by `vergangenheit-prateritum`

**Next session starter prompt:**
> We're on Phase 2 of the Grammatik layer (Session 27). Phase 1 is complete — data + architecture are live. Phase 2 is the lesson screen: a new `grammar-lesson` screen type in `index.html`, a renderer in `grammar.js` (or `app.js`) that displays the lesson sections + key_rules, and a "Start Quiz" CTA. Nav: tapping a lesson card (from the future Grammatik strip) navigates to this screen. Back arrow exits without gating. Reading a lesson calls `Grammar.markStarted()`. No quiz engine yet — the Start Quiz button can be a placeholder. Read `SOURCE_OF_TRUTH.md` and `PRD_Grammatik.md` before starting.

---

## 2026-06-13 — Session 25: Grammatik PRD

**Goal:** Design and sign off on the Grammatik curriculum layer.

**Decisions made:**
- Feature concept confirmed: structured grammar curriculum woven into Verbs module. Lessons gate exercise categories (completion required to unlock). Lessons themselves are always visible and freely accessible — no locks between lessons.
- 6 lessons defined (Verb Basics → Regular Conjugation → Trennbare Verben → Modal Verben → Perfekt → Präteritum), each unlocking a specific exercise category.
- Pass threshold: 80%. Retry: unlimited. Quiz length: variable, capped at 20.
- Existing users: auto-granted "complete" for lessons whose content they already have progress in.
- Quiz format: mix of rule-check MC and real exercises from existing pool.

**Files created:** `PRD_Grammatik.md`

**Next session starter prompt:**
> We're building the Grammatik curriculum layer for the Mein Deutsch app (Session 26). The PRD is signed off — read `PRD_Grammatik.md` and `SOURCE_OF_TRUTH.md` before starting. We're on Phase 1: data + architecture. That means: define `data/grammar/lessons.json` schema and stub the first lesson's data, create `js/grammar.js` with the localStorage key (`app_grammar_lessons`), and add the migration logic that auto-grants "complete" to existing users on first load. No UI yet — just the data layer and the unlock plumbing.

---

## 2026-06-13 — Session 24: QoL fixes + Phase 4 (Vergangenheit verification)

**Goal:** Phase 4 verification deferred — user confirmed app is working and shifted to quality-of-life fixes instead.

**Fixes shipped (5):**

**1. Service worker versioning (SW v3)**
Bumped `CACHE` from `'mein-deutsch-v2'` to `'mein-deutsch-v3'` in `service-worker.js`. Root cause of "progress loss": cache name was never bumped, so the browser never installed a new SW, meaning users kept running old cached JS after every push. Added a deploy note comment. Clarified: localStorage is never cleared by SW updates — progress survives. The issue was stale code, not lost data.

**2. Removed Gut gemacht results screen**
Replaced both `_showResults()` calls in `js/exercises.js` with `returnFromResults()`. Session end (queue empty) and early exit both now go straight to module home. Results screen still exists in HTML but is no longer reachable.

**3. Stripped parenthetical hints from exercise data**
188 exercises in `js/data.js` had `(verb — subject, tense)` appended to `question.de` (e.g. `"Er _____ die Party ab. (absagen — er/sie/es, present)"`). Removed via Python regex. Kept all other parentheticals (context hints like `(infinitive)`, `(reflexive Perfekt)`, row labels like `sie (plural)`) — those don't have commas inside the parens.

**4. Pixel 8 Pro layout**
`css/styles.css`: `--max-w` 390px → 430px, `--page-x` 20px → 16px. Content fills more of the screen on larger Android devices.

**5. Android gesture back navigation**
`js/app.js`: Wired `history.pushState()` into `navigateTo()`. Added `popstate` listener that calls `navigateBack()`. Init seeds the stack with `history.replaceState()`. Swiping back on Android now navigates within the app instead of closing it.

**Files changed:** `service-worker.js`, `js/exercises.js`, `js/data.js`, `css/styles.css`, `js/app.js`

---

## 2026-06-12 — Session 23b: Hotfix — Vergangenheit exercises showing 0/0

**Bug:** Vergangenheit tab showed 0 / 0 exercises for both Stammverben and Variationen after Phase 3 push.

**Root cause:** `data.js` has two exercise arrays — `exercises_verbs` (936 items, original stale data, no tense fields) and `exercises.module_verbs` (2,075 items, full set with tense fields). The Phase 2 generation script wrote the full set into `exercises.module_verbs` but left the old `exercises_verbs` key intact. `app.js` was loading `exercises_verbs` first (truthy, so it never fell through to the correct key).

**Fix:** One-line change in `js/app.js` — swapped preference order to read `exercises.module_verbs` before `exercises_verbs`.

**Files changed:** `js/app.js` (line 111)

**Verified:** Vergangenheit tab now shows 364 Stammverben exercises, 628 Variationen exercises. Tense picker (Perfekt / Präteritum) and meta badge working in-app.

---

## 2026-06-12 — Session 23: Phase 3 — Vergangenheit UI Toggle + Verb Meta Badge

**Goal:** Add Präsens/Vergangenheit tab toggle to Verbs module home, Perfekt/Präteritum sub-picker in exercise session, and Regular/Irregular + case badge on each verb exercise card.

**Files changed:**

- `index.html` — added `#verb-tense-picker` div (Perfekt / Präteritum buttons, hidden by default, shown when tenseContext = 'vergangenheit').
- `css/styles.css` — added `.tense-tab-row`, `.tense-tab`, `.tense-tab.active`, `.verb-meta-badge`, `.verb-type-pill.regular/irregular`, `.verb-case-badge`.
- `js/app.js` — added `_verbTenseTab` module-level state + `setVerbTenseTab()`; rewrote `_renderVerbModuleCategories()` to include tense-tab row, tense-filtered progress stats, and `tenseContext` passed to `openExercise()`.
- `js/exercises.js` — updated `startExercise()` to read `tenseContext`, show/hide `#verb-tense-picker`, add `tenseContext` + `vergangenheitTense` to session; updated `_buildQueue()` to filter exercises by tense; added `setVerbTense()` + `_updateVerbTensePicker()`; added `_verbMetaBadge()` function; injected badge in `_showNext()` after all type dispatches.

**Phase 3 behaviour:**
- Verbs module home shows two tabs: Präsens / Vergangenheit. Tab state persists across re-renders via `_verbTenseTab`.
- Vergangenheit exercises show a sub-picker (Perfekt / Präteritum) above the exercise card. Default: Perfekt.
- `setVerbTense()` rebuilds queue in-place without restarting the session.
- Every verb exercise card shows a Regular/Irregular pill + case badge (Akkusativ / Dativ / Nominativ). Modal verbs (case_requirements: ['none']) show pill only, no case badge.
- Badge inherits grammar from root verb. Prefix variants that differ from root (e.g. verstehen vs stehen) show root grammar — known limitation, logged as Phase 4 enhancement.

**Tense filtering verified:**
- Präsens pool: 1,083 | bleed into Vergangenheit: 0
- Perfekt pool: 744 | bleed into Präsens: 0
- Präteritum pool: 248

**Badge verification (5/5 cases correct):**
- verb_machen: Regular | Akkusativ ✓
- verb_sein: Irregular | Nominativ ✓
- verb_können: Irregular | [no case — modal] ✓
- verb_absagen (prefix variant): Regular | Akkusativ ✓
- verb_verstehen (prefix variant of stehen): Irregular | [no case — inherits stehen grammar] ✓ (known limitation)

**Known limitation logged:**
Prefix variants inherit parent root's `grammar.case_requirements`. `verstehen` (transitive, accusative) inherits `stehen` (intransitive, none). Badge shows Irregular with no case badge. To fix: add per-variant `grammar` override field in Phase 4.

**Next:** Phase 4 — spaced repetition / scoring system.

---

## 2026-06-12 — Session 22: Phase 2 — Vergangenheit Exercise Engine

**Goal:** Add three new exercise type handlers to `js/exercises.js` and generate all exercise data for them.

**Files changed:**

- `js/exercises.js` — added `_renderPartizipII()`, `_renderAuxiliaryChoice()`, `_renderConjugationTable()` renderers; added `checkPartizipII()` and `submitConjugationTable()` submission handlers; updated `_showNext()` routing to include all three new types.
- `css/styles.css` — added styles for: `.partizip-input`, `.check-btn`, `.partizip-correct/wrong`, `.options-aux`, `.option-btn.aux-opt`, `.conj-table`, `.conj-row`, `.conj-pronoun`, `.conj-input`, `.row-correct/wrong`, `.conj-correct-hint`.
- `data/exercises/exercises-verbs.json` — grew from 992 → 2,075 exercises (+1,083 new).
- `js/data.js` — rebundled to include all 2,075 verb exercises.

**New exercise types:**

| Type | Interaction | Answer source | Count |
|---|---|---|---|
| `partizip_ii` | Text input | `conjugation.past_participle` / variant `past_participle` | 248 |
| `auxiliary_choice` | 2-button MC (hat/ist) | `conjugation.auxiliary` / variant `auxiliary` | 248 |
| `conjugation_table` | 6-row table text input | 6 forms per tense from data | 587 |

**Conjugation table coverage:**
- Root verbs (91): Präsens + Präteritum + Perfekt tables = 273 table exercises
- Prefix variants (157): Präteritum + Perfekt tables = 314 table exercises

**Tense tagging:** All new exercises have a `tense` field (`'prasens'` | `'prateritum'` | `'perfekt'`). Existing 992 exercises have no `tense` field (treated as Präsens in Phase 3 filtering).

**Verification:**
- All 248 word_ids covered (91 roots + 157 variants).
- All 91 root verbs have all 5 new exercises.
- Smoke-tested sein (irregular), machen (regular), fahren (sein-aux), können (modal), absagen (separable variant), verstehen (inseparable variant). All correct.
- data.js parses without error.

**Next:** Phase 3 — UI toggle (Präsens / Vergangenheit tab) + Perfekt / Präteritum sub-picker + Regular/Irregular label + case badge on exercise cards.

---

## 2026-06-12 — Session 21: Phase 1 — Vergangenheit Data (Root Verbs + Prefix Variants)

**Files modified:** `js/data.js`, `SOURCE_OF_TRUTH.md`, `DAY_LOG.md`

### What happened

Completed Phase 1 of the Vergangenheit feature: all past-tense data added to `js/data.js`.

**Root verbs (91):** Added `prateritum` object (6 forms: ich/du/er_sie_es/wir/ihr/sie_Sie) to every root verb's `conjugation` block. All 91/91 verified clean. Zero missing.

**Prefix variants (157):** Added `past_participle`, `auxiliary`, and `prateritum` (6 forms) to every prefix variant entry. All 157/157 verified clean.

### Key data decisions

- **Separable verb Präteritum format:** stored as `"stem_form prefix"` with a space (e.g. `"ging aus"`, `"machte auf"`), consistent with how present tense is stored for `aufrechterhalten`. Exercises will render as fill-in-the-blank for the full separable form.
- **Inseparable verb Präteritum format:** stored as a single word (e.g. `"verstand"`, `"bekam"`).
- **Complex separable+inseparable (anerkennen):** `an-` separable, `er-` inseparable base → participle `anerkannt` (no ge-, correct). Stored as `"erkannte an"` in Präteritum.
- **ge- prefix verbs as inseparable (gehören, gebrauchen):** participle correctly starts with `ge-` because `ge-` is the inseparable prefix, not the participial marker.
- **Auxiliary overrides for prefix variants:** motion/state-change verbs switched to `sein` regardless of root: aufstehen, ausgehen, losgehen, eingehen, vergehen, ankommen, vorkommen, ausbleiben, verbleiben, überbleiben, ablaufen, verlaufen, anlaufen, abfahren, anfahren, einschlafen, eintreffen, erscheinen, abreisen, anreisen, einziehen, umziehen. All others: `haben`.
- **Sibilant du-forms (heißen, lassen, lesen, essen, schließen, weisen):** du takes `-t` or `-est` instead of `-st` to avoid double sibilant. Formal Duden forms used throughout.

### Verification

Automated checks: 91 root verbs (6-form completeness, ich=er, wir=sie, ich-form exact match, wir-form exact match, weak -te marker, strong du-form). 157 prefix variants (6-form completeness, ich=er, wir=sie, auxiliary validity, separable/inseparable participle and Präteritum format). 3 false positives in verification script; all correctly explained as edge cases. No actual errors.

### Next session

Phase 2: exercise engine. Add `partizip_ii`, `auxiliary_choice`, and `conjugation_table` (tense-parameterised) handlers to `js/exercises.js`.

---

## 2026-06-12 — Session 20: PRD — Vergangenheit (Perfekt + Präteritum)

**Files created:** `PRD_Vergangenheit.md`

### What happened

Full PRD interview session for the Vergangenheit feature. Scoped and signed off.

### Key decisions

- Past tense feature (Perfekt + Präteritum) lives **within the Verbs module** — not a new module
- UI: **Präsens / Vergangenheit tab** within Verbs. Vergangenheit tab has a **Perfekt / Präteritum sub-picker** styled like the level picker in Prepositions (A1/A2/B1/B2)
- New exercise types: `partizip_ii` (type the past participle), `auxiliary_choice` (hat vs. ist), `conjugation_table` (6-person fill-in, all at once — 3 separate exercises per tense)
- No translation exercises — all exercises must be objectively checkable
- `type` field maps to **Regular / Irregular** display label only (weak → Regular; all others → Irregular)
- Case requirements + Regular/Irregular label displayed together on verb exercise cards
- Data confirmed: `past_participle` + `auxiliary` already exist for all 91 verbs. **`prateritum` does not exist yet** — this is Phase 1
- Build order: root verb Präteritum data → prefix variants → exercise engine → UI toggle
- Modal verbs get all exercise types including conjugation tables
- Prefix variants get Perfekt + Präteritum data (root verbs first, then variants)

### Open questions resolved

All three open questions closed. PRD signed off. Ready to build.

---

## 2026-06-12 — Session 19: Pedagogical Audit + Roadmap Reprioritization

**Files modified:** `SOURCE_OF_TRUTH.md`

### What happened

Conducted a pedagogical audit of the app's content structure with a focus on what a German teacher would identify as gaps — particularly for learners coming from a Latin language background (Spanish, Italian, French, Portuguese), while keeping improvements universal.

### Audit findings

Three highest-priority gaps identified:

1. **No past tense (Perfekt)** — The app only teaches present tense. Perfekt is the conversational past tense used in everyday German speech. Without it, a student cannot discuss anything that happened in the past. Every verb in the app needs Perfekt forms (auxiliary + past participle) and new exercise types.

2. **Article/gender learning removed** — `article_choice` exercises were stripped from Nouns in Session 11. This was flagged as the wrong call. Articles and grammatical gender should be reintroduced, but taught with gender pattern rules (e.g., all *-ung* nouns are feminine; all *-chen/-lein* diminutives are neuter) rather than pure memorization.

3. **No grammar reference layer** — The app is entirely exercise-driven with no explicit explanation of the case system, declension tables, or grammar concepts. A reference section would give learners the framework to understand *why* the exercises work the way they do.

Additional audit notes (not yet actioned — lower priority):
- Cognates not leveraged as accelerators
- False friends not flagged in exercise explanations
- Word order (V2, subordinate clauses, separable verbs) not addressed
- Spaced repetition model (cooldown vs true SRS) not validated

### Decisions made

- All three highest-priority items added to roadmap
- Improvements framed as universal (not Latin-speaker specific)
- Roadmap reprioritized: Grammar reference → Perfekt tense → Articles module → (existing items shifted down)
- **Perfekt tense scoped as next PRD session**

---

## 2026-06-07 — Session 18c: UI Cleanup — 10 fixes

**Files modified:** `index.html`, `js/app.js`, `js/listening.js`, `css/styles.css`

### What changed

1. **Home screen — "X von Y verfügbar" removed.** The module count label (e.g. "6 von 6 verfügbar") and "Module" section header removed. No information value.
2. **Module cards — grid layout.** Home screen modules now render in a 2-column grid (`.home-modules-grid`). Cards are compact with no icon badge and no "Modul N" eyebrow. Just the module title + arrow/lock indicator.
3. **Streak badge — flat icon.** Replaced 🔥 emoji with a stroke-based SVG flame. Format: `[flame icon] Streak N days`.
4. **Module home nav title.** Each module's top nav-context now shows the module name in caps (e.g. "VERBS") instead of "Modul 01". The large `heading-xl` title and description paragraph below it are removed entirely.
5. **Merged Modul-Fortschritt + Liste cards.** For all 5 word modules (Verbs, Nouns, Adjectives, Adverbs, Prepositions): the separate progress card and list-link card are merged into a single clickable card. Shows "Unlocked Verbs 10/248" with a progress bar. Tapping navigates to the word list. Static progress card removed from HTML.
6. **Prepositions — Niveau removed.** The "· Niveau A1" text removed from the Präpositionen üben exercise card subtitle. Difficulty is selected inside the exercise, not displayed on the card.
7. **Lesen & Hören list — pill toggle.** Eye icon toggle replaced with a pill button reading "Hide read" / "Show read". Class: `.pill-toggle-btn`.
8. **Article reader — "Read" pill button.** Eye icon circle button replaced with a pill button labelled "Read". When clicked: turns green with a checkmark icon. Properly aligned in the nav-header flex row (no longer absolutely positioned).

**Pushed to GitHub. Live at https://rsperotti.github.io/mein_deutsch**

---

## 2026-06-07 — Session 18b: Lesen & Hören — Bug Fixes

**Files modified:** `index.html`, `js/listening.js`, `js/progress.js`, `css/styles.css`

### 4 bugs fixed

**Bug 1 — Toggle button styling (heading row restructure)**
- Removed unnecessary read-count counter from heading
- Replaced text toggle with eye / eye-slash SVG icon (banking-style show/hide)
- Restructured `screen-listening-list` to use `.listening-list-heading-row` flex container: heading left, icon button right
- Heading now reads "Reading & Listening"; font/spacing tuned so it fits alongside the icon
- `renderListeningList()` updates `toggleBtn.innerHTML` directly with `_EYE_ICON` or `_EYE_SLASH_ICON`

**Bug 2 — Nav title centering**
- All nav titles (`nav-context`) now absolutely centred on screen regardless of left/right element count
- `.nav-header` gets `position: relative`; `.nav-context` gets `position: absolute; left: 50%; transform: translateX(-50%)` with `white-space: nowrap; pointer-events: none`
- Back button stays left-aligned in normal flex flow; read button right-aligned

**Bug 3 — Read state reversible**
- Added `unmarkArticleRead(id)` to `progress.js`
- `toggleArticleRead()` is now bidirectional: reads current state, marks or unmarks accordingly, updates button appearance

**Bug 4 — Vocab bottom sheet closes on outside tap**
- Root cause: `showVocabSheet()` was using `classList.add('active')` but CSS targets `.sheet-overlay.visible`
- Fixed: all references changed from `'active'` to `'visible'`
- Overlay's `onclick = closeVocabSheet` wired in `_renderArticle()` for outside-tap dismissal

**Pushed to GitHub. Live at https://rsperotti.github.io/mein_deutsch**

---

## 2026-06-07 — Session 18: Lesen & Hören Module

**Files created:** `js/listening-data.js` (new), `js/listening.js` (new)
**Files modified:** `index.html`, `js/app.js`, `js/progress.js`, `css/styles.css`, `service-worker.js`, `data/modules.json`

### What was built

Full **Lesen & Hören** module integrated into the app. All 45 Deutsche Welle articles available offline from install.

**Architecture decisions made (reviewed by staff dev agent before build):**

- **Data bundling:** All 45 article transcripts + vocabulary bundled into `js/listening-data.js` (212 KB). Served as `window.LISTENING_DATA`. Article text is available offline from install — no fetch required. Audio lazy-loads and caches on first play.
- **No `data.js` changes:** Listening module metadata injected via `loadData()` merging `LISTENING_DATA.module` into `appData.modules`. Keeps `data.js` untouched.
- **Module card routing:** `_renderModuleCards()` checks `mod.type === 'reading'` and routes the listening card directly to `screen-listening-list` — bypasses `screen-module-home` entirely (which is exercise-module-only infrastructure).
- **Service worker v2:** Bumped cache version. Added `listening-data.js` + `listening.js` to PRECACHE. Extended fetch cache handler to cover `/content/listening/` paths. Added `serveAudioRange()` — synthesises correct 206 Partial Content responses from cached blobs so audio works offline.
- **Progress tracking:** Three new methods in `progress.js` (`markArticleRead`, `isArticleRead`, `getReadArticles`) using `app_articles_read` localStorage key. Consistent with all other progress patterns.
- **Vocab highlighting:** Single-pass combined regex. All vocab words sorted by length descending, built into one `RegExp`, applied in a single `.replace()` call. Entries with `word.length < 4` excluded (catches common function words like "für", "als"). Matched words wrapped in `<span class="vocab-highlight">`.
- **Sort order:** Newest first (descending by date string, then by numeric article ID for same-date tiebreak). Slug-id article (`wieso-immer-weniger-kinder-schwimmen-k-nnen`) sorts by its date correctly.

**Feature breakdown:**

*Article list screen (`screen-listening-list`):*
- Shows all 45 articles newest-first
- Each card shows title, date, vocab count
- Read articles shown with checkmark badge + muted opacity
- "Gelesen ausblenden / anzeigen" toggle button filters the list
- Module home card on home screen shows `X / 45 gelesen` count

*Article reader screen (`screen-listening-reader`):*
- Title + date header
- Native `<audio controls preload="none">` player pointing to local MP3
- On first play: fires a background full-GET so SW caches the audio
- Transcript rendered as paragraphs; first paragraph (title line) bold/large
- Vocab words highlighted in green underline, tap to open bottom sheet with EN explanation
- Bottom sheet reuses existing `.bottom-sheet` / `.sheet-overlay` pattern
- "Mark as read" button (eye icon) in nav header — tap marks article read, icon changes to green checkmark. One-way (no unread).

**Known limitation documented:** Vocab highlighting matches the exact word form present in the article (e.g. "erwerben" matches "erwerben" in transcript but not "erworben"). This is by design — DW's vocabulary list contains contextual word forms, not abstract lemmas.

**Not pushed to GitHub yet.**

---

## 2026-06-07 — Session 17: DW Crawler — Build & Run

**Files changed:** `crawler.py` (new), `probe_article.py` (new, debug tool), `content/listening/` (new output tree)

### What happened

Built and ran the DW Top-Thema crawler. 45 articles crawled successfully (45 complete, 0 failed).

**How it actually works (confirmed by probing the real DOM):**

DW's learngerman site is a React SPA. Everything needed is embedded in a `window.__APOLLO_STATE__` JSON blob in the main article page — no sub-page navigation required. The crawler:
1. Loads the archive page with Playwright (JS-rendered)
2. Finds all article links (`/de/l-{id}` format — DW doesn't always include the human slug in archive links)
3. For each article: loads the page, extracts the Apollo state JSON, parses `Lesson:{id}.manuscript` for transcript + vocab, grabs the MP3 `src` attribute
4. Calls Claude Haiku in one batch call per article to translate German vocab definitions to English
5. Saves `data.json` + `audio.mp3` per article; updates `index.json`

**Key bugs fixed during build:**
- `str | None` type hints incompatible with Python < 3.10 → removed return type annotations
- `url_to_slug()` was splitting the full URL string (including domain) instead of just the path → switched to `urlparse().path`
- Sub-page navigation via `/manuskript` suffix returned 404 → real paths are `/lm` (Manuskript) and `/le` (Extras), but ultimately unnecessary since all content is in the Apollo state on the main page
- Vocab regex had `data-type` before `data-title` — actual HTML has them reversed → rewrote to find spans by `data-type="GLOSSARY"` then extract `data-title` from the matched span

**Output structure:**
```
content/listening/
├── index.json                    ← 45 entries, all "complete"
└── articles/
    └── {slug}/
        ├── data.json             ← title, date, transcript, vocabulary (DE + EN)
        └── audio.mp3
```

**Vocab per article:** ~15–25 words. Each has `word`, `explanation_de` (German dictionary form from DW), `explanation_en` (Claude translation).

### Adding more years (2025, 2024, etc.)

See SOURCE_OF_TRUTH.md → "DW Crawler — How to Add More Years".

### Next session

Build the **Lesen & Hören** module in the app — new card on the module home screen, article list, article reader with tappable vocab and audio playback.

---

## 2026-06-07 — Session 16: DW Crawler — Design & Documentation

**Files changed:** `SOURCE_OF_TRUTH.md`

### What happened

Scoped and fully designed the DW Crawler — a new standalone tool (separate from the app) that will power a new Reading & Listening Comprehension module.

**Key decisions made:**

- **Audio:** Download MP3s locally (not URL-only). Reason: DW changes CDN paths over time, which would silently break playback.
- **Translation:** Claude API (not Google Translate). Reason: better context retention for German vocabulary explanations.
- **Renderer:** Playwright (headless Chromium), not `requests`. Reason: DW pages are JavaScript-rendered — plain HTTP requests return empty shells.
- **API cost control:** All vocabulary explanations per article batched into a single Claude API call.
- **Deduplication:** `index.json` tracks crawl status per article. `"complete"` articles are skipped on re-runs; `"failed"` / `"partial"` are retried.
- **Scope:** 2026 archive first. Expand to prior years once output is verified.
- **CLI:** `python crawler.py` (normal), `--recrawl {slug}` (force), `--dry-run` (preview).

Full technical spec (schemas, file structure, library choices, integration plan) documented in SOURCE_OF_TRUTH.md under "Feature: DW Crawler".

### Next session

Build the crawler script.

---

## 2026-06-07 — Session 15: UI Cleanup (4 Changes)

**Files changed:** `js/app.js`

### Change 1 — Module cards: icons replace number badges, descriptions removed
- `_moduleIcon(moduleId)` helper added — returns a flat single-color stroke SVG per module: lightning bolt (Verbs), price tag (Nouns), clock (Adverbs), star (Adjectives), map pin (Prepositions).
- `_renderModuleCards()` — `module-number-badge` now renders the SVG icon instead of a padded number. `module-card-desc` div removed entirely.

### Change 2 — Word list card moved to top of module home screens
- Verbs, Nouns, Adverbs, Adjectives: Verbliste / Nomenliste / Adverbliste / Adjektivliste card now renders first, above the "Übungen" label and category cards.

### Change 3 — Exercise entry cards show completed vs total exercises
- All four modules (Verbs roots/variants, Nouns roots/variants, Adverbs, Adjectives Grundformen): replaced `X / Y gelernt` (word unlock count) with `X / Y Übungen` (exercises completed vs total). Progress bar percentage updated to match.
- Completion is defined as `Progress.getExerciseHistory(ex.exercise_id).correct > 0`.

### Change 4 — Prepositions module: Präpositionsliste card first
- `_renderPrepositionModuleCategories()` — Präpositionsliste card moved above the "Übungen" label and the exercise card.

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
