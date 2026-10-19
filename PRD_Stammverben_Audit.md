# PRD — Stammverben audit + stuck review mode

*Signed off by Ricco: 2026-10-19 ("proceed"). Session 41. **Delivered 2026-10-19 (v22).** Amended in build: the rule also requires the base verb to be living (not tagged *veraltet* on Wiktionary) — without it, gewinnen/verschwenden/verpflichten would have been demoted under obsolete bases, contradicting S13.*

## Problem
1. Leaving a Wiederholung session with the OS/browser back gesture (popstate) bypasses `exitExerciseEarly()`, so `exerciseMode` stays `'review'`. The next tap on Stammverben starts `Review.startSession()` instead — a mixed cross-module queue (variants like *verkaufen* included) whose answers, by design, do not move module progress bars. Same stale-mode risk for Vorsilben, Artikel, Deklination.
2. Stammverben is polluted. The Session 13 audit (2026-06-07) was applied only to the bundled `js/data.js`, never to `data/verbs.json`; Wörter Intake #1 rebuilt from `verbs.json` and silently reverted it. Result: 4 verbs filed as both root and variant, 14 base roots missing (their 126 exercises orphaned, never served), and ~37 prefixed verbs from Intake #1 filed as roots.

## Success criteria
- Tapping Stammverben always starts a Stammverben session regardless of how the previous session was left — proven by a test that fails on the old code.
- Every Stammverben exercise belongs to an unprefixed verb; every prefixed verb's exercises appear only under Variationen.
- No exercise lost or orphaned (the 126 are served again).
- Existing progress preserved (history is keyed by exercise_id).

## Scope — in
- Bug fix: popstate off the exercise screen routes through the same exit path as the in-app back button; opening a module session explicitly resets the mode.
- Restore Session 13: 14 bases back from the backup bundle, their prefixed verbs reparented, 4 duplicates removed — in `verbs.json`, rebundled via `bundle-data.py`.
- Rule: a verb is "prefixed" only when prefix + base and the base is an independent verb (checked against de.wiktionary.org). Base in app → variant of that base. Base not in app → standalone Variation (stays in `data/verbs.json`, flagged `"standalone_variant": true` — amended in build: a flag kept every existing lookup working instead of a new top-level array), no root unlock needed.
- Validator `_factory/validate-stammverben.py` + committed negative test.
- SW cache bump, push.

## Scope — out
- New base verbs (content freeze of 2026-08-28 stands).
- Backfilling progress from review answers (Ricco: "A Wiederholung session should be deliberate").
- Any change to Wiederholung itself.

## Open question (resolved)
- Root count drops (149 → ~90–100); Variationen grows. Accepted with sign-off.
