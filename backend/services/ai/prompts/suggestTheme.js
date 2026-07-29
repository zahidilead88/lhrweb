module.exports = {
  op: "suggestTheme",
  version: 1,
  config: { temperature: 0.6, maxOutputTokens: 1024 },
  quotaWeight: 0.2,
  limits: {},

  build(input, context) {
    const { prompt } = input;

    return {
      system: "You are a brand designer producing design token JSON. You respond with pure JSON only.",
      user: `${context ? context + "\n\n" : ""}Suggest a cohesive visual theme for this request:
"${prompt}"

Return ONLY this JSON shape:
{
  "primaryColor": "#hex",
  "tokens": {
    "colors": [
      { "name": "primary", "value": "#hex" },
      { "name": "secondary", "value": "#hex" },
      { "name": "accent", "value": "#hex" },
      { "name": "background", "value": "#hex" },
      { "name": "surface", "value": "#hex" },
      { "name": "heading", "value": "#hex" },
      { "name": "body", "value": "#hex" }
    ],
    "fonts": [
      { "name": "heading", "family": "Font Name, fallback" },
      { "name": "body", "family": "Font Name, fallback" }
    ]
  }
}

Rules:
- All colors must pass WCAG AA contrast in their intended pairings (heading/body on background/surface).
- Fonts must be widely available Google Fonts.
- The palette must fit the business personality — not a generic blue.`,
    };
  },
};
