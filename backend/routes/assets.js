const express = require("express");
const router  = express.Router();
const fs      = require("fs");

const upload         = require("../middleware/upload");
const { auth }        = require("../middleware/auth");
const Asset           = require("../models/Asset");
const BuilderProject  = require("../models/BuilderProject");
const { resolveProject } = require("../lib/projectAccess");

// Phase 6 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §12) — asset library:
// list/upload/delete, scoped to a project the requesting user actually owns.
// Reuses the existing Cloudinary-or-local upload middleware (same one the
// admin block editors already use) rather than a separate storage path.

function typeFromMime(mimetype) {
  if (mimetype.startsWith("image/svg")) return "svg";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("font/") || mimetype.includes("font")) return "font";
  return "file";
}

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency-aware: see
// backend/lib/projectAccess.js.
async function requireOwnedProject(req, res, next) {
  const projectId = req.query.projectId || req.body?.projectId;
  if (!projectId) return res.status(400).json({ message: "projectId is required." });
  const project = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
  if (!project) return res.status(404).json({ message: "Project not found." });
  req.projectId = projectId;
  next();
}

// ── GET /api/assets?projectId=X — list a project's assets, newest first ────────
router.get("/", auth, requireOwnedProject, async (req, res) => {
  try {
    const assets = await Asset.find({ projectId: req.projectId }).sort({ createdAt: -1 }).lean();
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/assets?projectId=X — upload one file, tracked as an Asset record ─
router.post("/", auth, requireOwnedProject, upload.single("file"), (req, res, next) => {
  if (req.file && req.file.mimetype === "image/svg+xml") {
    try {
      const buffer = req.file.buffer || fs.readFileSync(req.file.path);
      const content = buffer.toString("utf-8");
      const hasScript = /<script[\s>]/i.test(content) || /on\w+\s*=\s*["']/i.test(content) || /javascript\s*:/i.test(content);
      if (hasScript) {
        if (req.file.path) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: "This SVG contains scripts and was blocked." });
      }
    } catch {
      return res.status(400).json({ message: "SVG validation failed." });
    }
  }
  next();
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const url = process.env.CLOUDINARY_CLOUD_NAME ? req.file.path : `/public/uploads/${req.file.filename}`;
    const asset = await Asset.create({
      projectId: req.projectId,
      userId:    req.user.userId,
      url,
      filename:  req.file.originalname,
      mimetype:  req.file.mimetype,
      size:      req.file.size,
      type:      typeFromMime(req.file.mimetype),
    });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/assets/:id?projectId=X — remove from the library ───────────────
// Removes the tracked record only, not the underlying stored file (deleting
// from Cloudinary needs its public_id, which isn't derivable from the URL
// alone without an extra lookup) — a known, bounded-scope limitation.
//
// Scoped by projectId only (already access-checked by requireOwnedProject),
// not by which specific user uploaded it — Phase 8 made this a real case:
// an agency team member needs to be able to delete an asset a teammate (or
// the client) uploaded, not just their own.
router.delete("/:id", auth, requireOwnedProject, async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, projectId: req.projectId });
    if (!asset) return res.status(404).json({ message: "Asset not found." });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Multer error handler ────────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Max file size is 25MB." });
  if (err.code === "SVG_BLOCKED" || err.message?.includes("SVG")) return res.status(400).json({ message: err.message });
  if (err.message?.includes("Unsupported file type")) return res.status(400).json({ message: err.message });
  next(err);
});

module.exports = router;
