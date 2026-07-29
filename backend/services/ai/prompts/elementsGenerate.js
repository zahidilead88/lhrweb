const { ELEMENT_HARD_RULES } = require("./shared");

module.exports = {
  op: "elementsGenerate",
  version: 2,
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  quotaWeight: 1,
  limits: { maxNodes: 300, maxDepth: 8 },

  // Model may return a bare array of elements — normalize to { elements, classes }
  normalize(parsed) {
    if (Array.isArray(parsed)) return { elements: parsed, classes: [] };
    if (parsed && !Array.isArray(parsed.classes)) parsed.classes = [];
    return parsed;
  },

  build(input, context) {
    const { prompt, primaryColor = "#6344d4" } = input;

    return {
      system: "You are a senior web designer outputting structured JSON for a visual website builder. You respond with pure JSON only.",
      user: `${context ? context + "\n\n" : ""}Return a JSON object with this EXACT structure:
{
  "elements": [...],
  "classes": [...]
}

ELEMENT NODE STRUCTURE (recursive):
{
  "id": "descriptive-unique-id",
  "tag": "section|div|h1|h2|h3|p|span|a|button|img|ul|ol|li|nav|header|footer",
  "content": "text here",
  "attrs": { "href": "#", "src": "...", "alt": "..." },
  "className": "optional-class-name",
  "styles": {
    "desktop": { "backgroundColor": "#hex", "color": "#hex", "padding": "80px 60px", "fontSize": "48px", "fontWeight": "700", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "24px", "maxWidth": "1200px", "margin": "0 auto", "borderRadius": "12px" },
    "mobile": { "padding": "40px 20px", "fontSize": "28px" }
  },
  "children": []
}

STYLE CLASS (reusable):
{ "name": "class-name", "styles": { "desktop": { ... }, "mobile": { ... } } }

${ELEMENT_HARD_RULES}

ADDITIONAL RULES:
9. Generate 2-4 top-level section elements (complete page sections).
10. Use primary color ${primaryColor} for CTAs and accents.
11. IDs format: "sec-hero", "h1-headline", "p-desc", "btn-cta", "card-1-title".
12. Mobile overrides: reduce fontSize and padding; other styles inherit from desktop.
13. Extract repeated styles into "classes"; reference with "className".
14. Always include a proper outer section wrapper with full-width background styling.
15. Maximum 60 elements total, maximum depth 8.

TASK: "${prompt}"`,
    };
  },
};
