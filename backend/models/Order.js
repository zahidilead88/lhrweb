const mongoose = require("mongoose");

// Round 5 doc, Part 6 — orders are created ONLY by the Stripe webhook handler
// (not built yet — deliberately deferred, see routes/commerce.js header comment).
// The client never creates or mutates an Order directly.

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String },
    name:      { type: String, required: true },   // snapshotted — survives product edits/deletes
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true },
    image:     { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    projectId:   { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    orderNumber: { type: String, required: true }, // per-project sequential, assigned at creation

    customer: {
      name:  { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },

    items:    { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total:    { type: Number, required: true },
    couponCode: { type: String },

    shippingAddress: {
      line1: String, city: String, state: String, zip: String, country: String,
    },

    // pending → processing → shipped → delivered  (forward-only)
    // cancelled / refunded reachable from pending/processing only
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    trackingNumber: { type: String },
    hasOversell:    { type: Boolean, default: false }, // flagged, never silently allowed

    stripePaymentIntentId: { type: String, unique: true, sparse: true }, // idempotency key
  },
  { timestamps: true }
);

orderSchema.index({ projectId: 1, orderNumber: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);
