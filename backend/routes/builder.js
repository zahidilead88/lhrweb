const express        = require("express");
const router         = express.Router();
const crypto         = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const BuilderProject = require("../models/BuilderProject");
const User           = require("../models/User");
const { auth }       = require("../middleware/auth");

function getGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

async function geminiJSON(prompt) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env");
  const model  = getGemini();
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  const text = result.response.text().trim();
  console.log("GEMINI RAW:", text.slice(0, 800));
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON parse error:", e.message, "\nCleaned text:", cleaned.slice(0, 400));
    throw e;
  }
}

const PAGE_LIMITS   = { starter: 5, pro: 15 };
const STARTER_TYPES = ["hero", "about", "services", "contact", "cta", "features"];
const PRO_TYPES     = [...STARTER_TYPES, "testimonials", "faq", "team", "gallery", "pricing"];

const THEME_GUIDES = {
  dark: `
DARK / AGENCY theme (like high-end design agencies):
- hero:         sectionBg:#0a0a0a, bgType:gradient, bgGradientFrom:#0a0a0a, bgGradientTo:#1a1a2e, bgGradientDir:to-br, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.65), paddingY:xl, headingSize:xl, buttonRadius:full
- about:        sectionBg:#111111, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.7)
- services:     sectionBg:#0d0d0d, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.6), cardBg:#1a1a1a
- features:     sectionBg:#111827, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.65), cardBg:#1f2937
- testimonials: sectionBg:#0a0a0a, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.7), cardBg:#161616
- faq:          sectionBg:#111111, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.65)
- team:         sectionBg:#0d0d0d, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.6), cardBg:#1a1a1a
- pricing:      sectionBg:#0a0a0a, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.65), cardBg:#161616
- cta:          bgType:gradient, bgGradientFrom:{primaryColor}, bgGradientTo:#000000, bgGradientDir:to-br, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.85), buttonVariant:filled
- contact:      sectionBg:#111111, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.65)
Keep accentColor = primaryColor throughout. Use bold typography (headingSize: xl on hero, lg on others).`,

  light: `
LIGHT / CLEAN theme (modern SaaS or service business):
- hero:         sectionBg:#ffffff, headingColor:#111111, bodyColor:#6b7280, paddingY:xl, headingSize:xl, buttonRadius:full
- about:        sectionBg:#f9fafb, headingColor:#111111, bodyColor:#4b5563
- services:     sectionBg:#ffffff, headingColor:#111111, bodyColor:#6b7280, cardBg:#f9fafb
- features:     sectionBg:#f9fafb, headingColor:#111111, bodyColor:#6b7280, cardBg:#ffffff
- testimonials: sectionBg:#f9fafb, headingColor:#111111, bodyColor:#374151, cardBg:#ffffff
- faq:          sectionBg:#ffffff, headingColor:#111111, bodyColor:#4b5563
- cta:          sectionBg:{primaryColor}, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.85), buttonVariant:filled
- contact:      sectionBg:#f9fafb, headingColor:#111111, bodyColor:#6b7280
Use accentColor = primaryColor. headingSize: lg on hero, md elsewhere.`,

  bold: `
BOLD / VIBRANT theme (creative studio, marketing agency, startup):
- hero:         bgType:gradient, bgGradientFrom:{primaryColor}, bgGradientTo:#000000, bgGradientDir:to-br, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.8), paddingY:xl, headingSize:xl, buttonRadius:full, buttonVariant:filled
- about:        sectionBg:#ffffff, headingColor:#111111, bodyColor:#374151
- services:     bgType:gradient, bgGradientFrom:#f8f4ff, bgGradientTo:#ffffff, bgGradientDir:to-b, headingColor:#111111, cardBg:#ffffff
- features:     sectionBg:#fafafa, headingColor:#111111, cardBg:#ffffff
- testimonials: sectionBg:{primaryColor}11, headingColor:#111111, cardBg:#ffffff
- cta:          bgType:gradient, bgGradientFrom:{primaryColor}, bgGradientTo:#7c3aed, bgGradientDir:to-r, headingColor:#ffffff, buttonVariant:filled
- contact:      sectionBg:#ffffff, headingColor:#111111
Use accentColor = primaryColor. Make it feel energetic and punchy.`,

  minimal: `
MINIMAL / EDITORIAL theme (portfolio, luxury, high-end services):
- hero:         sectionBg:#ffffff, headingColor:#000000, bodyColor:#666666, paddingY:xl, headingSize:xl, buttonRadius:md, buttonVariant:outline
- about:        sectionBg:#fafafa, headingColor:#000000, bodyColor:#555555
- services:     sectionBg:#ffffff, headingColor:#000000, bodyColor:#666666, cardBg:#fafafa
- features:     sectionBg:#f5f5f5, headingColor:#000000, bodyColor:#555555
- testimonials: sectionBg:#ffffff, headingColor:#000000, cardBg:#fafafa
- cta:          sectionBg:#000000, headingColor:#ffffff, bodyColor:rgba(255,255,255,0.75), buttonVariant:outline
- contact:      sectionBg:#fafafa, headingColor:#000000, bodyColor:#555555
Use minimal accentColor = primaryColor. Lots of whitespace, refined typography.`,
};

function uid() { return crypto.randomUUID(); }
function toSlug(name) { return (name || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
async function uniqueSlug(base, userId) {
  let slug = toSlug(base);
  let exists = await BuilderProject.findOne({ slug, userId }).select("_id").lean();
  let i = 1;
  while (exists) {
    slug = `${toSlug(base)}-${i}`;
    exists = await BuilderProject.findOne({ slug, userId }).select("_id").lean();
    i++;
  }
  return slug;
}

// ── GET /api/builder/projects (List all websites) ──────────────────────────────────
router.get("/projects", auth, async (req, res) => {
  try {
    const projects = await BuilderProject.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/init-manual (Create a blank site) ──────────────────────────
router.post("/init-manual", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "builder") return res.status(403).json({ message: "Forbidden" });

    const { businessName, tagline, primaryColor } = req.body;
    const maxPrompt = 500;
    if (businessName && businessName.length > maxPrompt) return res.status(400).json({ message: `Business name too long (max ${maxPrompt} chars)` });
    
    const bName = businessName || "My Website";
    const slug = await uniqueSlug(bName, req.user.userId);
    const project = await BuilderProject.create({
      userId:       req.user.userId,
      status:       "ready",
      businessName: bName,
      slug,
      tagline:      tagline      || "",
      primaryColor: primaryColor || "#000000",
      package:      user.package || "starter",
      pages:        [{ id: `page-${uid()}`, name: "Home", slug: "home", blocks: [] }],
      generatedAt:  new Date(),
      prompt:       null,
    });
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/project (Fetch a single site) ──────────────────────────────
router.get("/project", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const isAdmin = req.user.role === "admin";

    if (projectId) {
      // Admins can open any user's project; regular users only their own
      const query = isAdmin
        ? { _id: projectId }
        : { _id: projectId, userId: req.user.userId };
      const project = await BuilderProject.findOne(query).lean();
      return res.json(project || null);
    }

    // Fallback: fetch most recently modified project owned by this user
    const project = await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json(project || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/generate (Trigger AI site generation) ──────────────────────
router.post("/generate", auth, async (req, res) => {
  let project;
  try {
    const { prompt, theme = "light" } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: "Prompt is required" });
    const maxPrompt = 2000;
    if (prompt.length > maxPrompt) return res.status(400).json({ message: `Prompt too long (max ${maxPrompt} chars)` });

    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "builder") return res.status(403).json({ message: "Forbidden" });

    const pkg        = user.package || "starter";
    const pageLimit  = PAGE_LIMITS[pkg];
    const blockTypes = pkg === "starter" ? STARTER_TYPES : PRO_TYPES;

    // Create a new separate project in 'generating' status
    project = await BuilderProject.create({
      userId:       req.user.userId,
      status:       "generating",
      prompt,
      package:      pkg,
      pages:        [],
    });

    const pagesInstruction = pkg === "starter"
      ? "Generate exactly 2 pages: Home (3-4 blocks) and Contact (1-2 blocks)."
      : `Generate 3-5 pages. Include Home, About, Services, and Contact. Stay under ${pageLimit} pages total.`;

    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;

    let parsed;
    try {
      parsed = await geminiJSON(`Generate a complete website for this business:

"${prompt}"

Package: ${pkg.toUpperCase()}
Available block types: ${blockTypes.join(", ")}
Visual theme: ${theme.toUpperCase()}

${pagesInstruction}

Return this exact JSON structure (no markdown, pure JSON):
{
  "businessName": "string",
  "tagline": "short punchy tagline",
  "primaryColor": "#hex",
  "pages": [
    {
      "id": "page-1",
      "name": "Home",
      "slug": "home",
      "blocks": [
        {
          "id": "block-1",
          "type": "hero",
          "content": {},
          "styles": {}
        }
      ]
    }
  ]
}

── CONTENT SCHEMAS ──────────────────────────────────────────────────────────
hero        → content: { headline, subheadline, ctaText, ctaLink }
about       → content: { title, body, highlights: ["string"] }
services    → content: { title, subtitle, items: [{ title, description }] }
contact     → content: { title, subtitle, email, phone, address }
cta         → content: { headline, subtext, buttonText, buttonLink }
features    → content: { title, subtitle, items: [{ title, description }] }
testimonials→ content: { title, items: [{ name, role, company, quote }] }
faq         → content: { title, items: [{ question, answer }] }
team        → content: { title, subtitle, items: [{ name, role, bio }] }
pricing     → content: { title, subtitle, tiers: [{ name, price, period, features: [], popular: false }] }

── STYLES SCHEMA (apply to every block) ─────────────────────────────────────
styles: {
  "sectionBg": "#hex",          // section background color
  "bgType": "color|gradient",   // "color" or "gradient"
  "bgGradientFrom": "#hex",     // gradient start (if bgType=gradient)
  "bgGradientTo": "#hex",       // gradient end   (if bgType=gradient)
  "bgGradientDir": "to-b|to-br|to-r",
  "headingColor": "#hex",
  "bodyColor": "#hex",
  "accentColor": "#hex",
  "cardBg": "#hex",
  "paddingY": "md|lg|xl",
  "headingSize": "md|lg|xl",
  "buttonRadius": "md|lg|full",
  "buttonVariant": "filled|outline"
}

── THEME GUIDE ───────────────────────────────────────────────────────────────
${themeGuide}

Make ALL content specific to the business. Zero placeholder text.
Choose primaryColor to match the business personality.`);
    } catch (aiErr) {
      console.error("generate AI error:", aiErr?.message || aiErr);
      await BuilderProject.findByIdAndUpdate(project._id, { status: "empty" }).catch(() => {});
      return res.status(500).json({ message: "AI returned invalid content. Please try again." });
    }

    const slug = await uniqueSlug(parsed.businessName || "site", req.user.userId);
    const updatedProject = await BuilderProject.findByIdAndUpdate(
      project._id,
      {
        status:       "ready",
        businessName: parsed.businessName,
        slug,
        tagline:      parsed.tagline,
        primaryColor: parsed.primaryColor || "#000000",
        pages:        parsed.pages || [],
        generatedAt:  new Date(),
      },
      { new: true }
    );

    res.json(updatedProject);
  } catch (err) {
    console.error("Builder generate error:", err);
    if (project) {
      await BuilderProject.findByIdAndUpdate(project._id, { status: "empty" }).catch(() => {});
    }
    res.status(500).json({ message: "Generation failed. Please try again." });
  }
});

// ── POST /api/builder/generate-page (AI: generate sections for current page) ─────
router.post("/generate-page", auth, async (req, res) => {
  try {
    const { prompt, projectId, theme = "light" } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: "Prompt required" });

    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "builder")
      return res.status(403).json({ message: "Forbidden" });

    if (prompt.length > 2000) return res.status(400).json({ message: "Prompt too long (max 2000 chars)" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();

    const bizCtx = project
      ? `Business: "${project.businessName}". Tagline: "${project.tagline || ""}". Primary color: ${project.primaryColor || "#6344d4"}.`
      : "";

    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;

    let blocks;
    try {
      const result = await geminiJSON(`${bizCtx ? bizCtx + "\n\n" : ""}Generate website sections for this request:
"${prompt}"

Visual theme: ${theme.toUpperCase()}

Return a JSON array of 2-5 blocks. Each block must include both "content" AND "styles":

CONTENT SCHEMAS:
hero         → content: { headline, subheadline, ctaText, ctaLink }
services     → content: { title, subtitle, items:[{title,description}] }
features     → content: { title, subtitle, items:[{title,description}] }
testimonials → content: { title, items:[{name,role,company,quote}] }
faq          → content: { title, items:[{question,answer}] }
team         → content: { title, subtitle, items:[{name,role,bio}] }
pricing      → content: { title, subtitle, tiers:[{name,price,period,features:[],popular:false}] }
cta          → content: { headline, subtext, buttonText, buttonLink }
contact      → content: { title, subtitle, email, phone, address }

STYLES SCHEMA (required on every block):
styles: {
  "sectionBg": "#hex",
  "bgType": "color|gradient",
  "bgGradientFrom": "#hex",
  "bgGradientTo": "#hex",
  "bgGradientDir": "to-b|to-br|to-r",
  "headingColor": "#hex",
  "bodyColor": "#hex",
  "accentColor": "#hex",
  "cardBg": "#hex",
  "paddingY": "md|lg|xl",
  "headingSize": "md|lg|xl",
  "buttonRadius": "md|lg|full",
  "buttonVariant": "filled|outline"
}

THEME GUIDE:
${themeGuide}

Return ONLY a JSON array:
[{"id":"block-1","type":"...","content":{...},"styles":{...}},...]

All content must be specific and professional. No placeholder text.`);

      blocks = Array.isArray(result) ? result : result.blocks ?? [];
      if (!Array.isArray(blocks)) throw new Error("not array");
      blocks = blocks.map((b) => ({ ...b, id: `block-${uid()}` }));
    } catch (aiErr) {
      console.error("generate-page AI error:", aiErr?.message || aiErr);
      return res.status(500).json({ message: "AI returned invalid content. Please try again." });
    }

    res.json({ blocks });
  } catch (err) {
    console.error("generate-page error:", err);
    res.status(500).json({ message: "Generation failed. Please try again." });
  }
});

// ── POST /api/builder/regenerate-block (AI: regenerate a single block) ───────────
router.post("/regenerate-block", auth, async (req, res) => {
  try {
    const { projectId, blockType, prompt: userPrompt, theme = "light" } = req.body;
    if (!blockType) return res.status(400).json({ message: "blockType is required" });

    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });
    if (user.role !== "builder" && user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const isAdmin = user.role === "admin";

    const project = projectId
      ? await BuilderProject.findOne(isAdmin ? { _id: projectId } : { _id: projectId, userId: req.user.userId }).lean()
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();

    const bizCtx = project
      ? `Business: "${project.businessName}". Tagline: "${project.tagline || ""}".`
      : "";

    const themeGuide = THEME_GUIDES[theme] || THEME_GUIDES.light;

    const CONTENT_SCHEMAS = {
      hero:         "content: { headline, subheadline, ctaText, ctaLink }",
      about:        "content: { title, body, highlights: [\"string\"] }",
      services:     "content: { title, subtitle, items: [{ title, description }] }",
      contact:      "content: { title, subtitle, email, phone, address }",
      cta:          "content: { headline, subtext, buttonText, buttonLink }",
      features:     "content: { title, subtitle, items: [{ title, description }] }",
      testimonials: "content: { title, items: [{ name, role, company, quote }] }",
      faq:          "content: { title, items: [{ question, answer }] }",
      team:         "content: { title, subtitle, items: [{ name, role, bio }] }",
      pricing:      "content: { title, subtitle, tiers: [{ name, price, period, features: [], popular: false }] }",
    };

    const schema = CONTENT_SCHEMAS[blockType] || `content: {}`;
    const extraContext = userPrompt ? `\nUser request: "${userPrompt}"` : "";

    const result = await geminiJSON(`${bizCtx ? bizCtx + "\n" : ""}Regenerate ONE "${blockType}" block.${extraContext}
Visual theme: ${theme.toUpperCase()}

Schema: ${schema}
Styles schema: { sectionBg, bgType, headingColor, bodyColor, accentColor, cardBg, paddingY, headingSize, buttonRadius, buttonVariant }

THEME GUIDE:
${themeGuide}

Return ONLY a single JSON object (NOT an array):
{"id":"block-1","type":"${blockType}","content":{...},"styles":{...}}

Make ALL content specific to the business. No placeholder text.`);

    const block = Array.isArray(result) ? result[0] : result;
    block.id = `block-${uid()}`;
    res.json({ block });
  } catch (err) {
    console.error("regenerate-block error:", err);
    res.status(500).json({ message: "Regeneration failed. Please try again." });
  }
});

// ── PUT /api/builder/project/pages/:pageId (Save builder page contents) ───────────
router.put("/project/pages/:pageId", auth, async (req, res) => {
  try {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) return res.status(400).json({ message: "blocks must be an array" });
    const { projectId } = req.query;
    const isAdmin = req.user.role === "admin";

    const project = projectId
      ? await BuilderProject.findOne(isAdmin ? { _id: projectId } : { _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const idx = project.pages.findIndex((p) => p.id === req.params.pageId);
    if (idx === -1) return res.status(404).json({ message: "Page not found" });

    project.pages[idx].blocks = blocks;
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/project/pages (Add custom page) ──────────────────────────
router.post("/project/pages", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.package !== "pro") return res.status(403).json({ message: "Pro package required" });

    const { projectId } = req.query;
    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.pages.length >= PAGE_LIMITS.pro) {
      return res.status(400).json({ message: `Page limit of ${PAGE_LIMITS.pro} reached` });
    }

    const { name, slug } = req.body;
    project.pages.push({ id: `page-${uid()}`, name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), blocks: [] });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/builder/project/pages/:pageId (Delete page) ─────────────────────
router.delete("/project/pages/:pageId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.package !== "pro") return res.status(403).json({ message: "Pro package required" });

    const { projectId } = req.query;
    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.pages = project.pages.filter((p) => p.id !== req.params.pageId);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/by-slug/:slug (Public — render published site) ─────────────
router.get("/by-slug/:slug", async (req, res) => {
  try {
    const site = await BuilderProject.findOne({
      slug:   req.params.slug,
      status: "ready",
    }).select("-userId").lean();
    if (!site) return res.status(404).json({ message: "Not found" });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/by-domain/:domain (Public — custom domain lookup) ──────────
router.get("/by-domain/:domain", async (req, res) => {
  try {
    const site = await BuilderProject.findOne({
      customDomain:        req.params.domain,
      customDomainVerified: true,
      status:              "ready",
    }).select("-userId").lean();
    if (!site) return res.status(404).json({ message: "Not found" });
    res.json(site);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/all (Admin — list all customer sites) ───────────────────────
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    const sites = await BuilderProject.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/analytics (Admin — stats summary) ───────────────────────────
router.get("/analytics", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only" });

    const User         = require("../models/User");
    const Subscription = require("../models/Subscription");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeSubscriptions, newUsersThisMonth, totalSites, subsByPlan] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      BuilderProject.countDocuments(),
      Subscription.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ totalUsers, activeSubscriptions, newUsersThisMonth, totalSites, subsByPlan });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/builder/public/:projectId (Public view — no auth) ──────────────────
router.get("/public/:projectId", async (req, res) => {
  try {
    const project = await BuilderProject.findById(req.params.projectId).select("-userId").lean();
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/:id/custom-domain (Set a custom domain) ───────────────────
router.post("/:id/custom-domain", auth, async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ message: "Domain is required" });

    const token = crypto.randomBytes(16).toString("hex");
    const site  = await BuilderProject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { customDomain: domain, customDomainToken: token, customDomainVerified: false },
      { new: true }
    );
    if (!site) return res.status(404).json({ message: "Site not found" });

    res.json({ verificationToken: token, message: `Add a DNS TXT record: _lhrweb-verify.${domain} = "${token}"` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/:id/verify-domain (Check DNS TXT record) ───────────────────
router.post("/:id/verify-domain", auth, async (req, res) => {
  try {
    const site = await BuilderProject.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!site?.customDomain) return res.status(400).json({ message: "No custom domain set" });

    const dns = require("dns").promises;
    let verified = false;
    try {
      const records = await dns.resolveTxt(`_lhrweb-verify.${site.customDomain}`);
      verified = records.flat().includes(site.customDomainToken);
    } catch (_) { /* DNS lookup failed */ }

    if (verified) {
      await site.updateOne({ customDomainVerified: true });
    }
    res.json({ verified });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/builder/project/:projectId (Delete complete website) ───────────────
router.delete("/project/:projectId", auth, async (req, res) => {
  try {
    const result = await BuilderProject.deleteOne({ _id: req.params.projectId, userId: req.user.userId });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
