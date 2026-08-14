// Grounding retrieval over the platform's own curriculum.
//
// Uses Okapi BM25 (Robertson & Zaragoza, 2009) rather than embeddings, for
// three reasons that matter here:
//   1. Zero dependencies and no API calls — the evaluation harness is fully
//      reproducible offline, and results don't drift when a hosted embedding
//      model is updated.
//   2. Deterministic — the same query returns the same passages every run,
//      so groundedness numbers are comparable across experiments.
//   3. Programming queries are heavy in exact identifiers ("__init__",
//      "std::vector", "useEffect") where lexical matching is competitive with
//      dense retrieval.
//
// An embedding backend can be slotted in behind the same interface later; the
// scoring function is isolated in #score().

import { pythonTutorials } from "../../utils/seedData/pythonTutorials.js";
import { javascriptTutorials } from "../../utils/seedData/javascriptTutorials.js";
import { cppTutorials } from "../../utils/seedData/cppTutorials.js";
import pythonCourse from "../../utils/seedData/pythonCourse.js";
import javascriptCourse from "../../utils/seedData/javascriptCourse.js";
import cppCourse from "../../utils/seedData/cppCourse.js";

// BM25 free parameters — standard defaults.
const K1 = 1.5;
const B = 0.75;

const STOPWORDS = new Set(
  ("a an the and or but if then else of to in on at for with by from as is are was were be been " +
    "this that these those it its you your we our they their i me my how what when where which who " +
    "can will would should could do does did done have has had not no yes so such than too very " +
    "about into over under again further more most other some any each few".split(" "))
);

/** Light suffix stripping — enough to unify plurals/gerunds without a full stemmer. */
const stem = (w) => {
  if (w.length <= 3) return w;
  for (const suffix of ["ing", "edly", "ies", "es", "ed", "ly", "s"]) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      return w.slice(0, -suffix.length);
    }
  }
  return w;
};

const tokenize = (text) =>
  String(text ?? "")
    .toLowerCase()
    // Keep _ : # + . inside tokens so identifiers survive (std::vector, __init__, c++).
    .split(/[^a-z0-9_:#+.]+/)
    .filter((t) => t.length > 1 && t.length < 40 && !STOPWORDS.has(t))
    .map(stem);

const stripHtml = (html) =>
  String(html ?? "")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

class RetrievalService {
  constructor() {
    this.documents = [];
    this.invertedIndex = new Map(); // term -> Map<docId, termFreq>
    this.docFreq = new Map(); // term -> number of docs containing it
    this.avgDocLength = 0;
    this.built = false;
  }

  /** Build (or rebuild) the index from the seeded curriculum. */
  build({ force = false } = {}) {
    if (this.built && !force) return this;

    this.documents = [];
    this.invertedIndex = new Map();
    this.docFreq = new Map();

    for (const [tutorials, language] of [
      [pythonTutorials, "python"],
      [javascriptTutorials, "javascript"],
      [cppTutorials, "cpp"],
    ]) {
      for (const tut of tutorials ?? []) {
        this.#addDocument({
          id: `tutorial:${language}:${tut.order ?? this.documents.length}:${tut.title}`,
          source: "tutorial",
          language: tut.language ?? language,
          title: tut.title,
          concept: tut.concept ?? tut.title,
          module: tut.module ?? null,
          difficulty: tut.difficulty ?? "beginner",
          text: [tut.description, tut.content].filter(Boolean).join("\n\n"),
          codeExamples: tut.codeExamples ?? [],
        });
      }
    }

    for (const [course, language] of [
      [pythonCourse, "python"],
      [javascriptCourse, "javascript"],
      [cppCourse, "cpp"],
    ]) {
      for (const section of course?.sections ?? []) {
        for (const lesson of section.lessons ?? []) {
          this.#addDocument({
            id: `lesson:${language}:${section.order}.${lesson.order}:${lesson.title}`,
            source: "lesson",
            language: course.language ?? language,
            title: lesson.title,
            concept: lesson.title,
            module: section.title,
            difficulty: lesson.difficulty ?? course.difficulty ?? "beginner",
            text: [lesson.description, stripHtml(lesson.content)].filter(Boolean).join("\n\n"),
            codeExamples: lesson.codeExamples ?? [],
          });
        }
      }
    }

    const totalLength = this.documents.reduce((sum, d) => sum + d.length, 0);
    this.avgDocLength = this.documents.length ? totalLength / this.documents.length : 0;
    this.built = true;
    return this;
  }

  #addDocument(doc) {
    // Title and concept carry more signal than body prose, so weight them by
    // repetition — the standard trick for field-weighted BM25 without
    // maintaining separate per-field indexes.
    const tokens = [
      ...tokenize(doc.title),
      ...tokenize(doc.title),
      ...tokenize(doc.title),
      ...tokenize(doc.concept),
      ...tokenize(doc.concept),
      ...tokenize(doc.text),
    ];

    const docId = this.documents.length;
    const termFreq = new Map();
    for (const term of tokens) {
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    }

    for (const [term, freq] of termFreq) {
      if (!this.invertedIndex.has(term)) this.invertedIndex.set(term, new Map());
      this.invertedIndex.get(term).set(docId, freq);
      this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
    }

    this.documents.push({ ...doc, docId, length: tokens.length });
  }

  #score(queryTerms, docId) {
    const doc = this.documents[docId];
    const N = this.documents.length;
    let score = 0;

    for (const term of queryTerms) {
      const postings = this.invertedIndex.get(term);
      if (!postings?.has(docId)) continue;

      const f = postings.get(docId);
      const n = this.docFreq.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const norm = f + K1 * (1 - B + (B * doc.length) / (this.avgDocLength || 1));
      score += idf * ((f * (K1 + 1)) / norm);
    }
    return score;
  }

  /**
   * Retrieve grounding passages for a query.
   *
   * @param {string}  query
   * @param {object} [opts]
   * @param {string} [opts.language]   restrict to one language
   * @param {string} [opts.difficulty] soft-boost matching difficulty
   * @param {number} [opts.topK]
   * @param {number} [opts.minScore]   drop weak matches rather than pad the context
   * @returns {Array<{title, concept, module, language, difficulty, source, excerpt, codeExamples, score}>}
   */
  retrieve(query, { language = null, difficulty = null, topK = 4, minScore = 1.0 } = {}) {
    this.build();

    const queryTerms = tokenize(query);
    if (queryTerms.length === 0) return [];

    const candidates = language
      ? this.documents.filter((d) => d.language === language)
      : this.documents;

    const scored = candidates
      .map((doc) => {
        let score = this.#score(queryTerms, doc.docId);
        // Mild preference for the learner's level; never excludes on its own.
        if (difficulty && doc.difficulty === difficulty) score *= 1.15;
        return { doc, score };
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      concept: doc.concept,
      module: doc.module,
      language: doc.language,
      difficulty: doc.difficulty,
      source: doc.source,
      excerpt: this.#excerpt(doc.text, queryTerms),
      codeExamples: doc.codeExamples.slice(0, 2),
      score: Number(score.toFixed(3)),
    }));
  }

  /** Pull the densest window of the document for the query terms. */
  #excerpt(text, queryTerms, windowSize = 900) {
    if (text.length <= windowSize) return text;

    const lower = text.toLowerCase();
    const termSet = new Set(queryTerms);
    let bestStart = 0;
    let bestHits = -1;

    // Coarse stride keeps this cheap; we only need a good window, not the best.
    const stride = 150;
    for (let start = 0; start < text.length - windowSize; start += stride) {
      const window = lower.slice(start, start + windowSize);
      let hits = 0;
      for (const term of termSet) {
        if (window.includes(term)) hits += 1;
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestStart = start;
      }
    }

    const prefix = bestStart > 0 ? "…" : "";
    const suffix = bestStart + windowSize < text.length ? "…" : "";
    return prefix + text.slice(bestStart, bestStart + windowSize).trim() + suffix;
  }

  /** Render retrieved passages as a prompt context block with citation tags. */
  formatAsContext(passages) {
    if (!passages.length) return "";
    return passages
      .map(
        (p, i) =>
          `[SOURCE ${i + 1} | ${p.source}: "${p.title}" | ${p.language} | ${p.difficulty}]\n${p.excerpt}`
      )
      .join("\n\n---\n\n");
  }

  stats() {
    this.build();
    return {
      documents: this.documents.length,
      uniqueTerms: this.invertedIndex.size,
      avgDocLength: Number(this.avgDocLength.toFixed(1)),
      byLanguage: this.documents.reduce((acc, d) => {
        acc[d.language] = (acc[d.language] ?? 0) + 1;
        return acc;
      }, {}),
      bySource: this.documents.reduce((acc, d) => {
        acc[d.source] = (acc[d.source] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }
}

const retrievalService = new RetrievalService();
export { RetrievalService, tokenize };
export default retrievalService;
