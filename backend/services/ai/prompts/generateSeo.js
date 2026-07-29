module.exports = {
  op: "generateSeo",
  version: 1,
  config: { temperature: 0.4, maxOutputTokens: 512 },
  quotaWeight: 0.2,
  limits: {},

  build(input, context) {
    const { pageName, headings = [], textSample = "" } = input;

    return {
      system: "You are an SEO specialist. You respond with pure JSON only.",
      user: `${context ? context + "\n\n" : ""}Write SEO metadata for the "${pageName}" page.

Page headings: ${headings.slice(0, 10).join(" | ") || "(none)"}
Page text sample: ${textSample.slice(0, 600)}

Rules:
- title: 50-60 characters, includes the business or page focus, no clickbait.
- description: 150-160 characters, active voice, one clear value proposition.
- keywords: 5-10 short phrases.

Return ONLY: { "title": "...", "description": "...", "keywords": ["..."] }`,
    };
  },
};
