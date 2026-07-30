const mongoose = require("mongoose");

// Round 5 doc, Part 6 — one entry in a CmsCollection. `values` keys match the
// parent collection's field `key`s; kept as Mixed since field types vary.

const cmsEntrySchema = new mongoose.Schema(
  {
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsCollection", required: true, index: true },
    slug:         { type: String, required: true },
    values:       { type: mongoose.Schema.Types.Mixed, default: {} },
    published:    { type: Boolean, default: true },
    order:        { type: Number, default: 0 },
  },
  { timestamps: true }
);

cmsEntrySchema.index({ collectionId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("CmsEntry", cmsEntrySchema);
