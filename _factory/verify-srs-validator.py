#!/usr/bin/env python3
"""
VERIFY-SRS-VALIDATOR.PY — the negative test for the SRS checks.

A check that has never failed has not been shown to work. This script
deliberately breaks the code one rule at a time and asserts that the checks
catch each break. It restores every file afterwards, including on error.

Two suites are exercised:
  validate-srs.py  — the algorithm. Mutations to js/srs.js.
  qa-srs.js        — the wiring. Mutations to js/exercises.js.

Usage:  NODE_PATH=~/qa/node_modules python3 _factory/verify-srs-validator.py
Exit 0 = every seeded bug detected, and both suites pass on clean code.
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRS = ROOT / "js" / "srs.js"
VALIDATOR = ROOT / "_factory" / "validate-srs.py"
EXERCISES = ROOT / "js" / "exercises.js"
REVIEW    = ROOT / "js" / "review.js"
QA_SRS    = ROOT / "_factory" / "qa-srs.js"
QA_REVIEW = ROOT / "_factory" / "qa-review.js"

# (name, find, replace) — each is a plausible one-character-class slip, not a
# strawman. These are the mistakes an edit to this file would actually make.
MUTATIONS = [
    ("ease floor lowered",
     "EASE_MIN:   1.3,", "EASE_MIN:   1.0,"),
    ("second-step interval off by one",
     "STEP_2:     6,", "STEP_2:     7,"),
    ("ease gain doubled",
     "EASE_UP:    0.1,", "EASE_UP:    0.2,"),
    ("interval cap removed (the overflow bug)",
     "INTERVAL_MAX: 365,", "INTERVAL_MAX: 100000000,"),
    ("lapse does not reset the rep count",
     "      s.r = 0;\n      s.i = 0;", "      s.i = 0;"),
    ("lapse does not reset the interval",
     "      s.r = 0;\n      s.i = 0;", "      s.r = 0;"),
    ("lapse not counted",
     "      s.x = (s.x || 0) + 1;", "      s.x = (s.x || 0);"),
    ("due date measured from the wrong day",
     "    s.d = this.addDays(today, s.i);", "    s.d = this.addDays(today, s.i + 1);"),
]


# Mutations to the WIRING rather than the algorithm. qa-srs.js must catch these;
# validate-srs.py cannot, because it never loads the app.
WIRING_MUTATIONS = [
    ("reviewMode no longer suppresses the progress bars (PRD Q3)",
     "  if (!sess || !sess.reviewMode) Progress.recordResult(itemId, isRight);",
     "  Progress.recordResult(itemId, isRight);"),
    ("answers stop reaching the scheduler",
     "  if (typeof SRS !== 'undefined') SRS.grade(itemId, isRight);",
     "  if (false) SRS.grade(itemId, isRight);"),
    ("module play stops writing exercise history",
     "  if (!sess || !sess.reviewMode) Progress.recordResult(itemId, isRight);",
     "  if (false) Progress.recordResult(itemId, isRight);"),
    ("Artikel items lose their namespaced id (the Session 40 fix reverted)",
     "    id:              'ex_artikel_' + n.id,", "    id:              n.id,"),
    ("Artikel stops recording again",
     "  _recordAnswer(s.current.id, isRight, s);", "  // _recordAnswer removed"),
]


def run_validator():
    p = subprocess.run([sys.executable, str(VALIDATOR)],
                       capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()


# Phase 2 mutations. These target the ways a mixed cross-module queue can break
# the Main engine, which is the risk the PRD flagged before the build started.
REVIEW_MUTATIONS = [
    ("index falls back to window globals (the lexical-global bug)",
     "    const data = (typeof appData !== 'undefined') ? appData : null;",
     "    const data = window.appData || null;"),
    ("scheduling state for deleted content crashes into the queue",
     "      if (!entry) { unknown++; continue; }",
     "      if (!entry) { unknown++; }"),
    ("not-yet-due items leak into the queue",
     "    for (const entry of this.dueBreakdown().servable) {",
     "    for (const entry of Object.values(this.buildIndex())) {"),
    ("queue is no longer most-overdue first",
     "    return Object.keys(byDate).sort()", "    return Object.keys(byDate).sort().reverse()"),
    ("exercises are mutated in place instead of cloned",
     "        index[id] = { ex: { ...ex, _srcModule: moduleId }, moduleId, engine: 'main' };",
     "        ex._srcModule = moduleId; index[id] = { ex, moduleId, engine: 'main' };"),
    ("the session forgets it is a review",
     "      current: null, answered: false, reviewMode: true",
     "      current: null, answered: false, reviewMode: false"),
]

# Phase 3. The dispatcher's failure modes: an engine that advances into its own
# empty queue instead of handing back, one that keeps its own counters or
# cooldown, or one whose HUD writes overwrite the session's.
PHASE3_MUTATIONS = [
    ("Deklination advances into its own results screen instead of handing back",
     "    if (s.reviewMode) { Review.next(); return; }\n    _deklShowResults();",
     "    _deklShowResults();"),
    ("Vorsilben advances into its own results screen instead of handing back",
     "    if (s.reviewMode) { Review.next(); return; }\n    _prefixShowResults();",
     "    _prefixShowResults();"),
    ("Artikel advances into its own results screen instead of handing back",
     "    if (s.reviewMode) { Review.next(); return; }\n    _artikelShowResults();",
     "    _artikelShowResults();"),
    ("the Weiter button stops dispatching on the engine",
     "  if (exerciseMode === 'review') { Review.advance(); return; }",
     "  if (exerciseMode === 'review') { _showNext(); return; }"),
    ("an engine keeps its own cooldown in review (Deklination)",
     "  } else if (!s.reviewMode) {\n    s.cooldown.push(ex);",
     "  } else {\n    s.cooldown.push(ex);"),
    ("an engine keeps its own cooldown in review (Vorsilben)",
     "  else if (!s.reviewMode) s.cooldown.push(ex);",
     "  else s.cooldown.push(ex);"),
    ("the HUD is written by the engine instead of the session",
     "function _reviewHud() {\n  if (exerciseMode !== 'review' || typeof Review === 'undefined') return false;",
     "function _reviewHud() {\n  if (true) return false;\n  if (exerciseMode !== 'review' || typeof Review === 'undefined') return false;"),
    ("the question counter reads off the one-item shell",
     "  if (exerciseMode === 'review' && typeof Review !== 'undefined' && Review.isActive()) {\n    return Review.answeredCount() + 1;\n  }",
     "  if (false) {\n    return Review.answeredCount() + 1;\n  }"),
    ("grading no longer reaches Review's counters",
     "  if (sess && sess.reviewMode && typeof Review !== 'undefined') {\n    Review.onGraded(itemId, isRight);",
     "  if (false) {\n    Review.onGraded(itemId, isRight);"),
]

PHASE3_REVIEW_MUTATIONS = [
    ("the dispatcher sends every item to the Main engine",
     "    if (entry.engine === 'main') {", "    if (true) {"),
    ("an engine is handed the whole queue instead of one item",
     "      queue: [ex], cooldown: [], correctCount: 0, totalCount: 1,",
     "      queue: [ex, ex], cooldown: [], correctCount: 0, totalCount: 1,"),
    ("misses are no longer requeued",
     "      if (this._retries[itemId] <= 2 && this._current) {",
     "      if (false && this._current) {"),
    ("the queue drops its engine tags",
     "      (byDate[d] = byDate[d] || []).push(entry);",
     "      (byDate[d] = byDate[d] || []).push({ ...entry, engine: 'main' });"),
]

REVIEW_ENGINE_MUTATIONS = [
    ("review unlocks words as if they were new",
     "  if (session.reviewMode) return;\n  if (!wordId || Progress.isUnlocked(wordId)) return;",
     "  if (!wordId || Progress.isUnlocked(wordId)) return;"),
    ("emptying a review queue falls through to a stale module home",
     "    if (session.reviewMode) { Review.next(); return; }\n    returnFromResults();",
     "    returnFromResults();"),
    ("module-specific behaviour keys off the session again",
     "function _srcModule() {\n  return session.moduleId || (session.current && session.current._srcModule) || null;\n}",
     "function _srcModule() {\n  return session.moduleId;\n}"),
]


def run_qa_srs():
    p = subprocess.run(["node", str(QA_SRS)], capture_output=True, text=True,
                       cwd=str(ROOT))
    return p.returncode, (p.stdout + p.stderr).strip()


def run_qa_review():
    p = subprocess.run(["node", str(QA_REVIEW)], capture_output=True, text=True,
                       cwd=str(ROOT))
    return p.returncode, (p.stdout + p.stderr).strip()


def mutate_suite(title, path, mutations, runner, failures):
    """Seed each mutation into `path`, run `runner`, assert it fails."""
    original = path.read_text()
    try:
        code, out = runner()
        if code != 0:
            print(f"\nFAIL: {title} does not pass on unmodified code")
            print(out)
            return False
        print(f"\nbaseline: {title} passes on clean {path.name}")

        for name, find, replace in mutations:
            if original.count(find) != 1:
                failures.append(f"{name}: anchor not found exactly once "
                                f"(found {original.count(find)})")
                print(f"  SKIP  {name}  (anchor missing)")
                continue

            path.write_text(original.replace(find, replace, 1))
            code, out = runner()
            path.write_text(original)

            if code == 0:
                failures.append(f"{name}: {title} PASSED on broken code")
                print(f"  MISS  {name}")
            else:
                first = next((l for l in out.splitlines()
                              if l.strip().startswith("- ")), "").strip()
                print(f"  caught  {name}" + (f"  →  {first}" if first else ""))
    finally:
        path.write_text(original)
    return True


def main():
    original = SRS.read_text()
    failures = []

    try:
        code, out = run_validator()
        if code != 0:
            print("FAIL: validator does not pass on unmodified srs.js")
            print(out)
            return 1
        print("baseline: validator passes on clean srs.js")

        for name, find, replace in MUTATIONS:
            if original.count(find) != 1:
                failures.append(f"{name}: anchor not found exactly once "
                                f"(found {original.count(find)}) — mutation not applied")
                print(f"  SKIP  {name}  (anchor missing)")
                continue

            SRS.write_text(original.replace(find, replace, 1))
            code, out = run_validator()
            SRS.write_text(original)

            if code == 0:
                failures.append(f"{name}: validator PASSED on broken code")
                print(f"  MISS  {name}")
            else:
                first = next((l for l in out.splitlines()
                              if "field" in l or "  - " in l), "").strip()
                print(f"  caught  {name}" + (f"  →  {first}" if first else ""))

        # ---- wiring suites ----
        if not mutate_suite("qa-srs.js", EXERCISES, WIRING_MUTATIONS,
                            run_qa_srs, failures):
            return 1
        if not mutate_suite("qa-review.js", REVIEW, REVIEW_MUTATIONS,
                            run_qa_review, failures):
            return 1
        if not mutate_suite("qa-review.js", EXERCISES, REVIEW_ENGINE_MUTATIONS,
                            run_qa_review, failures):
            return 1
        if not mutate_suite("qa-review.js (phase 3)", EXERCISES, PHASE3_MUTATIONS,
                            run_qa_review, failures):
            return 1
        if not mutate_suite("qa-review.js (phase 3)", REVIEW, PHASE3_REVIEW_MUTATIONS,
                            run_qa_review, failures):
            return 1

    finally:
        SRS.write_text(original)

    if failures:
        print(f"\nFAIL: {len(failures)} seeded bugs not detected")
        for f in failures:
            print(f"  - {f}")
        return 1

    total = len(MUTATIONS) + len(WIRING_MUTATIONS) + len(REVIEW_MUTATIONS) \
            + len(REVIEW_ENGINE_MUTATIONS) + len(PHASE3_MUTATIONS) \
            + len(PHASE3_REVIEW_MUTATIONS)
    print(f"\nPASS: detected all {total} seeded bugs "
          f"({len(MUTATIONS)} algorithm, {len(WIRING_MUTATIONS)} wiring, "
          f"{len(REVIEW_MUTATIONS) + len(REVIEW_ENGINE_MUTATIONS)} review, "
          f"{len(PHASE3_MUTATIONS) + len(PHASE3_REVIEW_MUTATIONS)} dispatcher); "
          f"all suites pass on clean code")
    return 0


if __name__ == "__main__":
    sys.exit(main())
