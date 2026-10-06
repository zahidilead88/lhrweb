const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: { type: String, enum: ["admin", "user", "builder"], default: "user" },
    permissions: {
      type: [String],
      enum: ["pages", "sections", "blog", "projects", "menu"],
      default: [],
    },
    package:               { type: String, enum: ["starter", "pro"] },
    // Ch 7 — AI quota (lazy monthly reset, units weighted per operation)
    aiUsage: {
      period:    { type: String },   // "2026-07"
      unitsUsed: { type: Number, default: 0 },
    },
    stripeCustomerId:      { type: String },
    passwordResetToken:    { type: String },
    passwordResetExpires:  { type: Date },
    // Phase 8 (docs/LHRWEB_MASTER_IMPLEMENTATION_PLAN.md §14) — agency/white-label
    // tenancy. Null agencyId = an independent account, unaffected by any of this.
    agencyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Agency", default: null },
    agencyRole: { type: String, enum: ["owner", "team", "client", null], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
