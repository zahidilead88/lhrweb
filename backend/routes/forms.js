const express = require("express");
const router  = express.Router();

const { auth }          = require("../middleware/auth");
const BuilderProject    = require("../models/BuilderProject");
const User               = require("../models/User");
const FormSubmission     = require("../models/FormSubmission");
const { sendFormSubmissionEmail } = require("../lib/email");
const { resolveProject } = require("../lib/projectAccess");

// Phase 7 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §13) — form submissions.
// The submit route is public (called from the published site, no session),
// the list/delete routes are the builder-owner-only inbox.

function sanitizeData(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (count >= 40) break; // a form with more than 40 fields is almost certainly abuse, not a real form
    const k = String(key).slice(0, 100);
    const v = String(value ?? "").slice(0, 5000);
    if (!k) continue;
    out[k] = v;
    count++;
  }
  return out;
}

// ── POST /api/forms/public/:projectId — a published site's own form submits here ──
router.post("/public/:projectId", async (req, res) => {
  try {
    const project = await BuilderProject.findOne({ _id: req.params.projectId, status: "ready" }).select("businessName userId").lean();
    if (!project) return res.status(404).json({ message: "Not found" });

    const data = sanitizeData(req.body?.data);
    if (Object.keys(data).length === 0) return res.status(400).json({ message: "Empty submission." });

    const submission = await FormSubmission.create({
      projectId: project._id,
      pageId: String(req.body?.pageId || "").slice(0, 200),
      formId: String(req.body?.formId || "").slice(0, 200),
      data,
    });

    // Best-effort — a failed notification email must never fail the submission itself.
    User.findById(project.userId).select("email").lean()
      .then((owner) => {
        if (owner?.email) {
          return sendFormSubmissionEmail(owner.email, { businessName: project.businessName, formId: submission.formId, data });
        }
      })
      .catch((err) => console.error("form notification email failed:", err.message));

    res.status(201).json({ message: "Submitted" });
  } catch (err) {
    console.error("form submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/forms?projectId=X — the builder's own submissions inbox ────────────
router.get("/", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId) return res.status(400).json({ message: "projectId is required." });
    const owned = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
    if (!owned) return res.status(404).json({ message: "Project not found" });

    const submissions = await FormSubmission.find({ projectId }).sort({ createdAt: -1 }).lean();
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PATCH /api/forms/:id/read?projectId=X ────────────────────────────────────────
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const owned = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
    if (!owned) return res.status(404).json({ message: "Project not found" });

    const submission = await FormSubmission.findOneAndUpdate(
      { _id: req.params.id, projectId },
      { read: req.body?.read !== false },
      { new: true }
    );
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/forms/:id?projectId=X ────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    const projectId = req.query.projectId;
    const owned = await resolveProject(req.user.userId, projectId, { select: "_id", lean: true });
    if (!owned) return res.status(404).json({ message: "Project not found" });

    const deleted = await FormSubmission.findOneAndDelete({ _id: req.params.id, projectId });
    if (!deleted) return res.status(404).json({ message: "Submission not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
