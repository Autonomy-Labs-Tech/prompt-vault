# AI Coding Tools Pack — 5 Verified Utilities

Five battle-tested, dependency-free developer utilities. Every tool is
**stdlib-only** (Python 3 or TypeScript), ships with a test harness, and has
been verified against a strict test suite.

## Tools

### 1. `state_machine.ts` — Generic Finite State Machine (TypeScript)

A small, strict-mode TypeScript state machine with no external dependencies.

- Generic over `State` and `Event` string unions.
- Lifecycle hooks: `onExit` → `action` → `onEnter` on successful transitions.
- Guards can block transitions; a blocked or undefined transition returns
  `false` and causes no side effects.
- Optional transition logging via `logTransitions` / `onLog`.

```
Usage:  import { StateMachine } from './state_machine.js'
Test:   npx tsc --strict --noEmit state_machine.ts && node test_state_machine.js
```

### 2. `ast_doc.py` — AST Documentation Extractor (Python)

Parses a Python source file and emits structured JSON documentation using only
the standard library (`ast`, `json`, `sys`).
- Captures module/class/function docstrings, argument lists, return annotations,
  base classes, and line numbers.
- Exits `1` with a readable error if the file is not parseable.

```
Usage:  python3 ast_doc.py <source_file.py>
Test:   python3 verify_ast_doc.py
```

### 3. `gen_tests.py` — OpenAPI → pytest Generator (Python)

Generates one pytest test per path+method from an OpenAPI 3.x spec (JSON or
YAML, file or URL).
- Fills required path/query parameters with sensible test values.
- Asserts each response status is one of the documented responses.
- Stdlib only — YAML specs need `pip install pyyaml` (optional).

```
Usage:  python3 gen_tests.py --spec PATH_OR_URL [--output test_api.py]
Test:   python3 -m pytest test_api.py   (or run the bundled test_api.py suite)
```

### 4. `site_crawler.py` — BFS Site Crawler (Python)

A breadth-first website crawler emitting a sitemap JSON to stdout.
- Stdlib only (`urllib`, `html.parser`).
- Stays on the seed origin (external links are collected but not followed),
  normalizes URLs, respects `--max-pages` and `--timeout`.

```
Usage:  python3 site_crawler.py <seed_url> [--max-pages N] [--timeout SECONDS]
Test:   python3 verify_site_crawler.py
```

### 5. `http_batcher.py` — Async HTTP Batcher (Python)

Concurrent HTTP GETs with exponential-backoff retry — stdlib only
(`asyncio` + `urllib`).
- Configurable `max_concurrency`, `max_retries`, `backoff_base`.
- Retries only on 5xx or network errors; never on 4xx.
- Preserves input URL order in results.

```
Usage:  from http_batcher import AsyncBatcher
        results = asyncio.run(AsyncBatcher().fetch_all([url1, url2, ...]))
Test:   python3 verify_http_batcher.py
```

## Test Commands

| Tool                 | Command                                  |
|----------------------|------------------------------------------|
| state_machine.ts     | `npx tsc --strict --noEmit state_machine.ts && node test_state_machine.js` |
| ast_doc.py           | `python3 verify_ast_doc.py`              |
| gen_tests.py         | `python3 gen_tests.py --help` + `pytest test_api.py` |
| site_crawler.py      | `python3 verify_site_crawler.py`         |
| http_batcher.py      | `python3 verify_http_batcher.py`         |

All tools are verified against their strict bundled test suites. No runtime
dependencies beyond the Python 3 / TypeScript standard libraries.
