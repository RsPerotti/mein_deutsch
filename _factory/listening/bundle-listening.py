#!/usr/bin/env python3
"""
bundle-listening.py — rebuilds js/listening-data.js (window.LISTENING_DATA)
from content/listening/articles/*/data.json.

Until 2026-10-22 the bundle was built ad hoc (Session ~10). This makes it
reproducible. An article is bundled only if it has a non-empty transcript AND
an audio.mp3 on disk — the player always loads articles/<id>/audio.mp3, so a
bundled article without audio would be a broken card.

Also refreshes content/listening/index.json (status + date per article).

Run:  python3 _factory/listening/bundle-listening.py [--check]
  --check  build in memory and report whether js/listening-data.js would change
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "content" / "listening" / "articles"
INDEX = ROOT / "content" / "listening" / "index.json"
OUT = ROOT / "js" / "listening-data.js"

def load_existing_module():
    s = OUT.read_text()
    j = json.loads(s[s.index("{"): s.rstrip().rstrip(";").rindex("}") + 1])
    return j["module"]

def build():
    arts, index = [], []
    for d in sorted(ART.iterdir()):
        f = d / "data.json"
        if not f.is_file():
            continue
        a = json.loads(f.read_text())
        mp3 = d / "audio.mp3"
        has_audio = mp3.is_file() and mp3.stat().st_size > 0
        has_text = bool(a.get("transcript"))
        status = "complete" if has_audio and has_text else "partial" if has_audio or has_text else "failed"
        index.append({"id": a["id"], "title": a["title"].strip(), "url": a["url"],
                      "date": a.get("date", ""), "status": status})
        if status == "complete":
            arts.append({"id": a["id"], "title": a["title"].strip(), "date": a.get("date", ""),
                         "transcript": a["transcript"],
                         "vocabulary": [{"word": v["word"], "explanation_en": v.get("explanation_en", "")}
                                        for v in a.get("vocabulary", [])]})
    arts.sort(key=lambda a: a["date"], reverse=True)
    index.sort(key=lambda a: a["date"])
    module = load_existing_module()
    module["description_en"] = (f"{len(arts)} real Deutsche Welle articles — read transcripts "
                                "with highlighted vocabulary and listen to native audio.")
    body = json.dumps({"module": module, "articles": arts}, ensure_ascii=False, indent=2)
    return "window.LISTENING_DATA = " + body + ";\n", index, arts

def main():
    js, index, arts = build()
    cur = OUT.read_text()
    if "--check" in sys.argv:
        print("unchanged" if js == cur else "WOULD CHANGE", f"({len(arts)} articles)")
        return
    OUT.write_text(js)
    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2))
    inc = sum(1 for e in index if e["status"] != "complete")
    print(f"Bundled {len(arts)} articles into js/listening-data.js; {inc} not complete (skipped).")

if __name__ == "__main__":
    main()
