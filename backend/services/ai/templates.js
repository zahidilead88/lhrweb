const crypto = require("crypto");

// Ch 10.2 — static template fallback used when the AI provider is down.
// Same block format the generator produces; business name/color substituted locally, zero AI.

function uid() { return `block-${crypto.randomUUID().slice(0, 8)}`; }

function starterTemplate({ businessName, primaryColor = "#6344d4", theme = "light" }) {
  const dark = theme === "dark";
  const bg      = dark ? "#0a0a0a" : "#ffffff";
  const bgAlt   = dark ? "#111111" : "#f9fafb";
  const heading = dark ? "#ffffff" : "#111111";
  const body    = dark ? "rgba(255,255,255,0.65)" : "#6b7280";
  const cardBg  = dark ? "#1a1a1a" : "#ffffff";

  const base = { headingColor: heading, bodyColor: body, accentColor: primaryColor };

  return {
    businessName,
    tagline: `Welcome to ${businessName}`,
    primaryColor,
    pages: [
      {
        id: "page-1",
        name: "Home",
        slug: "home",
        blocks: [
          {
            id: uid(), type: "hero",
            content: {
              headline: `${businessName}`,
              subheadline: "We're putting the finishing touches on our website. Everything here is ready for you to edit — replace this text with your story.",
              ctaText: "Get in Touch", ctaLink: "#contact",
            },
            styles: { ...base, sectionBg: bg, paddingY: "xl", headingSize: "xl", buttonRadius: "full", buttonVariant: "filled" },
          },
          {
            id: uid(), type: "services",
            content: {
              title: "What We Do",
              subtitle: "Three things we're great at",
              items: [
                { title: "Service One",   description: "Describe your first core service here — what it is and why customers choose it." },
                { title: "Service Two",   description: "Describe your second service. Keep it short, specific, and benefit-focused." },
                { title: "Service Three", description: "Describe your third service. What outcome does the customer get?" },
              ],
            },
            styles: { ...base, sectionBg: bgAlt, cardBg, paddingY: "lg", headingSize: "lg" },
          },
          {
            id: uid(), type: "cta",
            content: { headline: "Ready to start?", subtext: `Tell us what you need and ${businessName} will get back to you within a day.`, buttonText: "Contact Us", buttonLink: "#contact" },
            styles: { ...base, sectionBg: primaryColor, headingColor: "#ffffff", bodyColor: "rgba(255,255,255,0.85)", buttonVariant: "outline", paddingY: "lg", headingSize: "lg" },
          },
        ],
      },
      {
        id: "page-2",
        name: "Contact",
        slug: "contact",
        blocks: [
          {
            id: uid(), type: "contact",
            content: { title: "Get in Touch", subtitle: "We usually reply within one business day.", email: "hello@example.com", phone: "+92 300 0000000", address: "Lahore, Pakistan" },
            styles: { ...base, sectionBg: bg, paddingY: "xl", headingSize: "lg" },
          },
        ],
      },
    ],
  };
}

// crude business-name guess from a free-text prompt ("Zahid's Bakery — fresh bread…" → "Zahid's Bakery")
function guessBusinessName(prompt) {
  const first = String(prompt || "").split(/[—\-.,\n]/)[0].trim();
  if (first && first.length >= 2 && first.length <= 60) return first;
  return "My Website";
}

module.exports = { starterTemplate, guessBusinessName };
