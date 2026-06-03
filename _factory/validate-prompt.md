# Validation Prompt — Mein Deutsch Content Factory

Use this after every batch generation, before merging into the main data files.
Paste the generated JSON alongside this prompt.

---

```
VALIDATION REQUEST — MEIN DEUTSCH CONTENT FACTORY

Attached: german-app-blueprint.md
Below: the JSON batch I just generated [paste batch here]

Check the batch against these rules and report any failures:

WORD ENTRY CHECKS:
[ ] Every entry has a unique id in correct format (verb_[word])
[ ] Every entry has frequency_rank (integer)
[ ] Every entry has at least 2 example_sentences
[ ] Every entry has a complete conjugation block (all 6 present tense forms)
[ ] Every entry has a grammar block with case_requirements and notes_en
[ ] No entry is missing module or unlock_level
[ ] prefix_variants: each has id, prefix, word, english, separable (boolean), notes

EXERCISE CHECKS:
[ ] Exactly 4 exercises per word (no more, no fewer)
[ ] Exercise IDs follow ex_[word]_001 through ex_[word]_004
[ ] word_id in each exercise matches the verb's id
[ ] Every exercise has correct_answer, wrong_answers (minimum 4), explanation_en
[ ] Wrong answers are plausible — flag any that seem random or unrelated
[ ] Every fill_blank exercise has both "de" (with _____) and "en" in the question block
[ ] No duplicate exercise_ids across the batch

REPORT FORMAT:
List each failure as: [FIELD] — [entry id] — [what is wrong]
If no failures: return exactly: "Validation passed. Ready to merge."
Do not return the full JSON — only the validation report.
```
