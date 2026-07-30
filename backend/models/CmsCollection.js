const mongoose = require("mongoose");

// Round 5 doc, Part 6 — user-defined content collections (beyond the built-in
// Blog). Fields describe the schema; CmsEntry documents hold the actual values.

const fieldSchema = new mongoose.Schema(
  {
    key:  { type: String, required: true },   // used as the values{} map key
    label:{ type: String, required: true },
    type: { type: String, enum: ["text", "richtext", "image", "number", "date", "boolean"], required: true },
  },
  { _id: false }
);

const cmsCollectionSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    name:      { type: String, required: true, trim: true, maxlength: 120 },
    slug:      { type: String, required: true },
    fields:    { type: [fieldSchema], default: [] },
  },
  { timestamps: true }
);

cmsCollectionSchema.index({ projectId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("CmsCollection", cmsCollectionSchema);
