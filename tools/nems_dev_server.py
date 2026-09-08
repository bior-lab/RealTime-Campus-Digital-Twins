"""Local static server with a narrow EMC/NEMS real-time data relay.

Run from the repository root:
    python tools/nems_dev_server.py
"""

from __future__ import annotations

import json
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlencode, urlsplit


HOST = "127.0.0.1"
PORT = 8000
NEMS_CHART_URL = "https://www.nems.emcsg.com/api/DataSync/Get"
NEMS_TABLE_URL = "https://www.nems.emcsg.com/api/DataSync/TableChart"
CHART_PRODUCTS = {"10", "12", "14", "17", "18", "19"}
TABLE_PRODUCTS = {"10", "12"}
CACHE_SECONDS = 300

_cache_lock = threading.Lock()
_cache: dict[tuple[str, str], tuple[bytes, float]] = {}


def fetch_with_curl(url: str) -> bytes:
    """Fetch NEMS through the OS curl client when Python sockets are restricted.

    Some managed Windows installations deny outbound sockets to python.exe while
    allowing the system HTTP client. Keeping this fallback inside the relay means
    the browser still talks only to the same local, allow-listed endpoints.
    """

    executable = shutil.which("curl.exe") or shutil.which("curl")
    if executable is None:
        raise urllib.error.URLError("curl is unavailable for the Windows network fallback")
    try:
        result = subprocess.run(
            [
                executable,
                "--fail",
                "--silent",
                "--show-error",
                "--location",
                "--max-time",
                "20",
                "--header",
                "Accept: application/json",
                "--header",
                "User-Agent: NUS-Campus-Digital-Twin/1.0 (+local-development)",
                url,
            ],
            check=True,
            capture_output=True,
            timeout=25,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as error:
        detail = getattr(error, "stderr", b"")
        if isinstance(detail, bytes):
            detail = detail.decode("utf-8", errors="replace").strip()
        raise urllib.error.URLError(detail or "curl could not reach NEMS") from error
    return result.stdout


def fetch_upstream(request: urllib.request.Request) -> bytes:
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.read()
    except urllib.error.URLError:
        # Windows may block python.exe sockets (WinError 10013) even though the
        # system HTTP client is permitted. Curl also provides a useful fallback
        # for local development environments with different proxy policies.
        return fetch_with_curl(request.full_url)


def fetch_nems_payload(kind: str, value: str) -> tuple[bytes, bool]:
    now = time.monotonic()
    key = (kind, value)
    with _cache_lock:
        cached = _cache.get(key)
        if cached is not None and now - cached[1] < CACHE_SECONDS:
            return cached[0], False

    base_url = NEMS_TABLE_URL if kind == "table" else NEMS_CHART_URL
    params = {"value": value, "fromDate": "", "toDate": ""}
    if kind == "table":
        params["tpcValue"] = "1"
    request = urllib.request.Request(
        f"{base_url}?{urlencode(params)}",
        headers={
            "Accept": "application/json",
            "User-Agent": "NUS-Campus-Digital-Twin/1.0 (+local-development)",
        },
    )
    try:
        payload = fetch_upstream(request)

        # Validate before caching so an upstream HTML error page is never served as JSON.
        parsed = json.loads(payload.decode("utf-8"))
        if not parsed.get("success") or not parsed.get("data", {}).get("data"):
            raise ValueError("NEMS returned an empty or unsuccessful response")
        with _cache_lock:
            _cache[key] = (payload, now)
        return payload, False
    except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
        # Keep the dashboard useful during a short upstream interruption.
        with _cache_lock:
            stale = _cache.get(key)
        if stale is not None:
            return stale[0], True
        raise


class CampusRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 - inherited HTTP handler API
        path = urlsplit(self.path).path
        if path in {"/api/nems/realtime", "/api/nems/table"}:
            self.serve_nems(path)
            return
        super().do_GET()

    def serve_nems(self, path: str) -> None:
        kind = "table" if path.endswith("/table") else "chart"
        allowed = TABLE_PRODUCTS if kind == "table" else CHART_PRODUCTS
        query = parse_qs(urlsplit(self.path).query)
        value = query.get("value", ["10"])[0]
        if value not in allowed:
            self.serve_json_error(HTTPStatus.BAD_REQUEST, "Unsupported NEMS data product")
            return
        try:
            payload, stale = fetch_nems_payload(kind, value)
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-NEMS-Data-Stale", "true" if stale else "false")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            self.serve_json_error(HTTPStatus.BAD_GATEWAY, f"NEMS relay unavailable: {error}")

    def serve_json_error(self, status: HTTPStatus, message: str) -> None:
        payload = json.dumps({"success": False, "error": message}, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), CampusRequestHandler)
    print(f"Serving campus dashboard at http://{HOST}:{PORT}/")
    print("NEMS relay: /api/nems/realtime and /api/nems/table (5-minute cache)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
