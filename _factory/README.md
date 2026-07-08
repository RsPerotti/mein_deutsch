# Content Factory — Mein Deutsch

This folder is never served to the app. It contains tools for generating content at scale.

## Workflow (one batch = 25 verbs = ~100 exercise records)

1. **Open** `seeds/verbs-level1.json` — check which words are `"status": "pending"`
2. **Copy** `batch-prompt.md` into a new Cowork session, attach blueprint + seed file
3. **Save** Claude's output as `temp-words.json` and `temp-exercises.json` here
4. **Run** `validate-prompt.md` — paste the temp files alongside it
5. **Fix** any flagged issues, re-validate until "Validation passed"
6. **Merge** — append temp-words content into `/data/verbs.json`, temp-exercises into `/data/exercises/exercises-verbs.json`
7. **Update** the seed file: set each processed word's `"status"` to `"done"`
8. **Regenerate `js/data.js`** — ask Claude to run the data bundler so the app picks up the new content

## Files

| File | Purpose |
|---|---|
| `batch-prompt.md` | Reusable prompt for generating word entries + exercises |
| `validate-prompt.md` | Reusable prompt for checking a batch before merging |
| `seeds/verbs-level1.json` | 25 A1 root verbs — first batch to process |

## Scale reference

| Category | Roots | Exercises | Total |
|---|---|---|---|
| Verbs | 100 | 1,600 | ~1,700 |
| Nouns | 200 | 800 | ~1,000 |
| Adjectives | 150 | 1,200 | ~1,350 |

## Wörter Intake (reading vocabulary) — Session 35+

Ricco collects unknown words in a Google Sheet while reading:
https://docs.google.com/spreadsheets/d/1--W4h39JCh3p0heMWJN1ykHUPXRyfRfHWnAHBYrXHug/

**To process new words:** tell Claude "process my new words". The pipeline:

1. Read the sheet, diff against `intake-log.json` (every processed row is recorded there with its resolution)
2. Classify new rows: verb / noun / adjective / adverb / particle / expression; correct typos to standard lemmas; skip words already in the app
3. Author seed files (like `intake-2026-07-07/*-seeds*.json`) — conjugations, sentences, distractors
4. Generate entries + exercises mechanically (`intake-2026-07-07/generate_verbs.py` pattern), validate (blank counts, distractor counts, no correct-answer-in-wrongs, ID collisions), merge into `/data`
5. Rebundle `js/data.js`, bump service-worker CACHE version, QA, commit + push
6. Append new rows to `intake-log.json`

Expressions that fit no word category go to the **Ausdrücke** module (`data/expressions.json`).
