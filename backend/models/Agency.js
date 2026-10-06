const mongoose = require("mongoose");

// Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
// multi-tenancy. An Agency is the tenant: one owner account, any number of
// team members (full access to every agency-tagged project) and client
// accounts (access to only their own project(s), exactly like an
// independent user — see backend/lib/projectAccess.js for how that access
// check actually works). Team and owner are treated as equally privileged
// over agency projects in this bounded scope — no finer-grained permission
// tiers between them yet.
const agencySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name:    { type: String, required: true, trim: true, maxlength: 120 },
    whiteLabel: {
      logoUrl:      { type: String, default: "" },
      primaryColor: { type: String, default: "#6344d4" },
      supportEmail: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agency", agencySchema);
