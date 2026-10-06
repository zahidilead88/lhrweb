const express = require("express");
const router  = express.Router();

const { auth }       = require("../middleware/auth");
const Agency         = require("../models/Agency");
const User           = require("../models/User");
const BuilderProject = require("../models/BuilderProject");

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
// tenancy management. Owner and team share equal access to every
// agency-tagged project (see backend/lib/projectAccess.js), but membership
// changes (invite/remove) and white-label branding are owner-only — a
// smaller, more sensitive surface than day-to-day project work, and one
// that's fully contained in this one file rather than spread across the six
// route files project access itself touches.

async function requireAgencyOwner(req, res, next) {
  const user = await User.findById(req.user.userId).select("agencyId agencyRole").lean();
  if (!user?.agencyId || user.agencyRole !== "owner") {
    return res.status(403).json({ message: "Only the agency owner can do this." });
  }
  req.agencyId = user.agencyId;
  next();
}

async function requireAgencyMember(req, res, next) {
  const user = await User.findById(req.user.userId).select("agencyId agencyRole").lean();
  if (!user?.agencyId || (user.agencyRole !== "owner" && user.agencyRole !== "team")) {
    return res.status(403).json({ message: "You're not part of an agency." });
  }
  req.agencyId = user.agencyId;
  req.agencyRole = user.agencyRole;
  next();
}

// ── POST /api/agency — create an agency (requester becomes its owner) ───────────
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Agency name is required." });

    const user = await User.findById(req.user.userId);
    if (user.agencyId) return res.status(400).json({ message: "You already belong to an agency." });

    const agency = await Agency.create({ ownerId: user._id, name: name.trim().slice(0, 120) });
    user.agencyId = agency._id;
    user.agencyRole = "owner";
    await user.save();

    res.status(201).json(agency);
  } catch (err) {
    console.error("agency create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/agency — the requester's agency, with its member lists ─────────────
router.get("/", auth, requireAgencyMember, async (req, res) => {
  try {
    const [agency, members] = await Promise.all([
      Agency.findById(req.agencyId).lean(),
      User.find({ agencyId: req.agencyId }).select("name email agencyRole").lean(),
    ]);
    if (!agency) return res.status(404).json({ message: "Agency not found" });

    res.json({
      agency,
      role: req.agencyRole,
      team: members.filter((m) => m.agencyRole === "owner" || m.agencyRole === "team"),
      clients: members.filter((m) => m.agencyRole === "client"),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/agency/white-label — branding settings (owner only) ────────────────
router.put("/white-label", auth, requireAgencyOwner, async (req, res) => {
  try {
    const { logoUrl, primaryColor, supportEmail } = req.body || {};
    const agency = await Agency.findByIdAndUpdate(
      req.agencyId,
      {
        $set: {
          "whiteLabel.logoUrl":      String(logoUrl || "").slice(0, 1000),
          "whiteLabel.primaryColor": /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(primaryColor || "") ? primaryColor : "#6344d4",
          "whiteLabel.supportEmail": String(supportEmail || "").slice(0, 200),
        },
      },
      { new: true }
    ).lean();
    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/agency/invite — add an existing account as team or client (owner only) ──
// No email-invite pipeline here (that's its own real feature) — this attaches
// an existing registered account directly, the way an admin action would.
router.post("/invite", auth, requireAgencyOwner, async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!["team", "client"].includes(role)) return res.status(400).json({ message: "role must be 'team' or 'client'." });
    if (!email?.trim()) return res.status(400).json({ message: "email is required." });

    const target = await User.findOne({ email: email.trim().toLowerCase() });
    if (!target) return res.status(404).json({ message: "No account with that email exists yet — ask them to register first, then invite them." });
    if (target.agencyId) {
      return res.status(400).json({ message: String(target.agencyId) === String(req.agencyId) ? "Already a member of this agency." : "That account already belongs to a different agency." });
    }

    target.agencyId = req.agencyId;
    target.agencyRole = role;
    await target.save();

    res.status(201).json({ _id: target._id, name: target.name, email: target.email, agencyRole: target.agencyRole });
  } catch (err) {
    console.error("agency invite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/agency/members/:userId — remove a team/client member (owner only) ──
router.delete("/members/:userId", auth, requireAgencyOwner, async (req, res) => {
  try {
    if (String(req.params.userId) === String(req.user.userId)) {
      return res.status(400).json({ message: "The owner can't remove themself." });
    }
    const target = await User.findOne({ _id: req.params.userId, agencyId: req.agencyId });
    if (!target) return res.status(404).json({ message: "Member not found in your agency." });

    // A departing client's own project(s) lose the agency's access too — the
    // client keeps the project itself (still `userId`-owned by them), it's
    // just no longer agency-managed. A departing team member's own access
    // to *other* members' projects is revoked by clearing their agencyId
    // below; any project they personally created stays agency-tagged (a
    // known, disclosed limitation — reassigning it to a remaining team
    // member isn't built).
    if (target.agencyRole === "client") {
      await BuilderProject.updateMany({ userId: target._id, agencyId: req.agencyId }, { $set: { agencyId: null } });
    }

    target.agencyId = null;
    target.agencyRole = null;
    await target.save();

    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/agency/projects/:projectId/assign — hand a project to a client ─────
// Owner/team only. Reassigns direct ownership (BuilderProject.userId) to a
// client of the same agency, or back to the agency owner to "unassign."
router.put("/projects/:projectId/assign", auth, requireAgencyMember, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required." });

    const project = await BuilderProject.findOne({ _id: req.params.projectId, agencyId: req.agencyId });
    if (!project) return res.status(404).json({ message: "Project not found in your agency." });

    const target = await User.findOne({ _id: userId, agencyId: req.agencyId }).select("_id agencyRole").lean();
    if (!target) return res.status(400).json({ message: "That account isn't a member of your agency." });

    project.userId = target._id;
    await project.save();
    res.json({ _id: project._id, userId: project.userId });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
