# PRD — Vorsilben (Verb Prefixes)

*Status: ✅ SIGNED OFF — 2026-08-26 (Session 37)*
*Created: 2026-08-26*

---

## Problem

German verb prefixes are a generative system, not vocabulary. A learner who knows that `ver-` means *away / wrong / transformed / used up* can predict the meaning of hundreds of verbs they have never seen. A learner who doesn't must memorise each one individually.

The app currently teaches prefix verbs only as **outcomes** — 154 `prefix_variants` sitting under their root verbs in the Verbs module, each learned as its own item. Grammatik Lesson 3 (*Trennbare Verben*) covers the mechanical rule (where the prefix goes in a main clause) but says nothing about what any prefix *means*. There is no module that teaches the rule that would let Ricco decode a new prefix verb on sight.

Native speakers describe these prefixes as carrying a *feeling* — hear `mit-` and you already know the word is about togetherness before you know the verb. That intuition is learnable and currently untaught.

## Success Criteria

- Given an unfamiliar prefixed verb, Ricco can state the prefix's core feeling and make a defensible guess at the meaning.
- Given a root verb and a target meaning, Ricco can select the correct prefix (*kaufen* + "to sell" → `ver-`).
- All 35 prefixes browsable as a reference, filterable by separability, usable as lookup mid-conversation.
- Live on GitHub Pages as v14. Zero exercise-integrity errors.

## Scope

**In:**

- **New standalone module `Vorsilben`** (10th module, `unlock_order: 10`). Cloned from the Partikeln architecture.
- **35 prefixes** across three groups:
  - Untrennbar (8): be-, ent-, emp-, er-, ge-, miss-, ver-, zer-
  - Trennbar (20): ab-, an-, auf-, aus-, bei-, ein-, fort-, her-, hin-, los-, mit-, nach-, nieder-, vor-, weg-, weiter-, zu-, zurück-, zusammen-, entgegen-
  - Beide (7): durch-, hinter-, über-, um-, unter-, wider-, wieder-
- **Per-prefix reference card:** core feeling (one line), the feeling paragraph, mnemonic, separability, and 10 worked examples with root verb, meaning, and a one-line explanation of why the prefix produces that meaning.
- **Filter axis: Trennbar / Untrennbar / Beide / Alle.** Replaces the CEFR picker used in other modules — see Constraints.
- **5 grammar lessons** (Artikel/Deklinationen format: 4 sections + 5-question quiz, **no gating**):
  1. Was sind Vorsilben? — the feeling principle; prefixes as modifiers, not words
  2. Trennbar oder untrennbar? — stress, position in the main clause, `ge-` in the perfect, the `zu` rule
  3. Die untrennbaren Vorsilben — be-, ent-, er-, ver-, zer-, ge-, miss-, emp-
  4. Die trennbaren Vorsilben — direction, contact, completion; the her-/hin- axis
  5. Die Wechselpräfixe — durch-, über-, um-, unter-, wider-, wieder-, hinter-; literal = separable, figurative = inseparable
- **Two new exercise types:**
  - `select_prefix` — root verb + target English meaning → pick the prefix. Tests generation.
  - `select_feeling` — prefixed verb → pick the core feeling. Tests decoding.
- **Feedback card after every answer** (Partikeln pattern, lime left border): prefix + core feeling + the specific reason this prefix produces this meaning. Essential given no gating.
- **Reconciliation with `verbs.json`** — see dedicated section below.

**Out (explicitly):**

- Noun and adjective prefixes (`un-`, `ur-`, `erz-`). Verb prefixes only.
- Prefixed verbs whose root verb does not exist in `verbs.json` — 121 items, logged for a future Wörter intake.
- Separable prefix compounds (`herunter-`, `hinauf-`, `hereinkommen-`). Covered descriptively inside the her-/hin- reference cards and Lesson 4, but not given their own entries or exercises.
- TTS. Same reasoning as Partikeln — stress placement is the whole point with `úmfahren` / `umfáhren`, and flat TTS would teach it wrong.
- Gating of any kind.
- CEFR tagging.

## Constraints

- Same stack: vanilla JS PWA, data bundled to `js/prefixes-data.js`, service worker bump to **v14**.
- **Deviation from convention — flagged:** every other module filters by CEFR. This one filters by separability instead. Prefixes do not map cleanly onto CEFR (`ver-` is A2 in *verkaufen* and C1 in *sich versprechen*), and separability is the axis that actually governs how the verb behaves in a sentence. This is a deliberate departure and should be recorded in Active Decisions.
- **Single-answer integrity is the top constraint**, as with Partikeln. Enforced by `_factory/validate-prefixes.py` holding an independent copy of the rules:
  1. Exactly one correct answer per exercise.
  2. `select_prefix`: no distractor prefix, combined with the root, may produce a real verb whose meaning matches the target meaning. (*kaufen* + "to sell" is safe even though *einkaufen* and *abkaufen* exist, because neither means "to sell".)
  3. `select_feeling`: near-synonym prefixes may never appear together as options. Exclusion pairs: ab-/weg-/fort- (all "away"), ver-/zer- on destruction items, miss-/ver- on error items, an-/zu- on "toward" items.
  4. Every referenced root verb must exist in the prefix dataset.
- Content source: the 35-prefix reference already built (`German-Prefixes.html`), reviewed before merge.

## Reconciliation with the Verbs Module

The reference contains **342 verb entries**. Measured against `verbs.json` (149 roots + 154 variants):

| Bucket | Count | Action |
|---|---|---|
| Already present as root or variant | 79 | Cross-link. Detail card deep-links to the Verbliste entry. |
| Missing, but **root verb exists** in the app | 142 | **Add as `prefix_variants`** under the existing root. |
| Missing, **root verb absent** too | 121 | Out of scope. Logged to `_factory/prefix-intake-backlog.json` for a future Wörter intake. |

**Scope flag.** Bucket 2 is the expensive one. Adding 142 new `prefix_variants` at the current blueprint rate of 8 exercises per new word is roughly **1,100 additional verb exercises**, a `verbs.json` rewrite, and a `data.js` rebundle (currently 2.2 MB). That is comparable in size to the Vorsilben module itself and carries its own validation burden.

Two ways to sequence it — **this needs a decision at sign-off**:

- **Option A — one release.** Module + reconciliation ship together as v14. Verbs module gains 142 variants at the same moment the prefix module explains them. Coherent, but roughly doubles the build and doubles the surface area for a regression.
- **Option B — two releases (recommended).** v14 ships the Vorsilben module with cross-links to the 79 verbs that already exist. v15 does the reconciliation as its own session with its own validation pass. Ships value sooner, keeps the two risk surfaces separate, and lets device QA on the new module happen before `verbs.json` is touched.

## Proposed Volume

**350 exercises: 35 prefixes × 10.** Per prefix: 6 × `select_prefix`, 4 × `select_feeling`. Generated from the 342 worked examples, so every exercise is backed by reviewed content rather than invented at generation time. Adjustable at sign-off.

## Proposed Build Phases

| # | Phase | Output |
|---|---|---|
| 1 | Data architecture | `data/prefixes.json` (35), schemas for lessons + exercises, `select_prefix` / `select_feeling` spec |
| 2 | Lessons content | `data/grammar/prefix-lessons.json` — 5 lessons × 4 sections × 5 quiz questions |
| 3 | Exercise generation | `_factory/generate-prefixes.py` → 350 exercises; `_factory/validate-prefixes.py` → 0 integrity errors |
| 4 | Engine + UI | `modules.json` entry, module home, reference screen, detail sheet, two renderers, type filter, feedback card |
| 5 | QA + deploy | Headless pass, service worker v14, push live |
| 6 | Reconciliation | 142 `prefix_variants` into `verbs.json` + exercises + rebundle *(v15 if Option B)* |

## Resolved Questions (sign-off, 2026-08-26)

1. **Sequencing:** Option B — two releases. v14 = Vorsilben module. v15 = `verbs.json` reconciliation (Phase 6).
2. **Volume:** 10 per prefix (6 `select_prefix` + 4 `select_feeling`). With `emp-` and `hinter-` excluded from the drill pool, actual total is **33 × 10 = 330 exercises**.
3. **Title / icon:** `Vorsilben` / 🧩.
4. **Thin sets:** `emp-` and `hinter-` are **reference-only** — full detail cards, `"exercisable": false`, no exercises generated. The cards state plainly that these are closed sets.
5. **Adjacent bug:** fix in Phase 6. Add a per-variant `grammar` override field to `prefix_variants` while that data is already being rewritten, resolving the `verstehen` case-badge bug.

---

*Signed off 2026-08-26. Build phases 1–5 approved for v14; phase 6 approved for v15.*
