// Closed-loop verified generation.
//
// The core contribution of the platform: no AI-generated code reaches a
// learner until it has been executed in the sandbox. When a snippet fails, the
// compiler/runtime diagnostic is fed back to the model and the snippet is
// regenerated, up to a bounded number of attempts.
//
//   generate -> extract code blocks -> execute each in sandbox
//            -> on failure: repair with the real diagnostic -> re-execute
//            -> emit content + per-block verification record
//
// Both stages are independently switchable (`grounded`, `verified`) so the
// evaluation harness can run a 2x2 ablation and attribute the effect of each.

import aiProvider from "./aiProvider.js";
import retrievalService from "./retrievalService.js";
import executionVerifier, { VERDICT } from "./executionVerifier.js";
import { extractCodeBlocks, replaceBlock } from "./codeBlockExtractor.js";

const DEFAULT_MAX_REPAIRS = parseInt(process.env.AI_MAX_REPAIR_ATTEMPTS || "2", 10);

const BASE_SYSTEM = `You are an expert programming tutor writing material for students learning to code.
Write clearly and precisely. Every code example you produce must be complete and runnable as-is.`;

const GROUNDED_SYSTEM = `${BASE_SYSTEM}

You have been given excerpts from the course's own curriculum. Ground your explanation in them:
- Prefer the terminology, notation, and conventions used in the sources.
- Do not contradict the sources.
- When you use a fact from a source, cite it inline as [SOURCE n].
- If the sources do not cover part of the question, answer from your own knowledge and mark that part with [UNSOURCED].`;

class VerifiedGenerationService {
  /**
   * Dependencies are injected so the loop can be exercised without live API
   * keys or a running sandbox.
   */
  constructor({
    provider = aiProvider,
    verifier = executionVerifier,
    retriever = retrievalService,
  } = {}) {
    this.provider = provider;
    this.verifier = verifier;
    this.retriever = retriever;
  }

  /**
   * @param {object}  opts
   * @param {string}  opts.prompt              What to generate.
   * @param {string}  opts.language            python | javascript | cpp
   * @param {string} [opts.difficulty]
   * @param {string} [opts.retrievalQuery]     Defaults to `prompt`.
   * @param {boolean}[opts.grounded=true]      Retrieve + cite curriculum.
   * @param {boolean}[opts.verified=true]      Execute + repair code blocks.
   * @param {number} [opts.maxRepairAttempts]
   * @param {number} [opts.temperature]
   * @param {number} [opts.maxTokens]
   */
  async generate({
    prompt,
    language,
    difficulty = "beginner",
    retrievalQuery = null,
    grounded = true,
    verified = true,
    maxRepairAttempts = DEFAULT_MAX_REPAIRS,
    temperature = 0.7,
    maxTokens = 3000,
  }) {
    const startedAt = Date.now();

    // --- Stage 1: retrieval ------------------------------------------------
    let passages = [];
    if (grounded) {
      passages = this.retriever.retrieve(retrievalQuery || prompt, {
        language,
        difficulty,
        topK: 4,
      });
    }

    const system = grounded && passages.length ? GROUNDED_SYSTEM : BASE_SYSTEM;
    const userPrompt =
      grounded && passages.length
        ? `${this.retriever.formatAsContext(
            passages
          )}\n\n---\n\nUsing the sources above where relevant:\n\n${prompt}`
        : prompt;

    // --- Stage 2: generation -----------------------------------------------
    const completion = await this.provider.complete({
      prompt: userPrompt,
      system,
      temperature,
      maxTokens,
    });

    let content = completion.text;

    // --- Stage 3: verification + repair ------------------------------------
    const blockRecords = [];
    let repairAttemptsTotal = 0;

    if (verified) {
      const blocks = extractCodeBlocks(content, { defaultLanguage: language });

      for (const block of blocks) {
        if (!block.runnable) {
          blockRecords.push(this.#skippedRecord(block));
          continue;
        }

        const record = await this.#verifyAndRepairBlock({
          block,
          language: block.language,
          maxRepairAttempts,
          onCodeAccepted: (newCode) => {
            content = replaceBlock(content, block, newCode);
          },
        });

        repairAttemptsTotal += record.attempts - 1;
        blockRecords.push(record);
      }
    } else {
      // Ablation arm: still record what *would* have been checked, so the
      // unverified baseline has a comparable denominator.
      for (const block of extractCodeBlocks(content, { defaultLanguage: language })) {
        blockRecords.push(this.#skippedRecord(block, { runnable: block.runnable }));
      }
    }

    const metrics = this.#computeMetrics(blockRecords, {
      latencyMs: Date.now() - startedAt,
      repairAttemptsTotal,
    });

    return {
      content,
      citations: passages.map((p) => ({
        id: p.id,
        title: p.title,
        source: p.source,
        language: p.language,
        difficulty: p.difficulty,
        score: p.score,
      })),
      blocks: blockRecords,
      metrics,
      config: { grounded, verified, maxRepairAttempts, language, difficulty },
      provider: {
        name: completion.provider,
        model: completion.model,
        latencyMs: completion.latencyMs,
        attempts: completion.attempts,
      },
    };
  }

  #skippedRecord(block, { runnable = false } = {}) {
    return {
      index: block.index,
      language: block.language,
      runnable,
      skipReason: block.skipReason,
      finalVerdict: null,
      attempts: 0,
      passedFirstTry: null,
      repaired: false,
      history: [],
    };
  }

  /** Execute one block; on a repairable failure, regenerate from the diagnostic. */
  async #verifyAndRepairBlock({ block, language, maxRepairAttempts, onCodeAccepted }) {
    let currentCode = block.code;
    let attempts = 0;
    let passedFirstTry = null;
    const history = [];

    const finish = (finalVerdict) => ({
      index: block.index,
      language,
      runnable: true,
      skipReason: null,
      finalVerdict,
      attempts,
      passedFirstTry,
      repaired: finalVerdict === VERDICT.OK && currentCode !== block.code,
      history,
    });

    for (let i = 0; i <= maxRepairAttempts; i++) {
      attempts += 1;
      const result = await this.verifier.verify(currentCode, language);

      history.push({
        attempt: attempts,
        verdict: result.verdict,
        diagnostic: result.diagnostic?.slice(0, 400) ?? null,
        durationMs: result.durationMs,
      });

      if (i === 0) passedFirstTry = result.ok;

      if (result.ok) {
        if (currentCode !== block.code) onCodeAccepted(currentCode);
        return finish(VERDICT.OK);
      }

      // Infrastructure fault or exhausted budget: stop, don't burn tokens.
      if (!result.repairable || i === maxRepairAttempts) {
        return finish(result.verdict);
      }

      const repaired = await this.#repairCode({
        code: currentCode,
        language,
        diagnostic: result.diagnostic,
        verdict: result.verdict,
      });

      // Model returned nothing usable: further attempts are unlikely to help.
      if (!repaired || repaired.trim() === currentCode.trim()) {
        return finish(result.verdict);
      }

      currentCode = repaired;
    }

    /* c8 ignore next */
    return finish(VERDICT.RUNTIME_ERROR);
  }

  /** Ask the model to fix a snippet given the real sandbox diagnostic. */
  async #repairCode({ code, language, diagnostic, verdict }) {
    const prompt = `The following ${language} code was executed in a sandbox and failed.

CODE:
\`\`\`${language}
${code}
\`\`\`

FAILURE TYPE: ${verdict}

SANDBOX OUTPUT:
${diagnostic}

Rewrite the code so it runs correctly. Requirements:
- Keep the original teaching intent and the concept being demonstrated.
- Make it complete and runnable on its own.
- Do not add explanation, commentary, or markdown prose.

Respond with ONLY the corrected code inside a single \`\`\`${language} fence.`;

    try {
      const { text } = await this.provider.complete({
        prompt,
        system: `You repair broken ${language} code. You output only code.`,
        temperature: 0.2, // Low: repair is a precision task, not a creative one.
        maxTokens: 1500,
      });

      const blocks = extractCodeBlocks(text, { defaultLanguage: language });
      if (blocks.length > 0) return blocks[0].code;

      // Model ignored the fence instruction; treat the whole reply as code if
      // it doesn't look like prose.
      const trimmed = text.trim();
      return /^[A-Z][a-z]+ /.test(trimmed) ? null : trimmed;
    } catch (err) {
      console.warn(`Repair attempt failed: ${err.message}`);
      return null;
    }
  }

  #computeMetrics(records, { latencyMs, repairAttemptsTotal }) {
    const runnable = records.filter((r) => r.runnable);
    const verifiedRecords = runnable.filter((r) => r.finalVerdict !== null);

    const passedFirstTry = verifiedRecords.filter((r) => r.passedFirstTry === true).length;
    const passedFinal = verifiedRecords.filter((r) => r.finalVerdict === VERDICT.OK).length;
    const repaired = verifiedRecords.filter((r) => r.repaired).length;
    const executorUnavailable = verifiedRecords.filter(
      (r) => r.finalVerdict === VERDICT.EXECUTOR_UNAVAILABLE
    ).length;

    // Blocks the sandbox couldn't judge are excluded from rates: counting an
    // infrastructure outage as a model failure would distort the result.
    const judged = verifiedRecords.length - executorUnavailable;
    const rate = (n) => (judged > 0 ? Number(((n / judged) * 100).toFixed(1)) : null);

    return {
      totalBlocks: records.length,
      runnableBlocks: runnable.length,
      skippedBlocks: records.length - runnable.length,
      verifiedBlocks: verifiedRecords.length,
      judgedBlocks: judged,
      executorUnavailable,
      passedFirstTry,
      passedFinal,
      repaired,
      failedFinal: judged - passedFinal,
      // The two headline numbers for the evaluation table.
      firstTryPassRate: rate(passedFirstTry),
      finalPassRate: rate(passedFinal),
      repairAttempts: repairAttemptsTotal,
      latencyMs,
    };
  }
}

const verifiedGeneration = new VerifiedGenerationService();
export { VerifiedGenerationService };
export default verifiedGeneration;
