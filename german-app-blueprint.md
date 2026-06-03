# 🇩🇪 German Learning App — Project Blueprint

**Version:** 1.4  
**Date:** May 2026  
**Owner:** Personal use (Android, shareable via link)  
**Status:** ✅ Ready to Build — Cowork setup can begin

**Changelog:**
- v1.0 — Initial blueprint: platform, file structure, content database architecture, module scaffold
- v1.1 — Added Module 1 (Verbs) detailed behaviour spec
- v1.2 — Added verb grammar info layer (case requirements), cooldown system, category progress bars, verb detail view
- v1.3 — Resolved all open questions: app name, 4-exercise rule, alphabetical sort + search bar, Phase 2 scoped to all 100 root verbs, Claude Design directives added
- v1.4 — Added Content Factory system (Section 17): seed file workflow, batch generation prompt template, validation checklist, session patterns, updated folder structure

---

## Table of Contents

1. [What This Document Is](#1-what-this-document-is)
2. [What We Are Building](#2-what-we-are-building)
3. [Technical Approach & Platform Decision](#3-technical-approach--platform-decision)
4. [How Progress Is Saved](#4-how-progress-is-saved)
5. [File & Folder Structure](#5-file--folder-structure)
6. [Content Database Architecture](#6-content-database-architecture)
7. [Module Design & Scaling Strategy](#7-module-design--scaling-strategy)
8. [The Verb Database — Special Guidance](#8-the-verb-database--special-guidance)
9. [Exercise System Design](#9-exercise-system-design)
10. [Word List & Unlock System](#10-word-list--unlock-system)
11. [Module 1 — Verbs: Full Behaviour Specification](#11-module-1--verbs-full-behaviour-specification)
12. [Workflow: Claude.ai Design → Cowork → Final App](#12-workflow-claudeai-design--cowork--final-app)
13. [Sharing the App with Friends](#13-sharing-the-app-with-friends)
14. [Build Order — Recommended Phases](#14-build-order--recommended-phases)
15. [Naming Conventions & House Rules](#15-naming-conventions--house-rules)
16. [Resolved Decisions & Claude Design Directives](#16-resolved-decisions--claude-design-directives)
17. [Content Factory — Seed Files, Batch Generation & Validation](#17-content-factory--seed-files-batch-generation--validation)

---

## 1. What This Document Is

This file is the **single source of truth** for how this project is built, maintained, and extended. It lives in your Cowork project folder and should be attached to every new Cowork session so that Claude always has full context without you needing to re-explain the project from scratch.

**Every time we build something new**, this file should be updated to reflect what was done. Think of it as a living contract between you and Claude.

---

## 2. What We Are Building

A **personal German language learning app** called **Mein Deutsch** that:

- Runs as a **Progressive Web App (PWA)** — installable on Android home screen, no App Store needed
- Works fully **offline** after first load
- Saves all progress **locally on the device** (no server, no account, no cloud required)
- Can be **shared as a link** with a small group of friends who can also install it
- Is **modular by design** — new grammar topics can be added without touching existing content
- Is built and maintained entirely through **Claude.ai (Design interface)** and **Claude Cowork**, with zero manual coding required from the owner

### App Sections at a Glance

| Section | Description |
|---|---|
| Home Screen | Entry point; shows Word List and all Modules |
| Word List | All unlocked words; tap any word to practice it |
| Word Practice | Flash-card style; 1 word, 5–10 options, 1 correct |
| Modules | Topic-based learning units (Verbs, Nouns, Adjectives, etc.) |
| Module — Study View | Reference tables and word lists for that topic |
| Module — Exercises | Sentence completion, translation, matching exercises |
| Progress Indicators | Visual cues showing how far along each module is |

---

## 3. Technical Approach & Platform Decision

### Why a Progressive Web App (PWA)?

A PWA is a website that **behaves like an app**. It is the right choice here because:

- ✅ No App Store submission required
- ✅ Installable on Android home screen in seconds (Chrome → "Add to Home Screen")
- ✅ Works offline once installed
- ✅ Shareable as a simple URL
- ✅ Built with the same HTML/CSS/JavaScript that Claude already generates
- ✅ Progress saved with `localStorage` (built into every browser, never expires unless cleared)
- ✅ Friends can install the same link independently and have their own separate progress

### Technology Stack (Plain Language)

| Layer | Technology | Why |
|---|---|---|
| Interface | HTML + CSS + JavaScript | Claude generates this natively; no framework needed |
| Styling | CSS with variables | Easy to theme consistently across screens |
| Data (content) | JSON files | Human-readable, easy to edit, modular |
| Progress saving | `localStorage` | Built into Android Chrome; survives app restarts |
| App install capability | PWA manifest + Service Worker | Makes it installable on home screen |

### What You Do NOT Need

- No coding environment or terminal
- No Node.js, no npm, no build tools
- No hosting account (we use a free static host — see Section 13)
- No App Store account

---

## 4. How Progress Is Saved

This was broken in previous versions. Here is how we fix it permanently.

### The Problem Before
Previous versions likely used React Artifacts inside Claude.ai chat. Those reset every session because they have no persistent storage outside of Claude's artifact storage system, which is tied to a conversation.

### The Solution: `localStorage`
When the app is hosted as a standalone PWA, it uses the phone's own `localStorage` — a small built-in database in the browser that **never resets** unless the user manually clears their browser data.

### What Gets Saved

```
PROGRESS SAVED IN LOCALSTORAGE:
─────────────────────────────────────────────────
Key                         | What it stores
─────────────────────────────────────────────────
app_unlocked_words          | Array of all unlocked word IDs
app_module_progress         | Object: module ID → % complete
app_exercise_history        | Object: word/exercise ID → correct/incorrect count
app_last_session            | Timestamp of last use
app_word_practice_scores    | Per-word score for Word List practice
─────────────────────────────────────────────────
```

### Friend Separation
Each friend installs the app and uses it from their own phone. Their `localStorage` is their own — they never see your progress and you never see theirs. Each person's progress is fully independent.

---

## 5. File & Folder Structure

This is the folder layout inside your Cowork project. Every file has one clear job.

```
/german-app/
│
├── index.html                  ← The app shell (home screen, navigation)
├── manifest.json               ← PWA config (app name, icon, install behavior)
├── service-worker.js           ← Makes the app work offline
│
├── /css/
│   └── styles.css              ← All visual styling in one place
│
├── /js/
│   ├── app.js                  ← Core logic: navigation, screen transitions
│   ├── progress.js             ← All localStorage read/write operations
│   ├── exercises.js            ← Exercise generation and scoring logic
│   └── wordlist.js             ← Word list display and practice logic
│
├── /data/                      ← THE CONTENT DATABASE (see Section 6)
│   ├── modules.json            ← Module registry (all modules listed here)
│   ├── verbs.json              ← All verb data
│   ├── nouns.json              ← All noun data (future)
│   ├── adjectives.json         ← All adjective data (future)
│   ├── adverbs.json            ← All adverb data (future)
│   ├── prepositions.json       ← All preposition data (future)
│   └── exercises/
│       ├── exercises-verbs.json
│       ├── exercises-nouns.json        (future)
│       └── exercises-adjectives.json   (future)
│
├── /screens/
│   ├── home.html               ← Home screen fragment
│   ├── wordlist.html           ← Word list screen fragment
│   ├── module-verbs.html       ← Verbs module screen
│   └── module-nouns.html       ← Nouns module screen (future)
│
├── /icons/
│   ├── icon-192.png            ← App icon (small)
│   └── icon-512.png            ← App icon (large)
│
└── /_factory/                  ← CONTENT FACTORY (never served to app, Cowork use only)
    ├── README.md               ← How to use the factory (copy of Section 17)
    ├── batch-prompt.md         ← The reusable batch generation prompt template
    ├── validate-prompt.md      ← The reusable validation prompt template
    └── /seeds/
        ├── verbs-level1.json   ← 25 verbs, A1 — queue for batch generation
        ├── verbs-level2.json   ← 25 verbs, A2
        ├── verbs-level3.json   ← 25 verbs, B1
        └── verbs-level4.json   ← 25 verbs, B2
```

### Key Rule: One JSON File Per Grammar Category

Each `.json` file in `/data/` is **independent**. If we need to fix a verb, we only open `verbs.json`. If we add 20 new nouns, we only touch `nouns.json`. This keeps every editing session small and focused.

---

## 6. Content Database Architecture

### The Core Principle: Roots + Rules, Not Every Permutation

The biggest mistake in previous attempts was trying to store every conjugation of every verb as separate entries. This creates thousands of records that are nearly impossible to maintain.

**The correct approach:** Store the **root** with its properties, and let the app **generate** conjugations on the fly using rules.

---

### 6.1 — Verb Entry Structure (`verbs.json`)

```json
{
  "id": "verb_gehen",
  "root": "gehen",
  "english": "to go",
  "type": "strong",
  "frequency_rank": 12,
  "module": "verbs",
  "unlock_level": 1,
  "conjugation": {
    "present": {
      "ich": "gehe",
      "du": "gehst",
      "er_sie_es": "geht",
      "wir": "gehen",
      "ihr": "geht",
      "sie_Sie": "gehen"
    },
    "past_participle": "gegangen",
    "auxiliary": "sein"
  },
  "prefix_variants": [
    {
      "id": "verb_ausgehen",
      "prefix": "aus",
      "word": "ausgehen",
      "english": "to go out",
      "separable": true,
      "notes": "Prefix separates in main clause: Ich gehe aus."
    },
    {
      "id": "verb_eingehen",
      "prefix": "ein",
      "word": "eingehen",
      "english": "to enter / to shrink",
      "separable": true,
      "notes": "Context-dependent meaning"
    }
  ],
  "example_sentences": [
    {
      "de": "Ich gehe heute in die Stadt.",
      "en": "I am going to the city today.",
      "exercise_type": ["fill_blank", "translate"]
    }
  ],
  "tags": ["movement", "daily_life", "b1"]
}
```

**Why this structure works:**
- The root verb is the parent. All variants live inside it.
- Adding a new prefix variant = adding one small object inside `prefix_variants`
- If you need to fix the conjugation of *gehen*, you change it in one place and all exercises using it update automatically
- `frequency_rank` lets us sort by importance (most common verbs first)

---

### 6.2 — Noun Entry Structure (`nouns.json`)

```json
{
  "id": "noun_haus",
  "word": "Haus",
  "article": "das",
  "english": "house",
  "plural": "Häuser",
  "plural_article": "die",
  "genitive": "des Hauses",
  "frequency_rank": 45,
  "module": "nouns",
  "unlock_level": 1,
  "example_sentences": [
    {
      "de": "Das Haus ist groß.",
      "en": "The house is big.",
      "exercise_type": ["fill_blank", "article_choice"]
    }
  ],
  "tags": ["home", "buildings", "a1"]
}
```

---

### 6.3 — Adjective Entry Structure (`adjectives.json`)

```json
{
  "id": "adj_gross",
  "root": "groß",
  "english": "big / tall",
  "comparative": "größer",
  "superlative": "größten",
  "frequency_rank": 8,
  "declension_type": "regular",
  "example_sentences": [
    {
      "de": "Das ist ein großes Haus.",
      "en": "That is a big house.",
      "exercise_type": ["fill_blank", "declension_choice"]
    }
  ],
  "tags": ["size", "description", "a1"]
}
```

---

### 6.4 — Exercise Entry Structure (`exercises/exercises-verbs.json`)

Exercises are stored **separately** from content. This means we can add 20 new exercises for *gehen* without touching `verbs.json`.

```json
{
  "exercise_id": "ex_gehen_001",
  "word_id": "verb_gehen",
  "type": "fill_blank",
  "difficulty": 1,
  "question": {
    "de": "Ich _____ heute in die Stadt.",
    "en": "I _____ to the city today.",
    "show_english": true
  },
  "correct_answer": "gehe",
  "wrong_answers": ["gehst", "geht", "gehen", "ging"],
  "explanation_en": "'gehe' is the first person singular (ich) present tense of gehen. The verb goes to second position in the sentence.",
  "tags": ["present_tense", "ich_form"]
}
```

```json
{
  "exercise_id": "ex_gehen_002",
  "word_id": "verb_gehen",
  "type": "translate_word",
  "difficulty": 1,
  "question": {
    "de": "gehen",
    "prompt_en": "What does this verb mean?"
  },
  "correct_answer": "to go",
  "wrong_answers": ["to come", "to run", "to walk", "to drive"],
  "explanation_en": "'gehen' means 'to go' in German. It is one of the most common movement verbs."
}
```

---

## 7. Module Design & Scaling Strategy

### Module Template

Every module follows the **exact same structure**. This means building Module 2 (Nouns) will be much faster than Module 1, because the scaffold already exists.

```
MODULE STRUCTURE:
─────────────────────────────────────────────
1. Module Home        → Title, description, progress bar
2. Study View         → Reference tables and word lists  
3. Exercise View      → Practice exercises with scoring
4. Results Screen     → Session summary, words unlocked
─────────────────────────────────────────────
```

### Module Registry

All modules are listed in a central `modules.json` so the home screen always knows what exists:

```json
[
  {
    "id": "module_verbs",
    "title_de": "Verben",
    "title_en": "Verbs",
    "icon": "🔤",
    "data_file": "verbs.json",
    "exercises_file": "exercises-verbs.json",
    "unlock_order": 1,
    "status": "active"
  },
  {
    "id": "module_nouns",
    "title_de": "Nomen",
    "title_en": "Nouns",
    "icon": "📦",
    "data_file": "nouns.json",
    "exercises_file": "exercises-nouns.json",
    "unlock_order": 2,
    "status": "coming_soon"
  }
]
```

Adding a new module = adding one entry here and creating the corresponding JSON files. Nothing else in the app needs to change.

---

## 8. The Verb Database — Special Guidance

### The 100 Most Important Root Verbs

We start with the **100 most frequent root verbs in German**, selected by frequency in written and spoken German (targeting B2 level coverage). These will be divided into unlock levels:

| Level | Verbs | Description |
|---|---|---|
| 1 (A1) | 1–25 | Core daily verbs: sein, haben, gehen, kommen, machen, sagen... |
| 2 (A2) | 26–50 | Expanded basics: arbeiten, lernen, spielen, kaufen... |
| 3 (B1) | 51–75 | Intermediate: erklären, verstehen, entscheiden, beginnen... |
| 4 (B2) | 76–100 | Upper intermediate: vorschlagen, behaupten, erkennen... |

### Prefix Variant Strategy

Rather than adding ALL possible prefix variants at once, we follow this rule:

**Only include a prefix variant if it creates a meaningfully different word that a learner needs to know.**

For example, *gehen* has many prefix variants but we prioritize:
- ausgehen (to go out) ✅ — very common
- eingehen (to enter/shrink) ✅ — useful  
- losgehen (to set off) ✅ — common
- untergehen (to sink/set) ✅ — useful
- durchgehen (to go through) ✅ — common
- abgehen (to depart) — lower priority, add later

This keeps the initial database focused. We can always add more variants in later sessions.

### Separable vs. Inseparable Prefixes

This is one of the most important grammar concepts for German learners. The database tracks this with the `separable: true/false` flag on every prefix variant. The exercise system will use this flag to generate exercises that test whether the user knows when to separate the prefix.

---

## 9. Exercise System Design

### Exercise Types

| Type | ID | Description | Example |
|---|---|---|---|
| Fill in the blank | `fill_blank` | Sentence with one word missing | "Ich _____ heute." |
| Translate the word | `translate_word` | See German, pick English meaning | "gehen" → "to go" |
| Translate the sentence | `translate_sentence` | See German sentence, pick correct English | — |
| Article choice | `article_choice` | Pick der/die/das for a noun | "_____ Haus" |
| Conjugation choice | `conjugation` | Pick correct verb form for pronoun | "Er _____ (gehen)" |
| Prefix match | `prefix_match` | Match prefix variant to its meaning | "ausgehen" → "to go out" |

### Difficulty Progression

Each exercise has a `difficulty` of 1, 2, or 3:
- **1 — Recognition:** You see the German, pick the English. Easy.
- **2 — Production:** You see a sentence, pick the correct German word.
- **3 — Application:** You see a longer sentence or context, and must apply a grammar rule.

The app always starts with difficulty 1 for a new word, and only offers difficulty 2 and 3 after the word has been answered correctly at least 3 times.

### Wrong Answer Quality

Wrong answers must be **plausible, not random**. Rules for generating wrong answers:
- For verbs: use other conjugation forms of the same verb, or similar verbs
- For nouns: use wrong articles or similar-sounding words
- For adjectives: use comparative/superlative forms or similar adjectives
- Never use completely unrelated words as wrong answers

---

## 10. Word List & Unlock System

### How Words Get Unlocked

A word is added to the Word List when the user **completes a module exercise session** that includes that word. Specifically:
- The user must answer the word's exercise correctly at least once
- Then the word appears in the Word List permanently

This creates a sense of progression and ownership over the vocabulary.

### Word List Practice Mode

When the user taps **Practice** on any word in the Word List:
1. The German word appears prominently on screen
2. 5–8 answer options appear (only one correct)
3. Correct = green flash + point added to word's score
4. Incorrect = red flash + correct answer revealed + brief explanation in English

The Word List practice is **never-ending** — it loops through all unlocked words randomly, weighted toward words with lower scores (spaced repetition lite).

### Word Entry in the Word List

Each word shown in the Word List displays:
- The German word
- The article (if noun) or infinitive marker *to* (if verb)
- English translation
- A small score bar (how well you know it)
- A "Practice" button

---

## 11. Module 1 — Verbs: Full Behaviour Specification

This section is the definitive reference for how the Verbs module looks and behaves. Every screen, interaction, and data decision is documented here. Future module specs (Nouns, Adjectives, etc.) will follow the same format.

---

### 11.1 — Module Home Screen

When the user taps the **Verbs** module card on the Home Screen, they land on the Module Home. This screen has:

**Header area:**
- Module title: "Verben" (German)
- A short description in English: what this module covers

**Two category cards** — each card shows:
- Category name
- Number of words unlocked out of total (e.g., "12 / 25 unlocked")
- A progress bar showing the percentage unlocked
- A button to start exercises

| Card | Contents | Total Count |
|---|---|---|
| **Stammverben** (Root Verbs) | The 100 root verbs, divided across 4 unlock levels | ~100 words |
| **Variationen** (Variation Verbs) | Prefix/suffix variants of unlocked root verbs | ~300–500 words (grows as root verbs unlock) |

**Important:** The Variationen card only shows variants for root verbs the user has already unlocked. If the user has unlocked 10 root verbs, only the variants of those 10 verbs appear in the Variationen exercises. This keeps the workload proportional to progress.

**Third section — Verb List:**
- A button labelled "Verbliste" (Verb List)
- This takes the user to the Unlocked Verb Reference (see 11.4)

---

### 11.2 — Root Verb Exercise Flow

When the user taps **Stammverben** exercises:

**1. Exercise presentation**
- One exercise appears at a time, full screen
- Exercise types rotate (fill_blank, translate_word, conjugation_choice) — see Section 9
- The sentence or prompt is shown in German
- An English translation of the sentence is shown below in smaller text (always visible — this helps the learner understand context)
- 5 answer options are shown as tappable buttons

**2. Correct answer**
- Screen flashes green
- A brief success message appears in German (e.g., "Richtig! ✓")
- The word is marked as **unlocked** and added to the Word List
- After 1.5 seconds, the next exercise loads automatically

**3. Wrong answer**
- Screen flashes red
- The correct answer is highlighted
- A short explanation appears in **English** explaining the grammar rule that was broken
  - Example: "The verb 'gehen' needs the auxiliary verb 'sein' in the perfect tense, not 'haben'. Movement verbs in German almost always use 'sein'."
- The word goes on **cooldown** (see 11.3)
- After the user taps "Weiter" (Continue), the next exercise loads

**4. Session end**
- After completing a set of exercises (suggested: 10 per session), a results screen appears
- It shows: correct answers, wrong answers, words newly unlocked this session
- A button returns the user to the Module Home

---

### 11.3 — Cooldown System

The cooldown system prevents a wrong answer from simply being skipped and forgotten.

**Rules:**
- A word on cooldown does NOT disappear from the exercise queue
- It is pushed to the **end** of the current session's queue and reappears after at least 3 other exercises
- If the user answers it correctly on the retry, it is unlocked normally
- If the user gets it wrong a second time in the same session, it is pushed to the back again (maximum 2 retries per session)
- If still not answered correctly after 2 retries, the word is marked as `needs_review` in localStorage — it will be prioritised in the next session

**What is saved in localStorage for cooldown tracking:**

```
app_cooldown_words     | Array of word IDs currently on cooldown
app_needs_review       | Array of word IDs that failed 2+ times, prioritised next session
```

---

### 11.4 — Variation Verb Exercise Flow

When the user taps **Variationen** exercises:

- Behaves identically to Root Verb exercises (same flow, same feedback, same cooldown rules)
- Only shows exercises for variants of **already-unlocked root verbs**
- Exercise types include an additional type: `separable_prefix` — the user must correctly position the prefix in a sentence
  - Example: "Ich _____ heute _____." (ausgehen) → correct: "Ich gehe heute aus."
  - Explanation shown if wrong: "This is a separable verb. The prefix 'aus' moves to the end of the clause in a main sentence."

**Unlocking variants:**
- Completing a variation exercise correctly unlocks that variant in the Word List
- The variant appears nested under its root verb in the Verb List (see 11.5), not as a standalone entry

---

### 11.5 — Unlocked Verb Reference (Verbliste)

This is the **study reference area** — not an exercise, but a structured list the user can browse to review what they have learned.

**Top level: Root Verbs only**
- The list shows only unlocked root verbs, alphabetically or by frequency rank (user can toggle)
- Each root verb shows: infinitive, English meaning, verb type (strong/weak/mixed)

**Tapping a root verb expands it to show:**

```
─────────────────────────────────────────────────────────────
GEHEN — to go  [strong verb]

  Conjugation (Present):
  ich gehe · du gehst · er/sie/es geht
  wir gehen · ihr geht · sie/Sie gehen

  Perfect tense: ist gegangen  (auxiliary: SEIN)

  Case requirements:
  ┌──────────────────────────────────────────────────────┐
  │ gehen requires no object — it is intransitive.       │
  │ When used with a destination, use ACCUSATIVE with    │
  │ 'in/auf/an' → Ich gehe in die Stadt. (Akk.)         │
  └──────────────────────────────────────────────────────┘

  Unlocked Variations:
  • ausgehen   — to go out        [separable]
  • eingehen   — to enter/shrink  [separable]
  • losgehen   — to set off       [separable]
  • vergehen   — to pass (time)   [inseparable]
─────────────────────────────────────────────────────────────
```

**Grammar info layer — Case Requirements:**

This is a key feature. For every verb, the database stores which grammatical case(s) it governs. This is displayed clearly in the expanded view. The four cases covered:

| Case | German | When shown |
|---|---|---|
| Nominative | Nominativ | Subject of the verb (most verbs) |
| Accusative | Akkusativ | Direct object — verb takes an accusative complement |
| Dative | Dativ | Indirect object — verb governs dative |
| Genitive | Genitiv | Rare; shown when verb requires genitive complement |

Some verbs govern two cases simultaneously (e.g., *geben* — "er gibt **mir** [Dativ] **das Buch** [Akkusativ]"). These are flagged as `dual_case` in the database.

**How this is stored in `verbs.json`:**

```json
"grammar": {
  "transitivity": "intransitive",
  "case_requirements": ["none"],
  "notes_en": "gehen takes no direct object. With destinations, use accusative prepositions (in die Stadt, auf den Berg).",
  "dual_case": false
}
```

For a verb like *helfen* (to help, governs dative):
```json
"grammar": {
  "transitivity": "transitive",
  "case_requirements": ["dative"],
  "notes_en": "helfen always governs the dative case. 'Ich helfe dir' (not 'dich').",
  "dual_case": false
}
```

For a verb like *geben* (to give, governs accusative + dative):
```json
"grammar": {
  "transitivity": "transitive",
  "case_requirements": ["accusative", "dative"],
  "notes_en": "geben takes two objects: dative (receiver) + accusative (thing given). 'Ich gebe dir das Buch.'",
  "dual_case": true
}
```

---

### 11.6 — Module 1 localStorage Keys (additions to Section 4)

```
app_verbs_root_unlocked       | Array of unlocked root verb IDs
app_verbs_variant_unlocked    | Array of unlocked variant verb IDs
app_verbs_root_progress       | Number: exercises completed for root verbs
app_verbs_variant_progress    | Number: exercises completed for variant verbs
app_cooldown_words            | Array of word IDs currently in cooldown
app_needs_review              | Array of word IDs that need priority next session
```

---

### 11.7 — Screen Navigation Map for Module 1

```
HOME SCREEN
    │
    └──▶ MODULE HOME (Verben)
              │
              ├──▶ STAMMVERBEN EXERCISES
              │         │
              │         ├── Exercise screen (one at a time)
              │         ├── Correct → success flash → next exercise
              │         ├── Wrong → red flash + explanation → cooldown → continue
              │         └── Session end → Results screen → back to Module Home
              │
              ├──▶ VARIATIONEN EXERCISES
              │         └── (same flow as above)
              │
              └──▶ VERBLISTE (Verb Reference)
                        │
                        └── Root verb list → tap verb → expanded detail view
                                    (conjugation + case requirements + variants)
```

---

## 12. Workflow: Claude.ai Design → Cowork → Final App

This section explains how to work efficiently across the two Claude tools.

### Understanding the Two Tools

| Tool | URL / Access | Best For |
|---|---|---|
| **Claude.ai Design** | claude.ai/design | Visual design, UI polish, creating beautiful screen mockups as React/HTML artifacts |
| **Claude Cowork** | Desktop app | Project management, file assembly, working with your local folder, building the actual app files |

### The Golden Rule
> **Design in Claude.ai Design. Assemble and save in Cowork.**

Claude.ai Design produces beautiful visual output but it is **ephemeral** — the artifact lives only in that conversation. Cowork works with your **actual files** on disk, which persist forever.

### The Recommended Workflow for Each New Screen

```
STEP 1 — DESIGN (claude.ai/design)
   Open a new conversation in Claude.ai Design
   Attach this blueprint file (german-app-blueprint.md)
   Say: "Design the [screen name] screen for my German app. 
         Follow the conventions in the attached blueprint."
   Claude produces a beautiful HTML/React artifact
   Copy the code from the artifact (click the copy button)

STEP 2 — SAVE (Cowork)
   Open your Cowork project session
   Paste the copied code into the appropriate file
   Ask Claude to integrate it with the existing app logic
   Test on your phone

STEP 3 — UPDATE THIS FILE
   Note what was built, what file was changed, and any decisions made
   This keeps the blueprint current
```

### What to Always Attach to Claude.ai Design Sessions

When starting a Design session for a new screen, always include:
1. This blueprint file (`german-app-blueprint.md`)
2. The current `styles.css` (so the design matches existing screens)
3. A screenshot of an existing screen (so the style stays consistent)

### What to Always Include in Cowork Sessions

When starting a Cowork session, always include:
1. This blueprint file
2. The specific file you want to work on (e.g., `verbs.json` or `exercises.js`)
3. A clear, single task description

**Never ask Cowork to "build the whole app" in one session.** Always work on one file or one feature at a time.

---

## 13. Sharing the App with Friends

### Recommendation: GitHub Pages (Free, Permanent Link)

The simplest way to share the app is to host the files on **GitHub Pages** — a free service that turns a folder of files into a website with a permanent URL.

**How it works:**
1. You upload your app folder to a free GitHub account
2. GitHub gives you a URL like: `https://yourname.github.io/german-app/`
3. You share that URL with friends via WhatsApp or any message
4. Friends open the link in Chrome on Android
5. Chrome prompts them to "Add to Home Screen" — they tap it and the app installs
6. Each friend has their own independent progress saved on their own phone

**What friends need:**
- An Android phone with Chrome (or any modern browser)
- Nothing else — no account, no install from a store

**Privacy note:** The app files (including all content) are publicly visible at the URL, but no user data is ever stored online. All progress stays on each person's individual device.

### Alternative (More Private): Local File Sharing

If you prefer not to use GitHub, the app can also be shared as a ZIP file. Friends unzip it and open `index.html` in Chrome. This is slightly more technical for them but requires no online hosting. Not recommended as the primary method.

---

## 14. Build Order — Recommended Phases

### Phase 1 — Foundation (First Build Sessions)
- [ ] App shell (`index.html`, `manifest.json`, `service-worker.js`)
- [ ] Basic CSS design system (colors, fonts, spacing)
- [ ] Navigation between screens
- [ ] Progress save/load system (`progress.js`)
- [ ] Home screen with placeholder modules

### Phase 2 — Verb Module Content (v1 Target)
- [ ] All 100 root verbs in `verbs.json` across 4 unlock levels, each with grammar/case data
- [ ] 4 exercises per root verb in `exercises-verbs.json` (400 exercises total)
- [ ] 4 exercises per variation verb added at the same time as the verb entry
- [ ] Verb Module Home screen (with category cards + progress bars)
- [ ] Exercise screen (fill_blank + translate_word types only to start)
- [ ] Cooldown system logic

### Phase 3 — Word List & Verb Reference
- [ ] Word List screen
- [ ] Unlock logic (word appears after completing exercise correctly)
- [ ] Word List Practice mode
- [ ] Verbliste screen (root verb list + expandable detail view with case info)

### Phase 4 — Polish & PWA
- [ ] App icons
- [ ] Offline support (service worker caching)
- [ ] Home screen install prompt
- [ ] Results / progress screens

### Phase 5 — Expand Verb Content
- [ ] Prefix variants for all 100 root verbs (Variationen), 4 exercises each
- [ ] Separable prefix exercise type (`separable_prefix`)
- [ ] Additional exercise types (conjugation_choice, prefix_match)

### Phase 6 — New Modules
- [ ] Noun module (same structure as Verb module)
- [ ] Adjective module
- [ ] Pronoun tables
- [ ] Prepositions

---

## 15. Naming Conventions & House Rules

These rules make sessions with Claude more predictable and less error-prone.

### IDs
- Verbs: `verb_[infinitive]` → `verb_gehen`, `verb_sein`
- Nouns: `noun_[lowercase]` → `noun_haus`, `noun_auto`
- Adjectives: `adj_[root]` → `adj_gross`, `adj_klein`
- Exercises: `ex_[word_id]_[number]` → `ex_verb_gehen_001`
- Modules: `module_[name]` → `module_verbs`, `module_nouns`

### Files
- All lowercase, hyphen-separated: `exercises-verbs.json`
- Never spaces in filenames
- Content files always end in `.json`

### Language in the App
- All UI navigation labels: German
- Exercise questions: German
- Correct/wrong answer feedback: German (brief) + English explanation
- Error explanations: Always English
- Grammar rule notes: English

### When Adding New Content
- Always add new words to the appropriate category JSON file — never inline in HTML or JS files
- Always add new exercises to the appropriate `exercises-[category].json`
- **Every new word entry must have exactly 4 exercises created at the same time.** A word without 4 exercises is considered incomplete and must not be committed to the project.
- Never delete an entry — instead add `"status": "disabled"` to hide it temporarily
- Always include `frequency_rank` and at least one `example_sentence` for every new entry
- Always include a `grammar` block with `case_requirements` for every verb entry

### List Screen Standards (applies to every module)
- All word lists sort **alphabetically by default**, showing root words only
- Tapping a root word expands it to show all its variations
- Every list screen must include a **search bar at the top** that searches across both root words and variation words simultaneously
- Search is case-insensitive and matches partial strings (typing "geh" finds "gehen", "ausgehen", "eingehen", etc.)

---

## 16. Resolved Decisions & Claude Design Directives

This section documents all finalised decisions and contains the standing directives for Claude.ai Design sessions.

---

### 16.1 — Resolved Decisions

| Decision | Answer |
|---|---|
| App name | **Mein Deutsch** |
| Exercises per word | **4 exercises per word**, created at the same time as the word entry — no exceptions |
| Default list sort | **Alphabetical**, root words only at top level; tap to expand variations |
| Search bar | **Required on every list screen**; searches both root and variation words |
| v1 verb scope | **All 100 most common root verbs** included in the first version |
| Session length | **4 exercises × number of words in current batch** (natural batching; no artificial cutoff) |
| App language | German UI labels; English for explanations, error feedback, grammar notes |
| Platform | Android PWA, installable via Chrome "Add to Home Screen" |
| Progress saving | `localStorage` — persists across sessions unless user clears browser data |
| Hosting | GitHub Pages (free, permanent URL, shareable via link) |

---

### 16.2 — Claude Design Session Directives

When opening a session in **claude.ai/design**, always attach this blueprint file and use the following standing instructions. Copy and paste this block at the start of every Design session:

---

```
STANDING DIRECTIVES FOR MEIN DEUTSCH — CLAUDE DESIGN SESSIONS

App name: Mein Deutsch
Platform: Android PWA (Progressive Web App), phone screen only (~390px wide)
Design system: [attach your design system file here]

STRUCTURE RULES — the output must be compatible with this data architecture:
- All word data lives in /data/[category].json (verbs.json, nouns.json, etc.)
- All exercise data lives in /data/exercises/exercises-[category].json
- Progress is stored in localStorage — no backend, no user accounts
- Every word has exactly 4 associated exercises
- Lists always show root words only; variations appear on tap/expand
- Every list screen has a search bar at the top (searches root + variation words)
- Default sort is alphabetical

SCREEN OUTPUT RULES:
- Output must be a single self-contained HTML file with CSS and JS included
- Use CSS custom properties (variables) for all colours and fonts — never hardcode values
- All interactive states (tap, correct, wrong, expanded, loading) must be designed
- Every screen must have a clearly marked back/navigation element
- Do not use any external libraries or CDN links — the app must work offline
- Font sizes must be minimum 16px for body text (phone readability)
- Touch targets must be minimum 44px tall (phone usability)

LANGUAGE RULES:
- UI labels and navigation: German
- Exercise prompts and sentences: German
- English translation shown below German sentences in smaller text (always visible)
- Feedback on correct answer: German (e.g. "Richtig! ✓")
- Feedback on wrong answer: English grammar explanation
- Grammar notes in reference screens: English

EXERCISE SCREEN RULES:
- One exercise per screen, full height
- Show German prompt, English translation below in smaller text
- 5 answer options as tappable buttons
- Correct: green flash → "Richtig! ✓" → auto-advance after 1.5 seconds
- Wrong: red flash → correct answer highlighted → English explanation shown → "Weiter" button to continue
- Progress indicator at top (e.g. "3 / 10")

WHAT TO DELIVER:
When asked to design a screen, deliver:
1. The full HTML file for that screen
2. A list of any CSS variable names you introduced (so styles.css can be updated)
3. A note on any localStorage keys the screen reads or writes
```

---

### 16.3 — Icon & Visual Identity

- Icon design: **to be created in Claude.ai Design** once the design system is uploaded
- The icon should work at 192×192px and 512×512px (both required for PWA)
- Format: PNG with transparent background
- Save final icons to `/icons/icon-192.png` and `/icons/icon-512.png`

---

### 16.4 — Planned Module Specs (Future Sessions)

Each module below will get its own detailed behaviour section (like Section 11) once described in a planning conversation:

- [ ] Module 2 — Nouns (Nomen)
- [ ] Module 3 — Adjectives (Adjektive)
- [ ] Module 4 — Adverbs (Adverbien)
- [ ] Module 5 — Prepositions (Präpositionen)
- [ ] Module 6 — Articles (Artikel) — der/die/das rules
- [ ] Module 7 — Pronouns (Pronomen)

---

### 16.5 — Future Module Ideas (Not Yet Planned)

- Sentence structure and word order (Satzstellung)
- Modal verbs deep-dive (können, müssen, dürfen, sollen, wollen, mögen)
- Cases deep-dive (Nominativ, Akkusativ, Dativ, Genitiv)
- Numbers, dates, time
- Conversational phrases

---

### 16.6 — Known Challenges (To Address in Later Phases)

- **Separable verb exercises** — `separable_prefix` exercise type is defined in Section 11.4 but deferred to Phase 5. The database already supports it; only the exercise UI needs building.
- **Adjective declension** — many case/gender combinations; needs careful exercise design before the Adjectives module is specified.
- **Umlaut input on phone keyboard** — exercise screens where the user types (future feature) will need tap-to-insert buttons for ä, ö, ü, ß.
- **Content volume** — 100 root verbs × 4 exercises = 400 exercise entries minimum before v1 launches. This is the single largest content task in Phase 2 and should be broken into batches of 25 verbs per Cowork session.

---

## 17. Content Factory — Seed Files, Batch Generation & Validation

This section documents the complete system for generating content at scale. The problem it solves: at full scope, this project requires approximately 4,800 word entries and exercise records. Writing these one by one is unsustainable. The Content Factory turns that into a repeatable, low-effort workflow.

**The three components:**
1. **Seed files** — the queue of words waiting to be processed
2. **Batch generation** — a reusable prompt that produces complete, paste-ready JSON for any batch
3. **Validation** — a checklist prompt that catches errors before they compound

All factory files live in `/_factory/` and are never loaded by the app itself.

---

### 17.1 — Content Scale Reference

Use this table to plan sessions and track overall progress.

| Category | Root Words | Variations | Exercises (4×) | Total Records |
|---|---|---|---|---|
| Verbs | 100 | ~300 | 1,600 | ~1,700 |
| Nouns | 200 | — | 800 | ~1,000 |
| Adjectives | 150 | ~150 | 1,200 | ~1,350 |
| Adverbs | 100 | — | 400 | ~500 |
| Prepositions | 50 | — | 200 | ~250 |
| **Total** | **600** | **~450** | **~4,200** | **~4,800** |

One Cowork batch session = 25 words + their 4 exercises each = ~100 exercise records generated.

---

### 17.2 — Seed File Structure

A seed file is a small JSON file that acts as the work queue for one batch. It tells Claude exactly which words to process and tracks whether each has been done.

**Location:** `/_factory/seeds/[category]-level[N].json`

**Example — `verbs-level1.json`:**

```json
{
  "batch_id": "verbs_level1",
  "category": "verbs",
  "unlock_level": 1,
  "target_level": "A1",
  "status": "pending",
  "generated_date": null,
  "validated_date": null,
  "words": [
    { "word": "sein",    "english": "to be",      "type": "irregular", "priority": 1, "status": "pending" },
    { "word": "haben",   "english": "to have",     "type": "irregular", "priority": 2, "status": "pending" },
    { "word": "werden",  "english": "to become",   "type": "irregular", "priority": 3, "status": "pending" },
    { "word": "können",  "english": "to be able",  "type": "modal",     "priority": 4, "status": "pending" },
    { "word": "müssen",  "english": "to must",     "type": "modal",     "priority": 5, "status": "pending" },
    { "word": "sagen",   "english": "to say",      "type": "weak",      "priority": 6, "status": "pending" },
    { "word": "machen",  "english": "to make/do",  "type": "weak",      "priority": 7, "status": "pending" },
    { "word": "gehen",   "english": "to go",       "type": "strong",    "priority": 8, "status": "pending" },
    { "word": "kommen",  "english": "to come",     "type": "strong",    "priority": 9, "status": "pending" },
    { "word": "wollen",  "english": "to want",     "type": "modal",     "priority": 10, "status": "pending" }
  ]
}
```

**Status values:**
- `pending` — not yet processed
- `done` — generated and validated, merged into main data files
- `needs_review` — generated but validation found errors

**After each batch session, update:**
- Each processed word's `"status"` to `"done"`
- The top-level `"generated_date"` to today's date
- The top-level `"status"` to `"done"` once all words in the batch are complete

---

### 17.3 — Batch Generation Prompt Template

This prompt lives at `/_factory/batch-prompt.md`. Copy it at the start of any Cowork content session, fill in the bracketed fields, and send it. Claude will return complete JSON ready to paste into your data files.

---

```
BATCH GENERATION REQUEST — MEIN DEUTSCH CONTENT FACTORY

I am building a German learning app called Mein Deutsch. 
Attached: german-app-blueprint.md (full project spec)
Attached: [seed file name, e.g. verbs-level1.json]

TASK:
Process all words in the attached seed file that have "status": "pending".
For each word, generate TWO outputs:

OUTPUT 1 — Word entry for /data/[category].json
Follow the exact JSON structure from Section 6 of the blueprint.
Every verb entry MUST include: id, root, english, type, frequency_rank, 
module, unlock_level, conjugation (present tense all 6 forms + past_participle 
+ auxiliary), prefix_variants (top 3–5 most common only), example_sentences 
(minimum 2), grammar block (transitivity, case_requirements, notes_en, dual_case), tags.

OUTPUT 2 — Exercise entries for /data/exercises/exercises-[category].json
Generate exactly 4 exercises per word, one of each type:
  Exercise 1: fill_blank (difficulty 1) — sentence with the word missing
  Exercise 2: translate_word (difficulty 1) — see German word, pick English meaning
  Exercise 3: conjugation_choice (difficulty 2) — pick correct conjugated form
  Exercise 4: fill_blank (difficulty 2) — harder sentence, different context

Rules for exercises:
- Wrong answers must be plausible (other conjugation forms, similar verbs — never random)
- Every exercise must include explanation_en (plain English grammar explanation)
- Every fill_blank must include both "de" and "en" fields in the question
- Exercise IDs follow pattern: ex_[word]_001, ex_[word]_002, etc.

FORMAT:
Return OUTPUT 1 and OUTPUT 2 as separate, clearly labelled JSON code blocks.
Do not return prose explanations — only the JSON blocks.
After the JSON, add a one-line summary: "Batch complete: X words processed, Y exercises generated."
```

---

### 17.4 — Validation Prompt Template

This prompt lives at `/_factory/validate-prompt.md`. Run it after every batch generation, before merging anything into the main data files. Paste the generated JSON alongside this prompt.

---

```
VALIDATION REQUEST — MEIN DEUTSCH CONTENT FACTORY

Attached: german-app-blueprint.md
Below: the JSON batch I just generated [paste batch here]

Check the batch against these rules and report any failures:

WORD ENTRY CHECKS:
[ ] Every entry has a unique id in correct format (verb_[word], noun_[word], etc.)
[ ] Every entry has frequency_rank (integer)
[ ] Every entry has at least 2 example_sentences
[ ] Every verb entry has a complete conjugation block (all 6 present tense forms)
[ ] Every verb entry has a grammar block with case_requirements and notes_en
[ ] No entry is missing the "module" or "unlock_level" fields
[ ] prefix_variants (verbs): each has id, prefix, word, english, separable flag

EXERCISE CHECKS:
[ ] Exactly 4 exercises exist per word (no more, no fewer)
[ ] Exercise IDs follow the pattern ex_[word]_001 through ex_[word]_004
[ ] word_id in each exercise matches an id in the word entry batch
[ ] Every exercise has correct_answer, wrong_answers (minimum 4), explanation_en
[ ] Wrong answers are plausible (flag any that seem random or unrelated)
[ ] Every fill_blank exercise has both "de" and "en" in the question block
[ ] No duplicate exercise_ids across the batch

REPORT FORMAT:
List each failure as: [FIELD] — [word id] — [what is wrong]
If no failures: return "Validation passed. Ready to merge."
Do not return the full JSON — only the validation report.
```

---

### 17.5 — The Standard Cowork Content Session

Every content generation session follows this exact pattern. Print or bookmark this.

```
─────────────────────────────────────────────────────────────────
CONTENT SESSION PATTERN
─────────────────────────────────────────────────────────────────

BEFORE YOU START:
  Attach: german-app-blueprint.md
  Attach: the seed file for the batch you want to process
  Confirm which words are still "status": "pending"

STEP 1 — GENERATE (paste batch-prompt.md, fill in the blanks)
  Claude returns: word entries JSON + exercises JSON
  Save both blocks as temporary files:
    _factory/temp-words.json
    _factory/temp-exercises.json

STEP 2 — VALIDATE (paste validate-prompt.md + temp files)
  Claude returns: validation report
  If failures: fix the specific entries Claude flagged, re-validate
  If passed: proceed to Step 3

STEP 3 — MERGE
  Open /data/[category].json
  Append the new word entries inside the main array
  Open /data/exercises/exercises-[category].json
  Append the new exercise entries inside the main array

STEP 4 — UPDATE THE SEED FILE
  Set each processed word's "status" to "done"
  Set the batch "generated_date" to today
  If all words in the batch are done, set batch "status" to "done"

STEP 5 — FILL REMAINING TOKENS (if time/tokens remain)
  Say: "Process the next pending batch from [next seed file]."
  Repeat from Step 1.

─────────────────────────────────────────────────────────────────
```

---

### 17.6 — First Cowork Session Checklist (Project Setup)

This is the exact sequence for the very first session when setting up the project from scratch in Cowork. Do these in order — do not skip ahead.

```
SESSION 0 — PROJECT SETUP (do this once, before any content work)
─────────────────────────────────────────────────────────────────

[ ] Create the folder structure exactly as shown in Section 5
[ ] Create /_factory/README.md — paste Section 17 of this blueprint into it
[ ] Create /_factory/batch-prompt.md — paste Section 17.3 into it
[ ] Create /_factory/validate-prompt.md — paste Section 17.4 into it
[ ] Create /_factory/seeds/ folder
[ ] Create verbs-level1.json in /_factory/seeds/ — paste the seed template 
    from Section 17.2 and fill in the 25 Level 1 verbs
[ ] Create /data/verbs.json as an empty array: []
[ ] Create /data/exercises/exercises-verbs.json as an empty array: []
[ ] Create /data/modules.json with the module registry from Section 7

Once this is done, the project is ready for Session 1 (app shell) 
and Session 2 (first content batch).
─────────────────────────────────────────────────────────────────
```

---

### 17.7 — Scaling the Factory to New Modules

When a new module is ready to be built (e.g. Nouns), the factory scales without any new setup:

1. Create `/_factory/seeds/nouns-level1.json` using the same seed file structure
2. Copy `batch-prompt.md` and update the category references (`verbs` → `nouns`)
3. Copy `validate-prompt.md` — it is already category-agnostic, no changes needed
4. Create `/data/nouns.json` as an empty array
5. Create `/data/exercises/exercises-nouns.json` as an empty array
6. Run the same session pattern from Section 17.5

The only file that changes per category is the batch prompt (category field and required JSON fields for that word type). Everything else is identical.

---

*This document was created and is maintained in collaboration with Claude (Anthropic). Update this file at the end of every build or planning session. Always attach this file when starting a new Design or Cowork session.*
