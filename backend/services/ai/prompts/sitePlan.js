// Ch 5.1 Phase 1 — the site plan. One small call; the blueprint every page call receives.
// quotaWeight 0: the site-generation JOB reserves 1 unit at start (Ch 12), not per call.

module.exports = {
  op: "sitePlan",
  version: 1,
  config: { temperature: 0.5, maxOutputTokens: 1024 },
  quotaWeight: 0,
  limits: {},

  build(input) {
    const { prompt, theme = "light", pkg = "starter", blockTypes, pageLimit } = input;
    const pagesInstruction = pkg === "starter"
      ? "Plan exactly 2 pages: Home (3-4 sections) and Contact (1-2 sections)."
      : `Plan 3-5 pages. Include Home, About, Services, and Contact. Stay under ${pageLimit} pages total.`;

    return {
      system: "You are a senior web strategist planning a website. You respond with pure JSON only — no markdown, no commentary.",
      user: `Plan a website for this business:

"${prompt}"

Visual theme: ${theme.toUpperCase()}
Available section types: ${blockTypes.join(", ")}
${pagesInstruction}

Return ONLY this JSON shape:
{
  "businessName": "string",
  "tagline": "short punchy tagline",
  "primaryColor": "#hex",
  "businessSummary": "2-3 sentences distilling what this business does, for whom, and its personality",
  "pages": [
    { "name": "Home", "slug": "home", "sections": ["hero", "services", "cta"] }
  ]
}

Rules:
- sections values must come from the available section types list only.
- Every page starts with a strong opening section (hero for Home).
- businessSummary is factual and specific — it will brief other AI calls about this business.
- Choose primaryColor to match the business personality.`,
    };
  },
};
