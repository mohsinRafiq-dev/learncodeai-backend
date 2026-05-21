// Comprehensive C++ course: beginner → expert.

const cppCourse = {
  language: 'cpp',
  category: 'programming-language',
  difficulty: 'beginner',
  title: 'C++ Programming: Beginner to Expert',
  shortDescription:
    'Master modern C++ from basics through OOP, templates, smart pointers, move semantics, and concurrency.',
  description:
    'A complete C++ path covering variables, references, classes, the STL, templates, smart pointers, move semantics, and concurrency. Builds the practical fluency for systems programming, game development, and high-performance applications. Section quizzes + final assessment + completion certificate.',
  thumbnail:
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800',
  tags: ['cpp', 'systems', 'oop', 'stl', 'templates', 'memory'],
  estimatedHours: 50,
  certificateTemplate: 'excellence',
  sections: [
    {
      title: 'Section 1 — C++ Foundations',
      description: 'Variables, types, I/O, control flow, and functions.',
      order: 1,
      estimatedHours: 10,
      lessons: [
        {
          title: 'Variables, Types, and I/O',
          description: 'Declare variables with the right type, use cin/cout.',
          order: 1,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1.5,
          content: `
<h2>Built-in types</h2>
<ul>
  <li><code>int</code>, <code>long</code>, <code>long long</code> — signed integers</li>
  <li><code>unsigned int</code> — non-negative integers</li>
  <li><code>float</code>, <code>double</code> — floating point (prefer double)</li>
  <li><code>char</code>, <code>bool</code></li>
  <li><code>std::string</code> — text (<code>#include &lt;string&gt;</code>)</li>
</ul>
<h2>Initialization</h2>
<pre><code>int age = 25;
double pi{3.14159};   // brace init prevents narrowing
auto count = 0;       // auto deduces int</code></pre>
<h2>I/O</h2>
<pre><code>#include &lt;iostream&gt;
using namespace std;

int n;
cout &lt;&lt; "Enter n: ";
cin &gt;&gt; n;
cout &lt;&lt; "n*2 = " &lt;&lt; n*2 &lt;&lt; "\\n";</code></pre>
<p>Use <code>getline(cin, str)</code> for full lines with spaces.</p>
          `,
          codeExamples: [
            {
              title: 'auto + brace init',
              description: 'Type-safe, no narrowing.',
              code: `#include <iostream>
using namespace std;

int main() {
    auto count = 0;
    int total{count + 10};
    cout << total << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '10',
              order: 1,
            },
            {
              title: 'Read then echo',
              description: 'Basic cin/cout flow.',
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
    cout << "Hello " << name << ", age " << age << "\\n";
    return 0;
}`,
              language: 'cpp',
              input: 'Alex 25',
              expectedOutput: 'Name: Age: Hello Alex, age 25',
              order: 2,
            },
          ],
          notes: [
            'Always initialize variables — uninitialized locals are undefined behavior.',
            '`auto` deduces from the initializer — great for long generic types.',
            '`cin >> x` stops at whitespace; use `getline` for full lines.',
          ],
          tips: [
            'Prefer `{}` initialization — it catches narrowing conversions.',
            'Use `double` over `float` unless memory is critical.',
            'For competitive programming: `ios::sync_with_stdio(false); cin.tie(nullptr);`.',
          ],
        },
        {
          title: 'Control Flow: if, switch, loops',
          description: 'Branching and iteration in C++.',
          order: 2,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1.5,
          content: `
<h2>if / else if / else</h2>
<pre><code>if (score &gt;= 90) grade = 'A';
else if (score &gt;= 75) grade = 'B';
else grade = 'F';</code></pre>
<p>Always use curly braces, even for one-line bodies — prevents the "dangling else" bug.</p>
<h2>switch</h2>
<pre><code>switch (day) {
  case 1: cout &lt;&lt; "Mon"; break;
  case 2: cout &lt;&lt; "Tue"; break;
  default: cout &lt;&lt; "?";
}</code></pre>
<p>Don\'t forget <code>break</code> — fall-through is silent.</p>
<h2>Loops</h2>
<ul>
  <li><code>for (int i = 0; i &lt; n; ++i)</code></li>
  <li><code>while (cond) { ... }</code></li>
  <li><code>do { ... } while (cond);</code></li>
  <li><code>for (const auto&amp; x : container)</code> — range-based, modern</li>
</ul>
          `,
          codeExamples: [
            {
              title: 'Range-based for',
              description: 'Walk a vector cleanly.',
              code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {10, 20, 30};
    int total = 0;
    for (const auto& n : nums) total += n;
    cout << total << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '60',
              order: 1,
            },
            {
              title: 'switch with break',
              description: 'Compare one value to many.',
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
              language: 'cpp',
              expectedOutput: 'Wed',
              order: 2,
            },
          ],
          notes: [
            '`switch` only works on integral / enum types.',
            'C++17: `if (auto x = compute(); x > 0) ...` scopes the variable to the if.',
            'Prefer `++i` over `i++` in loops — same for ints, faster for iterators.',
          ],
          tips: [
            'Range-based `for` over classic `for` whenever you don\'t need the index.',
            'Use `[[fallthrough]];` (C++17) to mark intentional switch fall-through.',
            'Early `return` flattens nested `if`s.',
          ],
        },
        {
          title: 'Functions: parameters, references, overloading',
          description: 'Define and call functions; choose between value, reference, const reference.',
          order: 3,
          duration: 35,
          difficulty: 'beginner',
          estimatedHours: 1.5,
          content: `
<h2>Definition and call</h2>
<pre><code>int add(int a, int b) { return a + b; }
add(2, 3);  // 5</code></pre>
<h2>Pass by value, reference, const reference</h2>
<table>
  <thead><tr><th>Style</th><th>Use when</th></tr></thead>
  <tbody>
    <tr><td><code>int x</code></td><td>cheap primitives</td></tr>
    <tr><td><code>int&amp; x</code></td><td>need to modify caller\'s variable</td></tr>
    <tr><td><code>const T&amp; x</code></td><td>read-only access to a heavy object — avoid copies</td></tr>
  </tbody>
</table>
<h2>Default arguments and overloading</h2>
<pre><code>int pad(int n, int width = 4, char ch = '0');

int max3(int a, int b, int c);
double max3(double a, double b, double c);  // overload</code></pre>
          `,
          codeExamples: [
            {
              title: 'const reference parameter',
              description: 'Avoid copying a big string.',
              code: `#include <iostream>
#include <string>
using namespace std;

size_t length(const string& s) { return s.size(); }

int main() {
    string msg = "hello, world";
    cout << length(msg) << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '12',
              order: 1,
            },
            {
              title: 'Overloading',
              description: 'Same name, different signatures.',
              code: `#include <iostream>
using namespace std;

int max3(int a, int b, int c) { return max({a, b, c}); }
double max3(double a, double b, double c) { return max({a, b, c}); }

int main() {
    cout << max3(1, 5, 3) << "\\n";
    cout << max3(1.5, 0.3, 2.7) << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '5\n2.7',
              order: 2,
            },
          ],
          notes: [
            'Pass big objects by `const T&` — copies are slow.',
            'Default arguments go on the declaration (header), not the definition.',
            'Overloading is resolved at compile time based on argument types.',
          ],
          tips: [
            'Always use `const` on read-only parameters.',
            'Mark trivial getters `const` — they work on const objects.',
            'Prefer named functions over giant lambdas for non-trivial logic.',
          ],
        },
      ],
      quiz: {
        title: 'Section 1 Quiz — C++ Foundations',
        description: 'Variables, control flow, functions.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What does `int total{3.14};` do in C++?',
            options: [
              { text: 'Initializes total to 3', isCorrect: false },
              { text: 'Compile error — brace init prevents narrowing', isCorrect: true },
              { text: 'Rounds to 3', isCorrect: false },
              { text: 'Sets total to 0', isCorrect: false },
            ],
            points: 2,
            explanation: 'Brace `{}` initialization rejects narrowing conversions. Use `=` if you want truncation.',
          },
          {
            type: 'multiple-choice',
            question: 'Why pass a parameter as `const std::string&`?',
            options: [
              { text: 'Reduces compile time', isCorrect: false },
              { text: 'Avoids a copy and signals "read-only"', isCorrect: true },
              { text: 'Required for std::string', isCorrect: false },
              { text: 'Makes the function async', isCorrect: false },
            ],
            points: 2,
            explanation: 'Reference avoids the copy; `const` enforces read-only access.',
          },
          {
            type: 'true-false',
            question: '`switch` works on `std::string` values in C++.',
            options: [
              { text: 'true', isCorrect: false },
              { text: 'false', isCorrect: true },
            ],
            points: 1,
            explanation: '`switch` only accepts integral / enum types in C++.',
          },
          {
            type: 'multiple-choice',
            question: 'Which loop iterates each element of a `std::vector<int>` cleanly?',
            options: [
              { text: 'for (int i = 0; i < v.size(); i++) v[i];', isCorrect: false },
              { text: 'for (auto& x : v)', isCorrect: true },
              { text: 'for (int x of v)', isCorrect: false },
              { text: 'foreach (int x in v)', isCorrect: false },
            ],
            points: 2,
            explanation: 'Range-based `for` is the modern, clean way. Use `const auto&` for read-only.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `auto x = 0;` declare?',
            options: [
              { text: 'A double', isCorrect: false },
              { text: 'An int (deduced)', isCorrect: true },
              { text: 'A char', isCorrect: false },
              { text: 'A reference', isCorrect: false },
            ],
            points: 1,
            explanation: '`auto` infers the type from the initializer — `0` is `int`.',
          },
        ],
      },
    },

    {
      title: 'Section 2 — Memory and Containers',
      description: 'References vs pointers, dynamic memory, STL containers.',
      order: 2,
      estimatedHours: 12,
      lessons: [
        {
          title: 'References and Pointers',
          description: 'Two ways to refer to a value indirectly.',
          order: 1,
          duration: 35,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Reference vs pointer</h2>
<table>
  <thead><tr><th>Reference (<code>T&amp;</code>)</th><th>Pointer (<code>T*</code>)</th></tr></thead>
  <tbody>
    <tr><td>Must bind at creation</td><td>Can be uninitialized / null</td></tr>
    <tr><td>Cannot be reseated</td><td>Can be reassigned</td></tr>
    <tr><td>Cannot be null</td><td>Use <code>nullptr</code> for missing</td></tr>
  </tbody>
</table>
<h3>When to use which</h3>
<ul>
  <li><strong>Reference</strong> — function parameters that shouldn\'t be null</li>
  <li><strong>Pointer</strong> — optional values, dynamic allocation, polymorphism</li>
</ul>
<h2>Dereferencing</h2>
<p><code>*p</code> reads / writes through the pointer. <code>p-&gt;member</code> is shorthand for <code>(*p).member</code>.</p>
<p>Use <code>nullptr</code> (C++11) instead of <code>NULL</code> or <code>0</code>.</p>
          `,
          codeExamples: [
            {
              title: 'Pointer or null',
              description: 'nullptr means "no value".',
              code: `#include <iostream>
using namespace std;

void print(int* p) {
    if (p == nullptr) cout << "missing\\n";
    else cout << *p << "\\n";
}

int main() {
    int x = 42;
    print(&x);
    print(nullptr);
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '42\nmissing',
              order: 1,
            },
            {
              title: 'Reference modifies caller',
              description: 'No need to dereference.',
              code: `#include <iostream>
using namespace std;

void doubleIt(int& x) { x *= 2; }

int main() {
    int n = 5;
    doubleIt(n);
    cout << n << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '10',
              order: 2,
            },
          ],
          notes: [
            'Dereferencing a null pointer is undefined behavior — typically a crash.',
            '`&x` takes the address of x; `int& r = x` declares a reference. Same symbol, different positions.',
            'Modern C++ rarely uses raw owning pointers — use smart pointers (next section).',
          ],
          tips: [
            'Default to references for "must exist" parameters.',
            'Use `nullptr`, not `NULL` or `0`.',
            'Never return a pointer/reference to a local variable.',
          ],
        },
        {
          title: 'std::vector and Iterators',
          description: 'The most important STL container; iterators that connect to algorithms.',
          order: 2,
          duration: 35,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>std::vector</h2>
<pre><code>#include &lt;vector&gt;
vector&lt;int&gt; v = {1, 2, 3};
v.push_back(4);
v[0];        // unchecked
v.at(0);     // throws on out-of-range
v.size(), v.empty(), v.back(), v.front();</code></pre>
<h2>Iterators</h2>
<p><code>v.begin()</code>, <code>v.end()</code> (one-past-last). Use with STL algorithms:</p>
<pre><code>sort(v.begin(), v.end());
auto it = find(v.begin(), v.end(), 42);
if (it != v.end()) { ... }</code></pre>
<h2>Capacity</h2>
<p>Vector grows by doubling — amortized O(1) push_back. Call <code>v.reserve(N)</code> if you know the final size.</p>
          `,
          codeExamples: [
            {
              title: 'vector + sort',
              description: 'Two staples together.',
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
              language: 'cpp',
              expectedOutput: '1 1 3 4 5 9 ',
              order: 1,
            },
            {
              title: 'find returns iterator',
              description: 'Check against end() to test "missing".',
              code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<string> names = {"Alex", "Beth", "Carl"};
    auto it = find(names.begin(), names.end(), "Beth");
    if (it != names.end())
        cout << "index: " << (it - names.begin()) << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'index: 1',
              order: 2,
            },
          ],
          notes: [
            '`v[i]` is unchecked; `v.at(i)` throws on out-of-range.',
            'Default `sort` compares strings — pass a comparator for numeric or custom order.',
            'Inserting/erasing in the middle is O(n) — that\'s where `deque` or `list` shine.',
          ],
          tips: [
            'Reserve capacity if you know the final size — avoids reallocations.',
            'Pass vectors by `const &` to functions to skip copies.',
            'Erase-remove idiom: `v.erase(remove(...), v.end())` removes all matches.',
          ],
        },
        {
          title: 'STL Containers: map, set, unordered_*',
          description: 'Keyed lookup with tree-based and hash-based containers.',
          order: 3,
          duration: 35,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Ordered (tree-based, O(log n))</h2>
<ul>
  <li><code>set&lt;T&gt;</code> — unique sorted elements</li>
  <li><code>map&lt;K, V&gt;</code> — sorted key-value pairs</li>
</ul>
<h2>Unordered (hash-based, O(1) average)</h2>
<ul>
  <li><code>unordered_set&lt;T&gt;</code></li>
  <li><code>unordered_map&lt;K, V&gt;</code></li>
</ul>
<h3>When to use which</h3>
<p>Default to <code>unordered_*</code> for speed. Use <code>map</code>/<code>set</code> only when you need sorted iteration.</p>
<h2>Iteration with structured bindings (C++17)</h2>
<pre><code>for (const auto&amp; [key, value] : map_obj) { ... }</code></pre>
          `,
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
    for (const string& w : {"a", "b", "a", "c", "b", "a"})
        counts[w]++;
    for (const auto& [w, n] : counts)
        cout << w << ": " << n << "\\n";
    return 0;
}`,
              language: 'cpp',
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
    unordered_map<string, int> prices = {{"apple", 1}};
    auto it = prices.find("grape");
    if (it == prices.end()) cout << "missing\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'missing',
              order: 2,
            },
          ],
          notes: [
            '`operator[]` on a map INSERTS a default if the key is missing — use `find` for read-only.',
            '`unordered_map` requires the key to be hashable.',
            'Structured bindings (`auto [k, v] = ...`) make iteration much cleaner.',
          ],
          tips: [
            'Default to `unordered_map`; switch to `map` for sorted iteration.',
            'Use `try_emplace` to insert only if missing — avoids double lookup.',
            'For complex keys, write a hash function or use a struct as the key.',
          ],
        },
      ],
      quiz: {
        title: 'Section 2 Quiz — Memory and Containers',
        description: 'Pointers/references and STL containers.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Which is true about C++ references?',
            options: [
              { text: 'They can be null', isCorrect: false },
              { text: 'They must bind at creation', isCorrect: true },
              { text: 'They have their own address', isCorrect: false },
              { text: 'They can be reseated', isCorrect: false },
            ],
            points: 2,
            explanation: 'References must be initialized when declared and cannot be reseated — that\'s why they\'re safer than pointers.',
          },
          {
            type: 'multiple-choice',
            question: 'Difference between `v[i]` and `v.at(i)` on a std::vector?',
            options: [
              { text: 'No difference', isCorrect: false },
              { text: '`v.at(i)` throws on out-of-range, `v[i]` is undefined', isCorrect: true },
              { text: '`v.at(i)` is faster', isCorrect: false },
              { text: 'Only `v[i]` works on const vectors', isCorrect: false },
            ],
            points: 2,
            explanation: '`.at()` is bounds-checked; `operator[]` is not — UB on out-of-range.',
          },
          {
            type: 'true-false',
            question: 'When the key is missing, `map["foo"]` inserts a default value.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'It\'s a common bug! Use `m.find("foo")` for read-only lookups.',
          },
          {
            type: 'multiple-choice',
            question: 'Which container has O(1) average lookup?',
            options: [
              { text: 'std::map', isCorrect: false },
              { text: 'std::vector', isCorrect: false },
              { text: 'std::unordered_map', isCorrect: true },
              { text: 'std::list', isCorrect: false },
            ],
            points: 2,
            explanation: 'Hash-based containers (`unordered_*`) average O(1); tree-based (`map`, `set`) are O(log n).',
          },
          {
            type: 'multiple-choice',
            question: 'What\'s the modern C++ alternative to `NULL`?',
            options: [
              { text: '0', isCorrect: false },
              { text: 'nullptr', isCorrect: true },
              { text: 'nil', isCorrect: false },
              { text: 'None', isCorrect: false },
            ],
            points: 1,
            explanation: '`nullptr` (C++11) has its own type — safer than `NULL` (which is just `0`).',
          },
        ],
      },
    },

    {
      title: 'Section 3 — Object-Oriented Programming',
      description: 'Classes, constructors, inheritance, virtual functions, operator overloading.',
      order: 3,
      estimatedHours: 14,
      lessons: [
        {
          title: 'Classes, Constructors, and RAII',
          description: 'Bundle data + behavior; manage resources with RAII.',
          order: 1,
          duration: 45,
          difficulty: 'intermediate',
          estimatedHours: 2,
          content: `
<h2>Classes</h2>
<pre><code>class User {
public:
    User(std::string n) : name(n) {}        // member initializer list
    std::string greet() const { return "Hi, " + name; }
private:
    std::string name;
};</code></pre>
<p>Access: <code>public</code>, <code>private</code>, <code>protected</code>. Default in <code>class</code> is private; in <code>struct</code> it\'s public.</p>
<h2>const member functions</h2>
<p>Mark methods that don\'t modify state with <code>const</code> — they\'ll work on const objects.</p>
<h2>RAII</h2>
<p><strong>Resource Acquisition Is Initialization</strong>: constructor acquires (file, lock, memory), destructor releases. Stack objects guarantee cleanup at scope exit — even if an exception fires.</p>
<h2>Rule of Zero / Three / Five</h2>
<p>Rule of Zero: design so compiler defaults work — prefer this. Rule of Five: if you write any of (destructor, copy/move ctor, copy/move assignment), write all five.</p>
          `,
          codeExamples: [
            {
              title: 'Member initializer list',
              description: 'Initialize before the body runs.',
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

int main() { Point(3, 4).print(); return 0; }`,
              language: 'cpp',
              expectedOutput: '3, 4',
              order: 1,
            },
            {
              title: 'RAII for cleanup',
              description: 'Destructor runs at scope exit.',
              code: `#include <iostream>
using namespace std;

class Trace {
    string name;
public:
    Trace(string n) : name(n) { cout << "+ " << name << "\\n"; }
    ~Trace() { cout << "- " << name << "\\n"; }
};

int main() {
    Trace a("outer");
    { Trace b("inner"); }
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '+ outer\n+ inner\n- inner\n- outer',
              order: 2,
            },
          ],
          notes: [
            'Destructors run in REVERSE order of construction.',
            'If you have a custom destructor, you probably need custom copy/move.',
            '`= default` asks for the compiler-generated version; `= delete` forbids it.',
          ],
          tips: [
            'Use trailing-underscore (`name_`) for private fields.',
            'Initialize ALL members in the initializer list, not the body.',
            'Default to the Rule of Zero — let compiler handle copy/move.',
          ],
        },
        {
          title: 'Inheritance and Virtual Functions',
          description: 'Derive classes, override methods, virtual destructors.',
          order: 2,
          duration: 45,
          difficulty: 'intermediate',
          estimatedHours: 2,
          content: `
<h2>Basic inheritance</h2>
<pre><code>class Animal {
public:
    virtual std::string speak() const { return "..."; }
    virtual ~Animal() = default;   // CRITICAL
};

class Dog : public Animal {
public:
    std::string speak() const override { return "woof"; }
};</code></pre>
<h2>virtual + override</h2>
<p><code>virtual</code> enables dynamic dispatch through base pointers. <code>override</code> tells the compiler to verify you actually overrode something.</p>
<h2>Virtual destructor</h2>
<p>If you delete a derived object through a base pointer, the base destructor must be <code>virtual</code> — otherwise the derived destructor is skipped.</p>
<h2>Pure virtual / abstract</h2>
<pre><code>class Shape {
public:
    virtual double area() const = 0;   // pure virtual
};</code></pre>
<p>Abstract classes can\'t be instantiated. Use them as interfaces.</p>
          `,
          codeExamples: [
            {
              title: 'Polymorphism with smart pointers',
              description: 'Base pointer, derived behavior.',
              code: `#include <iostream>
#include <vector>
#include <memory>
using namespace std;

class Animal { public: virtual string speak() const { return "..."; } virtual ~Animal() = default; };
class Dog : public Animal { public: string speak() const override { return "woof"; } };
class Cat : public Animal { public: string speak() const override { return "meow"; } };

int main() {
    vector<unique_ptr<Animal>> zoo;
    zoo.push_back(make_unique<Dog>());
    zoo.push_back(make_unique<Cat>());
    for (auto& a : zoo) cout << a->speak() << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'woof\nmeow',
              order: 1,
            },
            {
              title: 'Pure virtual interface',
              description: 'Force subclasses to implement.',
              code: `#include <iostream>
#include <memory>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};
class Square : public Shape {
    double s;
public:
    Square(double s) : s(s) {}
    double area() const override { return s*s; }
};

int main() {
    unique_ptr<Shape> sh = make_unique<Square>(4);
    cout << sh->area() << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '16',
              order: 2,
            },
          ],
          notes: [
            'Always declare base destructors `virtual` if you\'ll delete through a base pointer.',
            '`override` catches typos in method signatures.',
            'C++ supports multiple inheritance but it\'s rarely the right answer.',
          ],
          tips: [
            'Prefer composition over inheritance unless there\'s a true is-a relationship.',
            'Use `final` to prevent further overriding.',
            'For runtime polymorphism, use `unique_ptr<Base>` or `shared_ptr<Base>`.',
          ],
        },
        {
          title: 'Operator Overloading and Exceptions',
          description: 'Make your types act like built-ins; handle errors with try/catch.',
          order: 3,
          duration: 40,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Operator overloading</h2>
<pre><code>struct Point {
    int x, y;
    bool operator==(const Point&amp; o) const {
        return x == o.x &amp;&amp; y == o.y;
    }
};

std::ostream&amp; operator&lt;&lt;(std::ostream&amp; os, const Point&amp; p) {
    return os &lt;&lt; '(' &lt;&lt; p.x &lt;&lt; ", " &lt;&lt; p.y &lt;&lt; ')';
}</code></pre>
<p>C++20 introduces <code>&lt;=&gt;</code> (spaceship) — define one, get all comparison operators free.</p>
<h2>Exceptions</h2>
<pre><code>try {
    risky();
} catch (const std::runtime_error&amp; e) {
    cerr &lt;&lt; e.what() &lt;&lt; "\\n";
} catch (...) {
    cerr &lt;&lt; "unknown\\n";
}</code></pre>
<p>Standard types in <code>&lt;stdexcept&gt;</code>: <code>logic_error</code>, <code>runtime_error</code>, <code>invalid_argument</code>, <code>out_of_range</code>.</p>
          `,
          codeExamples: [
            {
              title: 'operator== and operator<<',
              description: 'Make Points work with cout and ==.',
              code: `#include <iostream>
using namespace std;

struct Point {
    int x, y;
    bool operator==(const Point& o) const { return x == o.x && y == o.y; }
};
ostream& operator<<(ostream& os, const Point& p) {
    return os << "(" << p.x << ", " << p.y << ")";
}

int main() {
    Point a{3, 4}, b{3, 4};
    cout << a << " == " << b << ": " << (a == b) << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '(3, 4) == (3, 4): 1',
              order: 1,
            },
            {
              title: 'Catching a specific exception',
              description: 'Friendly error messages.',
              code: `#include <iostream>
#include <stdexcept>
using namespace std;

int divide(int a, int b) {
    if (b == 0) throw invalid_argument("zero divisor");
    return a / b;
}

int main() {
    try { divide(10, 0); }
    catch (const invalid_argument& e) { cout << "caught: " << e.what() << "\\n"; }
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'caught: zero divisor',
              order: 2,
            },
          ],
          notes: [
            'Catch exceptions by `const reference` to avoid slicing.',
            'Don\'t throw in destructors — calls `std::terminate`.',
            '`noexcept` tells the compiler a function won\'t throw — enables optimizations.',
          ],
          tips: [
            'Overload `<<` for any class you debug-print — saves keystrokes.',
            'For "not found" / "missing", `std::optional<T>` is cleaner than throwing.',
            'Pair `==` with `!=` (or use C++20 spaceship).',
          ],
        },
      ],
      quiz: {
        title: 'Section 3 Quiz — Object-Oriented Programming',
        description: 'Classes, inheritance, operators, exceptions.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Why declare a base-class destructor `virtual`?',
            options: [
              { text: 'It\'s required by the standard', isCorrect: false },
              { text: 'So deleting through a base pointer calls the derived destructor', isCorrect: true },
              { text: 'For performance', isCorrect: false },
              { text: 'To enable copy', isCorrect: false },
            ],
            points: 2,
            explanation: 'Without virtual destructors, `delete basePtr;` only calls the base destructor — derived resources leak.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `= 0` mean on a virtual function?',
            options: [
              { text: 'Disable the function', isCorrect: false },
              { text: 'Mark it pure virtual — subclasses MUST override', isCorrect: true },
              { text: 'Initialize to zero', isCorrect: false },
              { text: 'Inline it', isCorrect: false },
            ],
            points: 2,
            explanation: 'Pure virtual: the class becomes abstract and can\'t be instantiated.',
          },
          {
            type: 'true-false',
            question: '`override` is enforced by the compiler.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'If you `override` something the parent doesn\'t actually define, the compiler errors — catches typos.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is the safer pattern for an "item may be missing" return value?',
            options: [
              { text: 'Return -1 sentinel', isCorrect: false },
              { text: 'Throw an exception', isCorrect: false },
              { text: 'Return std::optional<T>', isCorrect: true },
              { text: 'Set a global error flag', isCorrect: false },
            ],
            points: 2,
            explanation: '`std::optional<T>` makes "no value" explicit in the type — no sentinels, no exception overhead.',
          },
          {
            type: 'multiple-choice',
            question: 'When should you reach for inheritance?',
            options: [
              { text: 'Always — it\'s OOP', isCorrect: false },
              { text: 'When there\'s a true is-a relationship and behavior to share', isCorrect: true },
              { text: 'For "has-a" relationships', isCorrect: false },
              { text: 'For data containers', isCorrect: false },
            ],
            points: 1,
            explanation: 'Use composition by default. Inheritance for true is-a relationships only.',
          },
        ],
      },
    },

    {
      title: 'Section 4 — Advanced C++',
      description: 'Templates, smart pointers, move semantics, STL algorithms, concurrency.',
      order: 4,
      estimatedHours: 14,
      lessons: [
        {
          title: 'Templates and Lambdas',
          description: 'Generic code with templates; inline functions with lambdas.',
          order: 1,
          duration: 45,
          difficulty: 'advanced',
          estimatedHours: 2,
          content: `
<h2>Function templates</h2>
<pre><code>template &lt;typename T&gt;
T max3(T a, T b, T c) { return std::max({a, b, c}); }</code></pre>
<h2>Class templates</h2>
<pre><code>template &lt;typename T&gt;
class Box {
    T value;
public:
    Box(T v) : value(v) {}
    T get() const { return value; }
};</code></pre>
<h2>Lambdas</h2>
<pre><code>auto greet = [name = "Alex"](const std::string&amp; msg) {
    return msg + ", " + name;
};</code></pre>
<p>Captures: <code>[]</code> nothing, <code>[=]</code> by value, <code>[&amp;]</code> by reference, <code>[x]</code> specific. Use sparingly for short callbacks.</p>
<h2>std::function</h2>
<p>Polymorphic wrapper for any callable matching a signature. Heavier than a template; use when type erasure matters.</p>
          `,
          codeExamples: [
            {
              title: 'Function template',
              description: 'One add for int, double, string.',
              code: `#include <iostream>
#include <string>
using namespace std;

template <typename T>
T add(T a, T b) { return a + b; }

int main() {
    cout << add(2, 3) << "\\n";
    cout << add(1.5, 2.5) << "\\n";
    cout << add<string>("foo", "bar") << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '5\n4\nfoobar',
              order: 1,
            },
            {
              title: 'Lambda with sort',
              description: 'Custom comparator inline.',
              code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> v = {3, 1, 4, 1, 5};
    sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    for (int n : v) cout << n << " ";
    cout << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '5 4 3 1 1 ',
              order: 2,
            },
          ],
          notes: [
            'Templates are compiled per use — definitions usually go in headers.',
            'Lambdas have a unique anonymous type — store in `auto` or `std::function`.',
            'C++20 concepts give templates readable constraints and better errors.',
          ],
          tips: [
            'Start concrete, then template-ize when you need generality.',
            'Default to lambdas for short callbacks; named function objects for repeated use.',
            'Use `auto` for the result of any template instantiation.',
          ],
        },
        {
          title: 'Smart Pointers and Move Semantics',
          description: 'RAII for memory; avoid copies with move.',
          order: 2,
          duration: 50,
          difficulty: 'advanced',
          estimatedHours: 2,
          content: `
<h2>std::unique_ptr</h2>
<p>Exclusive ownership. Cannot be copied, only moved. Zero overhead vs raw pointer.</p>
<pre><code>auto p = std::make_unique&lt;Widget&gt;(args);
p-&gt;doStuff();</code></pre>
<h2>std::shared_ptr</h2>
<p>Reference-counted shared ownership. Atomic refcount — heavier.</p>
<h2>std::weak_ptr</h2>
<p>Non-owning view of a shared_ptr — breaks cyclic references.</p>
<h2>Move semantics</h2>
<p>An <strong>rvalue reference</strong> (<code>T&amp;&amp;</code>) binds to temporaries. A move constructor "steals" resources instead of copying.</p>
<pre><code>std::string a = "hello";
std::string b = std::move(a);   // a is now empty</code></pre>
<p>Mark move constructors / assignment <code>noexcept</code> so STL containers use them.</p>
          `,
          codeExamples: [
            {
              title: 'unique_ptr',
              description: 'Auto-freed at scope exit.',
              code: `#include <iostream>
#include <memory>
using namespace std;
struct Widget {
    int id;
    Widget(int i) : id(i) { cout << "+ " << id << "\\n"; }
    ~Widget() { cout << "- " << id << "\\n"; }
};
int main() {
    auto p = make_unique<Widget>(7);
    cout << p->id << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: '+ 7\n7\n- 7',
              order: 1,
            },
            {
              title: 'std::move',
              description: 'Steal instead of copy.',
              code: `#include <iostream>
#include <string>
#include <utility>
using namespace std;
int main() {
    string a = "hello world long string";
    string b = move(a);
    cout << "a: [" << a << "]\\n";
    cout << "b: [" << b << "]\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'a: []\nb: [hello world long string]',
              order: 2,
            },
          ],
          notes: [
            '`std::move` doesn\'t actually move — it just casts to rvalue, telling the compiler "OK to move".',
            'After `move(x)`, x is valid but unspecified — only call methods documented to work after move.',
            'Cyclic `shared_ptr` references leak — break with `weak_ptr`.',
          ],
          tips: [
            'Default to `unique_ptr`. Use `shared_ptr` only when you actually share ownership.',
            'Pass smart pointers by `const &` when the function doesn\'t take ownership.',
            'Mark move operations `noexcept`.',
          ],
        },
        {
          title: 'STL Algorithms and Concurrency',
          description: 'Generic algorithms over iterators; std::thread and std::async.',
          order: 3,
          duration: 50,
          difficulty: 'advanced',
          estimatedHours: 2,
          content: `
<h2>STL algorithms</h2>
<p><code>&lt;algorithm&gt;</code> and <code>&lt;numeric&gt;</code> hold dozens of generic ops on iterator ranges:</p>
<ul>
  <li><code>sort</code>, <code>find</code>, <code>count_if</code>, <code>transform</code>, <code>accumulate</code></li>
  <li><code>min_element</code>, <code>max_element</code></li>
  <li><code>copy_if</code>, <code>unique</code>, <code>for_each</code></li>
</ul>
<h2>Concurrency</h2>
<pre><code>#include &lt;thread&gt;
std::thread t([]{ doWork(); });
t.join();   // or t.detach()</code></pre>
<p>Protect shared data with <code>std::mutex</code>:</p>
<pre><code>std::mutex m;
{
    std::lock_guard&lt;std::mutex&gt; lock(m);
    // critical section
}</code></pre>
<p><code>std::async</code> is higher-level — returns a <code>future</code> you wait on.</p>
<p>The GIL doesn\'t exist in C++ — threads ARE parallel. But for CPU-bound work, prefer <code>std::async</code> over raw threads.</p>
          `,
          codeExamples: [
            {
              title: 'sort + accumulate',
              description: 'Two STL staples.',
              code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main() {
    vector<int> v = {3, 1, 4, 1, 5, 9, 2};
    sort(v.begin(), v.end());
    cout << "sum: " << accumulate(v.begin(), v.end(), 0) << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'sum: 25',
              order: 1,
            },
            {
              title: 'std::async for results',
              description: 'Run in background, fetch later.',
              code: `#include <iostream>
#include <future>
using namespace std;
int slow(int n) { return n * n; }
int main() {
    auto f = async(launch::async, slow, 7);
    cout << "other work\\n";
    cout << f.get() << "\\n";
    return 0;
}`,
              language: 'cpp',
              expectedOutput: 'other work\n49',
              order: 2,
            },
          ],
          notes: [
            'Forgetting `join()` calls `std::terminate` when the thread destructor runs.',
            'C++20 `std::jthread` joins automatically.',
            '`std::atomic<int>` is way faster than mutex-protected `int` for simple counters.',
          ],
          tips: [
            'Prefer STL algorithms over hand-written loops — tested and intentional.',
            'Default to `std::async` over raw `std::thread` — easier and exception-safe.',
            'Use `std::scoped_lock` (C++17) for multiple mutexes deadlock-free.',
          ],
        },
      ],
      quiz: {
        title: 'Section 4 Quiz — Advanced C++',
        description: 'Templates, smart pointers, move, STL, concurrency.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Which smart pointer represents EXCLUSIVE ownership?',
            options: [
              { text: 'std::shared_ptr', isCorrect: false },
              { text: 'std::unique_ptr', isCorrect: true },
              { text: 'std::weak_ptr', isCorrect: false },
              { text: 'std::auto_ptr', isCorrect: false },
            ],
            points: 2,
            explanation: '`unique_ptr` can\'t be copied — only one owner at a time.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `std::move(x)` actually do?',
            options: [
              { text: 'Physically copies x somewhere else', isCorrect: false },
              { text: 'Casts x to an rvalue reference, allowing move semantics', isCorrect: true },
              { text: 'Deletes x', isCorrect: false },
              { text: 'Compiles to nothing', isCorrect: false },
            ],
            points: 2,
            explanation: '`std::move` is just a cast — the actual move happens in the move constructor / assignment.',
          },
          {
            type: 'true-false',
            question: 'Always pass smart pointers by value to functions that don\'t take ownership.',
            options: [
              { text: 'true', isCorrect: false },
              { text: 'false', isCorrect: true },
            ],
            points: 1,
            explanation: 'For "borrow", pass a raw pointer or reference. Passing shared_ptr by value increments refcount.',
          },
          {
            type: 'multiple-choice',
            question: 'Which STL algorithm sums a range?',
            options: [
              { text: 'std::sum', isCorrect: false },
              { text: 'std::reduce', isCorrect: false },
              { text: 'std::accumulate', isCorrect: true },
              { text: 'std::total', isCorrect: false },
            ],
            points: 2,
            explanation: '`std::accumulate(first, last, init)` in `<numeric>` is the sum/reduce primitive.',
          },
          {
            type: 'multiple-choice',
            question: 'What\'s the easier alternative to manually managing std::thread?',
            options: [
              { text: 'std::async + std::future', isCorrect: true },
              { text: 'pthread_create', isCorrect: false },
              { text: 'std::thread::join()', isCorrect: false },
              { text: 'fork()', isCorrect: false },
            ],
            points: 1,
            explanation: '`std::async` handles thread lifecycle; you just wait on the returned `future`.',
          },
        ],
      },
    },
  ],

  finalQuiz: {
    title: 'Final Quiz — C++ Programming: Beginner to Expert',
    description: 'Comprehensive assessment covering all four sections.',
    passingScore: 75,
    timeLimit: 20,
    maxRetakes: 3,
    questions: [
      {
        type: 'multiple-choice',
        question: 'What\'s the result of `int x{3.14};`?',
        options: [
          { text: 'x = 3', isCorrect: false },
          { text: 'x = 3.14', isCorrect: false },
          { text: 'Compile error (narrowing)', isCorrect: true },
          { text: 'x = 0', isCorrect: false },
        ],
        points: 2,
        explanation: 'Brace initialization rejects narrowing — use `int x = 3.14;` for truncation.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is the modern, exception-safe way to allocate a Widget?',
        options: [
          { text: 'Widget* w = new Widget();', isCorrect: false },
          { text: 'auto w = std::make_unique<Widget>();', isCorrect: true },
          { text: 'Widget* w = malloc(sizeof(Widget));', isCorrect: false },
          { text: 'Widget& w = *new Widget();', isCorrect: false },
        ],
        points: 2,
        explanation: '`make_unique` is RAII-safe and the modern default.',
      },
      {
        type: 'true-false',
        question: 'After `std::move(s)` on a string, s is guaranteed to be empty.',
        options: [
          { text: 'true', isCorrect: false },
          { text: 'false', isCorrect: true },
        ],
        points: 1,
        explanation: 'After move, the source is in a valid-but-unspecified state. Most implementations empty it but it\'s not guaranteed.',
      },
      {
        type: 'multiple-choice',
        question: 'Why prefer `const T&` parameter over `T`?',
        options: [
          { text: 'Allows the function to modify the argument', isCorrect: false },
          { text: 'Avoids a copy for heavy objects', isCorrect: true },
          { text: 'Makes the function virtual', isCorrect: false },
          { text: 'Required by the standard', isCorrect: false },
        ],
        points: 2,
        explanation: 'Reference avoids the copy; const enforces read-only.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is true about virtual destructors?',
        options: [
          { text: 'Always required on every class', isCorrect: false },
          { text: 'Required when deleting through a base pointer', isCorrect: true },
          { text: 'Deprecated in C++20', isCorrect: false },
          { text: 'Required only in templates', isCorrect: false },
        ],
        points: 2,
        explanation: 'If you delete through a base pointer without a virtual destructor, derived destructors are skipped — leaks.',
      },
      {
        type: 'multiple-choice',
        question: 'Which header provides std::vector?',
        options: [
          { text: '<array>', isCorrect: false },
          { text: '<vector>', isCorrect: true },
          { text: '<list>', isCorrect: false },
          { text: '<container>', isCorrect: false },
        ],
        points: 1,
        explanation: '`<vector>` is the header; `std::vector<T>` is the type.',
      },
      {
        type: 'multiple-choice',
        question: 'How do you sort a vector in descending order?',
        options: [
          { text: 'sort(v.begin(), v.end()) then reverse(v.begin(), v.end())', isCorrect: false },
          { text: 'sort(v.begin(), v.end(), [](int a, int b){return a > b;})', isCorrect: true },
          { text: 'rsort(v)', isCorrect: false },
          { text: 'sort(v) with std::greater', isCorrect: false },
        ],
        points: 2,
        explanation: 'Pass a comparator that returns true when `a` should come before `b`.',
      },
      {
        type: 'multiple-choice',
        question: 'What\'s the type-safe modern union?',
        options: [
          { text: 'std::any', isCorrect: false },
          { text: 'std::variant', isCorrect: true },
          { text: 'std::tuple', isCorrect: false },
          { text: 'union', isCorrect: false },
        ],
        points: 2,
        explanation: '`std::variant<T1, T2>` holds one of the listed types; `std::visit` operates on it safely.',
      },
      {
        type: 'true-false',
        question: 'Marking a move constructor `noexcept` matters for STL container performance.',
        options: [
          { text: 'true', isCorrect: true },
          { text: 'false', isCorrect: false },
        ],
        points: 1,
        explanation: 'Vectors only move (instead of copy) during reallocation if the move ctor is `noexcept`.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is the cleanest way to do CPU-bound parallel work in modern C++?',
        options: [
          { text: 'fork()', isCorrect: false },
          { text: 'std::async with std::launch::async or a thread pool', isCorrect: true },
          { text: 'goto', isCorrect: false },
          { text: 'setjmp/longjmp', isCorrect: false },
        ],
        points: 2,
        explanation: '`std::async` returns a future and handles thread lifecycle for you.',
      },
    ],
  },
};

export default cppCourse;
