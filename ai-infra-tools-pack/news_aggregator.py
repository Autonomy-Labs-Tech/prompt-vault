"""FastAPI news aggregator with RSS feed deduplication.

GET /news?sources=<comma-separated feed URLs>&limit=20&hours=24

Returns:
{
  "fetched_at": ISO8601 timestamp,
  "total_articles": int,
  "sources_queried": int,
  "articles": [ {title, url, source, published_at, summary} ]
}

Dedup: same URL, or >80% title similarity (difflib ratio), keeps first.
"""
from __future__ import annotations

import datetime as _dt
import difflib
from urllib.parse import urlparse

import feedparser
import httpx
from fastapi import FastAPI, HTTPException, Query

app = FastAPI(title="News Aggregator")

MAX_SOURCES = 5


def _dedup(articles: list[dict]) -> list[dict]:
    """Remove exact-URL dupes and near-identical titles (>80% similarity)."""
    seen_urls: set[str] = set()
    seen_titles: list[str] = []
    out = []
    for a in articles:
        url = (a.get("url") or "").strip()
        title = (a.get("title") or "").strip()
        if not url and not title:
            continue
        if url and url in seen_urls:
            continue
        if title:
            dup = False
            for prev in seen_titles:
                r = difflib.SequenceMatcher(None, title.lower(), prev.lower()).ratio()
                if r > 0.8:
                    dup = True
                    break
            if dup:
                continue
        seen_urls.add(url)
        seen_titles.append(title)
        out.append(a)
    return out


def _parse_feed(url: str, hours: int) -> list[dict]:
    """Fetch and parse one RSS feed; returns normalized article dicts."""
    try:
        with httpx.Client(timeout=12.0, follow_redirects=True) as client:
            resp = client.get(url, headers={"User-Agent": "news-aggregator/1.0"})
            resp.raise_for_status()
        parsed = feedparser.parse(resp.content)
    except Exception:
        return []
    domain = urlparse(url).netloc or url
    now = _dt.datetime.now(_dt.timezone.utc)
    cutoff_dt = now - _dt.timedelta(hours=hours)
    items = []
    for entry in parsed.entries:
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        if published:
            published_dt = _dt.datetime(*published[:6], tzinfo=_dt.timezone.utc)
        else:
            published_dt = None
        if published_dt is not None and published_dt < cutoff_dt:
            continue
        link = entry.get("link", "").strip()
        summary = (entry.get("summary") or entry.get("description") or "").strip()
        items.append({
            "title": (entry.get("title") or "").strip(),
            "url": link,
            "source": domain,
            "published_at": published_dt.isoformat() if published_dt else None,
            "summary": summary[:200],
        })
    return items


@app.get("/news")
def get_news(
    sources: str = Query(..., description="comma-separated RSS feed URLs, max 5"),
    limit: int = Query(20, ge=1, le=100),
    hours: int = Query(24, ge=1, le=720),
):
    feed_urls = [s.strip() for s in sources.split(",") if s.strip()][:MAX_SOURCES]
    if not feed_urls:
        raise HTTPException(status_code=400, detail="sources is required")
    all_articles: list[dict] = []
    for u in feed_urls:
        all_articles.extend(_parse_feed(u, hours))
    deduped = _dedup(all_articles)[:limit]
    return {
        "fetched_at": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "total_articles": len(deduped),
        "sources_queried": len(feed_urls),
        "articles": deduped,
    }
