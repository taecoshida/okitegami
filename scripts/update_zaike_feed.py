#!/usr/bin/env python3
"""Update zaike-feed/data/feed.json from RSS sources.

This script is intentionally small:
- read zaike-feed/feeds.json
- fetch enabled RSS feeds
- classify entries by keywords
- write zaike-feed/data/feed.json

If no feeds are enabled or no items are fetched, the existing seed item is kept
and a generated_at timestamp is updated.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import feedparser

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "zaike-feed" / "feeds.json"
OUTPUT_PATH = ROOT / "zaike-feed" / "data" / "feed.json"

JST = timezone(timedelta(hours=9))


def now_iso() -> str:
    return datetime.now(JST).isoformat(timespec="seconds")


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")


def item_hash(source: str, title: str, url: str) -> str:
    raw = f"{source}|{title}|{url}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def clean_text(value: str | None, limit: int = 280) -> str:
    text = " ".join((value or "").split())
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def score(text: str, keywords: list[str]) -> int:
    lowered = text.lower()
    return sum(1 for keyword in keywords if keyword.lower() in lowered)


def classify(text: str, read_keywords: list[str], hold_keywords: list[str]) -> str:
    if score(text, read_keywords) > 0:
        return "読む"
    if score(text, hold_keywords) > 0:
        return "保留"
    return "読まない"


def published_value(entry: Any) -> str:
    return (
        getattr(entry, "published", None)
        or getattr(entry, "updated", None)
        or getattr(entry, "created", None)
        or ""
    )


def extract_entry(feed_name: str, entry: Any, read_keywords: list[str], hold_keywords: list[str]) -> dict[str, Any]:
    title = clean_text(getattr(entry, "title", "untitled"), 180)
    url = getattr(entry, "link", "") or "#"
    summary = clean_text(getattr(entry, "summary", ""), 220)
    text = f"{title}\n{summary}"
    label = classify(text, read_keywords, hold_keywords)

    tags = []
    for keyword in read_keywords + hold_keywords:
        if keyword.lower() in text.lower():
            tags.append(keyword)
    tags = list(dict.fromkeys(tags))[:6]

    return {
        "id": item_hash(feed_name, title, url),
        "title": title,
        "source": feed_name,
        "url": url,
        "published": published_value(entry),
        "class": label,
        "memo": "",
        "summary": summary,
        "tags": tags,
    }


def fetch_items(config: dict[str, Any]) -> list[dict[str, Any]]:
    keywords = config.get("keywords", {})
    read_keywords = keywords.get("read", [])
    hold_keywords = keywords.get("hold", [])

    items: list[dict[str, Any]] = []

    for feed in config.get("feeds", []):
        if not feed.get("enabled", False):
            continue

        name = feed.get("name") or feed.get("url") or "unknown"
        url = feed.get("url")
        if not url:
            continue

        parsed = feedparser.parse(url)
        for entry in parsed.entries[:20]:
            items.append(extract_entry(name, entry, read_keywords, hold_keywords))

    # Deduplicate while preserving order.
    seen = set()
    unique_items = []
    for item in items:
        if item["id"] in seen:
            continue
        seen.add(item["id"])
        unique_items.append(item)

    return unique_items


def main() -> None:
    config = load_json(CONFIG_PATH, {"feeds": [], "keywords": {}})
    existing = load_json(OUTPUT_PATH, {"items": []})
    fetched_items = fetch_items(config)

    if fetched_items:
        items = fetched_items
    else:
        items = existing.get("items", [])

    output = {
        "generated_at": now_iso(),
        "items": items,
    }
    save_json(OUTPUT_PATH, output)
    print(f"updated {OUTPUT_PATH.relative_to(ROOT)} with {len(items)} items")


if __name__ == "__main__":
    main()
