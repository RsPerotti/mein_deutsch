# Mein Deutsch — Source of Truth
*Last updated: 2026-06-03 — Session 3*

---

## Current State

App is working end-to-end with full verb content. All 100 root verbs (A1–B2) are populated with conjugations, grammar info, and prefix variants. All 234 word IDs (100 roots + 138 variants — after deduplication) have exactly 4 exercises each, giving 936 exercises total. `js/data.js` is regenerated and ready. The Verbs module is content-complete for v1.

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
| `icons/icon-192.png` | ✅ Placeholder | To be replaced with proper icon |
| `icons/icon-512.png` | ✅ Placeholder | To be replaced with proper icon |
| `_factory/seeds/verbs-level1.json` | ✅ Done | All 25 words status: done |
| `_factory/seeds/verbs-level2.json` | ✅ Done | 25 A2 verbs — generated in Session 3 |
| `_factory/seeds/verbs-level3.json` | ✅ Done | 25 B1 verbs — generated in Session 3 |
| `_factory/seeds/verbs-level4.json` | ✅ Done | 25 B2 verbs — generated in Session 3 |

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

## Content Progress

| Batch | Level | Root Words | Variant Words | Exercises | Status |
|---|---|---|---|---|---|
| verbs-level1 | A1 | 25 | 52 | 308 (100 root + 208 variant) | ✅ Done |
| verbs-level2 | A2 | 25 | 50 | ~240 | ✅ Done |
| verbs-level3 | B1 | 25 | 33 | ~232 | ✅ Done |
| verbs-level4 | B2 | 25 | 3 | ~112 | ✅ Done |
| **Total** | A1–B2 | **100** | **138** | **936** | ✅ Done |

*Note: Some verbs appear as both root verbs (at a higher level) and prefix variants of lower-level roots (e.g. anerkennen, gehören). Their exercises count once, as root exercises.*

## Next Steps

1. **Icons:** Replace placeholder icons with proper "MD" branded icons (design in Claude.ai Design).
2. **GitHub Pages:** Set up hosting so the app is shareable via link.
3. **Test full exercise flow** with new content — verify all levels unlock and display correctly.
4. **Nouns module** — next content batch when ready.

## Open Questions / Known Gaps

- Icons are placeholder — need proper branded design
- Pronunciation uses device TTS (no audio files) — acceptable for v1
- GitHub Pages hosting: set up when first content batch is ready
