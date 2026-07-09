# Deklinationen — Data Architecture Spec (Phase 1)

*PRD: `PRD_Deklinationen.md` — signed off 2026-07-08*

---

## 1. The ending lookup table (single source of truth)

Adjective endings are **fully determined** by pattern × case × gender. This means every exercise can be machine-verified — the validation script recomputes the expected ending and compares. Zero trust in hand-written answers.

| | Schwach (der-word) | Gemischt (ein-word) | Stark (no article) |
|---|---|---|---|
| **Nom** m / f / n / pl | e / e / e / en | er / e / es / en | er / e / es / e |
| **Akk** m / f / n / pl | en / e / e / en | en / e / es / en | en / e / es / e |
| **Dat** m / f / n / pl | en / en / en / en | en / en / en / en | em / er / em / en |
| **Gen** m / f / n / pl | en / en / en / en | en / en / en / en | en / er / en / er |

Notes:
- Stark Genitiv m/n is **-en** (not -es) because the noun itself carries the -s signal.
- Gemischt plural requires kein/possessive (ein has no plural) — validation enforces this.

## 2. Exercise schema — `data/exercises/exercises-declension.json`

```json
{
  "id": "dekl_schwach_nom_001",
  "type": "type_ending",
  "cefr": "A1",
  "adjective_id": "adj_gross",
  "pattern": "schwach",
  "case": "nominativ",
  "gender": "m",
  "sentence_de": "Der groß___ Hund schläft im Garten.",
  "sentence_en": "The big dog is sleeping in the garden.",
  "correct": "e",
  "feedback": "Schwache Deklination: nach 'der' ist die Endung im Nominativ Maskulin immer -e."
}
```

Conventions:
- `___` marks the blank, exactly once, directly after the adjective stem (matches `fill_blank` convention).
- `pattern` ∈ schwach | gemischt | stark. `case` ∈ nominativ | akkusativ | dativ | genitiv. `gender` ∈ m | f | n | pl.
- `correct` ∈ e | en | er | es | em — the ending only (strict match per sign-off).
- ID scheme: `dekl_{pattern}_{case-abbrev}_{seq}`.

## 3. Lesson schema — `data/grammar/declension-lessons.json`

Identical to `article-lessons.json`: `id, title, order, unlocks (always []), sections (4), key_rules, quiz (5 rule_check questions)`. Rendered by a `DeclensionGrammar` singleton in `js/grammar.js` (clone of `ArticleGrammar` — no gating).

Lesson IDs, in order: `dekl-warum-endungen`, `dekl-schwach`, `dekl-gemischt`, `dekl-stark`, `dekl-entscheidungsweg`.

## 4. `type_ending` renderer spec (js/exercises.js)

- Sentence rendered with a short inline text input (`maxlength=2`, `autocapitalize=off`, `autocomplete=off`) replacing `___`.
- Check: `input.trim().toLowerCase() === correct` — strict, ending only.
- After every answer (right or wrong): **feedback card** (reuse `.particle-feedback-card` styles) showing pattern + case/gender + rule, e.g. "Schwach · Nominativ Maskulin → -e".
- No auto-advance on correct (same decision as Partikeln).
- Enter key submits.

## 5. Exercise start screen

- Pattern picker: Schwach / Gemischt / Stark / Alle (default Alle). Cases mixed within pattern.
- CEFR filter as in other modules, default A1, exact match, changeable mid-session.
- localStorage keys: `app_declension_pattern`, `app_declension_cefr`.

## 6. Validation script — `_factory/validate-declension.py`

Per exercise, fail if any of:
1. `___` count ≠ 1
2. `correct` ≠ table lookup for (pattern, case, gender)
3. `adjective_id` missing from adjectives.json, or adjective is stem-changing/indeclinable (blocklist in script: dunkel, hoch, teuer, sauer, rosa, lila, prima, …)
4. Noun in sentence not found in nouns.json, or nouns.json gender contradicts `gender` (singular only)
5. Article word in sentence contradicts `pattern` (der-word for schwach, ein/kein/possessive for gemischt, none before the adjective for stark)
6. `pattern=gemischt` + `gender=pl` + sentence uses "ein" (impossible form)
7. Duplicate IDs, malformed CEFR, missing fields

Target: 0 errors before merge (Partikeln Phase 6 discipline).

## 7. Bundle & deploy

- Lessons + exercises bundled into `js/declension-data.js` → `window.DECLENSION_DATA`.
- Add to service worker precache, bump to **v13**.
- Activate the Deklinationen card in `js/app.js` (~line 850).

## 8. Volume plan (per sign-off)

360 exercises = 3 patterns × 4 cases × 30. Within each 30: gender mix ≈ 8m/8f/8n/6pl; CEFR follows the adjective's level. Pool: ~120 usable adjectives.
