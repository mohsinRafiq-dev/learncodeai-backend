// Piston (https://github.com/engineer-man/piston) executor.
// Public API at https://emkc.org/api/v2/piston is free and supports 70+ languages.
// For self-hosting, set PISTON_URL to your own instance.

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";

// Map our language ids to Piston's runtime names + versions.
// "*" = latest available; Piston resolves it.
const LANGUAGE_MAP = {
  python: { language: "python", version: "*" },
  javascript: { language: "javascript", version: "*" },
  js: { language: "javascript", version: "*" },
  cpp: { language: "c++", version: "*" },
  "c++": { language: "c++", version: "*" },
};

const FILENAME_BY_LANG = {
  python: "main.py",
  javascript: "main.js",
  cpp: "main.cpp",
};

class PistonCodeExecutor {
  constructor() {
    this.runtimes = null;
    this.runtimesFetchedAt = 0;
  }

  async getRuntimes() {
    const now = Date.now();
    if (this.runtimes && now - this.runtimesFetchedAt < 60 * 60 * 1000) {
      return this.runtimes;
    }
    try {
      const res = await fetch(`${PISTON_URL}/runtimes`);
      if (!res.ok) throw new Error(`Piston runtimes ${res.status}`);
      this.runtimes = await res.json();
      this.runtimesFetchedAt = now;
      return this.runtimes;
    } catch (e) {
      console.warn("Failed to fetch Piston runtimes:", e.message);
      return [];
    }
  }

  async resolveVersion(piLang) {
    const runtimes = await this.getRuntimes();
    const match = runtimes.find((r) => r.language === piLang);
    return match?.version || "*";
  }

  async executeCode(code, language, input = "") {
    const startTime = Date.now();
    const mapped = LANGUAGE_MAP[language?.toLowerCase()];
    if (!mapped) {
      return {
        output: `Unsupported language: ${language}`,
        error: true,
        executionTime: "0ms",
      };
    }

    const filename = FILENAME_BY_LANG[language.toLowerCase()] || "main.txt";
    const version =
      mapped.version === "*" ? await this.resolveVersion(mapped.language) : mapped.version;

    const body = {
      language: mapped.language,
      version,
      files: [{ name: filename, content: code }],
      stdin: input || "",
      compile_timeout: 10_000,
      run_timeout: parseInt(process.env.CODE_EXEC_TIMEOUT_MS || "10000", 10),
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    try {
      const res = await fetch(`${PISTON_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          output: `Piston error ${res.status}: ${text.slice(0, 300)}`,
          error: true,
          executionTime: `${Date.now() - startTime}ms`,
        };
      }

      const result = await res.json();
      const compile = result.compile || {};
      const run = result.run || {};
      const compileErr = (compile.stderr || "").trim();
      const runErr = (run.stderr || "").trim();
      const stdout = (run.stdout || "").trim();

      // Compilation error first (C++)
      if (compile.code && compile.code !== 0 && compileErr) {
        return {
          output: compileErr,
          error: true,
          executionTime: `${Date.now() - startTime}ms`,
        };
      }

      const isError = (run.code && run.code !== 0) || !!runErr;
      return {
        output: isError ? runErr || stdout || "Unknown error" : stdout || "No output",
        error: isError,
        stderr: runErr || undefined,
        executionTime: `${Date.now() - startTime}ms`,
      };
    } catch (e) {
      return {
        output: `Execution failed: ${e.message}`,
        error: true,
        executionTime: `${Date.now() - startTime}ms`,
      };
    }
  }
}

const pistonCodeExecutor = new PistonCodeExecutor();
export default pistonCodeExecutor;
