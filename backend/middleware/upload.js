const multer  = require("multer");
const path    = require("path");

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
];

// ── File size limits ──────────────────────────────────────────────────────────
const MAX_SIZE = 10 * 1024 * 1024; // 10MB for images, 50MB for videos

// ── File filter: reject unsupported types before they reach storage ───────────
function fileFilter(req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPG, PNG, WebP, SVG and GIF are supported.`));
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
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
      transformation:  [{ width: 1600, crop: "limit" }],
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
