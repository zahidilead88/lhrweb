const { THEME_GUIDES, CONTENT_SCHEMAS, BLOCK_STYLES_SCHEMA } = require("./shared");

module.exports = {
  op: "pageGenerate",
  version: 2,
  config: { temperature: 0.7, maxOutputTokens: 8192 },
  quotaWeight: 1,
  limits: {},

  // Model may return a bare array or { blocks: [...] } — normalize to { blocks }
  normalize(parsed) {
    if (Array.isArray(parsed)) return { blocks: parsed };
    return parsed;
  },

  build(input, context) {
    const { prompt, theme = "light" } = input;
    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;

    return {
      system: "You are a senior web designer generating website sections as JSON for a website builder. You respond with pure JSON only — no markdown, no commentary.",
      user: `${context ? context + "\n\n" : ""}Generate website sections for this request:
"${prompt}"

Visual theme: ${theme.toUpperCase()}

Return a JSON array of 2-5 blocks. Each block must include both "content" AND "styles":

CONTENT SCHEMAS:
${CONTENT_SCHEMAS}

STYLES SCHEMA (required on every block):
${BLOCK_STYLES_SCHEMA}

THEME GUIDE:
${themeGuide}

Return ONLY a JSON array:
[{"id":"block-1","type":"...","content":{...},"styles":{...}},...]

All content must be specific and professional. No placeholder text.`,
    };
  },
};
