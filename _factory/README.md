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
