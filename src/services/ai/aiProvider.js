// Unified LLM provider abstraction.
//
// Replaces the duplicated geminiService/openaiService pair: both files were the
// same prompt-building + regex-parsing logic with a different endpoint. Callers
// now ask for a completion and get one, with retries and cross-provider
// failover handled here.
//
// Deliberately dependency-free (uses global fetch) so the evaluation harness
// runs anywhere Node 18+ does.

import dotenv from "dotenv";
dotenv.config();

const PROVIDERS = {
  gemini: {
    name: "gemini",
    envKey: "GEMINI_API_KEY",
    defaultModel: process.env.GEMINI_MODEL || "gemini-flash-latest",
  },
  openai: {
    name: "openai",
    envKey: "OPENAI_API_KEY",
    defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
};

// Errors worth retrying: transient network faults, rate limits, 5xx.
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

class ProviderError extends Error {
  constructor(message, { status, provider, retryable = false } = {}) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class AIProvider {
  constructor() {
    // Order matters: first configured provider is primary, rest are failover.
    this.order = (process.env.AI_PROVIDER_ORDER || "gemini,openai")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((p) => PROVIDERS[p]);

    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES || "3", 10);
    this.usage = { calls: 0, failures: 0, byProvider: {} };
  }

  /** Providers that actually have an API key present. */
  availableProviders() {
    return this.order.filter((p) => Boolean(process.env[PROVIDERS[p].envKey]));
  }

  isConfigured() {
    return this.availableProviders().length > 0;
  }

  /**
   * Request a completion.
   *
   * @param {object}  opts
   * @param {string}  opts.prompt       User message.
   * @param {string} [opts.system]      System instruction.
   * @param {number} [opts.temperature] Sampling temperature.
   * @param {number} [opts.maxTokens]   Output cap.
   * @param {string} [opts.provider]    Force a specific provider.
   * @returns {Promise<{text: string, provider: string, model: string, latencyMs: number, attempts: number}>}
   */
  async complete({
    prompt,
    system = "",
    temperature = 0.7,
    maxTokens = 3000,
    provider = null,
  }) {
    if (!prompt || typeof prompt !== "string") {
      throw new ProviderError("prompt is required and must be a string");
    }

    const candidates = provider
      ? [provider].filter((p) => PROVIDERS[p])
      : this.availableProviders();

    if (candidates.length === 0) {
      throw new ProviderError(
        `No AI provider configured. Set one of: ${Object.values(PROVIDERS)
          .map((p) => p.envKey)
          .join(", ")}`
      );
    }

    let lastError = null;

    for (const providerName of candidates) {
      const apiKey = process.env[PROVIDERS[providerName].envKey];
      if (!apiKey) {
        lastError = new ProviderError(`${providerName}: no API key`, {
          provider: providerName,
        });
        continue;
      }

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        const startedAt = Date.now();
        try {
          const text =
            providerName === "gemini"
              ? await this.#callGemini({ prompt, system, temperature, maxTokens, apiKey })
              : await this.#callOpenAI({ prompt, system, temperature, maxTokens, apiKey });

          this.#recordUsage(providerName, true);

          return {
            text,
            provider: providerName,
            model: PROVIDERS[providerName].defaultModel,
            latencyMs: Date.now() - startedAt,
            attempts: attempt,
          };
        } catch (err) {
          lastError = err;
          this.#recordUsage(providerName, false);

          const shouldRetry = err.retryable && attempt < this.maxRetries;
          if (!shouldRetry) break;

          // Exponential backoff with jitter, capped at 8s.
          const backoff = Math.min(2 ** attempt * 500, 8000);
          await sleep(backoff + Math.random() * 250);
        }
      }
      // Exhausted retries for this provider — fall through to the next one.
    }

    throw lastError ?? new ProviderError("All providers failed");
  }

  async #callGemini({ prompt, system, temperature, maxTokens, apiKey }) {
    const model = PROVIDERS.gemini.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };
    if (system) {
      body.systemInstruction = { parts: [{ text: system }] };
    }

    const res = await this.#fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, "gemini");

    const text = res?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("") ?? "";

    if (!text) {
      const reason = res?.candidates?.[0]?.finishReason || "empty response";
      throw new ProviderError(`gemini returned no text (${reason})`, {
        provider: "gemini",
        retryable: reason === "RECITATION" || reason === "OTHER",
      });
    }
    return text;
  }

  async #callOpenAI({ prompt, system, temperature, maxTokens, apiKey }) {
    const messages = [];
    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: prompt });

    const res = await this.#fetchJson(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: PROVIDERS.openai.defaultModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      },
      "openai"
    );

    const text = res?.choices?.[0]?.message?.content ?? "";
    if (!text) {
      throw new ProviderError("openai returned no text", {
        provider: "openai",
        retryable: true,
      });
    }
    return text;
  }

  async #fetchJson(url, init, providerName) {
    let res;
    try {
      res = await fetch(url, init);
    } catch (networkErr) {
      // DNS failure, socket hang-up, etc — always worth a retry.
      throw new ProviderError(`${providerName}: ${networkErr.message}`, {
        provider: providerName,
        retryable: true,
      });
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new ProviderError(
        `${providerName} API error ${res.status}: ${detail.slice(0, 300)}`,
        {
          status: res.status,
          provider: providerName,
          retryable: RETRYABLE_STATUS.has(res.status),
        }
      );
    }

    return res.json();
  }

  #recordUsage(providerName, ok) {
    this.usage.calls += 1;
    if (!ok) this.usage.failures += 1;
    const bucket = (this.usage.byProvider[providerName] ??= {
      calls: 0,
      failures: 0,
    });
    bucket.calls += 1;
    if (!ok) bucket.failures += 1;
  }

  getUsage() {
    return structuredClone(this.usage);
  }

  resetUsage() {
    this.usage = { calls: 0, failures: 0, byProvider: {} };
  }
}

const aiProvider = new AIProvider();
export { AIProvider, ProviderError };
export default aiProvider;
