const mongoose = require("mongoose");

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — publish history,
// bounded scope by explicit choice: "Save" already *is* "Publish" (the editor
// writes straight to the same document the public site reads live) — there's
// no draft/live split to build a real version list around. This is instead a
// lightweight, append-only audit trail: a full snapshot of `pages` is
// captured just before each publish overwrites it, so "Rollback" is "restore
// an old snapshot, then save/publish normally" rather than a parallel
// staging system. `pages` is Mixed (not the strict `pageSchema`) — an archival
// snapshot doesn't need write-time validation, and Mixed sidesteps the
// silent-field-stripping bug class `strict: true` schemas have hit
// repeatedly elsewhere in this project (cmsBinding, productBinding, slots).
const versionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pages:     { type: mongoose.Schema.Types.Mixed, required: true },
    label:     { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Version", versionSchema);
