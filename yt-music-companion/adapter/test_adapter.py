import json
import os
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import ytm_adapter as A  # noqa: E402


class FakeYT:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.created = []

    def search(self, query, filter=None, limit=20):
        return [
            {"videoId": "abc", "title": "Song", "artists": [{"name": "Artist"}], "album": {"name": "LP"}, "duration": "3:05", "resultType": "song"},
            {"videoId": None, "title": "no id"},
        ]

    def get_liked_songs(self, limit=100):
        return {"tracks": [{"videoId": "x1", "title": "Liked", "artists": [{"name": "A"}], "isAvailable": False, "duration_seconds": 200}]}

    def get_history(self):
        return [{"videoId": "h1", "title": "Recent", "artists": [{"name": "B"}], "played": "Today"}]

    def get_watch_playlist(self, videoId=None, limit=25, radio=False):
        return {"tracks": [{"videoId": "r1", "title": "Radio", "artists": [{"name": "C"}], "length": "1:02:03"}]}

    def create_playlist(self, title, description, privacy_status="PRIVATE", video_ids=None):
        self.created.append((title, privacy_status, video_ids))
        return "PL123"

    def add_playlist_items(self, playlistId, videoIds, duplicates=False):
        return {"status": "STATUS_SUCCEEDED"}


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.ad = A.Adapter(factory=FakeYT)

    def test_requires_init(self):
        out = A.handle(self.ad, {"id": 1, "method": "search", "params": {"query": "x"}})
        self.assertEqual(out["error"]["type"], "not_initialized")

    def test_unauthenticated_blocks_library(self):
        A.handle(self.ad, {"id": 1, "method": "init", "params": {}})
        out = A.handle(self.ad, {"id": 2, "method": "liked_songs", "params": {}})
        self.assertEqual(out["error"]["type"], "not_authenticated")

    def test_search_normalizes(self):
        A.handle(self.ad, {"id": 1, "method": "init", "params": {}})
        out = A.handle(self.ad, {"id": 2, "method": "search", "params": {"query": "x"}})
        self.assertEqual(out["result"], [{"videoId": "abc", "title": "Song", "artists": ["Artist"], "album": "LP", "durationS": 185, "isAvailable": True, "isExplicit": False, "resultType": "song", "thumbnail": None}])

    def test_authenticated_flow(self):
        A.handle(self.ad, {"id": 1, "method": "init", "params": {"auth": json.dumps({"cookie": "secret"})}})
        liked = A.handle(self.ad, {"id": 2, "method": "liked_songs", "params": {}})["result"]
        self.assertFalse(liked[0]["isAvailable"])
        hist = A.handle(self.ad, {"id": 3, "method": "history", "params": {}})["result"]
        self.assertEqual(hist[0]["playedBucket"], "Today")
        radio = A.handle(self.ad, {"id": 4, "method": "watch_playlist", "params": {"video_id": "abc"}})["result"]
        self.assertEqual(radio[0]["durationS"], 3723)
        pl = A.handle(self.ad, {"id": 5, "method": "create_playlist", "params": {"title": "T", "video_ids": ["abc"]}})
        self.assertEqual(pl["result"], {"playlistId": "PL123"})
        add = A.handle(self.ad, {"id": 6, "method": "add_playlist_items", "params": {"playlist_id": "PL123", "video_ids": ["a", "b"]}})
        self.assertEqual(add["result"], {"added": 2})

    def test_errors_do_not_echo_params(self):
        A.handle(self.ad, {"id": 1, "method": "init", "params": {}})
        out = A.handle(self.ad, {"id": 2, "method": "setup_browser", "params": {"headers_raw": "cookie: SUPERSECRET"}})
        self.assertIn("error", out)
        self.assertNotIn("SUPERSECRET", json.dumps(out))

    def test_unknown_method(self):
        out = A.handle(self.ad, {"id": 9, "method": "__init__", "params": {}})
        self.assertEqual(out["error"]["type"], "unknown_method")

    def test_stdio_protocol(self):
        proc = subprocess.run(
            [sys.executable, "-I", os.path.join(os.path.dirname(__file__), "ytm_adapter.py")],
            input='{"id": 1, "method": "status"}\nnot json\n', capture_output=True, text=True, timeout=30,
        )
        lines = [json.loads(l) for l in proc.stdout.strip().splitlines()]
        self.assertEqual(lines[0]["id"], 1)
        self.assertEqual(lines[1]["error"]["type"], "bad_request")


if __name__ == "__main__":
    unittest.main()
