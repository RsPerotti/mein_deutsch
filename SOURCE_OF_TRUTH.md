# Mein Deutsch — Source of Truth
*Last updated: 2026-06-07 — Session 14*

---

## Current State

**Präpositionen module live.** App at https://rsperotti.github.io/mein_deutsch. Five modules active. Prepositions has 53 entries (A1–B2), 158 exercises across two new types (select_preposition + select_case), and an inline difficulty picker. Pushed to GitHub.

## What Exists

| File / Folder | Status | Notes |
|---|---|---|
| `index.html` | ✅ Updated | Screens: Home, Word List, Module Home, Exercise, Verbliste, Nomenliste, Adverbliste, Adjektivliste, **Präpositionsliste**, Results |
| `css/styles.css` | ✅ Updated | Full design system. Added `.diff-btn`, `.prep-highlight`, `.case-dot-unknown` (dashed gray, no-case verbs). |
| `js/app.js` | ✅ Updated | Router, data loading, all module home renderers + Adjektivliste + Präpositionsliste. **Case dots on prep cards (left, no CEFR badge). Progress card shows exercise count only.** |
| `js/progress.js` | ✅ Updated | Root/variant split for nouns. Adjectives key. **Prepositions difficulty key** (`app_prepositions_difficulty`). |
| `js/exercises.js` | ✅ Updated | Nouns, adjectives, **prepositions** in queue builder. Two new renderers: `select_preposition`, `select_case`. Inline difficulty switcher. **`_ensureFirstExposure()`** guarantees translate_word is first for new words. **Parenthetical hints removed from all conjugation exercises.** **`returnFromResults` + `returnHome` fix nav stack bug (results screen no longer appears on back press).** |
| `js/wordpractice.js` | ✅ Built | Adjektive class in WLP_CLASSES picker |
| `js/wordlist.js` | ✅ Updated | Adjectives in buildWordObjects(). **Case dot helpers** (`_normalizeCase`, `_renderCaseDots`, `showCaseLegend`, `hideCaseLegend`). Verb cards show case dots on left; MIXED/STRONG/WEAK labels removed; dotted gray circle for verbs with no case. |
| `data/modules.json` | ✅ Updated | **5 modules**: Verbs + Nouns + Adjectives + Adverbs + **Prepositions** (all active) |
| `js/data.js` | ✅ **Bundled** | Format: `window.APP_DATA = {…}`. All content embedded. **Total exercises: 2,583 (post-audit)**. |
| `data/verbs.json` | ✅ **91 root verbs** | Audit complete. 23 moves/removes, 14 new bases added. |
| `data/exercises/exercises-verbs.json` | ✅ **992 exercises** | Post-audit. 14 new roots × 4 exercises added. |
| `manifest.json` | ✅ Built | PWA config |
| `service-worker.js` | ✅ Built | Cache-first offline strategy |
| `icons/` | ✅ Done | icon-192 + icon-512, speech bubble "de", #85B7EB |
| `data/nouns.json` | ✅ **175 nouns** | A1–B2. 97 roots + 78 variations. `section` + `formation` fields. |
| `data/exercises/exercises-nouns.json` | ✅ **525 exercises** | 175 × 3 (fill_blank ×2 + translate_word ×1) |
| `data/adverbs.json` | ✅ **127 adverbs** | A1–B2 complete |
| `data/exercises/exercises-adverbs.json` | ✅ **508 exercises** | 127 × 4 each |
| `data/adjectives.json` | ✅ **100 adjectives** | A1–B2 complete (25 per level) |
| `data/exercises/exercises-adjectives.json` | ✅ **400 exercises** | 100 × 4 each |
| `data/prepositions.json` | ✅ **53 prepositions** | A1–B2. Categories: two-way, akkusativ, dativ, genitiv. case_notes + example_sentences per entry. |
| `data/exercises/exercises-prepositions.json` | ✅ **158 exercises** | 79 select_preposition + 79 select_case. Difficulty: A1×42, A2×10, B1×74, B2×32. |

## Design System

- **Background:** `#EDE9E1` (warm beige)
- **Surface:** `#FFFFFF` (white cards)
- **Green dark:** `#2D4A1A` (accent, text, progress bars)
- **Green accent:** `#3D6020` (labels, links)
- **Green lime:** `#8DC44A` (hero card, success button)
- **Typography:** Roboto (system font on Android, fallback to system sans)

## Active Decisions

| Decision | Value |
|---|---|
| App name | Mein Deutsch |
| Platform | Android PWA (Chrome "Add to Home Screen") |
| Fonts | Roboto system font (no import — offline safe) |
| Pronunciation | Web Speech API (`speechSynthesis`, `de-DE`) |
| Exercises per word | 4 (blueprint rule) |
| Default sort | Alphabetical |
| Session size | **No cap** — full queue served until complete. Applies to all modules. |
| Adjectives scope | 100 adjectives (25 per level A1–B2); more to be added when Deklinationen area is built |
| Prepositions difficulty | Exact match (selecting B1 shows only B1 exercises). Default: A1. Changeable mid-session. |
| Prepositions unlock | None — all 53 always accessible in Präpositionsliste. No word unlock mechanic. |
| Prepositions CEFR cap | B2 (C1/C2 reserved in architecture for future expansion) |

## Content Progress

| Batch | Category | Level | Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1–4 | Verbs | A1–B2 | **91 root + 157 variants** | **992** | ✅ Audited |
| nouns-level1 | Nouns | A1 | 25 | 100 | ✅ Done |
| nouns-level2 | Nouns | A2 | 50 | 200 | ✅ Done |
| nouns-level3 | Nouns | B1 | 50 | 200 | ✅ Done |
| nouns-level4 | Nouns | B2 | 50 | 200 | ✅ Done |
| adverbs-level1–4 | Adverbs | A1–B2 | 127 | 508 | ✅ Done |
| adjectives-level1 | Adjectives | A1 | 25 | 100 | ✅ Done |
| adjectives-level2 | Adjectives | A2 | 25 | 100 | ✅ Done |
| adjectives-level3 | Adjectives | B1 | 25 | 100 | ✅ Done |
| adjectives-level4 | Adjectives | B2 | 25 | 100 | ✅ Done |
| **Adjectives total** | | A1–B2 | **100** | **400** | ✅ Done |
| prepositions | Prepositions | A1–B2 | 53 | 158 | ✅ Done |

## Total app content: 2,583 exercises across 5 modules

## Hosting

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` branch → GitHub Pages auto-deploys

## Next Steps

1. **Deklinationen area** — second card in Adjectives module (gender/case declension exercises)
2. **Enrich adjective content** — add more words once Deklinationen is built
3. **Push Session 13 changes** to GitHub
4. **Articles module** — future module; article_choice exercises stripped from Nouns are ready to be rebuilt here
5. **Prepositions C1/C2 expansion** — architecture ready; just add entries with `"cefr": "C1"` and `"difficulty": "C1"`

## Open Questions / Known Gaps

- Adjectives Deklinationen card is a placeholder — exercises and UI not yet built
- Articles module not yet started
- Pronunciation uses device TTS (no audio files) — acceptable for v1
- Prepositions not in Word List Practice mode (no unlock mechanic — by design)
- `verpflichten` remains a standalone root (base `pflichten` is archaic — left as-is by design)
- Session 13 changes not yet pushed to GitHub
