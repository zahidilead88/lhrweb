module.exports = {
  op: "animateElement",
  version: 2,
  config: { temperature: 0.2, maxOutputTokens: 512 },
  quotaWeight: 0.2,
  limits: {},

  build(input, context) {
    const { description } = input;

    return {
      system: "You generate animation configuration JSON for web elements. You respond with pure JSON only.",
      user: `Generate an AnimationConfig JSON object for a web element described as:
"${description}"

${context ? `Business context: ${context}\n` : ""}
Return ONLY a valid JSON object matching this TypeScript interface:
{
  "preset"?: "fadeIn"|"fadeInUp"|"fadeInDown"|"fadeInLeft"|"fadeInRight"|"zoomIn"|"zoomOut"|"slideUp",
  "initial"?: { "opacity"?: 0-1, "x"?: number, "y"?: number, "scale"?: number, "rotate"?: number },
  "animate"?: { same fields — target state for page-load animation },
  "whileInView"?: { same fields — use instead of animate for scroll-triggered },
  "viewport"?: { "once": true|false, "amount": 0.05-0.5 },
  "whileHover"?: { "scale"?: number, "opacity"?: number },
  "whileTap"?: { "scale"?: number },
  "transition"?: { "duration": 0.1-2.0, "delay": 0-1.5, "ease": "ease"|"ease-in"|"ease-out"|"ease-in-out"|"linear" }
}

Rules:
- Use whileInView (not animate) for scroll-triggered or "on scroll" animations
- Use animate for page-load entry animations
- Never set both animate AND whileInView at the same time
- Keep values sensible (scale 0.8-1.2, opacity 0-1, x/y -80 to 80)
- Always include a transition object
- Return ONLY the raw JSON, no markdown or explanation`,
    };
  },
};
