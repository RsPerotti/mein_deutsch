#!/usr/bin/env python3
"""
DW Top-Thema Crawler
Crawls Deutsche Welle's "Top-Thema mit Vokabeln" archive, extracts transcripts,
vocabulary (with Claude-translated English explanations), and MP3 audio files.

Everything is extracted from the main article page — no sub-page navigation needed.
The page embeds all content in a window.__APOLLO_STATE__ JSON blob.

Usage:
  python3 crawler.py                         # crawl all new articles
  python3 crawler.py --recrawl l-75360834   # force re-crawl one article
  python3 crawler.py --dry-run              # list what would be crawled

Requirements:
  pip3 install playwright anthropic
  python3 -m playwright install chromium
  export ANTHROPIC_API_KEY="sk-ant-..."
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, unquote

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
CONTENT_DIR  = SCRIPT_DIR / "content" / "listening"
ARTICLES_DIR = CONTENT_DIR / "articles"
INDEX_FILE   = CONTENT_DIR / "index.json"

# ── Source ────────────────────────────────────────────────────────────────────
ARCHIVE_URL = "https://learngerman.dw.com/de/top-thema-mit-vokabeln-archiv-2026/a-75204525"
BASE_URL    = "https://learngerman.dw.com"

# ── Chromium ──────────────────────────────────────────────────────────────────
CHROMIUM_CANDIDATES = [
    Path.home() / ".cache/ms-playwright/chromium-1223/chrome-linux/chrome",
    Path.home() / ".cache/ms-playwright/chromium_headless_shell-1223/chrome-linux/headless_shell",
    Path("/usr/bin/chromium-browser"),
    Path("/usr/bin/chromium"),
    Path("/usr/bin/google-chrome"),
]

def find_chromium():
    for p in CHROMIUM_CANDIDATES:
        if p.exists():
            return str(p)
    return None

def make_page(playwright):
    exe = find_chromium()
    kwargs = dict(
        headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    )
    if exe:
        kwargs["executable_path"] = exe
    browser = playwright.chromium.launch(**kwargs)
    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Linux; Android 11; Pixel 5) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Mobile Safari/537.36"
        )
    )
    return browser, context.new_page()


# ── Slug ──────────────────────────────────────────────────────────────────────
LANG_CODES = {"de", "en", "es", "ar", "pt", "ru", "zh"}

def url_to_slug(url):
    path_only = urlparse(url).path          # /de/ein-kleines.../l-75360834
    segments  = [s for s in path_only.split("/") if s]
    human = [s for s in segments if s not in LANG_CODES and not s.startswith(("l-", "a-"))]
    if human:
        slug = unquote(human[-1])
    else:
        ids  = [s for s in segments if s.startswith(("l-", "a-"))]
        slug = ids[-1] if ids else re.sub(r"[^a-z0-9-]", "-", url.lower())
    slug = re.sub(r"[^a-z0-9-]", "-", slug.lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:120]


# ── Index ─────────────────────────────────────────────────────────────────────
def load_index():
    if INDEX_FILE.exists():
        return json.loads(INDEX_FILE.read_text())
    return []

def save_index(index):
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    INDEX_FILE.write_text(json.dumps(index, ensure_ascii=False, indent=2))

def find_in_index(index, slug):
    for e in index:
        if e.get("id") == slug:
            return e
    return None

def upsert_index(index, entry):
    for i, e in enumerate(index):
        if e.get("id") == entry["id"]:
            index[i] = entry
            return
    index.append(entry)


# ── Apollo state extraction ───────────────────────────────────────────────────
def extract_apollo_state(html):
    """
    Parse the window.__APOLLO_STATE__ JSON blob from the page HTML.
    DW embeds all article data (transcript, vocab, metadata) in this blob —
    no sub-page navigation required.
    """
    marker = "window.__APOLLO_STATE__="
    idx = html.find(marker)
    if idx < 0:
        return {}
    chunk = html[idx + len(marker):]

    # Walk the string to find the balanced closing brace
    depth, in_str, esc = 0, False, False
    end = 0
    for i, ch in enumerate(chunk):
        if esc:
            esc = False
            continue
        if ch == "\\" and in_str:
            esc = True
            continue
        if ch == '"' and not esc:
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    try:
        return json.loads(chunk[:end + 1])
    except Exception:
        return {}


def parse_article_from_state(state):
    """
    Find the Lesson entry in the Apollo state and extract:
      title, date, manuscript HTML, vocab list, MP3 URLs
    """
    for key, val in state.items():
        if not isinstance(val, dict):
            continue
        if val.get("__typename") != "Lesson":
            continue
        if not val.get("manuscript"):
            continue

        title   = val.get("name", "")
        date_raw = val.get("lastPublicationDate", "")
        date    = date_raw[:10] if date_raw else ""        # YYYY-MM-DD
        man_html = val.get("manuscript", "")

        # Plain-text transcript (strip HTML tags, normalise whitespace)
        transcript = re.sub(r"<br\s*/?>", "\n", man_html, flags=re.IGNORECASE)
        transcript = re.sub(r"<[^>]+>", "", transcript)
        transcript = re.sub(r"&ndash;", "–", transcript)
        transcript = re.sub(r"&[a-z]+;", " ", transcript)
        transcript = re.sub(r"\n{3,}", "\n\n", transcript).strip()

        # Vocab: <span class="editable placeholder" data-title="DEF" data-type="GLOSSARY">WORD</span>
        # Actual attribute order: data-title appears before data-type.
        # Strategy: find every span that contains data-type="GLOSSARY", then
        # extract data-title and inner text from the full span tag.
        raw_vocab = []
        for span_match in re.finditer(r'<span([^>]*data-type="GLOSSARY"[^>]*)>([^<]+)</span>', man_html):
            attrs, word = span_match.group(1), span_match.group(2)
            title_m = re.search(r'data-title="([^"]+)"', attrs)
            if title_m:
                raw_vocab.append((title_m.group(1), word))

        # Deduplicate: one entry per (word, definition) pair
        seen = set()
        vocab = []
        for definition, word in raw_vocab:
            word       = word.strip()
            definition = definition.strip()
            key_pair   = (word.lower(), definition.lower())
            if key_pair not in seen and word and definition:
                seen.add(key_pair)
                vocab.append({"word": word, "explanation_de": definition})

        return title, date, transcript, vocab

    return None, None, None, None


def extract_mp3_url(html):
    """Find the MP3 audio URL in the page HTML."""
    # Direct src attributes
    m = re.search(r'src="(https?://[^"]+\.mp3[^"]*)"', html)
    if m:
        return m.group(1)
    # Anywhere in the HTML
    m = re.search(r'(https?://[^\s"\'<>]+\.mp3(?:[^\s"\'<>]*)?)', html)
    if m:
        return m.group(1)
    return None


# ── Archive scraping ──────────────────────────────────────────────────────────
def scrape_archive(page):
    """Return list of {url, title, date} from the archive page."""
    print(f"  Loading archive: {ARCHIVE_URL}")
    page.goto(ARCHIVE_URL, wait_until="networkidle", timeout=30_000)
    time.sleep(2)

    html  = page.content()
    state = extract_apollo_state(html)

    # Find article URLs: /de/l-{id} or /de/{slug}/l-{id}
    links = page.query_selector_all("a[href*='/l-']")
    seen, articles = set(), []

    for el in links:
        href = el.get_attribute("href") or ""
        if not re.search(r"/l-\d+", href):
            continue
        url = href if href.startswith("http") else BASE_URL + href
        # Skip the archive URL itself
        if "archiv" in url:
            continue
        if url in seen:
            continue
        seen.add(url)

        # Title from link text (will be overwritten from Apollo state per-article)
        title = (el.inner_text() or "").strip()
        if not title or len(title) > 200:
            title = ""

        articles.append({"url": url, "title": title, "date": ""})

    print(f"  Found {len(articles)} articles")
    return articles


# ── Per-article processing ────────────────────────────────────────────────────
def process_article(page, art):
    """
    Scrape one article. Returns (success_bool, status_str, slug, title).
    Saves: articles/{slug}/data.json  and  articles/{slug}/audio.mp3
    """
    url  = art["url"]
    slug = url_to_slug(url)
    article_dir = ARTICLES_DIR / slug

    print(f"\n  ── {slug}")
    print(f"     {url}")

    # Navigate (follows redirect from /de/l-{id} to /de/{slug}/l-{id})
    try:
        page.goto(url, wait_until="networkidle", timeout=30_000)
        time.sleep(2)
    except Exception as e:
        print(f"     [error] page load failed: {e}")
        return False, "failed", slug, art.get("title", slug)

    html  = page.content()
    state = extract_apollo_state(html)

    if not state:
        print(f"     [error] Apollo state not found in page")
        return False, "failed", slug, art.get("title", slug)

    title, date, transcript, vocab = parse_article_from_state(state)

    if not title:
        # Fallback: grab from <title> tag
        m = re.search(r"<title>([^<]+)</title>", html)
        title = m.group(1).strip() if m else slug.replace("-", " ").title()

    if not transcript:
        print(f"     [warn] transcript empty")
    else:
        print(f"     Title:      {title}")
        print(f"     Transcript: {len(transcript)} chars")
        print(f"     Vocab:      {len(vocab)} words")

    # MP3
    mp3_url = extract_mp3_url(html)
    if mp3_url:
        print(f"     MP3:        {mp3_url}")
    else:
        print(f"     [warn] no MP3 URL found")

    # Translate vocab
    if vocab:
        print(f"     Translating {len(vocab)} vocab words...")
        vocab = translate_vocab(vocab)

    # Save files
    article_dir.mkdir(parents=True, exist_ok=True)

    audio_filename = ""
    if mp3_url:
        dest = article_dir / "audio.mp3"
        print(f"     Downloading audio...")
        if download_mp3(mp3_url, dest):
            audio_filename = "audio.mp3"
            kb = dest.stat().st_size // 1024
            print(f"     ✓ audio.mp3  ({kb} KB)")
        else:
            print(f"     ✗ MP3 download failed")

    data = {
        "id":          slug,
        "title":       title,
        "url":         url,
        "date":        date or "",
        "crawled_at":  datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "audio_file":  audio_filename,
        "transcript":  transcript or "",
        "vocabulary":  vocab,
    }
    (article_dir / "data.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2)
    )
    print(f"     ✓ data.json saved")

    has_transcript = bool(transcript)
    has_audio      = bool(audio_filename)
    status = "complete" if (has_transcript and has_audio) else \
             "partial"  if (has_transcript or has_audio)  else "failed"
    print(f"     Status: {status}")
    return status == "complete", status, slug, title


# ── MP3 download ──────────────────────────────────────────────────────────────
def download_mp3(url, dest):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(dest, "wb") as f:
            f.write(resp.read())
        return True
    except Exception as e:
        print(f"       download error: {e}")
        return False


# ── Claude translation ────────────────────────────────────────────────────────
def translate_vocab(vocab):
    """
    Translate all German vocab definitions to English in one API call.
    Adds 'explanation_en' to each entry.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("     [warn] ANTHROPIC_API_KEY not set — skipping translation")
        for v in vocab:
            v["explanation_en"] = ""
        return vocab

    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    lines  = "\n".join(
        f'{i+1}. Word: "{v["word"]}" | German entry: {v["explanation_de"]}'
        for i, v in enumerate(vocab)
    )
    prompt = (
        "You are a German-to-English translator for a language learning app.\n"
        "Below is a numbered list of German vocabulary words with their German dictionary entries.\n"
        "For each entry, write a short English translation/explanation (1 sentence max).\n"
        "Respond ONLY with a JSON array in the same order, each object:\n"
        '  {"word": "...", "explanation_en": "..."}\n'
        "No markdown, no extra text — just the JSON array.\n\n"
        f"{lines}"
    )

    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        translated = json.loads(raw)
        for i, v in enumerate(vocab):
            if i < len(translated):
                v["explanation_en"] = translated[i].get("explanation_en", "")
            else:
                v["explanation_en"] = ""
    except Exception as e:
        print(f"     [error] Claude API: {e}")
        for v in vocab:
            v["explanation_en"] = ""

    return vocab


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="DW Top-Thema crawler")
    parser.add_argument("--recrawl", metavar="SLUG",
                        help="Force re-crawl a specific article slug")
    parser.add_argument("--dry-run", action="store_true",
                        help="List articles to crawl without fetching")
    parser.add_argument("--limit", type=int, default=0,
                        help="Only crawl this many articles (for testing)")
    args = parser.parse_args()

    if not args.dry_run and not os.environ.get("ANTHROPIC_API_KEY"):
        print("Warning: ANTHROPIC_API_KEY not set — vocab will not be translated.\n")

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
    index = load_index()

    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        browser, page = make_page(pw)
        try:
            # 1. Archive
            print("\n[1/3] Scraping archive...")
            archive = scrape_archive(page)
            if not archive:
                print("No articles found.")
                return

            # 2. Plan
            to_crawl, to_skip = [], []
            for art in archive:
                slug = url_to_slug(art["url"])
                ex   = find_in_index(index, slug)
                if args.recrawl and slug == args.recrawl:
                    to_crawl.append(art)
                elif args.recrawl:
                    to_skip.append((slug, "not the --recrawl target"))
                elif ex and ex.get("status") == "complete":
                    to_skip.append((slug, "already complete"))
                else:
                    to_crawl.append(art)

            print(f"\n[2/3] Plan: {len(to_crawl)} to crawl, {len(to_skip)} to skip")
            for slug, reason in to_skip:
                print(f"       skip  {slug}  ({reason})")

            if args.dry_run:
                print("\n-- DRY RUN --")
                for art in to_crawl:
                    print(f"  would crawl: {url_to_slug(art['url'])}  ({art['url']})")
                return

            # 3. Crawl
            if args.limit:
                to_crawl = to_crawl[:args.limit]
            print(f"\n[3/3] Crawling {len(to_crawl)} articles...")
            for art in to_crawl:
                slug = url_to_slug(art["url"])
                upsert_index(index, {
                    "id": slug, "title": art.get("title", slug),
                    "url": art["url"], "date": "", "status": "partial",
                })
                save_index(index)

                try:
                    _, status, slug, title = process_article(page, art)
                except Exception as e:
                    print(f"     [error] {e}")
                    status, title = "failed", art.get("title", slug)

                upsert_index(index, {
                    "id": slug, "title": title,
                    "url": art["url"], "date": "", "status": status,
                })
                save_index(index)

        finally:
            browser.close()

    # Summary
    idx = load_index()
    complete = sum(1 for e in idx if e.get("status") == "complete")
    partial  = sum(1 for e in idx if e.get("status") == "partial")
    failed   = sum(1 for e in idx if e.get("status") == "failed")
    print(f"\n── Done ────────────────────────────────")
    print(f"   Complete : {complete}")
    print(f"   Partial  : {partial}")
    print(f"   Failed   : {failed}")
    if failed or partial:
        print(f"\n   Re-run to retry failed/partial articles.")


if __name__ == "__main__":
    main()
