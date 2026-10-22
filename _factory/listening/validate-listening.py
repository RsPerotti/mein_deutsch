#!/usr/bin/env python3
"""
validate-listening.py — independent checks on js/listening-data.js.
Does not import the bundler; re-reads files from disk with its own rules.

  A  bundle parses; every article has id/title/date/transcript/vocabulary
  B  article ids unique, and DW lesson ids (l-NNN from the source url) unique
     — guards against the same lesson crawled under two slugs
  C  every bundled article has articles/<id>/audio.mp3, > 100 KB, MP3 header
  D  every bundled article's data.json agrees with the bundle (title, transcript)
  E  transcripts contain no HTML tags or entities
  F  every vocab entry has a non-empty explanation_en
  G  every vocab word occurs in its transcript (case-insensitive)
  H  dates are ISO, and the bundle is sorted newest first
  I  module description count matches the number of articles
Run: python3 _factory/listening/validate-listening.py
"""
import json, re, sys
from pathlib import Path
import os
ROOT = Path(os.environ.get("LISTENING_ROOT") or Path(__file__).resolve().parents[2])
ART = ROOT / "content/listening/articles"
s = (ROOT / "js/listening-data.js").read_text()
errs = []
try:
    J = json.loads(s[s.index("{"): s.rstrip().rstrip(";").rindex("}") + 1]); A = J["articles"]
except Exception as e:
    print("A FAIL", e); sys.exit(1)
for a in A:
    for k in ("id", "title", "date", "transcript", "vocabulary"):
        if not a.get(k): errs.append(f"A {a.get('id')}: missing {k}")
ids = [a["id"] for a in A]
if len(ids) != len(set(ids)): errs.append("B duplicate article ids")
dw = {}
for a in A:
    f = ART / a["id"] / "data.json"
    if not f.is_file(): errs.append(f"D {a['id']}: no data.json"); continue
    d = json.loads(f.read_text())
    m = re.search(r"l-\d+", d.get("url", ""))
    if m:
        if m.group(0) in dw: errs.append(f"B {a['id']} and {dw[m.group(0)]} are the same DW lesson {m.group(0)}")
        dw[m.group(0)] = a["id"]
    if d["title"].strip() != a["title"] or d["transcript"] != a["transcript"]:
        errs.append(f"D {a['id']}: bundle differs from data.json")
    mp3 = ART / a["id"] / "audio.mp3"
    if not mp3.is_file(): errs.append(f"C {a['id']}: no audio.mp3")
    else:
        b = mp3.read_bytes()[:3]
        if mp3.stat().st_size < 100_000 or not (b == b"ID3" or (b[0] == 0xFF and b[1] & 0xE0 == 0xE0)):
            errs.append(f"C {a['id']}: audio.mp3 not a plausible MP3 ({mp3.stat().st_size} bytes)")
    t = a["transcript"]
    if re.search(r"<[a-zA-Z/][^>]*>|&[a-z]+;|&#\d+;", t): errs.append(f"E {a['id']}: HTML left in transcript")
    for v in a["vocabulary"]:
        if not v.get("explanation_en", "").strip(): errs.append(f"F {a['id']}: '{v['word']}' has no English")
        if v["word"].lower() not in t.lower(): errs.append(f"G {a['id']}: '{v['word']}' not in transcript")
dates = [a["date"] for a in A]
if any(not re.fullmatch(r"\d{4}-\d{2}-\d{2}", x) for x in dates): errs.append("H non-ISO date")
if dates != sorted(dates, reverse=True): errs.append("H not sorted newest first")
if not J["module"]["description_en"].startswith(f"{len(A)} "): errs.append("I description count wrong")
print(f"{len(A)} articles, {sum(len(a['vocabulary']) for a in A)} vocab entries")
for e in errs: print("FAIL", e)
print("ALL CHECKS PASS" if not errs else f"{len(errs)} failures"); sys.exit(1 if errs else 0)
