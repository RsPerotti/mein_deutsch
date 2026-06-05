# Mein Deutsch — Source of Truth
*Last updated: 2026-06-04 — Session 6*

---

## Current State

**Nouns module content-complete (A1–B2).** App at https://rsperotti.github.io/mein_deutsch. Verbs: complete (100 roots + 138 variants, 936 exercises). Nouns: 175 words across all 4 levels (25 A1 + 50 A2 + 50 B1 + 50 B2), 700 exercises, full UI live. Next: push to GitHub Pages and consider adjectives module.

## What Exists

| File / Folder | Status | Notes |
|---|---|---|
| `index.html` | ✅ Built | All screens embedded: Home, Word List, Module Home, Exercise, Verbliste, Results |
| `css/styles.css` | ✅ Built | Full design system — CSS variables, all components |
| `js/app.js` | ✅ Built | Router, data loading, home + module home renderers |
| `js/progress.js` | ✅ Built | localStorage abstraction — all keys from blueprint Section 4 + 11.6 |
| `js/exercises.js` | ✅ Built | Exercise engine — fill_blank, translate_word, conjugation_choice, cooldown |
| `js/wordlist.js` | ✅ Built | Word list display, search, bottom sheet, Verbliste, pronunciation |
| `data/modules.json` | ✅ Built | 3 modules: Verbs (active), Nouns + Adjectives (coming_soon) |
| `js/data.js` | ✅ **Bundled** | All content embedded here — replaces fetch(). Regenerate after each batch. |
| `data/verbs.json` | ✅ **100 verbs** | All 4 levels (A1–B2), 25 per level — complete |
| `data/exercises/exercises-verbs.json` | ✅ **936 exercises** | 234 word IDs × 4 exercises each |
| `manifest.json` | ✅ Built | PWA config |
| `service-worker.js` | ✅ Built | Cache-first offline strategy |
| `icons/icon-192.png` | ✅ Done | Speech bubble "de" icon, #85B7EB blue background |
| `icons/icon-512.png` | ✅ Done | Speech bubble "de" icon, #85B7EB blue background |
| `_factory/seeds/verbs-level1.json` | ✅ Done | All 25 words status: done |
| `_factory/seeds/verbs-level2.json` | ✅ Done | 25 A2 verbs — generated in Session 3 |
| `_factory/seeds/verbs-level3.json` | ✅ Done | 25 B1 verbs — generated in Session 3 |
| `_factory/seeds/verbs-level4.json` | ✅ Done | 25 B2 verbs — generated in Session 3 |
| `data/nouns.json` | ✅ **175 nouns** | A1–B2 complete (25+50+50+50) |
| `data/exercises/exercises-nouns.json` | ✅ **700 exercises** | 175 nouns × 4 each |
| `_factory/seeds/nouns-level1.json` | ✅ Done | 25 A1 nouns |
| `_factory/seeds/nouns-level2.json` | ✅ Done | 50 A2 nouns |
| `_factory/seeds/nouns-level3.json` | ✅ Done | 50 B1 nouns |
| `_factory/seeds/nouns-level4.json` | ✅ Done | 50 B2 nouns |
| `js/app.js` | ✅ Updated | Noun module home, Nomenliste, router entry |
| `js/exercises.js` | ✅ Updated | article_choice renderer, noun unlock/label |
| `js/wordlist.js` | ✅ Updated | Nouns in word list with article + plural |
| `js/progress.js` | ✅ Updated | `app_nouns_unlocked` key + methods |

## Design System

Extracted from design reference screenshots:
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
| Session size | **No cap** — full queue served until complete. Applies to all modules. No artificial limits. |

## Content Progress

| Batch | Level | Root Words | Variant Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1 | A1 | 25 | 52 | 308 (100 root + 208 variant) | ✅ Done |
| verbs-level2 | A2 | 25 | 50 | ~240 | ✅ Done |
| verbs-level3 | B1 | 25 | 33 | ~232 | ✅ Done |
| verbs-level4 | B2 | 25 | 3 | ~112 | ✅ Done |
| **Total** | A1–B2 | **100** | **138** | **936** | ✅ Done |

*Note: Some verbs appear as both root verbs (at a higher level) and prefix variants of lower-level roots (e.g. anerkennen, gehören). Their exercises count once, as root exercises.*

## Hosting

- **Live URL:** https://rsperotti.github.io/mein_deutsch
- **Repo:** https://github.com/RsPerotti/mein_deutsch (public)
- **Deploy:** push to `main` branch → GitHub Pages auto-deploys

## Content Progress

| Batch | Category | Level | Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1–4 | Verbs | A1–B2 | 100 root + 138 variants | 936 | ✅ Done |
| nouns-level1 | Nouns | A1 | 25 | 100 | ✅ Done |
| nouns-level2 | Nouns | A2 | 50 | 200 | ✅ Done |
| nouns-level3 | Nouns | B1 | 50 | 200 | ✅ Done |
| nouns-level4 | Nouns | B2 | 50 | 200 | ✅ Done |

## Next Steps

1. **Push to GitHub Pages** — deploy the expanded data.js (175 nouns, 700 exercises)
2. **Adjectives module** — next grammar category to build

## Open Questions / Known Gaps

- Pronunciation uses device TTS (no audio files) — acceptable for v1
