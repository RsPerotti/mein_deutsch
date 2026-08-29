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
QA_SRS    = ROOT / "_factory" / "qa-srs.js"

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


def run_qa_srs():
    p = subprocess.run(["node", str(QA_SRS)], capture_output=True, text=True,
                       cwd=str(ROOT))
    return p.returncode, (p.stdout + p.stderr).strip()


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

        # ---- wiring suite ----
        original_ex = EXERCISES.read_text()
        try:
            code, out = run_qa_srs()
            if code != 0:
                print("\nFAIL: qa-srs.js does not pass on unmodified code")
                print(out)
                return 1
            print("\nbaseline: qa-srs.js passes on clean exercises.js")

            for name, find, replace in WIRING_MUTATIONS:
                if original_ex.count(find) != 1:
                    failures.append(f"{name}: anchor not found exactly once "
                                    f"(found {original_ex.count(find)})")
                    print(f"  SKIP  {name}  (anchor missing)")
                    continue

                EXERCISES.write_text(original_ex.replace(find, replace, 1))
                code, out = run_qa_srs()
                EXERCISES.write_text(original_ex)

                if code == 0:
                    failures.append(f"{name}: qa-srs.js PASSED on broken code")
                    print(f"  MISS  {name}")
                else:
                    first = next((l for l in out.splitlines() if l.strip().startswith("- ")), "").strip()
                    print(f"  caught  {name}" + (f"  →  {first}" if first else ""))
        finally:
            EXERCISES.write_text(original_ex)

    finally:
        SRS.write_text(original)

    if failures:
        print(f"\nFAIL: {len(failures)} of {len(MUTATIONS) + len(WIRING_MUTATIONS)} "
              f"seeded bugs not detected")
        for f in failures:
            print(f"  - {f}")
        return 1

    print(f"\nPASS: detected all {len(MUTATIONS)} algorithm bugs and "
          f"{len(WIRING_MUTATIONS)} wiring bugs; both suites pass on clean code")
    return 0


if __name__ == "__main__":
    sys.exit(main())
