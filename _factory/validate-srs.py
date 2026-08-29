#!/usr/bin/env python3
"""
VALIDATE-SRS.PY — independent check of the app's spaced-repetition scheduler.

Factory discipline (PRD_Wiederholung.md §2.6): this file holds its OWN copy of
the SM-2 rules, written from the specification rather than from js/srs.js. It
must never import, read or parse js/srs.js — if it did, a bug in the scheduler
would be faithfully reproduced here and pass silently.

It drives both implementations over the same pseudo-random answer log and
asserts that interval, ease factor, rep count, lapse count and due date agree
after every single answer, not just at the end.

Usage:  python3 _factory/validate-srs.py
Exit 0 = agreement. Exit 1 = divergence, with the first mismatch printed.

Requires node on PATH (the app half runs under node; js/srs.js exports itself
via module.exports when it detects a CommonJS environment).
"""

import json
import subprocess
import sys
import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRS_JS = ROOT / "js" / "srs.js"

# --- The specification, restated ------------------------------------------
# PRD_Wiederholung.md §5.2. Written from the PRD, not from the JS.

EASE_START = 2.5
EASE_MAX   = 2.5
EASE_MIN   = 1.3
EASE_UP    = 0.1
EASE_DOWN  = 0.2
STEP_1     = 1
STEP_2     = 6
# Intervals are capped. Discovered while writing this file: without a ceiling the
# interval compounds by the ease factor indefinitely and overflows the date type
# (Python raises OverflowError; JavaScript quietly produces an Invalid Date and
# writes a due date of 'NaN-NaN-NaN', removing the item from the pool for good).
INTERVAL_MAX = 365


def js_round(x):
    """
    JavaScript's Math.round is round-half-UP, including for negatives.
    Python's round() is banker's rounding: round(2.5) == 2, round(3.5) == 4.
    Intervals land on .5 often enough (6 * 1.3 = 7.8, 15 * 2.5 = 37.5) that
    using Python's default here would produce phantom mismatches.
    """
    import math
    return math.floor(x + 0.5)


def add_days(day_str, n):
    y, m, d = (int(p) for p in day_str.split("-"))
    return (datetime.date(y, m, d) + datetime.timedelta(days=n)).isoformat()


def fresh(today):
    return {"e": EASE_START, "i": 0, "r": 0, "d": today, "l": None, "x": 0}


def advance(state, is_right, today):
    s = dict(state) if state else fresh(today)

    if is_right:
        s["r"] = s.get("r", 0) + 1
        if s["r"] == 1:
            s["i"] = STEP_1
        elif s["r"] == 2:
            s["i"] = STEP_2
        else:
            s["i"] = js_round(s["i"] * s["e"])
        if s["i"] < 1:
            s["i"] = 1
        if s["i"] > INTERVAL_MAX:
            s["i"] = INTERVAL_MAX
        s["e"] = min(EASE_MAX, round(s["e"] + EASE_UP, 4))
    else:
        s["r"] = 0
        s["i"] = 0
        s["e"] = max(EASE_MIN, round(s["e"] - EASE_DOWN, 4))
        s["x"] = s.get("x", 0) + 1

    s["d"] = add_days(today, s["i"])
    s["l"] = today
    return s


# --- Answer log -----------------------------------------------------------

def build_log(n_items=120, n_answers=40, seed=20260829):
    """
    Deterministic pseudo-random log. Plain LCG rather than random.random() so
    the sequence is reproducible across Python versions.

    Item 0 is all-correct and item 1 is all-wrong: the two paths most likely to
    be special-cased wrongly (unbounded interval growth, ease floor) and least
    likely to be hit by chance in a random log.
    """
    state = seed
    def rnd():
        nonlocal state
        state = (1103515245 * state + 12345) % (2 ** 31)
        return state / (2 ** 31)

    start = datetime.date(2026, 1, 5)
    log = []
    for item in range(n_items):
        day = start
        for step in range(n_answers):
            if item == 0:
                is_right = True
            elif item == 1:
                is_right = False
            else:
                is_right = rnd() > 0.3
            log.append({
                "id": f"item_{item:04d}",
                "right": is_right,
                "day": day.isoformat(),
            })
            day += datetime.timedelta(days=int(rnd() * 9) + 1)
    return log


# --- The app's implementation, driven under node --------------------------

def run_js(log):
    script = """
const SRS = require(%s);
const log = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const states = {};
const out = [];
for (const ev of log) {
  const prev = states[ev.id] || null;
  const next = SRS.next(prev, ev.right, ev.day);
  states[ev.id] = next;
  out.push(next);
}
process.stdout.write(JSON.stringify(out));
""" % json.dumps(str(SRS_JS))

    proc = subprocess.run(
        ["node", "-e", script],
        input=json.dumps(log).encode(),
        capture_output=True,
    )
    if proc.returncode != 0:
        print("node failed:\n" + proc.stderr.decode(), file=sys.stderr)
        sys.exit(1)
    return json.loads(proc.stdout.decode())


# --- Compare ---------------------------------------------------------------

FIELDS = ["e", "i", "r", "d", "x"]


def main():
    if not SRS_JS.exists():
        print(f"FAIL: {SRS_JS} not found")
        return 1

    log = build_log()
    js_states = run_js(log)

    if len(js_states) != len(log):
        print(f"FAIL: js returned {len(js_states)} states for {len(log)} answers")
        return 1

    py_states = {}
    mismatches = []

    for idx, (ev, js) in enumerate(zip(log, js_states)):
        prev = py_states.get(ev["id"])
        py = advance(prev, ev["right"], ev["day"])
        py_states[ev["id"]] = py

        for f in FIELDS:
            a, b = py[f], js[f]
            if isinstance(a, float) or isinstance(b, float):
                same = abs(float(a) - float(b)) < 1e-9
            else:
                same = a == b
            if not same:
                mismatches.append(
                    f"  answer #{idx} ({ev['id']}, {'right' if ev['right'] else 'wrong'}, "
                    f"{ev['day']}): field '{f}' python={a!r} js={b!r}"
                )

        if mismatches:
            break  # first divergence is the informative one

    if mismatches:
        print(f"FAIL: scheduler divergence ({len(log)} answers replayed)")
        for m in mismatches:
            print(m)
        return 1

    # Sanity assertions on the log itself — a validator that agrees because
    # neither side did anything is worthless.
    all_right = [s for ev, s in zip(log, js_states) if ev["id"] == "item_0000"]
    all_wrong = [s for ev, s in zip(log, js_states) if ev["id"] == "item_0001"]

    checks = [
        ("log exercised the scheduler", len(log) >= 1000),
        ("intervals grow on an all-correct item", all_right[-1]["i"] > 100),
        ("intervals are capped", all(s["i"] <= INTERVAL_MAX for s in js_states)),
        ("the cap is actually reached", all_right[-1]["i"] == INTERVAL_MAX),
        ("no invalid due dates", all(len(s["d"]) == 10 and "N" not in s["d"]
                                     for s in js_states)),
        ("ease is capped at 2.5", all(s["e"] <= 2.5 + 1e-9 for s in js_states)),
        ("ease is floored at 1.3", all(s["e"] >= 1.3 - 1e-9 for s in js_states)),
        ("an all-wrong item stays due today", all(s["i"] == 0 for s in all_wrong)),
        ("an all-wrong item bottoms out at 1.3", all_wrong[-1]["e"] == 1.3),
        ("lapses counted on the all-wrong item", all_wrong[-1]["x"] == len(all_wrong)),
        ("distinct intervals observed", len({s["i"] for s in js_states}) > 8),
    ]
    failed = [name for name, ok in checks if not ok]
    if failed:
        print("FAIL: log did not exercise the scheduler as intended")
        for name in failed:
            print(f"  - {name}")
        return 1

    print(f"PASS: {len(log)} answers over {len(py_states)} items — "
          f"python and js agree on {', '.join(FIELDS)} after every answer")
    print(f"      all-correct item reached interval {all_right[-1]['i']}d, "
          f"all-wrong item ease {all_wrong[-1]['e']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
