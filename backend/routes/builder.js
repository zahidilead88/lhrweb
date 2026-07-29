const express        = require("express");
const router         = express.Router();
const crypto         = require("crypto");
const BuilderProject = require("../models/BuilderProject");
const User           = require("../models/User");
const { auth }       = require("../middleware/auth");
const { runAiOperation, AiError } = require("../services/ai");

// Spec error contract (Round 5 Ch 11): 402 QUOTA_EXCEEDED · 422 AI_GENERATION_FAILED · 503 AI_UNAVAILABLE
function sendAiError(res, err, fallbackMsg) {
  if (err instanceof AiError) {
    return res.status(err.status).json({ code: err.code, message: err.message, ...err.extra });
  }
  console.error("AI route error:", err);
  return res.status(500).json({ message: fallbackMsg || "Generation failed. Please try again." });
}

const PAGE_LIMITS   = { starter: 5, pro: 15 };
const STARTER_TYPES = ["hero", "about", "services", "contact", "cta", "features"];
const PRO_TYPES     = [...STARTER_TYPES, "testimonials", "faq", "team", "gallery", "pricing"];

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

// ── POST /api/builder/init-template (Create a site from the starter template) ────
// Blueprint v3 F-02: third starting point — AI / Template / Blank, one workspace.
router.post("/init-template", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "builder") return res.status(403).json({ message: "Forbidden" });

    const { businessName, theme = "light", primaryColor } = req.body;
    const bName = String(businessName || "My Website").slice(0, 120);
    const { starterTemplate } = require("../services/ai/templates");
    const tpl = starterTemplate({ businessName: bName, theme, primaryColor: primaryColor || "#6344d4" });

    const slug = await uniqueSlug(bName, req.user.userId);
    const project = await BuilderProject.create({
      userId:       req.user.userId,
      status:       "ready",
      businessName: bName,
      slug,
      tagline:      tpl.tagline,
      primaryColor: tpl.primaryColor,
      package:      user.package || "starter",
      pages:        tpl.pages,
      generatedAt:  new Date(),
    });
    res.json(project);
  } catch (err) {
    console.error("init-template error:", err);
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

// ── POST /api/builder/generate (Round 5 Ch 5.1 — async two-phase job) ─────────────
// Returns 202 { jobId, projectId } immediately; client polls /generate/status/:jobId.
router.post("/generate", auth, async (req, res) => {
  let project;
  try {
    const { prompt, theme = "light" } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: "Prompt is required" });
    const maxPrompt = 2000;
    if (prompt.length > maxPrompt) return res.status(400).json({ message: `Prompt too long (max ${maxPrompt} chars)` });

    const user = await User.findById(req.user.userId).lean();
    if (!user || user.role !== "builder") return res.status(403).json({ message: "Forbidden" });

    // Reserve 1 quota unit at job start (Ch 12) — a started job completes regardless of quota state
    const { checkQuota, decrementQuota } = require("../services/ai/quota");
    const quota = await checkQuota(user, 1);
    if (!quota.ok) {
      return res.status(402).json({ code: "QUOTA_EXCEEDED", message: "Monthly AI quota exceeded.", ...quota });
    }
    await decrementQuota(req.user.userId, 1);

    const pkg        = user.package || "starter";
    const pageLimit  = PAGE_LIMITS[pkg];
    const blockTypes = pkg === "starter" ? STARTER_TYPES : PRO_TYPES;

    project = await BuilderProject.create({
      userId:       req.user.userId,
      status:       "generating",
      prompt,
      package:      pkg,
      pages:        [],
    });

    const GenerationJob = require("../models/GenerationJob");
    const job = await GenerationJob.create({ userId: req.user.userId, projectId: project._id });

    const { runSiteGenerationJob } = require("../services/ai/siteJob");
    const input = { prompt, theme, pkg, blockTypes, pageLimit };
    setImmediate(() => {
      runSiteGenerationJob(job._id, input, user).catch(async (err) => {
        console.error("Site generation job crashed:", err);
        await GenerationJob.findByIdAndUpdate(job._id, { phase: "failed", error: err.message }).catch(() => {});
        await BuilderProject.findByIdAndUpdate(project._id, { status: "empty" }).catch(() => {});
      });
    });

    res.status(202).json({ jobId: job._id, projectId: project._id });
  } catch (err) {
    console.error("Builder generate error:", err);
    if (project) {
      await BuilderProject.findByIdAndUpdate(project._id, { status: "empty" }).catch(() => {});
    }
    res.status(500).json({ message: "Generation failed. Please try again." });
  }
});

// ── GET /api/builder/generate/status/:jobId — job progress for the loading screen ──
router.get("/generate/status/:jobId", auth, async (req, res) => {
  try {
    const GenerationJob = require("../models/GenerationJob");
    const job = await GenerationJob.findOne({ _id: req.params.jobId, userId: req.user.userId }).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    const payload = {
      phase: job.phase,
      pages: job.pages.map((p) => ({ name: p.name, status: p.status, attempts: p.attempts })),
      error: job.error,
      errorCode: job.errorCode,
      usedTemplateFallback: job.usedTemplateFallback,
      projectId: job.projectId,
    };
    // when done, include the full project so the client needs no second request
    if (job.phase === "done") {
      payload.project = await BuilderProject.findById(job.projectId).lean();
    }
    res.json(payload);
  } catch (err) {
    console.error("generate/status error:", err);
    res.status(500).json({ message: "Failed to load job status." });
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

    let blocks, meta;
    try {
      const result = await runAiOperation("pageGenerate", { prompt, theme }, user, { project });
      blocks = result.data.blocks.map((b) => ({ ...b, id: `block-${uid()}` }));
      meta = result.meta;
    } catch (aiErr) {
      return sendAiError(res, aiErr, "AI returned invalid content. Please try again.");
    }

    res.json({ blocks, meta });
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

    try {
      const { data, meta } = await runAiOperation(
        "blockRegenerate",
        { blockType, prompt: userPrompt, theme },
        user,
        { project }
      );
      data.id = `block-${uid()}`;
      return res.json({ block: data, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "Regeneration failed. Please try again.");
    }
  } catch (err) {
    console.error("regenerate-block error:", err);
    res.status(500).json({ message: "Regeneration failed. Please try again." });
  }
});

// ── PUT /api/builder/project/pages/:pageId (Save builder page contents) ───────────
// Accepts V1 blocks[], V2 elements[], or both — whichever the client sends.
router.put("/project/pages/:pageId", auth, async (req, res) => {
  try {
    const { blocks, elements, seo } = req.body;
    if (!blocks && !elements && !seo) return res.status(400).json({ message: "blocks, elements or seo required" });
    if (blocks && !Array.isArray(blocks)) return res.status(400).json({ message: "blocks must be an array" });
    if (elements && !Array.isArray(elements)) return res.status(400).json({ message: "elements must be an array" });

    const { projectId } = req.query;
    const isAdmin = req.user.role === "admin";

    const project = projectId
      ? await BuilderProject.findOne(isAdmin ? { _id: projectId } : { _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const idx = project.pages.findIndex((p) => p.id === req.params.pageId);
    if (idx === -1) return res.status(404).json({ message: "Page not found" });

    if (blocks)    project.pages[idx].blocks   = blocks;
    if (elements)  project.pages[idx].elements = elements;
    if (seo && typeof seo === "object") {
      project.pages[idx].seo = {
        title:       String(seo.title || "").slice(0, 80),
        description: String(seo.description || "").slice(0, 220),
        keywords:    Array.isArray(seo.keywords) ? seo.keywords.slice(0, 12).map((k) => String(k).slice(0, 40)) : undefined,
      };
    }
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/components (Save component library — Phase 4) ───
router.put("/project/components", auth, async (req, res) => {
  try {
    const { components, projectId } = req.body;
    if (!Array.isArray(components)) return res.status(400).json({ message: "components must be an array" });
    if (components.length > 200) return res.status(400).json({ message: "Too many components (max 200)" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.components = components;
    await project.save();
    res.json({ components: project.components });
  } catch (err) {
    console.error("components save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/classes (Save named classes) ────────────────────
router.put("/project/classes", auth, async (req, res) => {
  try {
    const { classes, projectId } = req.body;
    if (!Array.isArray(classes)) return res.status(400).json({ message: "classes must be an array" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.classes = classes;
    await project.save();
    res.json({ classes: project.classes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/tokens (Save design tokens) ─────────────────────
router.put("/project/tokens", auth, async (req, res) => {
  try {
    const { tokens, projectId } = req.body;
    if (!tokens || typeof tokens !== "object") return res.status(400).json({ message: "tokens object required" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.tokens = tokens;
    await project.save();
    res.json({ tokens: project.tokens });
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

// ── PATCH /api/builder/project/pages/:pageId (Rename page name/slug) ────────────
router.patch("/project/pages/:pageId", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "name is required" });

    const { projectId } = req.query;
    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    const idx = project.pages.findIndex((p) => p.id === req.params.pageId);
    if (idx === -1) return res.status(404).json({ message: "Page not found" });

    project.pages[idx].name = name.trim();
    project.pages[idx].slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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

// ── POST /api/builder/generate-elements (V2 AI: generate ElementNode tree) ───────────
router.post("/generate-elements", auth, async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: "Prompt required" });
    if (prompt.length > 3000) return res.status(400).json({ message: "Prompt too long (max 3000 chars)" });

    const user = await User.findById(req.user.userId).lean();
    if (!user || (user.role !== "builder" && user.role !== "admin"))
      return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();

    const primaryColor = project?.primaryColor || "#6344d4";
    // existingIds: caller sends the full page id set so cross-generation dedup works (Ch 12)
    const existingIds = Array.isArray(req.body.existingIds) ? req.body.existingIds.slice(0, 5000) : [];

    try {
      const { data, meta } = await runAiOperation(
        "elementsGenerate",
        { prompt, primaryColor },
        user,
        { project, existingIds }
      );
      return res.json({ elements: data.elements, classes: data.classes, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "AI returned invalid content. Please try again.");
    }
  } catch (err) {
    console.error("generate-elements error:", err);
    res.status(500).json({ message: "Generation failed. Please try again." });
  }
});


// ── POST /api/builder/regenerate-element (V2 AI: patch one element subtree) ──────────
router.post("/regenerate-element", auth, async (req, res) => {
  try {
    const { element, prompt, projectId } = req.body;
    if (!element) return res.status(400).json({ message: "element is required" });

    const user = await User.findById(req.user.userId).lean();
    if (!user || (user.role !== "builder" && user.role !== "admin"))
      return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();

    try {
      const { data, meta } = await runAiOperation(
        "elementEdit",
        { element, prompt },
        user,
        { project }
      );
      return res.json({ element: data, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "Regeneration failed. Please try again.");
    }
  } catch (err) {
    console.error("regenerate-element error:", err);
    res.status(500).json({ message: "Regeneration failed. Please try again." });
  }
});

// ── POST /api/builder/animate-element — AI animation config generator ────────
router.post("/animate-element", auth, async (req, res) => {
  try {
    const { description, projectId } = req.body;
    if (!description) return res.status(400).json({ message: "description required" });
    if (String(description).length > 500) return res.status(400).json({ message: "Description too long (max 500 chars)" });

    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : null;

    try {
      const { data, meta } = await runAiOperation("animateElement", { description }, user, { project });
      return res.json({ animation: data, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "AI animation generation failed. Please try again.");
    }
  } catch (err) {
    console.error("animate-element error:", err);
    res.status(500).json({ message: "AI animation generation failed. Please try again." });
  }
});

// ── POST /api/builder/ai/rewrite — 3 copy variants for one element (Round 5 Ch 5.2) ──
router.post("/ai/rewrite", auth, async (req, res) => {
  try {
    const { text, tag, tone, projectId } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "text is required" });
    if (text.length > 5000) return res.status(400).json({ message: "Text too long (max 5000 chars)" });

    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : null;

    try {
      const { data, meta } = await runAiOperation("rewriteContent", { text, tag, tone }, user, { project });

      // Ch 4.3 AI-R4(b): same tone picked 3+ times → learn it as the brand voice
      if (project && tone) {
        const key = String(tone).slice(0, 40).replace(/[.$]/g, "");
        const updated = await BuilderProject.findByIdAndUpdate(
          project._id,
          { $inc: { [`aiToneCounts.${key}`]: 1 } },
          { new: true }
        ).select("aiToneCounts aiMemory").lean();
        if (updated?.aiToneCounts?.[key] >= 3 && updated?.aiMemory?.brandVoice !== key) {
          await BuilderProject.findByIdAndUpdate(project._id, {
            $set: { "aiMemory.brandVoice": key, "aiMemory.updatedAt": new Date() },
          });
        }
      }

      return res.json({ variants: data.variants.slice(0, 3), meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "Rewrite failed. Please try again.");
    }
  } catch (err) {
    console.error("ai/rewrite error:", err);
    res.status(500).json({ message: "Rewrite failed. Please try again." });
  }
});

// ── POST /api/builder/ai/seo — page title/description/keywords (Round 5 Ch 5.2) ──
router.post("/ai/seo", auth, async (req, res) => {
  try {
    const { pageName, headings, textSample, projectId } = req.body;
    if (!pageName?.trim()) return res.status(400).json({ message: "pageName is required" });

    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : null;

    try {
      const { data, meta } = await runAiOperation(
        "generateSeo",
        { pageName, headings: Array.isArray(headings) ? headings : [], textSample: String(textSample || "") },
        user,
        { project }
      );
      return res.json({ seo: data, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "SEO generation failed. Please try again.");
    }
  } catch (err) {
    console.error("ai/seo error:", err);
    res.status(500).json({ message: "SEO generation failed. Please try again." });
  }
});

// ── POST /api/builder/ai/theme — design token suggestion (Round 5 Ch 5.2) ──
// Returns a candidate only — the client previews and applies (A2/A3: preview for large scope).
router.post("/ai/theme", auth, async (req, res) => {
  try {
    const { prompt, projectId } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: "prompt is required" });
    if (prompt.length > 1000) return res.status(400).json({ message: "Prompt too long (max 1000 chars)" });

    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId }).lean()
      : null;

    try {
      const { data, meta } = await runAiOperation("suggestTheme", { prompt }, user, { project });
      return res.json({ theme: data, meta });
    } catch (aiErr) {
      return sendAiError(res, aiErr, "Theme suggestion failed. Please try again.");
    }
  } catch (err) {
    console.error("ai/theme error:", err);
    res.status(500).json({ message: "Theme suggestion failed. Please try again." });
  }
});

// ── GET /api/builder/project/:projectId/ai-memory — view AI memory (Round 5 Ch 4.3) ──
router.get("/project/:projectId/ai-memory", auth, async (req, res) => {
  try {
    const project = await BuilderProject.findOne({ _id: req.params.projectId, userId: req.user.userId })
      .select("aiMemory").lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ aiMemory: project.aiMemory || {} });
  } catch (err) {
    console.error("ai-memory get error:", err);
    res.status(500).json({ message: "Failed to load AI memory." });
  }
});

// ── PUT /api/builder/project/:projectId/ai-memory — edit/clear AI memory (Ch 4.3) ──
// Memory is fully user-controlled: send {} to make the AI behave as first-run.
router.put("/project/:projectId/ai-memory", auth, async (req, res) => {
  try {
    const { businessSummary, brandVoice, audience, preferences } = req.body || {};
    const clean = {
      businessSummary: String(businessSummary || "").slice(0, 600),
      brandVoice:      String(brandVoice || "").slice(0, 200),
      audience:        String(audience || "").slice(0, 200),
      preferences:     Array.isArray(preferences)
        ? preferences.slice(0, 10).map((p) => String(p).slice(0, 120))
        : [],
      updatedAt: new Date(),
    };
    const project = await BuilderProject.findOneAndUpdate(
      { _id: req.params.projectId, userId: req.user.userId },
      { $set: { aiMemory: clean } },
      { new: true }
    ).select("aiMemory");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ aiMemory: project.aiMemory });
  } catch (err) {
    console.error("ai-memory put error:", err);
    res.status(500).json({ message: "Failed to save AI memory." });
  }
});

// ── GET /api/builder/ai/usage — quota status for the UI (Round 5 Ch 7.3) ──
router.get("/ai/usage", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) return res.status(403).json({ message: "Forbidden" });
    const { PLAN_UNITS, currentPeriod } = require("../services/ai/quota");
    const period = currentPeriod();
    const unitsUsed = user.aiUsage?.period === period ? user.aiUsage.unitsUsed : 0;
    const limit = user.role === "admin" ? null : (PLAN_UNITS[user.package] ?? 5);
    res.json({ period, unitsUsed, limit });
  } catch (err) {
    console.error("ai/usage error:", err);
    res.status(500).json({ message: "Failed to load AI usage." });
  }
});

// ── PUT /api/builder/project/settings (Save project-level settings) ─────────
router.put("/project/settings", auth, async (req, res) => {
  try {
    const { canvasMode, canvasState, primaryColor, projectId } = req.body;

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (canvasMode && ["flow", "free"].includes(canvasMode)) {
      project.canvasMode = canvasMode;
    }
    if (canvasState !== undefined) {
      project.canvasState = canvasState;
    }
    if (primaryColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor)) {
      project.primaryColor = primaryColor;
    }

    await project.save();
    res.json({ canvasMode: project.canvasMode, canvasState: project.canvasState });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/project/sections (Save a converted frame section) ──────
router.post("/project/sections", auth, async (req, res) => {
  try {
    const { section, projectId } = req.body;
    if (!section || !section.id || !section.name)
      return res.status(400).json({ message: "section with id and name required" });

    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Replace existing section with same id, or append
    const idx = project.savedSections.findIndex((s) => s.id === section.id);
    if (idx >= 0) {
      project.savedSections[idx] = section;
    } else {
      project.savedSections.push(section);
    }
    await project.save();
    res.json({ savedSections: project.savedSections });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/builder/project/sections/:sectionId (Remove a saved section) ─
router.delete("/project/sections/:sectionId", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const project = projectId
      ? await BuilderProject.findOne({ _id: projectId, userId: req.user.userId })
      : await BuilderProject.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.savedSections = project.savedSections.filter((s) => s.id !== req.params.sectionId);
    await project.save();
    res.json({ savedSections: project.savedSections });
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
