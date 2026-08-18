#!/usr/bin/env python3
"""http_server.py — minimal HTTP/1.1 server using raw sockets.

No http.server, socketserver, asyncio, or frameworks. Stdlib only.
"""

import re
import socket
import threading


class Request:
    def __init__(self, method, path, headers, body):
        self.method = method
        self.path = path
        self.headers = headers
        self.body = body


class Response:
    def __init__(self, status, content_type, body):
        self.status = status
        self.content_type = content_type
        self.body = body


_STATUS_REASONS = {
    200: "OK",
    404: "Not Found",
    500: "Internal Server Error",
}


class HTTPServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.routes = {}  # (method, path) -> handler
        self._sock = None

    def route(self, path, method="GET"):
        def decorator(handler):
            self.routes[(method.upper(), path)] = handler
            return handler

        return decorator

    def start(self, timeout=None):
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((self.host, self.port))
        self._sock.listen(5)
        self._sock.settimeout(timeout)

        try:
            while True:
                try:
                    conn, _ = self._sock.accept()
                except socket.timeout:
                    break
                except OSError:
                    break
                try:
                    self._handle(conn)
                finally:
                    conn.close()
        finally:
            self._sock.close()

    def _handle(self, conn):
        try:
            request = self._parse_request(conn)
        except Exception:
            self._send(conn, Response(400, "text/plain", "Bad Request"))
            return

        handler = self.routes.get((request.method, request.path))
        if handler is None:
            self._send(conn, Response(404, "text/plain", "Not Found"))
            return

        try:
            response = handler(request)
        except Exception:
            self._send(conn, Response(500, "text/plain", "Internal Server Error"))
            return
        self._send(conn, response)

    def _parse_request(self, conn):
        data = b""
        while b"\r\n\r\n" not in data:
            chunk = conn.recv(4096)
            if not chunk:
                break
            data += chunk
            if len(data) > 1_000_000:
                break
        head, _, rest = data.partition(b"\r\n\r\n")

        lines = head.decode("latin-1").split("\r\n")
        method, path, _version = lines[0].split(" ", 2)

        headers = {}
        for line in lines[1:]:
            if ":" in line:
                key, _, value = line.partition(":")
                headers[key.strip().lower()] = value.strip()

        body = b""
        content_length = int(headers.get("content-length", "0"))
        body = rest
        while len(body) < content_length:
            chunk = conn.recv(4096)
            if not chunk:
                break
            body += chunk
        return Request(method, path, headers, body.decode("latin-1"))

    def _send(self, conn, response):
        status_line = f"HTTP/1.1 {response.status} {_STATUS_REASONS.get(response.status, '')}"
        if isinstance(response.body, str):
            body_bytes = response.body.encode("utf-8")
        else:
            body_bytes = response.body
        headers = (
            f"{status_line}\r\n"
            f"Content-Type: {response.content_type}\r\n"
            f"Content-Length: {len(body_bytes)}\r\n"
            "Connection: close\r\n"
            "\r\n"
        )
        conn.sendall(headers.encode("latin-1") + body_bytes)

    def _send_error(self, conn, status, message):
        self._send(conn, Response(status, "text/plain", message))
