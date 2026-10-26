#!/usr/bin/env python3
"""
Minimal ytmusicapi bridge for the TypeScript backend.

Protocol: newline-delimited JSON on stdin/stdout.
  request:  {"id": 1, "method": "search", "params": {...}}
  response: {"id": 1, "result": ...}   or   {"id": 1, "error": {"type": "...", "message": "..."}}

Credentials arrive only via the "init" message on stdin (never argv, env or
disk) and are held in memory for the life of the process. Errors never echo
request params, so credentials cannot leak through error text. Nothing is
written to stdout except protocol messages; diagnostics go to stderr.
"""
from __future__ import annotations

import json
import re
import sys
import traceback
from typing import Any, Callable

try:
    import ytmusicapi
    from ytmusicapi import YTMusic
except ImportError:  # pragma: no cover - reported to the caller via "status"
    ytmusicapi = None
    YTMusic = None

ADAPTER_VERSION = "1"


class AdapterError(Exception):
    def __init__(self, type_: str, message: str):
        super().__init__(message)
        self.type = type_


def _duration_seconds(item: dict) -> int | None:
    if isinstance(item.get("duration_seconds"), int):
        return item["duration_seconds"]
    text = item.get("duration") or item.get("length")
    if isinstance(text, str) and re.fullmatch(r"\d+(:\d{1,2}){1,2}", text):
        secs = 0
        for part in text.split(":"):
            secs = secs * 60 + int(part)
        return secs
    return None


def normalize_track(item: dict) -> dict | None:
    """Convert any ytmusicapi song-like dict to the adapter's Track shape."""
    if not isinstance(item, dict) or not item.get("videoId"):
        return None
    artists = [a.get("name") for a in (item.get("artists") or []) if isinstance(a, dict) and a.get("name")]
    album = item.get("album")
    album_name = album.get("name") if isinstance(album, dict) else (album if isinstance(album, str) else None)
    thumbs = item.get("thumbnails") or item.get("thumbnail") or []
    thumb = thumbs[-1].get("url") if isinstance(thumbs, list) and thumbs and isinstance(thumbs[-1], dict) else None
    return {
        "videoId": item["videoId"],
        "title": item.get("title") or "",
        "artists": artists,
        "album": album_name,
        "durationS": _duration_seconds(item),
        # ytmusicapi marks greyed-out (region/rights-blocked) tracks with isAvailable=False
        "isAvailable": item.get("isAvailable", True) is not False,
        "isExplicit": bool(item.get("isExplicit", False)),
        "resultType": item.get("resultType"),
        "thumbnail": thumb,
    }


def _tracks(items: Any) -> list[dict]:
    return [t for t in (normalize_track(i) for i in (items or [])) if t]


class Adapter:
    def __init__(self, factory: Callable[..., Any] | None = None):
        self._factory = factory or YTMusic
        self._yt = None
        self._authenticated = False

    # --- lifecycle -----------------------------------------------------------
    def init(self, auth: str | None = None, oauth_client_id: str | None = None, oauth_client_secret: str | None = None, language: str = "en", location: str = ""):
        if self._factory is None:
            raise AdapterError("dependency_missing", "ytmusicapi is not installed in the adapter's Python environment")
        kwargs: dict[str, Any] = {"language": language}
        if location:
            kwargs["location"] = location
        if auth:
            auth_obj = json.loads(auth)
            kwargs["auth"] = auth_obj
            if oauth_client_id and oauth_client_secret:
                from ytmusicapi import OAuthCredentials  # type: ignore

                kwargs["oauth_credentials"] = OAuthCredentials(client_id=oauth_client_id, client_secret=oauth_client_secret)
        self._yt = self._factory(**kwargs)
        self._authenticated = bool(auth)
        return {"authenticated": self._authenticated}

    def status(self):
        return {
            "adapterVersion": ADAPTER_VERSION,
            "ytmusicapiVersion": getattr(ytmusicapi, "__version__", None) if ytmusicapi else None,
            "initialized": self._yt is not None,
            "authenticated": self._authenticated,
        }

    def setup_browser(self, headers_raw: str):
        """Turn raw copied request headers into ytmusicapi's browser auth JSON (returned, not written)."""
        if ytmusicapi is None:
            raise AdapterError("dependency_missing", "ytmusicapi is not installed")
        try:
            return {"auth": ytmusicapi.setup(filepath=None, headers_raw=headers_raw)}
        except Exception as exc:  # do not echo headers back
            raise AdapterError("invalid_headers", f"Could not parse the pasted headers ({type(exc).__name__}). Copy the request headers of an authenticated music.youtube.com POST /browse request.") from None

    def _require(self, auth: bool = False):
        if self._yt is None:
            raise AdapterError("not_initialized", "adapter not initialized")
        if auth and not self._authenticated:
            raise AdapterError("not_authenticated", "YouTube Music account not connected")
        return self._yt

    # --- read ----------------------------------------------------------------
    def search(self, query: str, filter: str = "songs", limit: int = 20):
        yt = self._require()
        results = yt.search(query, filter=filter, limit=limit)
        if filter == "artists":
            return [{"name": r.get("artist") or r.get("title"), "browseId": r.get("browseId")} for r in results if isinstance(r, dict)]
        if filter == "playlists":
            return [{"playlistId": r.get("browseId", "").removeprefix("VL") or r.get("playlistId"), "title": r.get("title"), "author": r.get("author")} for r in results if isinstance(r, dict)]
        return _tracks(results)

    def liked_songs(self, limit: int = 500):
        res = self._require(auth=True).get_liked_songs(limit=limit)
        return _tracks(res.get("tracks") if isinstance(res, dict) else [])

    def library_songs(self, limit: int = 500):
        return _tracks(self._require(auth=True).get_library_songs(limit=limit))

    def library_playlists(self, limit: int = 100):
        out = []
        for p in self._require(auth=True).get_library_playlists(limit=limit) or []:
            if not isinstance(p, dict) or not p.get("playlistId"):
                continue
            count = p.get("count")
            try:
                count = int(str(count).replace(",", "").split()[0]) if count is not None else None
            except ValueError:
                count = None
            out.append({"playlistId": p["playlistId"], "title": p.get("title") or "", "trackCount": count, "description": p.get("description")})
        return out

    def playlist(self, playlist_id: str, limit: int = 300):
        p = self._require().get_playlist(playlist_id, limit=limit)
        return {
            "playlistId": p.get("id") or playlist_id,
            "title": p.get("title") or "",
            "description": p.get("description"),
            "trackCount": p.get("trackCount"),
            "tracks": _tracks(p.get("tracks")),
        }

    def history(self):
        out = []
        for item in self._require(auth=True).get_history() or []:
            t = normalize_track(item)
            if t:
                t["playedBucket"] = item.get("played")
                out.append(t)
        return out

    def watch_playlist(self, video_id: str, limit: int = 25, radio: bool = True):
        res = self._require().get_watch_playlist(videoId=video_id, limit=limit, radio=radio)
        return _tracks(res.get("tracks") if isinstance(res, dict) else [])

    # --- write ---------------------------------------------------------------
    def create_playlist(self, title: str, description: str = "", privacy: str = "PRIVATE", video_ids: list[str] | None = None):
        if privacy not in ("PRIVATE", "UNLISTED", "PUBLIC"):
            raise AdapterError("invalid_params", "privacy must be PRIVATE, UNLISTED or PUBLIC")
        res = self._require(auth=True).create_playlist(title, description, privacy_status=privacy, video_ids=video_ids or None)
        if isinstance(res, str):
            return {"playlistId": res}
        raise AdapterError("remote_error", "YouTube Music did not return a playlist id")

    def add_playlist_items(self, playlist_id: str, video_ids: list[str]):
        res = self._require(auth=True).add_playlist_items(playlist_id, video_ids, duplicates=False)
        status = res.get("status") if isinstance(res, dict) else res
        if status != "STATUS_SUCCEEDED":
            raise AdapterError("remote_error", f"add_playlist_items returned status {status!r}")
        return {"added": len(video_ids)}


METHODS = {
    "init", "status", "setup_browser", "search", "liked_songs", "library_songs", "library_playlists",
    "playlist", "history", "watch_playlist", "create_playlist", "add_playlist_items",
}


def classify(exc: Exception) -> tuple[str, str]:
    if isinstance(exc, AdapterError):
        return exc.type, str(exc)
    text = str(exc)
    if "401" in text or "403" in text or "Unauthorized" in text or "sign in" in text.lower():
        return "not_authenticated", "YouTube Music rejected the credentials; reconnect your account."
    if "429" in text:
        return "rate_limited", "YouTube Music rate limited the request."
    if "Server returned HTTP" in text or "Connection" in type(exc).__name__ or "Timeout" in type(exc).__name__:
        return "remote_error", f"YouTube Music request failed ({type(exc).__name__})."
    return "internal_error", f"{type(exc).__name__}: {text[:200]}"


def handle(adapter: Adapter, msg: dict) -> dict:
    mid = msg.get("id")
    method = msg.get("method")
    params = msg.get("params") or {}
    if method not in METHODS:
        return {"id": mid, "error": {"type": "unknown_method", "message": f"unknown method {method!r}"}}
    try:
        return {"id": mid, "result": getattr(adapter, method)(**params)}
    except TypeError as exc:
        return {"id": mid, "error": {"type": "invalid_params", "message": str(exc).split("(")[0][:200]}}
    except Exception as exc:  # noqa: BLE001 - mapped to protocol errors
        type_, message = classify(exc)
        if type_ == "internal_error":
            traceback.print_exc(file=sys.stderr)
        return {"id": mid, "error": {"type": type_, "message": message}}


def main() -> None:
    adapter = Adapter()
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            out = {"id": None, "error": {"type": "bad_request", "message": "invalid JSON"}}
        else:
            out = handle(adapter, msg)
        sys.stdout.write(json.dumps(out) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
