# PRD — Wörter Intake (Reading Vocabulary Enrichment)

*Drafted: 2026-07-07 — Session 35. Status: AWAITING SIGN-OFF.*

---

## Problem

Ricco collects unknown words in a Google Sheet while reading German books. These words live outside the app — no exercises, no tracking, no reinforcement. The app's vocabulary is frozen at its original A1–B2 seed lists and doesn't grow with actual reading progress.

## Success Criteria

1. Every new word from the sheet exists in the correct module (word list + exercises), live on the PWA.
2. Words already in the app are skipped — no duplicates.
3. Exercises pass the same integrity standard as existing content (single unambiguous answer, plausible distractors).
4. A repeatable intake process exists so future sheet additions take one short session, not a project.

## Source Data — Sheet Analysis (2026-07-07)

- 213 raw entries → 208 after in-sheet duplicate removal (*Erscheinen, Begriff, Beziehen, Bedürfnisse, tatsächlich* appear 2×)
- ~36 already in app (exact or as lemma of an inflected/misspelled form) → skipped
- **~160 new words:** ~55 verbs · ~50 nouns · ~35 adjectives · ~12 adverbs/connectors · ~8 expressions
- Typos corrected to standard lemmas during intake (e.g. *Anschlißen→anschließen, Wholbefinden→Wohlbefinden, Sogennante→sogenannt, entwaffen→entwaffnen*). Full correction list logged in the intake log.

## Scope

**In:**
- Classify, dedupe, lemma-correct all sheet entries
- Add new words to `data/{verbs,nouns,adjectives,adverbs}.json` with full schema (verbs: complete conjugation tables, auxiliary, grammar block)
- Generate exercises per existing schemas and counts (nouns ×3, adjectives ×4, adverbs ×4; verbs — see Open Questions)
- New **Ausdrücke module** (9th module) for expressions that fit no word category — *Schwein haben, Ratschläge geben, Bitte sachlich bleiben, Wie auch immer, Abgemacht/Einverstanden, Erlebnis vs Erfahrung, Möglich + wenig/viel/oft, Durcheinander/Ordentlich kommen*
- Rebundle `js/data.js`, bump service-worker cache version, QA, push
- Intake log (`_factory/intake-log.json`) + documented re-run workflow

**Out:**
- C1/C2 CEFR labels — everything capped at B2 (decision 2026-07-07)
- Editing the Google Sheet itself (read-only access; sheet stays the inbox)
- Prepositions/particles — no new ones found in this batch
- TTS, Deklinationen, listening content

## Constraints

- Existing JSON schemas are the contract — no schema changes to current modules
- Single-answer integrity rule applies to every exercise
- Ausdrücke module must follow the existing design system and module patterns
- `.git` inside Google Drive: remove stale lock files before committing

## Plan

| Phase | Work | Validation |
|---|---|---|
| 1 | Verbs (~55): entries + conjugations + exercises | Integrity pass before merge |
| 2 | Nouns (~50): entries + 3 exercises each | Integrity pass |
| 3 | Adjectives (~35): entries + 4 exercises each | Integrity pass |
| 4 | Adverbs/connectors (~12): entries + 4 exercises each | Integrity pass |
| 5 | Ausdrücke module: data file, module card, list screen, exercise engine, ~8 expressions | Manual QA in browser |
| 6 | Bundle `data.js`, bump SW version, full app QA, commit + push | Live check |
| 7 | Intake workflow: `_factory/intake-log.json`, README update | Dry-run description |

Phases 1–4 each end at a clean stopping point — if the session runs long, we pause between phases.

## Future Intake Workflow (streamlining recommendation)

1. Ricco keeps adding words to the same sheet — it stays the single inbox, no format rules needed
2. New session: "process my new words" → Claude reads the sheet, diffs against `_factory/intake-log.json` (records every processed sheet entry + its resolution: added-as / already-in-app / expression / skipped)
3. Only unprocessed rows get handled; same phase pipeline, much smaller batches
4. Optional later: turn this into a scheduled task or a saved skill once the process has survived 2–3 manual runs

## Open Questions

1. **Verb exercise depth.** Existing roots average ~22 exercises each (full Präsens + Vergangenheit coverage). For 55 new verbs that's ~1,200 exercises — disproportionate. **Recommendation:** 8 per verb (fill_blank ×2, translate_word, conjugation_choice, conjugation_table for Präsens; partizip_ii, auxiliary_choice, fill_blank for Vergangenheit) ≈ 440 exercises. Expandable later.
2. **Ausdrücke exercise types.** Recommendation: `translate_word` (meaning) + `fill_blank` (usage in context) + a "situation match" (pick the expression that fits a described situation), 4 per expression. Needs your input before Phase 5.
3. **Ausdrücke unlock/gating.** Recommendation: none — all visible, like Prepositions.

---

*Sign-off required before Phase 1 begins.*
