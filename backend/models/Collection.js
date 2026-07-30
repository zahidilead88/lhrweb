const mongoose = require("mongoose");

// Round 5 doc, Part 6 — manual or rule-based product groupings.

const ruleSchema = new mongoose.Schema(
  {
    field: { type: String, enum: ["tag", "price", "vendor"], required: true },
    op:    { type: String, enum: ["equals", "contains", "gt", "lt"], required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    slug:        { type: String, required: true },
    description: { type: String, default: "", maxlength: 5000 },
    heroImage:   { type: String },

    type:  { type: String, enum: ["manual", "automatic"], default: "manual" },
    // manual: explicit product list
    productIds: { type: [mongoose.Schema.Types.ObjectId], ref: "Product", default: [] },
    // automatic: matched at read-time against Product fields (tag/price/vendor)
    rules: { type: [ruleSchema], default: [] },
  },
  { timestamps: true }
);

collectionSchema.index({ projectId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model("Collection", collectionSchema);
