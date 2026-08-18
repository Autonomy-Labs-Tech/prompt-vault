import threading, time
from http_server import HTTPServer, Response

server = HTTPServer("127.0.0.1", 18765)

@server.route("/ping")
def ping(req):
    return Response(200, "text/plain", "pong")

@server.route("/echo", method="POST")
def echo(req):
    return Response(200, "application/json", f'{{"body": "{req.body}"}}')

t = threading.Thread(target=lambda: server.start(timeout=3), daemon=True)
t.start()
time.sleep(0.2)

import socket

def raw_request(method, path, body=""):
    s = socket.socket()
    s.connect(("127.0.0.1", 18765))
    req = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\nContent-Length: {len(body)}\r\nConnection: close\r\n\r\n{body}"
    s.sendall(req.encode())
    response = b""
    while True:
        chunk = s.recv(4096)
        if not chunk: break
        response += chunk
    s.close()
    return response.decode()

# GET /ping
resp = raw_request("GET", "/ping")
assert "200" in resp.split("\r\n")[0], f"ping: {resp[:100]}"
assert "pong" in resp, f"body missing: {resp}"

# POST /echo
resp2 = raw_request("POST", "/echo", "hello")
assert "200" in resp2.split("\r\n")[0], f"echo status: {resp2[:100]}"
assert "hello" in resp2, f"echo body: {resp2}"

# 404
resp3 = raw_request("GET", "/missing")
assert "404" in resp3.split("\r\n")[0], f"404: {resp3[:100]}"

t.join(timeout=4)
print("ALL TESTS PASSED")