const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    id:      { type: String, required: true },
    type:    { type: String, required: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    styles:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    id:     { type: String, required: true },
    name:   { type: String, required: true },
    slug:   { type: String, required: true },
    blocks: { type: [blockSchema], default: [] },
  },
  { _id: false }
);

const builderProjectSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status:       { type: String, enum: ["empty", "generating", "ready"], default: "empty" },
    prompt:       { type: String },
    businessName: { type: String },
    tagline:      { type: String },
    primaryColor:        { type: String, default: "#000000" },
    slug:                { type: String, index: true },
    customDomain:        { type: String, sparse: true },
    customDomainVerified: { type: Boolean, default: false },
    customDomainToken:   { type: String },
    package:             { type: String, enum: ["starter", "pro"] },
    pages:        { type: [pageSchema], default: [] },
    generatedAt:  { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BuilderProject", builderProjectSchema);
