#!/usr/bin/env python3
"""Update zaike-feed/data/feed.json from weather and RSS sources.

This script is intentionally small and defensive:
- read zaike-feed/feeds.json
- fetch enabled weather locations from Open-Meteo
- fetch enabled RSS/Atom feeds with short timeouts
- classify RSS entries by keywords
- write zaike-feed/data/feed.json

Bad, dead, or slow sources should not break or stall the whole workflow. They are
reported as "保留" items so the source list can be tuned later.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

import feedparser

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "zaike-feed" / "feeds.json"
OUTPUT_PATH = ROOT / "zaike-feed" / "data" / "feed.json"

JST = timezone(timedelta(hours=9))
FEED_TIMEOUT_SECONDS = 10
WEATHER_TIMEOUT_SECONDS = 10
MAX_ITEMS_PER_FEED = 12

WEATHER_CODES = {
    0: "快晴",
    1: "晴れ",
    2: "一部曇り",
    3: "曇り",
    45: "霧",
    48: "霧氷",
    51: "弱い霧雨",
    53: "霧雨",
    55: "強い霧雨",
    56: "弱い着氷性霧雨",
    57: "強い着氷性霧雨",
    61: "弱い雨",
    63: "雨",
    65: "強い雨",
    66: "弱い着氷性雨",
    67: "強い着氷性雨",
    71: "弱い雪",
    73: "雪",
    75: "強い雪",
    77: "雪粒",
    80: "弱いにわか雨",
    81: "にわか雨",
    82: "強いにわか雨",
    85: "弱いにわか雪",
    86: "強いにわか雪",
    95: "雷雨",
    96: "雷雨と弱い雹",
    99: "雷雨と強い雹",
}


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


def clean_text(value: Any, limit: int = 280) -> str:
    if value is None:
        text = ""
    else:
        text = str(value)

    text = re.sub(r"<[^>]+>", " ", text)
    text = " ".join(text.split())

    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def score(text: str, keywords: list[str]) -> int:
    lowered = text.lower()
    return sum(1 for keyword in keywords if str(keyword).lower() in lowered)


def classify(text: str, read_keywords: list[str], hold_keywords: list[str]) -> str:
    if score(text, read_keywords) > 0:
        return "読む"
    if score(text, hold_keywords) > 0:
        return "保留"
    return "読まない"


def published_value(entry: Any) -> str:
    value = (
        getattr(entry, "published", None)
        or getattr(entry, "updated", None)
        or getattr(entry, "created", None)
        or ""
    )
    return clean_text(value, 80)


def normalize_feed_url(url: str) -> str:
    """Quote spaces and Japanese characters while keeping URL delimiters."""
    return quote(url, safe=":/?&=%#;,+@!$'()*[]")


def fetch_bytes(url: str, timeout: int, accept: str) -> bytes:
    request = Request(
        url,
        headers={
            "User-Agent": "zaike-feed/0.2 (+https://github.com/taecoshida/okitegami)",
            "Accept": accept,
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return response.read(2_000_000)


def fetch_feed_bytes(url: str) -> bytes:
    return fetch_bytes(
        url,
        FEED_TIMEOUT_SECONDS,
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    )


def fetch_json(url: str, timeout: int) -> Any:
    content = fetch_bytes(url, timeout, "application/json, */*")
    return json.loads(content.decode("utf-8"))


def weather_label(max_temp: float | int | None, precipitation_sum: float | int | None) -> str:
    if precipitation_sum is not None and float(precipitation_sum) >= 5:
        return "保留"
    if max_temp is not None and float(max_temp) >= 32:
        return "保留"
    return "読む"


def weather_code_label(code: Any) -> str:
    try:
        return WEATHER_CODES.get(int(code), f"天気コード{code}")
    except (TypeError, ValueError):
        return "天気不明"


def format_weather_number(value: Any, unit: str) -> str:
    if value is None:
        return "不明"
    try:
        number = float(value)
        if number.is_integer():
            return f"{int(number)}{unit}"
        return f"{number:.1f}{unit}"
    except (TypeError, ValueError):
        return f"{value}{unit}"


def build_weather_url(location: dict[str, Any]) -> str:
    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "precipitation_probability_max",
        ]),
        "timezone": location.get("timezone", "Asia/Tokyo"),
        "forecast_days": 3,
    }
    return "https://api.open-meteo.com/v1/forecast?" + urlencode(params)


def extract_weather_items(config: dict[str, Any]) -> list[dict[str, Any]]:
    weather = config.get("weather", {})
    if not weather.get("enabled", False):
        return []

    items: list[dict[str, Any]] = []

    for location in weather.get("locations", []):
        if not location.get("enabled", False):
            continue

        name = str(location.get("name") or "local weather")
        if "latitude" not in location or "longitude" not in location:
            items.append(error_item(name, "weather", "latitude / longitude が未設定です。"))
            continue

        url = build_weather_url(location)

        try:
            print(f"fetching weather: {name}", flush=True)
            data = fetch_json(url, WEATHER_TIMEOUT_SECONDS)
            daily = data.get("daily", {})
            dates = daily.get("time", [])

            for index, date in enumerate(dates[:3]):
                code = daily.get("weather_code", [None] * len(dates))[index]
                max_temp = daily.get("temperature_2m_max", [None] * len(dates))[index]
                min_temp = daily.get("temperature_2m_min", [None] * len(dates))[index]
                precipitation = daily.get("precipitation_sum", [None] * len(dates))[index]
                probability = daily.get("precipitation_probability_max", [None] * len(dates))[index]

                weather_text = weather_code_label(code)
                title = f"{name}: {date} の天気 — {weather_text}"
                summary = (
                    f"最高{format_weather_number(max_temp, '℃')} / "
                    f"最低{format_weather_number(min_temp, '℃')}。"
                    f"降水量{format_weather_number(precipitation, 'mm')}、"
                    f"降水確率最大{format_weather_number(probability, '%')}。"
                )
                label = weather_label(max_temp, precipitation)

                items.append({
                    "id": item_hash("weather", title, url),
                    "title": title,
                    "source": "weather",
                    "url": url,
                    "published": date,
                    "class": label,
                    "memo": "生活シーケンス用の外界条件。外出・洗濯・買い物・作業場所の判断に使う。",
                    "summary": summary,
                    "tags": ["weather", weather_text, label],
                })

            print(f"weather ok: {name}: {min(len(dates), 3)} days", flush=True)
        except (TimeoutError, HTTPError, URLError) as exc:
            items.append(error_item(name, url, repr(exc)))
            print(f"weather error: {name}: {exc!r}", flush=True)
        except Exception as exc:
            items.append(error_item(name, url, repr(exc)))
            print(f"weather error: {name}: {exc!r}", flush=True)

    return items


def extract_entry(feed_name: str, entry: Any, read_keywords: list[str], hold_keywords: list[str]) -> dict[str, Any]:
    title = clean_text(getattr(entry, "title", "untitled"), 180) or "untitled"
    url = clean_text(getattr(entry, "link", ""), 500) or "#"
    summary = clean_text(getattr(entry, "summary", ""), 220)
    text = f"{title}\n{summary}"
    label = classify(text, read_keywords, hold_keywords)

    tags = []
    for keyword in read_keywords + hold_keywords:
        keyword = str(keyword)
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


def error_item(feed_name: str, url: str, message: str) -> dict[str, Any]:
    title = f"{feed_name} の取得を確認する"
    return {
        "id": item_hash(feed_name, title, url),
        "title": title,
        "source": "zaike feed",
        "url": url,
        "published": now_iso(),
        "class": "保留",
        "memo": "取得に失敗、0件、またはタイムアウトしました。URLや設定の確認が必要です。",
        "summary": clean_text(message, 220),
        "tags": ["feed-check", "hold"],
    }


def fetch_feed_items(config: dict[str, Any]) -> list[dict[str, Any]]:
    keywords = config.get("keywords", {})
    read_keywords = keywords.get("read", [])
    hold_keywords = keywords.get("hold", [])

    items: list[dict[str, Any]] = []

    for feed in config.get("feeds", []):
        if not feed.get("enabled", False):
            continue

        name = str(feed.get("name") or feed.get("url") or "unknown")
        url = feed.get("url")
        if not url:
            continue

        normalized_url = normalize_feed_url(str(url))

        try:
            print(f"fetching feed: {name}", flush=True)
            content = fetch_feed_bytes(normalized_url)
            parsed = feedparser.parse(content)
            entries = list(getattr(parsed, "entries", []))

            if not entries:
                bozo_message = clean_text(getattr(parsed, "bozo_exception", "no entries"), 220)
                items.append(error_item(name, normalized_url, bozo_message or "no entries"))
                print(f"feed warning: {name}: no entries", flush=True)
                continue

            for entry in entries[:MAX_ITEMS_PER_FEED]:
                items.append(extract_entry(name, entry, read_keywords, hold_keywords))

            print(f"feed ok: {name}: {min(len(entries), MAX_ITEMS_PER_FEED)} items", flush=True)
        except (TimeoutError, HTTPError, URLError) as exc:
            items.append(error_item(name, normalized_url, repr(exc)))
            print(f"feed error: {name}: {exc!r}", flush=True)
        except Exception as exc:  # Keep one bad feed from breaking the shelf.
            items.append(error_item(name, normalized_url, repr(exc)))
            print(f"feed error: {name}: {exc!r}", flush=True)

    return items


def fetch_items(config: dict[str, Any]) -> list[dict[str, Any]]:
    items = []
    items.extend(extract_weather_items(config))
    items.extend(fetch_feed_items(config))

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
    print(f"updated {OUTPUT_PATH.relative_to(ROOT)} with {len(items)} items", flush=True)


if __name__ == "__main__":
    main()
