const BuilderProject = require("../models/BuilderProject");
const User = require("../models/User");

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
// data isolation. A project is accessible to whoever directly owns it
// (BuilderProject.userId), OR to any "owner"/"team" member of the agency the
// project is tagged with (BuilderProject.agencyId). A client account is NOT
// given a second access path here — a client's own project has `userId` set
// to their own account, so it already works exactly like any independent
// user's project always has, with zero special-casing needed for that case.
//
// The requester's own agency membership is looked up fresh on every call
// (never trusted from a JWT claim), so removing someone from an agency
// revokes their access immediately — not just after their existing token
// happens to expire.

async function getAgencyMembership(userId) {
  const u = await User.findById(userId).select("agencyId agencyRole").lean();
  return { agencyId: u?.agencyId ?? null, agencyRole: u?.agencyRole ?? null };
}

function buildQuery(filter, opts) {
  let q = BuilderProject.findOne(filter);
  if (opts.select) q = q.select(opts.select);
  if (opts.lean) q = q.lean();
  return q;
}

/**
 * Resolves the one project a request is allowed to operate on.
 *
 * - `projectId` given, `opts.isAdmin`: matches by _id alone (platform admin — unchanged legacy behavior).
 * - `projectId` given, not admin: direct-owner match first, then (only if the
 *   requester is an agency owner/team member) a same-agency match.
 * - `projectId` omitted: the requester's own most-recently-updated project —
 *   unchanged legacy behavior, no agency fallback (a "my most recent
 *   project" convenience lookup is inherently a single-owner concept).
 */
async function resolveProject(userId, projectId, opts = {}) {
  if (!projectId) {
    return buildQuery({ userId }, opts).sort({ updatedAt: -1 });
  }
  if (opts.isAdmin) {
    return buildQuery({ _id: projectId }, opts);
  }

  const direct = await buildQuery({ _id: projectId, userId }, opts);
  if (direct) return direct;

  const { agencyId, agencyRole } = await getAgencyMembership(userId);
  if (agencyId && (agencyRole === "owner" || agencyRole === "team")) {
    return buildQuery({ _id: projectId, agencyId }, opts);
  }
  return null;
}

/**
 * All projects a user can see in a project list: their own, plus — if
 * they're an agency owner/team member — every project tagged with that
 * agency (so a team member can actually discover a client's project to
 * open it, not just access one they already know the id of).
 */
async function listAccessibleProjects(userId, opts = {}) {
  const { agencyId, agencyRole } = await getAgencyMembership(userId);
  const filter = agencyId && (agencyRole === "owner" || agencyRole === "team")
    ? { $or: [{ userId }, { agencyId }] }
    : { userId };

  let q = BuilderProject.find(filter).sort({ updatedAt: -1 });
  if (opts.select) q = q.select(opts.select);
  if (opts.lean) q = q.lean();
  return q;
}

module.exports = { resolveProject, listAccessibleProjects, getAgencyMembership };
