# PRD — Artikel Module
*Created: 2026-06-14 — Session 33*
*Status: Draft — awaiting sign-off*

---

## Problem Being Solved

German learners know their nouns but guess the article. Without a structured understanding of gender patterns, every noun feels arbitrary. The Artikel module gives this a home: a comprehensive grammar reference for gender rules + a targeted drill where users test themselves against every noun they've unlocked.

---

## Success Criteria

- A user can read through all gender pattern rules in a structured, lesson-by-lesson format
- A user can drill Der/Die/Das for all nouns they've unlocked in the Nouns module
- Grammar lessons and exercises are independent — no gating
- Module lives as a standalone 8th tile on the home screen
- The exercise pool grows automatically as the user unlocks more nouns in the Nouns module

---

## Scope

### In (v1)
- Standalone 8th module: **Artikel**
- 6 grammar lessons covering all major gender-pattern rules
- Quiz (5 rule_check MC questions per lesson, same engine as Verbs)
- New exercise type: `select_article` — show noun, pick Der / Die / Das
- Exercise pool = all nouns at or below the user's current Nouns unlock level
- No gating between grammar lessons and exercises

### Out (v1)
- Indefinite articles (ein/eine/ein) — deferred
- Declension (der → des → dem → den) — that's Deklinationen
- Plural articles — nouns already show plural in the Nomenliste; not in scope here
- New noun content — uses existing 175 nouns only

---

## Grammar Curriculum — 6 Lessons

| # | Lesson | Core Concepts |
|---|---|---|
| 1 | **What is Grammatical Gender?** | 3 genders; gender is grammatical not natural; why it matters; natural gender as a reliable shortcut |
| 2 | **Masculine Endings (der)** | -er, -ling, -ig, -ismus, -or, -ant/-ent; days/months/seasons/weather |
| 3 | **Feminine Endings (die)** | -ung, -heit, -keit, -schaft, -ion, -ität, -ie, -ei; most trees and flowers |
| 4 | **Neuter Endings (das)** | -chen/-lein (diminutives always neuter); -ment, -um/-ium; verbal nouns; young animals; languages/colours/metals as nouns |
| 5 | **Gender by Category (Meaning Rules)** | Masculine: alcohol, compass points; Feminine: ships, fruits; Neuter: hotels/cafés, chemical elements, letters; cross-category exceptions |
| 6 | **Compound Nouns + Memory Tips** | Komposita rule (last noun wins); common traps; learning nouns with articles; colour-coding strategy |

Lessons are all visible and freely accessible from launch. No sequential lock between lessons.

---

## Lesson Structure (per lesson)

Same pattern as Verbs grammar:

1. **Sections** — 3–4 `explanation` blocks, each with heading, body paragraph, and a German/English example.
2. **Key rules** — 4–5 scannable bullet points shown before the quiz CTA.
3. **Quiz** — 5 `rule_check` MC questions. Pass threshold: 80% (4/5). Unlimited retries.

Lesson progress stored in localStorage. Passed = green check. In progress = partial indicator. Not started = default.

---

## Exercise: Der, Die, oder Das?

### UX Flow

1. User opens Artikel module home → taps **"Üben"** (or "Start")
2. Queue is built: all nouns where `unlock_level ≤ user's current nouns level`
3. Cards are shuffled and served one at a time
4. Each card shows:
   - **Noun** (capitalised, large) — e.g. *Kind*
   - **English meaning** (subtext) — e.g. *child*
   - **Three buttons**: `Der` · `Die` · `Das`
5. On answer:
   - Correct → green flash + brief positive feedback label → auto-advance after ~800ms
   - Wrong → red flash + correct article shown → manual advance (tap to continue)
6. Results screen at end: score, breakdown by article (how many der/die/das correct)

### Exercise Type: `select_article`

New type in `exercises.js`. Generated dynamically from `nouns.json` at session start — **no separate exercises file needed**. The exercise object is built at runtime:

```js
{
  type: "select_article",
  word_id: noun.id,
  word: noun.word,
  english: noun.english,
  correct_article: noun.article   // "der" | "die" | "das"
}
```

Queue size: all unlocked nouns (no cap). Session completes when all are answered.

### Progress Tracking

- `app_artikel_session_scores` — stores last session score `{ correct, total, date }`
- No persistent per-noun tracking in v1 (no spaced repetition)

---

## Module Home UI

Matches Nouns module home as a template. Contains two sections:

**1. Grammatik strip** (same component as Verbs)
- Row of 6 lesson cards: title + status (locked / complete / in-progress)
- Tapping a card opens the lesson screen

**2. Exercises section**
- Header: "Der, Die, oder Das?"
- Subtext: "X Nomen verfügbar" (count of nouns in current pool)
- Start button → launches exercise session
- If 0 nouns unlocked: "Unlock nouns in the Nouns module to start."

---

## Data Architecture

### New files
| File | Content |
|---|---|
| `data/grammar/article-lessons.json` | 6 lessons (same schema as `lessons.json`) |

### No new exercise file
`select_article` exercises are generated at runtime from `nouns.json`. No static file needed.

### localStorage keys (new)
| Key | Value |
|---|---|
| `app_grammar_artikel_lessons` | `{ "artikel-gender-intro": { status, score, attempts }, ... }` |
| `app_artikel_session_scores` | `{ correct: N, total: N, date: "YYYY-MM-DD" }` |

### Existing keys used (read-only)
- `app_nouns_unlocked_level` — determines noun pool size

---

## Data Schema: `article-lessons.json`

Reuses the exact schema from `lessons.json`:

```json
[
  {
    "id": "artikel-gender-intro",
    "title": "What is Grammatical Gender?",
    "order": 1,
    "unlocks": [],
    "sections": [
      {
        "type": "explanation",
        "heading": "Three genders, one rule to learn each",
        "body": "...",
        "example_de": "der Mann · die Frau · das Kind",
        "example_en": "the man · the woman · the child"
      }
    ],
    "key_rules": ["...", "..."],
    "quiz": [
      {
        "type": "rule_check",
        "question": "...",
        "options": ["...", "...", "...", "..."],
        "correct": 0
      }
    ]
  }
]
```

---

## UI / UX Notes

- Module card on home screen: same grid tile as other modules. Icon: a gender symbol or the word "der/die/das" stacked. Tentative label: **Artikel**.
- Grammar lesson screen and quiz engine: reuse 100% of existing `Grammar` singleton and renderer from `grammar.js` — just feed `article-lessons.json` instead of `lessons.json`.
- Exercise session: new renderer in `exercises.js` for `select_article` type. Three-button layout, full-width. Auto-advance on correct, manual on wrong.
- No TTS on article exercises (article alone is not useful to hear in isolation).

---

## Constraints

- Offline-first — `article-lessons.json` bundled and precached in SW
- No new JS dependencies
- Exercise pool auto-updates without code change as user unlocks nouns — purely data-driven
- Existing users: no migration needed (no gating, so nothing is locked)

---

## Build Plan

| Phase | Scope | Est. |
|---|---|---|
| 1 | `article-lessons.json` — 6 lessons, full content (sections + key_rules + 5 quiz questions each) | 1 session |
| 2 | Module home — 8th tile, module home screen, Grammatik strip wired to article-lessons | 1 session |
| 3 | `select_article` exercise engine — runtime queue builder, card renderer, feedback, results | 1 session |
| 4 | Grammar lesson + quiz wiring — hook `article-lessons.json` into existing Grammar singleton | 0.5 session |
| 5 | QA + deploy | 0.5 session |

---

## Open Questions

1. **Module tile label** — "Artikel" or "Der · Die · Das" or something else? Proposal: **Artikel**.
2. **Results screen** — show breakdown by gender (X/Y der correct, etc.) or just total score? Proposal: total score only in v1, gender breakdown deferred.
3. **Session restart** — after completing all nouns, does the session reset immediately or show a "well done, come back later" screen? Proposal: reset immediately (same pattern as other modules).

---

*Sign-off required before build begins.*
