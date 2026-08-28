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


---

## Vorsilben (Prefixes) — Session 37

Pipeline. Run in order; the validator must report **0 integrity errors** before merge.

```bash
python3 _factory/generate-prefixes.py   # -> data/exercises/exercises-prefixes.json (330)
python3 _factory/validate-prefixes.py   # independent integrity check
python3 _factory/bundle-prefixes.py     # -> js/prefixes-data.js
npm install jsdom && node _factory/qa-prefixes.js   # 49 headless checks
```

**Curated source:** `data/prefixes.json` — 35 prefixes x 10 worked examples. This is
the file to edit when content changes. `_factory/vorsilben/source-reference.html` is
the reviewed reference it was derived from.

**Rules the validator enforces**

- Exactly one correct answer; 4 distinct options.
- Near-synonym prefixes never co-occur as options (ab/weg/fort, ver/zer, miss/ver,
  an/zu, durch/uber, zuruck/wieder, mit/zusammen, mit/bei, weiter/fort, nieder/ab,
  entgegen/wider, her/hin). The validator holds its **own** copy of this table.
- `select_prefix`: no distractor may form a real verb with the target meaning.
- `select_prefix`: prefix + root must literally reconstruct the answer verb.
- Core feelings globally unique (otherwise `select_feeling` has no single answer).
- `exercisable: false` prefixes (emp-, hinter-) must have zero exercises.

**Note:** the generator is seeded (`SEED = 20260826`), so regeneration is
byte-identical unless `data/prefixes.json` changes.


---

## Vorsilben -> Verbs reconciliation — Session 38 (v16)

Adds the prefix verbs from the Vorsilben module into `data/verbs.json` as
`prefix_variants`, with the full 8-exercise package each.

```bash
python3 _factory/generate-variants.py   # +133 variants, +1064 exercises, writes judgement-review.md
python3 _factory/validate-variants.py   # independent check — must be 0 errors
python3 _factory/bundle-data.py         # rebuild js/data.js from data/*.json
node _factory/qa-variants.js            # 21 headless checks
```

**Authored source:** `_factory/vorsilben/variant-seeds-*.json`. Only what cannot be
derived lives there — separability, auxiliary, case, and two example complements
per verb. Every judgement call carries a `judgement` field and is collected into
`_factory/vorsilben/judgement-review.md`.

**Derived, never authored:**
- Partizip II — separable: prefix + root participle; inseparable: prefix + root
  participle minus the `ge-` augment.
- Präsens / Präteritum — lifted from the root's existing `conjugation_table`
  exercises (no root stores Präteritum in `verbs.json`).
- Perfekt — seeded auxiliary paradigm + derived participle.

**Trap to know about:** you cannot detect a leftover `ge-` augment by inspecting
the characters after the prefix. Roots whose *stem* starts with "ge" (geben,
gehen, gewinnen) make it undecidable — `umgeben` is the correct inseparable
participle of `umgeben`. The validator derives and compares instead, and only
emits an eyeball warning for the ambiguous shape.

**Backups** of the pre-run files are in `_factory/vorsilben/backups/`.

`bundle-data.py` is also the first reproducible builder for `js/data.js`, which
until now was assembled ad hoc — the reason `js/data.js` and `data/modules.json`
drifted apart before (day log v10).
