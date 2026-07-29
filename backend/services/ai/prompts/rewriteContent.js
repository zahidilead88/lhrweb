module.exports = {
  op: "rewriteContent",
  version: 1,
  config: { temperature: 0.8, maxOutputTokens: 1024 },
  quotaWeight: 0.2,
  limits: {},

  normalize(parsed) {
    if (Array.isArray(parsed)) return { variants: parsed };
    return parsed;
  },

  build(input, context) {
    const { text, tag = "p", tone = "professional" } = input;

    return {
      system: "You are a senior copywriter for websites. You respond with pure JSON only.",
      user: `${context ? context + "\n\n" : ""}Rewrite this website text (a <${tag}> element).

Target tone: ${tone}

Current text:
"${text}"

Rules:
- Give 3 DISTINCT options — different angles, not paraphrases of each other.
- Keep roughly the same length as the original (±30%).
- Specific to this business — no generic filler, no lorem ipsum.
- Same language as the original text.

Return ONLY: { "variants": ["option 1", "option 2", "option 3"] }`,
    };
  },
};
