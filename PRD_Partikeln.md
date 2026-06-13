# PRD — Partikeln (Particles Module)
*Created: 2026-06-13 — Session 28*
*Status: Signed off — ready to build*

---

## Problem Being Solved

German particles (Partikeln) are one of the most important — and most neglected — features of natural-sounding German. They carry tone, attitude, register, and subtext that no direct translation can capture. A learner who knows all their verb conjugations but never uses "doch", "mal", or "ja" sounds correct but robotic, overly formal, and flat. Particles are what make speech sound genuinely German.

No existing module in the app addresses particles. Users have been building vocabulary and grammar knowledge, but this critical layer of naturalness has no home yet.

---

## Success Criteria

- A user who completes the Core tier understands when and why native speakers use the 20–25 most common particles, and can correctly place them in fill-in-the-blank sentences
- A user who completes the Advanced tier understands the nuanced C1–C2 particles used in formal speech, writing, and complex register situations
- The grammar reference area gives a user a fast lookup for any particle — what it signals, where it sits in a sentence, and 2–3 example uses
- The module feels meaningfully different from the word modules (Verbs, Nouns) — particles are about nuance, not memorisation, and the UX should reflect that

---

## Scope

### In (v1)

- Standalone module — 7th card on the home screen
- **Core area (A1–B2):** ~22 particles across 5 functional categories
- **Advanced area (C1–C2):** ~13 particles across 2 categories
- Grammar curriculum: category-based lessons + per-particle reference lookup
- Exercise type: fill-in-the-blank (select the correct particle to complete a sentence)
- Exercise flow: CEFR level filter, default A1 (same pattern as Prepositions)
- Soft gate: recommend grammar lesson before exercises, do not require it

### Out (v1)

- Audio recordings of particles in context (deferred — particles rely heavily on spoken tone)
- TTS pronunciation button on reference cards — **DECIDED OUT**: Web Speech API gives flat, intonation-free output; particles are precisely the words where intonation carries the meaning. TTS would be misleading, not helpful.
- Tone/intonation exercises (technically hard to implement without audio)
- Particles in Perfekt / subordinate clause positions (complex grammar interaction — deferred)
- Particle combinations (e.g. "doch mal", "ja auch") — advanced, deferred
- C2 literary/archaic particles (freilich, wohlan, etc.)

---

## Content Taxonomy

### Core (A1–B2) — ~22 particles

#### Category 1 — Modal Particles: Softening & Requesting
*Used to soften commands, make requests less abrupt, signal permission or encouragement*

| Particle | Signal | Example |
|---|---|---|
| mal | softens a request — "just" | Kannst du mal kurz helfen? |
| ruhig | permission / encouragement — "feel free" | Du kannst ruhig gehen. |
| einfach | resignation or simplification — "just", "simply" | Das ist einfach zu schwer. |
| bloß | warning / urgency | Mach das bloß nicht! |
| nur | gentle restriction or question softener | Ich wollte nur kurz fragen. |

#### Category 2 — Modal Particles: Shared Knowledge & Attitude
*Express what speaker assumes the listener already knows, or signal surprise/curiosity*

| Particle | Signal | Example |
|---|---|---|
| ja | shared knowledge, mild reproach | Das weißt du ja. |
| doch | contradiction, reassurance, invitation | Komm doch mit! / Das stimmt doch nicht. |
| auch | confirmation, reproach, "after all" | Das kann auch nicht sein. |
| denn | curiosity in questions, "then" | Was machst du denn hier? |
| etwa | concern or disbelief in questions | Bist du etwa krank? |

#### Category 3 — Modal Particles: Probability & Concession
*Express likelihood, resignation, or reluctant agreement*

| Particle | Signal | Example |
|---|---|---|
| wohl | probability / supposition | Er ist wohl noch unterwegs. |
| schon | reassurance / concession | Das wird schon klappen. / Schon, aber… |
| eigentlich | reservation / redirection / "actually" | Was willst du eigentlich? |
| eben | inevitability / resignation (slightly formal, standard German) | Das ist eben so. |
| halt | inevitability / resignation (colloquial, southern/Austrian) | Es geht halt nicht. |

#### Category 4 — Gradation & Focus Particles
*Emphasise, intensify, restrict, or highlight scope*

| Particle | Signal | Example |
|---|---|---|
| gar | intensifies negation — "not at all" | Das stimmt gar nicht. |
| wirklich | genuine emphasis — "really" | Ich meine das wirklich ernst. |
| sogar | "even" — marks surprising inclusion | Sogar er hat es geschafft. |
| erst | "only", "not until" — restriction | Ich bin erst 20. / Wir kommen erst um 9. |
| noch | "still", "yet", or "another" | Noch nicht. / Noch einen Kaffee? |

#### Category 5 — doch as Answer Particle *(special lesson)*
*"Doch" as a response to a negative statement — the yes-to-no*

| Use | Example |
|---|---|
| Affirming when challenged | "Du hast das nicht gemacht." — "Doch, habe ich!" |
| Correcting a negative assumption | "Du kommst nicht, oder?" — "Doch!" |

---

### Advanced (C1–C2) — ~13 particles

#### Category 6 — Nuanced Connectors
*Add explanation, concession, or framing to complex statements*

| Particle | Signal | Example |
|---|---|---|
| nämlich | explanation — "you see", "because" | Ich kann nicht, ich bin nämlich krank. |
| allerdings | concession/contrast — "however", "admittedly" | Das ist allerdings schwierig. |
| zwar | concession setup — "admittedly", "true, but…" | Ich habe zwar Hunger, aber kein Geld. |
| immerhin | consolation — "at least", "after all" | Immerhin hat er es versucht. |
| jedenfalls | "in any case", "at least" (wrapping up) | Das war jedenfalls sehr interessant. |
| ohnehin / sowieso | "anyway", "regardless" | Das wäre ohnehin zu spät gewesen. |

#### Category 7 — Emphasis & Register
*Mark surprise, irony, or formality in more complex speech*

| Particle | Signal | Example |
|---|---|---|
| ausgerechnet | "of all people/things" — ironic emphasis | Ausgerechnet er muss das sagen. |
| überhaupt | "at all", "generally", shifts scope | Willst du das überhaupt? / Das ist überhaupt kein Problem. |
| wiederum | "in turn", "on the other hand" | Das wiederum überrascht mich nicht. |
| wenigstens | "at least" — slightly more resigned than immerhin | Wenigstens hat er sich gemeldet. |
| zumindest | "at least" — more neutral/formal than wenigstens | Das war zumindest ehrlich. |
| bereits | "already" — more formal than schon | Er hat bereits alles erledigt. |
| freilich | "of course", "admittedly" — regional/formal | Das ist freilich eine andere Frage. |

---

## Grammar Curriculum Structure

Two layers, working together:

### Layer 1 — Category Lessons (structured, with quiz)
One lesson per category. Each lesson covers the particles in that group: what they signal, where in the sentence they sit, common pitfalls, and 2–3 contrasted examples.

| # | Lesson | Covers | Soft-gates |
|---|---|---|---|
| 1 | What Are Particles? | Intro — why particles exist, why they can't be translated literally | No exercises gated — always open |
| 2 | Softening & Requesting | mal, ruhig, einfach, bloß, nur | Category 1 exercises |
| 3 | Shared Knowledge & Attitude | ja, doch, auch, denn, etwa | Category 2 exercises |
| 4 | Probability & Concession | wohl, schon, eigentlich, eben, halt | Category 3 exercises |
| 5 | Gradation & Focus | gar, wirklich, sogar, erst, noch | Category 4 exercises |
| 6 | Doch — The Yes-to-No | doch as answer particle (all uses consolidated) | Category 5 exercises |
| 7 | Nuanced Connectors (C1) | nämlich, allerdings, zwar, immerhin, jedenfalls, ohnehin | Category 6 exercises |
| 8 | Emphasis & Register (C2) | ausgerechnet, überhaupt, wiederum, wenigstens, zumindest, bereits, freilich | Category 7 exercises |

**Soft gate implementation:** When user taps a category's exercise set without having read the lesson, show a prompt: *"We recommend reading [Lesson Name] first to get the most out of these exercises."* — with two CTAs: "Read lesson" and "Go to exercises anyway". No hard lock.

**Quiz:** Each lesson ends with a short quiz (6–12 questions, rule-check MC + fill-in-the-blank from the lesson's particle set). Pass threshold: 80%. Unlimited retries. Results show which particles the user struggled with.

### Layer 2 — Per-Particle Reference (lookup area)
A separate tab or section within the module: an alphabetical or category-sorted list of all particles. Tapping any particle opens its reference card:

**Reference card fields:**
- Particle (+ pronunciation guide if needed)
- Category (Modal / Gradation / Focus / Connector / etc.)
- CEFR level
- What it signals (1–2 plain-language sentences)
- Sentence position (where in a German sentence does it sit?)
- 3 example sentences (German + English)
- Common mistake / contrast (e.g. "eben vs halt", "wirklich vs eigentlich")
- Related particles (links)

---

## UI / UX

### Module Home

Two clearly labelled sections stacked vertically:

**Core (A1–B2)**
- Grammatik strip (lessons 1–6, horizontal scroll or vertical ladder — same pattern as Verbs)
- Category exercise cards (5 categories + answer particle = 6 cards)

**Advanced (C1–C2)**
- Grammatik strip (lessons 7–8)
- Category exercise cards (2 cards)

A fixed button at the top of the module home (below the module title, above the Core section):
- **"Alle Partikeln →"** — taps into the per-particle reference lookup (Layer 2). Always visible regardless of scroll position. Styled as a secondary action button (outline or ghost style in `#2D4A1A`).

### Exercise Screen
Reuses existing fill-in-the-blank / select_word exercise renderer.
- Each exercise shows a German sentence with a gap
- 3–4 particle options (multiple choice) — **all options must be unambiguously wrong except the correct one** (enforced at content generation time; distractors chosen for plausibility but clear incorrectness in the given sentence)
- **No auto-advance on correct answer** — same behaviour as wrong answer: result shown, user reads the feedback, then taps "Weiter" to continue
- After every answer (correct or incorrect): a particle feedback card is shown below the result

**Particle feedback card** (new UI element — unique to this module):

```
┌──────────────────────────────────────────┐
│ ║  doch — Contradiction & Reassurance    │
│   "Doch" softens an invitation and adds  │
│   a sense of 'go on, why not'. It works  │
│   here because the sentence is nudging   │
│   someone toward an action.              │
└──────────────────────────────────────────┘
```

Design: `background: rgba(141,196,74,0.08)` / `border-left: 3px solid #8DC44A` / `border-radius: 8px` / text in `#2D4A1A`. First line shows particle name + category label; body is the context-specific explanation from the `feedback` field. Sits between the result indicator and the "Weiter" button. Tweak during Phase 3 once visible on device.

**CEFR level filter:** Same pill-button approach as Prepositions. Default A1. Visible on module home and within exercise session.

### Lesson Screen
Reuses the existing grammar lesson renderer from Verbs (explanation sections + key rules + quiz CTA).

### Reference Screen
New screen type: `particle-reference`
- Header: "Alle Partikeln"
- Sort toggle: Alphabetical / By Category
- Search field (filter by particle name)
- List of particle cards (expandable inline, or tap-to-detail)

---

## Data Architecture

### New files

```
data/
└── particles.json             ← all particle definitions (both tiers)

data/exercises/
└── exercises-particles.json   ← fill-in-the-blank exercises

data/grammar/
└── particle-lessons.json      ← lesson content for all 8 lessons
```

### `particles.json` schema (per entry)
```json
{
  "id": "doch",
  "particle": "doch",
  "category": "modal-attitude",
  "cefr": "A2",
  "tier": "core",
  "signals": "Contradiction, reassurance, or invitation — challenges a negative assumption or softens a request.",
  "position": "Mid-sentence, after the verb or subject. Never in first position (except as answer particle).",
  "examples": [
    { "de": "Komm doch mit!", "en": "Come along, why don't you!" },
    { "de": "Das stimmt doch nicht.", "en": "That's not right, is it." },
    { "de": "Du weißt das doch.", "en": "You do know that." }
  ],
  "contrast_note": "Doch as answer particle ('Doch!') is a separate use — see Category 5.",
  "related": ["ja", "etwa", "schon"]
}
```

### `exercises-particles.json` schema (per exercise)
```json
{
  "id": "particles_doch_001",
  "type": "fill_blank_particle",
  "cefr": "A2",
  "particle_id": "doch",
  "category": "modal-attitude",
  "sentence_de": "Komm ___ mit! Es wird Spaß machen.",
  "sentence_en": "Come along! It'll be fun.",
  "options": ["doch", "mal", "ja", "wohl"],
  "correct": "doch",
  "feedback": "Doch softens an invitation and adds a sense of 'go on, why not'. It nudges someone toward an action without being pushy."
}
```

**Exercise quality rules (enforced at content generation):**
- Options must have exactly one unambiguous correct answer in the context of that specific sentence
- Distractors are chosen for plausibility (same grammatical position, similar register) but must be clearly wrong in the given sentence — if two particles could work, the sentence must be rewritten
- Each exercise shows the full context sentence in German + English translation
- The `feedback` field explains *why* the correct particle works in this specific sentence (not just a generic particle definition)

### `particle-lessons.json` — same schema as `lessons.json` (Verbs)

### New localStorage key
- `app_particles_lesson` — `{ "particles-intro": { status, score, attempts }, … }`
- `app_particles_cefr` — current level filter (default: "A1")

### New JS files
- `js/particles.js` — module renderer, reference lookup, lesson integration
- `js/particles-data.js` — `window.PARTICLES_DATA` — bundled particles + exercises

---

## Constraints

- **Offline-first** — all content bundled; particles-data.js added to SW precache
- **No new dependencies** — reuse existing exercise renderers and grammar lesson renderer
- **Existing users** — no disruption (new module, no migration needed)
- **Exercise feedback** — the 1-sentence "why" explanation is unique to particles. Needs a new small feedback element in the exercise card renderer (or a simple append to existing result feedback area)

---

## Proposed Build Plan

| Phase | Scope | Est. Sessions |
|---|---|---|
| 1 | Data architecture — `particles.json`, `exercises-particles.json`, `particle-lessons.json` schemas; `particles-data.js` bundle | 1–2 |
| 2 | Module home — new module card, home screen layout (Core / Advanced sections + "Alle Partikeln" fixed button), CEFR filter | 1 |
| 3 | Exercise engine — `fill_blank_particle` renderer, particle feedback card, no-auto-advance on correct, level filter wiring | 1 |
| 4 | Grammar lessons — lesson renderer (reuse from Verbs), soft gate prompt, quiz engine wiring | 1 |
| 5 | Per-particle reference screen — `particle-reference` screen, sort/search, reference card layout (eben/halt each get own card with cross-reference) | 1 |
| 6 | Content — write all 35 particle entries + ~525 exercises (15 per particle, single-answer guaranteed) + 8 lesson texts | 3–4 |
| 7 | QA + deploy | 1 |

**Total estimate: 9–11 sessions**

**Content volume:** 35 particles × 15 exercises = 525 exercises. This is the largest single-module exercise set in the app (current largest: Verbs at 2,075 across multiple exercise types). Phase 6 will require careful per-exercise validation to ensure single-answer integrity.

---

## Decided

| # | Question | Decision |
|---|---|---|
| 1 | Exercise count | **15 per particle** (~525 total). Single-answer integrity is the top priority — any sentence where two particles could work must be rewritten. |
| 2 | "Alle Partikeln" placement | **Fixed button** at top of module home, above Core section. Always visible. |
| 3 | eben vs halt | **Two separate entries** with explicit cross-reference and contrast note in both cards. |
| 4 | Exercise feedback design | **Particle feedback card**: lime left border (`#8DC44A`), subtle green-tint background (`rgba(141,196,74,0.08)`), dark green text (`#2D4A1A`). First line: particle name + category label. Body: context-specific explanation. Shown after every answer (correct and incorrect). No auto-advance — user taps "Weiter" to continue. Tweak during Phase 3 once on device. |
| 5 | TTS pronunciation | **Skip.** Web Speech API reads particles in flat monotone — useless and potentially misleading since intonation carries particle meaning. Focus on written examples and contrast notes instead. |

---

*PRD signed off. Ready to build.*
