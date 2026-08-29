#!/usr/bin/env python3
"""Verify prefix-variant judgement calls against German Wiktionary.

Offline and deterministic. Reads:
  _factory/vorsilben/filed-facts.json      — what the app claims
  _factory/vorsilben/wiktionary-cache.tsv  — what de.wiktionary.org says
Writes:
  _factory/vorsilben/verify-report.md

This script holds its OWN derivation of separability — it does not import
anything from generate-variants.py — so a bug there cannot pass silently here.

Separability is derived from the dictionary's `Präsens_ich` form: a separable
verb splits in the finite clause ("stelle ab"), an inseparable one does not
("durchsuche"). Cross-checked against the Partizip II `ge` infix.

Verdicts:
  PASS       the filed (separability, auxiliary, Partizip II) triple matches a
             reading the dictionary lists
  MISMATCH   no reading matches — the app is wrong
  AMBIGUOUS  PASS, but the page lists another reading with different behaviour;
             the exercise sentences must pin down the reading we filed
  NOT-FOUND  no Wiktionary page
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = os.path.join(ROOT, "_factory", "vorsilben")
AUX = {"haben": "hat", "sein": "ist"}


def sep_from_praesens(praesens):
    """Separable iff the prefix detaches in the finite present form."""
    p = (praesens or "").strip()
    if not p or p == "—":
        return None
    return " " in p


def sep_from_partizip(pii, prefix, root_pii):
    """Cross-check: separable iff the participle is prefix + the ROOT's participle.

    A naive `ge`-infix test is wrong twice over: it fires on stems that simply
    begin with ge- (umgeben -> "geben"), and it misses bases that form no ge-
    participle at all (weiterentwickeln -> weiterentwickelt). Comparing against
    the root's own participle is exact for both.
    """
    if not (pii and prefix and root_pii):
        return None
    if pii == prefix + root_pii:
        return True
    if pii.startswith(prefix) and not pii[len(prefix):].startswith("ge"):
        return False
    return None


def load_cache(path):
    cache = {}
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        word, _, rest = line.partition("\t")
        if rest.strip() in ("MISSING", "NOTEMPLATE"):
            cache[word] = None
            continue
        readings = []
        for chunk in rest.split("||"):
            parts = [c.strip() for c in chunk.strip().split("~")]
            while len(parts) < 3:
                parts.append("")
            auxes = [AUX.get(a, a) for a in parts[1].split("/") if a]
            readings.append({"pii": parts[0], "aux": auxes, "praesens": parts[2]})
        cache[word] = readings
    return cache


def main():
    filed = json.load(open(os.path.join(V, "filed-facts.json"), encoding="utf-8"))
    cache = load_cache(os.path.join(V, "wiktionary-cache.tsv"))

    rows, counts = [], {"PASS": 0, "MISMATCH": 0, "AMBIGUOUS": 0, "NOT-FOUND": 0,
                        "INFIX-CONFLICT": 0}
    for f in filed:
        w = f["word"]
        readings = cache.get(w, "absent")
        if readings == "absent" or readings is None:
            verdict, detail = "NOT-FOUND", "no Wiktionary page"
            rows.append((w, f, verdict, detail, None))
            counts["NOT-FOUND"] += 1
            continue

        match = None
        for r in readings:
            r_sep = sep_from_praesens(r["praesens"])
            if r_sep is None:
                r_sep = sep_from_partizip(r["pii"], f["prefix"], f["root_partizip_ii"])
            r["sep"] = r_sep
            if (r_sep == f["separable"] and f["aux"] in r["aux"]
                    and r["pii"] == f["partizip_ii"]):
                match = r

        if match is None:
            verdict = "MISMATCH"
            detail = " || ".join(
                f"sep={r['sep']} aux={'/'.join(r['aux'])} PII={r['pii']}" for r in readings)
            counts["MISMATCH"] += 1
        elif len(readings) > 1:
            verdict = "AMBIGUOUS"
            others = [r for r in readings if r is not match]
            detail = "also listed: " + " || ".join(
                f"sep={r['sep']} aux={'/'.join(r['aux'])} PII={r['pii']}" for r in others)
            counts["AMBIGUOUS"] += 1
        else:
            verdict, detail = "PASS", ""
            counts["PASS"] += 1

        # independent cross-check of the two separability derivations
        if match is not None:
            alt = sep_from_partizip(match["pii"], f["prefix"], f["root_partizip_ii"])
            if alt is not None and alt != match["sep"]:
                counts["INFIX-CONFLICT"] += 1
                detail = (detail + " | " if detail else "") + \
                    f"INFIX-CONFLICT: Präsens says sep={match['sep']}, ge-infix says {alt}"
        rows.append((w, f, verdict, detail, match))

    order = {"MISMATCH": 0, "AMBIGUOUS": 1, "NOT-FOUND": 2, "PASS": 3}
    rows.sort(key=lambda r: (order[r[2]], r[0]))

    out = [
        "# Variant verification — filed vs. de.wiktionary.org",
        "",
        "*Generated by `_factory/verify-variants.py`. Source: "
        "`wiktionary-cache.tsv` (fetched 2026-08-28).*",
        "",
        f"**{len(filed)} variants checked** — "
        + ", ".join(f"{k} {v}" for k, v in counts.items() if v or k != "INFIX-CONFLICT"),
        "",
        "Separability and auxiliary only. **Case requirements are NOT verified here** "
        "— Wiktionary marks valency in prose, and parsing it would be a heuristic "
        "dressed up as verification. The 22 case calls remain open.",
        "",
        "| Verb | Verdict | Filed | Dictionary |",
        "|---|---|---|---|",
    ]
    for w, f, verdict, detail, match in rows:
        sep = "trennbar" if f["separable"] else "untrennbar"
        filed_s = f"{sep} · {f['aux']} · {f['partizip_ii']}"
        out.append(f"| `{w}` | **{verdict}** | {filed_s} | {detail or '✓'} |")

    if any(r[2] == "MISMATCH" for r in rows):
        out += ["", "## Mismatches — action required", ""]
        for w, f, verdict, detail, _ in rows:
            if verdict == "MISMATCH":
                out.append(f"- **`{w}`** — filed {'trennbar' if f['separable'] else 'untrennbar'}, "
                           f"{f['aux']}, {f['partizip_ii']}. Dictionary: {detail}")
                if f.get("judgement"):
                    out.append(f"  - filed reasoning: *{f['judgement']}*")

    dest = os.path.join(V, "verify-report.md")
    open(dest, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print(json.dumps(counts))
    print("->", dest)
    return 1 if counts["MISMATCH"] else 0


if __name__ == "__main__":
    sys.exit(main())
