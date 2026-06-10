const multer  = require("multer");
const path    = require("path");

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
    },
  });

  module.exports = multer({ storage });
} else {
  // ── Local disk storage (fallback for local dev) ───────────────────────────
  const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, "public/uploads/"); },
    filename:    (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); },
  });

  module.exports = multer({ storage });
}
