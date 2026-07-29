const { THEME_GUIDES, CONTENT_SCHEMAS, BLOCK_STYLES_SCHEMA } = require("./shared");

module.exports = {
  op: "blockRegenerate",
  version: 2,
  config: { temperature: 0.7, maxOutputTokens: 2048 },
  quotaWeight: 0.5,
  limits: {},

  normalize(parsed) {
    if (Array.isArray(parsed)) return parsed[0];
    return parsed;
  },

  build(input, context) {
    const { blockType, prompt: userPrompt, theme = "light" } = input;
    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;
    const schemaLine = CONTENT_SCHEMAS.split("\n").find((l) => l.startsWith(blockType)) || `${blockType} → content: {}`;
    const extraContext = userPrompt ? `\nUser request: "${userPrompt}"` : "";

    return {
      system: "You are a senior web designer regenerating one website section as JSON. You respond with pure JSON only — no markdown, no commentary.",
      user: `${context ? context + "\n" : ""}Regenerate ONE "${blockType}" block.${extraContext}
Visual theme: ${theme.toUpperCase()}

Schema: ${schemaLine}
${BLOCK_STYLES_SCHEMA}

THEME GUIDE:
${themeGuide}

Return ONLY a single JSON object (NOT an array):
{"id":"block-1","type":"${blockType}","content":{...},"styles":{...}}

Make ALL content specific to the business. No placeholder text.`,
    };
  },
};
