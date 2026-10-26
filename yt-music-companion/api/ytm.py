"""
Vercel Python function: HTTPS front for adapter/ytm_adapter.py.

Only the Node server can call it: each request carries x-ymc-ts and an
HMAC-SHA256 (YTM_ADAPTER_SECRET) over "<ts>.<body>", valid for 5 minutes.
Stateless: the (already decrypted) credential arrives in the request body and
is used for this request only.
"""
import hashlib
import hmac
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "adapter"))
import ytm_adapter as A  # noqa: E402

MAX_BODY = 2 * 1024 * 1024


def verify(secret: str, ts: str, sig: str, body: bytes) -> bool:
    if not secret or not ts or not sig:
        return False
    try:
        if abs(time.time() - int(ts)) > 300:
            return False
    except ValueError:
        return False
    expected = hmac.new(secret.encode(), ts.encode() + b"." + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


def process(secret: str, ts: str, sig: str, body: bytes, factory=None) -> tuple[int, dict]:
    if not verify(secret, ts, sig, body):
        return 401, {"error": {"type": "unauthorized", "message": "bad signature"}}
    try:
        msg = json.loads(body)
    except json.JSONDecodeError:
        return 400, {"error": {"type": "bad_request", "message": "invalid JSON"}}
    adapter = A.Adapter(factory=factory) if factory else A.Adapter()
    method = msg.get("method")
    if method not in ("status", "setup_browser"):
        init = A.handle(adapter, {"id": 0, "method": "init", "params": {"auth": msg.get("auth")} if msg.get("auth") else {}})
        if "error" in init:
            return 200, init
    out = A.handle(adapter, {"id": 1, "method": method, "params": msg.get("params") or {}})
    out.pop("id", None)
    return 200, out


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("content-length") or 0)
        if length > MAX_BODY:
            return self._send(413, {"error": {"type": "too_large", "message": "body too large"}})
        body = self.rfile.read(length)
        status, payload = process(os.environ.get("YTM_ADAPTER_SECRET", ""), self.headers.get("x-ymc-ts", ""), self.headers.get("x-ymc-sig", ""), body)
        self._send(status, payload)

    def do_GET(self):
        self._send(405, {"error": {"type": "method_not_allowed", "message": "POST only"}})

    def _send(self, status: int, payload: dict):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):  # never log request lines/bodies
        pass
