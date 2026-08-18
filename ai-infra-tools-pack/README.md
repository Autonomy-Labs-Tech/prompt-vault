# AI Infra Tools Pack — 4 Verified Utilities

Four battle-tested infrastructure utilities: a raw-socket HTTP/1.1 server, a
self-balancing AVL tree, a prefix Trie, and an RSS news aggregator API. Three
are **stdlib-only** (Python 3); the news aggregator runs on **FastAPI** (see
its requirements below). Every tool ships with a test harness or built-in
self-test and is verified against strict assertions.

## Tools

### 1. `http_server.py` — Raw-Socket HTTP/1.1 Server (Python)

A minimal HTTP/1.1 server built directly on `socket` + `threading` — no
`http.server`, `socketserver`, `asyncio`, or frameworks. Stdlib only.

- Decorator routing: `@server.route("/path", method="GET")`.
- Parses the request line, headers, and body; serves status, content-type and
  body with correct `Content-Length`.
- Handles 200 / 404 / 500 with proper status lines.

```
Usage:  from http_server import HTTPServer, Response
Test:   python3 verify_http_server.py
```

### 2. `avl.py` — AVL Tree (Python)

A self-balancing binary search tree with `insert` / `delete` / `search` /
`inorder` / `height` — stdlib only.

- Keeps the tree balanced (height ≤ ceil(log2(n+1)) + 1) via single and double
  rotations after every insert/delete.
- Handles the classic RL case: inserting `[10, 30, 20]` yields a balanced tree
  of height 2, not a skewed chain of height 3.

```
Usage:  from avl import AVLTree
Test:   python3 avl.py   (built-in self-test, prints "All tests passed")
```

### 3. `trie.py` — Trie (Python 3.8+, stdlib only)

A prefix tree with `insert`, `search`, and `starts_with`.

- Exact-word vs prefix semantics: `search("app")` is false until `"app"` is
  inserted, while `starts_with("app")` matches any inserted word starting with
  it.
- Case-sensitive, duplicate inserts ignored, tracks the distinct word count.

```
Usage:  from trie import Trie
Test:   python3 verify_trie.py
```

### 4. `news_aggregator.py` — RSS News Aggregator (FastAPI)

A FastAPI service that fetches and deduplicates RSS feeds.

- `GET /news?sources=<comma-separated feed URLs>&limit=20&hours=24` returns
  `{fetched_at, total_articles, sources_queried, articles[]}`.
- Dedup: exact-URL duplicates and near-identical titles (>80% `difflib`
  similarity) are dropped, keeping the first occurrence.
- Max 5 sources; optional `limit` (1–100) and `hours` (1–720) filters.

```
Usage:  pip install -r requirements.txt && uvicorn news_aggregator:app
Test:   start the server, then:
        curl "http://127.0.0.1:8000/news?sources=https://hnrss.org/frontpage&limit=5"
```

Requires `fastapi`, `httpx`, `feedparser`, `uvicorn` (see `requirements.txt`).
The other three tools have no runtime dependencies beyond the Python 3 standard
library.

## Test Commands

| Tool                 | Command                                  |
|----------------------|------------------------------------------|
| http_server.py       | `python3 verify_http_server.py`           |
| avl.py               | `python3 avl.py`                          |
| trie.py              | `python3 verify_trie.py`                  |
| news_aggregator.py   | `uvicorn news_aggregator:app` + curl `/news` (needs `pip install -r requirements.txt`) |

All tools are verified against their strict bundled assertions. No runtime
dependencies beyond the Python 3 standard library (news aggregator excepted,
as noted above).
