const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const upload = require("../middleware/upload");
const Project = require("../models/BuilderProject");

// ── Storage quota check (server-side, before upload proceeds) ──────────────────
const STORAGE_QUOTA = {
  starter: 100 * 1024 * 1024,  // 100MB
  pro:     500 * 1024 * 1024,  // 500MB
};

async function checkStorageQuota(userId, fileSize) {
  // Estimate current storage from existing project assets
  const projects = await Project.find({ userId }, { canvasState: 1, pages: 1 }).lean();
  let totalUsed = 0;
  // Simple heuristic: count the size of serialized project data as "usage"
  // In production, this would be computed from Cloudinary usage or a storage counter
  for (const p of projects) {
    totalUsed += Buffer.byteLength(JSON.stringify(p), "utf-8");
  }
  const user = await require("mongoose").model("User").findById(userId).lean();
  const plan = user?.package || "starter";
  const quota = STORAGE_QUOTA[plan] || STORAGE_QUOTA.starter;
  if (totalUsed + fileSize > quota) {
    const err = new Error(`Storage limit reached (${Math.round(totalUsed / 1024 / 1024)}MB/${Math.round(quota / 1024 / 1024)}MB).`);
    err.statusCode = 403;
    err.code = "STORAGE_LIMIT";
    throw err;
  }
}

// ── SVG sanitization check (runs after multer processes the file) ──────────────
function svgSanitizeCheck(req, res, next) {
  if (req.file && req.file.mimetype === "image/svg+xml") {
    try {
      const filePath = req.file.path || req.file.buffer;
      const buffer = req.file.buffer || fs.readFileSync(filePath);
      const content = buffer.toString("utf-8");
      const hasScript = /<script[\s>]/i.test(content) ||
        /on\w+\s*=\s*["']/i.test(content) ||
        /javascript\s*:/i.test(content);
      if (hasScript) {
        // Clean up uploaded file
        if (req.file.path) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: "This SVG contains scripts and was blocked." });
      }
    } catch (err) {
      return res.status(400).json({ message: "SVG validation failed." });
    }
  }
  next();
}

router.post("/", async (req, res, next) => {
  try {
    // Check storage quota before upload
    const userId = req.user?._id || req.user?.id;
    if (userId && req.headers["content-length"]) {
      const size = parseInt(req.headers["content-length"], 10);
      if (!isNaN(size)) {
        await checkStorageQuota(userId, size);
      }
    }
    next();
  } catch (err) {
    res.status(err.statusCode || 403).json({ message: err.message || "Storage limit reached." });
  }
}, upload.single("file"), svgSanitizeCheck, (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });
  const url = process.env.CLOUDINARY_CLOUD_NAME
    ? req.file.path
    : `public/uploads/${req.file.filename}`;
  res.json({ url, size: req.file.size, mimetype: req.file.mimetype });
});

// ── Multer error handler (file too large, wrong type, etc.) ───────────────────
router.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Max size is 10MB for images." });
  }
  if (err.code === "SVG_BLOCKED" || err.message?.includes("SVG")) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message?.includes("Unsupported file type")) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
