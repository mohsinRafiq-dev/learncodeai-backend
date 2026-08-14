// Extracts fenced code blocks from LLM markdown output and decides which of
// them are actually executable.
//
// This matters more than it looks: a naive "run every ``` block" approach
// reports false failures on blocks that were never meant to run (shell
// commands, expected-output dumps, deliberately-broken "don't do this"
// examples). Verification is only credible if the denominator is right.

const LANGUAGE_ALIASES = {
  py: "python",
  python3: "python",
  python: "python",
  js: "javascript",
  jsx: "javascript",
  node: "javascript",
  javascript: "javascript",
  cpp: "cpp",
  "c++": "cpp",
  cxx: "cpp",
  cc: "cpp",
};

// Fences we never execute, regardless of content.
const NON_CODE_TAGS = new Set([
  "output",
  "text",
  "txt",
  "plaintext",
  "console",
  "shell",
  "sh",
  "bash",
  "zsh",
  "powershell",
  "json",
  "yaml",
  "yml",
  "xml",
  "html",
  "css",
  "sql",
  "diff",
  "markdown",
  "md",
  "",
]);

// Prose markers that flag a block as an intentional counter-example.
const COUNTER_EXAMPLE_MARKERS = [
  /\b(don'?t\s+do\s+this|do\s+not\s+do\s+this|bad\s+example|wrong\s+way|incorrect|anti-?pattern|this\s+will\s+fail|raises?\s+an?\s+error)\b/i,
];

export const normalizeLanguage = (tag) => {
  if (!tag) return null;
  return LANGUAGE_ALIASES[String(tag).trim().toLowerCase()] ?? null;
};

/**
 * Pull every fenced block out of a markdown string.
 * Preserves the ~200 chars of prose before each fence so we can detect
 * "don't do this" framing.
 *
 * @returns {Array<{raw: string, code: string, tag: string, language: string|null,
 *                  runnable: boolean, skipReason: string|null, index: number,
 *                  precedingText: string}>}
 */
export const extractCodeBlocks = (markdown, { defaultLanguage = null } = {}) => {
  if (!markdown || typeof markdown !== "string") return [];

  const blocks = [];
  // Tolerates ```lang, ``` lang, and 4+ backticks.
  const fenceRegex = /^([ \t]*)(`{3,})[ \t]*([\w+#.-]*)[ \t]*\r?\n([\s\S]*?)^\1\2[ \t]*$/gm;

  let match;
  let index = 0;
  while ((match = fenceRegex.exec(markdown)) !== null) {
    const [raw, , , tagRaw, body] = match;
    const tag = (tagRaw || "").toLowerCase();
    const code = body.replace(/\s+$/, "");

    const precedingText = markdown
      .slice(Math.max(0, match.index - 200), match.index)
      .trim();

    const language = normalizeLanguage(tag) ?? (tag ? null : defaultLanguage);
    const { runnable, skipReason } = classifyBlock({
      tag,
      code,
      language,
      precedingText,
    });

    blocks.push({
      raw,
      code,
      tag,
      language,
      runnable,
      skipReason,
      index: index++,
      precedingText,
    });
  }

  return blocks;
};

const classifyBlock = ({ tag, code, language, precedingText }) => {
  if (!code.trim()) {
    return { runnable: false, skipReason: "empty" };
  }
  if (NON_CODE_TAGS.has(tag) && !language) {
    return { runnable: false, skipReason: `non-code fence (\`${tag || "untagged"}\`)` };
  }
  if (!language) {
    return { runnable: false, skipReason: `unsupported language (\`${tag}\`)` };
  }
  if (COUNTER_EXAMPLE_MARKERS.some((re) => re.test(precedingText))) {
    return { runnable: false, skipReason: "intentional counter-example" };
  }
  // Ellipsis placeholders mean the snippet is deliberately incomplete.
  if (/^\s*(\.\.\.|# \.\.\.|\/\/ \.\.\.)\s*$/m.test(code)) {
    return { runnable: false, skipReason: "contains placeholder ellipsis" };
  }
  return { runnable: true, skipReason: null };
};

/**
 * Make a snippet self-contained so a bare fragment doesn't register as a
 * failure. Python/JS run fragments fine; C++ needs a translation unit.
 */
export const prepareForExecution = (code, language) => {
  if (language !== "cpp") return { code, wrapped: false };

  const hasMain = /\bint\s+main\s*\(/.test(code);
  if (hasMain) return { code, wrapped: false };

  // Fragment: give it enough of a translation unit to compile.
  const directives = [];
  const bodyLines = [];
  for (const line of code.split("\n")) {
    if (/^\s*#\s*(include|define|pragma)\b/.test(line) || /^\s*using\s+namespace\b/.test(line)) {
      directives.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  const commonHeaders = [
    "#include <iostream>",
    "#include <vector>",
    "#include <string>",
    "#include <algorithm>",
    "using namespace std;",
  ].filter((h) => !directives.some((d) => d.trim() === h));

  const body = bodyLines.join("\n").trim();

  // Declarations at file scope stay outside main; statements go inside.
  const looksLikeDeclarations =
    /^\s*(class|struct|template|[\w:<>,\s*&]+\s+\w+\s*\([^)]*\)\s*\{)/m.test(body);

  const wrappedCode = looksLikeDeclarations
    ? `${[...directives, ...commonHeaders].join("\n")}\n\n${body}\n\nint main() { return 0; }\n`
    : `${[...directives, ...commonHeaders].join("\n")}\n\nint main() {\n${body
        .split("\n")
        .map((l) => `    ${l}`)
        .join("\n")}\n    return 0;\n}\n`;

  return { code: wrappedCode, wrapped: true };
};

/** Replace the Nth runnable block's body in the original markdown. */
export const replaceBlock = (markdown, block, newCode) =>
  markdown.replace(block.raw, block.raw.replace(block.code, newCode));

export default { extractCodeBlocks, prepareForExecution, replaceBlock, normalizeLanguage };
