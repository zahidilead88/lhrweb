const { THEME_GUIDES, CONTENT_SCHEMAS, BLOCK_STYLES_SCHEMA } = require("./shared");

module.exports = {
  op: "siteGenerate",
  version: 2,
  config: { temperature: 0.7, maxOutputTokens: 8192, timeoutMs: 120000 },
  quotaWeight: 1,
  limits: {},

  build(input, context) {
    const { prompt, theme = "light", pkg = "starter", blockTypes, pageLimit } = input;
    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;
    const pagesInstruction = pkg === "starter"
      ? "Generate exactly 2 pages: Home (3-4 blocks) and Contact (1-2 blocks)."
      : `Generate 3-5 pages. Include Home, About, Services, and Contact. Stay under ${pageLimit} pages total.`;

    return {
      system: "You are a senior web designer generating a complete website as JSON for a website builder. You respond with pure JSON only — no markdown, no commentary.",
      user: `Generate a complete website for this business:

"${prompt}"

Package: ${pkg.toUpperCase()}
Available block types: ${blockTypes.join(", ")}
Visual theme: ${theme.toUpperCase()}

${pagesInstruction}

Return this exact JSON structure (no markdown, pure JSON):
{
  "businessName": "string",
  "tagline": "short punchy tagline",
  "primaryColor": "#hex",
  "pages": [
    { "id": "page-1", "name": "Home", "slug": "home",
      "blocks": [ { "id": "block-1", "type": "hero", "content": {}, "styles": {} } ] }
  ]
}

── CONTENT SCHEMAS ──────────────────────────────────────────────────────────
${CONTENT_SCHEMAS}

── STYLES SCHEMA (apply to every block) ─────────────────────────────────────
${BLOCK_STYLES_SCHEMA}

── THEME GUIDE ───────────────────────────────────────────────────────────────
${themeGuide}
${context ? `\n── CONTEXT ──\n${context}\n` : ""}
Make ALL content specific to the business. Zero placeholder text.
Choose primaryColor to match the business personality.`,
    };
  },
};
