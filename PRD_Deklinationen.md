# PRD — Adjektiv-Deklinationen

*Status: ✅ SIGNED OFF — 2026-07-08 (Session 36)*
*Created: 2026-07-08*

---

## Problem

Adjective endings (der große Hund / ein großer Hund / großer Hund) are one of the hardest mechanical systems in German — and the app currently has nothing for them. The Deklinationen card in the Adjectives module is a greyed-out placeholder. Ricco knows 136 adjectives in base form but has no way to drill the ending system that governs how they actually appear in sentences.

## Success Criteria

- Ricco can practice typing the correct ending for any pattern × case combination, with instant rule feedback after every answer.
- Lessons explain the full system (weak/mixed/strong) well enough that the "which ending?" decision becomes mechanical.
- Live on GitHub Pages as v13. Zero exercise-integrity errors (every sentence unambiguously determines exactly one ending).

## Scope

**In:**
- Activate the Deklinationen card in the Adjectives module home.
- **5 grammar lessons** (Artikel format: 4 sections + 5-question quiz, **no gating** — all exercises open from the start):
  1. Warum Endungen? — attributive vs. predicative, case recap
  2. Schwache Deklination (after der/die/das, dieser, jeder) — only -e and -en
  3. Gemischte Deklination (after ein, kein, mein…)
  4. Starke Deklination (no article) — adjective carries the case signal
  5. Der Entscheidungsweg — the "which ending do I need?" decision path, all patterns side by side
- **New exercise type `type_ending`:** sentence with the ending blanked — *"Ich sehe den groß___ Hund."* — user types it (free text). Endings are ASCII only (-e, -en, -er, -es, -em), so no umlaut keyboard issue.
- **Feedback card after every answer** (like Partikeln): pattern + case + the rule that produced the ending. Essential since there's no gating.
- **Pattern picker** on the exercise start screen: Schwach / Gemischt / Stark / Alle. Cases mixed within each pattern.
- **Pre-generated exercise JSON** via the factory pipeline: sentences built from existing adjectives + existing nouns (genders already known from nouns.json). Validation pass before merge.
- Plural covered inside each pattern's lesson and exercise set (no separate lesson).

**Out (explicitly):**
- Stem-changing adjectives in the typing pool (dunkel→dunkl-, hoch→hoh-, teuer→teur-). Typing "the ending" breaks when the stem changes. They get a note in Lesson 5; exercises deferred.
- Indeclinable adjectives (rosa, lila, prima).
- Comparative/superlative declension (der größere Hund) — later expansion.
- Adjectival nouns (der Deutsche / ein Deutscher) — later expansion.
- Gating of any kind.

## Constraints

- Same stack: vanilla JS PWA, data bundled to `js/declension-data.js`, service worker bump to v13.
- Single-answer integrity: every sentence must pin down gender + case + pattern with no ambiguity. Enforced by a validation script in `_factory` (same discipline as Partikeln Phase 6).
- Nouns used in sentences come from `data/nouns.json` only — no new vocabulary load.
- Adjective pool: existing 136 adjectives minus stem-changers/indeclinables (~120 usable).

## Proposed Volume

**~360 exercises: 3 patterns × 4 cases × ~30 sentences.** Each carries CEFR from its adjective; picker defaults to A1 like other modules. Adjustable at sign-off.

## Proposed Build Phases

| # | Phase | Output |
|---|---|---|
| 1 | Data architecture | `data/grammar/declension-lessons.json` schema, `data/exercises/exercises-declension.json` schema, `type_ending` spec |
| 2 | Lessons content | 5 lessons × 4 sections × 5 quiz questions |
| 3 | Exercise generation | Factory run: ~360 sentences + validation script, 0 integrity errors |
| 4 | Engine | `type_ending` renderer, feedback card, pattern picker, module home card activation |
| 5 | QA + deploy | Device pass, service worker v13, push live |

## Resolved Questions (sign-off, 2026-07-08)

1. **Typing tolerance:** ending only — strict match. "en" is correct, "großen" is not.
2. **Volume:** ~360 (30 per pattern × case).
3. **Case filter:** pattern picker only in v1; feedback card teaches the case.

---

*Signed off 2026-07-08. Build phases 1–5 approved.*
