const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema({
  stripeEventId: { type: String, required: true, unique: true },
  type:          { type: String },
  processedAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
