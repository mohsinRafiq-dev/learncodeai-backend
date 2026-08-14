// Tests for the provider abstraction's failure handling.
//
// The Gemini case that matters: its flash models reason before answering, and
// maxOutputTokens is a combined budget for thinking plus visible output. A
// request sized only for the answer returns finishReason MAX_TOKENS with an
// empty body. Treating that as fatal made long generations fail outright in
// production.

import { jest } from "@jest/globals";
import { AIProvider, ProviderError } from "../../src/services/ai/aiProvider.js";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

const geminiBody = ({ text = "", finishReason = "STOP", thoughts = 0 } = {}) => ({
  candidates: [
    {
      content: text ? { parts: [{ text }] } : undefined,
      finishReason,
    },
  ],
  usageMetadata: { thoughtsTokenCount: thoughts },
});

const mockFetchSequence = (responses) => {
  const calls = [];
  let i = 0;
  globalThis.fetch = jest.fn(async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    const r = responses[Math.min(i++, responses.length - 1)];
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    };
  });
  return calls;
};

beforeEach(() => {
  process.env = { ...originalEnv, GEMINI_API_KEY: "test-key", AI_PROVIDER_ORDER: "gemini" };
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env = { ...originalEnv };
  jest.restoreAllMocks();
});

describe("thinking-token budget", () => {
  it("requests more than the caller asked for, to leave room for reasoning", async () => {
    const calls = mockFetchSequence([{ body: geminiBody({ text: "hi" }) }]);
    const provider = new AIProvider();

    await provider.complete({ prompt: "x", maxTokens: 1000 });

    expect(calls[0].body.generationConfig.maxOutputTokens).toBeGreaterThan(1000);
  });

  it("escalates the budget on each retry", async () => {
    const calls = mockFetchSequence([
      { body: geminiBody({ finishReason: "MAX_TOKENS", thoughts: 500 }) },
      { body: geminiBody({ finishReason: "MAX_TOKENS", thoughts: 900 }) },
      { body: geminiBody({ text: "finally" }) },
    ]);
    const provider = new AIProvider();

    const result = await provider.complete({ prompt: "x", maxTokens: 100 });

    expect(result.text).toBe("finally");
    expect(calls).toHaveLength(3);
    // Each attempt must ask for strictly more than the last.
    const budgets = calls.map((c) => c.body.generationConfig.maxOutputTokens);
    expect(budgets[1]).toBeGreaterThan(budgets[0]);
    expect(budgets[2]).toBeGreaterThan(budgets[1]);
  });

  it("treats a budget-exhausted response as retryable", async () => {
    mockFetchSequence([
      { body: geminiBody({ finishReason: "MAX_TOKENS", thoughts: 300 }) },
    ]);
    const provider = new AIProvider();

    await expect(provider.complete({ prompt: "x", maxTokens: 50 })).rejects.toThrow(
      /token budget on reasoning/
    );
    // Retried up to the configured limit rather than failing on first sight.
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("reports the thinking-token count in the error, so the cause is obvious", async () => {
    mockFetchSequence([
      { body: geminiBody({ finishReason: "MAX_TOKENS", thoughts: 742 }) },
    ]);
    const provider = new AIProvider();

    await expect(provider.complete({ prompt: "x", maxTokens: 50 })).rejects.toThrow(/742/);
  });
});

describe("transient upstream failures", () => {
  it("retries a 503 and succeeds when it clears", async () => {
    mockFetchSequence([
      { ok: false, status: 503, body: { error: { message: "high demand" } } },
      { body: geminiBody({ text: "recovered" }) },
    ]);
    const provider = new AIProvider();

    const result = await provider.complete({ prompt: "x" });
    expect(result.text).toBe("recovered");
    expect(result.attempts).toBe(2);
  });

  it.each([[429], [500], [502], [503], [504]])(
    "treats HTTP %i as retryable",
    async (status) => {
      mockFetchSequence([
        { ok: false, status, body: { error: { message: "transient" } } },
        { body: geminiBody({ text: "ok" }) },
      ]);
      const provider = new AIProvider();
      await expect(provider.complete({ prompt: "x" })).resolves.toMatchObject({ text: "ok" });
    }
  );

  it("does not retry a 400", async () => {
    mockFetchSequence([{ ok: false, status: 400, body: { error: { message: "bad request" } } }]);
    const provider = new AIProvider();

    await expect(provider.complete({ prompt: "x" })).rejects.toThrow(/400/);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("retries a network-level failure", async () => {
    let n = 0;
    globalThis.fetch = jest.fn(async () => {
      if (n++ === 0) throw new Error("socket hang up");
      return { ok: true, status: 200, json: async () => geminiBody({ text: "ok" }) };
    });
    const provider = new AIProvider();

    await expect(provider.complete({ prompt: "x" })).resolves.toMatchObject({ text: "ok" });
  });
});

describe("configuration", () => {
  it("reports configured when a key is present", () => {
    expect(new AIProvider().isConfigured()).toBe(true);
  });

  it("reports unconfigured when no key is set", () => {
    delete process.env.GEMINI_API_KEY;
    expect(new AIProvider().isConfigured()).toBe(false);
  });

  it("throws a helpful error naming the required env vars", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(new AIProvider().complete({ prompt: "x" })).rejects.toThrow(
      /GEMINI_API_KEY|OPENAI_API_KEY/
    );
  });

  it("rejects a missing prompt", async () => {
    await expect(new AIProvider().complete({})).rejects.toThrow(ProviderError);
  });
});

describe("usage accounting", () => {
  it("counts calls and failures per provider", async () => {
    mockFetchSequence([
      { ok: false, status: 503, body: { error: { message: "x" } } },
      { body: geminiBody({ text: "ok" }) },
    ]);
    const provider = new AIProvider();
    await provider.complete({ prompt: "x" });

    const usage = provider.getUsage();
    expect(usage.calls).toBe(2);
    expect(usage.failures).toBe(1);
    expect(usage.byProvider.gemini.calls).toBe(2);
  });
});
