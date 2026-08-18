import subprocess, sys, json, os, tempfile

# Write sample Python file
sample = '''"""Sample module for testing."""

def add(x: int, y: int) -> int:
    """Return sum of x and y."""
    return x + y

def greet(name: str) -> None:
    pass

class Animal:
    """Base animal class."""

    def __init__(self, name: str):
        """Initialize with name."""
        self.name = name

    def speak(self) -> str:
        """Return the animal's sound."""
        return ""

class Dog(Animal):
    pass
'''

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
    f.write(sample)
    fname = f.name

try:
    result = subprocess.run([sys.executable, "ast_doc.py", fname],
                           capture_output=True, text=True)
    assert result.returncode == 0, f"Expected exit 0, got {result.returncode}. stderr: {result.stderr}"

    doc = json.loads(result.stdout)

    # Module docstring
    assert doc["module"]["docstring"] == "Sample module for testing.", f"Wrong module docstring: {doc['module']}"

    # Functions
    func_names = [f["name"] for f in doc["functions"]]
    assert "add" in func_names, f"add not in functions: {func_names}"
    assert "greet" in func_names, f"greet not in functions: {func_names}"

    add_fn = next(f for f in doc["functions"] if f["name"] == "add")
    assert "x" in add_fn["args"] and "y" in add_fn["args"], f"add args: {add_fn['args']}"
    assert add_fn["docstring"] == "Return sum of x and y.", f"add docstring: {add_fn['docstring']}"
    assert "int" in str(add_fn["returns"]), f"add return type: {add_fn['returns']}"

    # Classes
    class_names = [c["name"] for c in doc["classes"]]
    assert "Animal" in class_names, f"Animal not in classes: {class_names}"
    assert "Dog" in class_names, f"Dog not in classes: {class_names}"

    animal_cls = next(c for c in doc["classes"] if c["name"] == "Animal")
    assert animal_cls["docstring"] == "Base animal class.", f"Animal docstring: {animal_cls['docstring']}"
    method_names = [m["name"] for m in animal_cls["methods"]]
    assert "__init__" in method_names, f"__init__ not in methods: {method_names}"
    assert "speak" in method_names, f"speak not in methods: {method_names}"

    dog_cls = next(c for c in doc["classes"] if c["name"] == "Dog")
    assert "Animal" in dog_cls["bases"], f"Dog bases: {dog_cls['bases']}"

    print("ALL TESTS PASSED")
finally:
    os.unlink(fname)