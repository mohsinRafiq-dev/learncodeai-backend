// Lightweight Jaccard similarity over normalized code tokens.
// Good enough to surface obvious copy-paste in quiz submissions.

function normalize(code = "") {
  return String(code)
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    .replace(/"[^"]*"/g, '""')
    .replace(/'[^']*'/g, "''")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

export function tokenize(code = "") {
  const normalized = normalize(code);
  const tokens = normalized.match(/[a-z_]\w*|[+\-*/%=<>!&|^~]+|[(){}[\];,.]/g) || [];
  return new Set(tokens);
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Compare a candidate against a list of prior submissions.
// Returns the highest similarity and the matching submission id.
export function findHighestSimilarity(candidateCode, priorSubmissions = []) {
  const candTokens = tokenize(candidateCode);
  let best = { score: 0, submissionId: null, userId: null };
  for (const s of priorSubmissions) {
    const score = jaccard(candTokens, tokenize(s.code || ""));
    if (score > best.score) {
      best = { score, submissionId: s._id, userId: s.user };
    }
  }
  best.flagged = best.score >= 0.85;
  return best;
}
