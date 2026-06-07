#!/usr/bin/env python3
"""
Quick probe: loads one article's Manuskript and Extras pages and saves the raw HTML.
Run this, then share the output with Claude to fix the selectors in crawler.py.

Usage:
  python3 probe_article.py
"""
import time
from pathlib import Path

ARTICLE_URL = "https://learngerman.dw.com/de/l-75360834"
OUT_DIR = Path(__file__).parent / "content" / "debug"
OUT_DIR.mkdir(parents=True, exist_ok=True)

def find_chromium():
    candidates = [
        Path.home() / ".cache/ms-playwright/chromium-1223/chrome-linux/chrome",
        Path.home() / ".cache/ms-playwright/chromium_headless_shell-1223/chrome-linux/headless_shell",
        Path("/usr/bin/chromium-browser"),
        Path("/usr/bin/chromium"),
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    return None

from playwright.sync_api import sync_playwright

with sync_playwright() as pw:
    exe = find_chromium()
    kwargs = dict(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    if exe:
        kwargs["executable_path"] = exe
    browser = pw.chromium.launch(**kwargs)
    page = browser.new_page()

    # ── Article main page (follows redirect to full slug URL) ──────────────
    print(f"Loading: {ARTICLE_URL}")
    page.goto(ARTICLE_URL, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    real_url = page.url  # capture post-redirect URL (has the slug)
    print(f"  Redirected to: {real_url}")
    (OUT_DIR / "probe-main.html").write_text(page.content())
    print(f"  Saved probe-main.html  ({len(page.content())} chars)")

    # ── Manuskript: /lm suffix on the real URL ─────────────────────────────
    man_url = real_url.rstrip("/") + "/lm"
    print(f"Loading: {man_url}")
    page.goto(man_url, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    (OUT_DIR / "probe-manuskript.html").write_text(page.content())
    print(f"  Saved probe-manuskript.html  ({len(page.content())} chars)")

    # ── Extras: /le suffix on the real URL ────────────────────────────────
    ext_url = real_url.rstrip("/") + "/le"
    print(f"Loading: {ext_url}")
    page.goto(ext_url, wait_until="networkidle", timeout=30000)
    time.sleep(2)
    (OUT_DIR / "probe-extras.html").write_text(page.content())
    print(f"  Saved probe-extras.html  ({len(page.content())} chars)")

    browser.close()

print(f"\nDone. Files saved to: content/debug/")
print("Share these files with Claude to fix the selectors.")
