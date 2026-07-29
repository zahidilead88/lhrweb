// Ch 4 — builds the CONTEXT block for prompts. Compressed, never full trees.

const SIGNAL_STYLE_KEYS = [
  "fontSize", "fontWeight", "color", "backgroundColor", "padding", "margin",
  "display", "borderRadius", "gap", "maxWidth", "textAlign", "boxShadow",
];

// .hero-title { fontSize:56px; fontWeight:800; color:#111 } (+4 more props)
function summarizeClass(cls) {
  const desktop = cls?.styles?.desktop || {};
  const entries = Object.entries(desktop);
  const signal = entries
    .filter(([k]) => SIGNAL_STYLE_KEYS.includes(k))
    .slice(0, 3)
    .map(([k, v]) => `${k}:${v}`);
  const more = entries.length - signal.length;
  return `.${cls.name} { ${signal.join("; ")} }${more > 0 ? ` (+${more} more)` : ""}`;
}

function buildContext(project, { maxChars = 4000 } = {}) {
  if (!project) return "";
  const lines = [];

  if (project.businessName) {
    lines.push(`Business: "${project.businessName}"${project.tagline ? ` — ${project.tagline}` : ""}.`);
  }
  if (project.primaryColor) lines.push(`Primary brand color: ${project.primaryColor}.`);

  const colors = project.tokens?.colors || [];
  if (colors.length) {
    lines.push(`Design tokens: ${colors.slice(0, 12).map((c) => `${c.name}=${c.value}`).join(", ")}.`);
  }
  const fonts = project.tokens?.fonts || [];
  if (fonts.length) {
    lines.push(`Fonts: ${fonts.slice(0, 4).map((f) => `${f.name}=${f.family}`).join(", ")}.`);
  }

  const classes = project.classes || [];
  if (classes.length) {
    lines.push("Existing classes you may reuse (reference by className):");
    for (const cls of classes.slice(0, 15)) lines.push("  " + summarizeClass(cls));
  }

  const pages = project.pages || [];
  if (pages.length) {
    lines.push(`Site pages: ${pages.slice(0, 15).map((p) => p.name).join(", ")}.`);
  }

  // aiMemory (Ch 4.3) — distilled facts, if present
  const mem = project.aiMemory;
  if (mem) {
    if (mem.businessSummary) lines.push(`About the business: ${mem.businessSummary}`);
    if (mem.brandVoice)      lines.push(`Brand voice: ${mem.brandVoice}.`);
    if (mem.audience)        lines.push(`Audience: ${mem.audience}.`);
    if (Array.isArray(mem.preferences) && mem.preferences.length) {
      lines.push(`User preferences: ${mem.preferences.slice(0, 10).join("; ")}.`);
    }
  }

  let out = lines.join("\n");
  if (out.length > maxChars) out = out.slice(0, maxChars) + "\n[context truncated]";
  return out;
}

module.exports = { buildContext };
