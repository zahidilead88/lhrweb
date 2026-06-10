const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId:                 { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    stripeCustomerId:       { type: String },
    stripeSubscriptionId:   { type: String },
    plan:                   { type: String, enum: ["starter", "pro"], required: true },
    status:                 { type: String, enum: ["active", "cancelled", "past_due", "trialing", "incomplete"], default: "incomplete" },
    currentPeriodStart:     { type: Date },
    currentPeriodEnd:       { type: Date },
    cancelAtPeriodEnd:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
