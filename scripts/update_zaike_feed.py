#!/usr/bin/env python3
"""Update zaike-feed/data/feed.json from weather forecast data.

This script keeps zaike feed as a small weather antenna:
- read zaike-feed/feeds.json
- fetch enabled weather locations from Open-Meteo
- write zaike-feed/data/feed.json

Bad, dead, or slow sources should not break the workflow. They are reported as
"保留" items so the location settings can be tuned later.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "zaike-feed" / "feeds.json"
OUTPUT_PATH = ROOT / "zaike-feed" / "data" / "feed.json"

JST = timezone(timedelta(hours=9))
WEATHER_TIMEOUT_SECONDS = 10
FORECAST_DAYS = 3

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


def fetch_json(url: str, timeout: int) -> Any:
    request = Request(
        url,
        headers={
            "User-Agent": "zaike-feed/0.3 (+https://github.com/taecoshida/okitegami)",
            "Accept": "application/json, */*",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read(2_000_000).decode("utf-8"))


def weather_label(max_temp: Any, precipitation_sum: Any) -> str:
    try:
        if precipitation_sum is not None and float(precipitation_sum) >= 5:
            return "保留"
        if max_temp is not None and float(max_temp) >= 32:
            return "保留"
    except (TypeError, ValueError):
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


def list_value(values: Any, index: int, default: Any = None) -> Any:
    if not isinstance(values, list):
        return default
    if index < 0 or index >= len(values):
        return default
    return values[index]


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
        "forecast_days": FORECAST_DAYS,
    }
    return "https://api.open-meteo.com/v1/forecast?" + urlencode(params)


def error_item(location_name: str, url: str, message: str) -> dict[str, Any]:
    title = f"{location_name} の天気取得を確認する"
    return {
        "id": item_hash("weather-error", title, url),
        "title": title,
        "source": "weather",
        "url": url,
        "published": now_iso(),
        "class": "保留",
        "memo": "天気の取得に失敗、または設定が不足しています。緯度・経度・接続状態を確認します。",
        "summary": str(message)[:220],
        "tags": ["weather", "hold"],
    }


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
            if not isinstance(dates, list) or not dates:
                items.append(error_item(name, url, "daily.time が空です。"))
                continue

            for index, date in enumerate(dates[:FORECAST_DAYS]):
                code = list_value(daily.get("weather_code"), index)
                max_temp = list_value(daily.get("temperature_2m_max"), index)
                min_temp = list_value(daily.get("temperature_2m_min"), index)
                precipitation = list_value(daily.get("precipitation_sum"), index)
                probability = list_value(daily.get("precipitation_probability_max"), index)

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
                    "published": str(date),
                    "class": label,
                    "memo": "生活シーケンス用の外界条件。外出・洗濯・買い物・作業場所の判断に使う。",
                    "summary": summary,
                    "tags": ["weather", weather_text, label],
                })

            print(f"weather ok: {name}: {min(len(dates), FORECAST_DAYS)} days", flush=True)
        except (TimeoutError, HTTPError, URLError) as exc:
            items.append(error_item(name, url, repr(exc)))
            print(f"weather error: {name}: {exc!r}", flush=True)
        except Exception as exc:
            items.append(error_item(name, url, repr(exc)))
            print(f"weather error: {name}: {exc!r}", flush=True)

    return items


def deduplicate_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    unique_items = []
    for item in items:
        if item["id"] in seen:
            continue
        seen.add(item["id"])
        unique_items.append(item)
    return unique_items


def main() -> None:
    config = load_json(CONFIG_PATH, {"weather": {}})
    existing = load_json(OUTPUT_PATH, {"items": []})
    fetched_items = deduplicate_items(extract_weather_items(config))

    items = fetched_items if fetched_items else existing.get("items", [])

    output = {
        "generated_at": now_iso(),
        "items": items,
    }
    save_json(OUTPUT_PATH, output)
    print(f"updated {OUTPUT_PATH.relative_to(ROOT)} with {len(items)} items", flush=True)


if __name__ == "__main__":
    main()
