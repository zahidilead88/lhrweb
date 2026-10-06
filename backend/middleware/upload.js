const multer  = require("multer");
const path    = require("path");

// ── Allowed MIME types ────────────────────────────────────────────────────────
// Phase 6 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §12) — the asset library
// spec calls for images/videos/SVG/files/fonts; widened from the original
// images-only allowlist (still used as-is by the pre-existing admin-page
// upload flows, so this only adds categories, never removes one).
const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
  "video/mp4", "video/webm",
  "font/woff", "font/woff2", "font/ttf", "application/font-woff", "application/font-woff2",
  "application/pdf",
];

// ── File size limits ──────────────────────────────────────────────────────────
const MAX_SIZE = 25 * 1024 * 1024; // 25MB — covers images/fonts/small video clips

// ── File filter: reject unsupported types before they reach storage ───────────
function fileFilter(req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}.`));
  }
}

// ── SVG sanitization helper: reject SVGs with embedded scripts ────────────────
function sanitizeSvg(buffer) {
  const content = buffer.toString("utf-8");
  const hasScript = /<script[\s>]/i.test(content) ||
    /on\w+\s*=\s*["']/i.test(content) ||
    /javascript\s*:/i.test(content);
  if (hasScript) {
    const err = new Error("This SVG contains scripts and was blocked.");
    err.code = "SVG_BLOCKED";
    throw err;
  }
  return buffer;
}

// ── Cloudinary upload (used when CLOUDINARY_CLOUD_NAME is configured) ─────────
if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary                   = require("cloudinary").v2;
  const { CloudinaryStorage }        = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          "lhrweb",
      resource_type:   "auto", // let Cloudinary route image/video/raw (fonts, pdf) correctly
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg", "mp4", "webm", "woff", "woff2", "ttf", "pdf"],
      public_id:       (req, file) => Date.now() + "-" + path.parse(file.originalname).name,
    },
  });

  module.exports = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter,
  });
} else {
  // ── Local disk storage (fallback for local dev) ───────────────────────────
  const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "public/uploads/"); },
    filename:    (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); },
  });

  module.exports = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter,
  });
}
