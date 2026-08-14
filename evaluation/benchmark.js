// Fixed benchmark set for the verified-generation evaluation.
//
// Held constant across runs so results are comparable over time. Topics are
// drawn from the platform's own curriculum spread (foundations -> advanced) and
// deliberately include cases where LLMs commonly emit non-running code:
// manual memory management, generator protocols, async ordering, and
// integer/floating-point edge cases.
//
// Changing this file invalidates comparison with previously recorded runs.
// Bump BENCHMARK_VERSION when you do.

export const BENCHMARK_VERSION = "1.0.0";

/** @type {Array<{id: string, topic: string, language: string, difficulty: string}>} */
export const BENCHMARK_TASKS = [
  // ---- Python ------------------------------------------------------------
  { id: "py-01", topic: "variables and data types", language: "python", difficulty: "beginner" },
  { id: "py-02", topic: "for loops and range", language: "python", difficulty: "beginner" },
  { id: "py-03", topic: "list slicing and negative indices", language: "python", difficulty: "beginner" },
  { id: "py-04", topic: "dictionaries and iteration order", language: "python", difficulty: "beginner" },
  { id: "py-05", topic: "string formatting with f-strings", language: "python", difficulty: "beginner" },
  { id: "py-06", topic: "functions, default arguments, and the mutable default pitfall", language: "python", difficulty: "intermediate" },
  { id: "py-07", topic: "list comprehensions and nested comprehensions", language: "python", difficulty: "intermediate" },
  { id: "py-08", topic: "exception handling with try/except/finally", language: "python", difficulty: "intermediate" },
  { id: "py-09", topic: "classes, __init__, and instance vs class attributes", language: "python", difficulty: "intermediate" },
  { id: "py-10", topic: "generators and the yield keyword", language: "python", difficulty: "advanced" },
  { id: "py-11", topic: "decorators with functools.wraps", language: "python", difficulty: "advanced" },
  { id: "py-12", topic: "recursion and base cases", language: "python", difficulty: "intermediate" },

  // ---- JavaScript --------------------------------------------------------
  { id: "js-01", topic: "let, const, and block scope", language: "javascript", difficulty: "beginner" },
  { id: "js-02", topic: "array map, filter, and reduce", language: "javascript", difficulty: "beginner" },
  { id: "js-03", topic: "template literals and string methods", language: "javascript", difficulty: "beginner" },
  { id: "js-04", topic: "objects, destructuring, and spread", language: "javascript", difficulty: "beginner" },
  { id: "js-05", topic: "strict equality and type coercion", language: "javascript", difficulty: "beginner" },
  { id: "js-06", topic: "closures and the loop variable capture problem", language: "javascript", difficulty: "intermediate" },
  { id: "js-07", topic: "promises and error handling with catch", language: "javascript", difficulty: "intermediate" },
  { id: "js-08", topic: "async/await and sequential vs parallel execution", language: "javascript", difficulty: "intermediate" },
  { id: "js-09", topic: "classes, inheritance, and super", language: "javascript", difficulty: "intermediate" },
  { id: "js-10", topic: "the event loop and microtask ordering", language: "javascript", difficulty: "advanced" },
  { id: "js-11", topic: "generators and iterators", language: "javascript", difficulty: "advanced" },
  { id: "js-12", topic: "this binding and arrow functions", language: "javascript", difficulty: "intermediate" },

  // ---- C++ ---------------------------------------------------------------
  { id: "cpp-01", topic: "variables, types, and cout formatting", language: "cpp", difficulty: "beginner" },
  { id: "cpp-02", topic: "arrays and range-based for loops", language: "cpp", difficulty: "beginner" },
  { id: "cpp-03", topic: "functions and pass by reference", language: "cpp", difficulty: "beginner" },
  { id: "cpp-04", topic: "std::string operations", language: "cpp", difficulty: "beginner" },
  { id: "cpp-05", topic: "structs and member functions", language: "cpp", difficulty: "beginner" },
  { id: "cpp-06", topic: "std::vector and iterators", language: "cpp", difficulty: "intermediate" },
  { id: "cpp-07", topic: "pointers, references, and dereferencing", language: "cpp", difficulty: "intermediate" },
  { id: "cpp-08", topic: "dynamic memory with new and delete", language: "cpp", difficulty: "intermediate" },
  { id: "cpp-09", topic: "classes, constructors, and destructors", language: "cpp", difficulty: "intermediate" },
  { id: "cpp-10", topic: "inheritance and virtual functions", language: "cpp", difficulty: "advanced" },
  { id: "cpp-11", topic: "templates and generic functions", language: "cpp", difficulty: "advanced" },
  { id: "cpp-12", topic: "smart pointers: unique_ptr and shared_ptr", language: "cpp", difficulty: "advanced" },
];

/** The prompt issued for a benchmark task. Identical across all arms. */
export const buildTaskPrompt = ({ topic, language, difficulty }) =>
  `Write a short tutorial section explaining "${topic}" in ${language} for a ${difficulty}-level student.

Include exactly 2 runnable code examples in fenced \`\`\`${language} blocks.
Each example must be complete and produce visible output when run on its own.
Keep the prose under 200 words.`;

export const selectTasks = ({ languages = null, limit = null, ids = null } = {}) => {
  let tasks = BENCHMARK_TASKS;
  if (ids?.length) tasks = tasks.filter((t) => ids.includes(t.id));
  if (languages?.length) tasks = tasks.filter((t) => languages.includes(t.language));
  if (!limit || limit >= tasks.length) return tasks;

  // Stratify by language rather than truncating, so a reduced run stays
  // representative: `--limit 6` on the full set yields 2 tasks per language,
  // not the first 6 Python tasks.
  const buckets = new Map();
  for (const task of tasks) {
    if (!buckets.has(task.language)) buckets.set(task.language, []);
    buckets.get(task.language).push(task);
  }

  const selected = [];
  const queues = [...buckets.values()];
  let cursor = 0;
  while (selected.length < limit && queues.some((q) => q.length > 0)) {
    const queue = queues[cursor % queues.length];
    if (queue.length > 0) selected.push(queue.shift());
    cursor += 1;
  }

  // Restore benchmark order so reports read consistently.
  const order = new Map(BENCHMARK_TASKS.map((t, i) => [t.id, i]));
  return selected.sort((a, b) => order.get(a.id) - order.get(b.id));
};

export default { BENCHMARK_VERSION, BENCHMARK_TASKS, buildTaskPrompt, selectTasks };
