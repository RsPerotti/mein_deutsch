#!/usr/bin/env python3
"""Build the Wechselpräfixe pair list for Vorsilben Lesson 5.

Nothing linguistic is authored here. The pairs come from the AMBIGUOUS verdicts in
verify-report.md; separability, Partizip II and auxiliary come from the Wiktionary
cache; which half the app drills comes from filed-facts.json. The only authored
input is the English gloss per reading, in _factory/vorsilben/dual-readings.json.

Writes a section of type "pairs" into the `prefixes-dual` lesson, replacing any
section of that type already there — so re-running is idempotent.

Run:  python3 _factory/generate-dual-section.py
Then: python3 _factory/validate-prefixes.py && python3 _factory/bundle-prefixes.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V = ROOT / "_factory" / "vorsilben"
LESSONS = ROOT / "data" / "grammar" / "prefix-lessons.json"
AUX = {"haben": "hat", "sein": "ist"}


def load_cache():
    cache = {}
    for line in (V / "wiktionary-cache.tsv").read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        word, _, rest = line.partition("\t")
        if rest.strip() in ("MISSING", "NOTEMPLATE"):
            continue
        readings = []
        for chunk in rest.split("||"):
            parts = [c.strip() for c in chunk.strip().split("~")]
            while len(parts) < 3:
                parts.append("")
            readings.append({
                "pii": parts[0],
                "aux": [AUX.get(a, a) for a in parts[1].split("/") if a],
                "separable": " " in parts[2] if parts[2] and parts[2] != "—" else None,
            })
        cache[word] = readings
    return cache


def ambiguous_verbs():
    """The pair list is whatever verify-variants.py called AMBIGUOUS — never a
    hand-kept list, so a future intake cannot silently add a pair we don't teach."""
    out = []
    for line in (V / "verify-report.md").read_text(encoding="utf-8").splitlines():
        if line.startswith("| `") and "**AMBIGUOUS**" in line:
            out.append(line.split("`")[1])
    return sorted(out)


def main():
    cache = load_cache()
    filed = {f["word"]: f for f in json.loads((V / "filed-facts.json").read_text(encoding="utf-8"))}
    glosses = json.loads((V / "dual-readings.json").read_text(encoding="utf-8"))
    verbs = ambiguous_verbs()

    pairs, missing = [], []
    for w in verbs:
        g = glosses.get(w)
        if not g:
            missing.append(w)
            continue
        rows = []
        for r in cache[w]:
            entry = g.get(r["pii"])
            if not entry:
                missing.append(f"{w}/{r['pii']}")
                continue
            rows.append({
                "form": r["pii"],
                "separable": bool(r["separable"]),
                "aux": r["aux"][0] if r["aux"] else "",
                "en": entry["en"],
                "tag": entry.get("tag", ""),
                "drilled": (r["separable"] == filed[w]["separable"]
                            and r["pii"] == filed[w]["partizip_ii"]),
            })
        # separable first — it is the stressed, literal half the rule starts from
        rows.sort(key=lambda r: not r["separable"])
        pairs.append({"verb": w, "readings": rows})

    if missing:
        raise SystemExit("missing glosses in dual-readings.json: " + ", ".join(missing))

    section = {
        "type": "pairs",
        "heading": "Die Paare in dieser App",
        "body": ("Eleven verbs in this app are genuinely both. The app drills the reading "
                 "marked <strong>geübt</strong> — the other one is real German too, and for "
                 "<em>umfahren</em> it is the opposite of what you are practising. Stressed "
                 "prefix = separable = literal; unstressed = inseparable = figurative."),
        "pairs": pairs,
    }

    lessons = json.loads(LESSONS.read_text(encoding="utf-8"))
    for lesson in lessons:
        if lesson["id"] != "prefixes-dual":
            continue
        lesson["sections"] = [s for s in lesson["sections"] if s.get("type") != "pairs"]
        lesson["sections"].append(section)
    LESSONS.write_text(json.dumps(lessons, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"pairs: {len(pairs)} verbs, {sum(len(p['readings']) for p in pairs)} readings")
    print(f"drilled halves marked: {sum(1 for p in pairs for r in p['readings'] if r['drilled'])}")
    print("->", LESSONS.relative_to(ROOT))


if __name__ == "__main__":
    main()
