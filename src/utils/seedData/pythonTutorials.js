// Python beginner → expert curriculum
// 4 modules × 6 tutorials × 3 difficulty bands.
// Order within (module) gives a learner the canonical path.

const t = (data) => ({
  language: 'python',
  isPreGenerated: true,
  isAIgenerated: false,
  createdBy: null,
  isPublished: true,
  ...data,
});

export const pythonTutorials = [
  // ============================================================
  // MODULE 1 — FOUNDATIONS (beginner)
  // ============================================================
  t({
    title: 'Variables and Data Types in Python',
    description: 'Learn how Python stores values and identifies their types automatically.',
    module: 'Foundations',
    concept: 'Variables and Data Types',
    difficulty: 'beginner',
    order: 1,
    estimatedMinutes: 12,
    content: `## Variables and Data Types

A **variable** is a named container that holds a value. In Python you create one by assigning a value with \`=\`. You never declare its type explicitly — Python infers it from the value, and that type can change later (dynamic typing).

### The five most-used built-in types

- **int** — whole numbers: \`age = 25\`
- **float** — decimals: \`price = 9.99\`
- **str** — text: \`name = "Alex"\`
- **bool** — truth values: \`is_admin = True\`
- **NoneType** — absence of a value: \`result = None\`

### Naming rules

- Must start with a letter or underscore
- Can contain letters, digits, underscores
- Case-sensitive: \`age\` and \`Age\` are different
- Convention: lowercase with underscores → \`user_name\`, not \`UserName\`

You can inspect a variable's type with \`type(value)\`.`,
    codeExamples: [
      {
        title: 'Declaring variables of different types',
        description: 'No type keyword — assignment alone creates the variable.',
        code: `name = "Alex"
age = 25
height = 5.9
is_student = True

print(name, age, height, is_student)`,
        input: '',
        expectedOutput: 'Alex 25 5.9 True',
        order: 1,
      },
      {
        title: 'Checking a variable\'s type',
        description: 'type() returns the built-in class of any value.',
        code: `print(type(42))
print(type(3.14))
print(type("hi"))
print(type(True))`,
        input: '',
        expectedOutput: "<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>",
        order: 2,
      },
      {
        title: 'Dynamic typing',
        description: 'The same variable can hold different types over time.',
        code: `x = 10
print(x, type(x))

x = "now I'm a string"
print(x, type(x))`,
        input: '',
        expectedOutput: "10 <class 'int'>\nnow I'm a string <class 'str'>",
        order: 3,
      },
    ],
    notes: [
      'Python infers the type from the value — there is no `int x;` syntax.',
      'snake_case for variables and functions; PascalCase for classes.',
      'None is its own type — use it for "no value yet".',
    ],
    tips: [
      'Pick names that describe meaning, not the type. `user_count` beats `n_int`.',
      'Avoid single letters except in loops or math expressions.',
      'Use `type()` while learning to confirm assumptions about what you stored.',
    ],
    tags: ['basics', 'variables', 'types', 'foundations'],
  }),

  t({
    title: 'Operators and Expressions',
    description: 'Use arithmetic, comparison, and logical operators to compute values.',
    module: 'Foundations',
    concept: 'Operators and Expressions',
    difficulty: 'beginner',
    order: 2,
    estimatedMinutes: 15,
    content: `## Operators and Expressions

An **expression** is anything that produces a value. **Operators** combine values into bigger expressions.

### Arithmetic
\`+\`, \`-\`, \`*\`, \`/\` (float divide), \`//\` (floor divide), \`%\` (modulo / remainder), \`**\` (power)

### Comparison
\`==\`, \`!=\`, \`<\`, \`<=\`, \`>\`, \`>=\` — always return a bool.

### Logical
\`and\`, \`or\`, \`not\` — short-circuit evaluation.

### Assignment shortcuts
\`+=\`, \`-=\`, \`*=\`, \`/=\` modify a variable in place.

### Operator precedence

Higher precedence runs first. \`**\` > \`*\` \`/\` \`%\` > \`+\` \`-\` > comparisons > \`not\` > \`and\` > \`or\`. **Use parentheses** when in doubt — readability matters more than saving keystrokes.`,
    codeExamples: [
      {
        title: 'Arithmetic basics',
        description: 'Note the difference between / and //.',
        code: `print(7 / 2)
print(7 // 2)
print(7 % 2)
print(2 ** 10)`,
        input: '',
        expectedOutput: '3.5\n3\n1\n1024',
        order: 1,
      },
      {
        title: 'Comparison and logical',
        description: 'Combine comparisons with and / or.',
        code: `age = 19
has_id = True

can_vote = age >= 18 and has_id
print(can_vote)
print(age != 21 or has_id)`,
        input: '',
        expectedOutput: 'True\nTrue',
        order: 2,
      },
      {
        title: 'In-place assignment',
        description: 'Compact way to update a variable.',
        code: `score = 10
score += 5
score *= 2
print(score)`,
        input: '',
        expectedOutput: '30',
        order: 3,
      },
    ],
    notes: [
      '`/` always returns a float in Python 3, even when the result is whole.',
      'Comparison chaining is allowed: `1 < x < 10` works as you\'d expect.',
      '`and` / `or` return one of the operands, not always `True`/`False`.',
    ],
    tips: [
      'Wrap mixed-precedence expressions in parentheses for clarity.',
      'Modulo is great for "every Nth": `if i % 5 == 0`.',
      'Use the chained form `if 0 < x < 100` instead of `if x > 0 and x < 100`.',
    ],
    tags: ['operators', 'arithmetic', 'logic', 'foundations'],
  }),

  t({
    title: 'Working with Strings',
    description: 'Format, slice, search, and transform text with Python strings.',
    module: 'Foundations',
    concept: 'Strings',
    difficulty: 'beginner',
    order: 3,
    estimatedMinutes: 18,
    content: `## Strings

A **string** is a sequence of characters surrounded by quotes. Strings in Python are **immutable** — methods return a new string instead of changing the original.

### Creating strings

\`'single'\`, \`"double"\`, and \`"""triple"""\` (which can span lines) all work.

### f-strings (preferred formatting)

Put a value or expression inside \`{}\` directly inside the literal:

\`\`\`python
name = "Alex"
print(f"Hello, {name}!")
\`\`\`

### Indexing and slicing

\`text[0]\` is the first char, \`text[-1]\` is the last. \`text[start:stop]\` returns a substring (stop is exclusive).

### Common methods

\`.upper()\`, \`.lower()\`, \`.strip()\`, \`.split(sep)\`, \`.replace(a, b)\`, \`.startswith()\`, \`.endswith()\`, \`.find(sub)\`, \`len(s)\`.`,
    codeExamples: [
      {
        title: 'f-strings and indexing',
        description: 'Read individual characters with bracket notation.',
        code: `msg = "Hello, Python"
print(msg[0])
print(msg[-1])
print(f"Length: {len(msg)}")`,
        input: '',
        expectedOutput: 'H\nn\nLength: 13',
        order: 1,
      },
      {
        title: 'Slicing',
        description: 'Substrings via [start:stop].',
        code: `text = "abcdefg"
print(text[0:3])
print(text[3:])
print(text[::-1])`,
        input: '',
        expectedOutput: 'abc\ndefg\ngfedcba',
        order: 2,
      },
      {
        title: 'Transforming text',
        description: 'Clean and split a typical user input.',
        code: `raw = "  Hello, World!  "
print(raw.strip().lower())
print("apple,banana,cherry".split(","))`,
        input: '',
        expectedOutput: 'hello, world!\n[\'apple\', \'banana\', \'cherry\']',
        order: 3,
      },
    ],
    notes: [
      'Strings are immutable — `s.replace()` returns a new string; the old one is untouched.',
      'Negative indices count from the end: `s[-1]` is the last character.',
      'You can multiply strings: `"-" * 10` gives `"----------"`.',
    ],
    tips: [
      'Prefer f-strings over `%` formatting and `.format()` — they read clearer.',
      'Use `.strip()` defensively on any input you take from a user.',
      'Slicing with `[::-1]` is the idiomatic way to reverse a string.',
    ],
    tags: ['strings', 'text', 'f-strings', 'foundations'],
  }),

  t({
    title: 'User Input and Output',
    description: 'Read input from the user, print results, and format numeric output.',
    module: 'Foundations',
    concept: 'Input/Output',
    difficulty: 'beginner',
    order: 4,
    estimatedMinutes: 12,
    content: `## Input and Output

### print()

\`print()\` writes to standard output. Multiple args are joined by a space by default. Override with \`sep=\` and end with \`end=\`.

### input()

\`input(prompt)\` pauses, lets the user type, and returns a **string**. To use it as a number, convert with \`int()\` or \`float()\`.

### Formatting numbers in f-strings

\`f"{x:.2f}"\` keeps 2 decimal places. \`f"{n:,}"\` adds thousands separators. \`f"{n:5d}"\` pads to a width of 5.`,
    codeExamples: [
      {
        title: 'print() sep and end',
        description: 'Customize how output joins.',
        code: `print("a", "b", "c", sep="-")
print("loading", end="...")
print("done")`,
        input: '',
        expectedOutput: 'a-b-c\nloading...done',
        order: 1,
      },
      {
        title: 'Reading numeric input',
        description: 'input() always returns a string — convert it.',
        code: `age = int(input("Enter your age: "))
print(f"In 5 years you'll be {age + 5}")`,
        input: '25',
        expectedOutput: "Enter your age: In 5 years you'll be 30",
        order: 2,
      },
      {
        title: 'Number formatting',
        description: 'Decimal places and thousands separators.',
        code: `total = 1234567.891
print(f"{total:.2f}")
print(f"{total:,.2f}")`,
        input: '',
        expectedOutput: '1234567.89\n1,234,567.89',
        order: 3,
      },
    ],
    notes: [
      '`input()` never raises on text input — but `int(input())` will if the user types letters.',
      '`print()` adds a newline at the end unless you pass `end=""`.',
      'Use `:.2f` for currency, `:,d` for grouped integers.',
    ],
    tips: [
      'Wrap `int(input())` in a try/except once you learn error handling (Module 3).',
      'Print debug values with `print(f"{var=}")` — Python prints both the name and the value.',
      'For long output, build a list and use `"\\n".join(items)` rather than many `print` calls.',
    ],
    tags: ['input', 'output', 'print', 'foundations'],
  }),

  t({
    title: 'Conditional Statements (if / elif / else)',
    description: 'Branch your code on conditions using if, elif, and else.',
    module: 'Foundations',
    concept: 'Conditionals',
    difficulty: 'beginner',
    order: 5,
    estimatedMinutes: 15,
    content: `## Conditional Statements

\`if\` runs a block only when its condition is truthy. \`elif\` checks more conditions if the previous ones were false. \`else\` runs when nothing else matched.

### Truthiness

Python evaluates many things as boolean:
- **Falsy**: \`False\`, \`0\`, \`0.0\`, \`None\`, \`""\`, \`[]\`, \`{}\`, \`()\`
- **Truthy**: everything else

That means \`if name:\` is the idiomatic check for "name has content".

### Ternary expression

\`value_if_true if condition else value_if_false\` lets you assign conditionally on one line.

### Match statement (Python 3.10+)

\`match\`/\`case\` provides cleaner branching when comparing one value to many literal alternatives.`,
    codeExamples: [
      {
        title: 'if / elif / else',
        description: 'Classic grading example.',
        code: `score = 78
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"
print(grade)`,
        input: '',
        expectedOutput: 'B',
        order: 1,
      },
      {
        title: 'Truthiness check',
        description: 'Implicit boolean conversion.',
        code: `items = []
if items:
    print("Got items")
else:
    print("Empty")`,
        input: '',
        expectedOutput: 'Empty',
        order: 2,
      },
      {
        title: 'Ternary expression',
        description: 'Conditional assignment in one line.',
        code: `n = 7
parity = "odd" if n % 2 else "even"
print(parity)`,
        input: '',
        expectedOutput: 'odd',
        order: 3,
      },
    ],
    notes: [
      'Indentation defines block scope — be consistent with 4 spaces.',
      'Use truthiness for collections: `if items` is more idiomatic than `if len(items) > 0`.',
      '`match`/`case` exists in Python 3.10+ for pattern-based branching.',
    ],
    tips: [
      'Avoid deep nesting — early `return` or `continue` keeps the main flow readable.',
      'If you have many `elif`s on the same variable, consider a dict mapping or match/case.',
      'Combine conditions with `and`/`or` rather than nesting `if` inside `if`.',
    ],
    tags: ['conditionals', 'if', 'control-flow', 'foundations'],
  }),

  t({
    title: 'Loops: for and while',
    description: 'Repeat work with for-each loops, range, and while loops.',
    module: 'Foundations',
    concept: 'Loops',
    difficulty: 'beginner',
    order: 6,
    estimatedMinutes: 18,
    content: `## Loops

Python has two loop forms: \`for\` (iterate over a sequence) and \`while\` (repeat while a condition is true).

### for + range

\`range(stop)\`, \`range(start, stop)\`, \`range(start, stop, step)\` generate integers. They're memory-efficient — values are produced on demand.

### Iterating over collections

\`for item in items\` walks every element. \`enumerate(items)\` adds an index. \`zip(a, b)\` pairs two iterables.

### Loop control

- \`break\` exits the loop immediately
- \`continue\` skips to the next iteration
- \`else\` on a loop runs only if the loop finished without \`break\``,
    codeExamples: [
      {
        title: 'for with range',
        description: 'Print 0 to 4.',
        code: `for i in range(5):
    print(i, end=" ")`,
        input: '',
        expectedOutput: '0 1 2 3 4 ',
        order: 1,
      },
      {
        title: 'enumerate over a list',
        description: 'Get index and value together.',
        code: `colors = ["red", "green", "blue"]
for index, color in enumerate(colors, start=1):
    print(f"{index}: {color}")`,
        input: '',
        expectedOutput: '1: red\n2: green\n3: blue',
        order: 2,
      },
      {
        title: 'while with break',
        description: 'Loop until a condition is met.',
        code: `n = 1
while True:
    if n * n > 50:
        break
    n += 1
print(n)`,
        input: '',
        expectedOutput: '8',
        order: 3,
      },
    ],
    notes: [
      '`range()` is exclusive of the stop value — `range(5)` yields 0..4.',
      '`for/else` is rare but useful — `else` runs if the loop completed without breaking.',
      'Infinite loops with `while True` need a `break` to ever exit.',
    ],
    tips: [
      'Reach for `enumerate` instead of manually maintaining an index counter.',
      'Use `zip` to walk parallel lists in lockstep.',
      'Prefer `for` over `while` whenever you know what you\'re iterating.',
    ],
    tags: ['loops', 'for', 'while', 'foundations'],
  }),

  // ============================================================
  // MODULE 2 — DATA STRUCTURES & FUNCTIONS (beginner → intermediate)
  // ============================================================
  t({
    title: 'Lists and Tuples',
    description: 'Store ordered collections with mutable lists and immutable tuples.',
    module: 'Data Structures and Functions',
    concept: 'Lists and Tuples',
    difficulty: 'beginner',
    order: 7,
    estimatedMinutes: 18,
    content: `## Lists and Tuples

### Lists — \`[a, b, c]\`

Mutable, ordered, allow duplicates. Indexed from 0. Common methods: \`append\`, \`insert\`, \`remove\`, \`pop\`, \`sort\`, \`reverse\`, \`extend\`.

### Tuples — \`(a, b, c)\`

Immutable, ordered. Useful for fixed records (think coordinates or DB rows) and as dict keys.

### Sequence operations that work on both

- Indexing: \`seq[0]\`, \`seq[-1]\`
- Slicing: \`seq[1:3]\`
- \`len(seq)\`, \`in\`, \`+\`, \`*\`
- \`min\`, \`max\`, \`sum\` for numeric content

### Unpacking

\`a, b, c = (1, 2, 3)\` assigns positions to names. Use \`*rest\` to capture the leftovers: \`first, *rest = [1, 2, 3, 4]\`.`,
    codeExamples: [
      {
        title: 'List basics',
        description: 'Create, append, slice.',
        code: `nums = [3, 1, 4, 1, 5]
nums.append(9)
nums.sort()
print(nums)
print(nums[:3])`,
        input: '',
        expectedOutput: '[1, 1, 3, 4, 5, 9]\n[1, 1, 3]',
        order: 1,
      },
      {
        title: 'Tuple unpacking',
        description: 'Decompose a tuple into named variables.',
        code: `point = (10, 20, 30)
x, y, z = point
print(x + y + z)

first, *rest = [1, 2, 3, 4]
print(first, rest)`,
        input: '',
        expectedOutput: '60\n1 [2, 3, 4]',
        order: 2,
      },
      {
        title: 'Sequence operations',
        description: 'len, in, sum.',
        code: `scores = [88, 92, 75, 60]
print(len(scores))
print(75 in scores)
print(sum(scores) / len(scores))`,
        input: '',
        expectedOutput: '4\nTrue\n78.75',
        order: 3,
      },
    ],
    notes: [
      'Lists use square brackets; tuples use parentheses (commas are what really make a tuple).',
      'A one-element tuple needs a trailing comma: `(5,)` — `(5)` is just an int.',
      'Tuples being immutable makes them hashable, so they work as dict keys.',
    ],
    tips: [
      'Use a list when items might change; a tuple when the shape is fixed.',
      'For repeated `in` checks on large data, switch to a set (next tutorial).',
      'Avoid `list1 = list2` when you want a copy — use `list1 = list2.copy()`.',
    ],
    tags: ['lists', 'tuples', 'collections', 'data-structures'],
  }),

  t({
    title: 'Dictionaries and Sets',
    description: 'Key-value lookup with dictionaries and unique-membership tests with sets.',
    module: 'Data Structures and Functions',
    concept: 'Dictionaries and Sets',
    difficulty: 'beginner',
    order: 8,
    estimatedMinutes: 20,
    content: `## Dictionaries and Sets

### Dictionaries — \`{key: value, ...}\`

Mapping of keys to values. Average O(1) lookup. Keys must be hashable (strings, numbers, tuples). Common operations:

- \`d[key]\` to get, \`d[key] = value\` to set
- \`d.get(key, default)\` for safe lookup
- \`d.keys()\`, \`d.values()\`, \`d.items()\`
- \`key in d\` for membership

### Sets — \`{a, b, c}\`

Unordered collection of unique, hashable items. Fast \`in\` checks and set algebra: \`|\` union, \`&\` intersection, \`-\` difference.

### Why use them

Both give near-constant-time membership tests. Looking up a name in a list of 10,000 items is slow; in a dict or set it's near-instant.`,
    codeExamples: [
      {
        title: 'Dictionary basics',
        description: 'Read, write, iterate.',
        code: `user = {"name": "Alex", "age": 25}
user["email"] = "alex@example.com"

for key, value in user.items():
    print(f"{key}: {value}")`,
        input: '',
        expectedOutput: 'name: Alex\nage: 25\nemail: alex@example.com',
        order: 1,
      },
      {
        title: 'Safe lookup with .get',
        description: 'Avoid KeyError on missing keys.',
        code: `prices = {"apple": 1.0, "banana": 0.5}
print(prices.get("apple", 0))
print(prices.get("grape", 0))`,
        input: '',
        expectedOutput: '1.0\n0',
        order: 2,
      },
      {
        title: 'Set algebra',
        description: 'Union, intersection, difference.',
        code: `a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a | b)
print(a & b)
print(a - b)`,
        input: '',
        expectedOutput: '{1, 2, 3, 4, 5, 6}\n{3, 4}\n{1, 2}',
        order: 3,
      },
    ],
    notes: [
      'Dictionaries preserve insertion order in Python 3.7+.',
      'Use `.get(k, default)` instead of `d[k]` when the key may be missing.',
      'Sets are written with `{}` but an empty set is `set()` — `{}` is an empty dict.',
    ],
    tips: [
      'Counting? Use `collections.Counter` instead of writing your own dict.',
      'For grouped storage, prefer `dict` of lists over parallel lists.',
      'Convert to a set first when checking "is X one of these?" against many candidates.',
    ],
    tags: ['dict', 'set', 'collections', 'data-structures'],
  }),

  t({
    title: 'Functions: Definition and Return Values',
    description: 'Package reusable logic with def, parameters, and return.',
    module: 'Data Structures and Functions',
    concept: 'Functions',
    difficulty: 'beginner',
    order: 9,
    estimatedMinutes: 18,
    content: `## Functions

A **function** is a reusable named block of code. Define it with \`def name(params):\` and call it with \`name(args)\`.

### Return values

\`return value\` ends the function and hands the value back. A function without \`return\` returns \`None\` implicitly.

### Docstrings

A string as the first statement documents the function. Tools (and your future self) read it via \`help(name)\` or \`name.__doc__\`.

### Scope rules

Names inside a function are local by default. To modify a name from the outer scope, use \`global\` (rare) or \`nonlocal\` (for nested functions).`,
    codeExamples: [
      {
        title: 'A function with one parameter',
        description: 'def + return.',
        code: `def square(n):
    """Return n squared."""
    return n * n

print(square(7))`,
        input: '',
        expectedOutput: '49',
        order: 1,
      },
      {
        title: 'Multiple returns and early exit',
        description: 'Return as soon as you know the answer.',
        code: `def first_even(nums):
    for n in nums:
        if n % 2 == 0:
            return n
    return None

print(first_even([1, 3, 5, 8, 9]))`,
        input: '',
        expectedOutput: '8',
        order: 2,
      },
      {
        title: 'Returning a tuple',
        description: 'Bundle several values; unpack at the call site.',
        code: `def stats(nums):
    return min(nums), max(nums), sum(nums) / len(nums)

lo, hi, avg = stats([10, 20, 30, 40])
print(lo, hi, avg)`,
        input: '',
        expectedOutput: '10 40 25.0',
        order: 3,
      },
    ],
    notes: [
      'A function with no `return` returns `None`.',
      'Functions are first-class: assign them to variables, pass them as arguments.',
      'Use `pass` as a placeholder for a function body you haven\'t written yet.',
    ],
    tips: [
      'Each function should do one thing well. If you need "and" in the name, split it.',
      'Prefer return values over modifying globals — pure functions are easier to test.',
      'Write the docstring first; the implementation often becomes obvious.',
    ],
    tags: ['functions', 'def', 'return', 'fundamentals'],
  }),

  t({
    title: 'Function Arguments: defaults, *args, **kwargs',
    description: 'Flexible parameter lists with positional, keyword, default, and variadic arguments.',
    module: 'Data Structures and Functions',
    concept: 'Function Arguments',
    difficulty: 'intermediate',
    order: 10,
    estimatedMinutes: 20,
    content: `## Argument Styles

### Positional and keyword

\`greet("Alex", "hi")\` is positional. \`greet(name="Alex", message="hi")\` is keyword. You can mix them — positional first, then keyword.

### Default arguments

\`def greet(name, message="hello"):\` — \`message\` can be omitted. ⚠️ Never use a mutable default like \`def foo(items=[])\` — that list is shared across all calls.

### \`*args\` — variable positional

\`def add(*nums):\` — \`nums\` becomes a tuple of every positional argument passed.

### \`**kwargs\` — variable keyword

\`def configure(**opts):\` — \`opts\` becomes a dict of every keyword argument.

### Forced keyword-only

Anything after a bare \`*\` in the signature must be passed by name: \`def f(a, *, b)\`.`,
    codeExamples: [
      {
        title: 'Default and keyword arguments',
        description: 'Omit defaults; pass by name for clarity.',
        code: `def greet(name, message="hello", punct="!"):
    return f"{message}, {name}{punct}"

print(greet("Alex"))
print(greet("Beth", punct="?"))`,
        input: '',
        expectedOutput: 'hello, Alex!\nhello, Beth?',
        order: 1,
      },
      {
        title: '*args',
        description: 'Collect any number of positional values.',
        code: `def sum_all(*nums):
    return sum(nums)

print(sum_all(1, 2, 3))
print(sum_all(*[10, 20, 30]))`,
        input: '',
        expectedOutput: '6\n60',
        order: 2,
      },
      {
        title: '**kwargs',
        description: 'Forward keyword arguments to another call.',
        code: `def describe(**facts):
    for k, v in facts.items():
        print(f"{k}={v}")

describe(name="Alex", age=25, role="dev")`,
        input: '',
        expectedOutput: 'name=Alex\nage=25\nrole=dev',
        order: 3,
      },
    ],
    notes: [
      'Use `*args` / `**kwargs` only when you genuinely accept any number — otherwise list them explicitly.',
      'Mutable defaults are evaluated once at definition time. Use `None` and assign inside the body.',
      'Keyword-only arguments (after `*`) make calls self-documenting.',
    ],
    tips: [
      'Pass small fixed values positionally; pass flags / booleans by name.',
      'For configuration-like signatures with many flags, prefer keyword-only.',
      'Unpack lists with `*` and dicts with `**` to forward them as arguments.',
    ],
    tags: ['functions', 'args', 'kwargs', 'defaults'],
  }),

  t({
    title: 'Lambda and Higher-Order Functions',
    description: 'Use lambda, map, filter, and sorted with key= to write expressive functional code.',
    module: 'Data Structures and Functions',
    concept: 'Higher-Order Functions',
    difficulty: 'intermediate',
    order: 11,
    estimatedMinutes: 18,
    content: `## Higher-Order Functions

A **higher-order function** either takes a function as an argument or returns one.

### Lambda expressions

\`lambda x: x * 2\` is a tiny inline function. Use it for short one-off transformations passed to another function. For anything longer than one expression, use \`def\`.

### map, filter, sorted

- \`map(fn, seq)\` — apply \`fn\` to each item
- \`filter(pred, seq)\` — keep items where \`pred(item)\` is truthy
- \`sorted(seq, key=fn)\` — sort by what \`fn\` returns
- \`max\`, \`min\` also accept a \`key=\`

These return lazy iterators (or a new list for \`sorted\`); wrap in \`list(...)\` to materialize.

### Why higher-order

Less boilerplate. More declarative — you say *what* to do, not *how* to loop.`,
    codeExamples: [
      {
        title: 'sorted with a key function',
        description: 'Sort strings by length.',
        code: `words = ["banana", "kiwi", "fig", "strawberry"]
print(sorted(words, key=len))`,
        input: '',
        expectedOutput: "['fig', 'kiwi', 'banana', 'strawberry']",
        order: 1,
      },
      {
        title: 'map and filter',
        description: 'Transform then keep matches.',
        code: `nums = [1, 2, 3, 4, 5]
squares = list(map(lambda n: n * n, nums))
evens = list(filter(lambda n: n % 2 == 0, squares))
print(squares)
print(evens)`,
        input: '',
        expectedOutput: '[1, 4, 9, 16, 25]\n[4, 16]',
        order: 2,
      },
      {
        title: 'Returning a function',
        description: 'A function that builds another function (closure).',
        code: `def multiplier(factor):
    return lambda x: x * factor

triple = multiplier(3)
print(triple(10))`,
        input: '',
        expectedOutput: '30',
        order: 3,
      },
    ],
    notes: [
      'Lambdas can only contain one expression — no statements, no assignments.',
      'A list comprehension is usually clearer than `map`+`filter` for the same task.',
      'Closures capture variables by reference; be careful inside loops.',
    ],
    tips: [
      'Reach for `key=` before writing custom sort logic.',
      'If a lambda has more than one operator or needs a name, just use `def`.',
      '`functools.partial` is often more readable than a lambda when fixing arguments.',
    ],
    tags: ['lambda', 'map', 'filter', 'functional'],
  }),

  t({
    title: 'List Comprehensions and Generator Expressions',
    description: 'Build lists, dicts, and sets concisely with comprehension syntax.',
    module: 'Data Structures and Functions',
    concept: 'Comprehensions',
    difficulty: 'intermediate',
    order: 12,
    estimatedMinutes: 18,
    content: `## Comprehensions

A **comprehension** is a compact way to build a collection from another iterable.

### Forms

- List: \`[expr for x in iterable if condition]\`
- Set: \`{expr for x in iterable}\`
- Dict: \`{k: v for k, v in pairs}\`
- Generator: \`(expr for x in iterable)\` — lazy, returns one value at a time

### When to use which

- **List comp** when you need the result as a list (e.g., to iterate it twice, or for \`len\`).
- **Generator expression** when you'll consume it once — saves memory.
- **Dict / set comp** when the output collection type is dict or set.

### Readability rule

If the comprehension has more than one \`if\` or one \`for\`, split it into a regular loop. Cleverness is not the goal.`,
    codeExamples: [
      {
        title: 'List comprehension with a filter',
        description: 'Square only the even numbers.',
        code: `nums = range(10)
even_squares = [n * n for n in nums if n % 2 == 0]
print(even_squares)`,
        input: '',
        expectedOutput: '[0, 4, 16, 36, 64]',
        order: 1,
      },
      {
        title: 'Dict comprehension',
        description: 'Invert a dict.',
        code: `letters = {"a": 1, "b": 2, "c": 3}
inverted = {v: k for k, v in letters.items()}
print(inverted)`,
        input: '',
        expectedOutput: "{1: 'a', 2: 'b', 3: 'c'}",
        order: 2,
      },
      {
        title: 'Generator expression with sum',
        description: 'Stream values without building a list.',
        code: `total = sum(n * n for n in range(1, 1001))
print(total)`,
        input: '',
        expectedOutput: '333833500',
        order: 3,
      },
    ],
    notes: [
      'Comprehensions are usually faster than the equivalent `for`+`append` loop.',
      'Generator expressions use parentheses and are lazy.',
      'You can nest them, but readability suffers fast — usually not worth it.',
    ],
    tips: [
      'If you find yourself writing `for ... if ...` in a loop just to fill a list, switch to a list comp.',
      'For one-shot processing of large data, use a generator expression to save memory.',
      'Use `any()` and `all()` with generator expressions for short-circuit boolean checks.',
    ],
    tags: ['comprehensions', 'generators', 'functional', 'intermediate'],
  }),

  // ============================================================
  // MODULE 3 — INTERMEDIATE PYTHON (intermediate)
  // ============================================================
  t({
    title: 'File I/O: Reading and Writing Files',
    description: 'Open files safely with `with`, read text and JSON, and write back to disk.',
    module: 'Intermediate Python',
    concept: 'File I/O',
    difficulty: 'intermediate',
    order: 13,
    estimatedMinutes: 22,
    content: `## File I/O

### \`open\` and \`with\`

\`open(path, mode, encoding=...)\` returns a file object. **Always** wrap it in \`with\` so the file is closed even on errors.

### Modes

- \`"r"\` read (default), \`"w"\` write (truncate), \`"a"\` append
- Add \`"b"\` for binary, e.g. \`"rb"\`

### Reading

- \`f.read()\` — entire file as one string
- \`f.readlines()\` — list of lines (each ends with \`\\n\`)
- iterating directly: \`for line in f:\` — memory-efficient, one line at a time

### JSON

\`json.load(f)\` parses; \`json.dump(obj, f)\` writes. Use \`indent=2\` for human-readable output.`,
    codeExamples: [
      {
        title: 'Writing then reading text',
        description: 'with-statement guarantees close.',
        code: `with open("greet.txt", "w", encoding="utf-8") as f:
    f.write("hello\\nworld\\n")

with open("greet.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())`,
        input: '',
        expectedOutput: 'hello\nworld',
        order: 1,
      },
      {
        title: 'Reading and writing JSON',
        description: 'Round-trip a Python dict through a JSON file.',
        code: `import json

data = {"name": "Alex", "scores": [90, 85, 78]}

with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

with open("data.json") as f:
    loaded = json.load(f)
print(loaded["scores"])`,
        input: '',
        expectedOutput: '[90, 85, 78]',
        order: 2,
      },
      {
        title: 'Counting lines without loading the whole file',
        description: 'Generator-style iteration scales to huge files.',
        code: `with open("greet.txt") as f:
    line_count = sum(1 for _ in f)
print(line_count)`,
        input: '',
        expectedOutput: '2',
        order: 3,
      },
    ],
    notes: [
      'Always specify `encoding="utf-8"` for text — Windows defaults differ from Linux.',
      '`"w"` truncates the file. Use `"a"` if you want to append.',
      '`pathlib.Path("file.txt").read_text()` is a one-liner alternative.',
    ],
    tips: [
      'Use `with` *every* time — no exceptions.',
      'For huge files, iterate line-by-line instead of `read()` or `readlines()`.',
      'Validate JSON shape on load — don\'t trust file contents.',
    ],
    tags: ['file', 'io', 'json', 'intermediate'],
  }),

  t({
    title: 'Error Handling: try / except / finally',
    description: 'Catch exceptions, raise your own, and use finally for guaranteed cleanup.',
    module: 'Intermediate Python',
    concept: 'Error Handling',
    difficulty: 'intermediate',
    order: 14,
    estimatedMinutes: 20,
    content: `## Error Handling

When something goes wrong (file missing, bad input, network failure), Python raises an **exception**. Unhandled exceptions crash the program.

### try / except

\`\`\`python
try:
    risky()
except ValueError as e:
    handle(e)
\`\`\`

Catch specific types — \`except Exception\` is too broad and hides bugs.

### Multiple except blocks

\`\`\`python
try:
    ...
except FileNotFoundError:
    ...
except PermissionError:
    ...
\`\`\`

### else / finally

\`else\` runs when no exception was raised. \`finally\` always runs — perfect for cleanup.

### Raising your own

\`raise ValueError("bad input")\` triggers an exception. Create a custom type by subclassing \`Exception\`.`,
    codeExamples: [
      {
        title: 'Catching a specific exception',
        description: 'Convert bad input into a friendly message.',
        code: `def parse_int(s):
    try:
        return int(s)
    except ValueError:
        return None

print(parse_int("42"))
print(parse_int("hi"))`,
        input: '',
        expectedOutput: '42\nNone',
        order: 1,
      },
      {
        title: 'try / except / else / finally',
        description: 'Each clause has a clear job.',
        code: `def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        return "undefined"
    else:
        return result
    finally:
        print("attempted divide")

print(divide(10, 2))
print(divide(1, 0))`,
        input: '',
        expectedOutput: 'attempted divide\n5.0\nattempted divide\nundefined',
        order: 2,
      },
      {
        title: 'Raising a custom exception',
        description: 'Domain-specific error types.',
        code: `class AgeError(Exception):
    pass

def set_age(n):
    if n < 0:
        raise AgeError("age cannot be negative")
    return n

try:
    set_age(-1)
except AgeError as e:
    print(f"caught: {e}")`,
        input: '',
        expectedOutput: 'caught: age cannot be negative',
        order: 3,
      },
    ],
    notes: [
      'Bare `except:` catches *everything* including KeyboardInterrupt — almost never what you want.',
      '`finally` runs even if you `return` from inside the try block.',
      'Custom exception classes are usually one-liners that inherit from `Exception`.',
    ],
    tips: [
      'Catch as narrowly as possible — `except ValueError`, not `except Exception`.',
      'Use exceptions for exceptional conditions, not normal control flow.',
      'Re-raise with `raise` (no arguments) to preserve the original traceback.',
    ],
    tags: ['exceptions', 'try', 'except', 'intermediate'],
  }),

  t({
    title: 'Modules, Packages, and Imports',
    description: 'Organize code across files with import, from, and packages.',
    module: 'Intermediate Python',
    concept: 'Modules and Imports',
    difficulty: 'intermediate',
    order: 15,
    estimatedMinutes: 18,
    content: `## Modules and Packages

A **module** is any \`.py\` file. A **package** is a folder of modules with an \`__init__.py\` (or just a folder in modern Python).

### Importing

- \`import math\` — full module
- \`from math import sqrt, pi\` — specific names
- \`from math import sqrt as s\` — rename
- \`import math as m\` — alias

Avoid \`from module import *\` — it pollutes your namespace and confuses readers.

### The standard library

Hundreds of modules ship with Python: \`os\`, \`sys\`, \`json\`, \`re\`, \`datetime\`, \`collections\`, \`itertools\`, \`pathlib\`. Always check before installing a third-party package.

### Your own modules

If you have \`utils.py\` next to your script, \`import utils\` works. Inside \`utils.py\`, only definitions at top-level run during import — anything inside \`if __name__ == "__main__":\` runs only when the file is executed directly.`,
    codeExamples: [
      {
        title: 'Standard library imports',
        description: 'Use what ships with Python.',
        code: `import math
from datetime import date

print(math.pi)
print(date.today().year)`,
        input: '',
        expectedOutput: '3.141592653589793\n2026',
        order: 1,
      },
      {
        title: 'Selective import with rename',
        description: 'Reduce typing and avoid name clashes.',
        code: `from math import sqrt as s, pow as p
print(s(16))
print(p(2, 10))`,
        input: '',
        expectedOutput: '4.0\n1024.0',
        order: 2,
      },
      {
        title: 'Script vs module pattern',
        description: '__name__ tells you if the file was run directly.',
        code: `def greet(name):
    return f"Hi, {name}"

if __name__ == "__main__":
    print(greet("World"))`,
        input: '',
        expectedOutput: 'Hi, World',
        order: 3,
      },
    ],
    notes: [
      'A module is imported once and cached in `sys.modules`.',
      '`if __name__ == "__main__":` lets a file act as both a library and a script.',
      'Relative imports (`from . import sibling`) only work inside packages.',
    ],
    tips: [
      'Group imports: stdlib, third-party, local — separated by blank lines.',
      'Prefer absolute imports over relative ones for clarity.',
      'Use a virtual environment (`python -m venv .venv`) per project to keep deps isolated.',
    ],
    tags: ['modules', 'imports', 'packages', 'intermediate'],
  }),

  t({
    title: 'Object-Oriented Programming: Classes and Instances',
    description: 'Model concepts with classes — attributes, methods, and __init__.',
    module: 'Intermediate Python',
    concept: 'OOP Basics',
    difficulty: 'intermediate',
    order: 16,
    estimatedMinutes: 22,
    content: `## Classes and Instances

A **class** is a blueprint; an **instance** is one concrete value created from it.

### Defining a class

\`\`\`python
class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        return f"{self.name} says woof"
\`\`\`

- \`__init__\` runs when you create an instance: \`Dog("Rex")\`.
- \`self\` is the current instance — Python passes it automatically.
- Attributes set on \`self\` belong to that instance.

### Class attributes vs instance attributes

A name defined at class level is shared. A name set inside \`__init__\` (via \`self.x = ...\`) is per-instance.

### Dunder methods

Names like \`__str__\`, \`__repr__\`, \`__eq__\` let you customize what \`print()\`, \`==\`, and other operations do for your class.`,
    codeExamples: [
      {
        title: 'A basic class',
        description: '__init__, methods, and self.',
        code: `class Counter:
    def __init__(self, start=0):
        self.value = start

    def inc(self):
        self.value += 1

c = Counter()
c.inc()
c.inc()
c.inc()
print(c.value)`,
        input: '',
        expectedOutput: '3',
        order: 1,
      },
      {
        title: '__str__ for friendly printing',
        description: 'Override how print() displays an instance.',
        code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        return f"Point({self.x}, {self.y})"

p = Point(3, 4)
print(p)`,
        input: '',
        expectedOutput: 'Point(3, 4)',
        order: 2,
      },
      {
        title: 'Class attribute vs instance attribute',
        description: 'Shared default, per-instance override.',
        code: `class Dog:
    species = "Canis"

    def __init__(self, name):
        self.name = name

a = Dog("Rex")
b = Dog("Buddy")
print(a.species, b.species)
print(a.name, b.name)`,
        input: '',
        expectedOutput: 'Canis Canis\nRex Buddy',
        order: 3,
      },
    ],
    notes: [
      'PascalCase for class names; snake_case for everything else.',
      'A method without `self` as its first parameter usually means you forgot it.',
      '`@dataclass` (next tutorial mentions briefly) eliminates a lot of boilerplate.',
    ],
    tips: [
      'Reach for a class when you have related data + behavior. Otherwise a dict or tuple is fine.',
      'Define `__repr__` even if you don\'t need `__str__` — it helps in debugging.',
      'Keep `__init__` short — heavy work belongs in a class method like `from_file`.',
    ],
    tags: ['oop', 'classes', 'init', 'intermediate'],
  }),

  t({
    title: 'Inheritance and Polymorphism',
    description: 'Reuse behavior across classes with inheritance and override methods.',
    module: 'Intermediate Python',
    concept: 'Inheritance',
    difficulty: 'intermediate',
    order: 17,
    estimatedMinutes: 22,
    content: `## Inheritance and Polymorphism

A **subclass** reuses code from a **parent class** and can add or override behavior.

### Syntax

\`\`\`python
class Animal:
    def speak(self):
        return "generic noise"

class Dog(Animal):
    def speak(self):
        return "woof"
\`\`\`

### \`super()\`

Use \`super().__init__(...)\` to call the parent's initializer. This lets you extend without rewriting.

### Polymorphism

Different classes that share method names can be used interchangeably. Code that calls \`x.speak()\` doesn't care if \`x\` is a Dog, Cat, or Bird.

### When NOT to inherit

If you find yourself needing only data, not behavior reuse, **composition** (storing one object inside another) is usually cleaner than inheritance.`,
    codeExamples: [
      {
        title: 'Overriding a method',
        description: 'Subclass replaces parent behavior.',
        code: `class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "woof"

print(Dog().speak())`,
        input: '',
        expectedOutput: 'woof',
        order: 1,
      },
      {
        title: 'super() for extension',
        description: 'Reuse parent init then add your own.',
        code: `class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

d = Dog("Rex", "Husky")
print(d.name, d.breed)`,
        input: '',
        expectedOutput: 'Rex Husky',
        order: 2,
      },
      {
        title: 'Polymorphism over a list',
        description: 'Treat heterogeneous objects uniformly.',
        code: `class Cat:
    def speak(self): return "meow"

class Dog:
    def speak(self): return "woof"

animals = [Cat(), Dog(), Cat()]
print([a.speak() for a in animals])`,
        input: '',
        expectedOutput: "['meow', 'woof', 'meow']",
        order: 3,
      },
    ],
    notes: [
      'Multiple inheritance exists in Python but is rarely needed — keep one parent.',
      '`isinstance(obj, Dog)` checks at runtime if `obj` is a Dog or any subclass.',
      'Abstract classes (`from abc import ABC`) enforce that subclasses implement specific methods.',
    ],
    tips: [
      'Prefer composition over inheritance unless the subclass truly *is a* parent.',
      'Always call `super().__init__()` when overriding `__init__`.',
      'Limit inheritance depth — more than 2 levels usually signals a design issue.',
    ],
    tags: ['oop', 'inheritance', 'polymorphism', 'intermediate'],
  }),

  t({
    title: 'Iterators and Generators',
    description: 'Stream values lazily with __iter__, yield, and generator functions.',
    module: 'Intermediate Python',
    concept: 'Iterators and Generators',
    difficulty: 'intermediate',
    order: 18,
    estimatedMinutes: 22,
    content: `## Iterators and Generators

An **iterator** is anything you can call \`next()\` on. \`for\` loops use iterators behind the scenes.

### Generators with \`yield\`

A function that uses \`yield\` becomes a **generator** — it pauses at each \`yield\` and resumes on the next request. This makes it trivial to produce huge or infinite sequences without storing them all in memory.

\`\`\`python
def count_up(n):
    i = 1
    while i <= n:
        yield i
        i += 1
\`\`\`

### Why generators

- Memory efficient — only one value exists at a time
- Composable — chain generators like a pipeline
- Lazy — work is only done when a value is requested

### itertools

The \`itertools\` module is a goldmine of generator-based building blocks: \`count\`, \`cycle\`, \`chain\`, \`islice\`, \`groupby\`.`,
    codeExamples: [
      {
        title: 'A simple generator',
        description: 'yield pauses and resumes.',
        code: `def squares_up_to(n):
    for i in range(n):
        yield i * i

for sq in squares_up_to(5):
    print(sq, end=" ")`,
        input: '',
        expectedOutput: '0 1 4 9 16 ',
        order: 1,
      },
      {
        title: 'Streaming a huge range',
        description: 'No list materialized — constant memory.',
        code: `def evens():
    n = 0
    while True:
        yield n
        n += 2

from itertools import islice
first_five = list(islice(evens(), 5))
print(first_five)`,
        input: '',
        expectedOutput: '[0, 2, 4, 6, 8]',
        order: 2,
      },
      {
        title: 'Generator pipeline',
        description: 'Chain transformations lazily.',
        code: `def numbers():
    for i in range(1, 11):
        yield i

squares = (n * n for n in numbers())
big_squares = (s for s in squares if s > 20)
print(list(big_squares))`,
        input: '',
        expectedOutput: '[25, 36, 49, 64, 81, 100]',
        order: 3,
      },
    ],
    notes: [
      'A generator function returns a generator object — it doesn\'t run until you iterate.',
      '`next(gen)` advances one step; raises `StopIteration` when exhausted.',
      'Generator expressions `(x for x in iterable)` are the lazy cousins of list comps.',
    ],
    tips: [
      'When processing data that doesn\'t fit in memory, reach for a generator first.',
      'Read about `itertools` — chances are your idea already exists there.',
      'Don\'t materialize with `list(gen)` unless you actually need the full list.',
    ],
    tags: ['generators', 'yield', 'iterators', 'intermediate'],
  }),

  // ============================================================
  // MODULE 4 — ADVANCED PYTHON (advanced)
  // ============================================================
  t({
    title: 'Decorators',
    description: 'Wrap and modify functions with @decorator syntax — for logging, timing, auth.',
    module: 'Advanced Python',
    concept: 'Decorators',
    difficulty: 'advanced',
    order: 19,
    estimatedMinutes: 25,
    content: `## Decorators

A **decorator** is a function that takes a function and returns a (usually wrapped) function. The \`@decorator\` syntax above a \`def\` is just sugar for \`fn = decorator(fn)\`.

### Anatomy

\`\`\`python
def log_calls(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        result = fn(*args, **kwargs)
        print(f"done {fn.__name__}")
        return result
    return wrapper

@log_calls
def greet(name):
    return f"Hi, {name}"
\`\`\`

### Preserving metadata

\`functools.wraps\` keeps the original function's name and docstring on the wrapper. Always use it.

### Decorators with arguments

A decorator factory is a function that returns a decorator. Three layers: parameters → decorator → wrapper.

### Real-world uses

- \`@property\` — turn a method into a computed attribute
- \`@staticmethod\`, \`@classmethod\` — class-level behavior
- \`@functools.lru_cache\` — memoize expensive calls
- Web frameworks: \`@app.route("/")\` registers handlers`,
    codeExamples: [
      {
        title: 'A timing decorator',
        description: 'Wrap any function to measure its duration.',
        code: `import time
from functools import wraps

def timeit(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} took {time.time() - start:.4f}s")
        return result
    return wrapper

@timeit
def work():
    sum(i*i for i in range(100000))

work()`,
        input: '',
        expectedOutput: 'work took 0.0050s',
        order: 1,
      },
      {
        title: 'Decorator with arguments',
        description: 'Parameterize the decorator.',
        code: `def repeat(times):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = fn(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def hi():
    print("hi")

hi()`,
        input: '',
        expectedOutput: 'hi\nhi\nhi',
        order: 2,
      },
      {
        title: 'Memoization with lru_cache',
        description: 'Cache expensive recursive calls.',
        code: `from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(50))`,
        input: '',
        expectedOutput: '12586269025',
        order: 3,
      },
    ],
    notes: [
      'Always use `@functools.wraps(fn)` inside the wrapper to preserve metadata.',
      'Decorators are applied bottom-up: the closest one to `def` wraps first.',
      'A decorator that needs arguments is actually a *decorator factory* — three levels of nesting.',
    ],
    tips: [
      'Read existing decorators (`@property`, `@dataclass`) before writing your own — they\'re usually a great fit.',
      'For class-based decorators, store state on `self` and define `__call__`.',
      '`@lru_cache` is the single biggest speedup for recursive functions that recompute the same calls.',
    ],
    tags: ['decorators', 'functools', 'advanced'],
  }),

  t({
    title: 'Context Managers and the with Statement',
    description: 'Guarantee cleanup with __enter__/__exit__ or @contextmanager.',
    module: 'Advanced Python',
    concept: 'Context Managers',
    difficulty: 'advanced',
    order: 20,
    estimatedMinutes: 20,
    content: `## Context Managers

A **context manager** is any object that defines \`__enter__\` and \`__exit__\`. The \`with\` statement uses them to set up something at the start and reliably tear it down at the end — even if an exception fires.

### Two ways to build one

**Class-based:**
\`\`\`python
class Timer:
    def __enter__(self):
        self.start = time.time()
        return self
    def __exit__(self, exc_type, exc, tb):
        print(time.time() - self.start)
\`\`\`

**Function-based** with \`@contextmanager\`:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.time()
    yield
    print(time.time() - start)
\`\`\`

### Multiple contexts

\`with open(a) as f1, open(b) as f2:\` opens both, closes both no matter what.

### Suppressing exceptions

\`contextlib.suppress(SomeError)\` silently swallows just that error type — useful for "ignore if missing" patterns.`,
    codeExamples: [
      {
        title: '@contextmanager for a temp directory swap',
        description: 'Set up, yield, clean up.',
        code: `from contextlib import contextmanager

@contextmanager
def banner(title):
    print(f"--- {title} start ---")
    yield
    print(f"--- {title} end ---")

with banner("step 1"):
    print("doing work")`,
        input: '',
        expectedOutput: '--- step 1 start ---\ndoing work\n--- step 1 end ---',
        order: 1,
      },
      {
        title: 'Class-based timer',
        description: '__enter__ sets up, __exit__ reports.',
        code: `import time

class Timer:
    def __enter__(self):
        self.start = time.perf_counter()
        return self
    def __exit__(self, *_):
        self.elapsed = time.perf_counter() - self.start
        print(f"took {self.elapsed:.4f}s")

with Timer():
    sum(range(1_000_000))`,
        input: '',
        expectedOutput: 'took 0.0150s',
        order: 2,
      },
      {
        title: 'suppress',
        description: 'Ignore a specific exception type cleanly.',
        code: `from contextlib import suppress

with suppress(FileNotFoundError):
    open("does-not-exist.txt")
print("continued")`,
        input: '',
        expectedOutput: 'continued',
        order: 3,
      },
    ],
    notes: [
      '`__exit__` receives the exception info if one was raised — return True to suppress it.',
      'Generators using `@contextmanager` must yield exactly once.',
      '`contextlib.ExitStack` is great when the number of contexts is determined at runtime.',
    ],
    tips: [
      'Use a context manager any time setup/teardown belong together — files, locks, DB transactions, temp dirs.',
      'For "do X before and after this function", consider a decorator instead.',
      'Add proper error handling in `__exit__` — log or wrap exceptions; don\'t swallow them silently.',
    ],
    tags: ['context-manager', 'with', 'contextlib', 'advanced'],
  }),

  t({
    title: 'Async / Await: Concurrent I/O',
    description: 'Use asyncio to run many I/O-bound tasks concurrently without threads.',
    module: 'Advanced Python',
    concept: 'Async Programming',
    difficulty: 'advanced',
    order: 21,
    estimatedMinutes: 28,
    content: `## Async / Await

Python\'s \`asyncio\` lets you run many I/O-bound operations *concurrently* on a single thread by suspending each one at \`await\` points.

### Coroutines

A function declared with \`async def\` is a **coroutine**. Calling it doesn't execute it — it returns a coroutine object you must \`await\` (or schedule).

### Running

- \`asyncio.run(main())\` is the top-level entry point
- \`asyncio.gather(*tasks)\` runs many coroutines concurrently and waits for all
- \`asyncio.create_task(coro)\` schedules one to run in the background

### When to use

- **Good fit:** network requests, file I/O on async libs, websockets, scraping many URLs
- **Bad fit:** CPU-bound work — that needs threads or processes, not async

### Pitfalls

- You can't call \`await\` outside an \`async\` function
- Blocking calls (regular \`requests\`, \`time.sleep\`) freeze the whole loop — use the async equivalents`,
    codeExamples: [
      {
        title: 'Basic asyncio',
        description: 'Two coroutines running concurrently.',
        code: `import asyncio

async def task(name, delay):
    print(f"{name} start")
    await asyncio.sleep(delay)
    print(f"{name} done")

async def main():
    await asyncio.gather(task("A", 1), task("B", 1))

asyncio.run(main())`,
        input: '',
        expectedOutput: 'A start\nB start\nA done\nB done',
        order: 1,
      },
      {
        title: 'gather with return values',
        description: 'Collect results from multiple awaitables.',
        code: `import asyncio

async def fetch(n):
    await asyncio.sleep(0.1)
    return n * n

async def main():
    results = await asyncio.gather(*(fetch(i) for i in range(5)))
    print(results)

asyncio.run(main())`,
        input: '',
        expectedOutput: '[0, 1, 4, 9, 16]',
        order: 2,
      },
      {
        title: 'Timeout protection',
        description: 'Cancel a coroutine that takes too long.',
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
        input: '',
        expectedOutput: 'gave up',
        order: 3,
      },
    ],
    notes: [
      '`asyncio.run()` is the only place you should start the event loop in modern code.',
      'A coroutine that\'s never awaited produces a "coroutine was never awaited" warning.',
      '`asyncio.create_task` schedules immediately; `gather` awaits all together.',
    ],
    tips: [
      'Replace `requests` with `httpx` or `aiohttp` for async-friendly HTTP.',
      'Don\'t mix sync `time.sleep` inside async code — use `await asyncio.sleep`.',
      'For CPU-bound work, use `concurrent.futures.ProcessPoolExecutor` instead of async.',
    ],
    tags: ['async', 'asyncio', 'concurrency', 'advanced'],
  }),

  t({
    title: 'Type Hints and Static Typing',
    description: 'Annotate function signatures and data classes for better tooling and clarity.',
    module: 'Advanced Python',
    concept: 'Type Hints',
    difficulty: 'advanced',
    order: 22,
    estimatedMinutes: 22,
    content: `## Type Hints

Python is dynamically typed — but you can annotate function signatures and variables. The hints don\'t enforce anything at runtime, but tools (IDE, mypy, pyright) catch mistakes before you run the code.

### Basic syntax

\`\`\`python
def greet(name: str, times: int = 1) -> str:
    return ("Hi, " + name + "\\n") * times

x: list[int] = []
\`\`\`

### Common types

- \`list[int]\`, \`dict[str, float]\`, \`tuple[int, str]\` (Python 3.9+)
- \`Optional[X]\` = \`X | None\` (Python 3.10+)
- \`Union[X, Y]\` = \`X | Y\` (Python 3.10+)
- \`Callable[[int, int], int]\` for functions
- \`Any\` — escape hatch (use sparingly)

### Data classes

\`@dataclass\` auto-generates \`__init__\`, \`__repr__\`, \`__eq__\` from type-annotated class attributes.

### Why bother

- IDEs autocomplete more accurately
- Refactors are safer
- Reviewers understand the contract without reading the body
- mypy catches whole classes of bugs without running tests`,
    codeExamples: [
      {
        title: 'A typed function',
        description: 'IDE will show parameter types on hover.',
        code: `def average(nums: list[float]) -> float:
    return sum(nums) / len(nums) if nums else 0.0

print(average([10.0, 20.0, 30.0]))`,
        input: '',
        expectedOutput: '20.0',
        order: 1,
      },
      {
        title: 'Optional and Union',
        description: 'Express "X or None" in the signature.',
        code: `from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    users = {1: "Alex", 2: "Beth"}
    return users.get(user_id)

print(find_user(1))
print(find_user(99))`,
        input: '',
        expectedOutput: 'Alex\nNone',
        order: 2,
      },
      {
        title: '@dataclass',
        description: 'Less boilerplate for record types.',
        code: `from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float

a = Point(3, 4)
b = Point(3, 4)
print(a)
print(a == b)`,
        input: '',
        expectedOutput: 'Point(x=3, y=4)\nTrue',
        order: 3,
      },
    ],
    notes: [
      'Type hints are not enforced at runtime — they\'re for tooling and humans.',
      '`from __future__ import annotations` lets you use `list[int]` style in older Python.',
      'mypy or pyright catches violations before runtime — wire one into your editor.',
    ],
    tips: [
      'Start typing the public boundary of your code (function signatures) first; the rest can follow.',
      'Avoid `Any` — it disables checking. Use `Unknown` from typing when you genuinely don\'t know.',
      'Pair `@dataclass` with type hints for clean immutable-ish record types.',
    ],
    tags: ['typing', 'mypy', 'dataclasses', 'advanced'],
  }),

  t({
    title: 'Testing with pytest',
    description: 'Write unit tests with pytest assertions, fixtures, and parametrize.',
    module: 'Advanced Python',
    concept: 'Testing',
    difficulty: 'advanced',
    order: 23,
    estimatedMinutes: 25,
    content: `## Testing with pytest

\`pytest\` is the de-facto Python test framework. It discovers any function named \`test_*\` in any file named \`test_*.py\` and runs them.

### Plain assertions

No special API — just \`assert expected == actual\`. pytest rewrites the assertion to give a helpful diff on failure.

### Fixtures

A fixture is a reusable setup. Decorate with \`@pytest.fixture\`; ask for it by parameter name in any test that needs it.

### Parametrize

\`@pytest.mark.parametrize("input,expected", [...])\` runs the same test for many input pairs.

### Catching expected exceptions

\`with pytest.raises(ValueError):\` asserts the wrapped code raises that type.

### Folder structure

\`\`\`
project/
  src/mymod.py
  tests/test_mymod.py
\`\`\`

Run from the project root: \`pytest\` — or \`pytest -k "name"\` to filter, \`pytest -x\` to stop on first failure.`,
    codeExamples: [
      {
        title: 'Basic test',
        description: 'A test is just a function.',
        code: `def add(a, b):
    return a + b

def test_add_positive():
    assert add(2, 3) == 5

def test_add_negative():
    assert add(-1, -1) == -2

# Run pytest to execute both`,
        input: '',
        expectedOutput: '(pytest output)',
        order: 1,
      },
      {
        title: 'Parametrize',
        description: 'One test, many cases.',
        code: `import pytest

def is_even(n):
    return n % 2 == 0

@pytest.mark.parametrize("n,expected", [
    (0, True), (1, False), (2, True), (3, False), (4, True),
])
def test_is_even(n, expected):
    assert is_even(n) == expected`,
        input: '',
        expectedOutput: '(5 tests pass)',
        order: 2,
      },
      {
        title: 'Fixture and pytest.raises',
        description: 'Shared setup; expected exception.',
        code: `import pytest

@pytest.fixture
def numbers():
    return [10, 20, 30]

def average(nums):
    if not nums:
        raise ValueError("empty")
    return sum(nums) / len(nums)

def test_average(numbers):
    assert average(numbers) == 20

def test_average_empty():
    with pytest.raises(ValueError):
        average([])`,
        input: '',
        expectedOutput: '(2 tests pass)',
        order: 3,
      },
    ],
    notes: [
      'pytest auto-discovers `test_*` in `test_*.py` files — no registration needed.',
      'Fixtures with `scope="module"` or `"session"` cache across tests for expensive setup.',
      'Use `pytest-cov` to get coverage numbers alongside results.',
    ],
    tips: [
      'Name tests after the behavior, not the function: `test_returns_zero_for_empty_input`.',
      'One assertion per test is overrated — group related checks if they verify one behavior.',
      'Run `pytest -x --tb=short` during development for fast feedback.',
    ],
    tags: ['pytest', 'testing', 'unit-tests', 'advanced'],
  }),

  t({
    title: 'Concurrency: Threads, Processes, and the GIL',
    description: 'Speed up code with threads, processes, and concurrent.futures.',
    module: 'Advanced Python',
    concept: 'Concurrency',
    difficulty: 'advanced',
    order: 24,
    estimatedMinutes: 28,
    content: `## Concurrency

Python has three concurrency primitives — pick the right tool for the workload.

### The GIL

CPython has a **Global Interpreter Lock**: only one thread executes Python bytecode at a time. That makes threads useless for CPU-bound work, but they still help when threads are *waiting* on I/O.

### Decision matrix

| Workload | Use |
|---|---|
| Many I/O ops (HTTP, files, sockets) | \`asyncio\` or threads |
| CPU-bound (math, parsing big data) | \`multiprocessing\` |
| Mix | combine both |

### concurrent.futures

A high-level wrapper that gives a uniform interface to both. \`ThreadPoolExecutor\` or \`ProcessPoolExecutor\`, then \`.submit()\` or \`.map()\`.

### Synchronization

When threads share state, use \`threading.Lock()\` to prevent races. Better: avoid shared mutable state — pass values through queues.`,
    codeExamples: [
      {
        title: 'ThreadPoolExecutor for parallel I/O',
        description: 'Fetch URLs concurrently.',
        code: `from concurrent.futures import ThreadPoolExecutor
import time

def slow(n):
    time.sleep(0.1)
    return n * n

with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(slow, range(8)))
print(results)`,
        input: '',
        expectedOutput: '[0, 1, 4, 9, 16, 25, 36, 49]',
        order: 1,
      },
      {
        title: 'ProcessPoolExecutor for CPU work',
        description: 'Bypass the GIL with processes.',
        code: `from concurrent.futures import ProcessPoolExecutor

def heavy(n):
    return sum(i*i for i in range(n))

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        results = list(pool.map(heavy, [10_000, 20_000, 30_000]))
    print(results)`,
        input: '',
        expectedOutput: '[(numeric results)]',
        order: 2,
      },
      {
        title: 'Lock for shared state',
        description: 'Prevent races on a shared counter.',
        code: `from threading import Thread, Lock

counter = 0
lock = Lock()

def bump():
    global counter
    for _ in range(10000):
        with lock:
            counter += 1

threads = [Thread(target=bump) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)`,
        input: '',
        expectedOutput: '40000',
        order: 3,
      },
    ],
    notes: [
      'The GIL means CPU-bound threads in CPython don\'t actually run in parallel.',
      'Multiprocessing has overhead — only worth it for tasks that take >100ms each.',
      'Async beats threads for I/O when you control all the libraries you call.',
    ],
    tips: [
      'Profile before optimizing — concurrency adds complexity; make sure it pays off.',
      'For "fetch many URLs", `asyncio` with `aiohttp` is usually the simplest and fastest.',
      'Use queues (`queue.Queue`, `multiprocessing.Queue`) for safe cross-worker communication.',
    ],
    tags: ['concurrency', 'threads', 'multiprocessing', 'gil', 'advanced'],
  }),
];

export default pythonTutorials;
