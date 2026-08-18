#!/usr/bin/env python3
"""ast_doc.py — parse a Python source file and emit structured JSON documentation.

Usage: python ast_doc.py <source_file.py>
Stdlib only. Exits 1 with an error to stderr if the file is not parseable.
"""

import ast
import json
import sys


def _docstring(node):
    return ast.get_docstring(node, clean=False)


def _doc_function(node):
    return {
        "name": node.name,
        "args": [a.arg for a in node.args.args],
        "returns": _annot_str(node.returns),
        "docstring": _docstring(node),
        "lineno": node.lineno,
    }


def _annot_str(node):
    if node is None:
        return None
    try:
        return ast.unparse(node)
    except Exception:
        return None


def _class_info(node):
    return {
        "name": node.name,
        "bases": [_annot_str(b) for b in node.bases],
        "docstring": _docstring(node),
        "lineno": node.lineno,
        "methods": [
            _doc_function(n)
            for n in node.body
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
        ],
    }


def build_doc(source: str):
    tree = ast.parse(source)
    doc = {
        "module": {"docstring": _docstring(tree)},
        "functions": [
            _doc_function(n)
            for n in tree.body
            if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
        ],
        "classes": [
            _class_info(n)
            for n in tree.body
            if isinstance(n, ast.ClassDef)
        ],
    }
    return doc


def main():
    if len(sys.argv) != 2:
        print("usage: python ast_doc.py <source_file.py>", file=sys.stderr)
        sys.exit(1)
    path = sys.argv[1]
    try:
        with open(path, "r", encoding="utf-8") as f:
            source = f.read()
        doc = build_doc(source)
    except SyntaxError as e:
        print(f"error: failed to parse {path}: {e}", file=sys.stderr)
        sys.exit(1)
    except OSError as e:
        print(f"error: {e}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(doc, indent=2))


if __name__ == "__main__":
    main()
