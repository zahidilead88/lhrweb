const mongoose = require("mongoose");

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — customer
// analytics, built as real event tracking (not a mock/stub): every pageview
// on a published site writes one of these. Conversions (form submissions,
// orders) are read from the models that already create them (FormSubmission,
// Order) at query time rather than duplicated here — a submission/order is
// already a complete, authoritative record of its own event.
const analyticsEventSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    type:      { type: String, enum: ["pageview"], default: "pageview" },
    path:      { type: String, default: "/" },
    referrer:  { type: String, default: "" },
    device:    { type: String, enum: ["mobile", "tablet", "desktop"], default: "desktop" },
    visitorId: { type: String, required: true },
    sessionId: { type: String, required: true },
  },
  { timestamps: true }
);

// The dashboard's two hot queries: a date-range scan per project, and
// distinct-visitor/session counts within that scan.
analyticsEventSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
