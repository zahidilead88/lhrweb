const express = require("express");
const router  = express.Router();

const { auth }        = require("../middleware/auth");
const BuilderProject  = require("../models/BuilderProject");
const AnalyticsEvent  = require("../models/AnalyticsEvent");
const FormSubmission  = require("../models/FormSubmission");
const Order           = require("../models/Order");
const { resolveProject } = require("../lib/projectAccess");

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — customer
// analytics. /track is public (called from every published-site pageview,
// no session); /summary is the builder-owner-only dashboard query.

const MAX_DAYS = 90;

function dayKey(d) {
  return new Date(d).toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ── POST /api/analytics/track — one pageview from a published site ──────────────
router.post("/track", async (req, res) => {
  try {
    const { projectId, path, referrer, device, visitorId, sessionId } = req.body || {};
    if (!projectId || !visitorId || !sessionId) return res.status(400).json({ message: "Missing required fields." });

    const project = await BuilderProject.findOne({ _id: projectId, status: "ready" }).select("_id").lean();
    if (!project) return res.status(404).json({ message: "Not found" });

    await AnalyticsEvent.create({
      projectId,
      path: String(path || "/").slice(0, 500),
      referrer: String(referrer || "").slice(0, 500),
      device: ["mobile", "tablet", "desktop"].includes(device) ? device : "desktop",
      visitorId: String(visitorId).slice(0, 100),
      sessionId: String(sessionId).slice(0, 100),
    });
    res.status(201).json({ message: "Tracked" });
  } catch (err) {
    // Tracking must never be visible to a real visitor as an error.
    res.status(200).json({ message: "Skipped" });
  }
});

// ── GET /api/analytics/summary?projectId=X&days=30 — the builder dashboard ──────
router.get("/summary", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId) return res.status(400).json({ message: "projectId is required." });
    const owned = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
    if (!owned) return res.status(404).json({ message: "Project not found" });

    const days = Math.min(MAX_DAYS, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { projectId: owned._id, createdAt: { $gte: since } };

    const [
      totalPageviews,
      visitorAgg,
      sessionAgg,
      topPages,
      topReferrers,
      deviceAgg,
      dailyAgg,
      formSubmissions,
      orderAgg,
    ] = await Promise.all([
      AnalyticsEvent.countDocuments(match),
      AnalyticsEvent.distinct("visitorId", match),
      AnalyticsEvent.distinct("sessionId", match),
      AnalyticsEvent.aggregate([{ $match: match }, { $group: { _id: "$path", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AnalyticsEvent.aggregate([{ $match: { ...match, referrer: { $ne: "" } } }, { $group: { _id: "$referrer", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      AnalyticsEvent.aggregate([{ $match: match }, { $group: { _id: "$device", count: { $sum: 1 } } }]),
      AnalyticsEvent.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      FormSubmission.countDocuments({ projectId: owned._id, createdAt: { $gte: since } }),
      Order.aggregate([
        { $match: { projectId: owned._id, createdAt: { $gte: since } } },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "refunded"]] }, 0, "$total"] } },
        } },
      ]),
    ]);

    res.json({
      days,
      totalPageviews,
      uniqueVisitors: visitorAgg.length,
      uniqueSessions: sessionAgg.length,
      topPages: topPages.map((p) => ({ path: p._id, count: p.count })),
      topReferrers: topReferrers.map((r) => ({ referrer: r._id, count: r.count })),
      deviceBreakdown: deviceAgg.map((d) => ({ device: d._id, count: d.count })),
      dailyPageviews: dailyAgg.map((d) => ({ date: d._id, count: d.count })),
      formSubmissions,
      orders: { count: orderAgg[0]?.count ?? 0, revenue: orderAgg[0]?.revenue ?? 0 },
    });
  } catch (err) {
    console.error("analytics summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
