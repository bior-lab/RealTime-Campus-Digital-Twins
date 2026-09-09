"""Update the four-value EMC/NEMS record used by the static dashboard.

The script writes only after a complete, valid response is received. Any network
or schema error exits non-zero and leaves the existing JSON file untouched.
"""

from __future__ import annotations

import json
import math
import re
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "market-snapshot.json"
SOURCE_PAGE = "https://www.nems.emcsg.com/en/"
ENDPOINTS = (
    "https://www.nems.emcsg.com/api/DataSync/Get",
    "https://www.nems.emcsg.com/api/sitecore/DataSync/Get",
)
METRICS = (
    ("usep", "USEP", "S$/MWh", 2),
    ("demand", "Demand", "MW", 0),
    ("solar", "Solar", "MW", 0),
    ("vcp", "VCP", "S$/MWh", 2),
)


def numeric(value: Any) -> float:
    cleaned = re.sub(r"[^0-9.+-]", "", str(value))
    number = float(cleaned)
    if not math.isfinite(number):
        raise ValueError("market value is not finite")
    return number


def extract_snapshot(payload: dict[str, Any], retrieved_at: str | None = None) -> dict[str, Any]:
    records = payload.get("data", {}).get("data", [])
    if not payload.get("success") or not isinstance(records, list) or not records:
        raise ValueError("NEMS returned an empty or unsuccessful response")

    record = records[0]
    current = record.get("current")
    if not isinstance(current, list) or len(current) < len(METRICS):
        raise ValueError("NEMS response does not contain four current market values")

    values_by_label = {
        str(item.get("label", "")).strip().lower(): item
        for item in current
        if isinstance(item, dict) and item.get("label")
    }
    metrics = []
    for index, (key, label, unit, decimals) in enumerate(METRICS):
        item = values_by_label.get(label.lower(), current[index])
        if not isinstance(item, dict) or "value" not in item:
            raise ValueError(f"NEMS response is missing {label}")
        value = numeric(item["value"])
        metrics.append({
            "key": key,
            "label": label,
            "value": round(value, decimals),
            "decimals": decimals,
            "unit": unit,
        })

    published = str(record.get("lastupdate") or record.get("lastUpdate") or "").strip()
    if not published:
        raise ValueError("NEMS response does not contain an update time")

    return {
        "published": published,
        "retrievedAt": retrieved_at or datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "EMC / NEMS",
        "sourceUrl": SOURCE_PAGE,
        "metrics": metrics,
    }


def fetch_payload() -> dict[str, Any]:
    cookie_jar = __import__("http.cookiejar", fromlist=["CookieJar"]).CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    common_headers = {
        "Accept": "application/json, text/plain, */*",
        "Referer": SOURCE_PAGE,
        "User-Agent": "Mozilla/5.0 (compatible; NUS-Campus-Digital-Twin/1.0)",
    }

    opener.open(urllib.request.Request(SOURCE_PAGE, headers=common_headers), timeout=30).read(1)
    errors = []
    params = urllib.parse.urlencode({"value": "10", "fromDate": "", "toDate": ""})
    for endpoint in ENDPOINTS:
        try:
            request = urllib.request.Request(f"{endpoint}?{params}", headers=common_headers)
            with opener.open(request, timeout=30) as response:
                payload = json.load(response)
            if not isinstance(payload, dict):
                raise ValueError("NEMS response is not a JSON object")
            return payload
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            errors.append(f"{endpoint}: {error}")
    raise RuntimeError("; ".join(errors))


def write_snapshot(snapshot: dict[str, Any], output: Path = OUTPUT) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=output.parent, delete=False, newline="\n"
    ) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    temporary.replace(output)


def main() -> int:
    try:
        snapshot = extract_snapshot(fetch_payload())
        write_snapshot(snapshot)
    except Exception as error:  # The workflow must preserve the previous deployed record.
        print(f"Market record update failed: {error}", file=sys.stderr)
        return 1
    print(f"Updated {OUTPUT} ({snapshot['published']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
