const express        = require("express");
const router         = express.Router();
const BuilderProject = require("../models/BuilderProject");
const CmsCollection  = require("../models/CmsCollection");
const CmsEntry       = require("../models/CmsEntry");
const { auth }        = require("../middleware/auth");
const { resolveProject } = require("../lib/projectAccess");

// Round 5 doc, Part 6 — CMS collections/entries CRUD. Resolution into published
// pages (cmsField bindings, __repeat repeaters, generateHTML integration) is a
// separate, larger change to the renderer and isn't part of this pass.

const ALLOWED_FIELD_TYPES = ["text", "richtext", "image", "number", "date", "boolean"];
function toSlug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency-aware:
// see backend/lib/projectAccess.js.
async function assertOwnsProject(projectId, userId) {
  return resolveProject(userId, projectId, { select: "_id", lean: true });
}

// ── Public (Phase 2 — resolves cmsField bindings on the live/public site) ────
// No auth: a project's CMS content is exactly as public as the site itself.
router.get("/public/:projectId", async (req, res) => {
  try {
    const collections = await CmsCollection.find({ projectId: req.params.projectId }).select("-projectId").lean();
    const collectionIds = collections.map((c) => c._id);
    const entries = collectionIds.length
      ? await CmsEntry.find({ collectionId: { $in: collectionIds }, published: true }).lean()
      : [];
    res.json({ collections, entries });
  } catch (err) {
    console.error("cms public fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Collections ────────────────────────────────────────────────────────────

router.get("/collections", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });
    const collections = await CmsCollection.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json(collections);
  } catch (err) {
    console.error("cms collections list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/collections", auth, async (req, res) => {
  try {
    const { projectId, name, fields } = req.body;
    if (!projectId || !name) return res.status(400).json({ message: "projectId and name are required" });
    if (!(await assertOwnsProject(projectId, req.user.userId))) return res.status(404).json({ message: "Project not found" });

    const cleanFields = (Array.isArray(fields) ? fields : [])
      .filter((f) => f?.key && f?.label && ALLOWED_FIELD_TYPES.includes(f.type))
      .slice(0, 40)
      .map((f) => ({ key: String(f.key).slice(0, 60), label: String(f.label).slice(0, 80), type: f.type }));

    let slug = toSlug(name), i = 1;
    while (await CmsCollection.findOne({ projectId, slug }).select("_id").lean()) slug = `${toSlug(name)}-${i++}`;

    const collection = await CmsCollection.create({ projectId, name: String(name).slice(0, 120), slug, fields: cleanFields });
    res.status(201).json(collection);
  } catch (err) {
    console.error("cms collection create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/collections/:id", auth, async (req, res) => {
  try {
    const collection = await CmsCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });

    if (req.body.name) collection.name = String(req.body.name).slice(0, 120);
    if (Array.isArray(req.body.fields)) {
      collection.fields = req.body.fields
        .filter((f) => f?.key && f?.label && ALLOWED_FIELD_TYPES.includes(f.type))
        .slice(0, 40)
        .map((f) => ({ key: String(f.key).slice(0, 60), label: String(f.label).slice(0, 80), type: f.type }));
    }
    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("cms collection update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/collections/:id", auth, async (req, res) => {
  try {
    const collection = await CmsCollection.findById(req.params.id).select("projectId").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await CmsEntry.deleteMany({ collectionId: req.params.id });
    await CmsCollection.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("cms collection delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Entries ────────────────────────────────────────────────────────────────

router.get("/collections/:id/entries", auth, async (req, res) => {
  try {
    const collection = await CmsCollection.findById(req.params.id).select("projectId").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    const entries = await CmsEntry.find({ collectionId: req.params.id }).sort({ order: 1, createdAt: -1 }).lean();
    res.json(entries);
  } catch (err) {
    console.error("cms entries list error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/collections/:id/entries", auth, async (req, res) => {
  try {
    const collection = await CmsCollection.findById(req.params.id).select("projectId fields").lean();
    if (!collection) return res.status(404).json({ message: "Collection not found" });
    if (!(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });

    const values = req.body.values && typeof req.body.values === "object" ? req.body.values : {};
    const baseSlug = toSlug(req.body.slug || values[collection.fields?.[0]?.key] || "entry");
    let slug = baseSlug, i = 1;
    while (await CmsEntry.findOne({ collectionId: req.params.id, slug }).select("_id").lean()) slug = `${baseSlug}-${i++}`;

    const entry = await CmsEntry.create({ collectionId: req.params.id, slug, values, published: req.body.published !== false });
    res.status(201).json(entry);
  } catch (err) {
    console.error("cms entry create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/entries/:id", auth, async (req, res) => {
  try {
    const entry = await CmsEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    const collection = await CmsCollection.findById(entry.collectionId).select("projectId").lean();
    if (!collection || !(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });

    if (req.body.values && typeof req.body.values === "object") entry.values = req.body.values;
    if (typeof req.body.published === "boolean") entry.published = req.body.published;
    if (typeof req.body.order === "number") entry.order = req.body.order;
    await entry.save();
    res.json(entry);
  } catch (err) {
    console.error("cms entry update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/entries/:id", auth, async (req, res) => {
  try {
    const entry = await CmsEntry.findById(req.params.id).select("collectionId").lean();
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    const collection = await CmsCollection.findById(entry.collectionId).select("projectId").lean();
    if (!collection || !(await assertOwnsProject(collection.projectId, req.user.userId))) return res.status(403).json({ message: "Forbidden" });
    await CmsEntry.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error("cms entry delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
