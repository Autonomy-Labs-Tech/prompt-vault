import asyncio, sys, os, threading
from http.server import HTTPServer, BaseHTTPRequestHandler

assert os.path.exists("http_batcher.py"), "http_batcher.py not found"
from http_batcher import AsyncBatcher

# Track request counts for retry testing
request_counts = {}
lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        with lock:
            request_counts[self.path] = request_counts.get(self.path, 0) + 1
            count = request_counts[self.path]

        if self.path == "/ok":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"hello")
        elif self.path == "/not-found":
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"not found")
        elif self.path == "/retry":
            # Fail first 2 attempts, succeed on 3rd
            if count < 3:
                self.send_response(503)
                self.end_headers()
            else:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"ok after retry")
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
    def log_message(self, *a): pass

server = HTTPServer(("127.0.0.1", 18766), Handler)
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()
base = "http://127.0.0.1:18766"

async def run_tests():
    batcher = AsyncBatcher(max_concurrency=3, max_retries=3, backoff_base=0.01)

    urls = [f"{base}/ok", f"{base}/not-found", f"{base}/other1", f"{base}/other2"]
    results = await batcher.fetch_all(urls)

    # Check result count and order
    assert len(results) == 4, f"Expected 4 results, got {len(results)}"
    assert results[0].url == f"{base}/ok", f"URL order wrong: {[r.url for r in results]}"
    assert results[1].url == f"{base}/not-found", "URL order wrong"

    # Check /ok result
    assert results[0].status_code == 200, f"/ok status: {results[0].status_code}"
    assert results[0].body is not None and "hello" in results[0].body, f"/ok body: {results[0].body}"
    assert results[0].error is None, f"/ok error: {results[0].error}"
    assert results[0].attempts >= 1, "attempts should be >= 1"

    # Check 404 — should not retry
    assert results[1].status_code == 404, f"/not-found status: {results[1].status_code}"
    assert results[1].attempts == 1, f"/not-found should not retry (attempts={results[1].attempts})"

    # Test retry behavior
    request_counts.clear()
    batcher2 = AsyncBatcher(max_concurrency=2, max_retries=3, backoff_base=0.01)
    retry_results = await batcher2.fetch_all([f"{base}/retry"])
    r = retry_results[0]
    assert r.status_code == 200, f"/retry should succeed on 3rd attempt, got {r.status_code}"
    assert r.attempts >= 3, f"/retry should have >=3 attempts, got {r.attempts}"

    print("ALL TESTS PASSED")

asyncio.run(run_tests())
server.shutdown()