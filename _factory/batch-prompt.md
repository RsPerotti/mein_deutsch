# Batch Generation Prompt — Mein Deutsch Content Factory

Copy this entire prompt into a new Cowork session. Fill in the [brackets] before sending.

---

```
BATCH GENERATION REQUEST — MEIN DEUTSCH CONTENT FACTORY

I am building a German learning app called Mein Deutsch.
Attached: german-app-blueprint.md (full project spec)
Attached: [seed file name, e.g. verbs-level1.json]

TASK:
Process all words in the attached seed file that have "status": "pending".
For each word, generate TWO outputs:

OUTPUT 1 — Word entry for /data/verbs.json
Follow the exact JSON structure from Section 6.1 of the blueprint.
Every verb entry MUST include:
- id (format: verb_[infinitive])
- root, english, type, frequency_rank, module, unlock_level
- conjugation: present (all 6 forms), past_participle, auxiliary
- prefix_variants: top 3–5 most common only, each with id/prefix/word/english/separable/notes
- example_sentences: minimum 2, each with de/en/exercise_type
- grammar: transitivity, case_requirements, notes_en, dual_case
- tags: include the CEFR level tag (a1/a2/b1/b2)

OUTPUT 2 — Exercise entries for /data/exercises/exercises-verbs.json
Generate exactly 4 exercises per word, in this order:
  1. fill_blank (difficulty 1) — sentence with the verb missing (use _____ for blank)
  2. translate_word (difficulty 1) — see German verb, pick English meaning
  3. conjugation_choice (difficulty 2) — pick correct conjugated form for a given pronoun
  4. fill_blank (difficulty 2) — harder sentence, different context

Rules for exercises:
- Wrong answers must be plausible (other conjugation forms, similar verbs — never random)
- Every exercise must include explanation_en (plain English grammar explanation, 1–2 sentences)
- Every fill_blank must include both "de" (with _____ for blank) and "en" fields in the question
- Exercise IDs follow pattern: ex_[verb]_001 through ex_[verb]_004
- word_id must exactly match the verb's id field

FORMAT:
Return OUTPUT 1 (word entries) and OUTPUT 2 (exercise entries) as separate JSON code blocks.
Label them clearly: "=== OUTPUT 1: verbs.json ===" and "=== OUTPUT 2: exercises-verbs.json ==="
Do not return prose explanations between the blocks.
After the JSON, add one line: "Batch complete: X words processed, Y exercises generated."
```
