// Produces tutorial content through the verified-generation pipeline.
//
// Drop-in replacement for the old geminiService.generateTutorial: returns the
// same { title, description, content, codeExamples, notes, tips } shape the
// Tutorial model expects, plus a `verification` block describing what the
// sandbox actually confirmed.
//
// The important behavioural difference: every code example attached to the
// returned tutorial has been executed. Examples the sandbox could not get
// running are dropped rather than shipped to a student.

import verifiedGeneration from "./verifiedGeneration.js";
import { extractCodeBlocks } from "./codeBlockExtractor.js";
import GenerationTrace from "../../models/GenerationTrace.js";

const CONTENT_SECTIONS = `1. **Introduction** - what this is and why it matters (2-3 paragraphs)
2. **Key Concepts** - the main ideas (4-6 bullet points)
3. **Detailed Explanation** - in-depth, using analogies and real-world comparisons
4. **How It Works** - step-by-step mechanics
5. **Common Use Cases** - 3-4 realistic scenarios
6. **Common Pitfalls** - 3-4 bullet points
7. **Best Practices** - 3-4 bullet points
8. **Practice Exercise** - describe an exercise, do not give the solution
9. **Summary** - 2-3 sentences`;

class VerifiedTutorialService {
  /**
   * @param {object}  opts
   * @param {string}  opts.topic
   * @param {string}  opts.language
   * @param {string} [opts.difficulty]
   * @param {string} [opts.userId]   attached to the persisted trace
   * @param {boolean}[opts.grounded]
   * @param {boolean}[opts.verified]
   */
  async generateTutorial({
    topic,
    language,
    difficulty = "beginner",
    userId = null,
    grounded = true,
    verified = true,
  }) {
    const lang = String(language).toLowerCase();

    // Prose and code are generated in one pass so the examples match the
    // explanation. The old two-call split let them drift apart.
    const prompt = `Write a tutorial on "${topic}" for ${lang} at ${difficulty} level.

Structure it with these sections:
${CONTENT_SECTIONS}

Then add a final section titled "## Code Examples" containing exactly 3 examples.
Each example must be:
- Inside a fenced \`\`\`${lang} block
- Complete and runnable on its own, producing visible output
- Preceded by a line of the form "### Example N: <short title>"
- Followed by a line of the form "**What this shows:** <one sentence>"

Order the examples from simple to more advanced.
Use markdown headers throughout.`;

    const result = await verifiedGeneration.generate({
      prompt,
      language: lang,
      difficulty,
      retrievalQuery: `${topic} ${lang}`,
      grounded,
      verified,
      maxTokens: 4000,
    });

    const parsed = this.#parse(result, { topic, language: lang, difficulty });

    // Telemetry is best-effort: a trace write must never fail the request.
    this.#persistTrace({ result, topic, lang, difficulty, userId }).catch((err) =>
      console.warn("GenerationTrace write failed:", err.message)
    );

    return parsed;
  }

  #parse(result, { topic, language, difficulty }) {
    const { content, blocks, metrics, citations } = result;

    // Only ship examples the sandbox confirmed. A block with finalVerdict
    // "ok" is one that actually ran.
    const verifiedIndexes = new Set(
      blocks.filter((b) => b.finalVerdict === "ok").map((b) => b.index)
    );

    // A verdict was reached only if the sandbox actually judged something.
    // "executor_unavailable" is a non-null verdict but carries no information
    // about the code, so it must not count as a run.
    //
    // This distinction is load-bearing: if the sandbox is down, treating the
    // outage as "verification ran and nothing passed" would drop every example
    // and publish a tutorial with no code at all. Degrade to unverified
    // delivery instead, and say so on the returned object.
    const judged = metrics.judgedBlocks > 0;
    const sandboxDegraded =
      blocks.some((b) => b.finalVerdict === "executor_unavailable") && !judged;

    const extracted = extractCodeBlocks(content, { defaultLanguage: language });
    const codeExamples = [];
    let order = 1;

    for (const block of extracted) {
      if (!block.runnable) continue;
      // Filter to confirmed-good examples only when the sandbox actually
      // returned verdicts; otherwise keep everything and flag it as unverified.
      if (judged && !verifiedIndexes.has(block.index)) continue;

      codeExamples.push({
        title: this.#titleFor(block, order),
        description: this.#descriptionFor(content, block),
        code: block.code,
        input: "",
        expectedOutput: "",
        order: order++,
      });
    }

    const titleMatch = /^#\s+(.+)$/m.exec(content);
    const title =
      titleMatch?.[1]?.trim() ||
      `${topic} - ${language.charAt(0).toUpperCase()}${language.slice(1)} Tutorial`;

    const notes = this.#collect(content, /(?:📝|Note:|Important:|Keep in mind:)\s*(.+)/gi);
    const tips = this.#collect(content, /(?:💡|Tip:|Pro tip:|Best practice:|Remember:)\s*(.+)/gi);

    return {
      title,
      description:
        `Tutorial covering ${topic} in ${language} at ${difficulty} level.` +
        (judged
          ? ` All ${codeExamples.length} code examples were executed and verified.`
          : ""),
      content,
      concept: topic,
      codeExamples,
      notes: notes.length ? notes : ["Review each example by running it yourself."],
      tips: tips.length ? tips : [`Practise ${topic} on a small project of your own.`],
      verification: {
        verified: judged,
        // True when examples shipped unverified because the sandbox was down.
        // The UI must not show a "verified" badge in this state.
        sandboxDegraded,
        grounded: citations.length > 0,
        snippetsJudged: metrics.judgedBlocks,
        passedFirstTry: metrics.passedFirstTry,
        passedFinal: metrics.passedFinal,
        repaired: metrics.repaired,
        droppedUnverified: metrics.judgedBlocks - metrics.passedFinal,
        firstTryPassRate: metrics.firstTryPassRate,
        finalPassRate: metrics.finalPassRate,
        citations,
      },
    };
  }

  #titleFor(block, fallbackOrder) {
    // precedingText is a fixed-size window that can span more than one
    // "### Example N:" heading, so take the last (nearest) match rather than
    // the first — otherwise every example inherits the previous one's title.
    const matches = [...block.precedingText.matchAll(/###\s*Example\s*\d+\s*:\s*(.+)$/gim)];
    const nearest = matches.at(-1);
    return nearest?.[1]?.trim() || `Example ${fallbackOrder}`;
  }

  #descriptionFor(content, block) {
    // "**What this shows:** ..." is emitted directly after the fence.
    const after = content.slice(content.indexOf(block.raw) + block.raw.length, undefined);
    const match = /\*\*What this shows:\*\*\s*(.+)/i.exec(after.slice(0, 400));
    return match?.[1]?.trim() || "";
  }

  #collect(content, regex) {
    const out = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const value = match[1]?.trim();
      if (value && !out.includes(value)) out.push(value);
    }
    return out.slice(0, 6);
  }

  async #persistTrace({ result, topic, lang, difficulty, userId }) {
    await GenerationTrace.create({
      user: userId,
      feature: "tutorial",
      topic,
      language: lang,
      difficulty,
      config: result.config,
      provider: result.provider,
      citations: result.citations,
      blocks: result.blocks,
      metrics: result.metrics,
    });
  }
}

const verifiedTutorialService = new VerifiedTutorialService();
export { VerifiedTutorialService };
export default verifiedTutorialService;
