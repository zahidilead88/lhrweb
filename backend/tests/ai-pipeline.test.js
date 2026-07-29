// Offline AI-engine test suite (Round 5) — no API key or database needed.
// Run:  cd backend && node tests/ai-pipeline.test.js

const path = require("path");
const base = path.join(__dirname, "..", "services", "ai");
const { starterTemplate, guessBusinessName } = require(path.join(base, "templates"));
const breaker = require(path.join(base, "breaker"));

const { validateOutput } = require(path.join(base, "validate"));
const { localFixes } = require(path.join(base, "repair"));
const { dedupeIds, checkIdContract, computeConfidence } = require(path.join(base, "postProcess"));
const { getPrompt } = require(path.join(base, "prompts"));
const { buildContext } = require(path.join(base, "contextBuilder"));

let pass = 0, fail = 0;
function t(name, cond) { if (cond) { pass++; console.log("  ✓", name); } else { fail++; console.log("  ✗ FAIL:", name); } }

// ── 1. Happy path: valid section output with markdown fences ──
const good = "```json\n" + JSON.stringify({
  elements: [{
    id: "sec-hero", tag: "section",
    styles: { desktop: { padding: "80px 60px", backgroundColor: "#0a0a0a" } },
    children: [
      { id: "h1-headline", tag: "h1", content: "Lahore's Finest Web Studio", styles: { desktop: { fontSize: "56px" } }, children: [] },
      { id: "btn-cta", tag: "button", content: "Get a Quote", styles: { desktop: {} }, children: [] },
    ],
  }],
  classes: [{ name: "hero-title", styles: { desktop: { fontSize: "56px" } } }],
}) + "\n```";
const v1 = validateOutput("elementsGenerate", good, {});
t("valid section passes (fences stripped)", v1.ok);
t("no warnings on clean output", v1.ok && v1.warnings.length === 0);

// ── 2. Zod rejects bad tag ──
const badTag = JSON.stringify({ elements: [{ id: "x", tag: "script", styles: { desktop: {} }, children: [] }], classes: [] });
const v2 = validateOutput("elementsGenerate", badTag, {});
t("script tag rejected at zod stage", !v2.ok && v2.stage === "zod");

// ── 3. Sanitizer strips dangerous attrs / styles ──
const dirty = JSON.stringify({
  elements: [{
    id: "a1", tag: "a", content: "click",
    attrs: { href: "javascript:alert(1)", onclick: "evil()", target: "_blank" },
    styles: { desktop: { color: "#fff", backgroundImage: "url(javascript:x)", behavior: "expression(evil)" } },
    children: [],
  }],
  classes: [],
});
const v3 = validateOutput("elementsGenerate", dirty, {});
t("dirty output still passes (stripped, not rejected)", v3.ok);
const el3 = v3.ok && v3.data.elements[0];
t("javascript: href stripped", el3 && !el3.attrs.href);
t("onclick attr stripped", el3 && !("onclick" in el3.attrs));
t("safe attr kept", el3 && el3.attrs.target === "_blank");
t("expression() style stripped", el3 && !("behavior" in el3.styles.desktop));
t("js url() style stripped", el3 && !("backgroundImage" in el3.styles.desktop));

// ── 4. content XOR children auto-fix ──
const both = JSON.stringify({
  elements: [{ id: "d1", tag: "div", content: "text", styles: { desktop: {} },
    children: [{ id: "c1", tag: "p", content: "child", styles: { desktop: {} }, children: [] }] }],
  classes: [],
});
const v4 = validateOutput("elementsGenerate", both, {});
t("content+children auto-fixed", v4.ok && !v4.data.elements[0].content);

// ── 5. Depth cap ──
let deep = { id: "l0", tag: "div", styles: { desktop: {} }, children: [] };
let cur = deep;
for (let i = 1; i <= 10; i++) { const n = { id: `l${i}`, tag: "div", styles: { desktop: {} }, children: [] }; cur.children = [n]; cur = n; }
const v5 = validateOutput("elementsGenerate", JSON.stringify({ elements: [deep], classes: [] }), { maxDepth: 8 });
t("depth > 8 rejected at structural stage", !v5.ok && v5.stage === "structural");

// ── 6. Semantic lint warnings ──
const lorem = JSON.stringify({
  elements: [{ id: "s1", tag: "section", styles: { desktop: {} }, children: [
    { id: "p1", tag: "p", content: "Lorem ipsum dolor sit amet", styles: { desktop: {} }, children: [] },
    { id: "i1", tag: "img", attrs: { src: "https://placehold.co/600x400" }, styles: { desktop: {} }, children: [] },
  ] }],
  classes: [],
});
const v6 = validateOutput("elementsGenerate", lorem, {});
t("lorem ipsum flagged", v6.ok && v6.warnings.some((w) => w.includes("placeholder-text")));
t("missing alt flagged", v6.ok && v6.warnings.some((w) => w.includes("missing-alt")));

// ── 7. Local repair: trailing comma + unbalanced brackets ──
const broken = '{"elements": [{"id":"a","tag":"div","styles":{"desktop":{}},"children":[],}], "classes": []';
const fixes = localFixes(broken);
const repairedOk = fixes.some((f) => validateOutput("elementsGenerate", f, {}).ok);
t("local repair fixes trailing comma + missing brace", repairedOk);

// ── 8. ID dedup vs existing page ids ──
const els = [{ id: "sec-hero", tag: "section", styles: { desktop: {} }, children: [] }];
const regen = dedupeIds(els, ["sec-hero"]);
t("id colliding with page regenerated", regen === 1 && els[0].id !== "sec-hero");

// ── 9. ID contract (AI-R5) ──
const input = { id: "root", tag: "section", styles: { desktop: {} }, children: [
  { id: "a", tag: "p", styles: { desktop: {} }, children: [] },
  { id: "b", tag: "p", styles: { desktop: {} }, children: [] },
  { id: "c", tag: "p", styles: { desktop: {} }, children: [] },
] };
const rogue = { id: "root", tag: "section", styles: { desktop: {} }, children: [
  { id: "x", tag: "p", styles: { desktop: {} }, children: [] },
  { id: "y", tag: "p", styles: { desktop: {} }, children: [] },
  { id: "z", tag: "p", styles: { desktop: {} }, children: [] },
] };
t("rogue rewrite caught", !checkIdContract(input, rogue).ok);
const kept = JSON.parse(JSON.stringify(input));
t("preserving edit passes", checkIdContract(input, kept).ok);
const rootChanged = { ...kept, id: "different" };
t("root id change caught", !checkIdContract(input, rootChanged).ok);

// ── 10. Confidence (Ch 9.1) ──
t("clean = 100", computeConfidence({ repaired: null, warnings: [] }) === 100);
t("model-repair = 75", computeConfidence({ repaired: "model", warnings: [] }) === 75);
t("warnings capped at -30", computeConfidence({ repaired: null, warnings: ["a","b","c","d","e"] }) === 70);
t("truncation -15", computeConfidence({ repaired: null, warnings: [], finishReason: "MAX_TOKENS" }) === 85);

// ── 11. Normalize: bare array → { elements } / { blocks } / { variants } ──
const bare = JSON.stringify([{ id: "s", tag: "section", styles: { desktop: {} }, children: [] }]);
const v11 = validateOutput("elementsGenerate", bare, { normalize: getPrompt("elementsGenerate").normalize });
t("bare element array normalized", v11.ok && Array.isArray(v11.data.elements));
const bareBlocks = JSON.stringify([{ type: "hero", content: { headline: "Hi" }, styles: {} }]);
const v11b = validateOutput("pageGenerate", bareBlocks, { normalize: getPrompt("pageGenerate").normalize });
t("bare block array normalized", v11b.ok && v11b.data.blocks.length === 1);

// ── 12. Other op schemas ──
const v12a = validateOutput("animateElement", JSON.stringify({ preset: "fadeInUp", whileInView: { opacity: 1, y: 0 }, initial: { opacity: 0, y: 40 }, transition: { duration: 0.6, ease: "ease-out" }, evil: "x" }), {});
t("animation config passes + unknown key stripped", v12a.ok && !("evil" in v12a.data));
const v12b = validateOutput("rewriteContent", JSON.stringify({ variants: ["One", "Two", "Three"] }), {});
t("rewrite variants pass", v12b.ok);
const v12c = validateOutput("generateSeo", JSON.stringify({ title: "Lahore Web Studio — Custom Websites", description: "We build fast, beautiful websites for Lahore businesses. Custom design, SEO, and support from a local team you can actually talk to.", keywords: ["web design lahore"] }), {});
t("seo output passes", v12c.ok);
const v12d = validateOutput("suggestTheme", JSON.stringify({ primaryColor: "#E84393", tokens: { colors: [{ name: "primary", value: "#E84393" }] } }), {});
t("theme output passes", v12d.ok);
const site = { businessName: "Biz", tagline: "t", primaryColor: "#123456", pages: [{ id: "p1", name: "Home", slug: "home", blocks: [{ id: "b1", type: "hero", content: { headline: "Hello" }, styles: { sectionBg: "#fff" } }] }] };
const v12e = validateOutput("siteGenerate", JSON.stringify(site), {});
t("site output passes", v12e.ok);

// ── 13. Context builder ──
const ctx = buildContext({
  businessName: "WebSouls", tagline: "Hosting done right", primaryColor: "#6344d4",
  tokens: { colors: [{ name: "primary", value: "#6344d4" }] },
  classes: [{ name: "hero-title", styles: { desktop: { fontSize: "56px", fontWeight: 800, color: "#111", letterSpacing: "-1px" } } }],
  pages: [{ name: "Home" }, { name: "Contact" }],
  aiMemory: { businessSummary: "A hosting company.", preferences: ["no emojis"] },
});
t("context includes business", ctx.includes("WebSouls"));
t("context has class summary with +more", ctx.includes(".hero-title") && ctx.includes("more"));
t("context includes memory", ctx.includes("no emojis"));

// ── 14. Prompt registry builds ──
for (const op of ["siteGenerate","pageGenerate","blockRegenerate","elementsGenerate","elementEdit","animateElement","rewriteContent","generateSeo","suggestTheme"]) {
  const p = getPrompt(op);
  const built = p.build({
    prompt: "test", theme: "dark", pkg: "pro", blockTypes: ["hero"], pageLimit: 15,
    blockType: "hero", element: { id: "e1", tag: "div", styles: { desktop: {} }, children: [] },
    description: "fade in", text: "hello", pageName: "Home", primaryColor: "#000",
  }, "CTX");
  t(`prompt ${op} builds (v${p.version}, w=${p.quotaWeight})`, typeof built.system === "string" && typeof built.user === "string" && built.user.length > 20);
}


// ── Tranche 2 — jobs, templates, breaker ──
{


// sitePlan schema
const plan = { businessName: "Zahid's Bakery", tagline: "Fresh daily", primaryColor: "#D4A017", businessSummary: "A bakery in Gulberg.", pages: [ { name: "Home", slug: "home", sections: ["hero", "services", "cta"] }, { name: "Contact", slug: "contact", sections: ["contact"] } ] };
const v1 = validateOutput("sitePlan", JSON.stringify(plan), {});
t("sitePlan passes", v1.ok);
const badPlan = { ...plan, pages: [{ name: "Home", sections: ["hero", "not-a-type"] }] };
t("sitePlan rejects unknown section type", !validateOutput("sitePlan", JSON.stringify(badPlan), {}).ok);

// sitePage prompt builds with plan context
const sp = getPrompt("sitePage");
const built = sp.build({ plan, page: plan.pages[0], theme: "dark" }, "");
t("sitePage prompt includes plan + section order", built.user.includes("Zahid's Bakery") && built.user.includes("hero → services → cta"));
t("sitePage bare-array normalize", validateOutput("sitePage", JSON.stringify([{ type: "hero", content: {}, styles: {} }]), { normalize: sp.normalize }).ok);
t("sitePlan quotaWeight 0 (job reserves)", getPrompt("sitePlan").quotaWeight === 0 && sp.quotaWeight === 0);

// templates
const tpl = starterTemplate({ businessName: "Test Biz", primaryColor: "#123456", theme: "dark" });
t("template has 2 pages + blocks", tpl.pages.length === 2 && tpl.pages[0].blocks.length === 3);
t("template substitutes name", tpl.pages[0].blocks[0].content.headline === "Test Biz");
t("template validates against siteGenerate schema", validateOutput("siteGenerate", JSON.stringify(tpl), {}).ok);
t("guessBusinessName from prompt", guessBusinessName("Zahid's Bakery — fresh bread in Lahore") === "Zahid's Bakery");
t("guessBusinessName fallback", guessBusinessName("") === "My Website");

// breaker
t("breaker starts closed", breaker.state() === "closed" && !breaker.isOpen());
for (let i = 0; i < 10; i++) breaker.record(false);
t("breaker opens after failures", breaker.state() === "open");
t("breaker rejects when open", breaker.isOpen() === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

}
