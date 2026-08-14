// Unit tests for code block extraction.
//
// The classification logic is what makes the verification metric credible:
// if we execute blocks that were never meant to run, the reported pass rate
// is wrong in the pessimistic direction.

import {
  extractCodeBlocks,
  prepareForExecution,
  replaceBlock,
  normalizeLanguage,
} from "../../src/services/ai/codeBlockExtractor.js";

const fence = (lang, body) => "```" + lang + "\n" + body + "\n```";

describe("normalizeLanguage", () => {
  it("maps known aliases to canonical ids", () => {
    expect(normalizeLanguage("py")).toBe("python");
    expect(normalizeLanguage("Python3")).toBe("python");
    expect(normalizeLanguage("js")).toBe("javascript");
    expect(normalizeLanguage("node")).toBe("javascript");
    expect(normalizeLanguage("c++")).toBe("cpp");
    expect(normalizeLanguage("CXX")).toBe("cpp");
  });

  it("returns null for unsupported languages", () => {
    expect(normalizeLanguage("rust")).toBeNull();
    expect(normalizeLanguage("")).toBeNull();
    expect(normalizeLanguage(undefined)).toBeNull();
  });
});

describe("extractCodeBlocks", () => {
  it("extracts a single fenced block with its language", () => {
    const md = `Intro text\n\n${fence("python", 'print("hi")')}\n\nOutro`;
    const blocks = extractCodeBlocks(md);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe("python");
    expect(blocks[0].code).toBe('print("hi")');
    expect(blocks[0].runnable).toBe(true);
  });

  it("extracts multiple blocks and preserves order", () => {
    const md = `${fence("python", "a = 1")}\n\ntext\n\n${fence("javascript", "let b = 2;")}`;
    const blocks = extractCodeBlocks(md);

    expect(blocks.map((b) => b.language)).toEqual(["python", "javascript"]);
    expect(blocks.map((b) => b.index)).toEqual([0, 1]);
  });

  it("marks output/shell fences as non-runnable", () => {
    const md = `${fence("output", "hello")}\n${fence("bash", "npm install")}\n${fence("json", "{}")}`;
    const blocks = extractCodeBlocks(md);

    expect(blocks).toHaveLength(3);
    expect(blocks.every((b) => b.runnable === false)).toBe(true);
    expect(blocks[0].skipReason).toMatch(/non-code fence/);
  });

  it("marks unsupported languages as non-runnable", () => {
    const blocks = extractCodeBlocks(fence("rust", "fn main() {}"));
    expect(blocks[0].runnable).toBe(false);
    expect(blocks[0].skipReason).toMatch(/unsupported language/);
  });

  it("detects intentional counter-examples from preceding prose", () => {
    const md = `Here is the wrong way to do it:\n\n${fence("python", "x = ")}`;
    const blocks = extractCodeBlocks(md);

    expect(blocks[0].runnable).toBe(false);
    expect(blocks[0].skipReason).toBe("intentional counter-example");
  });

  it("detects several counter-example phrasings", () => {
    for (const phrase of [
      "Don't do this:",
      "Do not do this:",
      "This is a bad example:",
      "This will fail:",
      "This is an anti-pattern:",
    ]) {
      const blocks = extractCodeBlocks(`${phrase}\n\n${fence("python", "x = 1")}`);
      expect(blocks[0].runnable).toBe(false);
    }
  });

  it("skips blocks containing placeholder ellipsis", () => {
    const md = fence("python", "def f():\n    ...\n");
    expect(extractCodeBlocks(md)[0].runnable).toBe(false);
  });

  it("skips empty blocks", () => {
    expect(extractCodeBlocks("```python\n\n```")[0].runnable).toBe(false);
  });

  it("applies defaultLanguage to untagged fences", () => {
    const blocks = extractCodeBlocks("```\nprint(1)\n```", { defaultLanguage: "python" });
    expect(blocks[0].language).toBe("python");
    expect(blocks[0].runnable).toBe(true);
  });

  it("handles fences of more than three backticks", () => {
    const md = "````python\nprint(1)\n````";
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe("print(1)");
  });

  it("returns an empty array for non-string input", () => {
    expect(extractCodeBlocks(null)).toEqual([]);
    expect(extractCodeBlocks(undefined)).toEqual([]);
    expect(extractCodeBlocks("")).toEqual([]);
  });

  it("does not treat inline backticks as a fence", () => {
    expect(extractCodeBlocks("Use the `print()` function.")).toHaveLength(0);
  });
});

describe("prepareForExecution", () => {
  it("leaves python and javascript untouched", () => {
    expect(prepareForExecution("print(1)", "python")).toEqual({
      code: "print(1)",
      wrapped: false,
    });
    expect(prepareForExecution("console.log(1)", "javascript").wrapped).toBe(false);
  });

  it("leaves C++ with an existing main untouched", () => {
    const code = "#include <iostream>\nint main() { return 0; }";
    expect(prepareForExecution(code, "cpp").wrapped).toBe(false);
  });

  it("wraps a bare C++ statement fragment in a main function", () => {
    const { code, wrapped } = prepareForExecution("cout << 1 << endl;", "cpp");

    expect(wrapped).toBe(true);
    expect(code).toMatch(/#include <iostream>/);
    expect(code).toMatch(/using namespace std;/);
    expect(code).toMatch(/int main\(\)/);
    expect(code).toMatch(/cout << 1 << endl;/);
  });

  it("keeps C++ declarations at file scope rather than inside main", () => {
    const { code, wrapped } = prepareForExecution("struct Point { int x; int y; };", "cpp");

    expect(wrapped).toBe(true);
    // The struct must appear before main, not nested inside it.
    expect(code.indexOf("struct Point")).toBeLessThan(code.indexOf("int main()"));
  });

  it("does not duplicate includes the fragment already has", () => {
    const { code } = prepareForExecution("#include <iostream>\ncout << 1;", "cpp");
    const occurrences = code.match(/#include <iostream>/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });
});

describe("replaceBlock", () => {
  it("swaps a block's body while leaving surrounding prose intact", () => {
    const md = `Before\n\n${fence("python", "print(1)")}\n\nAfter`;
    const block = extractCodeBlocks(md)[0];
    const updated = replaceBlock(md, block, "print(2)");

    expect(updated).toContain("print(2)");
    expect(updated).not.toContain("print(1)");
    expect(updated).toContain("Before");
    expect(updated).toContain("After");
  });
});
