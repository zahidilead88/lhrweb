const mongoose = require("mongoose");

// Round 5 Ch 5.1 — job document for two-phase site generation.
const jobPageSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    slug:     { type: String },
    status:   { type: String, enum: ["pending", "generating", "done", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const generationJobSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    phase:     { type: String, enum: ["plan", "pages", "done", "failed"], default: "plan" },
    pages:     { type: [jobPageSchema], default: [] },
    error:     { type: String, default: null },
    errorCode: { type: String, default: null },   // QUOTA_EXCEEDED | AI_GENERATION_FAILED | AI_UNAVAILABLE
    usedTemplateFallback: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GenerationJob", generationJobSchema);
