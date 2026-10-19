#!/usr/bin/env python3
"""
verify-stuck-mode-suite.py — mutation test for qa-stuck-mode.js (Session 41).

Seeds plausible slips into the real JS one at a time, runs the suite, asserts it
fails, and restores the file in a finally block. Also asserts the suite passes on
clean code. Mutation 1 reverts the fix this session exists for.

Run: NODE_PATH=~/qa/node_modules python3 _factory/verify-stuck-mode-suite.py
"""
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUITE = ROOT / "_factory" / "qa-stuck-mode.js"

MUTATIONS = [
    ("gesture back no longer drops the mode", "js/app.js",
     "  if (currentScreen === 'screen-exercise') _abandonExerciseMode();\n", ""),
    ("openExercise no longer resets the mode", "js/app.js",
     "  _abandonExerciseMode();\n  currentExerciseState", "  currentExerciseState"),
    ("review flag survives abandon", "js/exercises.js",
     "if (exerciseMode === 'review' && typeof Review !== 'undefined') Review._active = false;", ""),
    ("roots queue counts standalone variations", "js/exercises.js",
     "const rootIds = new Set(_stammverben().map(v => v.id));",
     "const rootIds = new Set(appData.verbs.map(v => v.id));"),
    ("standalone variations not served", "js/exercises.js",
     "      allowedVariantIds.add(verb.id);\n", ""),
    ("standalone unlocks as a root", "js/exercises.js",
     "appData.verbs.some(v => v.id === wordId && !v.standalone_variant)",
     "appData.verbs.some(v => v.id === wordId)"),
    ("rebucket skips the move", "js/progress.js",
     "    stale.forEach(id => { if (!vars.includes(id)) vars.push(id); });\n", ""),
    ("card denominator counts all verbs", "js/app.js",
     "const rootIds    = new Set(_stammverben().map(v => v.id));",
     "const rootIds    = new Set(appData.verbs.map(v => v.id));"),
]


def suite_passes():
    return subprocess.run(["node", str(SUITE)], cwd=ROOT, capture_output=True).returncode == 0


def main():
    if not suite_passes():
        print("FAIL: suite does not pass on clean code"); return 1
    print("clean code: PASS")
    missed = 0
    for name, rel, old, new in MUTATIONS:
        p = ROOT / rel
        orig = p.read_text(encoding="utf-8")
        assert orig.count(old) == 1, f"mutation anchor not unique/found: {name}"
        try:
            p.write_text(orig.replace(old, new), encoding="utf-8")
            caught = not suite_passes()
        finally:
            p.write_text(orig, encoding="utf-8")
        missed += not caught
        print(f"{'CAUGHT' if caught else 'MISSED'}  {name}")
    print(f"\n{len(MUTATIONS) - missed}/{len(MUTATIONS)} mutations caught")
    return 1 if missed else 0


if __name__ == "__main__":
    sys.exit(main())
