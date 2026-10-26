import hashlib
import hmac
import json
import os
import sys
import time
import unittest

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api"))
import ytm  # noqa: E402
from test_adapter import FakeYT  # noqa: E402

SECRET = "s" * 40


def signed(body: dict, ts: int | None = None, secret: str = SECRET):
    raw = json.dumps(body).encode()
    t = str(ts if ts is not None else int(time.time()))
    sig = hmac.new(secret.encode(), t.encode() + b"." + raw, hashlib.sha256).hexdigest()
    return t, sig, raw


class HttpAdapterTests(unittest.TestCase):
    def test_rejects_bad_or_stale_signatures(self):
        t, sig, raw = signed({"method": "status"})
        self.assertEqual(ytm.process(SECRET, t, "0" * 64, raw)[0], 401)
        self.assertEqual(ytm.process("", t, sig, raw)[0], 401)
        t2, sig2, raw2 = signed({"method": "status"}, ts=int(time.time()) - 3600)
        self.assertEqual(ytm.process(SECRET, t2, sig2, raw2)[0], 401)

    def test_authenticated_call_is_stateless(self):
        t, sig, raw = signed({"method": "history", "params": {}, "auth": json.dumps({"cookie": "x"})})
        status, out = ytm.process(SECRET, t, sig, raw, factory=FakeYT)
        self.assertEqual(status, 200)
        self.assertEqual(out["result"][0]["playedBucket"], "Today")
        t, sig, raw = signed({"method": "history", "params": {}})
        _, out = ytm.process(SECRET, t, sig, raw, factory=FakeYT)
        self.assertEqual(out["error"]["type"], "not_authenticated")


if __name__ == "__main__":
    unittest.main()
