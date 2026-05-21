// Comprehensive JavaScript course: beginner → expert.

const javascriptCourse = {
  language: 'javascript',
  category: 'programming-language',
  difficulty: 'beginner',
  title: 'JavaScript Programming: Beginner to Expert',
  shortDescription:
    'From let/const and arrays to closures, async/await, modules, and the event loop — with section quizzes and a final certificate.',
  description:
    'Master modern JavaScript from the ground up. Four sections walk you through fundamentals, arrays/objects/functions, intermediate features (Promises, modules, classes), and advanced topics (event loop, fetch, generators, testing). Section quizzes + final assessment + completion certificate.',
  thumbnail:
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
  tags: ['javascript', 'web', 'async', 'modern-js', 'es6'],
  estimatedHours: 40,
  certificateTemplate: 'excellence',
  sections: [
    {
      title: 'Section 1 — JavaScript Foundations',
      description: 'Variables, types, operators, control flow, and loops.',
      order: 1,
      estimatedHours: 8,
      lessons: [
        {
          title: 'Variables, Types, and Operators',
          description: 'let / const / var, primitive types, equality, and logical operators.',
          order: 1,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Declaration keywords</h2>
<ul>
  <li><code>let</code> — block-scoped, reassignable</li>
  <li><code>const</code> — block-scoped, no reassignment</li>
  <li><code>var</code> — function-scoped, hoisted (legacy, avoid)</li>
</ul>
<h2>Primitive types</h2>
<p><code>string</code>, <code>number</code>, <code>boolean</code>, <code>null</code>, <code>undefined</code>, <code>bigint</code>, <code>symbol</code>. Use <code>typeof</code> to inspect.</p>
<h2>Comparison and logical</h2>
<p>Always use <code>===</code> and <code>!==</code> (strict — no coercion). Logical <code>&amp;&amp;</code>, <code>||</code> short-circuit. <code>??</code> is nullish coalescing (only falls back on <code>null</code>/<code>undefined</code>).</p>
          `,
          codeExamples: [
            {
              title: 'let vs const',
              description: 'const can\'t be reassigned.',
              code: `let count = 0;
count = 5;
const PI = 3.14;
console.log(count, PI);`,
              language: 'javascript',
              expectedOutput: '5 3.14',
              order: 1,
            },
            {
              title: '?? vs ||',
              description: '?? only catches null/undefined.',
              code: `const n = 0;
console.log(n || 10);
console.log(n ?? 10);`,
              language: 'javascript',
              expectedOutput: '10\n0',
              order: 2,
            },
          ],
          notes: [
            '`typeof null` returns `"object"` — historical quirk.',
            '`==` does coercion; `===` does not.',
            '`var` is hoisted and function-scoped — almost always wrong today.',
          ],
          tips: [
            'Default to `const`; use `let` only when you need to reassign.',
            'Use `===` and `!==` always.',
            'Reach for `??` when `0`, `""`, or `false` are valid values.',
          ],
        },
        {
          title: 'Strings, Template Literals, and console I/O',
          description: 'Interpolate strings with backticks; use console methods for output.',
          order: 2,
          duration: 25,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Template literals (backticks)</h2>
<pre><code>const name = "Alex";
console.log(\`Hello, \${name}!\`);</code></pre>
<p>Multi-line and expressive — always prefer over <code>"a" + "b"</code> concatenation.</p>
<h2>String methods</h2>
<p><code>.length</code>, <code>.toUpperCase()</code>, <code>.toLowerCase()</code>, <code>.trim()</code>, <code>.includes()</code>, <code>.startsWith()</code>, <code>.slice()</code>, <code>.split()</code>, <code>.replace()</code>.</p>
<h2>Console output</h2>
<p><code>console.log</code>, <code>console.warn</code>, <code>console.error</code>, <code>console.table(arr)</code>. Debug shortcut: <code>console.log({ someVar })</code> shows name + value.</p>
          `,
          codeExamples: [
            {
              title: 'Template literal with expression',
              description: 'Interpolation handles full expressions.',
              code: `const name = "Alex";
console.log(\`\${name} has \${2 + 3} messages\`);`,
              language: 'javascript',
              expectedOutput: 'Alex has 5 messages',
              order: 1,
            },
            {
              title: 'Slice and split',
              description: 'Common transformations.',
              code: `const s = "  Hello, World!  ";
console.log(s.trim().toLowerCase());
console.log("a,b,c".split(","));`,
              language: 'javascript',
              expectedOutput: "hello, world!\n[ 'a', 'b', 'c' ]",
              order: 2,
            },
          ],
          notes: [
            'Strings are immutable — methods return new strings.',
            '`s[0]` indexes; negative indices don\'t work (use `.slice(-1)`).',
            '`replace()` only replaces the first match unless you pass a `/g` regex.',
          ],
          tips: [
            'Use template literals always — strictly better than `+`.',
            'For debug logs, `console.log({ x })` is your best friend.',
            'For huge outputs, `console.table` makes arrays/objects readable.',
          ],
        },
        {
          title: 'Conditionals and Loops',
          description: 'if/else, switch, ternary, and the modern for...of.',
          order: 3,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Conditionals</h2>
<pre><code>if (cond) { ... }
else if (other) { ... }
else { ... }</code></pre>
<p>For one-value-against-many cases, use <code>switch</code>. Don\'t forget <code>break</code>.</p>
<h3>Truthy / falsy</h3>
<p>Falsy: <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>. <strong>Empty arrays and objects are truthy</strong> — JS gotcha.</p>
<h2>Loops</h2>
<ul>
  <li>Classic: <code>for (let i = 0; i &lt; n; i++)</code></li>
  <li>Values: <code>for (const x of items)</code></li>
  <li>Keys: <code>for (const key in obj)</code> — never for arrays</li>
  <li><code>arr.forEach(callback)</code> — no break/continue</li>
</ul>
          `,
          codeExamples: [
            {
              title: 'for...of an array',
              description: 'Walk values directly.',
              code: `const colors = ["red", "green", "blue"];
for (const c of colors) console.log(c);`,
              language: 'javascript',
              expectedOutput: 'red\ngreen\nblue',
              order: 1,
            },
            {
              title: 'switch with break',
              description: 'Many cases on one value.',
              code: `const day = 3;
let name;
switch (day) {
  case 1: name = "Mon"; break;
  case 2: name = "Tue"; break;
  case 3: name = "Wed"; break;
  default: name = "?";
}
console.log(name);`,
              language: 'javascript',
              expectedOutput: 'Wed',
              order: 2,
            },
          ],
          notes: [
            'Empty `[]` and `{}` are truthy — check `.length` or `Object.keys(o).length`.',
            'Forgetting `break` in `switch` causes silent fall-through bugs.',
            '`for...in` walks keys — wrong for arrays, can hit inherited props.',
          ],
          tips: [
            'Use `for...of` over classic `for` when you don\'t need the index.',
            'Use `arr.entries()` if you need index + value.',
            'A `switch` with many cases can often be replaced by an object lookup.',
          ],
        },
      ],
      quiz: {
        title: 'Section 1 Quiz — JavaScript Foundations',
        description: 'Variables, operators, conditionals, and loops.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'Which is the recommended default for variable declaration?',
            options: [
              { text: 'var', isCorrect: false },
              { text: 'let', isCorrect: false },
              { text: 'const', isCorrect: true },
              { text: 'It doesn\'t matter', isCorrect: false },
            ],
            points: 2,
            explanation: 'Default to `const`; switch to `let` only when you need to reassign.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `0 || 10` return?',
            options: [
              { text: '0', isCorrect: false },
              { text: '10', isCorrect: true },
              { text: 'true', isCorrect: false },
              { text: 'NaN', isCorrect: false },
            ],
            points: 2,
            explanation: '`0` is falsy, so `||` returns the right operand. Use `??` if you want `0` to count as a valid value.',
          },
          {
            type: 'true-false',
            question: '`[] == false` is `true` in JavaScript.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: 'Loose `==` coerces — that\'s why we use `===`.',
          },
          {
            type: 'multiple-choice',
            question: 'Which loop is best for walking values of an array?',
            options: [
              { text: 'for...in', isCorrect: false },
              { text: 'for...of', isCorrect: true },
              { text: 'while', isCorrect: false },
              { text: 'do-while', isCorrect: false },
            ],
            points: 2,
            explanation: '`for...of` iterates values directly; `for...in` walks keys (avoid for arrays).',
          },
          {
            type: 'multiple-choice',
            question: 'What\'s the right way to interpolate a variable into a string?',
            options: [
              { text: '"Hello, " + name', isCorrect: false },
              { text: '"Hello, $name"', isCorrect: false },
              { text: '`Hello, ${name}`', isCorrect: true },
              { text: '"Hello, " . name', isCorrect: false },
            ],
            points: 1,
            explanation: 'Template literals (backticks) with `${...}` are the modern, readable way.',
          },
        ],
      },
    },

    {
      title: 'Section 2 — Arrays, Objects, and Functions',
      description: 'Master arrays, objects, destructuring, spread/rest, and the function styles.',
      order: 2,
      estimatedHours: 10,
      lessons: [
        {
          title: 'Arrays and Array Methods',
          description: 'push/pop, map/filter/reduce, spread, destructuring.',
          order: 1,
          duration: 35,
          difficulty: 'beginner',
          estimatedHours: 1.5,
          content: `
<h2>Mutating vs non-mutating methods</h2>
<ul>
  <li>Mutating: <code>push</code>, <code>pop</code>, <code>shift</code>, <code>unshift</code>, <code>splice</code>, <code>sort</code></li>
  <li>Non-mutating: <code>slice</code>, <code>map</code>, <code>filter</code>, <code>reduce</code>, <code>concat</code>, <code>flat</code></li>
</ul>
<p>Prefer non-mutating in modern code — easier to reason about, especially with React state.</p>
<h2>Destructuring and spread</h2>
<pre><code>const [first, ...rest] = [1, 2, 3, 4];
const merged = [...arr1, ...arr2];
const copy = [...original];</code></pre>
<h2>Higher-order methods</h2>
<p><code>arr.map(fn)</code>, <code>arr.filter(fn)</code>, <code>arr.reduce((acc, item) => ..., init)</code>. Chain them as a pipeline.</p>
          `,
          codeExamples: [
            {
              title: 'map + filter chained',
              description: 'Square only the even numbers.',
              code: `const nums = [1, 2, 3, 4, 5, 6];
const evenSquares = nums
  .filter(n => n % 2 === 0)
  .map(n => n * n);
console.log(evenSquares);`,
              language: 'javascript',
              expectedOutput: '[ 4, 16, 36 ]',
              order: 1,
            },
            {
              title: 'reduce to a single value',
              description: 'Build a count map.',
              code: `const items = ["a", "b", "a", "c", "a", "b"];
const counts = items.reduce((acc, item) => {
  acc[item] = (acc[item] || 0) + 1;
  return acc;
}, {});
console.log(counts);`,
              language: 'javascript',
              expectedOutput: '{ a: 3, b: 2, c: 1 }',
              order: 2,
            },
          ],
          notes: [
            '`sort()` mutates AND sorts as strings by default. Use `[...arr].sort((a,b) => a-b)`.',
            'Spread `[...arr]` is a SHALLOW copy.',
            'Always pass an initial value to `reduce`.',
          ],
          tips: [
            'Prefer non-mutating methods — they fit React/Redux state patterns.',
            'Use `Array.isArray(x)` instead of `typeof x === "array"` (which doesn\'t exist).',
            'For deep clones, use `structuredClone(obj)`.',
          ],
        },
        {
          title: 'Objects, Destructuring, and Shorthand',
          description: 'Modern object syntax: spread, destructuring, computed keys.',
          order: 2,
          duration: 30,
          difficulty: 'beginner',
          estimatedHours: 1,
          content: `
<h2>Creating and accessing</h2>
<pre><code>const user = { name: "Alex", age: 25 };
user.name;
user["name"];</code></pre>
<h2>Destructuring</h2>
<pre><code>const { name, age = 0 } = user;
const { name: userName } = user;        // rename
const { password, ...safe } = secret;   // pluck + rest</code></pre>
<h2>Spread for updates</h2>
<pre><code>const updated = { ...user, age: 26 };</code></pre>
<h2>Iteration</h2>
<p><code>Object.keys(o)</code>, <code>Object.values(o)</code>, <code>Object.entries(o)</code>. Combine with destructuring.</p>
          `,
          codeExamples: [
            {
              title: 'Property shorthand',
              description: 'Build object from variables.',
              code: `const name = "Alex";
const age = 25;
const user = { name, age };
console.log(user);`,
              language: 'javascript',
              expectedOutput: "{ name: 'Alex', age: 25 }",
              order: 1,
            },
            {
              title: 'Iterating entries',
              description: 'Destructure inside the loop.',
              code: `const scores = { alex: 90, beth: 82 };
for (const [name, score] of Object.entries(scores)) {
  console.log(\`\${name}: \${score}\`);
}`,
              language: 'javascript',
              expectedOutput: 'alex: 90\nbeth: 82',
              order: 2,
            },
          ],
          notes: [
            'Object spread is shallow — nested objects still share references.',
            'Optional chaining `user?.profile?.name` safely handles missing nested props.',
            'Keys are strings or Symbols; numbers get coerced to strings.',
          ],
          tips: [
            'Destructure function args for cleaner signatures.',
            'Use spread for "update this field, keep the rest" patterns (great for React state).',
            'Use `structuredClone(obj)` for deep cloning, not JSON tricks.',
          ],
        },
        {
          title: 'Functions and Closures',
          description: 'Declarations, expressions, arrow functions, and how closures capture scope.',
          order: 3,
          duration: 35,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Function styles</h2>
<pre><code>function decl(n) { return n*2; }
const expr = function(n) { return n*2; };
const arrow = n => n*2;</code></pre>
<p>Arrows don\'t have their own <code>this</code> — they inherit from the enclosing scope. Great for callbacks; wrong for object methods that need their own <code>this</code>.</p>
<h2>Default and rest parameters</h2>
<pre><code>function pad(s, n = 4, ch = "0") { ... }
function sum(...nums) { return nums.reduce((a,b) => a+b, 0); }</code></pre>
<h2>Closures</h2>
<p>A function that "remembers" the scope where it was defined — even after the outer function returns. Foundation of callbacks, currying, private state.</p>
          `,
          codeExamples: [
            {
              title: 'Closure for private state',
              description: 'Counter without a class.',
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
              language: 'javascript',
              expectedOutput: '3',
              order: 1,
            },
            {
              title: 'Factory function',
              description: 'Closure captures the factor parameter.',
              code: `function multiplyBy(factor) {
  return n => n * factor;
}
const double = multiplyBy(2);
const triple = multiplyBy(3);
console.log(double(10), triple(10));`,
              language: 'javascript',
              expectedOutput: '20 30',
              order: 2,
            },
          ],
          notes: [
            'Arrow functions can\'t be used as constructors (no `new`).',
            'Closures capture by reference, not by value.',
            'Function declarations are hoisted; arrow and function expressions are not.',
          ],
          tips: [
            'Default to arrow functions for callbacks.',
            'For object methods that need `this`, use the method shorthand syntax.',
            'Avoid capturing huge data in long-lived closures.',
          ],
        },
      ],
      quiz: {
        title: 'Section 2 Quiz — Arrays, Objects, and Functions',
        description: 'Test your grasp of modern array/object/function syntax.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What does `[1, 2, 3].map(n => n * 2)` return?',
            options: [
              { text: '[2, 4, 6]', isCorrect: true },
              { text: '6', isCorrect: false },
              { text: '[1, 2, 3, 2, 4, 6]', isCorrect: false },
              { text: 'undefined', isCorrect: false },
            ],
            points: 2,
            explanation: '`map` returns a new array with the callback applied to each element.',
          },
          {
            type: 'multiple-choice',
            question: 'Which best describes a closure?',
            options: [
              { text: 'A class with private fields', isCorrect: false },
              { text: 'A function that retains access to its outer scope', isCorrect: true },
              { text: 'An IIFE', isCorrect: false },
              { text: 'A try/catch block', isCorrect: false },
            ],
            points: 2,
            explanation: 'Closures "close over" the variables of the enclosing scope.',
          },
          {
            type: 'true-false',
            question: 'Arrow functions have their own `this` binding.',
            options: [
              { text: 'true', isCorrect: false },
              { text: 'false', isCorrect: true },
            ],
            points: 1,
            explanation: 'Arrow functions inherit `this` from the enclosing scope — that\'s why they shine for callbacks.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `const { name, age = 0 } = user` do if `age` is missing in `user`?',
            options: [
              { text: 'Throws an error', isCorrect: false },
              { text: 'Sets `age` to `undefined`', isCorrect: false },
              { text: 'Sets `age` to `0`', isCorrect: true },
              { text: 'Sets `age` to `null`', isCorrect: false },
            ],
            points: 2,
            explanation: 'Destructuring defaults apply when the value is `undefined`.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is the cleanest way to merge two objects?',
            options: [
              { text: 'Object.combine(a, b)', isCorrect: false },
              { text: '{ ...a, ...b }', isCorrect: true },
              { text: 'a.merge(b)', isCorrect: false },
              { text: 'a + b', isCorrect: false },
            ],
            points: 1,
            explanation: 'Object spread `{ ...a, ...b }` merges, with `b`\'s keys overriding `a`\'s on conflicts.',
          },
        ],
      },
    },

    {
      title: 'Section 3 — Intermediate JavaScript',
      description: 'Promises, async/await, modules, classes, and prototypes.',
      order: 3,
      estimatedHours: 12,
      lessons: [
        {
          title: 'Promises and async / await',
          description: 'Handle asynchronous work cleanly with modern syntax.',
          order: 1,
          duration: 45,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Promises</h2>
<p>A Promise represents a future value. Three states: pending, fulfilled, rejected.</p>
<pre><code>const p = fetch("/users");
p.then(r => r.json()).then(data => ...).catch(err => ...);</code></pre>
<h2>async / await (preferred)</h2>
<pre><code>async function getUser(id) {
  const res = await fetch(\`/users/\${id}\`);
  if (!res.ok) throw new Error(res.status);
  return res.json();
}</code></pre>
<h2>Concurrency primitives</h2>
<ul>
  <li><code>Promise.all([...])</code> — wait for all, fail-fast</li>
  <li><code>Promise.allSettled([...])</code> — all results, including failures</li>
  <li><code>Promise.race([...])</code> — first to settle wins</li>
</ul>
<p>Always <code>try/catch</code> around <code>await</code> or you\'ll get unhandled rejections.</p>
          `,
          codeExamples: [
            {
              title: 'Sequential vs parallel',
              description: 'Promise.all unblocks waits.',
              code: `const sleep = ms => new Promise(r => setTimeout(r, ms));

async function parallel() {
  const t0 = Date.now();
  await Promise.all([sleep(100), sleep(100)]);
  console.log("took", Date.now() - t0, "ms");
}
parallel();`,
              language: 'javascript',
              expectedOutput: 'took 100 ms',
              order: 1,
            },
            {
              title: 'async with try/catch',
              description: 'Standard error handling.',
              code: `async function fetchUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error(err.message);
    return null;
  }
}`,
              language: 'javascript',
              expectedOutput: '(no output)',
              order: 2,
            },
          ],
          notes: [
            'An `async` function ALWAYS returns a Promise.',
            'A 404/500 from `fetch` still resolves — always check `res.ok`.',
            'Unhandled rejections crash modern Node — always catch.',
          ],
          tips: [
            'Default to `async/await` over `.then()` chains.',
            'Use `Promise.all` for independent requests; serial `await` for dependent ones.',
            'For "take whichever finishes first" patterns, use `Promise.race`.',
          ],
        },
        {
          title: 'Modules and Error Handling',
          description: 'ES modules (import/export) and robust try/catch patterns.',
          order: 2,
          duration: 30,
          difficulty: 'intermediate',
          estimatedHours: 1,
          content: `
<h2>ES Modules</h2>
<pre><code>// math.js
export const PI = 3.14;
export function area(r) { return PI*r*r; }
export default class Calculator { ... }

// app.js
import Calculator, { PI, area } from "./math.js";
import * as math from "./math.js";   // namespace
const m = await import("./math.js"); // dynamic</code></pre>
<h2>Error handling</h2>
<pre><code>try {
  risky();
} catch (err) {
  if (err instanceof TypeError) ...
} finally {
  cleanup();
}</code></pre>
<h3>Custom errors</h3>
<pre><code>class ValidationError extends Error {
  constructor(field, reason) {
    super(\`\${field}: \${reason}\`);
    this.name = "ValidationError";
    this.field = field;
  }
}</code></pre>
          `,
          codeExamples: [
            {
              title: 'Named + default export',
              description: 'One file, multiple exports.',
              code: `// math.js
export const PI = 3.14;
export default function area(r) { return PI*r*r; }

// app.js
import area, { PI } from "./math.js";
console.log(area(2));`,
              language: 'javascript',
              expectedOutput: '12.56',
              order: 1,
            },
            {
              title: 'Custom error class',
              description: 'instanceof checks the type.',
              code: `class NotFound extends Error {
  constructor(id) {
    super(\`Item \${id} missing\`);
    this.name = "NotFound";
    this.id = id;
  }
}

try {
  throw new NotFound(42);
} catch (e) {
  if (e instanceof NotFound) console.log("missing id", e.id);
}`,
              language: 'javascript',
              expectedOutput: 'missing id 42',
              order: 2,
            },
          ],
          notes: [
            'ESM is read-only and statically analyzable — bundlers can tree-shake.',
            'CommonJS (`require`) and ESM can coexist but mixing causes pain.',
            'Catch by `instanceof` for type-specific handling.',
          ],
          tips: [
            'Prefer named exports — easier to refactor and document.',
            'For optional dependencies, use dynamic `await import("...")`.',
            'Always set `this.name` on custom errors — log messages stay clear.',
          ],
        },
        {
          title: 'Classes and Prototypes',
          description: 'ES6 class syntax + the prototype chain that powers it.',
          order: 3,
          duration: 40,
          difficulty: 'intermediate',
          estimatedHours: 1.5,
          content: `
<h2>Classes</h2>
<pre><code>class User {
  #password;   // private field
  constructor(name, password) {
    this.name = name;
    this.#password = password;
  }
  greet() { return \`Hi, \${this.name}\`; }
  static fromString(s) { return new User(...s.split(":")); }
}</code></pre>
<h2>Inheritance</h2>
<pre><code>class Animal {
  constructor(name) { this.name = name; }
  speak() { return "..."; }
}
class Dog extends Animal {
  speak() { return "woof"; }
}</code></pre>
<p><code>super()</code> calls the parent constructor; <code>super.method()</code> calls the parent method.</p>
<h2>Prototype chain</h2>
<p>Every object has a prototype link. Property lookup walks the chain. <code>extends</code> sets that link; everything else is sugar.</p>
          `,
          codeExamples: [
            {
              title: 'Chainable methods',
              description: 'Return this for fluent style.',
              code: `class Counter {
  #n = 0;
  inc() { this.#n++; return this; }
  value() { return this.#n; }
}
console.log(new Counter().inc().inc().inc().value());`,
              language: 'javascript',
              expectedOutput: '3',
              order: 1,
            },
            {
              title: 'Polymorphism',
              description: 'Same call, different implementations.',
              code: `class Cat { speak() { return "meow"; } }
class Dog { speak() { return "woof"; } }
const animals = [new Cat(), new Dog(), new Cat()];
console.log(animals.map(a => a.speak()));`,
              language: 'javascript',
              expectedOutput: "[ 'meow', 'woof', 'meow' ]",
              order: 2,
            },
          ],
          notes: [
            '`#field` (private) is enforced at runtime — true privacy.',
            'Classes are NOT hoisted — declare before use.',
            'Limit inheritance depth — usually 1-2 levels.',
          ],
          tips: [
            'Return `this` from setter-like methods for chaining.',
            'Prefer factory functions or composition over deep class hierarchies.',
            'For pure data, plain objects are simpler than classes.',
          ],
        },
      ],
      quiz: {
        title: 'Section 3 Quiz — Intermediate JavaScript',
        description: 'Promises, modules, classes.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What does `async function f() { return 1; }` return when called?',
            options: [
              { text: '1', isCorrect: false },
              { text: 'A Promise that resolves to 1', isCorrect: true },
              { text: 'undefined', isCorrect: false },
              { text: 'NaN', isCorrect: false },
            ],
            points: 2,
            explanation: 'An `async` function always returns a Promise wrapping the return value.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is true about `fetch`?',
            options: [
              { text: 'It rejects on 404/500', isCorrect: false },
              { text: 'It resolves on 404/500 — you must check `res.ok`', isCorrect: true },
              { text: 'It throws TypeError on network errors only', isCorrect: false },
              { text: 'It only works in browsers', isCorrect: false },
            ],
            points: 2,
            explanation: '`fetch` only rejects on NETWORK errors. HTTP error statuses still resolve.',
          },
          {
            type: 'true-false',
            question: 'Use `Promise.all([p1, p2])` to run independent async operations concurrently.',
            options: [
              { text: 'true', isCorrect: true },
              { text: 'false', isCorrect: false },
            ],
            points: 1,
            explanation: '`Promise.all` waits for all in parallel, returning their results in order.',
          },
          {
            type: 'multiple-choice',
            question: 'What is `#name` inside a class?',
            options: [
              { text: 'A static field', isCorrect: false },
              { text: 'A private field, only accessible inside the class', isCorrect: true },
              { text: 'A getter shortcut', isCorrect: false },
              { text: 'A jQuery selector', isCorrect: false },
            ],
            points: 2,
            explanation: 'The `#` prefix declares a private field — true privacy in modern JS.',
          },
          {
            type: 'multiple-choice',
            question: 'Which exports a function as the default export?',
            options: [
              { text: 'export function foo() {}', isCorrect: false },
              { text: 'export default function foo() {}', isCorrect: true },
              { text: 'module.exports = foo', isCorrect: false },
              { text: 'export * foo', isCorrect: false },
            ],
            points: 1,
            explanation: '`export default` makes a single primary export — imported without braces.',
          },
        ],
      },
    },

    {
      title: 'Section 4 — Advanced JavaScript',
      description: 'Event loop, fetch, generators, modules system, testing, and performance.',
      order: 4,
      estimatedHours: 10,
      lessons: [
        {
          title: 'The Event Loop and Fetch API',
          description: 'Understand JS\'s execution model; make HTTP requests safely.',
          order: 1,
          duration: 40,
          difficulty: 'advanced',
          estimatedHours: 1.5,
          content: `
<h2>Event loop in one paragraph</h2>
<p>Single thread. Two queues: <strong>microtasks</strong> (Promises, queueMicrotask) and <strong>macrotasks</strong> (setTimeout, I/O, UI events). After each task, ALL microtasks drain before the next task. That\'s why <code>Promise.resolve().then(f)</code> always beats <code>setTimeout(f, 0)</code>.</p>
<h2>fetch</h2>
<pre><code>const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(5000),
});
if (!res.ok) throw new Error(res.status);
const data = await res.json();</code></pre>
<h3>Cancellation</h3>
<p><code>AbortController</code> and <code>AbortSignal.timeout(ms)</code> cancel slow requests.</p>
          `,
          codeExamples: [
            {
              title: 'Microtask beats setTimeout(0)',
              description: 'Order is non-obvious.',
              code: `console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");`,
              language: 'javascript',
              expectedOutput: '1\n4\n3\n2',
              order: 1,
            },
            {
              title: 'Fetch with timeout',
              description: 'Auto-cancel slow requests.',
              code: `async function getWithTimeout(url, ms = 5000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}`,
              language: 'javascript',
              expectedOutput: '(no output)',
              order: 2,
            },
          ],
          notes: [
            'Microtasks always run before macrotasks in the same tick.',
            '`await` is a microtask yield point.',
            'CORS errors come from the browser — server has to send the headers.',
          ],
          tips: [
            'Break long sync work with `setTimeout(work, 0)` to keep the UI responsive.',
            'Always pass `signal` to fetch in React components that might unmount.',
            'Wrap fetch in a helper that throws on non-2xx — saves repeating `res.ok` checks.',
          ],
        },
        {
          title: 'Generators, Iterators, and Testing',
          description: 'Build lazy sequences with function*; write reliable tests with Vitest/Jest.',
          order: 2,
          duration: 40,
          difficulty: 'advanced',
          estimatedHours: 1.5,
          content: `
<h2>Generators</h2>
<pre><code>function* fibs() {
  let [a, b] = [0, 1];
  while (true) { yield a; [a, b] = [b, a + b]; }
}
const g = fibs();
g.next().value; // 0</code></pre>
<p>Memory-efficient infinite sequences. <code>for...of</code> works on any iterable.</p>
<h2>Custom iterable</h2>
<pre><code>class Range {
  constructor(s, e) { this.s = s; this.e = e; }
  *[Symbol.iterator]() {
    for (let i = this.s; i &lt; this.e; i++) yield i;
  }
}
[...new Range(0, 5)]; // [0,1,2,3,4]</code></pre>
<h2>Testing</h2>
<pre><code>import { describe, it, expect } from "vitest";

describe("add", () => {
  it("adds positives", () => expect(add(2, 3)).toBe(5));
});</code></pre>
<p>Mocks: <code>vi.fn()</code>. Async tests: just use <code>async/await</code>.</p>
          `,
          codeExamples: [
            {
              title: 'Custom iterable',
              description: 'Range class via Symbol.iterator.',
              code: `class Range {
  constructor(s, e) { this.s = s; this.e = e; }
  *[Symbol.iterator]() {
    for (let i = this.s; i < this.e; i++) yield i;
  }
}
console.log([...new Range(1, 5)]);`,
              language: 'javascript',
              expectedOutput: '[ 1, 2, 3, 4 ]',
              order: 1,
            },
            {
              title: 'Vitest assertion',
              description: 'Plain assertions, helpful diffs.',
              code: `// test.js
import { describe, it, expect } from "vitest";

function add(a, b) { return a + b; }
describe("add", () => {
  it("works", () => expect(add(2, 3)).toBe(5));
});`,
              language: 'javascript',
              expectedOutput: '(test passes)',
              order: 2,
            },
          ],
          notes: [
            'Generator functions return a generator object — they don\'t run until iterated.',
            '`for await...of` consumes async generators.',
            'Vitest and Jest share APIs — pick Vitest for new Vite projects.',
          ],
          tips: [
            'Use generators for huge or infinite sequences — saves memory.',
            'Test pure logic first; mock dependencies via `vi.fn()`.',
            'Aim for 70%+ coverage on critical paths — 100% is rarely worth chasing.',
          ],
        },
        {
          title: 'Performance, Debounce, and Memory',
          description: 'Profile JS, avoid leaks, and use debounce/throttle for high-frequency events.',
          order: 3,
          duration: 35,
          difficulty: 'advanced',
          estimatedHours: 1.5,
          content: `
<h2>Profiling</h2>
<ul>
  <li><code>performance.now()</code> — high-resolution timer</li>
  <li><code>console.time("label") / console.timeEnd("label")</code></li>
  <li>DevTools → Performance tab → record a flame chart</li>
</ul>
<h2>Common leaks</h2>
<ul>
  <li>Forgotten <code>setInterval</code> / <code>setTimeout</code></li>
  <li>Event listeners on persistent objects</li>
  <li>Caches that grow forever — use <code>WeakMap</code></li>
  <li>Closures capturing huge objects</li>
</ul>
<h2>Debounce and throttle</h2>
<pre><code>function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}</code></pre>
<p>Debounce: run after pause. Throttle: at most once per N ms.</p>
          `,
          codeExamples: [
            {
              title: 'Debounce',
              description: 'Only fire after the user pauses.',
              code: `function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
const onSearch = debounce(q => console.log("search:", q), 200);
onSearch("a"); onSearch("ab"); onSearch("abc");`,
              language: 'javascript',
              expectedOutput: 'search: abc',
              order: 1,
            },
            {
              title: 'WeakMap cache (GC-safe)',
              description: 'Keys can still be garbage-collected.',
              code: `const cache = new WeakMap();
function compute(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = JSON.stringify(obj);
  cache.set(obj, result);
  return result;
}
console.log(compute({ a: 1 }));`,
              language: 'javascript',
              expectedOutput: '{"a":1}',
              order: 2,
            },
          ],
          notes: [
            'V8 JIT-optimizes hot code paths — micro-benchmarks can mislead.',
            '`WeakMap`/`WeakSet` keys are not enumerable and don\'t prevent GC.',
            'Module-level objects live forever — be intentional with globals.',
          ],
          tips: [
            'Profile FIRST, optimize second. Most code is fast enough.',
            'For long lists, use virtualization (react-window, etc.).',
            'Move CPU-heavy work to Web Workers so the main thread stays responsive.',
          ],
        },
      ],
      quiz: {
        title: 'Section 4 Quiz — Advanced JavaScript',
        description: 'Event loop, generators, performance, testing.',
        passingScore: 70,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What\'s the difference between microtasks and macrotasks?',
            options: [
              { text: 'No difference — they share one queue', isCorrect: false },
              { text: 'Microtasks run before macrotasks within the same tick', isCorrect: true },
              { text: 'Macrotasks are deprecated', isCorrect: false },
              { text: 'Microtasks are slower', isCorrect: false },
            ],
            points: 2,
            explanation: 'After each task, all microtasks (Promise callbacks) drain before the next macrotask (setTimeout, etc.).',
          },
          {
            type: 'multiple-choice',
            question: 'Why use a WeakMap over a Map for caching?',
            options: [
              { text: 'WeakMap is faster', isCorrect: false },
              { text: 'WeakMap keys can be garbage-collected, avoiding leaks', isCorrect: true },
              { text: 'WeakMap stores more values', isCorrect: false },
              { text: 'WeakMap is sorted', isCorrect: false },
            ],
            points: 2,
            explanation: 'WeakMap doesn\'t prevent its key objects from being GC\'d — great for caches keyed by objects.',
          },
          {
            type: 'true-false',
            question: 'fetch rejects when the server returns 404.',
            options: [
              { text: 'true', isCorrect: false },
              { text: 'false', isCorrect: true },
            ],
            points: 1,
            explanation: 'fetch only rejects on network errors. Check `res.ok` for HTTP status.',
          },
          {
            type: 'multiple-choice',
            question: 'What does `function* fibs()` denote?',
            options: [
              { text: 'A function returning a Promise', isCorrect: false },
              { text: 'A generator function', isCorrect: true },
              { text: 'An async iterator', isCorrect: false },
              { text: 'A typo', isCorrect: false },
            ],
            points: 2,
            explanation: 'The `*` after `function` declares a generator function. Use `yield` inside.',
          },
          {
            type: 'multiple-choice',
            question: 'Which is best for "many concurrent network requests"?',
            options: [
              { text: 'For loop with await each time', isCorrect: false },
              { text: 'Promise.all on an array of fetch promises', isCorrect: true },
              { text: 'setTimeout for each', isCorrect: false },
              { text: 'Multiple Web Workers', isCorrect: false },
            ],
            points: 2,
            explanation: '`Promise.all` runs them concurrently and gives you results when all complete.',
          },
        ],
      },
    },
  ],

  finalQuiz: {
    title: 'Final Quiz — JavaScript Programming: Beginner to Expert',
    description: 'Comprehensive assessment covering all four sections.',
    passingScore: 75,
    timeLimit: 20,
    maxRetakes: 3,
    questions: [
      {
        type: 'multiple-choice',
        question: 'Which is true about `const`?',
        options: [
          { text: 'You can\'t modify a const-bound object', isCorrect: false },
          { text: 'You can\'t reassign the const-bound variable', isCorrect: true },
          { text: 'const is function-scoped', isCorrect: false },
          { text: 'const variables are global', isCorrect: false },
        ],
        points: 2,
        explanation: '`const` prevents reassignment of the variable; the object/array it points to can still be mutated.',
      },
      {
        type: 'multiple-choice',
        question: 'What does `[].forEach(callback)` do that `for...of` cannot?',
        options: [
          { text: 'Iterates an empty array', isCorrect: false },
          { text: 'Allows break/continue', isCorrect: false },
          { text: 'Provides the index as a second argument', isCorrect: true },
          { text: 'Runs in parallel', isCorrect: false },
        ],
        points: 2,
        explanation: '`forEach`\'s callback receives `(item, index, array)`. `for...of` needs `.entries()` for the index.',
      },
      {
        type: 'true-false',
        question: 'You should use `===` instead of `==` to avoid type coercion.',
        options: [
          { text: 'true', isCorrect: true },
          { text: 'false', isCorrect: false },
        ],
        points: 1,
        explanation: '`==` does coercion (e.g., `"5" == 5` is true). `===` doesn\'t — safer.',
      },
      {
        type: 'multiple-choice',
        question: 'Which best describes async functions?',
        options: [
          { text: 'They run on a separate thread', isCorrect: false },
          { text: 'They always return a Promise', isCorrect: true },
          { text: 'They block until complete', isCorrect: false },
          { text: 'They are deprecated', isCorrect: false },
        ],
        points: 2,
        explanation: '`async` functions wrap their return value (or thrown error) in a Promise.',
      },
      {
        type: 'multiple-choice',
        question: 'What does `const { a = 1, ...rest } = { b: 2 }` produce?',
        options: [
          { text: 'a = undefined, rest = { b: 2 }', isCorrect: false },
          { text: 'a = 1, rest = { b: 2 }', isCorrect: true },
          { text: 'a = 1, rest = {}', isCorrect: false },
          { text: 'Throws TypeError', isCorrect: false },
        ],
        points: 2,
        explanation: '`a` defaults to 1 (missing key); `rest` captures everything else.',
      },
      {
        type: 'multiple-choice',
        question: 'Which call style works with `super` correctly inside a derived constructor?',
        options: [
          { text: 'this.super(...)', isCorrect: false },
          { text: 'super(...)', isCorrect: true },
          { text: 'super.constructor(...)', isCorrect: false },
          { text: 'Base.call(this, ...)', isCorrect: false },
        ],
        points: 2,
        explanation: '`super(...)` calls the parent constructor. Must be called before using `this`.',
      },
      {
        type: 'multiple-choice',
        question: 'What does `Promise.allSettled([p1, p2])` return?',
        options: [
          { text: 'The first fulfilled promise', isCorrect: false },
          { text: 'An array of result objects with `status` for each input', isCorrect: true },
          { text: 'A single combined value', isCorrect: false },
          { text: 'The number of fulfilled promises', isCorrect: false },
        ],
        points: 2,
        explanation: '`allSettled` returns `{status, value}` or `{status, reason}` for each input — even failures.',
      },
      {
        type: 'multiple-choice',
        question: 'Which module syntax allows dynamic loading?',
        options: [
          { text: 'import { x } from "..."', isCorrect: false },
          { text: 'import * as m from "..."', isCorrect: false },
          { text: 'const m = await import("...")', isCorrect: true },
          { text: 'require("...")', isCorrect: false },
        ],
        points: 2,
        explanation: '`import()` is the dynamic, Promise-returning form — great for code splitting.',
      },
      {
        type: 'true-false',
        question: 'Arrow functions can be used as object methods that need their own `this`.',
        options: [
          { text: 'true', isCorrect: false },
          { text: 'false', isCorrect: true },
        ],
        points: 1,
        explanation: 'Arrows don\'t bind `this` — use method shorthand `foo() {}` instead.',
      },
      {
        type: 'multiple-choice',
        question: 'Which is the safest way to read JSON from a response?',
        options: [
          { text: 'res.json()', isCorrect: false },
          { text: 'JSON.parse(res.text())', isCorrect: false },
          { text: 'Check res.ok, then await res.json() inside try/catch', isCorrect: true },
          { text: 'res.body.json', isCorrect: false },
        ],
        points: 2,
        explanation: 'Always check `res.ok` (fetch doesn\'t reject on HTTP errors) and wrap parsing in try/catch.',
      },
    ],
  },
};

export default javascriptCourse;
