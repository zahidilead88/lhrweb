const { THEME_GUIDES, CONTENT_SCHEMAS, BLOCK_STYLES_SCHEMA } = require("./shared");

// Ch 5.1 Phase 2 — one call per page. Receives the plan for cross-page consistency.
// quotaWeight 0: the site-generation JOB reserves 1 unit at start (Ch 12), not per page.

module.exports = {
  op: "sitePage",
  version: 1,
  config: { temperature: 0.7, maxOutputTokens: 8192 },
  quotaWeight: 0,
  limits: {},

  normalize(parsed) {
    if (Array.isArray(parsed)) return { blocks: parsed };
    return parsed;
  },

  build(input) {
    const { plan, page, theme = "light" } = input;
    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;
    const siblingPages = plan.pages.map((p) => p.name).join(", ");

    return {
      system: "You are a senior web designer generating one page of a website as JSON. You respond with pure JSON only — no markdown, no commentary.",
      user: `You are generating the "${page.name}" page of a website. Follow the site plan for consistency.

SITE PLAN:
- Business: "${plan.businessName}" — ${plan.tagline}
- About: ${plan.businessSummary}
- Primary color: ${plan.primaryColor}
- All pages: ${siblingPages}
- THIS page's sections, in order: ${page.sections.join(" → ")}

Visual theme: ${theme.toUpperCase()}

Return a JSON array with exactly ${page.sections.length} blocks — one per planned section, in the planned order. Each block must include both "content" AND "styles":

CONTENT SCHEMAS:
${CONTENT_SCHEMAS}

STYLES SCHEMA (required on every block):
${BLOCK_STYLES_SCHEMA}

THEME GUIDE:
${themeGuide}

Return ONLY a JSON array:
[{"id":"block-1","type":"${page.sections[0]}","content":{...},"styles":{...}},...]

All content must be specific to "${plan.businessName}". No placeholder text.
Use primary color ${plan.primaryColor} for accents and CTAs.`,
    };
  },
};
