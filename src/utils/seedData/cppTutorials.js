// C++ beginner → expert curriculum
// 4 modules × 6 tutorials × 3 difficulty bands.

const t = (data) => ({
  language: 'cpp',
  isPreGenerated: true,
  isAIgenerated: false,
  createdBy: null,
  isPublished: true,
  ...data,
});

export const cppTutorials = [
  // ============================================================
  // MODULE 1 — FOUNDATIONS (beginner)
  // ============================================================
  t({
    title: 'Variables, Types, and Constants in C++',
    description: 'Declare variables with the right type, use auto, const, and constexpr.',
    module: 'Foundations',
    concept: 'Variables and Types',
    difficulty: 'beginner',
    order: 1,
    estimatedMinutes: 15,
    content: `## Variables and Types

C++ is **statically typed** — every variable has a type fixed at compile time.

### Core built-in types

- \`int\` — typically 32-bit signed integer
- \`long\`, \`long long\` — wider integers
- \`unsigned int\`, \`unsigned long\` — non-negative versions
- \`float\` — 32-bit floating point
- \`double\` — 64-bit floating point (use this by default for decimals)
- \`char\` — single character
- \`bool\` — \`true\` / \`false\`
- \`std::string\` — text (include \`<string>\`)

### Declaration and initialization

\`\`\`cpp
int age = 25;
double pi{3.14159};   // brace init (preferred, prevents narrowing)
auto count = 0;       // auto deduces int
\`\`\`

### const vs constexpr

- \`const\` — value can't change at runtime
- \`constexpr\` — value known at compile time

### Type safety

C++ catches type errors at compile time. \`int x = "hello";\` won't compile.`,
    codeExamples: [
      {
        title: 'Basic types',
        description: 'Declare and print common types.',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    int age = 25;
    double height = 5.9;
    char grade = 'A';
    bool active = true;
    string name = "Alex";

    cout << name << " " << age << " " << height
         << " " << grade << " " << active << endl;
    return 0;
}`,
        input: '',
        expectedOutput: 'Alex 25 5.9 A 1',
        order: 1,
      },
      {
        title: 'auto + brace initialization',
        description: 'Type deduced; braces prevent narrowing.',
        code: `#include <iostream>
using namespace std;

int main() {
    auto count = 0;
    auto pi = 3.14;
    int total{count + 10};
    // int bad{3.14};   // would NOT compile (narrowing)
    cout << total << " " << pi << endl;
    return 0;
}`,
        input: '',
        expectedOutput: '10 3.14',
        order: 2,
      },
      {
        title: 'const and constexpr',
        description: 'Compile-time constants.',
        code: `#include <iostream>
using namespace std;

constexpr int MAX_USERS = 100;
const double TAX_RATE = 0.05;

int main() {
    cout << MAX_USERS << " " << TAX_RATE << endl;
    return 0;
}`,
        input: '',
        expectedOutput: '100 0.05',
        order: 3,
      },
    ],
    notes: [
      '`auto` deduces the type from the initializer — great for long template types.',
      'Always initialize variables before use; uninitialized locals are undefined behavior.',
      'Use `constexpr` over `const` when the value is truly compile-time-known.',
    ],
    tips: [
      'Prefer brace `{}` initialization — it catches narrowing conversions.',
      'Use `auto` for iterators and complex generic types; spell out simple types for clarity.',
      '`size_t` is the right type for sizes/indices in standard containers.',
    ],
    tags: ['variables', 'types', 'foundations'],
  }),

  t({
    title: 'Operators and Expressions in C++',
    description: 'Arithmetic, comparison, logical, bitwise — and the precedence rules that bite.',
    module: 'Foundations',
    concept: 'Operators',
    difficulty: 'beginner',
    order: 2,
    estimatedMinutes: 15,
    content: `## Operators

### Arithmetic

\`+\`, \`-\`, \`*\`, \`/\`, \`%\` (modulo, integers only). \`int/int\` truncates: \`7/2 == 3\`.

### Comparison

\`==\`, \`!=\`, \`<\`, \`<=\`, \`>\`, \`>=\` — return \`bool\`.

### Logical

\`&&\`, \`||\`, \`!\` — short-circuit. Operate on \`bool\`.

### Bitwise

\`&\`, \`|\`, \`^\`, \`~\`, \`<<\`, \`>>\` — operate on bits of integers. Often used for flags and low-level work.

### Increment / decrement

\`++x\` (prefix, increment then use) vs \`x++\` (postfix, use then increment).

### Assignment shortcuts

\`+=\`, \`-=\`, \`*=\`, \`/=\`, \`%=\`, \`<<=\`, etc.`,
    codeExamples: [
      {
        title: 'Integer vs float division',
        description: 'Mind the truncation.',
        code: `#include <iostream>
using namespace std;
int main() {
    cout << 7 / 2 << endl;
    cout << 7 / 2.0 << endl;
    cout << 7 % 2 << endl;
    return 0;
}`,
        input: '',
        expectedOutput: '3\n3.5\n1',
        order: 1,
      },
      {
        title: 'Prefix vs postfix',
        description: 'They evaluate to different values.',
        code: `#include <iostream>
using namespace std;
int main() {
    int x = 5;
    cout << ++x << endl;
    cout << x++ << endl;
    cout << x << endl;
    return 0;
}`,
        input: '',
        expectedOutput: '6\n6\n7',
        order: 2,
      },
      {
        title: 'Bitwise flags',
        description: 'Compose options as bits.',
        code: `#include <iostream>
using namespace std;
int main() {
    int READ = 1, WRITE = 2, EXEC = 4;
    int flags = READ | EXEC;
    cout << ((flags & READ) != 0) << endl;
    cout << ((flags & WRITE) != 0) << endl;
    return 0;
}`,
        input: '',
        expectedOutput: '1\n0',
        order: 3,
      },
    ],
    notes: [
      'Integer overflow on signed types is undefined behavior — be careful with large math.',
      'Use parentheses around mixed `&&` / `||` expressions.',
      'Prefix `++x` is sometimes faster on heavy objects (no copy).',
    ],
    tips: [
      'Prefer `+=` over `x = x + ...` for readability.',
      'Treat bitwise ops as flag-set tools; don\'t use them as substitutes for boolean logic.',
      'When dividing, cast one side to `double` if you want a float result.',
    ],
    tags: ['operators', 'arithmetic', 'bitwise', 'foundations'],
  }),

  t({
    title: 'Input and Output with cin / cout',
    description: 'Read input safely with cin and getline; format output with manipulators.',
    module: 'Foundations',
    concept: 'Input/Output',
    difficulty: 'beginner',
    order: 3,
    estimatedMinutes: 15,
    content: `## I/O in C++

\`#include <iostream>\` gives you \`std::cin\` (input) and \`std::cout\` (output).

### Output

\`\`\`cpp
cout << "value: " << x << endl;
\`\`\`

\`endl\` writes a newline and flushes. \`"\\n"\` is faster if you don't need the flush.

### Input

\`\`\`cpp
int n;
cin >> n;            // stops at whitespace
\`\`\`

For full lines with spaces:
\`\`\`cpp
string line;
getline(cin, line);
\`\`\`

### Mixing >> and getline

After \`cin >> x\` the newline stays in the buffer. Call \`cin.ignore()\` before \`getline\` or weird empty lines result.

### Formatting

Use \`<iomanip>\` for control: \`setw(8)\`, \`setprecision(2)\`, \`fixed\`, \`hex\`, \`boolalpha\`.`,
    codeExamples: [
      {
        title: 'Basic cin/cout',
        description: 'Read a number, print a greeting.',
        code: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string name;
    int age;
    cout << "Name: ";
    cin >> name;
    cout << "Age: ";
    cin >> age;
    cout << "Hello, " << name << "! You are " << age << ".\\n";
    return 0;
}`,
        input: 'Alex 25',
        expectedOutput: 'Name: Age: Hello, Alex! You are 25.',
        order: 1,
      },
      {
        title: 'getline with full sentence',
        description: 'For input containing spaces.',
        code: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string sentence;
    getline(cin, sentence);
    cout << "You said: " << sentence << "\\n";
    return 0;
}`,
        input: 'Hello world from C++',
        expectedOutput: 'You said: Hello world from C++',
        order: 2,
      },
      {
        title: 'Formatted output',
        description: 'setprecision + fixed for decimals.',
        code: `#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    double pi = 3.14159265358979;
    cout << fixed << setprecision(2) << pi << "\\n";
    cout << setprecision(5) << pi << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3.14\n3.14159',
        order: 3,
      },
    ],
    notes: [
      '`cin >> x` returns the stream; check `if (cin >> x)` to detect bad input.',
      '`endl` flushes the buffer — slow in loops. Prefer `"\\n"` unless you specifically need a flush.',
      'After `cin >> x`, use `cin.ignore()` before `getline` to skip the leftover newline.',
    ],
    tips: [
      'For competitive programming, `sync_with_stdio(false); cin.tie(nullptr);` makes I/O much faster.',
      'Always check the result of `cin >> x` — input may fail.',
      'Prefer `std::format` (C++20) over \`<iomanip>\` for complex formatting.',
    ],
    tags: ['io', 'cin', 'cout', 'foundations'],
  }),

  t({
    title: 'Conditional Statements: if, else, switch',
    description: 'Branch with if/else, switch on integral types, and use ternary expressions.',
    module: 'Foundations',
    concept: 'Conditionals',
    difficulty: 'beginner',
    order: 4,
    estimatedMinutes: 12,
    content: `## Conditional Statements

### if / else if / else

\`\`\`cpp
if (score >= 90) grade = 'A';
else if (score >= 75) grade = 'B';
else grade = 'F';
\`\`\`

Curly braces are optional for single statements — but **always use them** to avoid the "dangling else" trap.

### switch

For integral / enum values. Always include \`break\` or fall-through happens.

\`\`\`cpp
switch (day) {
  case 1: cout << "Mon"; break;
  case 2: cout << "Tue"; break;
  default: cout << "?";
}
\`\`\`

### Ternary

\`condition ? a : b\` — expression form. Use sparingly.

### init-statement (C++17)

\`if (auto x = compute(); x > 0) { ... }\` — declare and check in one statement.`,
    codeExamples: [
      {
        title: 'if / else if / else',
        description: 'Sequential conditions.',
        code: `#include <iostream>
using namespace std;
int main() {
    int score = 82;
    char grade;
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else grade = 'F';
    cout << grade << endl;
    return 0;
}`,
        input: '',
        expectedOutput: 'B',
        order: 1,
      },
      {
        title: 'switch',
        description: 'Compare one value to many cases.',
        code: `#include <iostream>
using namespace std;
int main() {
    int day = 3;
    switch (day) {
      case 1: cout << "Mon"; break;
      case 2: cout << "Tue"; break;
      case 3: cout << "Wed"; break;
      default: cout << "?";
    }
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'Wed',
        order: 2,
      },
      {
        title: 'if with init-statement (C++17)',
        description: 'Scope the variable to the if.',
        code: `#include <iostream>
#include <string>
using namespace std;
int main() {
    if (auto pos = string("hello world").find("world"); pos != string::npos) {
        cout << "found at " << pos << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'found at 6',
        order: 3,
      },
    ],
    notes: [
      '`switch` only works on integral / enum types — not strings.',
      'Always end `case` blocks with `break` unless you genuinely want fall-through.',
      'C++17 init-statements scope a temporary variable to the if/switch body.',
    ],
    tips: [
      'Use early `return` to flatten nested `if`s.',
      'For many cases on the same variable, prefer `switch` (sometimes the compiler optimizes it to a jump table).',
      'Comment intentional fall-through with `[[fallthrough]];` (C++17).',
    ],
    tags: ['conditionals', 'if', 'switch', 'foundations'],
  }),

  t({
    title: 'Loops: for, while, do-while, range-for',
    description: 'Iterate with classic loops and the modern range-based for.',
    module: 'Foundations',
    concept: 'Loops',
    difficulty: 'beginner',
    order: 5,
    estimatedMinutes: 16,
    content: `## Loops

### Classic for

\`\`\`cpp
for (int i = 0; i < n; ++i) { ... }
\`\`\`

### while / do-while

\`while (cond) { ... }\` checks first. \`do { ... } while (cond);\` runs once before checking.

### Range-based for (C++11+)

The cleanest way to walk a container:

\`\`\`cpp
for (auto x : container) { ... }              // copy
for (auto& x : container) { ... }             // reference (modifies)
for (const auto& x : container) { ... }       // read-only reference (fastest)
\`\`\`

### Loop control

\`break\` exits; \`continue\` jumps to the next iteration. Both work in all loop types.

### Reverse iteration

\`for (int i = n - 1; i >= 0; --i)\` or use \`std::rbegin\` / \`std::rend\` with iterators.`,
    codeExamples: [
      {
        title: 'Classic for',
        description: 'Print 1 to 5.',
        code: `#include <iostream>
using namespace std;
int main() {
    for (int i = 1; i <= 5; ++i) cout << i << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '1 2 3 4 5 ',
        order: 1,
      },
      {
        title: 'Range-based for',
        description: 'Walk a vector with const auto&.',
        code: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<string> names = {"Alex", "Beth", "Carl"};
    for (const auto& n : names) cout << n << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'Alex\nBeth\nCarl',
        order: 2,
      },
      {
        title: 'while with break',
        description: 'Loop until a condition.',
        code: `#include <iostream>
using namespace std;
int main() {
    int n = 1;
    while (true) {
        if (n * n > 50) break;
        ++n;
    }
    cout << n << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '8',
        order: 3,
      },
    ],
    notes: [
      'Range-based for handles iterators automatically — works on arrays, vectors, maps, even custom types.',
      'Use `const auto&` to avoid copies of heavy objects.',
      '`++i` (pre-increment) is preferred over `i++` (post-increment) in for loops — sometimes faster for iterators.',
    ],
    tips: [
      'Reach for range-for first; classic for only when you need the index.',
      '`std::accumulate`, `std::for_each`, `std::transform` often replace explicit loops.',
      'Avoid modifying a container while iterating — invalidates iterators.',
    ],
    tags: ['loops', 'range-for', 'foundations'],
  }),

  t({
    title: 'Functions: Declaration, Definition, Overloading',
    description: 'Define functions with parameters, return values, references, defaults, and overloads.',
    module: 'Foundations',
    concept: 'Functions',
    difficulty: 'beginner',
    order: 6,
    estimatedMinutes: 18,
    content: `## Functions

### Definition

\`\`\`cpp
int add(int a, int b) {
    return a + b;
}
\`\`\`

### Declaration vs definition

You can declare a function (prototype) before defining it — common in header files:

\`\`\`cpp
int add(int, int);              // declaration
int add(int a, int b) { ... }   // definition
\`\`\`

### Pass by value, reference, const reference

- **By value** \`int x\` — copy. Cheap for primitives.
- **By reference** \`int& x\` — modify caller's variable.
- **By const reference** \`const T& x\` — read-only, no copy. Use for objects.

### Default arguments

\`int greet(string name, string msg = "hi")\` — caller can omit.

### Overloading

Same name, different parameter types/counts. Resolved at compile time.

### Return types

Prefer \`auto\` return only when the type is obvious; otherwise spell it out for clarity.`,
    codeExamples: [
      {
        title: 'Basic function',
        description: 'Return a value.',
        code: `#include <iostream>
using namespace std;

int square(int n) { return n * n; }

int main() {
    cout << square(7) << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '49',
        order: 1,
      },
      {
        title: 'Pass by reference vs const reference',
        description: 'Modify vs read-only.',
        code: `#include <iostream>
#include <string>
using namespace std;

void shout(string& s) { for (auto& c : s) c = toupper(c); }
size_t length(const string& s) { return s.size(); }

int main() {
    string msg = "hello";
    shout(msg);
    cout << msg << " (" << length(msg) << ")\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'HELLO (5)',
        order: 2,
      },
      {
        title: 'Overloading',
        description: 'Same name, different signatures.',
        code: `#include <iostream>
using namespace std;

int max3(int a, int b, int c) { return max({a, b, c}); }
double max3(double a, double b, double c) { return max({a, b, c}); }

int main() {
    cout << max3(3, 1, 4) << "\\n";
    cout << max3(1.5, 2.7, 0.9) << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '4\n2.7',
        order: 3,
      },
    ],
    notes: [
      'Pass big objects by `const T&` to avoid copies.',
      'Default arguments belong on the declaration (header) — not the definition.',
      'Overloading happens at compile time based on argument types.',
    ],
    tips: [
      'Use `const T&` parameters by default for non-primitive types.',
      'Prefer named functions over giant lambdas for non-trivial logic.',
      'Mark trivial getters `const` (member functions) so they work on const objects.',
    ],
    tags: ['functions', 'parameters', 'overloading', 'foundations'],
  }),

  // ============================================================
  // MODULE 2 — MEMORY, POINTERS, CONTAINERS (beginner → intermediate)
  // ============================================================
  t({
    title: 'Arrays and std::string',
    description: 'Use C-style arrays, std::array, and std::string for text and fixed-size data.',
    module: 'Memory and Containers',
    concept: 'Arrays and Strings',
    difficulty: 'beginner',
    order: 7,
    estimatedMinutes: 18,
    content: `## Arrays and Strings

### C-style arrays

\`int nums[5] = {1, 2, 3, 4, 5};\` — fixed size, decay to pointers, can\'t carry size with them. **Avoid in modern code.**

### std::array

\`std::array<int, 5> nums = {1, 2, 3, 4, 5};\` — fixed-size, knows its size, works with STL.

### std::string

Modern, dynamic-length text. Header: \`<string>\`.

\`\`\`cpp
std::string name = "Alex";
name += " Doe";              // concatenation
name.size(), name.empty(), name.find("Doe")
\`\`\`

### Iteration

Range-for works on all three:

\`\`\`cpp
for (const auto& c : name) cout << c;
\`\`\`

### Common string operations

\`substr(pos, len)\`, \`find(sub)\`, \`replace(pos, len, str)\`, \`std::to_string(n)\`, \`std::stoi("42")\`.`,
    codeExamples: [
      {
        title: 'std::array',
        description: 'Knows its size, works with STL.',
        code: `#include <iostream>
#include <array>
using namespace std;
int main() {
    array<int, 5> nums = {3, 1, 4, 1, 5};
    cout << "size: " << nums.size() << "\\n";
    int total = 0;
    for (int n : nums) total += n;
    cout << "sum: " << total << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'size: 5\nsum: 14',
        order: 1,
      },
      {
        title: 'String operations',
        description: 'substr, find, replace.',
        code: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string s = "Hello, World!";
    cout << s.substr(7, 5) << "\\n";
    cout << s.find("World") << "\\n";
    s.replace(7, 5, "C++");
    cout << s << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'World\n7\nHello, C++!',
        order: 2,
      },
      {
        title: 'String to int',
        description: 'Parse with stoi.',
        code: `#include <iostream>
#include <string>
using namespace std;
int main() {
    string input = "42";
    int n = stoi(input);
    cout << n * 2 << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '84',
        order: 3,
      },
    ],
    notes: [
      'C-style arrays decay to pointers when passed to functions — they lose size info.',
      '`std::string` handles its own memory; never `delete` a string\'s internals.',
      '`stoi("not a number")` throws `std::invalid_argument` — handle it.',
    ],
    tips: [
      'Prefer `std::array` / `std::vector` over C arrays.',
      'Use `string_view` (C++17) for read-only string parameters to avoid copies.',
      '`std::to_string(n)` is the easiest int→string conversion.',
    ],
    tags: ['arrays', 'strings', 'foundations'],
  }),

  t({
    title: 'References vs Pointers',
    description: 'Understand the two ways to refer to a variable indirectly in C++.',
    module: 'Memory and Containers',
    concept: 'References and Pointers',
    difficulty: 'intermediate',
    order: 8,
    estimatedMinutes: 22,
    content: `## References and Pointers

### Reference

\`int& ref = x;\` — an alias. Must be bound at creation, can\'t be reseated, can\'t be null.

### Pointer

\`int* p = &x;\` — holds an address. Can be null, can be reassigned, can do arithmetic.

### Dereferencing

\`*p\` reads / writes through the pointer. \`p->member\` is shorthand for \`(*p).member\`.

### When to use which

- **Reference** — function parameters that should\'t be null
- **Pointer** — optional values (can be null), dynamic allocation, arrays, polymorphism

### nullptr

Use \`nullptr\` (C++11) instead of \`NULL\` or \`0\`.

### & and * in declarations vs expressions

\`int& r = x;\` — declares a reference. \`&x\` — takes the address of x. Same symbol, different meanings depending on context.`,
    codeExamples: [
      {
        title: 'Reference parameter',
        description: 'Modify caller\'s variable.',
        code: `#include <iostream>
using namespace std;

void doubleIt(int& x) { x *= 2; }

int main() {
    int n = 5;
    doubleIt(n);
    cout << n << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '10',
        order: 1,
      },
      {
        title: 'Pointer with optional value',
        description: 'nullptr means "no value".',
        code: `#include <iostream>
using namespace std;

void print(int* p) {
    if (p == nullptr) cout << "no value\\n";
    else cout << *p << "\\n";
}

int main() {
    int x = 42;
    print(&x);
    print(nullptr);
    return 0;
}`,
        input: '',
        expectedOutput: '42\nno value',
        order: 2,
      },
      {
        title: 'Pointer to struct',
        description: 'Use -> for member access.',
        code: `#include <iostream>
using namespace std;

struct Point { int x, y; };

int main() {
    Point p{3, 4};
    Point* ptr = &p;
    cout << ptr->x << ", " << ptr->y << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3, 4',
        order: 3,
      },
    ],
    notes: [
      'References don\'t take space at runtime in many cases — the compiler often optimizes them out.',
      'Dereferencing a null pointer is undefined behavior — usually a crash.',
      '`nullptr` has its own type (`std::nullptr_t`) — safer than `NULL` (which is just `0`).',
    ],
    tips: [
      'Default to references for "must exist" parameters; pointers for "may be missing".',
      'In modern C++, smart pointers (next module) replace raw owning pointers.',
      'Never return a reference or pointer to a local variable — undefined behavior.',
    ],
    tags: ['pointers', 'references', 'memory'],
  }),

  t({
    title: 'Dynamic Memory: new and delete',
    description: 'Allocate memory on the heap with new and free it with delete (and why you should rarely do it).',
    module: 'Memory and Containers',
    concept: 'Dynamic Memory',
    difficulty: 'intermediate',
    order: 9,
    estimatedMinutes: 22,
    content: `## Dynamic Memory

### Stack vs heap

- **Stack** — automatic, fast, limited size, freed when scope ends
- **Heap** — manual, slower, larger, persists until you free it

### new and delete

\`\`\`cpp
int* p = new int(42);
// use *p
delete p;
\`\`\`

For arrays: \`new int[10]\` paired with \`delete[]\`.

### Why you should avoid raw new/delete

- Easy to forget \`delete\` → memory leak
- Easy to \`delete\` twice → undefined behavior
- Exceptions between \`new\` and \`delete\` skip the cleanup

### Use smart pointers instead (covered in advanced module)

\`std::unique_ptr<int>\`, \`std::shared_ptr<int>\`, or just \`std::vector<T>\` for arrays.`,
    codeExamples: [
      {
        title: 'Manual new / delete',
        description: 'Last-resort raw allocation.',
        code: `#include <iostream>
using namespace std;
int main() {
    int* p = new int(42);
    cout << *p << "\\n";
    delete p;          // critical — don\'t forget
    return 0;
}`,
        input: '',
        expectedOutput: '42',
        order: 1,
      },
      {
        title: 'Why this is risky',
        description: 'Exception leaks the allocation.',
        code: `// Anti-pattern
// int* arr = new int[1000];
// risky_work();         // if this throws, arr is leaked
// delete[] arr;

// Better:
// std::vector<int> arr(1000);   // freed automatically`,
        input: '',
        expectedOutput: '(no output)',
        order: 2,
      },
      {
        title: 'Prefer containers',
        description: 'std::vector replaces dynamic arrays.',
        code: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> nums(5, 0);     // 5 ints, all 0
    nums.push_back(10);
    cout << nums.size() << " " << nums.back() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '6 10',
        order: 3,
      },
    ],
    notes: [
      'Every `new` needs a paired `delete`; every `new[]` needs `delete[]`.',
      'Modern C++ rarely uses raw `new` — prefer `make_unique` / `make_shared` / containers.',
      'Memory leaks aren\'t always crashes — they\'re silent until you run out of memory.',
    ],
    tips: [
      'In application code, you should almost never write `new` directly.',
      'When you do, wrap it in RAII — a smart pointer or a class with a destructor.',
      'Run with `valgrind` or AddressSanitizer to catch leaks during testing.',
    ],
    tags: ['memory', 'heap', 'new', 'delete'],
  }),

  t({
    title: 'std::vector and Iterators',
    description: 'Use the most important STL container and iterate it the C++ way.',
    module: 'Memory and Containers',
    concept: 'Vector and Iterators',
    difficulty: 'intermediate',
    order: 10,
    estimatedMinutes: 22,
    content: `## std::vector

\`<vector>\` is the go-to dynamic array. Knows its size, grows automatically, exception-safe.

### Common operations

\`\`\`cpp
vector<int> v;
v.push_back(10);       // add at end
v.pop_back();          // remove last
v[0];                  // unchecked access (fast)
v.at(0);               // checked (throws out_of_range)
v.size(), v.empty();
\`\`\`

### Construction shortcuts

- \`vector<int> v(10, 0)\` — 10 elements all 0
- \`vector<int> v = {1, 2, 3}\` — initializer list
- \`vector<int> v(other.begin(), other.end())\` — copy range

### Iterators

\`v.begin()\`, \`v.end()\` (one-past-last), \`v.rbegin()\`, \`v.rend()\`. Use them with STL algorithms:

\`\`\`cpp
sort(v.begin(), v.end());
auto it = find(v.begin(), v.end(), 42);
\`\`\`

### erase-remove idiom

\`v.erase(remove(v.begin(), v.end(), val), v.end())\` — remove all occurrences of \`val\`.`,
    codeExamples: [
      {
        title: 'Basic vector usage',
        description: 'push_back, range-for, sort.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> v = {3, 1, 4, 1, 5};
    v.push_back(9);
    sort(v.begin(), v.end());
    for (int n : v) cout << n << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '1 1 3 4 5 9 ',
        order: 1,
      },
      {
        title: 'Iterator from algorithm',
        description: 'find returns an iterator.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<string> names = {"Alex", "Beth", "Carl"};
    auto it = find(names.begin(), names.end(), "Beth");
    if (it != names.end()) {
        cout << "found at index " << (it - names.begin()) << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'found at index 1',
        order: 2,
      },
      {
        title: 'erase-remove',
        description: 'Remove all matching values.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> v = {1, 2, 3, 2, 4, 2};
    v.erase(remove(v.begin(), v.end(), 2), v.end());
    for (int n : v) cout << n << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '1 3 4 ',
        order: 3,
      },
    ],
    notes: [
      '`v[i]` is unchecked; `v.at(i)` throws on out-of-range. Use `at` when index might be wrong.',
      'Vector growth: capacity doubles when full — amortized O(1) push_back.',
      'Inserting/erasing in the middle is O(n) — that\'s where lists or deques shine.',
    ],
    tips: [
      'Reserve capacity (`v.reserve(N)`) if you know the final size — avoids reallocations.',
      'Pass vectors by `const reference` to functions to avoid copies.',
      'Use `v.shrink_to_fit()` after big erases if you care about memory.',
    ],
    tags: ['vector', 'stl', 'iterators', 'intermediate'],
  }),

  t({
    title: 'STL Containers: map, set, unordered variants',
    description: 'Use map, set, unordered_map, unordered_set for keyed lookup.',
    module: 'Memory and Containers',
    concept: 'STL Containers',
    difficulty: 'intermediate',
    order: 11,
    estimatedMinutes: 22,
    content: `## STL Associative Containers

### Ordered (tree-based, O(log n))

- \`std::set<T>\` — unique sorted elements
- \`std::map<K, V>\` — sorted key-value pairs
- \`std::multiset\`, \`std::multimap\` — allow duplicates

### Unordered (hash-based, O(1) average)

- \`std::unordered_set<T>\`
- \`std::unordered_map<K, V>\`

### Choosing

- Need keys sorted? Use \`map\`/\`set\`.
- Don\'t care about order, want max speed? Use \`unordered_*\`.

### Common operations

\`\`\`cpp
map<string, int> ages;
ages["alex"] = 25;          // insert or assign
auto it = ages.find("beth"); // it == ages.end() if missing
ages.count("alex");          // 0 or 1
ages.erase("alex");
\`\`\`

### Iteration

\`for (const auto& [key, value] : map_obj)\` — structured bindings (C++17) make iteration clean.`,
    codeExamples: [
      {
        title: 'map for word counts',
        description: 'Build a histogram.',
        code: `#include <iostream>
#include <map>
#include <string>
using namespace std;
int main() {
    map<string, int> counts;
    for (const string& w : {"a", "b", "a", "c", "b", "a"}) {
        counts[w]++;
    }
    for (const auto& [word, n] : counts) {
        cout << word << ": " << n << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'a: 3\nb: 2\nc: 1',
        order: 1,
      },
      {
        title: 'Safe lookup',
        description: 'find vs operator[].',
        code: `#include <iostream>
#include <unordered_map>
using namespace std;
int main() {
    unordered_map<string, int> prices = {{"apple", 1}, {"banana", 2}};
    auto it = prices.find("grape");
    if (it == prices.end()) cout << "missing\\n";
    else cout << it->second << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'missing',
        order: 2,
      },
      {
        title: 'set for uniqueness',
        description: 'Automatic deduplication.',
        code: `#include <iostream>
#include <set>
using namespace std;
int main() {
    set<int> seen;
    for (int x : {3, 1, 4, 1, 5, 9, 2, 6, 5}) seen.insert(x);
    cout << seen.size() << " unique\\n";
    for (int x : seen) cout << x << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '7 unique\n1 2 3 4 5 6 9 ',
        order: 3,
      },
    ],
    notes: [
      '`operator[]` on a `map` INSERTS a default value if the key is missing — use `find` for read-only lookups.',
      '`unordered_map` requires the key type to be hashable; custom types need a hash function.',
      'C++17 structured bindings (`auto [k, v] = ...`) make iteration much cleaner.',
    ],
    tips: [
      'Use `unordered_map` by default; reach for `map` when you need sorted iteration.',
      'For string keys with many lookups, both `map` and `unordered_map` are fast — measure if it matters.',
      'Use `try_emplace` to insert only if the key is missing (avoid double-lookups).',
    ],
    tags: ['map', 'set', 'unordered', 'stl', 'intermediate'],
  }),

  t({
    title: 'Lambdas and std::function',
    description: 'Inline anonymous functions and how to store them generically.',
    module: 'Memory and Containers',
    concept: 'Lambdas',
    difficulty: 'intermediate',
    order: 12,
    estimatedMinutes: 20,
    content: `## Lambdas

A **lambda** is an inline anonymous function (C++11+).

### Syntax

\`\`\`cpp
[capture](parameters) -> return_type { body }
\`\`\`

The return type is usually inferred — drop \`-> type\` unless you need to be explicit.

### Captures

- \`[]\` — capture nothing
- \`[=]\` — capture all used variables by value
- \`[&]\` — capture all by reference
- \`[x]\` — capture x by value
- \`[&x]\` — capture x by reference
- \`[x, &y]\` — mixed

### When to use

- Inline predicates for STL algorithms
- Callbacks
- Short, single-use logic

### std::function

\`std::function<int(int)>\` is a polymorphic wrapper that can hold any callable matching the signature — function pointers, lambdas, member functions.`,
    codeExamples: [
      {
        title: 'Lambda with sort',
        description: 'Custom comparator inline.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> nums = {3, 1, 4, 1, 5, 9, 2};
    sort(nums.begin(), nums.end(), [](int a, int b) { return a > b; });
    for (int n : nums) cout << n << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '9 5 4 3 2 1 1 ',
        order: 1,
      },
      {
        title: 'Lambda capturing local state',
        description: 'Carry context into the callback.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> nums = {10, 20, 30, 40, 50};
    int threshold = 25;
    int count = count_if(nums.begin(), nums.end(),
                         [threshold](int n) { return n > threshold; });
    cout << count << " items above " << threshold << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3 items above 25',
        order: 2,
      },
      {
        title: 'std::function as callback',
        description: 'Store any callable.',
        code: `#include <iostream>
#include <functional>
using namespace std;

void apply(int n, function<void(int)> f) { f(n); }

int main() {
    apply(5, [](int x) { cout << x * 2 << "\\n"; });
    apply(5, [](int x) { cout << x + 100 << "\\n"; });
    return 0;
}`,
        input: '',
        expectedOutput: '10\n105',
        order: 3,
      },
    ],
    notes: [
      'Lambdas have a unique anonymous type — `auto` is the easiest way to store them.',
      'Capture by reference can outlive the captured variable — careful with returning lambdas.',
      '`std::function` has overhead (heap allocation, type erasure) — prefer templates / `auto` in hot paths.',
    ],
    tips: [
      'Default to `[&]` only when the lambda is consumed immediately; otherwise be explicit.',
      'For short throwaway logic, lambdas beat named function objects.',
      'Use `mutable` lambdas if you need to modify by-value captures internally.',
    ],
    tags: ['lambdas', 'functional', 'std-function', 'intermediate'],
  }),

  // ============================================================
  // MODULE 3 — OBJECT-ORIENTED PROGRAMMING (intermediate)
  // ============================================================
  t({
    title: 'Classes and Objects',
    description: 'Define classes with data members, member functions, and access specifiers.',
    module: 'Object-Oriented Programming',
    concept: 'Classes and Objects',
    difficulty: 'intermediate',
    order: 13,
    estimatedMinutes: 22,
    content: `## Classes

A **class** packages data and the functions that operate on it.

### Definition

\`\`\`cpp
class User {
public:
    User(std::string n) : name(n) {}
    std::string greet() const { return "Hi, " + name; }
private:
    std::string name;
};
\`\`\`

### Access specifiers

- \`public\` — accessible from anywhere
- \`private\` — accessible only inside the class
- \`protected\` — accessible inside the class and derived classes

Default access for \`class\` is \`private\`; for \`struct\` it\'s \`public\`. Same mechanism, different defaults.

### const member functions

A function marked \`const\` after the parameter list cannot modify any non-mutable data members. Use \`const\` on every getter that doesn\'t change state.

### this pointer

Inside a member function, \`this\` is a pointer to the current object.`,
    codeExamples: [
      {
        title: 'A basic class',
        description: 'Constructor, member function, private data.',
        code: `#include <iostream>
#include <string>
using namespace std;

class Counter {
    int value = 0;
public:
    void inc() { ++value; }
    int get() const { return value; }
};

int main() {
    Counter c;
    c.inc(); c.inc(); c.inc();
    cout << c.get() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3',
        order: 1,
      },
      {
        title: 'Member initializer list',
        description: 'Initialize members efficiently.',
        code: `#include <iostream>
#include <string>
using namespace std;

class Point {
public:
    Point(int x, int y) : x_(x), y_(y) {}
    void print() const { cout << x_ << ", " << y_ << "\\n"; }
private:
    int x_, y_;
};

int main() {
    Point p(3, 4);
    p.print();
    return 0;
}`,
        input: '',
        expectedOutput: '3, 4',
        order: 2,
      },
      {
        title: 'this in a method',
        description: 'Return *this for chaining.',
        code: `#include <iostream>
using namespace std;

class Builder {
    int val = 0;
public:
    Builder& add(int n) { val += n; return *this; }
    int build() const { return val; }
};

int main() {
    cout << Builder().add(1).add(10).add(100).build() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '111',
        order: 3,
      },
    ],
    notes: [
      'Convention: trailing underscore (`name_`) for private data members — separates them from local names.',
      'Member initializer lists run before the constructor body — required for references and `const` members.',
      '`this` is always a pointer, even from a method called on a stack object.',
    ],
    tips: [
      'Make every read-only method `const`.',
      'Use `struct` for "just data" types; `class` for types with invariants.',
      'Initialize all members in the initializer list, not the constructor body.',
    ],
    tags: ['classes', 'oop', 'intermediate'],
  }),

  t({
    title: 'Constructors, Destructors, and RAII',
    description: 'Use constructors and destructors to manage resources automatically (RAII).',
    module: 'Object-Oriented Programming',
    concept: 'RAII',
    difficulty: 'intermediate',
    order: 14,
    estimatedMinutes: 22,
    content: `## Constructors, Destructors, RAII

### Default, parameterized, copy, move

\`\`\`cpp
class C {
public:
    C();                            // default
    C(int n);                       // parameterized
    C(const C& other);              // copy
    C(C&& other);                   // move (C++11+)
    ~C();                           // destructor
};
\`\`\`

### RAII — Resource Acquisition Is Initialization

A constructor acquires a resource (file, memory, lock). A destructor releases it. Stack objects guarantee cleanup at scope exit — **even when an exception is thrown**.

### Rule of Zero / Three / Five

- **Rule of Zero**: design classes so the compiler-generated special members do the right thing — preferred.
- **Rule of Three**: if you write any of (destructor, copy ctor, copy assignment), write all three.
- **Rule of Five**: add move ctor + move assignment for C++11+.

### Delete and default

\`\`\`cpp
C(const C&) = delete;   // disable copy
C() = default;          // ask for compiler default
\`\`\``,
    codeExamples: [
      {
        title: 'RAII for a file handle',
        description: 'Destructor closes the file no matter what.',
        code: `#include <iostream>
#include <fstream>
using namespace std;

void writeAndLog() {
    ofstream out("log.txt");
    out << "hello\\n";
    // out is closed automatically when scope exits
}

int main() {
    writeAndLog();
    cout << "done\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'done',
        order: 1,
      },
      {
        title: 'Constructor / destructor lifecycle',
        description: 'See when they run.',
        code: `#include <iostream>
using namespace std;

class Trace {
public:
    Trace(string n) : name(n) { cout << "+ " << name << "\\n"; }
    ~Trace()                 { cout << "- " << name << "\\n"; }
private:
    string name;
};

int main() {
    Trace a("outer");
    {
        Trace b("inner");
    }
    return 0;
}`,
        input: '',
        expectedOutput: '+ outer\n+ inner\n- inner\n- outer',
        order: 2,
      },
      {
        title: 'Disable copy',
        description: 'Make a class non-copyable.',
        code: `#include <iostream>
using namespace std;

class Unique {
public:
    Unique() = default;
    Unique(const Unique&) = delete;
    Unique& operator=(const Unique&) = delete;
};

int main() {
    Unique a;
    // Unique b = a;  // won\'t compile
    cout << "ok\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'ok',
        order: 3,
      },
    ],
    notes: [
      'Destructors are called in REVERSE order of construction — important for dependent resources.',
      'If you write any custom destructor / copy / move, follow the Rule of Five.',
      'RAII is THE idiom — don\'t fight it. Use it for files, locks, memory, sockets.',
    ],
    tips: [
      'Default to the "Rule of Zero" — let the compiler generate special members.',
      'Use `= delete` to explicitly forbid copy/move when ownership is unique.',
      'For complex resources, use a helper class (or smart pointer) rather than writing your own destructor.',
    ],
    tags: ['constructors', 'destructors', 'raii', 'intermediate'],
  }),

  t({
    title: 'Inheritance and Virtual Functions',
    description: 'Derive classes, override methods, and use virtual for runtime polymorphism.',
    module: 'Object-Oriented Programming',
    concept: 'Inheritance',
    difficulty: 'intermediate',
    order: 15,
    estimatedMinutes: 22,
    content: `## Inheritance

\`\`\`cpp
class Animal {
public:
    virtual std::string speak() const { return "..."; }
    virtual ~Animal() = default;        // CRITICAL — see below
};

class Dog : public Animal {
public:
    std::string speak() const override { return "woof"; }
};
\`\`\`

### virtual

Without \`virtual\`, calls through a base pointer always invoke the base version (static dispatch). With \`virtual\`, the runtime picks the derived version (dynamic dispatch).

### override and final

\`override\` makes the compiler check you actually overrode something. \`final\` prevents further overriding.

### Virtual destructor

If you delete a derived object through a base pointer, the destructor must be \`virtual\` — otherwise the derived destructor is skipped and resources leak.

### Public / protected / private inheritance

Almost always \`public\`. Other forms exist but are rarely the right choice.`,
    codeExamples: [
      {
        title: 'Polymorphism with virtual',
        description: 'Base pointer calls derived method.',
        code: `#include <iostream>
#include <vector>
#include <memory>
using namespace std;

class Animal {
public:
    virtual string speak() const { return "..."; }
    virtual ~Animal() = default;
};

class Dog : public Animal {
public: string speak() const override { return "woof"; }
};

class Cat : public Animal {
public: string speak() const override { return "meow"; }
};

int main() {
    vector<unique_ptr<Animal>> zoo;
    zoo.push_back(make_unique<Dog>());
    zoo.push_back(make_unique<Cat>());
    for (auto& a : zoo) cout << a->speak() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'woof\nmeow',
        order: 1,
      },
      {
        title: 'override catches typos',
        description: 'Compiler error if there\'s nothing to override.',
        code: `#include <iostream>
using namespace std;

class Base {
public:
    virtual void run() {}
};

class Derived : public Base {
public:
    void run() override {}
    // void runn() override {}   // compile error — no match
};

int main() { return 0; }`,
        input: '',
        expectedOutput: '(no output)',
        order: 2,
      },
      {
        title: 'super-like call: Base::method',
        description: 'Invoke the parent version explicitly.',
        code: `#include <iostream>
using namespace std;

class Animal {
public:
    virtual void greet() const { cout << "(animal) "; }
};

class Dog : public Animal {
public:
    void greet() const override {
        Animal::greet();
        cout << "woof\\n";
    }
};

int main() {
    Dog().greet();
    return 0;
}`,
        input: '',
        expectedOutput: '(animal) woof',
        order: 3,
      },
    ],
    notes: [
      'Always declare base-class destructors `virtual` if you intend to delete through a base pointer.',
      'Use `override` on every overriding function — it\'s self-documenting and catches typos.',
      'C++ supports multiple inheritance, but use it sparingly (interfaces / mixins).',
    ],
    tips: [
      'Prefer composition over inheritance unless there\'s a true *is-a* relationship.',
      'Mark methods you don\'t want overridden with `final`.',
      'For runtime polymorphism, use smart pointers (`std::unique_ptr<Base>`).',
    ],
    tags: ['inheritance', 'polymorphism', 'virtual', 'intermediate'],
  }),

  t({
    title: 'Abstract Classes and Interfaces',
    description: 'Define pure-virtual interfaces and prevent instantiation of base classes.',
    module: 'Object-Oriented Programming',
    concept: 'Abstract Classes',
    difficulty: 'intermediate',
    order: 16,
    estimatedMinutes: 18,
    content: `## Abstract Classes

A class with at least one **pure virtual** function (\`= 0\`) is **abstract** — you can\'t instantiate it.

\`\`\`cpp
class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};
\`\`\`

### Interface idiom

A class with only pure virtual functions (no data, public destructor) acts as an interface. Other classes implement it.

### Why use them

- Force subclasses to implement key behavior
- Code against an interface, not a concrete type
- Enable test doubles / mocks

### Concrete implementations

Each derived class implements every pure virtual function. Forgetting one keeps the derived class abstract too.`,
    codeExamples: [
      {
        title: 'Pure virtual',
        description: 'Force derived classes to implement.',
        code: `#include <iostream>
#include <memory>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
    double r;
public:
    Circle(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
};

int main() {
    unique_ptr<Shape> s = make_unique<Circle>(5);
    cout << s->area() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '78.5397',
        order: 1,
      },
      {
        title: 'Interface with several implementations',
        description: 'Strategy pattern.',
        code: `#include <iostream>
#include <vector>
#include <memory>
using namespace std;

class Logger {
public:
    virtual void log(const string& msg) const = 0;
    virtual ~Logger() = default;
};

class ConsoleLogger : public Logger {
public: void log(const string& m) const override { cout << "[C] " << m << "\\n"; }
};

class PrefixLogger : public Logger {
    string prefix;
public:
    PrefixLogger(string p) : prefix(p) {}
    void log(const string& m) const override { cout << prefix << " " << m << "\\n"; }
};

int main() {
    vector<unique_ptr<Logger>> loggers;
    loggers.push_back(make_unique<ConsoleLogger>());
    loggers.push_back(make_unique<PrefixLogger>("[X]"));
    for (auto& l : loggers) l->log("hello");
    return 0;
}`,
        input: '',
        expectedOutput: '[C] hello\n[X] hello',
        order: 2,
      },
      {
        title: 'Cannot instantiate abstract',
        description: 'Compiler enforces this.',
        code: `// class Shape { public: virtual double area() const = 0; };
// Shape s;          // ERROR — cannot instantiate abstract class
// Use Shape* / unique_ptr<Shape> with a concrete subclass.`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      'A pure virtual function can have a definition — derived classes can call it via `Base::fn()`.',
      'Use abstract base classes when you want to enforce a contract.',
      'C++ doesn\'t have a separate `interface` keyword — abstract classes serve the same role.',
    ],
    tips: [
      'Keep interfaces small — fewer methods, easier to implement and mock.',
      'Always include a virtual destructor in an interface class.',
      'Avoid data members in interfaces — it locks the layout for implementers.',
    ],
    tags: ['abstract', 'interfaces', 'virtual', 'intermediate'],
  }),

  t({
    title: 'Operator Overloading',
    description: 'Customize +, ==, <<, [], () and other operators for your own types.',
    module: 'Object-Oriented Programming',
    concept: 'Operator Overloading',
    difficulty: 'intermediate',
    order: 17,
    estimatedMinutes: 22,
    content: `## Operator Overloading

C++ lets you define what operators mean for your types — make them act like built-ins.

### Common ones to overload

- \`==\`, \`!=\` — equality (often paired)
- \`<\`, \`<=\`, \`>\`, \`>=\` — comparison (C++20: define \`<=>\` and the rest come free)
- \`+\`, \`-\`, \`*\`, \`/\` — arithmetic (often paired with \`+=\`, etc.)
- \`<<\`, \`>>\` — stream insertion / extraction
- \`[]\` — subscript
- \`()\` — call (makes the object a "function object" / functor)

### Member vs free function

- Symmetric binary operators (\`+\`, \`==\`) often work better as free functions
- \`<<\` for output MUST be a free function — left side is the stream
- \`[]\`, \`()\`, \`->\` must be member functions

### Don't overload everything

If the meaning isn\'t obvious from the operator, don\'t overload it. \`+\` for "add two Money values" — good. \`+\` for "concatenate emails" — confusing.`,
    codeExamples: [
      {
        title: 'Equality and stream output',
        description: 'Two of the most common overloads.',
        code: `#include <iostream>
using namespace std;

struct Point {
    int x, y;
    bool operator==(const Point& o) const {
        return x == o.x && y == o.y;
    }
};

ostream& operator<<(ostream& os, const Point& p) {
    return os << "(" << p.x << ", " << p.y << ")";
}

int main() {
    Point a{3, 4}, b{3, 4};
    cout << a << " == " << b << ": " << (a == b) << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '(3, 4) == (3, 4): 1',
        order: 1,
      },
      {
        title: 'Arithmetic overload',
        description: 'Vector-like addition.',
        code: `#include <iostream>
using namespace std;

struct Vec {
    double x, y;
    Vec operator+(const Vec& o) const { return {x + o.x, y + o.y}; }
};

int main() {
    Vec a{1, 2}, b{3, 4};
    Vec c = a + b;
    cout << c.x << ", " << c.y << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '4, 6',
        order: 2,
      },
      {
        title: 'Functor with operator()',
        description: 'Object that acts like a function.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct GreaterThan {
    int threshold;
    bool operator()(int n) const { return n > threshold; }
};

int main() {
    vector<int> v = {1, 5, 8, 3, 9, 2};
    int n = count_if(v.begin(), v.end(), GreaterThan{4});
    cout << n << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3',
        order: 3,
      },
    ],
    notes: [
      'Operators can\'t change arity — `==` always takes two operands.',
      'C++20 introduces `<=>` (spaceship) — define one, get all six comparison operators automatically.',
      'Overloading should never surprise the reader — preserve operator semantics.',
    ],
    tips: [
      'For arithmetic, define `+=` first and derive `+` from it. Same for `-=` / `-` etc.',
      'Always pair `==` and `!=` (or use C++20 spaceship).',
      'Free-function overloads of `+`, `==`, `<<` allow mixed-type combinations more naturally.',
    ],
    tags: ['operators', 'overloading', 'intermediate'],
  }),

  t({
    title: 'Exception Handling',
    description: 'Throw, catch, and define your own exception types.',
    module: 'Object-Oriented Programming',
    concept: 'Exception Handling',
    difficulty: 'intermediate',
    order: 18,
    estimatedMinutes: 20,
    content: `## Exceptions

\`throw\` raises an exception; \`try/catch\` handles it.

\`\`\`cpp
try {
    risky();
} catch (const std::runtime_error& e) {
    std::cerr << e.what() << "\\n";
} catch (...) {
    std::cerr << "unknown\\n";
}
\`\`\`

### Standard exception types

From \`<stdexcept>\`: \`std::logic_error\`, \`std::runtime_error\`, \`std::invalid_argument\`, \`std::out_of_range\`, \`std::overflow_error\`.

### Custom exceptions

Inherit from \`std::exception\` (or one of its derived types) and override \`what()\`.

### When to use exceptions

- **Use**: truly exceptional failure (file missing, network broken, contract violated)
- **Don\'t use**: expected control flow (user pressed cancel, item not found)

### noexcept

Mark functions that shouldn\'t throw with \`noexcept\` — the compiler optimizes around it. Move constructors should be \`noexcept\` when possible.`,
    codeExamples: [
      {
        title: 'Throw and catch',
        description: 'Standard exception types.',
        code: `#include <iostream>
#include <stdexcept>
using namespace std;

int divide(int a, int b) {
    if (b == 0) throw invalid_argument("division by zero");
    return a / b;
}

int main() {
    try {
        cout << divide(10, 0) << "\\n";
    } catch (const invalid_argument& e) {
        cerr << "caught: " << e.what() << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'caught: division by zero',
        order: 1,
      },
      {
        title: 'Custom exception',
        description: 'Domain-specific error.',
        code: `#include <iostream>
#include <stdexcept>
#include <string>
using namespace std;

class NotFound : public runtime_error {
public:
    NotFound(string what) : runtime_error("Not found: " + what) {}
};

int main() {
    try {
        throw NotFound("user 42");
    } catch (const NotFound& e) {
        cout << e.what() << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'Not found: user 42',
        order: 2,
      },
      {
        title: 'RAII + exception safety',
        description: 'Stack cleanup happens during unwind.',
        code: `#include <iostream>
using namespace std;

struct Trace {
    string name;
    Trace(string n) : name(n) { cout << "+ " << name << "\\n"; }
    ~Trace()                  { cout << "- " << name << "\\n"; }
};

int main() {
    try {
        Trace a("a");
        throw runtime_error("boom");
    } catch (...) {
        cout << "caught\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: '+ a\n- a\ncaught',
        order: 3,
      },
    ],
    notes: [
      'Catching by reference (`const std::exception& e`) avoids slicing.',
      'Throwing in a destructor is dangerous — usually means terminate.',
      'Don\'t use exceptions for normal control flow — they\'re slow on the throw path.',
    ],
    tips: [
      'Throw by value, catch by const reference — convention.',
      'For "not found" / "missing", prefer `std::optional<T>` over throwing.',
      'Mark non-throwing functions `noexcept` — improves move semantics and helps the optimizer.',
    ],
    tags: ['exceptions', 'try-catch', 'intermediate'],
  }),

  // ============================================================
  // MODULE 4 — ADVANCED C++ (advanced)
  // ============================================================
  t({
    title: 'Templates: Functions and Classes',
    description: 'Write generic code with function templates and class templates.',
    module: 'Advanced C++',
    concept: 'Templates',
    difficulty: 'advanced',
    order: 19,
    estimatedMinutes: 25,
    content: `## Templates

Templates let you write code that works on any type. The compiler generates a concrete version for each type you use.

### Function templates

\`\`\`cpp
template <typename T>
T max3(T a, T b, T c) { return std::max({a, b, c}); }
\`\`\`

Call: \`max3(1, 2, 3)\` (compiler deduces \`T\`) or \`max3<double>(1, 2, 3)\` (explicit).

### Class templates

\`\`\`cpp
template <typename T>
class Box {
    T value;
public:
    Box(T v) : value(v) {}
    T get() const { return value; }
};
\`\`\`

Use: \`Box<int> a(5)\` (pre-C++17) or \`Box b(5)\` (CTAD, C++17+).

### Concepts (C++20)

\`\`\`cpp
template <std::integral T>
T add(T a, T b) { return a + b; }
\`\`\`

Constrains \`T\` to integer-like types. Much better error messages than older SFINAE.`,
    codeExamples: [
      {
        title: 'Function template',
        description: 'Works for int, double, string, etc.',
        code: `#include <iostream>
using namespace std;

template <typename T>
T add(T a, T b) { return a + b; }

int main() {
    cout << add(1, 2) << "\\n";
    cout << add(1.5, 2.5) << "\\n";
    cout << add<string>("foo", "bar") << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '3\n4\nfoobar',
        order: 1,
      },
      {
        title: 'Class template',
        description: 'Generic Box.',
        code: `#include <iostream>
using namespace std;

template <typename T>
class Box {
    T value;
public:
    Box(T v) : value(v) {}
    T get() const { return value; }
};

int main() {
    Box<int> a(5);
    Box<string> b("hi");
    cout << a.get() << " " << b.get() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '5 hi',
        order: 2,
      },
      {
        title: 'Variadic template',
        description: 'Accept any number of arguments.',
        code: `#include <iostream>
using namespace std;

template <typename... Args>
void print(Args... args) {
    ((cout << args << " "), ...);
    cout << "\\n";
}

int main() {
    print(1, "two", 3.0, true);
    return 0;
}`,
        input: '',
        expectedOutput: '1 two 3 1 ',
        order: 3,
      },
    ],
    notes: [
      'Templates are compiled per use — error messages can be huge.',
      'Definitions usually go in headers (or you must explicitly instantiate).',
      'C++20 concepts make constraints much more readable than old SFINAE tricks.',
    ],
    tips: [
      'Start with concrete code, then turn the type into a template parameter.',
      'Use C++20 concepts when available — they give clearer errors.',
      'Use `auto` to receive template results when the type is hard to spell.',
    ],
    tags: ['templates', 'generics', 'advanced'],
  }),

  t({
    title: 'Smart Pointers: unique_ptr and shared_ptr',
    description: 'Replace raw pointers and new/delete with RAII-managed smart pointers.',
    module: 'Advanced C++',
    concept: 'Smart Pointers',
    difficulty: 'advanced',
    order: 20,
    estimatedMinutes: 22,
    content: `## Smart Pointers

\`<memory>\` header. They own a heap allocation and free it automatically.

### std::unique_ptr

Exclusive ownership. Cannot be copied, only moved. Zero overhead vs raw pointer.

\`\`\`cpp
auto p = std::make_unique<Widget>(args);
p->doStuff();
// freed automatically at end of scope
\`\`\`

### std::shared_ptr

Reference-counted shared ownership. Heavier — atomic refcount, may allocate control block.

\`\`\`cpp
auto p = std::make_shared<Widget>(args);
auto q = p;       // both keep it alive
\`\`\`

### std::weak_ptr

Non-owning view of a \`shared_ptr\`. Breaks reference cycles. \`weak.lock()\` returns a \`shared_ptr\` if the object is still alive.

### Don't mix raw and smart

If something owns an object, give it a smart pointer. Pass raw pointers / references for "borrow without owning".`,
    codeExamples: [
      {
        title: 'unique_ptr',
        description: 'Make and use.',
        code: `#include <iostream>
#include <memory>
using namespace std;

struct Widget {
    int id;
    Widget(int i) : id(i) { cout << "+ " << id << "\\n"; }
    ~Widget()             { cout << "- " << id << "\\n"; }
};

int main() {
    auto p = make_unique<Widget>(7);
    cout << p->id << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '+ 7\n7\n- 7',
        order: 1,
      },
      {
        title: 'shared_ptr',
        description: 'Both pointers keep it alive.',
        code: `#include <iostream>
#include <memory>
using namespace std;

int main() {
    auto p = make_shared<int>(42);
    {
        auto q = p;
        cout << "refs: " << p.use_count() << "\\n";
    }
    cout << "refs: " << p.use_count() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'refs: 2\nrefs: 1',
        order: 2,
      },
      {
        title: 'unique_ptr in a container',
        description: 'Owns polymorphic objects.',
        code: `#include <iostream>
#include <vector>
#include <memory>
using namespace std;

class Shape { public: virtual double area() const = 0; virtual ~Shape() = default; };
class Square : public Shape { public: Square(double s):s(s){} double area() const override { return s*s; } double s; };
class Circle : public Shape { public: Circle(double r):r(r){} double area() const override { return 3.14*r*r; } double r; };

int main() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Square>(2));
    shapes.push_back(make_unique<Circle>(1));
    for (auto& s : shapes) cout << s->area() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '4\n3.14',
        order: 3,
      },
    ],
    notes: [
      '`make_unique` / `make_shared` are exception-safe — prefer them over `new`.',
      '`shared_ptr` has atomic refcount overhead; use only when you actually share ownership.',
      'Cyclic `shared_ptr` references leak — break with `weak_ptr`.',
    ],
    tips: [
      'Default to `unique_ptr`. Switch to `shared_ptr` only when several owners are needed.',
      'Pass raw pointers/references to "borrow" — never `shared_ptr` by value for that.',
      'Avoid `release()` unless you really need the raw pointer.',
    ],
    tags: ['smart-pointers', 'unique_ptr', 'shared_ptr', 'memory', 'advanced'],
  }),

  t({
    title: 'Move Semantics and rvalue References',
    description: 'Avoid expensive copies by moving resources instead.',
    module: 'Advanced C++',
    concept: 'Move Semantics',
    difficulty: 'advanced',
    order: 21,
    estimatedMinutes: 25,
    content: `## Move Semantics

### lvalue vs rvalue

- **lvalue** — named, has an address. \`int x = 5; x = 10;\` — \`x\` is lvalue.
- **rvalue** — temporary. \`5\`, \`x + 1\`, function return values.

### Rvalue references — \`T&&\`

A reference that only binds to rvalues. Lets you write functions that "steal" resources.

### Move constructor / assignment

\`\`\`cpp
class Buffer {
    char* data;
    size_t n;
public:
    Buffer(Buffer&& o) noexcept : data(o.data), n(o.n) {
        o.data = nullptr; o.n = 0;
    }
};
\`\`\`

The moved-from object is left in a valid-but-unspecified state.

### std::move

\`std::move(x)\` casts an lvalue to an rvalue reference — opt-in to moving.

### Why it matters

Returning a vector by value used to copy thousands of elements. Move semantics makes it free.`,
    codeExamples: [
      {
        title: 'std::move avoids copy',
        description: 'Source string becomes empty after move.',
        code: `#include <iostream>
#include <string>
#include <utility>
using namespace std;

int main() {
    string a = "hello world, this is a long string";
    string b = move(a);
    cout << "a: [" << a << "]\\n";
    cout << "b: [" << b << "]\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'a: []\nb: [hello world, this is a long string]',
        order: 1,
      },
      {
        title: 'Move constructor saves work',
        description: 'See when copy vs move happens.',
        code: `#include <iostream>
#include <vector>
using namespace std;

struct Trace {
    Trace() { cout << "ctor\\n"; }
    Trace(const Trace&) { cout << "copy\\n"; }
    Trace(Trace&&) noexcept { cout << "move\\n"; }
};

int main() {
    vector<Trace> v;
    v.reserve(3);
    v.push_back(Trace{});
    v.push_back(Trace{});
    v.push_back(Trace{});
    return 0;
}`,
        input: '',
        expectedOutput: 'ctor\nmove\nctor\nmove\nctor\nmove',
        order: 2,
      },
      {
        title: 'Returning by value is cheap',
        description: 'RVO + move semantics.',
        code: `#include <iostream>
#include <vector>
using namespace std;

vector<int> makeNumbers() {
    vector<int> v(1000, 7);
    return v;   // moved, not copied
}

int main() {
    vector<int> n = makeNumbers();
    cout << n.size() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '1000',
        order: 3,
      },
    ],
    notes: [
      '`std::move` doesn\'t actually move — it just casts to `T&&`, telling the compiler "you may move this".',
      'After `std::move(x)`, x is valid but has unspecified state — only call methods that say so in the docs.',
      'Move constructors / assignment should be `noexcept` for STL containers to use them.',
    ],
    tips: [
      'Mark move constructors / assignments `noexcept` whenever possible.',
      'Don\'t use `std::move` on the return value of a function — RVO is smarter.',
      'Use perfect forwarding (`std::forward<T>`) inside generic functions to preserve value categories.',
    ],
    tags: ['move', 'rvalue', 'performance', 'advanced'],
  }),

  t({
    title: 'STL Algorithms',
    description: 'Use std::sort, std::find, std::transform, std::accumulate, and the ranges library.',
    module: 'Advanced C++',
    concept: 'STL Algorithms',
    difficulty: 'advanced',
    order: 22,
    estimatedMinutes: 22,
    content: `## STL Algorithms

The \`<algorithm>\` and \`<numeric>\` headers provide hundreds of generic operations on iterator ranges.

### Greatest hits

- \`sort(first, last)\`, \`stable_sort\`, \`partial_sort\`
- \`find(first, last, value)\`, \`find_if\`, \`count_if\`
- \`for_each(first, last, fn)\`
- \`transform(first, last, dest, fn)\` — map equivalent
- \`copy\`, \`copy_if\`, \`unique\`
- \`accumulate(first, last, init)\` — reduce / sum
- \`min_element\`, \`max_element\`, \`minmax_element\`

### Predicates

Almost every algorithm has a \`_if\` variant taking a predicate. Most accept any callable — lambdas, function pointers, function objects.

### C++20 ranges

The \`<ranges>\` library lets you compose algorithms with the pipe operator:

\`\`\`cpp
auto result = nums
    | std::views::filter([](int n) { return n > 0; })
    | std::views::transform([](int n) { return n * n; });
\`\`\``,
    codeExamples: [
      {
        title: 'sort + accumulate',
        description: 'Two common building blocks.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main() {
    vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6, 5};
    sort(v.begin(), v.end());
    int total = accumulate(v.begin(), v.end(), 0);
    cout << "min: " << v.front() << "\\n";
    cout << "max: " << v.back() << "\\n";
    cout << "sum: " << total << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'min: 1\nmax: 9\nsum: 36',
        order: 1,
      },
      {
        title: 'transform + count_if',
        description: 'Squared then filtered.',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> nums = {1, 2, 3, 4, 5};
    vector<int> squares(nums.size());
    transform(nums.begin(), nums.end(), squares.begin(),
              [](int n) { return n * n; });
    int big = count_if(squares.begin(), squares.end(),
                       [](int n) { return n > 10; });
    cout << big << " squares > 10\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '2 squares > 10',
        order: 2,
      },
      {
        title: 'sort with custom comparator',
        description: 'Sort by string length descending.',
        code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    vector<string> words = {"kiwi", "strawberry", "fig", "banana"};
    sort(words.begin(), words.end(),
         [](const string& a, const string& b) { return a.size() > b.size(); });
    for (const auto& w : words) cout << w << " ";
    cout << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'strawberry banana kiwi fig ',
        order: 3,
      },
    ],
    notes: [
      'Most algorithms take iterator pairs — `(first, last)` half-open ranges.',
      '`std::sort` averages O(n log n) using introsort.',
      'C++20 `std::ranges::sort` lets you pass containers directly — `ranges::sort(v)`.',
    ],
    tips: [
      'Reach for STL algorithms before writing a custom loop — they\'re tested, fast, and intentional.',
      'Use C++20 ranges for declarative pipelines if your compiler supports them.',
      'For "is X in container", `find` + comparison with `end()` is the idiom — or `contains` (C++23).',
    ],
    tags: ['stl', 'algorithms', 'sort', 'advanced'],
  }),

  t({
    title: 'Concurrency with std::thread and std::async',
    description: 'Run code on multiple threads, share data safely with mutex, and get results back with futures.',
    module: 'Advanced C++',
    concept: 'Concurrency',
    difficulty: 'advanced',
    order: 23,
    estimatedMinutes: 25,
    content: `## Concurrency

### std::thread

\`\`\`cpp
std::thread t([]{ doWork(); });
t.join();    // wait for it
\`\`\`

Must \`join\` or \`detach\` every thread before its destructor runs.

### std::mutex

Protects shared data from race conditions.

\`\`\`cpp
std::mutex m;
std::lock_guard<std::mutex> lock(m);  // released at scope exit
\`\`\`

\`std::scoped_lock\` (C++17) handles multiple mutexes deadlock-free.

### std::async / std::future

Easier than raw threads. Returns a \`future\` you wait on.

\`\`\`cpp
auto f = std::async(std::launch::async, doWork);
int result = f.get();
\`\`\`

### Atomic

\`std::atomic<int> counter\` — lock-free integer for simple shared counters.

### Don't share mutable state if you can avoid it

Pass copies, return values, use channels / queues. Concurrency bugs are the hardest to debug.`,
    codeExamples: [
      {
        title: 'Thread with join',
        description: 'Run work in parallel, wait for it.',
        code: `#include <iostream>
#include <thread>
using namespace std;

void work(int id) {
    cout << "worker " << id << "\\n";
}

int main() {
    thread t1(work, 1);
    thread t2(work, 2);
    t1.join();
    t2.join();
    cout << "all done\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '(order varies)\nall done',
        order: 1,
      },
      {
        title: 'Mutex protects a counter',
        description: 'Avoid race conditions.',
        code: `#include <iostream>
#include <thread>
#include <vector>
#include <mutex>
using namespace std;

int counter = 0;
mutex m;

void bump() {
    for (int i = 0; i < 1000; ++i) {
        lock_guard<mutex> lock(m);
        ++counter;
    }
}

int main() {
    vector<thread> ts;
    for (int i = 0; i < 4; ++i) ts.emplace_back(bump);
    for (auto& t : ts) t.join();
    cout << counter << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: '4000',
        order: 2,
      },
      {
        title: 'std::async for results',
        description: 'Run in background, fetch result later.',
        code: `#include <iostream>
#include <future>
using namespace std;

int slow(int n) {
    return n * n;
}

int main() {
    auto f = async(launch::async, slow, 7);
    cout << "doing other work\\n";
    cout << f.get() << "\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'doing other work\n49',
        order: 3,
      },
    ],
    notes: [
      'Forgetting `join()` calls `std::terminate` when the thread destructor runs.',
      'C++20 `std::jthread` joins automatically — prefer it if available.',
      '`std::atomic<int>` is way faster than mutex-protected `int` for simple counters.',
    ],
    tips: [
      'Default to `std::async` over raw `std::thread` — easier and exception-safe.',
      'Use `std::scoped_lock` when you need multiple mutexes.',
      'For producer/consumer patterns, use a thread-safe queue rather than rolling your own.',
    ],
    tags: ['concurrency', 'threads', 'mutex', 'async', 'advanced'],
  }),

  t({
    title: 'Modern C++ Features: auto, structured bindings, ranges, modules',
    description: 'A tour of the modern C++ features that change everyday code.',
    module: 'Advanced C++',
    concept: 'Modern C++',
    difficulty: 'advanced',
    order: 24,
    estimatedMinutes: 25,
    content: `## Modern C++ Highlights

### auto and decltype

\`auto\` deduces the type from the initializer. \`decltype(expr)\` gives the type of an expression without evaluating it. Together they eliminate verbose type spellings.

### Structured bindings (C++17)

\`\`\`cpp
auto [key, value] = *map.begin();
\`\`\`

Works on tuples, pairs, arrays, and structs with public members.

### Range-based for with init (C++20)

\`\`\`cpp
for (auto i = 0; const auto& x : container) { ... ++i; }
\`\`\`

### std::optional (C++17)

\`std::optional<T>\` represents "maybe a T". Cleaner than nullable pointers for return values.

### std::variant

Type-safe union. \`std::variant<int, std::string>\` holds one of those at any time. Visit with \`std::visit\`.

### Modules (C++20)

\`import std;\` instead of \`#include <iostream>\`. Faster compile, no header pollution. Compiler support still settling — not yet universal.

### Concepts (C++20)

Constrain templates with readable requirements (see Templates tutorial). Better error messages.`,
    codeExamples: [
      {
        title: 'Structured bindings',
        description: 'Decompose pairs and tuples.',
        code: `#include <iostream>
#include <map>
using namespace std;
int main() {
    map<string, int> ages = {{"alex", 25}, {"beth", 30}};
    for (const auto& [name, age] : ages) {
        cout << name << ": " << age << "\\n";
    }
    return 0;
}`,
        input: '',
        expectedOutput: 'alex: 25\nbeth: 30',
        order: 1,
      },
      {
        title: 'std::optional',
        description: 'Cleaner than "magic" sentinel values.',
        code: `#include <iostream>
#include <optional>
#include <string>
using namespace std;

optional<string> findUser(int id) {
    if (id == 1) return "Alex";
    return nullopt;
}

int main() {
    if (auto u = findUser(1)) cout << *u << "\\n";
    if (!findUser(99))         cout << "missing\\n";
    return 0;
}`,
        input: '',
        expectedOutput: 'Alex\nmissing',
        order: 2,
      },
      {
        title: 'std::variant + std::visit',
        description: 'Type-safe sum types.',
        code: `#include <iostream>
#include <variant>
#include <string>
using namespace std;

int main() {
    variant<int, string> v = "hello";
    visit([](auto&& x) { cout << x << "\\n"; }, v);
    v = 42;
    visit([](auto&& x) { cout << x << "\\n"; }, v);
    return 0;
}`,
        input: '',
        expectedOutput: 'hello\n42',
        order: 3,
      },
    ],
    notes: [
      'Modern C++ ≈ C++11/14/17/20/23. Most modern projects target C++17 minimum.',
      '`std::optional` is the right return type for "may not have a value".',
      'Modules are the future but not yet mainstream — headers still rule in most codebases.',
    ],
    tips: [
      'Use `auto` for iterators and complex generics; spell out simple types.',
      'Reach for `std::optional` / `std::variant` instead of error codes or sentinels.',
      'Stay current with cppreference — modern C++ keeps adding nice tools.',
    ],
    tags: ['modern-cpp', 'auto', 'optional', 'variant', 'advanced'],
  }),
];

export default cppTutorials;
