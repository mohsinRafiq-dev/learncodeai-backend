// Comprehensive Python course: beginner → expert.
// Shape consumed by ../../utils/seedCourses.js (runner).

const pythonCourse = {
  language: 'python',
  category: 'programming-language',
  difficulty: 'beginner',
  title: 'Python Programming: Beginner to Expert',
  shortDescription:
    'Master Python from first variables to async, decorators, and concurrency — with quizzes and a completion certificate.',
  description:
    'A complete Python learning path designed for self-study. Four sections take you from the very basics through data structures, intermediate topics like file I/O and OOP, all the way to advanced features like decorators, async/await, type hints, and concurrency. Every section ends with a quiz and the course finishes with a final assessment + completion certificate.',
  thumbnail:
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
  tags: ['python', 'programming', 'oop', 'async', 'concurrency'],
  estimatedHours: 40,
  certificateTemplate: 'excellence',
  sections: [
    // ===================== SECTION 1 — FOUNDATIONS =====================
    {
      title: 'Section 1 — Python Foundations',
      description: 'Variables, types, operators, control flow, and loops.',
      order: 1,
      estimatedHours: 8,
      lessons: [
        {
          title: 'Variables, Types, and Operators',
          description: 'Store values and combine them into expressions.',
          order: 1,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Variables and Built-in Types</h2>
<p>A <strong>variable</strong> is a named container. Python infers the type from the value assigned — you never declare types.</p>
<ul>
  <li><code>int</code> — whole numbers (<code>age = 25</code>)</li>
  <li><code>float</code> — decimals (<code>pi = 3.14</code>)</li>
  <li><code>str</code> — text (<code>name = "Alex"</code>)</li>
  <li><code>bool</code> — <code>True</code> / <code>False</code></li>
  <li><code>None</code> — absence of value</li>
</ul>
<h3>Operators</h3>
<p>Arithmetic: <code>+ - * /</code> (float divide), <code>//</code> (floor divide), <code>%</code> (remainder), <code>**</code> (power). Comparison: <code>== != &lt; &lt;= &gt; &gt;=</code>. Logical: <code>and or not</code>.</p>
<h3>Dynamic typing</h3>
<p>The same variable can be reassigned to a different type. Use <code>type(x)</code> to inspect.</p>
          `,
          codeExamples: [
            {
              title: 'Different types in one program',
              description: 'Assignment and type checking.',
              code: `name = "Alex"
age = 25
height = 5.9
print(name, age, height, type(height))`,
              language: 'python',
              expectedOutput: "Alex 25 5.9 <class 'float'>",
              order: 1,
            },
            {
              title: 'Floor vs true division',
              description: 'Use // when you need an integer result.',
              code: `print(7 / 2)
print(7 // 2)
print(7 % 2)`,
              language: 'python',
              expectedOutput: '3.5\n3\n1',
              order: 2,
            },
          ],
          notes: [
            'Type hints (`x: int = 0`) are optional but improve tooling.',
            'snake_case for variable and function names is the standard.',
            '`None` is its own type — use it for "not assigned yet".',
          ],
          tips: [
            'Pick names that describe meaning, not the type.',
            'Use `type(x)` while learning to confirm what you stored.',
            'Reach for `//` and `%` when working with whole-number domains.',
          ],
        },
        {
          title: 'Strings and Input/Output',
          description: 'Format text with f-strings; read user input with input().',
          order: 2,
          duration: 25,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Strings</h2>
<p>Strings are immutable sequences of characters. Methods return new strings.</p>
<h3>f-strings (preferred)</h3>
<pre><code>name = "Alex"
greeting = f"Hello, {name}!"</code></pre>
<h3>Common methods</h3>
<ul>
  <li><code>.upper() / .lower() / .strip()</code></li>
  <li><code>.split(sep) / .join(items)</code></li>
  <li><code>.replace(a, b) / .find(sub)</code></li>
  <li><code>len(s)</code></li>
</ul>
<h3>Input/Output</h3>
<p><code>print(*args, sep=" ", end="\\n")</code> writes to stdout. <code>input(prompt)</code> reads a line and returns a string — convert with <code>int()</code> or <code>float()</code>.</p>
          `,
          codeExamples: [
            {
              title: 'f-string with expression',
              description: 'Interpolate values inline.',
              code: `name = "Alex"
age = 25
print(f"{name} is {age * 12} months old")`,
              language: 'python',
              expectedOutput: 'Alex is 300 months old',
              order: 1,
            },
            {
              title: 'Reading a number',
              description: 'Convert input() result.',
              code: `age = int(input("Age: "))
print(f"In 5 years: {age + 5}")`,
              language: 'python',
              input: '25',
              expectedOutput: 'Age: In 5 years: 30',
              order: 2,
            },
          ],
          notes: [
            '`input()` always returns a string — convert before doing math.',
            'Triple-quoted strings (`"""..."""`) span multiple lines.',
            'Format numbers in f-strings: `f"{n:.2f}"`.',
          ],
          tips: [
            'Default to f-strings over `+` concatenation.',
            'Use `.strip()` on any user input to handle trailing whitespace.',
            'For debugging: `print(f"{var=}")` shows both name and value.',
          ],
        },
        {
          title: 'Control Flow and Loops',
          description: 'Make decisions with if/elif/else and repeat with for/while.',
          order: 3,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Conditionals</h2>
<pre><code>if score &gt;= 90: grade = "A"
elif score &gt;= 75: grade = "B"
else: grade = "F"</code></pre>
<p>Python uses indentation for block scope. Stay consistent with 4 spaces.</p>
<h2>Loops</h2>
<p>Two forms:</p>
<ul>
  <li><code>for x in iterable:</code> — walk every item</li>
  <li><code>while condition:</code> — repeat while truthy</li>
</ul>
<h3>Helpful built-ins</h3>
<ul>
  <li><code>range(start, stop, step)</code> — number sequence</li>
  <li><code>enumerate(items)</code> — index + value</li>
  <li><code>zip(a, b)</code> — pair two iterables</li>
</ul>
<h3>Control statements</h3>
<p><code>break</code> exits, <code>continue</code> skips to the next iteration.</p>
          `,
          codeExamples: [
            {
              title: 'enumerate over a list',
              description: 'Index and value in one loop.',
              code: `colors = ["red", "green", "blue"]
for i, color in enumerate(colors, start=1):
    print(f"{i}: {color}")`,
              language: 'python',
              expectedOutput: '1: red\n2: green\n3: blue',
              order: 1,
            },
            {
              title: 'while with break',
              description: 'Loop until a condition holds.',
              code: `n = 1
while True:
    if n * n > 50:
        break
    n += 1
print(n)`,
              language: 'python',
              expectedOutput: '8',
              order: 2,
            },
          ],
          notes: [
            '`range(5)` produces 0..4 (stop is exclusive).',
            'Falsy values in Python: `False`, `0`, `0.0`, `None`, `""`, `[]`, `{}`.',
            '`for/else` runs the `else` clause only if the loop didn\'t break.',
          ],
          tips: [
            'Use early `return`/`continue` to flatten nested conditions.',
            'Prefer `for` over `while` when you know what you\'re iterating.',
            '`enumerate` beats manual index counters.',
          ],
        },
      ],
      quiz: {
        title: 'Section 1 Quiz — Python Foundations',
        description: 'Confirm you understand variables, operators, conditionals, and loops.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What is the result of `7 // 2` in Python?',
            options: [
              { text: '3.5', isCorrect: false },
              { text: '3', isCorrect: true },
              { text: '4', isCorrect: false },
              { text: '3.0', isCorrect: false },
            ],
            points: 2,
            explanation: '`//` is floor division — discards the fractional part.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is the correct f-string?',
            options: [
              { text: '"Hello, $name!"', isCorrect: false },
              { text: '"Hello, {name}!".format(name)', isCorrect: false },
              { text: 'f"Hello, {name}!"', isCorrect: true },
              { text: 'f"Hello, $name!"', isCorrect: false },
            ],
            points: 2,
            explanation: 'f-strings use the `f` prefix and `{}` for substitutions.',
          },
          {
            type: 'true-false',
            question: 'Python uses indentation to define code blocks.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'Unlike C/Java/JS, Python has no curly braces — indentation IS the block.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `input("Age: ")` return?',
            options: [
              { text: 'an int', isCorrect: false },
              { text: 'a string', isCorrect: true },
              { text: 'a float', isCorrect: false },
              { text: 'whatever type matches what the user typed', isCorrect: false },
            ],
            points: 2,
            explanation: '`input()` always returns a string. Convert with `int()` or `float()`.',
          },
          {
            type: 'multiple-choice',
            question: 'Which control statement exits a loop immediately?',
            options: [
              { text: 'continue', isCorrect: false },
              { text: 'return', isCorrect: false },
              { text: 'break', isCorrect: true },
              { text: 'pass', isCorrect: false },
            ],
            points: 1,
            explanation: '`break` exits the enclosing loop; `continue` skips to the next iteration.',
          },
        ],
      },
    },

    // ===================== SECTION 2 — DATA STRUCTURES & FUNCTIONS =====================
    {
      title: 'Section 2 — Data Structures and Functions',
      description: 'Lists, dictionaries, sets, tuples, and how to write reusable functions.',
      order: 2,
      estimatedHours: 10,
      lessons: [
        {
          title: 'Lists, Tuples, and Slicing',
          description: 'Store ordered collections; access elements by index and range.',
          order: 1,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Lists</h2>
<p>Ordered, mutable, can hold any types. Created with <code>[]</code>.</p>
<pre><code>nums = [3, 1, 4, 1, 5]
nums.append(9)
nums.sort()</code></pre>
<h3>Common methods</h3>
<p><code>append</code>, <code>insert</code>, <code>pop</code>, <code>remove</code>, <code>sort</code>, <code>reverse</code>, <code>index</code>, <code>count</code>.</p>
<h2>Tuples</h2>
<p>Like lists but <em>immutable</em>. Useful for fixed records and as dictionary keys.</p>
<pre><code>point = (3, 4)
x, y = point   # unpacking</code></pre>
<h2>Slicing</h2>
<p><code>seq[start:stop:step]</code> works for any sequence. <code>seq[::-1]</code> reverses.</p>
          `,
          codeExamples: [
            {
              title: 'List mutations and slicing',
              description: 'Add, sort, and slice.',
              code: `nums = [3, 1, 4, 1, 5, 9, 2]
nums.sort()
print(nums)
print(nums[:3])
print(nums[::-1])`,
              language: 'python',
              expectedOutput: '[1, 1, 2, 3, 4, 5, 9]\n[1, 1, 2]\n[9, 5, 4, 3, 2, 1, 1]',
              order: 1,
            },
            {
              title: 'Tuple unpacking',
              description: 'Decompose a tuple into named variables.',
              code: `point = (10, 20, 30)
x, y, z = point
print(x + y + z)`,
              language: 'python',
              expectedOutput: '60',
              order: 2,
            },
          ],
          notes: [
            'Tuples use parentheses; a one-element tuple needs a trailing comma: `(5,)`.',
            '`list2 = list1` is NOT a copy — both names point to the same list.',
            'Use `list1.copy()` or `list1[:]` for a shallow copy.',
          ],
          tips: [
            'Use a list when items may change; a tuple when the shape is fixed.',
            'Slicing is one of Python\'s most powerful idioms — learn it.',
            'For repeated `in` checks on large data, switch to a `set`.',
          ],
        },
        {
          title: 'Dictionaries and Sets',
          description: 'Key-value lookup and unique-membership testing.',
          order: 2,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Dictionaries</h2>
<p>Mapping of keys to values. Created with <code>{}</code>. Average O(1) lookup.</p>
<pre><code>user = {"name": "Alex", "age": 25}
user["email"] = "alex@example.com"
user.get("role", "guest")  # safe lookup with default</code></pre>
<h2>Sets</h2>
<p>Unordered collection of unique items. Fast <code>in</code> checks and set algebra.</p>
<pre><code>a = {1, 2, 3}
b = {3, 4, 5}
a | b   # union {1, 2, 3, 4, 5}
a &amp; b   # intersection {3}</code></pre>
<h3>When to use which</h3>
<p><strong>List</strong>: ordered, allows duplicates. <strong>Dict</strong>: keyed lookup. <strong>Set</strong>: uniqueness and membership testing.</p>
          `,
          codeExamples: [
            {
              title: 'Dict iteration',
              description: 'Walk key/value pairs.',
              code: `scores = {"alex": 90, "beth": 82, "carl": 75}
for name, score in scores.items():
    print(f"{name}: {score}")`,
              language: 'python',
              expectedOutput: 'alex: 90\nbeth: 82\ncarl: 75',
              order: 1,
            },
            {
              title: 'Set deduplication',
              description: 'Convert list to set then back.',
              code: `nums = [3, 1, 4, 1, 5, 9, 2, 6, 5]
unique = sorted(set(nums))
print(unique)`,
              language: 'python',
              expectedOutput: '[1, 2, 3, 4, 5, 6, 9]',
              order: 2,
            },
          ],
          notes: [
            'Dictionaries preserve insertion order in Python 3.7+.',
            'Sets use `{1, 2, 3}` syntax; an empty set is `set()` (not `{}` — that\'s an empty dict).',
            'Both dict keys and set members must be hashable (no lists/dicts as keys).',
          ],
          tips: [
            'Counting? Use `collections.Counter`.',
            'For grouping, prefer dict-of-lists over parallel lists.',
            'Convert to a set first when checking "is X in many items".',
          ],
        },
        {
          title: 'Functions and Comprehensions',
          description: 'Reusable logic with def + the famous list comprehension.',
          order: 3,
          duration: 35,
          difficulty: 'intermediate',
          estimatedHours: 1,
          content: `
<h2>Functions</h2>
<pre><code>def greet(name, message="Hi"):
    return f"{message}, {name}!"

greet("Alex")
greet("Beth", message="Hello")</code></pre>
<p>Functions are <strong>first-class</strong> — you can pass them as arguments and return them from other functions.</p>
<h3>Argument styles</h3>
<ul>
  <li>Defaults: <code>def f(x, n=1):</code></li>
  <li><code>*args</code> — variable positional</li>
  <li><code>**kwargs</code> — variable keyword</li>
</ul>
<h2>List comprehensions</h2>
<p>Compact way to build a list from another iterable.</p>
<pre><code>squares = [n*n for n in range(10)]
evens = [n for n in nums if n % 2 == 0]
pairs = {k: v for k, v in items.items()}</code></pre>
          `,
          codeExamples: [
            {
              title: 'Function with default + return',
              description: 'Reusable greeting.',
              code: `def greet(name, message="Hi"):
    return f"{message}, {name}!"

print(greet("Alex"))
print(greet("Beth", message="Hello"))`,
              language: 'python',
              expectedOutput: 'Hi, Alex!\nHello, Beth!',
              order: 1,
            },
            {
              title: 'List comprehension with filter',
              description: 'Square only even numbers.',
              code: `nums = range(10)
even_squares = [n*n for n in nums if n % 2 == 0]
print(even_squares)`,
              language: 'python',
              expectedOutput: '[0, 4, 16, 36, 64]',
              order: 2,
            },
          ],
          notes: [
            'A function with no `return` returns `None`.',
            'Avoid mutable defaults (`def f(items=[])`) — they\'re shared across calls.',
            'List comps are usually faster than equivalent for-loops.',
          ],
          tips: [
            'Each function should do ONE thing — split if you need "and" in the name.',
            'Write the docstring first; implementation often becomes obvious.',
            'Don\'t nest comprehensions more than 1 level — readability dies.',
          ],
        },
      ],
      quiz: {
        title: 'Section 2 Quiz — Data Structures and Functions',
        description: 'Test your grasp of lists, dicts, functions, and comprehensions.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What does `[n*n for n in range(5)]` evaluate to?',
            options: [
              { text: '[0, 1, 2, 3, 4]', isCorrect: false },
              { text: '[0, 1, 4, 9, 16]', isCorrect: true },
              { text: '[1, 4, 9, 16, 25]', isCorrect: false },
              { text: 'error', isCorrect: false },
            ],
            points: 2,
            explanation: '`range(5)` = 0..4. Squaring each gives 0, 1, 4, 9, 16.',
          },
          {
            type: 'multiple-choice',
            question: 'How do you safely get a dict value when the key may be missing?',
            options: [
              { text: 'd[key]', isCorrect: false },
              { text: 'd.get(key, default)', isCorrect: true },
              { text: 'd.pop(key)', isCorrect: false },
              { text: 'd.find(key)', isCorrect: false },
            ],
            points: 2,
            explanation: '`d[key]` raises KeyError on missing keys; `d.get(key, default)` returns the default.',
          },
          {
            type: 'true-false',
            question: 'Tuples are immutable in Python.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'Tuples cannot be modified after creation — that\'s a defining feature.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is a valid function default-argument signature?',
            options: [
              { text: 'def f(a, b=2, c):', isCorrect: false },
              { text: 'def f(a=1, b, c):', isCorrect: false },
              { text: 'def f(a, b=2, c=3):', isCorrect: true },
              { text: 'def f(a, c, b=2):', isCorrect: true },
            ],
            points: 2,
            explanation: 'Defaults must come AFTER non-default parameters.',
          },
          {
            type: 'multiple-choice',
            question: 'What\'s the difference between `{}` and `set()`?',
            options: [
              { text: 'Both create an empty set', isCorrect: false },
              { text: 'Both create an empty dict', isCorrect: false },
              { text: '{} is an empty dict; set() is an empty set', isCorrect: true },
              { text: 'set() is deprecated', isCorrect: false },
            ],
            points: 1,
            explanation: '`{}` is an empty dict; for an empty set you must call `set()`.',
          },
        ],
      },
    },

    // ===================== SECTION 3 — INTERMEDIATE =====================
    {
      title: 'Section 3 — Intermediate Python',
      description: 'File I/O, error handling, modules, and object-oriented programming.',
      order: 3,
      estimatedHours: 12,
      lessons: [
        {
          title: 'File I/O and Error Handling',
          description: 'Read/write files safely with `with`, catch exceptions with try/except.',
          order: 1,
          duration: 40,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>File I/O</h2>
<p>Always use the <code>with</code> statement — it guarantees the file is closed even if an exception fires.</p>
<pre><code>with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())

with open("out.txt", "w") as f:
    f.write("hello\\n")</code></pre>
<h3>JSON</h3>
<p><code>json.load(f)</code> / <code>json.dump(obj, f, indent=2)</code> for structured data.</p>
<h2>Error Handling</h2>
<pre><code>try:
    risky()
except ValueError as e:
    print(f"bad value: {e}")
except FileNotFoundError:
    print("missing")
finally:
    cleanup()</code></pre>
<p>Catch <strong>specific</strong> types, not bare <code>except:</code>. Use <code>raise CustomError(...)</code> to throw your own.</p>
          `,
          codeExamples: [
            {
              title: 'Safe int parsing',
              description: 'Convert bad input into None.',
              code: `def parse_int(s):
    try:
        return int(s)
    except ValueError:
        return None

print(parse_int("42"))
print(parse_int("hi"))`,
              language: 'python',
              expectedOutput: '42\nNone',
              order: 1,
            },
            {
              title: 'Write then read a file',
              description: 'with-statement ensures close.',
              code: `with open("greet.txt", "w") as f:
    f.write("hello\\nworld\\n")
with open("greet.txt") as f:
    for line in f:
        print(line.strip())`,
              language: 'python',
              expectedOutput: 'hello\nworld',
              order: 2,
            },
          ],
          notes: [
            'Always specify `encoding="utf-8"` for text files.',
            '`finally` runs even when you `return` from inside `try`.',
            'Don\'t use exceptions for normal control flow.',
          ],
          tips: [
            'Use `with` every time — no exceptions.',
            'Catch specific exception types — `except Exception` is too broad.',
            'For huge files, iterate line-by-line instead of `read()`.',
          ],
        },
        {
          title: 'Modules, Packages, and Imports',
          description: 'Organize code across files; use the standard library.',
          order: 2,
          duration: 25,
          difficulty: 'intermediate',
          estimatedHours: 1,
          content: `
<h2>Modules</h2>
<p>Any <code>.py</code> file is a module. Import its names with <code>import</code> or <code>from ... import</code>.</p>
<pre><code>import math
from datetime import date
from math import sqrt as s</code></pre>
<h3>The standard library</h3>
<p>Always check before installing a third-party package: <code>os</code>, <code>sys</code>, <code>json</code>, <code>re</code>, <code>datetime</code>, <code>collections</code>, <code>itertools</code>, <code>pathlib</code>.</p>
<h2>Script vs module</h2>
<pre><code>def main():
    ...

if __name__ == "__main__":
    main()</code></pre>
<p>This pattern lets a file act as both an importable library AND a runnable script.</p>
          `,
          codeExamples: [
            {
              title: 'Standard library imports',
              description: 'math + datetime in one go.',
              code: `import math
from datetime import date

print(math.pi)
print(date.today().year)`,
              language: 'python',
              expectedOutput: '3.141592653589793\n2026',
              order: 1,
            },
            {
              title: 'Renaming with as',
              description: 'Shorten common imports.',
              code: `from math import sqrt as s, pow as p
print(s(16), p(2, 10))`,
              language: 'python',
              expectedOutput: '4.0 1024.0',
              order: 2,
            },
          ],
          notes: [
            'Modules are cached after first import (in `sys.modules`).',
            'Avoid `from module import *` — it pollutes your namespace.',
            'A virtual environment per project (`python -m venv .venv`) keeps deps isolated.',
          ],
          tips: [
            'Group imports: stdlib, third-party, local — blank lines between.',
            'Use absolute imports over relative ones for clarity.',
            'Always check the standard library before pulling in a third-party dep.',
          ],
        },
        {
          title: 'Object-Oriented Programming',
          description: 'Define classes, instances, and inheritance.',
          order: 3,
          duration: 45,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Classes</h2>
<pre><code>class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        return f"{self.name} says woof"

d = Dog("Rex")
d.bark()</code></pre>
<p><code>__init__</code> runs when you create an instance. <code>self</code> is the current instance.</p>
<h2>Inheritance</h2>
<pre><code>class Animal:
    def speak(self): return "..."

class Dog(Animal):
    def speak(self): return "woof"</code></pre>
<p>Use <code>super().__init__()</code> to call the parent\'s initializer.</p>
<h2>Dunder methods</h2>
<p><code>__str__</code>, <code>__repr__</code>, <code>__eq__</code>, <code>__len__</code> customize how built-ins (print, ==, len) treat your class.</p>
          `,
          codeExamples: [
            {
              title: 'Class with __str__',
              description: 'Customize print() output.',
              code: `class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __str__(self):
        return f"({self.x}, {self.y})"

print(Point(3, 4))`,
              language: 'python',
              expectedOutput: '(3, 4)',
              order: 1,
            },
            {
              title: 'Inheritance with super()',
              description: 'Extend instead of rewrite.',
              code: `class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

d = Dog("Rex", "Husky")
print(d.name, d.breed)`,
              language: 'python',
              expectedOutput: 'Rex Husky',
              order: 2,
            },
          ],
          notes: [
            'PascalCase for class names.',
            '`@dataclass` decorator removes a ton of boilerplate for record types.',
            'Prefer composition over inheritance unless there\'s a true is-a relationship.',
          ],
          tips: [
            'Always call `super().__init__()` when overriding `__init__`.',
            'Define `__repr__` for debugging — even if you don\'t need `__str__`.',
            'Use `@property` to turn a method into a computed attribute.',
          ],
        },
      ],
      quiz: {
        title: 'Section 3 Quiz — Intermediate Python',
        description: 'Files, errors, modules, and OOP.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Why use `with open(...)` instead of `open(...)`?',
            options: [
              { text: 'It\'s faster', isCorrect: false },
              { text: 'It auto-closes the file even on exceptions', isCorrect: true },
              { text: 'It allows binary mode', isCorrect: false },
              { text: 'It locks the file', isCorrect: false },
            ],
            points: 2,
            explanation: '`with` ensures `__exit__` is called — closes the file no matter what.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `super().__init__(name)` do?',
            options: [
              { text: 'Calls the parent class constructor with `name`', isCorrect: true },
              { text: 'Creates a new parent instance', isCorrect: false },
              { text: 'Re-runs the current constructor', isCorrect: false },
              { text: 'Throws NotImplementedError', isCorrect: false },
            ],
            points: 2,
            explanation: '`super()` returns a proxy for the parent class; calling its method invokes the parent\'s version.',
          },
          {
            type: 'true-false',
            question: 'Bare `except:` catches all exceptions including KeyboardInterrupt.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'That\'s why bare `except:` is almost always wrong — catch specific types.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `if __name__ == "__main__":` accomplish?',
            options: [
              { text: 'Speeds up imports', isCorrect: false },
              { text: 'Runs the block only when the file is executed directly, not imported', isCorrect: true },
              { text: 'Required for every Python file', isCorrect: false },
              { text: 'Defines the main function', isCorrect: false },
            ],
            points: 2,
            explanation: 'When run directly, `__name__` is `"__main__"`. When imported, it\'s the module name.',
          },
          {
            type: 'multiple-choice',
            question: 'Which import line picks ONLY the `sqrt` function from `math`?',
            options: [
              { text: 'import math', isCorrect: false },
              { text: 'from math import sqrt', isCorrect: true },
              { text: 'import sqrt from math', isCorrect: false },
              { text: 'using math.sqrt', isCorrect: false },
            ],
            points: 1,
            explanation: '`from module import name` imports just one name into your namespace.',
          },
        ],
      },
    },

    // ===================== SECTION 4 — ADVANCED =====================
    {
      title: 'Section 4 — Advanced Python',
      description: 'Decorators, generators, async/await, type hints, and concurrency.',
      order: 4,
      estimatedHours: 10,
      lessons: [
        {
          title: 'Decorators and Generators',
          description: 'Wrap functions with @decorators; stream values with yield.',
          order: 1,
          duration: 45,
          difficulty: 'advanced',
          estimatedHours: 1.5,
          content: `
<h2>Decorators</h2>
<p>A decorator is a function that takes a function and returns a wrapped one. <code>@decorator</code> above <code>def</code> is sugar for <code>fn = decorator(fn)</code>.</p>
<pre><code>from functools import wraps

def log_calls(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@log_calls
def greet(name): return f"Hi, {name}"</code></pre>
<p>Always use <code>@wraps</code> to preserve the wrapped function\'s metadata.</p>
<h2>Generators</h2>
<p>A function with <code>yield</code> becomes a generator — pauses at each <code>yield</code>, resumes on the next call.</p>
<pre><code>def evens():
    n = 0
    while True:
        yield n
        n += 2</code></pre>
<p>Memory-efficient — values produced on demand.</p>
          `,
          codeExamples: [
            {
              title: 'Timing decorator',
              description: 'Measure how long any function takes.',
              code: `import time
from functools import wraps

def timeit(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        t = time.time()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {time.time()-t:.3f}s")
        return result
    return wrapper

@timeit
def work():
    return sum(i*i for i in range(100_000))

work()`,
              language: 'python',
              expectedOutput: 'work took 0.010s',
              order: 1,
            },
            {
              title: 'Generator pipeline',
              description: 'Chain transformations lazily.',
              code: `def numbers():
    for i in range(1, 11):
        yield i

squares = (n*n for n in numbers())
big = (s for s in squares if s > 20)
print(list(big))`,
              language: 'python',
              expectedOutput: '[25, 36, 49, 64, 81, 100]',
              order: 2,
            },
          ],
          notes: [
            'Decorators stack bottom-up: closest one to `def` wraps first.',
            '`@functools.lru_cache` is the easiest speedup for recursive functions.',
            'Generator expressions `(x for x in iter)` are the lazy cousins of list comps.',
          ],
          tips: [
            'Read existing decorators (`@property`, `@dataclass`) before writing your own.',
            'For huge data, use a generator — saves memory dramatically.',
            'Don\'t materialize a generator with `list(gen)` unless you need to iterate it twice.',
          ],
        },
        {
          title: 'Async / Await for I/O',
          description: 'Run many I/O-bound tasks concurrently on a single thread.',
          order: 2,
          duration: 40,
          difficulty: 'advanced',
          estimatedHours: 1.5,
          content: `
<h2>Asyncio</h2>
<p>Python\'s <code>asyncio</code> lets you run many I/O-bound coroutines on one thread by suspending each at <code>await</code> points.</p>
<pre><code>import asyncio

async def fetch(n):
    await asyncio.sleep(0.1)
    return n * n

async def main():
    results = await asyncio.gather(*(fetch(i) for i in range(5)))
    print(results)

asyncio.run(main())</code></pre>
<h3>When to use</h3>
<p>I/O-bound workloads (HTTP, DB, files via async libs). <strong>Not</strong> CPU-bound work — that needs threads or processes.</p>
<h3>Common APIs</h3>
<ul>
  <li><code>asyncio.run(main())</code> — top-level entry</li>
  <li><code>asyncio.gather(*tasks)</code> — wait for all in parallel</li>
  <li><code>asyncio.create_task(coro)</code> — schedule in background</li>
  <li><code>asyncio.wait_for(coro, timeout)</code> — bounded wait</li>
</ul>
          `,
          codeExamples: [
            {
              title: 'gather for parallel work',
              description: 'All run concurrently.',
              code: `import asyncio

async def task(name, t):
    await asyncio.sleep(t)
    return f"{name} done"

async def main():
    results = await asyncio.gather(task("A", 0.1), task("B", 0.1))
    print(results)

asyncio.run(main())`,
              language: 'python',
              expectedOutput: "['A done', 'B done']",
              order: 1,
            },
            {
              title: 'Timeout protection',
              description: 'Cancel slow coroutines.',
              code: `import asyncio

async def slow():
    await asyncio.sleep(5)
    return "done"

async def main():
    try:
        result = await asyncio.wait_for(slow(), timeout=0.1)
    except asyncio.TimeoutError:
        result = "gave up"
    print(result)

asyncio.run(main())`,
              language: 'python',
              expectedOutput: 'gave up',
              order: 2,
            },
          ],
          notes: [
            '`async def` defines a coroutine — calling it returns a coroutine object, not the result.',
            '`await` only works inside `async` functions.',
            'Mixing sync `time.sleep` inside async code freezes the loop — use `asyncio.sleep`.',
          ],
          tips: [
            'Use `httpx` or `aiohttp` for async HTTP instead of `requests`.',
            'For CPU-bound work, use `concurrent.futures.ProcessPoolExecutor`.',
            'Don\'t scatter `asyncio.run()` calls — one at the top of your program.',
          ],
        },
        {
          title: 'Type Hints, Testing, and Concurrency',
          description: 'Round out with mypy-friendly types, pytest, and choosing concurrency primitives.',
          order: 3,
          duration: 50,
          difficulty: 'advanced',
          estimatedHours: 2,
          content: `
<h2>Type Hints</h2>
<pre><code>def average(nums: list[float]) -> float:
    return sum(nums) / len(nums) if nums else 0.0</code></pre>
<p>Hints aren\'t enforced at runtime — but tools (mypy, pyright, IDE) catch mistakes before you run the code.</p>
<h2>Testing with pytest</h2>
<pre><code>def test_add():
    assert 2 + 3 == 5

@pytest.mark.parametrize("n,expected", [(0, True), (1, False)])
def test_is_even(n, expected):
    assert (n % 2 == 0) == expected</code></pre>
<p>Run with <code>pytest</code>. Use fixtures (<code>@pytest.fixture</code>) for shared setup.</p>
<h2>Concurrency</h2>
<table>
  <thead><tr><th>Workload</th><th>Tool</th></tr></thead>
  <tbody>
    <tr><td>Many I/O ops</td><td>asyncio or threads</td></tr>
    <tr><td>CPU-bound</td><td>multiprocessing</td></tr>
  </tbody>
</table>
<p>The GIL means Python threads can\'t run CPU-bound code in parallel. For real parallelism, use processes.</p>
          `,
          codeExamples: [
            {
              title: 'Typed function',
              description: 'IDE and mypy understand the contract.',
              code: `from typing import Optional

def find_user(uid: int) -> Optional[str]:
    users = {1: "Alex", 2: "Beth"}
    return users.get(uid)

print(find_user(1))
print(find_user(99))`,
              language: 'python',
              expectedOutput: 'Alex\nNone',
              order: 1,
            },
            {
              title: 'pytest parametrize',
              description: 'One test, many cases.',
              code: `import pytest

@pytest.mark.parametrize("n,expected", [
    (0, True), (1, False), (2, True), (3, False),
])
def test_is_even(n, expected):
    assert (n % 2 == 0) == expected`,
              language: 'python',
              expectedOutput: '(4 tests pass)',
              order: 2,
            },
          ],
          notes: [
            'Type hints are runtime-erased — they don\'t slow code down.',
            'pytest auto-discovers `test_*` in `test_*.py`.',
            '`@dataclass` + type hints is the modern record-type idiom.',
          ],
          tips: [
            'Start typing the public API of your code first — internal types can follow.',
            'Profile before optimizing concurrency — most code is fast enough.',
            'Use `pytest -x` to stop on first failure during development.',
          ],
        },
      ],
      quiz: {
        title: 'Section 4 Quiz — Advanced Python',
        description: 'Decorators, async, type hints, concurrency.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What does the `@functools.wraps(fn)` decorator do inside a wrapper?',
            options: [
              { text: 'Speeds up the wrapped function', isCorrect: false },
              { text: 'Preserves the wrapped function\'s name and docstring', isCorrect: true },
              { text: 'Caches its return value', isCorrect: false },
              { text: 'Makes it async', isCorrect: false },
            ],
            points: 2,
            explanation: '`@wraps(fn)` copies metadata so the wrapper "looks like" the original function.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is true about Python generators?',
            options: [
              { text: 'They materialize all values immediately', isCorrect: false },
              { text: 'They yield values one at a time, lazily', isCorrect: true },
              { text: 'They can only yield ints', isCorrect: false },
              { text: 'They require asyncio', isCorrect: false },
            ],
            points: 2,
            explanation: 'Generators produce values on demand — memory-efficient for big or infinite sequences.',
          },
          {
            type: 'true-false',
            question: 'Python type hints (`x: int`) are enforced at runtime.',
            options: [
              { text: 'true', isCorrect: false },
              { text: 'false', isCorrect: true },
            ],
            points: 1,
            explanation: 'Type hints are for tools (mypy, IDE). Runtime ignores them by default.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is best for many concurrent HTTP requests?',
            options: [
              { text: 'multiprocessing.Pool', isCorrect: false },
              { text: 'asyncio with aiohttp/httpx', isCorrect: true },
              { text: 'A single thread with requests', isCorrect: false },
              { text: 'subprocess', isCorrect: false },
            ],
            points: 2,
            explanation: 'I/O-bound work shines with async — many requests can wait concurrently on one thread.',
          },
          {
            type: 'multiple-choice',
            question: 'Why doesn\'t Python\'s `threading` parallelize CPU-bound code?',
            options: [
              { text: 'Threads are too slow', isCorrect: false },
              { text: 'The GIL allows only one thread to execute Python bytecode at a time', isCorrect: true },
              { text: 'threading is deprecated', isCorrect: false },
              { text: 'Python has no thread support', isCorrect: false },
            ],
            points: 2,
            explanation: 'The Global Interpreter Lock serializes Python bytecode execution. CPU-bound work needs processes.',
          },
        ],
      },
    },
  ],

  // ============== FINAL QUIZ ==============
  finalQuiz: {
    title: 'Final Quiz — Python Programming: Beginner to Expert',
    description: 'Comprehensive assessment covering all four sections.',
    passingScore: 75,
    timeLimit: 20,
    maxRetakes: 3,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What does `[n*n for n in range(5)]` evaluate to?',
        options: [
          { text: '[0, 1, 2, 3, 4]', isCorrect: false },
          { text: '[0, 1, 4, 9, 16]', isCorrect: true },
          { text: '[1, 4, 9, 16, 25]', isCorrect: false },
          { text: '[0, 4, 16, 36, 64]', isCorrect: false },
        ],
        points: 2,
        explanation: 'List comprehension over `range(5)` (= 0..4), squared.',
      },
      {
        type: 'multiple-choice',
        question: 'What is the output of `print(7 // 2, 7 % 2)`?',
        options: [
          { text: '3.5 1', isCorrect: false },
          { text: '3 1', isCorrect: true },
          { text: '4 0', isCorrect: false },
          { text: '3 0.5', isCorrect: false },
        ],
        points: 2,
        explanation: '`//` is floor division; `%` is the remainder.',
      },
      {
        type: 'multiple-choice',
        question: 'How do you correctly destructure a dict into (key, value) pairs?',
        options: [
          { text: 'for k in d: ...', isCorrect: false },
          { text: 'for k, v in d.items(): ...', isCorrect: true },
          { text: 'for v in d.values(): ...', isCorrect: false },
          { text: 'for k, v in d: ...', isCorrect: false },
        ],
        points: 2,
        explanation: '`d.items()` yields `(key, value)` tuples you can unpack.',
      },
      {
        type: 'true-false',
        question: 'A function in Python with no explicit `return` returns `None`.',
        options: [
          { text: 'true', isCorrect: true },
          { text: 'false', isCorrect: false },
        ],
        points: 1,
        explanation: 'Falling off the end of a function returns `None` implicitly.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is the recommended way to handle "this key might be missing"?',
        options: [
          { text: 'd[key] inside try/except KeyError', isCorrect: false },
          { text: 'd.get(key, default)', isCorrect: true },
          { text: 'if key in d: d[key]', isCorrect: false },
          { text: 'd.pop(key, default)', isCorrect: false },
        ],
        points: 2,
        explanation: '`.get(key, default)` is the cleanest read-with-fallback.',
      },
      {
        type: 'multiple-choice',
        question: 'What does `super().__init__(name)` do in a subclass?',
        options: [
          { text: 'Calls the parent\'s constructor with `name`', isCorrect: true },
          { text: 'Recursively calls the current constructor', isCorrect: false },
          { text: 'Throws NotImplementedError', isCorrect: false },
          { text: 'Creates a new parent instance', isCorrect: false },
        ],
        points: 2,
        explanation: '`super()` proxies the parent class — required when extending.',
      },
      {
        type: 'multiple-choice',
        question: 'What\'s the right way to read a file safely in modern Python?',
        options: [
          { text: 'f = open(path); ...; f.close()', isCorrect: false },
          { text: 'with open(path) as f: ...', isCorrect: true },
          { text: 'open(path).read()', isCorrect: false },
          { text: 'os.read(path)', isCorrect: false },
        ],
        points: 2,
        explanation: '`with` guarantees the file is closed, even on exceptions.',
      },
      {
        type: 'multiple-choice',
        question: 'Which decorator caches return values for repeated calls with the same arguments?',
        options: [
          { text: '@functools.cache_result', isCorrect: false },
          { text: '@functools.lru_cache', isCorrect: true },
          { text: '@memoize', isCorrect: false },
          { text: '@property', isCorrect: false },
        ],
        points: 2,
        explanation: '`@functools.lru_cache` is the standard memoization decorator.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is the safest way to handle a possibly-missing import?',
        options: [
          { text: 'try: import x; except ImportError: x = None', isCorrect: true },
          { text: 'import x as None', isCorrect: false },
          { text: 'from x import *', isCorrect: false },
          { text: 'if x: import x', isCorrect: false },
        ],
        points: 2,
        explanation: 'Wrap the import in try/except ImportError when an optional dependency may be absent.',
      },
      {
        type: 'true-false',
        question: 'Python\'s `asyncio` is the right tool for CPU-bound work that needs to use multiple cores.',
        options: [
          { text: 'true', isCorrect: false },
          { text: 'false', isCorrect: true },
        ],
        points: 2,
        explanation: 'asyncio runs on one thread; for parallel CPU work, use `multiprocessing`.',
      },
    ],
  },
};

export default pythonCourse;
