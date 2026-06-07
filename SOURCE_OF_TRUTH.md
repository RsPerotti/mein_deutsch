# Mein Deutsch — Source of Truth
*Last updated: 2026-06-07 — Session 10*

---

## Current State

**Nouns module restructured.** App at https://rsperotti.github.io/mein_deutsch. All four modules active. Nouns module now has Stammnomen + Variationen structure (mirroring verbs). Article exercises removed from Nouns (will move to future Articles module). Next: push to GitHub Pages.

## What Exists

| File / Folder | Status | Notes |
|---|---|---|
| `index.html` | ✅ Updated | All screens: Home, Word List, Module Home, Exercise, Verbliste, Nomenliste, Adverbliste, Adjektivliste, Results |
| `css/styles.css` | ✅ Built | Full design system — CSS variables, all components |
| `js/app.js` | ✅ Updated | Router, data loading, all module home renderers + Adjektivliste |
| `js/progress.js` | ✅ Updated | `app_adjectives_unlocked` key + `getUnlockedAdjectives()` / `unlockAdjective()` methods |
| `js/exercises.js` | ✅ Updated | Adjectives in queue builder, context label, unlockWord |
| `js/wordpractice.js` | ✅ Updated | Adjektive class added to WLP_CLASSES picker |
| `js/wordlist.js` | ✅ Updated | Adjectives in buildWordObjects() and _countTotalWords() |
| `data/modules.json` | ✅ Updated | 4 modules: Verbs + Nouns + Adjectives + Adverbs (all active) |
| `js/data.js` | ✅ **Bundled** | All content embedded. Total exercises: 2,369. Regenerate after each batch. |
| `data/verbs.json` | ✅ **100 verbs** | All 4 levels (A1–B2), 25 per level — complete |
| `data/exercises/exercises-verbs.json` | ✅ **936 exercises** | 234 word IDs × 4 exercises each |
| `manifest.json` | ✅ Built | PWA config |
| `service-worker.js` | ✅ Built | Cache-first offline strategy |
| `icons/icon-192.png` | ✅ Done | Speech bubble "de" icon, #85B7EB blue background |
| `icons/icon-512.png` | ✅ Done | Speech bubble "de" icon, #85B7EB blue background |
| `_factory/seeds/verbs-level1–4.json` | ✅ Done | All 100 verbs status: done |
| `data/nouns.json` | ✅ **175 nouns** | A1–B2 complete. 97 roots + 78 variations. `section` + `formation` fields added. No article_choice exercises. |
| `data/exercises/exercises-nouns.json` | ✅ **525 exercises** | 175 × 3 (fill_blank ×2 + translate_word ×1). article_choice removed (future Articles module). |
| `_factory/seeds/nouns-level1–4.json` | ✅ Done | All 175 nouns status: done |
| `data/adverbs.json` | ✅ **127 adverbs** | A1–B2 complete (29+25+51+22) |
| `data/exercises/exercises-adverbs.json` | ✅ **508 exercises** | 127 adverbs × 4 each |
| `_factory/seeds/adverbs-level1–4.json` | ✅ Done | All 127 adverbs status: done |
| `data/adjectives.json` | ✅ **100 adjectives** | A1–B2 complete (25+25+25+25) |
| `data/exercises/exercises-adjectives.json` | ✅ **400 exercises** | 100 adjectives × 4 each (translate DE→EN, fill_blank, translate EN→DE, fill_blank harder) |
| `_factory/seeds/adjectives-level1–4.json` | ✅ Done | All 100 adjectives status: done |

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

## Content Progress

| Batch | Category | Level | Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1–4 | Verbs | A1–B2 | 100 root + 138 variants | 936 | ✅ Done |
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

## Total app content: 2,544 exercises across 4 modules

## Hosting

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` branch → GitHub Pages auto-deploys

## Next Steps

1. **Push Session 10 to GitHub** — Adjectives module is live locally, needs deploy
2. **Deklinationen area** — second card in Adjectives module (gender/case matching exercises)
3. **Enrich adjective content** — add more words once Deklinationen is built

## Open Questions / Known Gaps

- Adjectives Deklinationen card is a placeholder — exercises and UI not yet built
- Pronunciation uses device TTS (no audio files) — acceptable for v1
