from trie import Trie

t = Trie()

# Empty trie searches
assert not t.search("anything"), "empty trie search"
assert not t.starts_with("a"), "empty trie starts_with"

t.insert("apple")
assert t.search("apple"), "exact match after insert"
assert not t.search("app"), "prefix is not a match"
assert not t.search("apples"), "extension is not a match"
assert t.starts_with("app"), "prefix found"
assert t.starts_with("apple"), "full word is own prefix"
assert t.starts_with("a"), "single char prefix"
assert not t.starts_with("b"), "non-existent prefix"

# Insert prefix separately
t.insert("app")
assert t.search("app"), "prefix now inserted as word"
assert t.search("apple"), "original word still found"

# Multiple words
t.insert("banana")
t.insert("band")
t.insert("bandana")
assert t.search("banana")
assert t.search("band")
assert t.search("bandana")
assert not t.search("ban")
assert t.starts_with("ban")
assert t.starts_with("band")
assert not t.starts_with("xyz")

# Case sensitive
t.insert("Hello")
assert t.search("Hello")
assert not t.search("hello")
assert not t.starts_with("hel")
assert t.starts_with("Hel")

print("ALL TESTS PASSED")