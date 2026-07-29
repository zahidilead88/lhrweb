const { ELEMENT_HARD_RULES } = require("./shared");

module.exports = {
  op: "elementEdit",
  version: 2,
  config: { temperature: 0.6, maxOutputTokens: 8192 },
  quotaWeight: 1,
  limits: { maxNodes: 300, maxDepth: 8 },

  build(input, context) {
    const { element, prompt } = input;
    const instruction = prompt?.trim()
      ? `User instruction: "${prompt}"`
      : "Improve this element with better content, styles, and layout.";

    return {
      system: "You are a senior web designer editing one element subtree of a website as JSON. You respond with pure JSON only.",
      user: `${context ? context + "\n\n" : ""}${instruction}

Modify this existing ElementNode and return an improved version.

ID CONTRACT (critical):
- Keep the same top-level "id" and "tag".
- Keep the id of every element you preserve.
- Generate new ids only for elements you add. Omit elements you remove.

${ELEMENT_HARD_RULES}

CURRENT ELEMENT:
${JSON.stringify(element, null, 2)}

Return ONLY the modified ElementNode as a JSON object. Same schema — id, tag, content?, attrs?, className?, styles{desktop, tablet?, mobile?}, children[].`,
    };
  },
};
