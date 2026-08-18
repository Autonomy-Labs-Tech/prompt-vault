#!/usr/bin/env python3
"""http_batcher.py — AsyncBatcher: concurrent HTTP GETs with exponential-backoff retry.

Stdlib only (asyncio + urllib). Retries only on 5xx or network error.
Preserves input URL order in results.
"""

import asyncio
import random
import urllib.error
import urllib.request
from collections import namedtuple

BatchResult = namedtuple(
    "BatchResult", ["url", "status_code", "body", "error", "attempts"]
)


class AsyncBatcher:
    def __init__(self, max_concurrency=10, max_retries=3, backoff_base=0.5):
        self.max_concurrency = max_concurrency
        self.max_retries = max_retries
        self.backoff_base = backoff_base

    async def fetch_all(self, urls):
        sem = asyncio.Semaphore(self.max_concurrency)
        results = await asyncio.gather(
            *(self._fetch_one(url, sem) for url in urls)
        )
        return list(results)

    async def _fetch_one(self, url, sem):
        async with sem:
            status = None
            body = None
            error = None
            attempts = 0
            for attempt in range(1, self.max_retries + 1):
                attempts = attempt
                status, body, error = await asyncio.to_thread(self._request, url)
                if error is None and not (status is not None and 500 <= status < 600):
                    break
                if attempt < self.max_retries:
                    delay = self.backoff_base * (2 ** (attempt - 1))
                    await asyncio.sleep(delay * random.uniform(0.5, 1.5))
            return BatchResult(url=url, status_code=status, body=body,
                               error=error, attempts=attempts)

    @staticmethod
    def _request(url):
        req = urllib.request.Request(url, headers={"User-Agent": "http-batcher/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, resp.read().decode("utf-8", errors="replace"), None
        except urllib.error.HTTPError as e:
            body = None
            try:
                body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass
            return e.code, body, None
        except Exception as e:
            return None, None, str(e)
