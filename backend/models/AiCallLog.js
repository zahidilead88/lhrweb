const mongoose = require("mongoose");

// Ch 7.2 — one row per model call chain; powers cost/quality dashboards.
const aiCallLogSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    op:            { type: String, index: true },
    promptVersion: { type: Number },
    model:         { type: String },
    inputTokens:   { type: Number, default: 0 },
    outputTokens:  { type: Number, default: 0 },
    repaired:      { type: String, default: null },   // null | local | model | regen
    confidence:    { type: Number },
    warnings:      { type: [String], default: [] },
    success:       { type: Boolean },
    ms:            { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiCallLog", aiCallLogSchema);
