# PRD — Adverb Scales (Skalen)
*Created: 2026-10-22 — Session 42 · Revised same session after Ricco's feedback*
*Status: SIGNED OFF 2026-10-22 (Ricco: "Yes, build and ship"). Relational exercise: IN.*

---

## Sign-off amendments (2026-10-22)
- **Rule from Ricco: an axis needs 4+ words.** Applied mechanically by the validator (side-note words don't count).
  - **Direktheit dropped**: the request ladder has only 3 adverbs (bitte, vielleicht, eventuell), and its steps also differ in sentence structure, so it isn't a clean scale.
  - **Register split** into three axes (Folge 6, Gegensatz 4, Zusatz 5 words) so each ladder is an axis of its own.
  - **Takt** becomes its own axis (5 words) instead of a side ladder of Häufigkeit.
- **Menge:** *nur / bloß / lediglich* moved to a side note. They mean "exactly n, and that is little", which is a judgement, not a position on the number line.
- **Quelle reordered by one question** ("Does the speaker believe it's true?"): offensichtlich → offenbar/anscheinend → angeblich → scheinbar.
- **Relational exercise** is a new `scale_choice` type rendered inside the Main engine. It uses the existing `selectAnswer` → `_recordAnswer` funnel, so there's no new engine and no new persistence path. Widerspruch is excluded from the drill because it is a typology rather than a strict order.
- **Build amendments (2026-10-22, during build):** tier examples come from the anchor word, or from a seed override where the stored example shows another sense (kaum, genau); *sicherlich* moved to "Fast sicher" on Wiktionary evidence; register ladders and Widerspruch are shown as **Faustregel** because dictionaries list them as synonyms; da/drüben are excluded from distance drills.
- Final axis count: 16. That's 14 proposed − Direktheit, then +2 from splitting Register into three, and Takt promoted to its own axis.

## Problem
The Adverbs module teaches 139 words in isolation. Most of them only make sense *relative to each other*: `wahrscheinlich` vs `vielleicht`, `ganz gut` vs `sehr gut`, `schon` vs `noch`, `anscheinend` vs `scheinbar`. Learning them as separate flashcards hides exactly the thing that makes them usable — where each one sits between its neighbours.

## Goal
Learn adverbs **as systems, not lists**: see each family on an axis, practise its ordering, and add the missing words that complete each axis.

## Success criteria
- A **Skalen** screen in the Adverbs module, one card per axis; each axis drawn vertically, pole to pole, words grouped in tiers of equal strength.
- Each tier has (a) an **anchor sentence** — the *same* sentence frame for the whole axis, so only the adverb changes — and (b) one natural example. DE + EN.
- Every word on an axis exists in `adverbs.json` and has exercises (new words included).
- A **relational exercise** ("Welches ist stärker / häufiger / früher?") drills the order itself.
- Every tier placement is backed by a cited source (Duden / DWDS / de.wiktionary) or visibly marked UNVERIFIED. Ricco verifies nothing linguistic.

## Design principles
1. **Built from the language, not from Ricco's draft list.** His examples were a prompt for the format; content is derived independently and verified.
2. **One axis = one question.** Each axis answers a single question (*How sure? How often? How much?*). Words that answer a *different* question are moved off the axis into a side note, even if they look similar (e.g. `angeblich` is about the source, not probability).
3. **Traps are first-class.** Where learners typically confuse neighbours (`scheinbar`/`anscheinend`, unstressed `ganz`, `schließlich`/`endlich`, `gerade` = now *and* just), the axis shows a ⚠ note.
4. **Not everything is a scale.** Sentence openers, fillers and most connectors are menus of functions, not gradients — they get no axis (see "Rejected").

---

## Proposed axes  (★ = new word, not yet in adverbs.json · all placements UNVERIFIED until step 3)

### 1. Gewissheit — *How sure is the speaker?*  · anchor: "Er kommt ___ morgen."
| Tier | Words |
|---|---|
| Ausgemacht | definitiv, auf jeden Fall, garantiert★, zweifellos★ |
| Sehr sicher | bestimmt, sicher★, sicherlich |
| Fast sicher | höchstwahrscheinlich★ |
| Wahrscheinlich | wahrscheinlich, vermutlich★, voraussichtlich (= by plan/forecast) |
| Möglich | vielleicht, eventuell, möglicherweise, womöglich★ |
| Unwahrscheinlich | kaum, wohl kaum★ |
| Ausgeschlossen | keineswegs★, keinesfalls★, auf keinen Fall |
Side note: *unwahrscheinlich / unmöglich* are adjectives ("Das ist unmöglich"), shown for contrast.

### 2. Quelle — *How good is the evidence?*  · anchor: "Er ist ___ krank."
| Tier | Words |
|---|---|
| Sichtbar belegt | offensichtlich★, offenbar |
| Es sieht so aus | anscheinend |
| Nur Schein (≠ wahr!) | scheinbar★ ⚠ |
| Jemand behauptet es | angeblich |

### 3. Häufigkeit — *How often?*  · anchor: "Ich gehe ___ joggen."
| Tier | Words |
|---|---|
| 100 % | immer, stets★, jedes Mal★ |
| Zu oft (genervt) | ständig, dauernd |
| Fast immer | meistens, normalerweise, in der Regel★, fast immer★ |
| Oft | oft, häufig |
| Manchmal | manchmal, ab und zu, hin und wieder★, gelegentlich, von Zeit zu Zeit |
| Selten | selten |
| Fast nie | kaum, fast nie★ |
| 0 % | nie, niemals |
Side ladder **Takt** (fixed intervals): stündlich★ → täglich → wöchentlich → monatlich★ → jährlich★. Side note: *regelmäßig* = at regular intervals, says nothing about how often.

### 4. Intensität — *How much?*  · anchor: "Der Film war ___ gut."
| Tier | Words |
|---|---|
| Maximal | äußerst★, extrem, absolut, total, völlig★, unglaublich, wahnsinnig · UGS: voll, mega, super★ |
| Stark | sehr, wirklich, echt, richtig★, besonders, so |
| Mittel | ziemlich, recht★, ganz★ ⚠ (unstressed "ganz gut" = *fairly* good) |
| Schwach | etwas★, ein bisschen, ein wenig★, einigermaßen★ |
| Kaum | kaum |
| Null | gar nicht (via *gar*), überhaupt nicht★ |

### 5. Menge um eine Zahl — *More or less than the number?*  · anchor: "Ich habe ___ zwei Stunden gewartet."
mehr als★ → gut★ → mindestens → genau → ungefähr★ / etwa★ / circa★ → knapp★ / fast★ / beinahe → höchstens★ → nur★ / bloß★ / lediglich. Side: *vergleichsweise* (relative, not numeric).

### 6. Zeitstrahl — *When, relative to now?*  (past → future)
früher, damals★ → neulich, kürzlich★, vor Kurzem★ → vorhin → eben★, gerade ⚠ (just now) → jetzt★, gerade (right now) → sofort, gleich → bald → später → irgendwann.

### 7. Verlauf — *Where is the action in its lifecycle?*  · anchor: "Sie schläft ___."
noch nicht★ → schon / bereits★ → noch → nicht mehr. Side: *inzwischen / mittlerweile★* = a change has already happened.

### 8. Reihenfolge — *Which step?*
zuerst, zunächst★, erstens → dann, danach, anschließend★, zweitens → drittens → zuletzt★, schließlich. ⚠ *endlich★* = "finally (at last!)", emotional relief — not a sequence word.

### 9. Zustimmung — *Yes ↔ No*
genau, absolut, auf jeden Fall, klar, natürlich → stimmt → eher ja★ → jein★ → eher nicht★ → auf keinen Fall, keineswegs, kein Stück★ (UGS). Side: *leider* = regret, not a position.

### 10. Widerspruch — *How strongly does part 2 oppose part 1?*
einschränkend: allerdings, jedoch → gegen die Erwartung: trotzdem, dennoch → gegenüberstellend: hingegen, dagegen★, andererseits → ersetzend: stattdessen, sondern → umkehrend: im Gegenteil.

### 11. Register — *Spoken → formal* (three short ladders)
- Folge: darum / deswegen → deshalb → daher → somit, folglich → infolgedessen
- Gegensatz: trotzdem → allerdings → jedoch → dennoch
- Zusatz: auch★ → außerdem → zusätzlich → zudem → darüber hinaus

### 12. Direktheit — *Direct → hedged*  (sentence ladder, one request)
"Mach das Fenster zu." → "Mach **bitte** das Fenster zu." → "Könntest du **vielleicht** …?" → "Könntest du **eventuell** …?" · Hedging: "Das ist **etwas** / **ein bisschen** / **irgendwie** zu teuer."

### 13. Alle ↔ Keine — *a grid, not a line*
| | Zeit | Ort | Ding | Person |
|---|---|---|---|---|
| alle | immer, jederzeit★ | überall★ | alles★ | jeder★ |
| einige | irgendwann | irgendwo★ | irgendetwas | jemand★, irgendwer★ |
| keine | nie | nirgends★, nirgendwo★ | nichts★ | niemand★ |
(alles/nichts/jemand/niemand/jeder are pronouns; they join the existing *Indefinites* category and are labelled as pronouns on their cards.)

### 14. Entfernung — *How far?*  hier★ → da★ → dort★ → drüben★ → weit weg★

### Rejected (no axis)
Sentence Openers, Fillers, Modal Particles (own module) — functions, not gradients. Pure additive connectors appear only in the Register ladder.

**New words: ~75.** Exact list fixed in the seed file.

---

## Scope
### In
- `screen-adverb-scales` (list of axes) + axis detail view; linked from Adverbs module home and Adverbliste. New renderer function — no edits to existing ones.
- `data/adverb-scales.json` (axes → tiers → word ids, anchor + example, source per placement, trap notes), bundled by `bundle-data.py`.
- ~75 new adverbs in `adverbs.json` with the standard 4 exercises each (~300), via the existing intake/generator pattern.
- **Relational exercise:** multiple choice rendered by the existing `translate_word` path (no new engine): "Welches Wort ist am häufigsten?" with 3–4 words from **different** tiers of one axis. Generated mechanically from the scale data, so the answer key is the tier order itself. Joins Wiederholung automatically (Main engine).
- `_factory/validate-adverb-scales.py` with its own copy of the rules + mutation test.

### Out
- Audio/TTS. Drag-to-order exercises (would need a new engine — v2 if wanted).
- Rewriting the existing 556 adverb exercises (but see Risk 2).

## Constraints
- Vanilla JS, offline; bump `CACHE`, add new JS to `PRECACHE`.
- New exercises must write to both progress stores (`_recordAnswer`) — the recurring-bug check.
- Linguistic correctness verified externally; Wiktionary/DWDS reachable only via the in-app browser → cached TSV.

## Plan
1. **Sign-off** (this PRD) + axis selection.
2. **Seeds:** `_factory/seeds/adverb-scales-seeds.json` — axes, tiers, new-word entries (english, cefr, register, example), anchors.
3. **Verify:** each new word's meaning/register and each tier boundary against Duden/DWDS (cached). Placements without support → UNVERIFIED badge, not silently kept.
4. **Generate:** new adverb entries + 4 exercises each; relational exercises from tier order.
5. **Validate (independent rules):** word on ≤1 tier per axis; every tier word exists in adverbs.json; anchor contains `___` and every tier word fits it; relational options always span ≥2 tiers with a unique top; no correct answer in wrongs; ID uniqueness; source-or-UNVERIFIED on every placement. Mutation test with seeded bugs.
6. **Build** screen; 375 px Playwright screenshots, light + dark.
7. QA suites, SW bump, SOURCE_OF_TRUTH + DAY_LOG, push.

Phased delivery (one push per phase, usable after each):
- **P1** Gewissheit, Quelle, Häufigkeit, Intensität, Menge
- **P2** Zeitstrahl, Verlauf, Reihenfolge
- **P3** Zustimmung, Widerspruch, Register, Direktheit
- **P4** Alle↔Keine, Entfernung

## Risks
1. **Tier boundaries are partly judgement** (is `sicherlich` below `bestimmt`?). Dictionaries define words, not rankings. Mitigation: tiers kept coarse; where sources disagree, the words share a tier rather than being force-ranked.
2. **Existing fill-blank exercises use scale-mates as distractors** (e.g. "Ich komme ___ zu spät" with `oft`/`selten` as "wrong" answers — grammatically fine). The English line disambiguates, so it's not broken, but once scale data exists a validator can flag these. Proposed as a follow-up, not in scope.

## Open questions (Ricco)
1. Which axes are in — all 14 phased as above, or a subset?
2. Relational exercise: in or out?
