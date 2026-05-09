// Lightweight content moderation. Not a replacement for a real service,
// but enough to auto-flag obvious cases for human review.

const PROFANITY = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt",
  "dick", "piss", "slut", "whore",
];

const HARASSMENT_PHRASES = [
  "kill yourself", "kys", "go die", "you should die",
];

const INJECTION_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /onerror\s*=/i,
];

export function moderateText(text = "") {
  const flags = [];
  const lc = String(text).toLowerCase();

  if (PROFANITY.some((w) => new RegExp(`\\b${w}\\b`).test(lc))) {
    flags.push("profanity");
  }
  if (HARASSMENT_PHRASES.some((p) => lc.includes(p))) {
    flags.push("harassment");
  }
  if (INJECTION_PATTERNS.some((r) => r.test(text))) {
    flags.push("injection");
  }

  return {
    clean: flags.length === 0,
    flags,
    severity: flags.includes("harassment") || flags.includes("injection") ? "high" : flags.length ? "low" : "none",
  };
}
