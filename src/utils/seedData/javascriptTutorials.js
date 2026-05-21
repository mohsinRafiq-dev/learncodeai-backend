// JavaScript beginner → expert curriculum
// 4 modules × 6 tutorials × 3 difficulty bands.

const t = (data) => ({
  language: 'javascript',
  isPreGenerated: true,
  isAIgenerated: false,
  createdBy: null,
  isPublished: true,
  ...data,
});

export const javascriptTutorials = [
  // ============================================================
  // MODULE 1 — FOUNDATIONS (beginner)
  // ============================================================
  t({
    title: 'Variables and Data Types in JavaScript',
    description: 'Declare variables with let, const, var — and learn JavaScript\'s primitive types.',
    module: 'Foundations',
    concept: 'Variables and Data Types',
    difficulty: 'beginner',
    order: 1,
    estimatedMinutes: 12,
    content: `## Variables and Data Types

JavaScript has three declaration keywords and seven primitive types.

### Declaration keywords

- **\`let\`** — block-scoped, reassignable. Default choice for variables that change.
- **\`const\`** — block-scoped, cannot be reassigned. Default choice for everything else.
- **\`var\`** — function-scoped, hoisted. Legacy — avoid in modern code.

### Primitive types

- \`string\` — text: \`"hello"\` or \`'hello'\` or \`\\\`backticks\\\`\`
- \`number\` — both integers and decimals: \`42\`, \`3.14\`
- \`boolean\` — \`true\` / \`false\`
- \`null\` — explicit "nothing"
- \`undefined\` — implicit "not assigned yet"
- \`bigint\` — integers beyond \`Number.MAX_SAFE_INTEGER\`: \`9007199254740993n\`
- \`symbol\` — unique identifiers (used as object keys)

\`typeof value\` returns the type as a string.`,
    codeExamples: [
      {
        title: 'let vs const',
        description: 'const cannot be reassigned.',
        code: `let count = 0;
count = 5;            // ok
const PI = 3.14;
// PI = 3.0;          // would throw TypeError
console.log(count, PI);`,
        input: '',
        expectedOutput: '5 3.14',
        order: 1,
      },
      {
        title: 'typeof inspection',
        description: 'Use typeof to confirm what\'s in a variable.',
        code: `console.log(typeof "hi");
console.log(typeof 42);
console.log(typeof true);
console.log(typeof undefined);
console.log(typeof null);`,
        input: '',
        expectedOutput: 'string\nnumber\nboolean\nundefined\nobject',
        order: 2,
      },
      {
        title: 'null vs undefined',
        description: 'undefined is the default; null is an intentional empty.',
        code: `let a;
const b = null;
console.log(a, b);
console.log(a == b);
console.log(a === b);`,
        input: '',
        expectedOutput: 'undefined null\ntrue\nfalse',
        order: 3,
      },
    ],
    notes: [
      '`typeof null` infamously returns `"object"` — a historical bug kept for compatibility.',
      '`==` does type coercion (`null == undefined` is true); `===` does not.',
      '`var` is hoisted and function-scoped — almost always the wrong choice today.',
    ],
    tips: [
      'Default to `const`. Switch to `let` only when you need to reassign.',
      'Prefer `===` over `==` to avoid surprise coercion bugs.',
      'Use `Number.isInteger(x)` to check for whole numbers — `typeof` only says "number".',
    ],
    tags: ['variables', 'types', 'let', 'const', 'foundations'],
  }),

  t({
    title: 'Operators and Expressions',
    description: 'Arithmetic, comparison, logical, and assignment operators with their gotchas.',
    module: 'Foundations',
    concept: 'Operators and Expressions',
    difficulty: 'beginner',
    order: 2,
    estimatedMinutes: 15,
    content: `## Operators and Expressions

### Arithmetic
\`+\`, \`-\`, \`*\`, \`/\`, \`%\` (remainder), \`**\` (power). \`+\` is also string concatenation.

### Comparison
\`===\`, \`!==\` (strict — recommended), \`==\`, \`!=\` (loose — avoid), plus \`<\`, \`<=\`, \`>\`, \`>=\`.

### Logical
\`&&\` (and), \`||\` (or), \`!\` (not). They short-circuit.

### Nullish coalescing
\`a ?? b\` returns \`a\` unless \`a\` is \`null\` or \`undefined\`. Use this instead of \`||\` when \`0\` or \`""\` are valid values.

### Assignment shortcuts
\`+=\`, \`-=\`, \`*=\`, \`/=\`, \`??=\` (assign only if nullish), \`||=\`, \`&&=\`.`,
    codeExamples: [
      {
        title: 'Arithmetic and string +',
        description: 'The + operator does double duty.',
        code: `console.log(7 + 3);
console.log("foo" + "bar");
console.log("3" + 4);
console.log("3" * 4);`,
        input: '',
        expectedOutput: '10\nfoobar\n34\n12',
        order: 1,
      },
      {
        title: '?? vs ||',
        description: '?? only catches null/undefined; || catches all falsy.',
        code: `const count = 0;
console.log(count || 10);
console.log(count ?? 10);`,
        input: '',
        expectedOutput: '10\n0',
        order: 2,
      },
      {
        title: 'Short-circuit evaluation',
        description: 'Use && and || for conditional execution.',
        code: `const user = { name: "Alex" };
console.log(user && user.name);
console.log(user.email || "no email");`,
        input: '',
        expectedOutput: 'Alex\nno email',
        order: 3,
      },
    ],
    notes: [
      '`+` with a string converts the other operand to string; `-` always tries to convert to number.',
      '`==` does coercion: `0 == ""` is true, `null == undefined` is true.',
      'Logical operators return one of the operands, not always a boolean.',
    ],
    tips: [
      'Always use `===` and `!==`. Strict equality avoids whole categories of bugs.',
      'Use `??` when `0`, `""`, or `false` are legitimate values.',
      'Parenthesize mixed `&&` / `||` expressions — clarity beats brevity.',
    ],
    tags: ['operators', 'comparison', 'logical', 'foundations'],
  }),

  t({
    title: 'Strings and Template Literals',
    description: 'Build, slice, and interpolate strings with backticks and string methods.',
    module: 'Foundations',
    concept: 'Strings',
    difficulty: 'beginner',
    order: 3,
    estimatedMinutes: 15,
    content: `## Strings

Strings are immutable — methods return new strings.

### Template literals (backticks)

\`\\\`Hello, \${name}!\\\`\` interpolates variables and supports multi-line strings. Always prefer them over \`"...\"+ var + "..."\`.

### Common methods

- \`.length\`, \`.toUpperCase()\`, \`.toLowerCase()\`, \`.trim()\`
- \`.includes(sub)\`, \`.startsWith()\`, \`.endsWith()\`
- \`.slice(start, end)\` — extract substring (end is exclusive)
- \`.split(sep)\` — to array, \`.replace(a, b)\`, \`.replaceAll(a, b)\`
- \`.indexOf(sub)\` returns \`-1\` if not found
- \`.padStart(n, char)\`, \`.padEnd(n, char)\`

### Indexing

\`str[0]\` gets the first character. Negative indices are NOT supported — use \`.slice(-1)\` for the last char.`,
    codeExamples: [
      {
        title: 'Template literals',
        description: 'Multi-line, interpolated strings.',
        code: `const name = "Alex";
const greeting = \`Hello, \${name}!
You have \${2 + 3} new messages.\`;
console.log(greeting);`,
        input: '',
        expectedOutput: 'Hello, Alex!\nYou have 5 new messages.',
        order: 1,
      },
      {
        title: 'Slicing and methods',
        description: 'Cut and transform strings.',
        code: `const s = "  Hello, World!  ";
console.log(s.trim().toLowerCase());
console.log(s.trim().slice(0, 5));
console.log("abc".repeat(3));`,
        input: '',
        expectedOutput: 'hello, world!\nHello\nabcabcabc',
        order: 2,
      },
      {
        title: 'Splitting and joining',
        description: 'Convert between strings and arrays.',
        code: `const csv = "apple,banana,cherry";
const items = csv.split(",");
console.log(items);
console.log(items.join(" | "));`,
        input: '',
        expectedOutput: "[ 'apple', 'banana', 'cherry' ]\napple | banana | cherry",
        order: 3,
      },
    ],
    notes: [
      'Strings are immutable — `s[0] = "X"` silently fails in non-strict mode.',
      'Template literals (backticks) allow real newlines in the source code.',
      '`replace()` only replaces the first match unless you pass a regex with `/g`.',
    ],
    tips: [
      'Use template literals always — they\'re strictly better than `+` concatenation.',
      'For case-insensitive checks, lowercase both sides: `s.toLowerCase().includes(...)`.',
      'For ASCII boundaries (alphabet, digits), regex is more reliable than character codes.',
    ],
    tags: ['strings', 'template-literals', 'foundations'],
  }),

  t({
    title: 'Console and Browser I/O',
    description: 'Use console.log and friends to debug; prompt/alert for browser input.',
    module: 'Foundations',
    concept: 'Input/Output',
    difficulty: 'beginner',
    order: 4,
    estimatedMinutes: 10,
    content: `## I/O in JavaScript

### console methods

- \`console.log(...args)\` — multiple args joined by space
- \`console.error\`, \`console.warn\`, \`console.info\` — same shape, different formatting
- \`console.table(arr)\` — render arrays/objects as a nice table
- \`console.dir(obj)\` — interactive object tree (Node + browsers)
- \`console.group()\` / \`console.groupEnd()\` — nested log sections

### Browser-only input

\`prompt(question, default)\` shows a popup, returns the typed string (or \`null\` if cancelled). Use sparingly — modal popups break UX.

### Node.js input

\`process.stdin\` or the \`readline\` module. For prototypes, \`prompt-sync\` from npm is easiest.`,
    codeExamples: [
      {
        title: 'console.log with multiple args',
        description: 'Multiple values join with space.',
        code: `const name = "Alex";
const age = 25;
console.log("user:", name, "age:", age);`,
        input: '',
        expectedOutput: 'user: Alex age: 25',
        order: 1,
      },
      {
        title: 'console.table',
        description: 'Pretty-print arrays of objects.',
        code: `const users = [
  { name: "Alex", age: 25 },
  { name: "Beth", age: 30 },
];
console.table(users);`,
        input: '',
        expectedOutput: '(table of users)',
        order: 2,
      },
      {
        title: 'Debug short-form',
        description: 'Log a labeled object snapshot.',
        code: `const x = { a: 1, b: 2 };
console.log({ x });`,
        input: '',
        expectedOutput: '{ x: { a: 1, b: 2 } }',
        order: 3,
      },
    ],
    notes: [
      'In browsers, `console.log` accepts CSS via `%c` — `console.log("%cBig", "font-size:32px")`.',
      '`console.table` is amazing for inspecting array-of-objects data.',
      '`alert`/`prompt`/`confirm` block the page — never use them in production UI.',
    ],
    tips: [
      'For labeled debug logs, use `console.log({ someVar })` — you get name and value.',
      'Use `console.error` for errors so DevTools highlights them in red.',
      'In Node, prefer `process.stdout.write` to avoid trailing newlines.',
    ],
    tags: ['console', 'logging', 'io', 'foundations'],
  }),

  t({
    title: 'Conditional Statements (if / else / switch / ternary)',
    description: 'Branch your code with if/else, switch, and the ternary expression.',
    module: 'Foundations',
    concept: 'Conditionals',
    difficulty: 'beginner',
    order: 5,
    estimatedMinutes: 14,
    content: `## Conditionals

### if / else if / else

\`\`\`javascript
if (cond) { ... }
else if (other) { ... }
else { ... }
\`\`\`

### switch

Useful when comparing one value to many literal cases. Always include \`break\` (or \`return\`) — otherwise execution falls through.

### Ternary

\`condition ? whenTrue : whenFalse\` — concise inline branching. Don't nest them; readability dies fast.

### Truthy vs falsy

Falsy values: \`false\`, \`0\`, \`-0\`, \`0n\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. Everything else is truthy — including empty arrays \`[]\` and empty objects \`{}\` (gotcha!).`,
    codeExamples: [
      {
        title: 'if / else if / else',
        description: 'Grading example.',
        code: `const score = 82;
let grade;
if (score >= 90) grade = "A";
else if (score >= 75) grade = "B";
else if (score >= 60) grade = "C";
else grade = "F";
console.log(grade);`,
        input: '',
        expectedOutput: 'B',
        order: 1,
      },
      {
        title: 'switch',
        description: 'One value, many cases.',
        code: `const day = 3;
let name;
switch (day) {
  case 1: name = "Mon"; break;
  case 2: name = "Tue"; break;
  case 3: name = "Wed"; break;
  default: name = "?";
}
console.log(name);`,
        input: '',
        expectedOutput: 'Wed',
        order: 2,
      },
      {
        title: 'Ternary and truthiness',
        description: 'Inline expression and empty array gotcha.',
        code: `const items = [];
const status = items.length ? "has items" : "empty";
console.log(status);
console.log(Boolean([]));`,
        input: '',
        expectedOutput: 'empty\ntrue',
        order: 3,
      },
    ],
    notes: [
      'Empty array `[]` and empty object `{}` are TRUTHY in JS (unlike Python).',
      'Forgetting `break` in `switch` causes silent fall-through bugs.',
      'Ternary is an expression, so it returns a value — useful for conditional assignment.',
    ],
    tips: [
      'Use `items.length` (a number) rather than `items` (always truthy) for "has items" checks.',
      'A `switch` with many cases can often be replaced by an object lookup.',
      'Use early `return` to flatten deep `if/else` chains.',
    ],
    tags: ['conditionals', 'if', 'switch', 'foundations'],
  }),

  t({
    title: 'Loops: for, while, for...of, for...in',
    description: 'Iterate with classic for, while, and the modern for...of / forEach.',
    module: 'Foundations',
    concept: 'Loops',
    difficulty: 'beginner',
    order: 6,
    estimatedMinutes: 16,
    content: `## Loops

### Classic for

\`for (let i = 0; i < n; i++) { ... }\` — full control.

### while / do-while

\`while (cond) { ... }\` checks first; \`do { ... } while (cond)\` runs once before checking.

### for...of

Walks values of an iterable (arrays, strings, Maps, Sets): \`for (const x of items) { ... }\`. Cleanest for most array loops.

### for...in

Walks **keys** of an object: \`for (const key in obj) { ... }\`. **Don't use it for arrays** — it can pick up inherited properties.

### Array.forEach

\`items.forEach(callback)\` — clean but you can't \`break\` or \`continue\` out of it.

### Control statements

\`break\` exits the loop; \`continue\` skips to the next iteration.`,
    codeExamples: [
      {
        title: 'for...of array',
        description: 'Walk values directly.',
        code: `const colors = ["red", "green", "blue"];
for (const c of colors) {
  console.log(c);
}`,
        input: '',
        expectedOutput: 'red\ngreen\nblue',
        order: 1,
      },
      {
        title: 'for...in over an object',
        description: 'Walk keys, look up values.',
        code: `const scores = { alex: 90, beth: 82 };
for (const name in scores) {
  console.log(name, scores[name]);
}`,
        input: '',
        expectedOutput: 'alex 90\nbeth 82',
        order: 2,
      },
      {
        title: 'while with break',
        description: 'Loop until a condition is hit.',
        code: `let n = 1;
while (true) {
  if (n * n > 100) break;
  n++;
}
console.log(n);`,
        input: '',
        expectedOutput: '11',
        order: 3,
      },
    ],
    notes: [
      'Don\'t use `for...in` on arrays — use `for...of` or `forEach`.',
      '`forEach` can\'t be exited early. Use `for...of` if you need `break`.',
      '`for...of` works on anything iterable — strings, arrays, Maps, Sets, even generators.',
    ],
    tips: [
      'Prefer `for...of` over classic `for` when you don\'t need the index.',
      'Use `for (const [i, val] of items.entries())` to get both index and value.',
      'Reach for `.map`, `.filter`, `.reduce` for transformations — they\'re often clearer than loops.',
    ],
    tags: ['loops', 'for', 'while', 'foundations'],
  }),

  // ============================================================
  // MODULE 2 — ARRAYS, OBJECTS, FUNCTIONS (beginner → intermediate)
  // ============================================================
  t({
    title: 'Arrays: Methods, Spread, and Destructuring',
    description: 'Create, mutate, and transform arrays using core methods and modern syntax.',
    module: 'Arrays Objects and Functions',
    concept: 'Arrays',
    difficulty: 'beginner',
    order: 7,
    estimatedMinutes: 20,
    content: `## Arrays

JavaScript arrays are ordered, mutable, can hold any types, and have many methods.

### Mutating vs non-mutating

- Mutating: \`push\`, \`pop\`, \`shift\`, \`unshift\`, \`splice\`, \`sort\`, \`reverse\`
- Non-mutating: \`slice\`, \`map\`, \`filter\`, \`reduce\`, \`concat\`, \`flat\`, \`toSorted\` (ES2023)

Prefer non-mutating when possible — easier to reason about, especially in React state.

### Spread and rest

\`[...arr1, ...arr2]\` builds a new array. \`const [first, ...rest] = arr\` destructures.

### Destructuring

\`const [a, b] = [1, 2]\` assigns positionally. Skip with comma: \`const [, second] = arr\`.

### Searching

\`.includes(x)\`, \`.indexOf(x)\`, \`.find(predicate)\`, \`.findIndex(predicate)\`.`,
    codeExamples: [
      {
        title: 'push, pop, slice',
        description: 'Common array mutations vs non-mutations.',
        code: `const nums = [1, 2, 3];
nums.push(4);
const last = nums.pop();
const middle = nums.slice(1, 3);
console.log(nums, last, middle);`,
        input: '',
        expectedOutput: '[ 1, 2, 3 ] 4 [ 2, 3 ]',
        order: 1,
      },
      {
        title: 'Destructuring and rest',
        description: 'Pull values out by position.',
        code: `const colors = ["red", "green", "blue", "yellow"];
const [first, second, ...others] = colors;
console.log(first, second, others);`,
        input: '',
        expectedOutput: 'red green [ \'blue\', \'yellow\' ]',
        order: 2,
      },
      {
        title: 'Spread for copying / merging',
        description: 'Always make a copy before sorting in React-style code.',
        code: `const a = [3, 1, 4];
const sorted = [...a].sort((x, y) => x - y);
console.log(a);
console.log(sorted);`,
        input: '',
        expectedOutput: '[ 3, 1, 4 ]\n[ 1, 3, 4 ]',
        order: 3,
      },
    ],
    notes: [
      '`sort()` MUTATES — `[...arr].sort()` to keep the original.',
      'Default `.sort()` compares strings — pass `(a,b) => a-b` for numeric sort.',
      'Arrays are objects; `typeof []` returns `"object"`. Use `Array.isArray(x)` instead.',
    ],
    tips: [
      'Prefer immutable methods (`map`, `filter`, `slice`) in modern code.',
      'Use `Array.from({length: 5}, (_, i) => i)` to generate ranges.',
      'Spread `[...arr]` is a shallow copy — nested objects still share references.',
    ],
    tags: ['arrays', 'spread', 'destructuring', 'intermediate'],
  }),

  t({
    title: 'Objects: Properties, Shorthand, and Destructuring',
    description: 'Create and use objects with modern shorthand, computed keys, and destructuring.',
    module: 'Arrays Objects and Functions',
    concept: 'Objects',
    difficulty: 'beginner',
    order: 8,
    estimatedMinutes: 18,
    content: `## Objects

Key/value containers. Keys are strings (or Symbols); values are anything.

### Creating

\`\`\`javascript
const user = { name: "Alex", age: 25 };
\`\`\`

### Access

- Dot: \`user.name\`
- Bracket: \`user["name"]\` — required for dynamic or non-identifier keys

### Destructuring

\`const { name, age } = user\`. Rename with \`const { name: userName } = user\`. Default: \`const { role = "guest" } = user\`.

### Spread

\`const updated = { ...user, age: 26 }\` — shallow copy with override.

### Useful methods

\`Object.keys(o)\`, \`Object.values(o)\`, \`Object.entries(o)\`, \`Object.fromEntries(arr)\`, \`Object.assign(target, ...sources)\`.

### Shorthand

\`{ name, age }\` is shorthand for \`{ name: name, age: age }\`.`,
    codeExamples: [
      {
        title: 'Property shorthand',
        description: 'Build an object from variables.',
        code: `const name = "Alex";
const age = 25;
const user = { name, age };
console.log(user);`,
        input: '',
        expectedOutput: '{ name: \'Alex\', age: 25 }',
        order: 1,
      },
      {
        title: 'Destructuring with rename + default',
        description: 'Pull out values, give them new names.',
        code: `const config = { host: "localhost" };
const { host, port = 5000, host: address } = config;
console.log(host, port, address);`,
        input: '',
        expectedOutput: 'localhost 5000 localhost',
        order: 2,
      },
      {
        title: 'Iterating with Object.entries',
        description: 'Walk key/value pairs.',
        code: `const scores = { alex: 90, beth: 82, carl: 75 };
for (const [name, score] of Object.entries(scores)) {
  console.log(\`\${name}: \${score}\`);
}`,
        input: '',
        expectedOutput: 'alex: 90\nbeth: 82\ncarl: 75',
        order: 3,
      },
    ],
    notes: [
      'Object keys are always strings (or Symbols). Numeric keys get coerced to strings.',
      '`{ ...a, ...b }` does a SHALLOW merge — nested objects still share references.',
      'Property access on missing keys returns `undefined`, not an error.',
    ],
    tips: [
      'Use destructuring to grab only what you need from function arguments.',
      'For deep cloning, use `structuredClone(obj)` (modern) or a library.',
      'Use optional chaining `user?.profile?.name` to safely access nested properties.',
    ],
    tags: ['objects', 'destructuring', 'spread', 'intermediate'],
  }),

  t({
    title: 'Functions: Declarations, Expressions, Arrow',
    description: 'Three ways to define a function; when to use which.',
    module: 'Arrays Objects and Functions',
    concept: 'Functions',
    difficulty: 'beginner',
    order: 9,
    estimatedMinutes: 18,
    content: `## Functions

### Function declarations

\`\`\`javascript
function greet(name) { return \`Hi, \${name}\`; }
\`\`\`

Hoisted — callable before the declaration appears in the source.

### Function expressions

\`\`\`javascript
const greet = function(name) { return \`Hi, \${name}\`; };
\`\`\`

Not hoisted; assigned at runtime.

### Arrow functions

\`\`\`javascript
const greet = (name) => \`Hi, \${name}\`;
\`\`\`

Concise. No own \`this\`, no own \`arguments\`. Implicit return when there's no \`{}\`.

### Default and rest parameters

\`\`\`javascript
function pad(s, n = 4, char = "0") { ... }
function sum(...nums) { ... }
\`\`\``,
    codeExamples: [
      {
        title: 'Three styles, same result',
        description: 'Pick the style that fits the context.',
        code: `function decl(n) { return n * 2; }
const expr = function(n) { return n * 2; };
const arrow = n => n * 2;
console.log(decl(5), expr(5), arrow(5));`,
        input: '',
        expectedOutput: '10 10 10',
        order: 1,
      },
      {
        title: 'Default + rest parameters',
        description: 'Make your signature flexible.',
        code: `function tag(label = "info", ...messages) {
  return \`[\${label}] \${messages.join(" | ")}\`;
}
console.log(tag());
console.log(tag("warn", "low disk", "slow query"));`,
        input: '',
        expectedOutput: '[info] \n[warn] low disk | slow query',
        order: 2,
      },
      {
        title: 'Arrow function in callback',
        description: 'Arrow shines for short callbacks.',
        code: `const nums = [1, 2, 3, 4];
const doubled = nums.map(n => n * 2);
console.log(doubled);`,
        input: '',
        expectedOutput: '[ 2, 4, 6, 8 ]',
        order: 3,
      },
    ],
    notes: [
      'Arrow functions inherit `this` from the enclosing scope — that\'s usually what you want.',
      'A function declaration must be a statement; expressions can appear inside other expressions.',
      'Arrow functions cannot be used as constructors (no `new`).',
    ],
    tips: [
      'Default to arrow functions for callbacks; named declarations for top-level utilities.',
      'Avoid arrow functions for object methods that need their own `this`.',
      'Use rest params instead of the legacy `arguments` object.',
    ],
    tags: ['functions', 'arrow', 'declarations', 'intermediate'],
  }),

  t({
    title: 'Higher-Order Functions: map, filter, reduce',
    description: 'Transform arrays declaratively without explicit loops.',
    module: 'Arrays Objects and Functions',
    concept: 'Higher-Order Functions',
    difficulty: 'intermediate',
    order: 10,
    estimatedMinutes: 20,
    content: `## map, filter, reduce

These are array methods that take a callback. They return new arrays without mutating the original.

### map

\`arr.map(fn)\` — apply \`fn\` to each item, return new array of the same length.

### filter

\`arr.filter(predicate)\` — keep only items where \`predicate(item)\` is truthy.

### reduce

\`arr.reduce(fn, initial)\` — accumulate to a single value. The callback gets \`(accumulator, currentItem)\`.

### Chaining

\`arr.filter(...).map(...).reduce(...)\` is idiomatic. Reads top-down like a pipeline.

### Other useful HOFs

\`.find\`, \`.findIndex\`, \`.some\`, \`.every\`, \`.flatMap\`, \`.sort((a,b) => ...)\`.`,
    codeExamples: [
      {
        title: 'map and filter chained',
        description: 'Keep even numbers, then square them.',
        code: `const nums = [1, 2, 3, 4, 5, 6];
const evenSquares = nums
  .filter(n => n % 2 === 0)
  .map(n => n * n);
console.log(evenSquares);`,
        input: '',
        expectedOutput: '[ 4, 16, 36 ]',
        order: 1,
      },
      {
        title: 'reduce for sum',
        description: 'Accumulator starts at 0; add each item.',
        code: `const nums = [10, 20, 30, 40];
const total = nums.reduce((acc, n) => acc + n, 0);
console.log(total);`,
        input: '',
        expectedOutput: '100',
        order: 2,
      },
      {
        title: 'reduce for grouping',
        description: 'Build a histogram with reduce.',
        code: `const items = ["apple", "banana", "apple", "cherry", "banana", "apple"];
const counts = items.reduce((acc, item) => {
  acc[item] = (acc[item] || 0) + 1;
  return acc;
}, {});
console.log(counts);`,
        input: '',
        expectedOutput: '{ apple: 3, banana: 2, cherry: 1 }',
        order: 3,
      },
    ],
    notes: [
      '`reduce` is powerful but easy to abuse — when in doubt, a `for...of` loop is more readable.',
      'Always pass the initial value to `reduce` — otherwise the first element is used and edge cases get weird.',
      '`some()` returns true if at least one matches; `every()` returns true only if all match.',
    ],
    tips: [
      'Don\'t `forEach` and `push` — use `map` or `filter` instead.',
      'For complex transformations, chain `.filter().map().reduce()` rather than a giant loop.',
      'Use `Object.groupBy` (modern) instead of `reduce` for grouping.',
    ],
    tags: ['map', 'filter', 'reduce', 'functional', 'intermediate'],
  }),

  t({
    title: 'Spread, Rest, and Destructuring (Advanced)',
    description: 'Master the spread/rest syntax for clean array, object, and parameter handling.',
    module: 'Arrays Objects and Functions',
    concept: 'Spread Rest Destructuring',
    difficulty: 'intermediate',
    order: 11,
    estimatedMinutes: 18,
    content: `## Spread, Rest, and Destructuring

Same syntax (\`...\`) does different things depending on position.

### Spread (read)

Expands an iterable into individual items:
- \`Math.max(...[1, 2, 3])\` → \`Math.max(1, 2, 3)\`
- \`[...arr1, ...arr2]\` merges arrays
- \`{ ...obj1, ...obj2 }\` merges objects (right wins on key conflicts)

### Rest (write)

Collects "the rest":
- \`function f(...args)\` — gather all arguments
- \`const [first, ...others] = arr\` — first item, rest in an array
- \`const { a, ...rest } = obj\` — pluck \`a\`, rest in an object

### Destructuring with patterns

You can rename, set defaults, and nest:

\`\`\`javascript
const { user: { name, age = 0 } } = response;
\`\`\``,
    codeExamples: [
      {
        title: 'Object spread for updates',
        description: 'Build a new object with changes.',
        code: `const user = { name: "Alex", age: 25, role: "dev" };
const updated = { ...user, age: 26 };
console.log(updated);
console.log(user);  // unchanged`,
        input: '',
        expectedOutput: "{ name: 'Alex', age: 26, role: 'dev' }\n{ name: 'Alex', age: 25, role: 'dev' }",
        order: 1,
      },
      {
        title: 'Rest in function args',
        description: 'Accept any number of arguments.',
        code: `function logAll(label, ...messages) {
  for (const msg of messages) {
    console.log(label, msg);
  }
}
logAll("[info]", "starting", "connected", "ready");`,
        input: '',
        expectedOutput: '[info] starting\n[info] connected\n[info] ready',
        order: 2,
      },
      {
        title: 'Pluck with rest',
        description: 'Separate one property from the rest.',
        code: `const { password, ...safe } = { name: "Alex", password: "x", role: "dev" };
console.log(safe);`,
        input: '',
        expectedOutput: "{ name: 'Alex', role: 'dev' }",
        order: 3,
      },
    ],
    notes: [
      'Spread on arrays uses the iterator protocol; spread on objects copies own enumerable properties.',
      'Object spread does a SHALLOW copy — nested objects still share references.',
      'Rest must be the LAST parameter / destructuring slot.',
    ],
    tips: [
      'Use object spread for "edit this field, leave the rest" patterns — common in React state.',
      'Use array spread to make a quick non-mutating copy: `const copy = [...arr]`.',
      'For deep clones, use `structuredClone(obj)` instead of `JSON.parse(JSON.stringify(...))`.',
    ],
    tags: ['spread', 'rest', 'destructuring', 'intermediate'],
  }),

  t({
    title: 'Closures and Scope',
    description: 'How functions remember the scope where they were defined.',
    module: 'Arrays Objects and Functions',
    concept: 'Closures',
    difficulty: 'intermediate',
    order: 12,
    estimatedMinutes: 20,
    content: `## Closures

A **closure** is a function that "remembers" the variables from where it was defined, even after the outer function returns.

### Why it matters

Closures power: callbacks, event handlers, currying, private state in objects, factory functions, React hooks.

### Example

\`\`\`javascript
function counter() {
  let count = 0;
  return () => ++count;
}
const c = counter();
c(); // 1
c(); // 2
\`\`\`

The returned function keeps a reference to \`count\`, even though \`counter()\` has returned.

### Scope chain

JavaScript scopes form a chain: a function looks up variables in its own scope, then its enclosing scope, then global. **Block scope** is created by \`let\`/\`const\` inside \`{ }\`.

### Common pitfall: var in a loop

Pre-ES6 \`var\` inside a loop didn't create a new binding per iteration — all closures saw the final value. \`let\` fixes this.`,
    codeExamples: [
      {
        title: 'Counter via closure',
        description: 'Private state without classes.',
        code: `function makeCounter() {
  let n = 0;
  return {
    inc: () => ++n,
    value: () => n,
  };
}
const c = makeCounter();
c.inc(); c.inc(); c.inc();
console.log(c.value());`,
        input: '',
        expectedOutput: '3',
        order: 1,
      },
      {
        title: 'Function factory (currying)',
        description: 'Return a customized function.',
        code: `function multiplyBy(factor) {
  return x => x * factor;
}
const double = multiplyBy(2);
const triple = multiplyBy(3);
console.log(double(10), triple(10));`,
        input: '',
        expectedOutput: '20 30',
        order: 2,
      },
      {
        title: 'let vs var in loop',
        description: 'let creates a new binding each iteration.',
        code: `const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()));`,
        input: '',
        expectedOutput: '[ 0, 1, 2 ]',
        order: 3,
      },
    ],
    notes: [
      'Closures capture variables by reference, not by value.',
      'Memory: closures keep their captured scope alive — be careful with long-lived closures and big captured data.',
      '`var` is function-scoped, so it doesn\'t create per-iteration bindings.',
    ],
    tips: [
      'Use closures for "module pattern" — expose only the API, keep state private.',
      'In React, stale closures are a common bug — `useCallback` dependencies fix it.',
      'Avoid capturing huge objects in closures you keep around for a long time.',
    ],
    tags: ['closures', 'scope', 'functions', 'intermediate'],
  }),

  // ============================================================
  // MODULE 3 — INTERMEDIATE JAVASCRIPT (intermediate)
  // ============================================================
  t({
    title: 'Promises and async / await',
    description: 'Handle asynchronous work cleanly with Promises and the async/await keywords.',
    module: 'Intermediate JavaScript',
    concept: 'Async Programming',
    difficulty: 'intermediate',
    order: 13,
    estimatedMinutes: 25,
    content: `## Promises and async/await

A **Promise** represents a future value. It's in one of three states: \`pending\`, \`fulfilled\`, or \`rejected\`.

### Creating

\`\`\`javascript
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 1000);
});
\`\`\`

But most often you'll *consume* promises from libraries (\`fetch\`, \`axios\`, file APIs) rather than create them.

### Consuming with .then

\`p.then(value => ...).catch(err => ...).finally(() => ...)\`

### async / await (preferred)

\`\`\`javascript
async function fetchUser(id) {
  try {
    const res = await fetch(\`/users/\${id}\`);
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}
\`\`\`

\`async\` makes a function return a Promise. \`await\` pauses until the awaited Promise settles.

### Concurrency

\`Promise.all([...])\` runs in parallel, all-or-nothing. \`Promise.allSettled([...])\` returns results from all, even failures. \`Promise.race([...])\` returns the first to settle.`,
    codeExamples: [
      {
        title: 'async/await with fetch',
        description: 'Cleaner than .then chains.',
        code: `async function getUser(id) {
  const res = await fetch(\`https://api.example.com/users/\${id}\`);
  if (!res.ok) throw new Error("not found");
  return res.json();
}
// getUser(1).then(console.log);`,
        input: '',
        expectedOutput: '(no output — example)',
        order: 1,
      },
      {
        title: 'Promise.all for parallel work',
        description: 'Start all requests, wait for all.',
        code: `async function fetchAll(ids) {
  const promises = ids.map(id =>
    fetch(\`/api/items/\${id}\`).then(r => r.json())
  );
  return Promise.all(promises);
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 2,
      },
      {
        title: 'Sequential vs parallel timing',
        description: 'Each await blocks; Promise.all unblocks.',
        code: `const sleep = ms => new Promise(r => setTimeout(r, ms));

async function sequential() {
  const t0 = Date.now();
  await sleep(100);
  await sleep(100);
  console.log("seq:", Date.now() - t0, "ms");
}
async function parallel() {
  const t0 = Date.now();
  await Promise.all([sleep(100), sleep(100)]);
  console.log("par:", Date.now() - t0, "ms");
}
await sequential();
await parallel();`,
        input: '',
        expectedOutput: 'seq: 200 ms\npar: 100 ms',
        order: 3,
      },
    ],
    notes: [
      'An `async` function always returns a Promise — even if it returns a plain value.',
      '`await` only works inside `async` functions (or top-level in modules).',
      'Unhandled rejections terminate the process in modern Node — always `try/catch` or `.catch()`.',
    ],
    tips: [
      'Default to `async/await` over `.then()` chains. Way more readable.',
      'Use `Promise.all` for independent requests; sequential `await` for dependent ones.',
      'Wrap awaits in `try/catch` for proper error handling.',
    ],
    tags: ['async', 'promises', 'await', 'intermediate'],
  }),

  t({
    title: 'Error Handling: try/catch and Custom Errors',
    description: 'Catch errors, throw your own, and distinguish error types in JavaScript.',
    module: 'Intermediate JavaScript',
    concept: 'Error Handling',
    difficulty: 'intermediate',
    order: 14,
    estimatedMinutes: 18,
    content: `## Error Handling

### throw and try/catch

\`throw\` raises an exception; \`try/catch/finally\` handles it.

\`\`\`javascript
try {
  risky();
} catch (err) {
  console.error(err.message);
} finally {
  cleanup();
}
\`\`\`

### Error types

Built-in: \`Error\`, \`TypeError\`, \`RangeError\`, \`SyntaxError\`, \`ReferenceError\`. \`instanceof\` checks the type.

### Custom errors

\`\`\`javascript
class NotFoundError extends Error {
  constructor(id) {
    super(\`Item \${id} not found\`);
    this.name = "NotFoundError";
    this.id = id;
  }
}
\`\`\`

### Async errors

\`try/catch\` around \`await\` works exactly like sync errors. With \`.then\` chains, use \`.catch()\`.`,
    codeExamples: [
      {
        title: 'try/catch/finally',
        description: 'Each clause has its own job.',
        code: `function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (err) {
    console.warn("bad json:", err.message);
    return null;
  } finally {
    console.log("done");
  }
}
safeParse("{not valid}");`,
        input: '',
        expectedOutput: 'bad json: Unexpected token n in JSON at position 1\ndone',
        order: 1,
      },
      {
        title: 'Custom error class',
        description: 'Domain-specific error type.',
        code: `class ValidationError extends Error {
  constructor(field, reason) {
    super(\`\${field}: \${reason}\`);
    this.name = "ValidationError";
    this.field = field;
  }
}

try {
  throw new ValidationError("email", "missing");
} catch (e) {
  if (e instanceof ValidationError) {
    console.log("validation failed on", e.field);
  }
}`,
        input: '',
        expectedOutput: 'validation failed on email',
        order: 2,
      },
      {
        title: 'Async error handling',
        description: 'try/catch around await.',
        code: `async function load() {
  try {
    const res = await fetch("/no-such-url");
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch (err) {
    return { error: err.message };
  }
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      '`throw` accepts ANY value, but convention is to throw `Error` (or subclass) instances.',
      '`finally` runs even if you `return` from inside the `try` block.',
      'Always set `this.name` on custom errors so logs are clear.',
    ],
    tips: [
      'Catch as narrowly as possible — don\'t swallow errors silently.',
      'For expected failure cases, return a result type (`{ok, value}`) instead of throwing.',
      'In `async` code, an unhandled rejection is a process-killer in modern Node.',
    ],
    tags: ['errors', 'try-catch', 'exceptions', 'intermediate'],
  }),

  t({
    title: 'ES Modules: import / export',
    description: 'Split code across files with the modern ESM module system.',
    module: 'Intermediate JavaScript',
    concept: 'Modules',
    difficulty: 'intermediate',
    order: 15,
    estimatedMinutes: 16,
    content: `## ES Modules

The modern module system. Browsers and Node both support it natively.

### Exporting

Named:
\`\`\`javascript
export const PI = 3.14;
export function double(x) { return x * 2; }
\`\`\`

Default (one per file):
\`\`\`javascript
export default function User(name) { ... }
\`\`\`

### Importing

\`\`\`javascript
import { PI, double } from "./math.js";
import User from "./user.js";        // default
import * as math from "./math.js";   // namespace import
\`\`\`

### Renaming

\`import { double as dbl } from "./math.js"\`

### Dynamic import

\`const mod = await import("./heavy.js")\` — loads lazily, returns a Promise.

### ESM vs CommonJS

Node still supports CommonJS (\`require\` / \`module.exports\`). New code should use ESM. Mark the package with \`"type": "module"\` in package.json.`,
    codeExamples: [
      {
        title: 'Named export and import',
        description: 'Export several values, import what you need.',
        code: `// math.js
export const PI = 3.14;
export function area(r) { return PI * r * r; }

// app.js
import { PI, area } from "./math.js";
console.log(area(2));`,
        input: '',
        expectedOutput: '12.56',
        order: 1,
      },
      {
        title: 'Default export',
        description: 'Single primary export per file.',
        code: `// User.js
export default class User {
  constructor(name) { this.name = name; }
}

// app.js
import User from "./User.js";
console.log(new User("Alex").name);`,
        input: '',
        expectedOutput: 'Alex',
        order: 2,
      },
      {
        title: 'Re-exporting',
        description: 'Common in index.js barrel files.',
        code: `// index.js
export { default as User } from "./User.js";
export { area, PI } from "./math.js";`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      'ESM imports are read-only and statically analyzable — bundlers can tree-shake.',
      'CommonJS (`require`) is still in many older Node packages; both can coexist.',
      'Dynamic `import()` returns a Promise — useful for code splitting.',
    ],
    tips: [
      'Prefer named exports — they\'re easier to refactor and document.',
      'Avoid mixing default and named exports in the same file unless necessary.',
      'Barrel files (`index.js` re-exports) make imports cleaner but can hurt tree-shaking.',
    ],
    tags: ['modules', 'import', 'export', 'esm', 'intermediate'],
  }),

  t({
    title: 'Classes and Constructors',
    description: 'Define classes with methods, static members, getters/setters, and private fields.',
    module: 'Intermediate JavaScript',
    concept: 'Classes',
    difficulty: 'intermediate',
    order: 16,
    estimatedMinutes: 22,
    content: `## Classes

ES6 class syntax over the older prototype mechanism.

### Definition

\`\`\`javascript
class User {
  constructor(name) {
    this.name = name;
  }
  greet() { return \`Hi, \${this.name}\`; }
}
\`\`\`

### Static members

\`static fromString(s) { ... }\` — called on the class, not an instance.

### Getters and setters

\`get fullName() { ... }\`, \`set fullName(v) { ... }\` — look like properties on access.

### Private fields (modern)

Prefix with \`#\`:
\`\`\`javascript
class Counter {
  #count = 0;
  inc() { this.#count++; }
}
\`\`\`

\`#count\` is truly inaccessible from outside the class.`,
    codeExamples: [
      {
        title: 'Basic class',
        description: 'Constructor + methods.',
        code: `class Counter {
  constructor() { this.value = 0; }
  inc() { this.value++; return this; }
}
const c = new Counter();
c.inc().inc().inc();
console.log(c.value);`,
        input: '',
        expectedOutput: '3',
        order: 1,
      },
      {
        title: 'getter / setter',
        description: 'Looks like a property, runs as a method.',
        code: `class Temp {
  #celsius = 0;
  get fahrenheit() { return this.#celsius * 9/5 + 32; }
  set fahrenheit(f) { this.#celsius = (f - 32) * 5/9; }
}
const t = new Temp();
t.fahrenheit = 100;
console.log(t.fahrenheit);`,
        input: '',
        expectedOutput: '100',
        order: 2,
      },
      {
        title: 'Static factory',
        description: 'Alternative constructor.',
        code: `class Date2 {
  constructor(y, m, d) { this.y = y; this.m = m; this.d = d; }
  static today() {
    const n = new Date();
    return new Date2(n.getFullYear(), n.getMonth()+1, n.getDate());
  }
}
console.log(Date2.today());`,
        input: '',
        expectedOutput: '(today\'s date)',
        order: 3,
      },
    ],
    notes: [
      'Class declarations are NOT hoisted — must define before use.',
      '`this` inside class methods refers to the instance.',
      'Private fields (`#`) only work inside the class that declares them.',
    ],
    tips: [
      'Return `this` from setter-like methods to enable chaining.',
      'Prefer factories (static methods) over constructors with many parameters.',
      'For purely data shapes, plain objects are often simpler than classes.',
    ],
    tags: ['classes', 'oop', 'constructor', 'intermediate'],
  }),

  t({
    title: 'Prototypes and Inheritance',
    description: 'Understand the prototype chain and extend classes with super.',
    module: 'Intermediate JavaScript',
    concept: 'Inheritance',
    difficulty: 'intermediate',
    order: 17,
    estimatedMinutes: 22,
    content: `## Prototypes and Inheritance

### The prototype chain

Every object has an internal link to another object — its **prototype**. When you access a property, JS walks the chain until it finds the name or hits \`null\`.

### Class inheritance

\`\`\`javascript
class Animal {
  constructor(name) { this.name = name; }
  speak() { return "..."; }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() { return "woof"; }
}
\`\`\`

\`extends\` sets the prototype link; \`super(...)\` calls the parent constructor; \`super.method()\` calls the parent's method.

### Composition vs inheritance

Inheritance reuses behavior. **Composition** (storing instances of other classes) often scales better. Use inheritance when there's a true *is-a* relationship.

### Object.create

\`Object.create(proto)\` makes a new object with the given prototype — closer to JS metal than class syntax.`,
    codeExamples: [
      {
        title: 'Class inheritance with super',
        description: 'Extend a base class.',
        code: `class Shape {
  constructor(name) { this.name = name; }
  describe() { return \`Shape: \${this.name}\`; }
}
class Circle extends Shape {
  constructor(r) {
    super("circle");
    this.r = r;
  }
  describe() { return \`\${super.describe()}, r=\${this.r}\`; }
}
console.log(new Circle(5).describe());`,
        input: '',
        expectedOutput: 'Shape: circle, r=5',
        order: 1,
      },
      {
        title: 'Polymorphism over a list',
        description: 'Treat heterogeneous objects uniformly.',
        code: `class Cat { speak() { return "meow"; } }
class Dog { speak() { return "woof"; } }
const animals = [new Cat(), new Dog(), new Cat()];
console.log(animals.map(a => a.speak()));`,
        input: '',
        expectedOutput: "[ 'meow', 'woof', 'meow' ]",
        order: 2,
      },
      {
        title: 'instanceof check',
        description: 'Runtime check of the prototype chain.',
        code: `class A {}
class B extends A {}
const b = new B();
console.log(b instanceof B);
console.log(b instanceof A);`,
        input: '',
        expectedOutput: 'true\ntrue',
        order: 3,
      },
    ],
    notes: [
      'Class syntax in JS is mostly sugar over the prototype chain.',
      '`super()` must be called before using `this` in a derived constructor.',
      '`Object.getPrototypeOf(obj)` returns the prototype; `Object.setPrototypeOf` changes it (slow — avoid in hot paths).',
    ],
    tips: [
      'Prefer composition over inheritance unless the subclass truly *is a* parent.',
      'Limit inheritance depth to 1-2 levels — more usually signals a design issue.',
      'Use `Object.create(null)` for "pure dictionary" objects with no prototype.',
    ],
    tags: ['prototypes', 'inheritance', 'classes', 'intermediate'],
  }),

  t({
    title: 'DOM Manipulation Basics',
    description: 'Find, modify, and create elements in the browser DOM.',
    module: 'Intermediate JavaScript',
    concept: 'DOM Manipulation',
    difficulty: 'intermediate',
    order: 18,
    estimatedMinutes: 22,
    content: `## DOM Manipulation

The **DOM** (Document Object Model) is the browser's tree of HTML elements you can read and modify with JS.

### Selecting

- \`document.getElementById("id")\` — by id (single element)
- \`document.querySelector(".cls")\` — CSS selector, first match
- \`document.querySelectorAll("li")\` — all matches (NodeList — array-like)

### Reading / writing content

- \`el.textContent\` — text only (safe)
- \`el.innerHTML\` — HTML markup (be careful with user input — XSS risk)
- \`el.value\` — for form inputs

### Attributes and classes

\`el.setAttribute("data-id", "5")\`, \`el.dataset.id\`, \`el.classList.add("active")\`, \`el.classList.toggle("hidden")\`.

### Creating and inserting

\`\`\`javascript
const li = document.createElement("li");
li.textContent = "new item";
list.appendChild(li);
\`\`\`

### Events

\`el.addEventListener("click", e => ...)\` — preferred. \`removeEventListener\` to clean up.`,
    codeExamples: [
      {
        title: 'Select and update',
        description: 'Change text and class.',
        code: `// HTML: <h1 id="title">Hello</h1>
const h = document.getElementById("title");
h.textContent = "Welcome!";
h.classList.add("highlighted");`,
        input: '',
        expectedOutput: '(no output — DOM mutation)',
        order: 1,
      },
      {
        title: 'Build a list dynamically',
        description: 'createElement + appendChild.',
        code: `// HTML: <ul id="list"></ul>
const ul = document.getElementById("list");
["a", "b", "c"].forEach(text => {
  const li = document.createElement("li");
  li.textContent = text;
  ul.appendChild(li);
});`,
        input: '',
        expectedOutput: '(no output — DOM mutation)',
        order: 2,
      },
      {
        title: 'Event listener',
        description: 'React to user clicks.',
        code: `// HTML: <button id="btn">Click me</button>
document.getElementById("btn").addEventListener("click", () => {
  console.log("clicked");
});`,
        input: '',
        expectedOutput: 'clicked (when clicked)',
        order: 3,
      },
    ],
    notes: [
      '`innerHTML` with user input is an XSS vector — sanitize or use `textContent`.',
      '`querySelectorAll` returns a static NodeList; `getElementsByClassName` returns a live HTMLCollection.',
      'Modifying classes is way faster than setting `style` directly.',
    ],
    tips: [
      'Cache selectors instead of re-querying inside loops.',
      'Build large DOM updates in a `DocumentFragment`, then append once.',
      'Modern frameworks (React, Vue) abstract most direct DOM manipulation — but you still need to know the basics.',
    ],
    tags: ['dom', 'browser', 'events', 'intermediate'],
  }),

  // ============================================================
  // MODULE 4 — ADVANCED JAVASCRIPT (advanced)
  // ============================================================
  t({
    title: 'The Event Loop, Tasks, and Microtasks',
    description: 'How JavaScript schedules async work and what setTimeout vs Promise actually do.',
    module: 'Advanced JavaScript',
    concept: 'Event Loop',
    difficulty: 'advanced',
    order: 19,
    estimatedMinutes: 25,
    content: `## The Event Loop

JavaScript runs in a single thread. Asynchronous work is queued, not parallel.

### Three relevant queues

1. **Call stack** — the function currently executing
2. **Microtask queue** — Promise callbacks (.then, await continuations), \`queueMicrotask\`
3. **Task (macrotask) queue** — \`setTimeout\`, \`setInterval\`, I/O, UI events

### The cycle

After each task, JS runs ALL pending microtasks before picking the next task. That's why \`Promise.resolve().then(...)\` always fires before a 0ms \`setTimeout\`.

### Practical consequences

- Long sync work blocks the page — break it up with \`setTimeout(work, 0)\` or \`MessageChannel\`.
- Many \`.then\` chained without a yield can starve the task queue (microtask flood).
- \`queueMicrotask(fn)\` lets you schedule something for "after this stack but before any task".`,
    codeExamples: [
      {
        title: 'Microtask vs macrotask order',
        description: 'Promises always beat setTimeout(0).',
        code: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");`,
        input: '',
        expectedOutput: '1\n4\n3\n2',
        order: 1,
      },
      {
        title: 'await yields to microtask queue',
        description: 'Each await is a yield point.',
        code: `async function run() {
  console.log("a");
  await null;
  console.log("c");
}
run();
console.log("b");`,
        input: '',
        expectedOutput: 'a\nb\nc',
        order: 2,
      },
      {
        title: 'Breaking up sync work',
        description: 'Yield so the UI can respond.',
        code: `function heavyChunk(start, end, cb) {
  if (start >= end) return cb();
  for (let i = start; i < start + 1000; i++) {
    /* work */
  }
  setTimeout(() => heavyChunk(start + 1000, end, cb), 0);
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      'Promises (microtasks) ALWAYS run before timers (macrotasks) within the same tick.',
      'Node\'s event loop has more phases (timers, poll, check, close) but the microtask rule still holds.',
      '`requestAnimationFrame` is a special macrotask that runs before paint.',
    ],
    tips: [
      'For UI responsiveness, never synchronously process more than a few ms — break it up.',
      'Use `queueMicrotask` to defer cleanup that should run before next paint.',
      'Avoid `setTimeout(fn, 0)` for "as soon as possible" — `queueMicrotask` is sooner.',
    ],
    tags: ['event-loop', 'async', 'microtasks', 'advanced'],
  }),

  t({
    title: 'Fetch API and HTTP Requests',
    description: 'Make HTTP requests with fetch, handle JSON, errors, and AbortController.',
    module: 'Advanced JavaScript',
    concept: 'Fetch API',
    difficulty: 'advanced',
    order: 20,
    estimatedMinutes: 22,
    content: `## Fetch API

\`fetch(url, options)\` is the modern HTTP client built into browsers (and Node 18+).

### Basics

\`\`\`javascript
const res = await fetch("/api/users");
if (!res.ok) throw new Error(res.status);
const data = await res.json();
\`\`\`

### Important quirk

\`fetch\` only rejects on network failure — a 404 or 500 still resolves. Always check \`res.ok\` (true if status 200-299).

### POST with JSON

\`\`\`javascript
await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alex" }),
});
\`\`\`

### Cancelling with AbortController

\`\`\`javascript
const ctrl = new AbortController();
fetch(url, { signal: ctrl.signal });
ctrl.abort();
\`\`\`

### Timeout pattern

\`AbortSignal.timeout(5000)\` (modern) cancels automatically after 5s.`,
    codeExamples: [
      {
        title: 'GET with error handling',
        description: 'Always check res.ok.',
        code: `async function getUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 1,
      },
      {
        title: 'POST JSON',
        description: 'Set the headers and stringify the body.',
        code: `async function createUser(user) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 2,
      },
      {
        title: 'Timeout with AbortSignal',
        description: 'Auto-cancel slow requests.',
        code: `async function getWithTimeout(url, ms = 5000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  return res.json();
}`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      '`fetch` does NOT throw on 4xx/5xx — only on network errors. Check `res.ok`.',
      'Streaming: `res.body` is a ReadableStream — you can process huge responses chunk by chunk.',
      'CORS errors come from the BROWSER — the server has to send proper headers.',
    ],
    tips: [
      'Wrap fetch in a helper that throws on non-2xx — saves repeating the `res.ok` check.',
      'Always pass `AbortController` signals to fetch in React components that might unmount.',
      'For complex needs (interceptors, retries), libraries like `axios` or `ky` are still useful.',
    ],
    tags: ['fetch', 'http', 'api', 'advanced'],
  }),

  t({
    title: 'Iterators and Generators',
    description: 'Build custom iterables with Symbol.iterator and generator functions.',
    module: 'Advanced JavaScript',
    concept: 'Iterators and Generators',
    difficulty: 'advanced',
    order: 21,
    estimatedMinutes: 22,
    content: `## Iterators and Generators

### Iterables

An object is **iterable** if it has a method at \`[Symbol.iterator]\` that returns an **iterator** (an object with \`.next()\`).

Built-in iterables: arrays, strings, Maps, Sets, NodeLists.

### Generator functions

A function declared \`function*\` is a generator. \`yield\` pauses, and the returned object IS an iterator.

\`\`\`javascript
function* range(start, end) {
  for (let i = start; i < end; i++) yield i;
}
\`\`\`

### Why generators

- Memory-efficient sequences (infinite streams, lazy pipelines)
- Cleaner state machines
- Foundation for async iteration (\`for await...of\`)

### Async generators

\`async function* fetchPages()\` yields Promises. Consume with \`for await (const page of fetchPages())\`.`,
    codeExamples: [
      {
        title: 'Basic generator',
        description: 'function* with yield.',
        code: `function* fibs() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const g = fibs();
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);`,
        input: '',
        expectedOutput: '0\n1\n1\n2',
        order: 1,
      },
      {
        title: 'Custom iterable',
        description: 'Implement Symbol.iterator on a class.',
        code: `class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  *[Symbol.iterator]() {
    for (let i = this.start; i < this.end; i++) yield i;
  }
}
console.log([...new Range(1, 5)]);`,
        input: '',
        expectedOutput: '[ 1, 2, 3, 4 ]',
        order: 2,
      },
      {
        title: 'Async generator with for await',
        description: 'Stream values asynchronously.',
        code: `async function* tick() {
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 10));
    yield i;
  }
}
for await (const n of tick()) console.log(n);`,
        input: '',
        expectedOutput: '0\n1\n2',
        order: 3,
      },
    ],
    notes: [
      'A generator function returns a generator object — it doesn\'t run until you call `.next()`.',
      'Spread (`[...gen]`) and `for...of` work on any iterable.',
      'Async generators are perfect for paginated APIs.',
    ],
    tips: [
      'Use generators when you might not consume the whole sequence — saves memory.',
      'Prefer `for...of` over manual `.next()` calls for readability.',
      '`async function*` + `for await` is the cleanest way to consume paginated data.',
    ],
    tags: ['generators', 'iterators', 'advanced'],
  }),

  t({
    title: 'Modules, Bundlers, and Build Tools',
    description: 'How Vite, Webpack, and esbuild turn your modules into browser-ready bundles.',
    module: 'Advanced JavaScript',
    concept: 'Build Tools',
    difficulty: 'advanced',
    order: 22,
    estimatedMinutes: 20,
    content: `## Bundlers and Build Tools

### Why we need them

Browsers natively support ES modules now, but a bundler still helps with:
- **Tree-shaking** — remove unused code
- **Code splitting** — load chunks lazily
- **Asset processing** — CSS, images, SVG as imports
- **TypeScript / JSX transpilation**
- **Dev server with hot module reload (HMR)**

### Popular tools

- **Vite** — modern, fast dev server with native ESM; uses Rollup to build. Best default for new apps.
- **Webpack** — older, widely used, very configurable. Still common in large apps.
- **esbuild** — extremely fast, lower-level; often used inside other tools (Vite, Bun).
- **Bun** — runtime + bundler in one.
- **Parcel** — zero-config option.

### Tree-shaking

Possible because ESM imports are statically analyzable. Avoid:
- Side effects at module top level (mark them in \`package.json\` "sideEffects")
- CommonJS imports inside ESM code

### Code splitting

Use dynamic \`import()\` to lazy-load chunks:
\`\`\`javascript
const heavy = await import("./heavyModule.js");
\`\`\``,
    codeExamples: [
      {
        title: 'Static import',
        description: 'Bundled into the main chunk.',
        code: `import { Counter } from "./Counter.js";
new Counter().run();`,
        input: '',
        expectedOutput: '(no output)',
        order: 1,
      },
      {
        title: 'Dynamic import for code splitting',
        description: 'Loaded only when needed.',
        code: `async function showChart() {
  const { Chart } = await import("./Chart.js");
  new Chart().render();
}
button.addEventListener("click", showChart);`,
        input: '',
        expectedOutput: '(no output)',
        order: 2,
      },
      {
        title: 'Top-level await in ESM',
        description: 'Modules can wait before exporting.',
        code: `// config.js
export const config = await fetch("/config.json").then(r => r.json());`,
        input: '',
        expectedOutput: '(no output)',
        order: 3,
      },
    ],
    notes: [
      'Vite serves source modules directly in dev; bundles for production.',
      'Tree-shaking only works on ESM — CommonJS imports defeat it.',
      'Modern apps usually need both bundling AND a runtime — they\'re not the same.',
    ],
    tips: [
      'For new projects, default to Vite — fast dev server, zero config for most cases.',
      'Watch your bundle size with `vite build --report` or `rollup-plugin-visualizer`.',
      'Lazy-load admin / settings / dashboard chunks — they\'re usually not needed on first paint.',
    ],
    tags: ['vite', 'webpack', 'bundler', 'advanced'],
  }),

  t({
    title: 'Testing with Vitest / Jest',
    description: 'Write unit tests with describe/it/expect, mock dependencies, run with coverage.',
    module: 'Advanced JavaScript',
    concept: 'Testing',
    difficulty: 'advanced',
    order: 23,
    estimatedMinutes: 25,
    content: `## Testing

Two dominant test runners: **Vitest** (Vite-native) and **Jest** (older, very common). APIs are nearly identical.

### Basic structure

\`\`\`javascript
import { describe, it, expect } from "vitest";

describe("add", () => {
  it("adds positive numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
\`\`\`

### Matchers

\`.toBe\` (strict equal), \`.toEqual\` (deep equal), \`.toContain\`, \`.toThrow\`, \`.toBeCloseTo\`, \`.toMatchObject\`.

### Mocking

\`vi.fn()\` (Vitest) or \`jest.fn()\` (Jest) creates a mock function. \`vi.mock("./module")\` mocks a whole module.

### Async tests

Return the promise or use \`async/await\`. \`expect(...).resolves.toBe(...)\` or \`.rejects.toThrow(...)\`.

### Running

\`npx vitest\` — watch mode. \`npx vitest run\` — single run. \`--coverage\` for reports.`,
    codeExamples: [
      {
        title: 'Basic test',
        description: 'Test pure functions first.',
        code: `import { describe, it, expect } from "vitest";

function add(a, b) { return a + b; }

describe("add", () => {
  it("adds positives", () => expect(add(2, 3)).toBe(5));
  it("adds negatives", () => expect(add(-1, -2)).toBe(-3));
});`,
        input: '',
        expectedOutput: '(tests pass)',
        order: 1,
      },
      {
        title: 'Mock a function',
        description: 'Assert how a callback was called.',
        code: `import { describe, it, expect, vi } from "vitest";

function process(items, callback) {
  items.forEach(callback);
}

describe("process", () => {
  it("calls callback for each item", () => {
    const cb = vi.fn();
    process([1, 2, 3], cb);
    expect(cb).toHaveBeenCalledTimes(3);
    expect(cb).toHaveBeenCalledWith(2);
  });
});`,
        input: '',
        expectedOutput: '(tests pass)',
        order: 2,
      },
      {
        title: 'Async test',
        description: 'Use async/await directly.',
        code: `import { describe, it, expect } from "vitest";

async function fetchValue() {
  return 42;
}

describe("fetchValue", () => {
  it("resolves to 42", async () => {
    await expect(fetchValue()).resolves.toBe(42);
  });
});`,
        input: '',
        expectedOutput: '(test passes)',
        order: 3,
      },
    ],
    notes: [
      'Vitest auto-discovers `*.test.js`, `*.spec.js`, and the equivalents in TS.',
      'Mocks reset between tests by default with `vi.restoreAllMocks()` in `afterEach`.',
      'Snapshot testing is great for UI components — but watch out for "snapshot churn".',
    ],
    tips: [
      'Test pure logic first (no DOM, no network). Those tests are fast and reliable.',
      'For network-dependent code, use MSW (Mock Service Worker) to intercept requests.',
      'Aim for 70%+ coverage on critical code paths — chasing 100% rarely pays off.',
    ],
    tags: ['testing', 'vitest', 'jest', 'advanced'],
  }),

  t({
    title: 'Memory Management and Performance',
    description: 'Understand garbage collection, common leaks, and how to profile JS performance.',
    module: 'Advanced JavaScript',
    concept: 'Performance',
    difficulty: 'advanced',
    order: 24,
    estimatedMinutes: 25,
    content: `## Memory and Performance

### Garbage collection

JS engines use **mark-and-sweep** garbage collection. Anything reachable from roots (globals, current stack) is kept; everything else is freed.

### Common leaks

- Forgotten timers / intervals
- Forgotten event listeners on persistent objects
- Caches that grow forever — use \`WeakMap\` / \`WeakRef\`
- Closures capturing huge objects you no longer need

### Measuring performance

- \`performance.now()\` — high-resolution timer
- \`console.time("label")\` / \`console.timeEnd("label")\`
- Browser DevTools → Performance tab → record a flame chart
- \`PerformanceObserver\` API for production monitoring

### Common wins

- **Debounce** expensive handlers (search, resize)
- **Throttle** high-frequency events (scroll, mousemove)
- **Memoize** pure expensive functions (manual or via \`memoize-one\`)
- **Web Workers** for CPU-heavy work off the main thread`,
    codeExamples: [
      {
        title: 'Debounce',
        description: 'Only run after pause in activity.',
        code: `function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
const onSearch = debounce(q => console.log("search:", q), 200);
onSearch("a"); onSearch("ab"); onSearch("abc");`,
        input: '',
        expectedOutput: 'search: abc',
        order: 1,
      },
      {
        title: 'WeakMap for caching without leaks',
        description: 'GC can still collect keys.',
        code: `const cache = new WeakMap();
function compute(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = JSON.stringify(obj);
  cache.set(obj, result);
  return result;
}
console.log(compute({ a: 1 }));`,
        input: '',
        expectedOutput: '{"a":1}',
        order: 2,
      },
      {
        title: 'Measure with performance.now',
        description: 'Sub-millisecond timing.',
        code: `const start = performance.now();
for (let i = 0; i < 1_000_000; i++) { /* work */ }
console.log(\`took \${(performance.now() - start).toFixed(2)} ms\`);`,
        input: '',
        expectedOutput: 'took X ms',
        order: 3,
      },
    ],
    notes: [
      'V8 (Chrome/Node) optimizes hot code paths via JIT — micro-benchmarks can be misleading.',
      '`WeakMap`/`WeakSet` keys are not enumerable and don\'t prevent GC.',
      'Large object literals at module top-level live forever — be intentional about globals.',
    ],
    tips: [
      'Profile first, optimize second. Most code is fast enough.',
      'For lists with thousands of items in React, use virtualization (react-window).',
      'Move CPU-heavy work to a Web Worker so the UI stays responsive.',
    ],
    tags: ['performance', 'memory', 'gc', 'advanced'],
  }),
];

export default javascriptTutorials;
