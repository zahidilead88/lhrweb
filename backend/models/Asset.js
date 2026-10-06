const mongoose = require("mongoose");

// Phase 6 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §12) — asset library.
// Tracks an upload (already stored via the existing Cloudinary-or-local
// upload middleware, backend/middleware/upload.js) as a browsable, per-project
// record, so the builder can list/search/reuse/delete what's already been
// uploaded instead of every image being a one-off, untracked URL.
const assetSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    url:       { type: String, required: true },
    filename:  { type: String, default: "" },
    mimetype:  { type: String, default: "" },
    size:      { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["image", "video", "svg", "font", "file"],
      default: "file",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
