const express        = require("express");
const router         = express.Router();
const crypto         = require("crypto");
const BuilderProject = require("../models/BuilderProject");
const User           = require("../models/User");
const Version        = require("../models/Version");
const { auth }       = require("../middleware/auth");
const { runAiOperation, AiError } = require("../services/ai");
const { resolveProject, listAccessibleProjects } = require("../lib/projectAccess");

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — bounded-scope
// publish history: how many past snapshots a project keeps before the oldest
// get pruned. Not user-configurable — a fixed cap keeps this a lightweight
// audit trail, not an open-ended archive.
const MAX_VERSIONS_PER_PROJECT = 25;

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

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — a project created
// by an agency owner/team member is automatically tagged with that agency,
// so every other owner/team member can access it too (see
// backend/lib/projectAccess.js). A client (or an independent, non-agency
// user) creating their own project is unaffected — agencyId stays null.
function agencyIdForCreator(user) {
  return (user?.agencyRole === "owner" || user?.agencyRole === "team") ? user.agencyId : null;
}

// ── GET /api/builder/projects (List all websites) ──────────────────────────────────
router.get("/projects", auth, async (req, res) => {
  try {
    const projects = await listAccessibleProjects(req.user.userId, { lean: true });
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
      agencyId:     agencyIdForCreator(user),
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
      agencyId:     agencyIdForCreator(user),
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
    const project = await resolveProject(req.user.userId, projectId, { isAdmin, lean: true });
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
      agencyId:     agencyIdForCreator(user),
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

    const project = await resolveProject(req.user.userId, projectId, { lean: true });

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

    const project = await resolveProject(req.user.userId, projectId, { isAdmin, lean: true });

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
    const { blocks, elements, seo, cmsTemplate, productTemplate, parentId } = req.body;
    if (!blocks && !elements && !seo && cmsTemplate === undefined && productTemplate === undefined && parentId === undefined) {
      return res.status(400).json({ message: "blocks, elements, seo, cmsTemplate, productTemplate or parentId required" });
    }
    if (blocks && !Array.isArray(blocks)) return res.status(400).json({ message: "blocks must be an array" });
    if (elements && !Array.isArray(elements)) return res.status(400).json({ message: "elements must be an array" });

    const { projectId } = req.query;
    const isAdmin = req.user.role === "admin";

    const project = await resolveProject(req.user.userId, projectId, { isAdmin });

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
        ogImage:     seo.ogImage ? String(seo.ogImage).slice(0, 500) : undefined,
      };
    }
    if (cmsTemplate === null) {
      project.pages[idx].cmsTemplate = undefined;
    } else if (cmsTemplate && typeof cmsTemplate === "object") {
      if (!cmsTemplate.collectionId || !cmsTemplate.pathPrefix) {
        return res.status(400).json({ message: "cmsTemplate requires collectionId and pathPrefix" });
      }
      project.pages[idx].cmsTemplate = {
        collectionId: String(cmsTemplate.collectionId),
        pathPrefix:   String(cmsTemplate.pathPrefix).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80),
      };
    }
    if (productTemplate === null) {
      project.pages[idx].productTemplate = undefined;
    } else if (productTemplate && typeof productTemplate === "object") {
      if (!productTemplate.pathPrefix) return res.status(400).json({ message: "productTemplate requires pathPrefix" });
      project.pages[idx].productTemplate = {
        pathPrefix: String(productTemplate.pathPrefix).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80),
      };
    }
    // Phase 5 §11.1 — page hierarchy (parentId === null clears it; a string sets it, cycle-checked)
    if (parentId === null) {
      project.pages[idx].parentId = undefined;
    } else if (typeof parentId === "string") {
      if (parentId === req.params.pageId) return res.status(400).json({ message: "A page cannot be its own parent" });
      const byId = new Map(project.pages.map((p) => [p.id, p]));
      let cursor = byId.get(parentId);
      const seen = new Set();
      while (cursor) {
        if (cursor.id === req.params.pageId || seen.has(cursor.id)) {
          return res.status(400).json({ message: "That would create a circular page hierarchy" });
        }
        seen.add(cursor.id);
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
      }
      if (!byId.has(parentId)) return res.status(400).json({ message: "parentId must reference an existing page" });
      project.pages[idx].parentId = parentId;
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

    const project = await resolveProject(req.user.userId, projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.components = components;
    await project.save();
    res.json({ components: project.components });
  } catch (err) {
    console.error("components save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/menus (Save global navigation — Phase 5 §11.3) ───
router.put("/project/menus", auth, async (req, res) => {
  try {
    const { menus, projectId } = req.body;
    if (!Array.isArray(menus)) return res.status(400).json({ message: "menus must be an array" });
    if (menus.length > 20) return res.status(400).json({ message: "Too many menus (max 20)" });

    const project = await resolveProject(req.user.userId, projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.menus = menus;
    await project.save();
    res.json({ menus: project.menus });
  } catch (err) {
    console.error("menus save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/redirects (Save redirects — Phase 5 §11.5) ───────
router.put("/project/redirects", auth, async (req, res) => {
  try {
    const { redirects, projectId } = req.body;
    if (!Array.isArray(redirects)) return res.status(400).json({ message: "redirects must be an array" });
    if (redirects.length > 200) return res.status(400).json({ message: "Too many redirects (max 200)" });

    const project = await resolveProject(req.user.userId, projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    const clean = redirects.map((r) => ({
      id: String(r.id || `redir-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      source: String(r.source || "").slice(0, 500),
      destination: String(r.destination || "").slice(0, 2000),
      statusCode: r.statusCode === 302 ? 302 : 301,
      enabled: r.enabled !== false,
    })).filter((r) => r.source && r.destination);

    project.redirects = clean;
    await project.save();
    res.json({ redirects: project.redirects });
  } catch (err) {
    console.error("redirects save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/project/version (Snapshot current pages, pre-publish) ──
// Phase 7 §13 — called once by the frontend right before the parallel save
// PUTs that follow a "Publish" click, capturing whatever is *currently* live
// (i.e. about to be overwritten) as a restorable snapshot. This route never
// touches the live project document itself — zero risk to the existing save
// path, which is untouched.
router.post("/project/version", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId || req.body?.projectId;
    const project = await resolveProject(req.user.userId, projectId, { select: "pages", lean: true });
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Version.create({
      projectId: project._id,
      userId: req.user.userId,
      pages: project.pages,
      label: String(req.body?.label || "").slice(0, 120),
    });

    const count = await Version.countDocuments({ projectId: project._id });
    if (count > MAX_VERSIONS_PER_PROJECT) {
      const stale = await Version.find({ projectId: project._id })
        .sort({ createdAt: 1 })
        .limit(count - MAX_VERSIONS_PER_PROJECT)
        .select("_id")
        .lean();
      await Version.deleteMany({ _id: { $in: stale.map((v) => v._id) } });
    }

    res.status(201).json({ message: "Snapshot saved" });
  } catch (err) {
    console.error("version snapshot error:", err);
    // A failed snapshot must never block the actual publish that follows it.
    res.status(200).json({ message: "Snapshot skipped" });
  }
});

// ── GET /api/builder/project/versions (List publish history) ────────────────
router.get("/project/versions", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId) return res.status(400).json({ message: "projectId is required." });
    const owned = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
    if (!owned) return res.status(404).json({ message: "Project not found" });

    const versions = await Version.find({ projectId })
      .sort({ createdAt: -1 })
      .select("_id label createdAt pages")
      .lean();
    // Page count/names only — the full snapshot only ships on restore, to keep the list light.
    res.json({
      versions: versions.map((v) => ({
        _id: v._id,
        label: v.label,
        createdAt: v.createdAt,
        pageCount: Array.isArray(v.pages) ? v.pages.length : 0,
        pageNames: Array.isArray(v.pages) ? v.pages.map((p) => p.name).slice(0, 8) : [],
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/project/versions/:versionId/restore ───────────────────
// "Rollback" (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13's Version → Restore
// → Preview → Publish diagram) — restores a snapshot's pages onto the live
// project and saves immediately (save *is* publish in this bounded scope, so
// restoring already republishes; "Preview" is just looking at the editor
// afterward before the next real edit).
router.post("/project/versions/:versionId/restore", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId || req.body?.projectId;
    const project = await resolveProject(req.user.userId, projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const version = await Version.findOne({ _id: req.params.versionId, projectId: project._id }).lean();
    if (!version) return res.status(404).json({ message: "Version not found" });

    project.pages = version.pages;
    project.markModified("pages");
    await project.save();
    res.json({ pages: project.pages });
  } catch (err) {
    console.error("version restore error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/builder/project/classes (Save named classes) ────────────────────
router.put("/project/classes", auth, async (req, res) => {
  try {
    const { classes, projectId } = req.body;
    if (!Array.isArray(classes)) return res.status(400).json({ message: "classes must be an array" });

    const project = await resolveProject(req.user.userId, projectId);

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

    const project = await resolveProject(req.user.userId, projectId);

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
    const project = await resolveProject(req.user.userId, projectId);

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
    const project = await resolveProject(req.user.userId, projectId);

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
    const project = await resolveProject(req.user.userId, projectId);

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

    const accessible = await resolveProject(req.user.userId, req.params.id, { select: "_id", lean: true });
    if (!accessible) return res.status(404).json({ message: "Site not found" });

    const token = crypto.randomBytes(16).toString("hex");
    const site  = await BuilderProject.findOneAndUpdate(
      { _id: accessible._id },
      { customDomain: domain, customDomainToken: token, customDomainVerified: false },
      { new: true }
    );

    res.json({ verificationToken: token, message: `Add a DNS TXT record: _lhrweb-verify.${domain} = "${token}"` });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/builder/:id/verify-domain (Check DNS TXT record) ───────────────────
router.post("/:id/verify-domain", auth, async (req, res) => {
  try {
    const site = await resolveProject(req.user.userId, req.params.id);
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

// ── DELETE /api/builder/:id/custom-domain (Remove a custom domain) ──────────────
router.delete("/:id/custom-domain", auth, async (req, res) => {
  try {
    const accessible = await resolveProject(req.user.userId, req.params.id, { select: "_id", lean: true });
    if (!accessible) return res.status(404).json({ message: "Site not found" });

    const site = await BuilderProject.findOneAndUpdate(
      { _id: accessible._id },
      { $unset: { customDomain: "", customDomainToken: "" }, customDomainVerified: false },
      { new: true }
    );
    res.json({ message: "Custom domain removed" });
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

    const project = await resolveProject(req.user.userId, projectId, { lean: true });

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

    const project = await resolveProject(req.user.userId, projectId, { lean: true });

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
      ? await resolveProject(req.user.userId, projectId, { lean: true })
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
      ? await resolveProject(req.user.userId, projectId, { lean: true })
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
      ? await resolveProject(req.user.userId, projectId, { lean: true })
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
      ? await resolveProject(req.user.userId, projectId, { lean: true })
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
    const project = await resolveProject(req.user.userId, req.params.projectId, { select: "aiMemory", lean: true });
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
    const accessible = await resolveProject(req.user.userId, req.params.projectId, { select: "_id", lean: true });
    if (!accessible) return res.status(404).json({ message: "Project not found" });
    const project = await BuilderProject.findOneAndUpdate(
      { _id: accessible._id },
      { $set: { aiMemory: clean } },
      { new: true }
    ).select("aiMemory");
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
    const { canvasMode, canvasState, primaryColor, projectId, notFoundPageId } = req.body;

    const project = await resolveProject(req.user.userId, projectId);

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
    // Phase 5 §11.4 — custom 404 page
    if (notFoundPageId === null) {
      project.notFoundPageId = undefined;
    } else if (typeof notFoundPageId === "string") {
      if (!project.pages.some((p) => p.id === notFoundPageId)) return res.status(400).json({ message: "notFoundPageId must reference an existing page" });
      project.notFoundPageId = notFoundPageId;
    }

    await project.save();
    res.json({ canvasMode: project.canvasMode, canvasState: project.canvasState, notFoundPageId: project.notFoundPageId });
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

    const project = await resolveProject(req.user.userId, projectId);

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
    const project = await resolveProject(req.user.userId, projectId);

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
    const accessible = await resolveProject(req.user.userId, req.params.projectId, { select: "_id", lean: true });
    if (!accessible) return res.status(404).json({ message: "Project not found" });
    await BuilderProject.deleteOne({ _id: accessible._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
