# PRD — Verify Variants (external dictionary check)

*Drafted 2026-08-28, Session 39. Status: SIGNED OFF + DELIVERED same session.*

**Outcome:** 120 PASS · 0 MISMATCH · 11 AMBIGUOUS · 2 NOT-FOUND. One real error (`durchgehen`) corrected. Success criteria 1–4 met for separability and auxiliary; case remains out of scope as specified. See `_factory/vorsilben/verify-report.md` and the Session 39 Day Log entry.

---

## Problem

Session 38 added 133 prefix variants to `verbs.json` and shipped them live in v16.
54 of those carry a **judgement call** that could not be derived mechanically —
separability, auxiliary, or case — plus 12 pre-existing case overrides.
`_factory/vorsilben/judgement-review.md` records them as UNVERIFIED.

Nothing in the pipeline checks them. `validate-variants.py` re-derives forms from
the seed, so if the seed says `durchsuchen` is separable, generator and validator
agree on a wrong answer. The error is invisible by construction, and Ricco cannot
catch it — he is the learner. If a call is wrong, he learns it wrong indefinitely.

## Success criteria

1. Every one of the 54 judgement calls has a machine-checked verdict against an
   external authority: PASS, MISMATCH, AMBIGUOUS, or NOT-FOUND.
2. Every MISMATCH is corrected in the seed files, regenerated, revalidated, rebundled.
3. The check is **repeatable** — a script in `_factory/`, runnable on the next intake,
   not a one-off conversation.
4. `judgement-review.md` loses its UNVERIFIED flag, or names exactly what is still open.

## Source of truth

**German Wiktionary** (`de.wiktionary.org`), via the MediaWiki API.
Every German verb page carries a `{{Deutsch Verb Übersicht}}` template with
**Partizip II** and **Hilfsverb** as structured fields. Both target facts fall out of it:

- **Auxiliary** — read directly from `Hilfsverb`.
- **Separability** — derived from Partizip II: a `ge` infix after the prefix
  (`durchgesucht`) means separable; no infix (`durchsucht`) means inseparable.
  Mechanical, no judgement.

Chosen over DWDS/Duden because it is the only one of the three with a structured,
parseable API and no scraping.

## Scope

**In:**
- `_factory/verify-variants.py` — reads the seeds, emits `verify-report.md`.
- Separability + auxiliary + Partizip II for all 133 variants (not just the 54 —
  the derived ones are free to check and confirm the derivation rules).
- **Multi-reading handling.** `umfahren`, `übersetzen`, `durchgehen` and friends have
  two readings with opposite separability. The check is *"does the app's chosen pair
  exist among the readings Wiktionary lists?"* — if yes, PASS. If the page lists more
  than one reading, additionally flag AMBIGUOUS, because the app teaches one meaning
  and the exercise sentences must match the reading we filed.
- Fixing whatever comes back MISMATCH, through the normal generate → validate →
  bundle → QA path.

**Out:**
- **Case requirements.** Wiktionary marks valency inconsistently in prose sense-lines;
  parsing it would be a heuristic dressed up as verification. The 22 case calls stay
  unverified and are logged as such. Separate job, different source (DWDS valency).
- The 121 prefix verbs whose root is missing — not in `verbs.json`, out of scope.
- Any content change beyond correcting a MISMATCH.

## Constraints

- **Network.** Your Mac's shell has none; the container is blocked from Wiktionary.
  Only the in-app browser can reach it, so the fetch runs there — I'll need you to
  approve `de.wiktionary.org` once. Batched 50 titles per request: 2 requests total.
- Consequence: `verify-variants.py` **cannot fetch by itself** in this environment.
  It splits in two — a fetch step (browser, produces `wiktionary-cache.json`) and a
  compare step (pure Python, offline, deterministic, re-runnable). The cache is
  committed so the verdict is reproducible without network.
- One session.

## Plan

1. Extract the 133 verbs + their filed (separability, aux, Partizip II) from the seeds.
2. Browser: two API calls, parse `Deutsch Verb Übersicht` per page → `wiktionary-cache.json`.
3. `verify-variants.py` compares filed vs. dictionary → `verify-report.md`.
4. Triage MISMATCH rows with you; correct seeds; regenerate + validate + bundle.
5. Update `judgement-review.md`, `SOURCE_OF_TRUTH.md`, `DAY_LOG.md`.

## Open questions

1. **A MISMATCH on a verb Wiktionary lists with only one reading — auto-correct or
   show you first?** Proposing: I correct it and log it. It is a dictionary fact, and
   routing it through you is the circularity the rule forbids.
2. **AMBIGUOUS rows** (both readings real, we filed one): confirm the exercise sentences
   match the filed reading, or drop the verb from the drill pool? Proposing: confirm the
   sentences, drop only if a sentence is genuinely ambiguous.
3. NOT-FOUND (no Wiktionary page): leave filed as-is and log, or drop? Proposing: log.
