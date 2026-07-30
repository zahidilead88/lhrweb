const mongoose = require("mongoose");

// Round 5 doc, Part 6 — server-side cart. The client only ever holds a cartToken
// (localStorage `lhrweb_cart_token_{projectId}`); prices are snapshotted here at
// add-time so a later price change never silently alters an existing cart.

const cartItemSchema = new mongoose.Schema(
  {
    productId:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId:     { type: String },
    quantity:      { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    cartToken: { type: String, required: true, unique: true }, // opaque UUID, no auth required
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "BuilderProject", required: true, index: true },
    items:     { type: [cartItemSchema], default: [] },
    couponCode:{ type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — Mongo reaps expired carts
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
