#!/usr/bin/env python3
"""Generate pytest tests from an OpenAPI 3.x spec (JSON or YAML, file or URL).

Usage:
    python3 gen_tests.py --spec PATH_OR_URL [--output test_api.py]

For each path + method it emits one pytest test that:
- issues a real HTTP request to the spec's base server URL,
- fills required path/query params with sensible test values,
- asserts the status code is one of the documented responses.
"""
import argparse
import json
import re
import sys
import urllib.request

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

DEFAULT_SPEC = "https://api.bountybook.ai/openapi.json"


def load_spec(path_or_url):
    raw = None
    if re.match(r"^https?://", path_or_url):
        req = urllib.request.Request(path_or_url, headers={"User-Agent": "gen-tests/1.0"})
        raw = urllib.request.urlopen(req, timeout=30).read()
    else:
        with open(path_or_url, "rb") as fh:
            raw = fh.read()
    text = raw.decode("utf-8", "replace")
    try:
        return json.loads(text)
    except ValueError:
        if yaml is None:
            raise RuntimeError("YAML spec needs PyYAML (pip install pyyaml)")
        return yaml.safe_load(text)


def base_url(spec):
    servers = spec.get("servers") or [{"url": ""}]
    return servers[0].get("url", "").rstrip("/")


def param_default(p):
    schema = p.get("schema") or {}
    stype = schema.get("type")
    if stype == "integer":
        return 1
    if stype == "number":
        return 1.5
    if stype == "boolean":
        return "true"
    if stype == "array":
        return "test"
    return "test"


def param_value_str(p):
    v = param_default(p)
    if v is True:
        return "true"
    if v is False:
        return "false"
    return str(v)


def response_codes(op):
    codes = []
    for key in (op.get("responses") or {}).keys():
        m = re.match(r"^([1-5][0-9X]{2})$", key)
        if m:
            codes.append(int(key.replace("X", "0")))
    return codes or [200]


def sanitize(name):
    name = re.sub(r"[^A-Za-z0-9]+", "_", name)
    return re.sub(r"_+", "_", name).strip("_").lower()


def render_tests(spec):
    base = base_url(spec)
    lines = []
    used = set()
    for path, item in (spec.get("paths") or {}).items():
        shared = {p["name"]: p for p in (item.get("parameters") or [])}
        for method in ("get", "post", "put", "patch", "delete"):
            op = item.get(method)
            if not op or not isinstance(op, dict):
                continue
            params = {}
            for p in (op.get("parameters") or []):
                params[p["name"]] = p
            for name, p in shared.items():
                params.setdefault(name, p)
            path_args, query_args = [], []
            for name, p in params.items():
                if p.get("in") == "path":
                    path_args.append((name, p))
                elif p.get("in") == "query" and p.get("required"):
                    query_args.append((name, p))
            path_val = path
            for name, p in path_args:
                path_val = path_val.replace("{%s}" % name, param_value_str(p))
            query = "&".join("%s=%s" % (n, param_value_str(p)) for n, p in query_args)
            url = base + path_val + ("?%s" % query if query else "")
            codes = response_codes(op)
            fname = "test_%s_%s" % (method, sanitize(path))
            if fname in used:
                fname += "_2"
                while fname in used:
                    fname += "_2"
            used.add(fname)
            lines.append("def %s():" % fname)
            lines.append('    r = requests.%s("%s")' % (method, url))
            lines.append("    assert r.status_code in %s" % json.dumps(codes))
            lines.append("")
    return lines


def main(argv=None):
    ap = argparse.ArgumentParser(description="Generate pytest tests from OpenAPI specs")
    ap.add_argument("--spec", default=DEFAULT_SPEC, help="OpenAPI JSON/YAML file path or URL")
    ap.add_argument("--output", default="test_api.py", help="output test file (default test_api.py)")
    args = ap.parse_args(argv)
    spec = load_spec(args.spec)
    tests = render_tests(spec)
    with open(args.output, "w", encoding="utf-8") as fh:
        fh.write("import requests, pytest\n\n")
        fh.write("\n".join(tests))
    nfuncs = sum(1 for ln in tests if ln.startswith("def test_"))
    print("wrote %s with %d tests" % (args.output, nfuncs))
    return 0


if __name__ == "__main__":
    sys.exit(main())
