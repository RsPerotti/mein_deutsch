# PRD — Grammatik Curriculum Layer
*Created: 2026-06-13 — Session 25*
*Status: Draft — awaiting sign-off*

---

## Problem Being Solved

Users currently jump straight into exercises without understanding the underlying grammar rules. This makes practice feel like pattern-matching rather than learning. Without conceptual grounding, errors go undiagnosed — a user can fail a conjugation table repeatedly without knowing *why* the rule works the way it does.

The Grammatik layer introduces a structured curriculum: learn the concept first, pass a short quiz, unlock the practice content gated behind it.

---

## Success Criteria

- A user opening the Verbs module for the first time is guided through grammar lessons *before* accessing practice exercises for each concept
- Completing a lesson + quiz unlocks the corresponding exercise category
- Quiz pass rate can be reviewed to identify concepts users struggle with (future — not v1)
- Existing users with progress are not disrupted — their unlocked content remains accessible

---

## Scope

### In (v1)
- **Verbs module only**
- Grammar lessons with short explanations (text + examples)
- Quiz after each lesson (up to 20 questions; mix of rule-check MC and real exercises)
- Lesson completion unlocks the corresponding exercise category
- Lesson content stored as structured data (not hardcoded HTML)
- Progress persisted in localStorage (same pattern as existing modules)

### Out (v1)
- Nouns, Adjectives, Adverbs, Prepositions grammar layers — deferred
- Spaced repetition on grammar quizzes
- Analytics / pass rate tracking
- Video or audio in lessons
- Social / sharing

---

## Curriculum — Verbs v1

Six lessons, each gating a content category. Order is fixed (sequential unlock).

| # | Lesson | Unlocks | Key Concepts |
|---|---|---|---|
| 1 | **Verb Basics** | All Stammverben → Präsens | What a verb is; infinitive form; verb position in sentence; subject-verb agreement |
| 2 | **Regular Conjugation (Präsens)** | Stammverben Präsens exercises | Stem extraction; regular endings (-e, -st, -t, -en, -t, -en); spelling changes (arbeiten → arbeitest) |
| 3 | **Trennbare Verben** | Variationen (separable prefix variants) | Separable vs inseparable prefixes; how prefix splits in main clause; prefix position at end |
| 4 | **Modal Verben** | Modal verb exercises (können, müssen, dürfen, wollen, sollen, mögen) | Modal + infinitive structure; conjugation pattern; meaning differences |
| 5 | **Vergangenheit — Perfekt** | Vergangenheit → Perfekt exercises | Auxiliary selection (haben vs sein); Partizip II formation (regular: ge- + stem + -t; irregular: strong forms) |
| 6 | **Vergangenheit — Präteritum** | Vergangenheit → Präteritum exercises | Präteritum endings; strong verb vowel changes; modals in Präteritum |

---

## Lesson Structure (per lesson)

Each lesson is a data-driven screen with the following sections:

1. **Concept explanation** — 2–4 short paragraphs. Plain language, no jargon dumps. Every rule illustrated with an example sentence (German + English).
2. **Key rules summary** — 3–5 bullet points. Scannable. Shown at the bottom of the explanation before the quiz CTA.
3. **Quiz** — up to 20 questions. Mix of:
   - **Rule-check** (multiple choice): e.g. "Which auxiliary does a motion verb use in Perfekt?" → hat / ist
   - **Real exercises**: same render as existing exercise types (translate_word, auxiliary_choice, partizip_ii, conjugation_table) drawn from the existing exercise pool, filtered to the lesson's concept
4. **Pass condition** — TBD (see Open Questions). On pass: lesson marked complete, content unlocked. On fail: option to retry quiz or re-read lesson.

---

## UI / UX

### Entry point
The Verbs module home gets a new section above the category list: **"Grammatik"** — a horizontal strip of lesson cards (or a vertical progress ladder). Each card shows:
- Lesson title
- Status: Locked / In Progress / Complete (with a checkmark)
- A lock icon over the exercise categories it gates

### Lesson screen
- New screen type: `grammar-lesson`
- Nav context: module title → lesson title
- Scrollable explanation area
- "Start Quiz" CTA at the bottom (sticky or after scroll)
- Back arrow exits without losing read progress (reading is not gated — only quiz pass unlocks)

### Quiz screen
- Reuses existing exercise card renderer where possible
- Progress indicator (e.g. "Question 4 / 12")
- No timer
- On completion: score shown + "Unlock [category]" CTA if passed, "Try Again" if not

### Locked state (exercise categories)
- Categories that are locked show a lock icon + "Complete [Lesson Name] to unlock"
- Tapping navigates to the lesson, not an error state

---

## Data Architecture

### `data/grammar/lessons.json`
```json
[
  {
    "id": "verb-basics",
    "title": "Verb Basics",
    "order": 1,
    "unlocks": ["stammverben-prasens"],
    "sections": [
      {
        "type": "explanation",
        "heading": "What is a verb?",
        "body": "...",
        "example_de": "Ich lerne Deutsch.",
        "example_en": "I am learning German."
      }
    ],
    "key_rules": [
      "Verbs express actions, states, or processes.",
      "The infinitive always ends in -en (lernen, gehen, sein).",
      "..."
    ],
    "quiz": [
      {
        "type": "rule_check",
        "question": "Which part of the sentence does the verb always occupy in a German main clause?",
        "options": ["First position", "Second position", "Last position", "Any position"],
        "correct": 1
      },
      {
        "type": "exercise_ref",
        "exercise_id": "verb_machen_translate_word"
      }
    ]
  }
]
```

### localStorage keys (new)
- `app_grammar_lessons` — object: `{ "verb-basics": { status: "complete" | "in_progress" | "locked", score: 18, attempts: 1 } }`
- Existing unlock keys remain unchanged; lesson completion *writes* to the existing category unlock keys

### New JS file
- `js/grammar.js` — lesson renderer, quiz engine, unlock handler

---

## Constraints

- **Offline-first** — all lesson content bundled in the app (no fetch at runtime). Grammar lessons added to SW precache.
- **No new dependencies** — reuse existing exercise renderers
- **Existing users** — on first app load after this ships, users with existing progress in a category are auto-granted the corresponding lesson's "complete" status. No one loses access to content they've already been using.

---

## Proposed Build Plan (phases)

| Phase | Scope | Sessions (est.) |
|---|---|---|
| 1 | Data + architecture — `lessons.json` schema, `grammar.js` stub, localStorage keys, migration for existing users | 1 |
| 2 | Lesson screen — explanation renderer, key rules, "Start Quiz" CTA | 1 |
| 3 | Quiz engine — question renderer (rule_check + exercise_ref types), scoring, pass/fail flow | 1–2 |
| 4 | Unlock gating — lock state on Verbs module home, unlock on pass, Grammatik card strip | 1 |
| 5 | Content — write all 6 lessons (explanation text, key rules, quiz questions) | 1–2 |
| 6 | QA + deploy | 1 |

---

## Open Questions

1. **Pass threshold** — what score unlocks the content? Options: 70%, 80%, all-or-nothing on first attempt. Recommendation: 80% (16/20).
2. **Quiz length** — fixed 20 questions per lesson, or variable (some lessons have fewer concepts)? Recommendation: variable, capped at 20.
3. **Retry policy** — unlimited retries? Or cool-down after failure? Recommendation: unlimited retries (this is a learning app, not an exam).
4. **Lesson ordering** — ~~strict sequential~~ **DECIDED: all lessons visible and freely accessible from the start. No prerequisite gating between lessons.** Exercises within each category are still locked until the corresponding lesson is passed, but lessons themselves have no locks between them.
5. **Existing user migration** — auto-grant "complete" for lessons whose content the user already has progress in, or show a "skip lesson" option? Recommendation: auto-grant silently on first load.

---

*Sign-off required before build begins.*
