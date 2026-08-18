#!/usr/bin/env python3
"""trie.py — Trie class with insert, search, starts_with (Python 3.8+, stdlib only)."""


class Trie:
    def __init__(self):
        self._root = {}
        self._count = 0

    def insert(self, word):
        node = self._root
        for ch in word:
            node = node.setdefault(ch, {})
        if "_end" not in node:
            node["_end"] = True
            self._count += 1

    def search(self, word):
        node = self._root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return node.get("_end", False)

    def starts_with(self, prefix):
        if prefix == "":
            return self._count > 0
        node = self._root
        for ch in prefix:
            if ch not in node:
                return False
            node = node[ch]
        return True
