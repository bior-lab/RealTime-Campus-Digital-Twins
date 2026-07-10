#!/usr/bin/env python3
"""NUS PI Web API point discovery helper.

The original local helper used hard-coded PI credentials. This version keeps the
same core workflow but reads connection settings from environment variables so it
can be committed safely.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
import urllib3
from requests.auth import HTTPBasicAuth


ROOT = Path(__file__).resolve().parent
DEFAULT_PATTERNS = ROOT / "point_patterns.json"


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class PIWebApiConfig:
    base_url: str
    data_server_webid: str
    username: str
    password: str
    verify_ssl: bool = False

    @classmethod
    def from_env(cls) -> "PIWebApiConfig":
        required = {
            "NUS_PI_WEB_API_BASE_URL": os.getenv("NUS_PI_WEB_API_BASE_URL"),
            "NUS_PI_DATA_SERVER_WEBID": os.getenv("NUS_PI_DATA_SERVER_WEBID"),
            "NUS_PI_USERNAME": os.getenv("NUS_PI_USERNAME"),
            "NUS_PI_PASSWORD": os.getenv("NUS_PI_PASSWORD"),
        }
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        return cls(
            base_url=required["NUS_PI_WEB_API_BASE_URL"].rstrip("/"),
            data_server_webid=required["NUS_PI_DATA_SERVER_WEBID"],
            username=required["NUS_PI_USERNAME"],
            password=required["NUS_PI_PASSWORD"],
            verify_ssl=env_bool("NUS_PI_VERIFY_SSL", False),
        )


class PIWebApiClient:
    def __init__(self, config: PIWebApiConfig):
        self.config = config
        self.auth = HTTPBasicAuth(config.username, config.password)
        if not config.verify_ssl:
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            warnings.filterwarnings("ignore", message="Unverified HTTPS request")

    def get_json(self, path: str, params: dict[str, object] | None = None, timeout: int = 60) -> dict:
        url = f"{self.config.base_url}/{path.lstrip('/')}"
        response = requests.get(
            url,
            auth=self.auth,
            params=params,
            verify=self.config.verify_ssl,
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()

    def test(self) -> None:
        self.get_json("", timeout=20)

    def find_points(self, name_filter: str, max_count: int = 500) -> list[dict[str, str]]:
        payload = self.get_json(
            f"dataservers/{self.config.data_server_webid}/points",
            params={
                "nameFilter": name_filter,
                "maxCount": max_count,
                "selectedFields": "Items.Name;Items.WebId",
            },
        )
        rows = []
        for item in payload.get("Items", []):
            name = item.get("Name")
            webid = item.get("WebId")
            if name and webid:
                rows.append({"name": str(name), "webid": str(webid), "name_filter": name_filter})
        return rows

    def interpolated(
        self,
        webid: str,
        *,
        start: str,
        end: str,
        interval_min: int,
        timeout: int = 120,
    ) -> list[dict[str, object]]:
        payload = self.get_json(
            f"streams/{webid}/interpolated",
            params={
                "startTime": start,
                "endTime": end,
                "interval": f"{interval_min}m",
                "maxCount": 100000,
                "selectedFields": "Items.Timestamp;Items.Value",
            },
            timeout=timeout,
        )
        return [
            {"timestamp": item.get("Timestamp"), "value": item.get("Value")}
            for item in payload.get("Items", [])
        ]


def load_patterns(path: Path = DEFAULT_PATTERNS) -> dict[str, list[str]]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def unique_rows(rows: Iterable[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    output = []
    for row in rows:
        key = row["name"]
        if key in seen:
            continue
        seen.add(key)
        output.append(row)
    return sorted(output, key=lambda item: item["name"])


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def read_points(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        rows = [row for row in reader if row.get("webid")]
    if not rows:
        raise RuntimeError(f"No rows with a webid column found in {path}")
    return rows


def search_command(args: argparse.Namespace) -> int:
    client = PIWebApiClient(PIWebApiConfig.from_env())
    if args.test:
        client.test()

    filters: list[str] = []
    if args.name_filter:
        filters.append(args.name_filter)
    elif args.building and args.intent:
        patterns = load_patterns()
        if args.intent not in patterns:
            raise RuntimeError(f"Unknown intent '{args.intent}'. Available: {', '.join(sorted(patterns))}")
        filters.extend(pattern.format(building=args.building) for pattern in patterns[args.intent])
    elif args.building:
        filters.append(f"*{args.building}*")
    else:
        filters.append("*")

    rows: list[dict[str, str]] = []
    for name_filter in filters:
        rows.extend(client.find_points(name_filter, max_count=args.max_count))
    rows = unique_rows(rows)

    if args.output:
        write_csv(Path(args.output), rows, ["name", "webid", "name_filter"])
    else:
        writer = csv.DictWriter(sys.stdout, fieldnames=["name", "webid", "name_filter"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} point(s) found.", file=sys.stderr)
    return 0


def history_command(args: argparse.Namespace) -> int:
    client = PIWebApiClient(PIWebApiConfig.from_env())
    point_rows = read_points(Path(args.points_file))
    if args.limit:
        point_rows = point_rows[: args.limit]

    output_rows: list[dict[str, object]] = []
    for row in point_rows:
        samples = client.interpolated(
            row["webid"],
            start=args.start,
            end=args.end,
            interval_min=args.interval_min,
        )
        for sample in samples:
            output_rows.append({
                "point": row.get("name", ""),
                "timestamp": sample["timestamp"],
                "value": sample["value"],
            })

    write_csv(Path(args.output), output_rows, ["point", "timestamp", "value"])
    print(f"{len(output_rows)} sample row(s) written to {args.output}", file=sys.stderr)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Search and pull NUS PI Web API points.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    search = subparsers.add_parser("search", help="Search PI points by building, intent, or name filter.")
    search.add_argument("--building", help="Building code, for example SDE4.")
    search.add_argument("--intent", help="Point intent from point_patterns.json, for example water.")
    search.add_argument("--name-filter", help="Raw PI nameFilter wildcard, for example '*SDE4*Water*'.")
    search.add_argument("--max-count", type=int, default=500)
    search.add_argument("--output", help="CSV output path. Defaults to stdout.")
    search.add_argument("--test", action="store_true", help="Test PI Web API login before searching.")
    search.set_defaults(func=search_command)

    history = subparsers.add_parser("history", help="Pull interpolated samples for a searched point CSV.")
    history.add_argument("--points-file", required=True, help="CSV created by the search command.")
    history.add_argument("--start", required=True, help="PI start time, for example '*-24h'.")
    history.add_argument("--end", required=True, help="PI end time, for example '*'.")
    history.add_argument("--interval-min", type=int, default=60)
    history.add_argument("--limit", type=int, help="Limit number of point rows for a test pull.")
    history.add_argument("--output", required=True, help="CSV output path.")
    history.set_defaults(func=history_command)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
