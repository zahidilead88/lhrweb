// Prompt registry — Ch 2.4. One module per operation, versioned.

const registry = {
  siteGenerate:     require("./siteGenerate"),
  sitePlan:         require("./sitePlan"),
  sitePage:         require("./sitePage"),
  pageGenerate:     require("./pageGenerate"),
  blockRegenerate:  require("./blockRegenerate"),
  elementsGenerate: require("./elementsGenerate"),
  elementEdit:      require("./elementEdit"),
  animateElement:   require("./animateElement"),
  rewriteContent:   require("./rewriteContent"),
  generateSeo:      require("./generateSeo"),
  suggestTheme:     require("./suggestTheme"),
};

function getPrompt(op) {
  const p = registry[op];
  if (!p) throw new Error(`Unknown AI operation: ${op}`);
  return p;
}

module.exports = { registry, getPrompt };
