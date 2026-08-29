# PRD — Wechselpräfixe: teach the pairs explicitly

*Drafted 2026-08-28, Session 39. Status: SIGNED OFF + DELIVERED same session.*

**Outcome:** all four success criteria met. 11 verbs / 22 readings generated into
Lesson 5, `validate-prefixes.py` enforces coverage (negatively tested), 375px
verified by screenshot. Open question 1 resolved as proposed — rare readings are
listed with a register tag. Additionally fixed, found while grounding the glosses:
Lesson 5's opening example contradicted the rule it taught, as did the `überlaufen`
card in `prefixes.json`. The residual gap in §"Known gap" remains open by design.

---

## Problem

Session 39's verification found 11 verbs the app drills that have **two real readings**
with different separability — and for `umfahren` the readings are opposites
(drive around vs. run over). The app files one reading per verb and now glosses it
unambiguously, but it never tells the learner the other reading exists.

Lesson 5 (`Die Wechselpräfixe`) already teaches the *rule* — literal separates,
figurative does not, stress is the spoken signal — and uses `umfahren` and
`überlaufen` as illustrations. What it does not give is the **list**: which verbs in
this app are actually a pair, and what each half means.

Ricco's call (2026-08-28): teach the pairs explicitly in the lesson, rather than
putting a "second reading" note on each Verbs card.

## Success criteria

1. Lesson 5 names all 11 dual-reading verbs with both readings, both auxiliaries,
   and which half the app drills.
2. The list is **generated**, not hand-typed — it comes from the same Wiktionary
   cache that produced the AMBIGUOUS verdicts, so it cannot drift from the data.
3. A validator fails if an AMBIGUOUS verb is missing from the lesson.
4. Readable at 375px.

## The 11 verbs

`durchdenken` · `durchgehen` · `hintergehen` · `hinterlegen` · `umfahren` ·
`umgeben` · `unterhalten` · `überlaufen` · `überlegen` · `übersehen` · `übersetzen`

## Scope

**In:**
- `_factory/vorsilben/dual-readings.json` — one entry per verb. Authored: the two
  English glosses. Everything else (separability, Partizip II, auxiliary, which half
  the app drills) is **derived** from `wiktionary-cache.tsv` + `filed-facts.json`.
- `_factory/generate-dual-section.py` — builds the lesson section from that seed +
  the cache. Deterministic, re-runnable.
- A new `pairs` section type in the Lesson 5 data, rendered as stacked pair cards —
  a 4-column table does not survive 375px.
- `js/grammar.js` + `css/styles.css`: additive renderer branch for `type: "pairs"`.
  Existing `explanation` sections are untouched.
- `validate-prefixes.py`: new check — every AMBIGUOUS verb in `verify-report.md`
  has a `dual-readings.json` entry, and every entry's derived facts match the cache.
- Rebundle `js/prefixes-data.js`, run `qa-prefixes.js`, bump SW to v18.

**Out:**
- Any change to the Verbs-module cards (that was the option not chosen).
- New exercises. The lesson quiz keeps its 5 existing `rule_check` questions.
- Verbs beyond the 11 — `wiederholen` and friends are taught as rule, not listed.

## Constraints

- `js/grammar.js` is shared by all five lesson renderers. The change must be a new
  branch, never an edit to the existing one — `qa-prefixes.js` regressions on
  Verbs/Partikeln/Deklinationen must stay green.
- The second-reading glosses are authored, so they are judgement calls: they go into
  `judgement-review.md` and are checked against Wiktionary sense-lines, not Ricco.
- One session.

## Known gap (flagged, not solved here)

Teaching the pairs in Lesson 5 does **not** reach a learner drilling `umfahren` in
the **Verbs** module — different module, no gating, no cross-link. This PRD closes
the "the app never teaches it" gap, not the "the learner meets it cold" gap. If that
second gap matters, the fix is a link or a note on the card, which is the option
explicitly not chosen. Recorded here so the decision stays visible.

## Open questions

1. `umgeben` and `übersehen`'s separable halves are rare-to-marginal (`umgegeben`,
   `übergesehen`). List them anyway for completeness, or mark them "rare"?
   Proposing: list with a "selten" tag — hiding them makes the rule look leakier
   than it is.
