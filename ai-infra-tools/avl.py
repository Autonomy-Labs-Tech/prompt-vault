"""AVL tree implementation (insert/delete/search) — stdlib only.

Height convention: height of a leaf (single node) is 0; empty tree height 0.
Satisfies BountyBook spec:
- inorder after [30,20,40,10,25,35,50] == [10,20,25,30,35,40,50]
- height after 7 inserts <= ceil(log2(8)) + 1
- delete(20) removes 20 from inorder
- RL rotation: height == 2 after inserting [10,30,20]
"""


class _Node:
    __slots__ = ("key", "left", "right", "height")

    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None
        self.height = 0


def _height(n):
    return n.height if n else -1


def _update(n):
    n.height = 1 + max(_height(n.left), _height(n.right))


def _balance(n):
    return _height(n.left) - _height(n.right)


def _rotate_left(n):
    r = n.right
    n.right = r.left
    r.left = n
    _update(n)
    _update(r)
    return r


def _rotate_right(n):
    l = n.left
    n.left = l.right
    l.right = n
    _update(n)
    _update(l)
    return l


def _rebalance(n):
    _update(n)
    b = _balance(n)
    if b > 1:
        if _balance(n.left) < 0:
            n.left = _rotate_left(n.left)
        return _rotate_right(n)
    if b < -1:
        if _balance(n.right) > 0:
            n.right = _rotate_right(n.right)
        return _rotate_left(n)
    return n


def _insert(n, key):
    if n is None:
        return _Node(key)
    if key < n.key:
        n.left = _insert(n.left, key)
    elif key > n.key:
        n.right = _insert(n.right, key)
    else:
        return n
    return _rebalance(n)


def _min_node(n):
    while n.left is not None:
        n = n.left
    return n


def _delete(n, key):
    if n is None:
        return None
    if key < n.key:
        n.left = _delete(n.left, key)
    elif key > n.key:
        n.right = _delete(n.right, key)
    else:
        if n.left is None:
            return n.right
        if n.right is None:
            return n.left
        succ = _min_node(n.right)
        n.key = succ.key
        n.right = _delete(n.right, succ.key)
    return _rebalance(n)


def _search(n, key):
    cur = n
    while cur is not None:
        if key == cur.key:
            return True
        cur = cur.left if key < cur.key else cur.right
    return False


def _inorder(n, out):
    if n is None:
        return
    _inorder(n.left, out)
    out.append(n.key)
    _inorder(n.right, out)


class AVLTree:
    """Self-balancing binary search tree (AVL)."""

    def __init__(self):
        self._root = None

    def insert(self, key: int) -> None:
        self._root = _insert(self._root, key)

    def delete(self, key: int) -> None:
        self._root = _delete(self._root, key)

    def search(self, key: int) -> bool:
        return _search(self._root, key)

    def inorder(self) -> list:
        out = []
        _inorder(self._root, out)
        return out

    def height(self) -> int:
        return _height(self._root) + 1 if self._root else 0


if __name__ == "__main__":
    import math

    t = AVLTree()
    for v in [30, 20, 40, 10, 25, 35, 50]:
        t.insert(v)
    assert t.inorder() == [10, 20, 25, 30, 35, 40, 50]

    n = 7
    assert t.height() <= math.ceil(math.log2(n + 1)) + 1, "Tree not balanced"

    assert t.search(25) is True
    assert t.search(99) is False

    t.delete(20)
    assert t.inorder() == [10, 25, 30, 35, 40, 50]
    assert t.search(20) is False

    t2 = AVLTree()
    for v in [10, 30, 20]:
        t2.insert(v)
    assert t2.inorder() == [10, 20, 30]
    assert t2.height() == 2  # balanced, not a skewed chain of height 3

    print("All tests passed")
