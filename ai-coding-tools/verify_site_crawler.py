import subprocess, sys, json, os, threading
from http.server import HTTPServer, BaseHTTPRequestHandler

PAGES = {
    "/": b'<html><body><a href="/about">About</a> <a href="/contact">Contact</a> <a href="https://external.com">Ext</a></body></html>',
    "/about": b'<html><body><a href="/">Home</a> <a href="/team">Team</a></body></html>',
    "/contact": b'<html><body><a href="/">Home</a></body></html>',
    "/team": b'<html><body><a href="/about">About</a></body></html>',
}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/") or "/"
        if path in PAGES:
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(PAGES[path])
        else:
            self.send_response(404)
            self.end_headers()
    def log_message(self, *args): pass

server = HTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
t = threading.Thread(target=server.serve_forever)
t.daemon = True
t.start()

seed = f"http://127.0.0.1:{port}"
result = subprocess.run(
    [sys.executable, "site_crawler.py", seed, "--max-pages", "10", "--timeout", "3"],
    capture_output=True, text=True
)
server.shutdown()

assert result.returncode == 0, f"Expected exit 0. stderr: {result.stderr}"
data = json.loads(result.stdout)

assert data["seed"] == seed, f"Wrong seed: {data['seed']}"
assert data["pages_visited"] >= 3, f"Expected at least 3 pages, got {data['pages_visited']}"
assert isinstance(data["site_map"], dict), "site_map should be a dict"

# All site_map keys should be internal URLs
for url in data["site_map"]:
    assert url.startswith(seed), f"External URL in site_map: {url}"

# No external URLs in link lists
for page, links in data["site_map"].items():
    for link in links:
        assert link.startswith(seed), f"External link {link} on page {page}"

# pages_visited should match key count
assert data["pages_visited"] == len(data["site_map"]), "pages_visited should match site_map key count"

print("ALL TESTS PASSED")