#!/usr/bin/env python3
"""site_crawler.py — BFS website crawler emitting a sitemap JSON to stdout.

Usage: python site_crawler.py <seed_url> [--max-pages N] [--timeout SECONDS]
Stdlib only (urllib, html.parser).
"""

import argparse
import html.parser
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "site-crawler/1.0"


class _LinkParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "a":
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.links.append(value)


def normalize_url(url):
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.rstrip("/") or "/"
    return urllib.parse.urlunparse(
        (parsed.scheme, parsed.netloc, path, "", "", "")
    )


def is_internal(url, seed):
    u = urllib.parse.urlparse(url)
    s = urllib.parse.urlparse(seed)
    return u.scheme == s.scheme and u.netloc == s.netloc


def crawl(seed, max_pages=50, timeout=5):
    raw_seed = seed
    seed = normalize_url(seed)
    site_map = {}
    queue = [seed]
    visited = set()
    while queue and len(site_map) < max_pages:
        page = queue.pop(0)
        if page in visited:
            continue
        visited.add(page)
        try:
            req = urllib.request.Request(
                page, headers={"User-Agent": USER_AGENT}
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                content_type = resp.headers.get("Content-Type", "")
                if "text/html" not in content_type and "application/xhtml" not in content_type:
                    site_map[page] = []
                    continue
                data = resp.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, OSError, ValueError):
            continue

        parser = _LinkParser()
        try:
            parser.feed(data)
        except Exception:
            continue
        links = []
        for raw in parser.links:
            absolute = urllib.parse.urljoin(page, raw)
            absolute = normalize_url(absolute)
            if is_internal(absolute, seed) and absolute not in links:
                links.append(absolute)
        site_map[page] = links
        for link in links:
            if link not in visited:
                queue.append(link)

    return {"seed": raw_seed, "pages_visited": len(site_map), "site_map": site_map}


def main():
    parser = argparse.ArgumentParser(description="Crawl a site and emit sitemap JSON")
    parser.add_argument("seed_url")
    parser.add_argument("--max-pages", type=int, default=50)
    parser.add_argument("--timeout", type=float, default=5)
    args = parser.parse_args()
    result = crawl(args.seed_url, max_pages=args.max_pages, timeout=args.timeout)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
