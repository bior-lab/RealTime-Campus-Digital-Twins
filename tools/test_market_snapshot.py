import json
import tempfile
import unittest
from pathlib import Path

from update_market_snapshot import extract_snapshot, write_snapshot


class MarketSnapshotTests(unittest.TestCase):
    def test_extracts_four_values_and_timestamp(self):
        payload = {
            "success": True,
            "data": {
                "data": [{
                    "lastupdate": "09 Sep 2026 · 17:31 SGT",
                    "current": [
                        {"value": "$195.35"},
                        {"value": "6,932"},
                        {"value": "1,268"},
                        {"value": "$252.68"},
                    ],
                }]
            },
        }
        result = extract_snapshot(payload, "2026-09-09T09:32:00+00:00")
        self.assertEqual([item["value"] for item in result["metrics"]], [195.35, 6932, 1268, 252.68])
        self.assertEqual(result["published"], "09 Sep 2026 · 17:31 SGT")

    def test_rejects_incomplete_response(self):
        with self.assertRaises(ValueError):
            extract_snapshot({"success": True, "data": {"data": [{"current": []}]}})

    def test_writes_valid_json(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "snapshot.json"
            snapshot = {"published": "test", "metrics": []}
            write_snapshot(snapshot, output)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8")), snapshot)


if __name__ == "__main__":
    unittest.main()
