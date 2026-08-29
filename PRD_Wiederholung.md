# PRD — Wiederholung (Spaced Repetition & Cross-Module Review)

**Status:** SIGNED OFF — 2026-08-29
**Created:** 2026-08-29 (Session 40)
**Owner:** Ricco

---

## 1. Problem

The app has no memory of what you get wrong.

Every module builds its queue by shuffling everything that passes a filter and serving it
once. There are five independent queue builders (`_buildQueue`, `_deklBuildQueue`,
`_prefixBuildQueue`, `startWordListExercise`, `startArtikelExercise`) and none of them
reads a single byte of history. A word answered correctly once is treated as learned
forever; a word missed three sessions running is served no more often than one you have
never got wrong.

`Progress.recordResult()` has been writing `{correct, incorrect}` counts per exercise into
`app_exercise_history` since the beginning. **Nothing has ever read it back.** It is used
only to draw the module-home progress bars. There are no timestamps, so it cannot answer
"when did I last see this" or "when should I see it next".

Consequence: practice volume grows (10 modules, ~6,150 exercises) but retention is
unmeasured and unmanaged. Adding an 11th module would add more material to forget.

## 2. Success Criteria

The build is done when all of the following are observably true:

1. An item answered correctly for the first time on day 1 is served again on day 2,
   then ~day 8, then ~day 24 — intervals expanding per SM-2.
2. An item answered incorrectly reappears **later in the same session**, and again the
   next day, with its interval reset to zero.
3. A new **Wiederholung** tile on the home screen shows the number of items due today,
   and opening it serves them in a single mixed queue drawn from every module.
4. The review queue is genuinely cross-module: a Vorsilben item, a Deklination item and
   a verb-conjugation item can appear back to back.
5. Playing any existing module behaves exactly as it does today. No visible change.
   `qa-variants.js` (21 checks) and `qa-prefixes.js` (71 checks) pass unchanged.
6. `_factory/validate-srs.py` — an implementation of SM-2 written independently of the
   app's — replays a synthetic answer log through both and asserts the resulting
   intervals, ease factors and due dates match exactly. Per factory discipline: the
   validator must not import or reference `js/srs.js`.
7. `_factory/qa-srs.js` — integration QA proving the wiring, not the algorithm: that
   answering through the app's real handlers reaches the store, that `reviewMode`
   suppresses the progress bars without suppressing scheduling, and that Artikel
   participates.
8. `_factory/verify-srs-validator.py` — the negative test. Seeds 8 algorithm bugs into
   `js/srs.js` and 5 wiring bugs into `js/exercises.js`, one at a time, and asserts each
   suite catches its own. A check that has never failed has not been shown to work.
9. Artikel answers are recorded (see §5.3). Artikel items enter the pool.

## 3. Scope

### In

- **`js/srs.js`** — a new scheduler module. Binary SM-2. Pure functions plus a
  localStorage-backed store. No DOM.
- **`app_srs` localStorage store** — per-item scheduling state, keyed by the existing
  globally-unique exercise ID.
- **A grade call beside every existing `Progress.recordResult()`** — 9 call sites in
  `js/exercises.js`. Existing modules keep their current behaviour; they now also feed
  the scheduler.
- **Backfill** from the existing `app_exercise_history` so the pool is not empty on day one.
- **Artikel result recording** — `selectArticleAnswer()` currently records nothing. Fix,
  and give Artikel items stable synthetic IDs (`ex_artikel_<noun_id>`).
- **Wiederholung module** — home tile with a due count, and a review session that serves
  the due queue.
- **Review dispatcher** — routes each due item to the engine that already knows how to
  render and grade it (see §5.4).

### Out — explicitly

- **Changing any existing module's queue.** Modules stay first-exposure engines. Making
  them scheduling-aware is a possible Phase 3, deliberately not in this PRD.
- **FSRS.** Every exercise in the app is binary right/wrong; FSRS wants a graded recall
  quality that we have no way to collect. SM-2 with a binary grade is the honest fit.
- **Cross-device sync.** localStorage stays device-local, as everything else in the app is.
- **Any UI for tuning ease factors, burying, suspending, or editing intervals.**
- **Lessons and grammar content.** Exercises only.
- **New exercise content of any kind.**

## 4. Constraints

- Vanilla JS, no framework, no build step. `js/srs.js` loads as a `window.SRS` global,
  same pattern as `Progress`.
- Must work from `file://` and GitHub Pages alike.
- `CACHE` in `service-worker.js` must be bumped (v18 → v19) or installed PWAs never
  receive it.
- **Storage budget.** ~6,150 exercises × ~55 bytes of scheduling state ≈ 340 KB against a
  typical 5 MB localStorage quota. Comfortable, but the store uses short keys
  (`e`,`i`,`r`,`d`,`l`) rather than readable ones for this reason, and `Progress._set`
  already swallows quota errors with a `console.warn` — SRS must do the same rather than
  throwing mid-session.
- No new dependencies. QA suites still run via `NODE_PATH=~/qa/node_modules`.

## 5. Approach

### 5.1 The item

An item is **one exercise**, identified by its existing ID. Verified 2026-08-29: IDs are
namespaced per data file (`ex_verb_sein_001`, `dekl_schwach_nom_001`, `prefixes_ab_001`,
`particles_mal_001`, `ex_prep_an_sp_a1`, …) and are globally unique, so the flat
`app_exercise_history` map was never colliding and the same flat keyspace is safe for
`app_srs`. **No ID migration is required.** This was the main feared blocker and it is
not one.

The one exception is Artikel, whose exercises are synthesised at runtime from
`appData.nouns` and have no IDs at all — hence §5.3.

### 5.2 The scheduler

Binary SM-2. Per item we store ease factor `e`, interval in days `i`, consecutive
successful reps `r`, due date `d` (YYYY-MM-DD, local), last seen `l`, lapses `x`.

On a **correct** answer:
```
r += 1
i = 1        if r == 1
    6        if r == 2
    round(i * e)  otherwise
e = min(2.5, e + 0.1)
d = today + i days
```

On an **incorrect** answer:
```
r = 0
i = 0                    -> due today; re-served later in the same session
e = max(1.3, e - 0.2)
x += 1
d = today
```

Intervals are capped at **365 days**.

New items start at `e = 2.5`, `i = 0`, `r = 0`.

This is deliberately the plainest possible SM-2. Every constant above is a tunable we are
choosing not to expose.

> **Amended during the build, 2026-08-29.** The interval cap was not in the signed-off
> draft. `_factory/validate-srs.py` crashed on its first run with an `OverflowError`:
> without a ceiling the interval compounds by the ease factor indefinitely, and 38
> consecutive correct answers put the due date past the year 100,000. Python raises;
> JavaScript does not — `new Date()` would have returned `Invalid Date`, the item would
> have been written with `d = "NaN-NaN-NaN"`, and since `"NaN-NaN-NaN" <= today` is false
> it would never have come due again. A silently disappearing item, only for the material
> you know best. 365 days is the practical ceiling regardless: an item recalled correctly
> seven times running does not need a longer gap.

### 5.3 Artikel recording (a bug, fixed here)

`selectArticleAnswer()` has no `Progress.recordResult()` call. This is the third instance
of the same omission — Deklinationen (Session 36) and Vorsilben (Session 37) had it too,
and in the Vorsilben case it showed as a permanent `0 / 330` on the module home. Artikel
hides it because its home screen shows noun counts rather than progress.

Fix: assign each generated Artikel exercise `id = 'ex_artikel_' + n.id`, and record
results. Without this, Artikel is the one module that cannot participate in review.

### 5.4 Rendering review items — the real engineering cost

There is no single answer path in the app. Four engines exist, each with its own session
object, render functions and grading handler:

| Engine | Session object | Grades in | Exercise types |
|---|---|---|---|
| Main | `session` | `selectAnswer`, `checkPartizipII`, `submitConjugationTable` | translate_word, fill_blank, article_choice, conjugation, select_preposition, select_case, fill_blank_particle, partizip_ii, auxiliary_choice, conjugation_table |
| Deklination | `_deklSession` | `submitDeklinationAnswer` | type_ending |
| Vorsilben | `_prefixSession` | `selectPrefixAnswer` | select_prefix, select_feeling |
| Artikel | `_artikelSession` | `selectArticleAnswer` | select_article |

Reimplementing thirteen renderers inside a Review module would duplicate every one of
them and guarantee drift. Instead Review **dispatches** to the engine that already owns
each item.

Concretely, each of the four engines gains two things and nothing else:

- a `reviewMode` flag on its session object; when set, its "advance" step calls
  `Review.next()` instead of its own `_showNext()`;
- an `SRS.grade(itemId, isRight)` call beside its existing `Progress.recordResult()`.

Review holds the mixed queue, and for each item hands control to the right engine. Four
touchpoints, no renderer is copied, and module play is unaffected because `reviewMode` is
false there.

**This is the largest risk in the build.** The four engines have accumulated
module-specific state (tense context, CEFR pickers, group filters, chip counters) that
Review must neutralise per item. Mitigation: build the dispatcher for the Main engine
first and prove one mixed queue end to end before wiring the other three.

### 5.5 An index from ID to exercise

Review needs to go from a due ID back to the exercise object. Built once at load into
`Review._index`: a flat map over `appData.exercises` (all modules), `DECLENSION_DATA.exercises`,
`PREFIXES_DATA.exercises`, and the generated Artikel set, each entry tagged with its
engine. Any due ID with no index entry — content deleted or regenerated since it was
answered — is dropped silently rather than crashing the session.

### 5.6 Backfill

`app_exercise_history` has counts but no dates, so the seed is approximate by necessity:

- `correct > 0, incorrect == 0` → `r = 1`, `e = 2.5`
- `incorrect > 0` → `r = 0`, `e = max(1.3, 2.5 - 0.2 * incorrect)`
- Never answered → not in the store; enters on first answer.

Due dates are **staggered** across the first 14 days rather than all set to today —
see Open Question 2. A one-shot migration flag (`app_srs_backfilled`) prevents re-running,
following the `_QUIZ_MIGRATION_FLAG` pattern already in `js/grammar.js`.

### 5.7 Session size

Per decision 2026-08-29: **no cap.** The queue is the queue, consistent with every other
module in the app.

I argued against this and am recording the disagreement rather than relitigating it: one
skipped week produces a several-hundred-item queue, and that is the standard way people
abandon an SRS. Two things make it survivable and are why I am not blocking:
`exitExerciseEarly()` already exists, so you can leave at any point, and grading is
persisted per answer rather than at session end — so a 600-item queue answered 40 at a
time across the day behaves identically to a capped one. The cap would only have been a
guardrail against a number on a screen. If it turns out to be demoralising in practice,
adding a cap later is a one-line change; nothing in this design depends on its absence.

## 6. Phasing

**Phase 1 — invisible.** `js/srs.js`, the `app_srs` store, grade calls at all 9 existing
sites, the Artikel recording fix, backfill, and `_factory/validate-srs.py`. Ships with no
UI. Scheduling data starts accumulating and can be inspected in the console before any
screen depends on it.

**Phase 2 — the surface.** Wiederholung home tile with due count, review session, the
Main-engine dispatcher. One mixed queue, verb/noun/adverb/adjective/particle/preposition
items only.

**Phase 3 — the other three engines.** Deklination, Vorsilben and Artikel items join the
review queue.

Each phase is a separate commit with a service-worker `CACHE` bump.

## 7. Open Questions

1. **Word List practice** writes to a separate store (`app_word_practice_scores`, keyed by
   word rather than exercise) and is a different interaction from every other module.
   In the pool or out? Recommendation: **out** for now — it is a vocabulary drill over
   unlocked words, and its items are not exercises. Revisit after Phase 2.
2. **Backfill stagger.** Seeding every previously-answered item as due today would produce
   a first Wiederholung session in the thousands. Recommendation: distribute seeded due
   dates deterministically over 14 days (hash the item ID). Confirm.
3. **Does a review answer also count toward module progress bars?** If `SRS.grade` sits
   beside `Progress.recordResult`, reviewing an item a second time increments its correct
   count again and the bars keep moving after a module is "complete". Recommendation:
   in `reviewMode`, grade SRS only and skip `recordResult`, so module bars keep meaning
   "coverage" rather than "reps". Confirm.
4. **Streak.** `Progress.updateStreak()` fires on module play. Should a Wiederholung-only
   day count? Recommendation: yes.

## 8. Sign-off

**Signed off by Ricco, 2026-08-29 (Session 40).**

Answers to §7:

- **Q1 — Word List practice:** no explicit answer; recommendation stands. **Out of the pool.**
- **Q2 — Backfill stagger:** agreed. Seeded due dates are spread deterministically over
  14 days by hashing the item ID.
- **Q3 — Review answers and module progress bars:** **No.** In `reviewMode` the app grades
  SRS only and skips `Progress.recordResult`, so module bars continue to mean coverage
  rather than repetitions.
- **Q4 — Streak on a Wiederholung-only day:** no explicit answer; recommendation stands.
  **Yes, it counts.**
